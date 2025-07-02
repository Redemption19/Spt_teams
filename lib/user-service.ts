import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { sendPasswordResetEmail, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import { User } from './types';
import { BranchService } from './branch-service';
import { ActivityService } from './activity-service';

// User management service functions
export class UserService {
  
  /**
   * Check if any owner exists in the workspace
   * This determines if a new registration should be made owner
   */
  static async hasOwner(workspaceId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'users'),
        where('workspaceId', '==', workspaceId),
        where('role', '==', 'owner'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error: any) {
      console.error('Error checking for owner:', error);
      return true; // Assume owner exists to be safe
    }
  }

  /**
   * Securely determine the role for a new user
   */
  static async determineUserRole(
    workspaceId: string, 
    inviteToken?: string,
    preAssignedRole?: 'owner' | 'admin' | 'member'
  ): Promise<'owner' | 'admin' | 'member'> {
    
    // console.log(`DEBUG: determineUserRole called with workspaceId: ${workspaceId}, inviteToken: ${inviteToken}, preAssignedRole: ${preAssignedRole}`);
    
    // If a role was explicitly assigned (by admin or invitation), use that
    if (preAssignedRole) {
      // console.log(`Using preAssignedRole: ${preAssignedRole}`);
      return preAssignedRole;
    }
    
    // If user was invited with a token, get role from invitation
    if (inviteToken) {
      // In real app, verify the invite token and get the role from invitation record
      // For now, default to member for invitations without explicit role
      // console.log('User has inviteToken, defaulting to member role');
      return 'member';
    }
    
    // For open registration, check if this should be the first owner
    const hasExistingOwner = await this.hasOwner(workspaceId);
    
    if (!hasExistingOwner) {
      // This is the first user, make them owner
      // console.log('No existing owner found, making user owner');
      return 'owner';
    }
    
    // Default to member role for all other registrations
    // Admins should only be promoted by existing owners/admins
    // console.log('Using default member role');
    return 'member';
  }

  /**
   * Create a new user with proper role assignment
   */
  static async createUserSecurely(userData: {
    id?: string;
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    jobTitle?: string;
    department?: string;
    workspaceId: string;
    branchId?: string;
    regionId?: string;
    inviteToken?: string;
    preAssignedRole?: 'owner' | 'admin' | 'member';
    password?: string; // Optional password for direct creation
  }): Promise<User> {
    
    // Securely determine the role
    const role = await this.determineUserRole(
      userData.workspaceId,
      userData.inviteToken,
      userData.preAssignedRole
    );

    let userId = userData.id && userData.id.trim() !== '' ? userData.id : '';

    // Generate user ID first
    userId = userData.id && userData.id.trim() !== '' ? userData.id : doc(collection(db, 'users')).id;
    
    // Create Firestore user document first (while admin is still authenticated)
    const user: User = {
      id: userId,
      email: userData.email,
      name: userData.name,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: role,
      status: 'active',
      jobTitle: userData.jobTitle,
      department: userData.department,
      workspaceId: userData.workspaceId,
      teamIds: [],
      branchId: userData.branchId,
      regionId: userData.regionId,
      createdAt: new Date(),
      lastActive: new Date(),
      // Password management flags
      requiresPasswordChange: !!userData.password, // True if admin set password
      firstLogin: true, // Always true for new users
    };

    // Filter out undefined values to prevent Firestore errors
    const cleanUserData = Object.fromEntries(
      Object.entries(user).filter(([_, value]) => value !== undefined)
    );

    // Save user document to Firestore first
    await setDoc(doc(db, 'users', userId), cleanUserData);
    console.log('Created user document in Firestore:', userId);

    // CRITICAL: Create UserWorkspace relationship BEFORE Firebase Auth user creation
    // This ensures the admin is still authenticated when creating the relationship
    try {
      console.log(`Creating UserWorkspace relationship for user ${userId} in workspace ${userData.workspaceId} with role ${role}`);
      // console.log(`DEBUG: Role determined: ${role}, preAssignedRole was: ${userData.preAssignedRole}`);
      
      // Get current user (the creator) for proper permission handling
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Current user not authenticated');
      }

      // Import WorkspaceService here to avoid circular dependency
      const { WorkspaceService } = await import('./workspace-service');
      
      // Use WorkspaceService.addUserToWorkspace which handles owner permissions properly
      await WorkspaceService.addUserToWorkspace(
        userId,
        userData.workspaceId,
        role,
        currentUser.uid
      );
      
      console.log(`Successfully created UserWorkspace relationship for user ${userId} with role ${role}`);
    } catch (error: any) {
      console.error('Error creating UserWorkspace relationship:', error);
      
      // Provide more helpful error messages
      if (error.message?.includes('insufficient permissions')) {
        throw new Error(`Permission denied: Unable to create user in this workspace. You may need to switch to the main workspace or ensure you have proper admin permissions.`);
      } else if (error.message?.includes('Missing or insufficient permissions')) {
        throw new Error(`Firestore permissions error: Please ensure you're properly authenticated and have workspace admin privileges.`);
      }
      
      // This is critical - without this, user won't have workspace access
      throw new Error(`Failed to create workspace relationship: ${error.message}`);
    }

    // Create Firebase Auth user if password provided
    if (userData.password) {
      try {
        console.log('Creating Firebase Auth user via REST API...');
        const firebaseAuthResult = await this.createFirebaseAuthUser(userData.email, userData.password, userId);
        console.log('Firebase Auth user created successfully');
        
        // If the Firebase Auth UID is different from our generated userId, we need to handle this
        if (firebaseAuthResult.uid !== userId) {
          console.log(`Firebase Auth generated different UID: ${firebaseAuthResult.uid}, our ID: ${userId}`);
          // console.log(`DEBUG: About to update UserWorkspace with role: ${role}`);
          
          // Update the Firestore document to use the Firebase Auth UID
          await deleteDoc(doc(db, 'users', userId));
          const updatedUser = { ...user, id: firebaseAuthResult.uid };
          const cleanUpdatedUser = Object.fromEntries(
            Object.entries(updatedUser).filter(([_, value]) => value !== undefined)
          );
          await setDoc(doc(db, 'users', firebaseAuthResult.uid), cleanUpdatedUser);
          
          // Update UserWorkspace relationship
          try {
            const { WorkspaceService } = await import('./workspace-service');
            await deleteDoc(doc(db, 'userWorkspaces', `${userId}_${userData.workspaceId}`));
            await WorkspaceService.addUserToWorkspace(
              firebaseAuthResult.uid,
              userData.workspaceId,
              role,
              auth.currentUser?.uid || 'system'
            );
            console.log(`Updated UserWorkspace relationship with Firebase Auth UID and role: ${role}`);
          } catch (error) {
            console.warn('Warning: Could not update UserWorkspace with Firebase Auth UID:', error);
          }
          
          // Update userId for the rest of the function
          userId = firebaseAuthResult.uid;
          user.id = firebaseAuthResult.uid;
        }
        
      } catch (error: any) {
        console.error('Error creating Firebase Auth user:', error);
        console.log('User document exists in Firestore, but login will fail without Firebase Auth account');
        // Don't throw error - user creation in Firestore was successful
        // We'll inform the admin about the issue
      }
    }
    
    // Log activity
    try {
      await ActivityService.logActivity(
        'user_created',
        'user',
        userId,
        { 
          targetName: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          jobTitle: user.jobTitle,
          hasPassword: !!userData.password
        },
        user.workspaceId,
        userId
      );
    } catch (error) {
      console.warn('Warning: Could not log user creation activity:', error);
    }
    
    // If user has a branchId, try to update the branch's userIds array
    // but don't fail the entire user creation if branch assignment fails
    if (user.branchId) {
      try {
        await BranchService.assignUserToBranch(userId, user.branchId);
      } catch (error) {
        console.warn('Warning: Could not assign user to branch:', error);
        // Don't throw the error - user creation was successful
        // Branch assignment can be fixed later by an admin
      }
    }
    
    // Note: Invitation acceptance is handled by the invitation page after user authentication
    return user;
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }
  static async createUser(userData: Omit<User, 'id'>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userData.email);
      
      // Filter out undefined values to prevent Firestore errors
      const cleanUserData = Object.fromEntries(
        Object.entries(userData).filter(([_, value]) => value !== undefined)
      );
      
      await setDoc(userRef, {
        ...cleanUserData,
        createdAt: new Date(),
        lastActive: new Date(),
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUser(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', email);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }  static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      // Get current user data to check for branchId changes
      const currentUser = await this.getUserById(userId);
      if (!currentUser) {
        throw new Error('User not found');
      }
      
      const userRef = doc(db, 'users', userId);
      
      // Filter out undefined values to prevent Firestore errors
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      await updateDoc(userRef, {
        ...cleanUpdates,
        updatedAt: new Date(),
      });
      
      // Log activity
      try {
        await ActivityService.logActivity(
          'user_updated',
          'user',
          userId,
          { 
            targetName: currentUser.name,
            email: currentUser.email,
            updatedFields: Object.keys(cleanUpdates),
            changes: cleanUpdates
          },
          currentUser.workspaceId,
          auth.currentUser?.uid
        );
      } catch (error) {
        console.warn('Warning: Could not log user update activity:', error);
      }
      
      // Handle branch assignment changes
      if ('branchId' in updates) {
        const oldBranchId = currentUser.branchId || null;
        const newBranchId = updates.branchId || null;
        
        if (oldBranchId !== newBranchId) {
          // Remove from old branch
          if (oldBranchId) {
            await BranchService.removeUserFromBranch(userId, oldBranchId);
          }
          // Add to new branch
          if (newBranchId) {
            await BranchService.assignUserToBranch(userId, newBranchId);
          }
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }  static async getUsersByWorkspace(workspaceId: string): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      
      // For development: remove orderBy to avoid index requirement
      // In production, add the composite index and use the commented query below
      let q = query(
        usersRef, 
        where('workspaceId', '==', workspaceId)
      );
      
      let querySnapshot = await getDocs(q);
      
      // If no users found with actual workspace ID, try hardcoded fallbacks
      // This is a temporary fix for development
      if (querySnapshot.empty) {
        console.log('No users found with workspace ID:', workspaceId);
        console.log('Trying fallback workspace IDs...');
        
        const fallbackIds = ['default-workspace', 'current-workspace'];
        for (const fallbackId of fallbackIds) {
          q = query(usersRef, where('workspaceId', '==', fallbackId));
          querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            console.log('Found users with fallback ID:', fallbackId);
            break;
          }
        }
      }
      
      // Production query (requires composite index):
      // const q = query(
      //   usersRef, 
      //   where('workspaceId', '==', workspaceId),
      //   orderBy('createdAt', 'desc')
      // );
      
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      console.log(`UserService: Found ${users.length} users for workspace ${workspaceId}`);
      
      // Sort in memory for development
      return users.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error fetching workspace users:', error);
      throw error;
    }
  }

  /**
   * Get ALL users in the system (for owners in main workspace)
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt || new Date(),
        lastActive: doc.data().lastActive?.toDate?.() || doc.data().lastActive || new Date(),
      })) as User[];
      
      console.log(`UserService: Found ${users.length} users across all workspaces`);
      
      // Sort by creation date (newest first)
      return users.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  /**
   * Update user role (only by admins/owners)
   */
  static async updateUserRole(
    userId: string, 
    newRole: 'owner' | 'admin' | 'member',
    updatedBy: string
  ): Promise<void> {
    
    // In real app, verify that updatedBy has permission to change roles
    const updater = await this.getUserById(updatedBy);
    if (!updater || (updater.role !== 'owner' && updater.role !== 'admin')) {
      throw new Error('Insufficient permissions to update user role');
    }

    // Prevent removing the last owner
    if (newRole !== 'owner') {
      const user = await this.getUserById(userId);
      if (user?.role === 'owner') {
        const hasOtherOwners = await this.hasOtherOwners(user.workspaceId, userId);
        if (!hasOtherOwners) {
          throw new Error('Cannot remove the last owner from the workspace');
        }
      }
    }

    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: new Date()
    });
    
    // Log activity
    try {
      const user = await this.getUserById(userId);
      await ActivityService.logActivity(
        'user_updated',
        'user',
        userId,
        { 
          targetName: user?.name || 'Unknown User',
          email: user?.email,
          action: 'role_change',
          oldRole: user?.role,
          newRole: newRole
        },
        user?.workspaceId || '',
        updatedBy
      );
    } catch (error) {
      console.warn('Warning: Could not log role update activity:', error);
    }
  }

  /**
   * Check if there are other owners in the workspace
   */
  static async hasOtherOwners(workspaceId: string, excludeUserId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'users'),
        where('workspaceId', '==', workspaceId),
        where('role', '==', 'owner')
      );
      
      const snapshot = await getDocs(q);
      const otherOwners = snapshot.docs.filter(doc => doc.id !== excludeUserId);
      return otherOwners.length > 0;
    } catch (error) {
      console.error('Error checking for other owners:', error);
      return false;
    }
  }

  static async deactivateUser(userId: string): Promise<void> {
    try {
      await this.updateUser(userId, { 
        status: 'inactive',
        lastActive: new Date() 
      });
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      // Get user data before deletion for logging
      const user = await this.getUserById(userId);
      
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      
      // Log activity
      try {
        if (user) {
          await ActivityService.logActivity(
            'user_deleted',
            'user',
            userId,
            { 
              targetName: user.name,
              email: user.email,
              role: user.role,
              department: user.department
            },
            user.workspaceId,
            auth.currentUser?.uid
          );
        }
      } catch (error) {
        console.warn('Warning: Could not log user deletion activity:', error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Send password reset email to user
   */
  static async sendPasswordReset(email: string, redirectUrl?: string): Promise<void> {
    try {
      const actionCodeSettings = {
        url: redirectUrl || window.location.origin + '/reset-password/confirm',
        handleCodeInApp: false,
      };
      
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Create Firebase Auth user using REST API (doesn't affect current auth state)
   * This allows admins to create users with passwords without being signed out
   */
  private static async createFirebaseAuthUser(email: string, password: string, userId: string): Promise<{uid: string, email: string}> {
    // Get Firebase Web API Key from config
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      throw new Error('Firebase API key not found');
    }

    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        returnSecureToken: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create Firebase Auth user: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Firebase Auth user created via REST API:', result.localId);

    return {
      uid: result.localId,
      email: result.email
    };
  }
}

// Invitation management
export interface Invitation {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  workspaceId: string;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  teamIds?: string[];
  branchId?: string;
  message?: string;
}

export class InvitationService {
  static async createInvitation(invitationData: Omit<Invitation, 'id' | 'invitedAt' | 'status'>): Promise<string> {
    try {
      const invitationRef = doc(collection(db, 'invitations'));
      const invitation: Invitation = {
        ...invitationData,
        id: invitationRef.id,
        invitedAt: new Date(),
        status: 'pending',
      };
      
      await setDoc(invitationRef, invitation);
      return invitationRef.id;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  static async getInvitation(invitationId: string): Promise<Invitation | null> {
    try {
      const invitationRef = doc(db, 'invitations', invitationId);
      const invitationSnap = await getDoc(invitationRef);
      
      if (invitationSnap.exists()) {
        return { id: invitationSnap.id, ...invitationSnap.data() } as Invitation;
      }
      return null;
    } catch (error) {
      console.error('Error fetching invitation:', error);
      throw error;
    }
  }

  static async getPendingInvitations(workspaceId: string): Promise<Invitation[]> {
    try {
      const invitationsRef = collection(db, 'invitations');
      const q = query(
        invitationsRef,
        where('workspaceId', '==', workspaceId),
        where('status', '==', 'pending'),
        orderBy('invitedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invitation[];
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
    }
  }

  static async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      const invitationRef = doc(db, 'invitations', invitationId);
      await updateDoc(invitationRef, {
        status: 'accepted',
        acceptedBy: userId,
        acceptedAt: new Date(),
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  static async revokeInvitation(invitationId: string): Promise<void> {
    try {
      const invitationRef = doc(db, 'invitations', invitationId);
      await updateDoc(invitationRef, {
        status: 'revoked',
        revokedAt: new Date(),
      });
    } catch (error) {
      console.error('Error revoking invitation:', error);
      throw error;
    }
  }

  /**
   * Mark invitation as used
   */
  static async markInvitationAsUsed(token: string): Promise<void> {
    await updateDoc(doc(db, 'invitations', token), {
      status: 'accepted',
      acceptedAt: new Date()
    });
  }

  /**
   * Generate secure invitation token
   */
  static generateInviteToken(): string {
    return Math.random().toString(36).substring(2) + 
           Date.now().toString(36) + 
           Math.random().toString(36).substring(2);
  }

  /**
   * Validate invitation token
   */
  static async validateInvitationToken(token: string): Promise<any | null> {
    try {
      const inviteDoc = await getDoc(doc(db, 'invitations', token));
      
      if (!inviteDoc.exists()) {
        return null;
      }

      const invitation = inviteDoc.data();
      
      // Check if invitation is still valid
      if (invitation.status !== 'pending') {
        return null;
      }

      if (new Date() > invitation.expiresAt.toDate()) {
        return null;
      }

      return invitation;
    } catch (error) {
      console.error('Error validating invitation:', error);
      return null;
    }
  }

  /**
   * Create a secure invitation
   */
  static async createSecureInvitation(invitation: {
    email: string;
    role: 'admin' | 'member'; // Note: owners should not be invited, only promoted
    workspaceId: string;
    invitedBy: string;
    teamIds?: string[];
    branchId?: string;
    message?: string;
  }): Promise<string> {
    
    const inviteToken = this.generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitationData = {
      ...invitation,
      token: inviteToken,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: expiresAt
    };

    await setDoc(doc(db, 'invitations', inviteToken), invitationData);
    
    // In real app, send email with invitation link
    // await this.sendInvitationEmail(invitation.email, inviteToken);

    return inviteToken;
  }
}
