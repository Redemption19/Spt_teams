import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';

export class UserService {
  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          id: userDoc.id,
          lastActive: data.lastActive?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Create user securely (for admin-created users)
  static async createUserSecurely(userData: {
    id: string;
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    jobTitle?: string;
    department?: string;
    branchId?: string;
    regionId?: string;
    workspaceId?: string;
    inviteToken?: string;
    preAssignedRole?: 'owner' | 'admin' | 'member';
  }): Promise<User> {
    try {
      // Determine user role
      const role = await this.determineUserRole(userData.workspaceId || 'workspace-1', userData.preAssignedRole);
      
      const user: User = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || userData.name.split(' ')[0] || '',
        lastName: userData.lastName || userData.name.split(' ').slice(1).join(' ') || '',
        name: userData.name,
        phone: userData.phone,
        role,
        workspaceId: userData.workspaceId || 'workspace-1',
        teamIds: [],
        branchId: userData.branchId,
        regionId: userData.regionId,
        preferences: {
          theme: 'system',
          notifications: { push: true, email: true, inApp: true },
          language: 'en',
          timezone: 'UTC'
        },
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        firstLogin: true,
      };

      await setDoc(doc(db, 'users', userData.id), {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return user;
    } catch (error) {
      console.error('Error creating user securely:', error);
      throw error;
    }
  }

  // Create Google user (for self-registering users)
  static async createGoogleUser(userData: {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    workspaceId: string;
    photoURL?: string;
    isEmailVerified?: boolean;
  }): Promise<User> {
    try {
      // Determine user role
      const role = await this.determineUserRole(userData.workspaceId);
      
      const user: User = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: userData.name,
        avatar: userData.photoURL,
        role,
        workspaceId: userData.workspaceId,
        teamIds: [],
        preferences: {
          theme: 'system',
          notifications: { push: true, email: true, inApp: true },
          language: 'en',
          timezone: 'UTC'
        },
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        firstLogin: true,
      };

      await setDoc(doc(db, 'users', userData.id), {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return user;
    } catch (error) {
      console.error('Error creating Google user:', error);
      throw error;
    }
  }

  // Determine user role (first user becomes owner)
  private static async determineUserRole(workspaceId: string, preAssignedRole?: 'owner' | 'admin' | 'member'): Promise<'owner' | 'admin' | 'member'> {
    try {
      // If there's a pre-assigned role, use it
      if (preAssignedRole) {
        return preAssignedRole;
      }

      // Check if this is the first user in the workspace
      const usersQuery = query(
        collection(db, 'users'),
        where('workspaceId', '==', workspaceId)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        // First user becomes owner
        return 'owner';
      } else {
        // Check if there's already an owner
        const hasOwner = usersSnapshot.docs.some(doc => doc.data().role === 'owner');
        if (!hasOwner) {
          return 'owner';
        }
      }
      
      // Default to member for new users
      return 'member';
    } catch (error) {
      console.error('Error determining user role:', error);
      // Default to member on error
      return 'member';
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Update last active
  static async updateLastActive(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        lastActive: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating last active:', error);
    }
  }

  // Get users by workspace
  static async getUsersByWorkspace(workspaceId: string): Promise<User[]> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('workspaceId', '==', workspaceId)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const users: User[] = [];
      
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        users.push({
          ...data,
          id: doc.id,
          lastActive: data.lastActive?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as User);
      });
      
      return users;
    } catch (error) {
      console.error('Error getting users by workspace:', error);
      return [];
    }
  }

  // Check if user exists
  static async userExists(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists();
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        const doc = usersSnapshot.docs[0];
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          lastActive: data.lastActive?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as User;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }
}
