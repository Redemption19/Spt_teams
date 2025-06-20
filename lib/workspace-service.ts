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
import { db } from './firebase';
import { Workspace, UserWorkspace } from './types';
import { cleanFirestoreData, createDocumentData, createUpdateData, sortByDateDesc, toDate } from './firestore-utils';

export class WorkspaceService {  /**
   * Create a new workspace
   */
  static async createWorkspace(
    workspaceData: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<string> {
    try {
      const workspaceRef = doc(collection(db, 'workspaces'));
      const workspaceId = workspaceRef.id;
      
      // Clean the data to remove undefined values
      const cleanData = cleanFirestoreData(workspaceData);
      
      // Create workspace document
      const workspace: Workspace = {
        ...cleanData,
        id: workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Workspace;

      // Create workspace
      await setDoc(workspaceRef, workspace);

      // Add creator as owner
      const userWorkspaceRef = doc(db, 'userWorkspaces', `${userId}_${workspaceId}`);
      const userWorkspace: UserWorkspace = {
        id: `${userId}_${workspaceId}`,
        userId,
        workspaceId,
        role: 'owner',
        joinedAt: new Date(),
      };
      
      await setDoc(userWorkspaceRef, userWorkspace);
      
      // IMPORTANT: Update the user's role to 'owner' in their user document
      await updateDoc(doc(db, 'users', userId), {
        role: 'owner',
        workspaceId: workspaceId, // Update their primary workspace
        updatedAt: new Date()
      });
      
      return workspaceId;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }
  /**
   * Get workspace by ID
   */
  static async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    try {
      const workspaceRef = doc(db, 'workspaces', workspaceId);
      const workspaceSnap = await getDoc(workspaceRef);
      
      if (workspaceSnap.exists()) {
        const data = workspaceSnap.data();
        // Convert Firestore timestamps to Date objects
        return { 
          id: workspaceSnap.id, 
          ...data,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as Workspace;
      }
      return null;
    } catch (error) {
      console.error('Error fetching workspace:', error);
      throw error;
    }
  }
  /**
   * Get all workspaces for a user
   */
  static async getUserWorkspaces(userId: string): Promise<{workspace: Workspace, role: string}[]> {
    try {
      const userWorkspacesRef = collection(db, 'userWorkspaces');
      const q = query(
        userWorkspacesRef,
        where('userId', '==', userId)
        // Note: Removed orderBy to avoid requiring a composite index
        // For production, create the composite index and uncomment:
        // orderBy('joinedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const results = [];
      
      for (const docSnap of querySnapshot.docs) {
        const userWorkspace = docSnap.data() as UserWorkspace;
        const workspace = await this.getWorkspace(userWorkspace.workspaceId);
        if (workspace) {
          results.push({
            workspace,
            role: userWorkspace.role,
            joinedAt: userWorkspace.joinedAt // Include for client-side sorting
          });
        }
      }      // Sort on client side to maintain order
      return sortByDateDesc(results, 'joinedAt' as any).map(({ workspace, role }) => ({ workspace, role }));
    } catch (error) {
      console.error('Error fetching user workspaces:', error);
      throw error;
    }
  }
  /**
   * Update workspace
   */
  static async updateWorkspace(
    workspaceId: string, 
    updates: Partial<Workspace>
  ): Promise<void> {
    try {
      const workspaceRef = doc(db, 'workspaces', workspaceId);
      
      // Clean and prepare update data
      const updateData = createUpdateData(cleanFirestoreData(updates));
      
      await updateDoc(workspaceRef, updateData);
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw error;
    }
  }

  /**
   * Delete workspace (only by owner)
   */
  static async deleteWorkspace(workspaceId: string): Promise<void> {
    try {
      // Delete workspace
      const workspaceRef = doc(db, 'workspaces', workspaceId);
      await deleteDoc(workspaceRef);
      
      // Note: In a production app, you'd also want to delete related data
      // like userWorkspaces, teams, etc. This could be done with Cloud Functions
      
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw error;
    }
  }

  /**
   * Get user's role in a workspace
   */
  static async getUserRole(userId: string, workspaceId: string): Promise<string | null> {
    try {
      const userWorkspaceRef = doc(db, 'userWorkspaces', `${userId}_${workspaceId}`);
      const userWorkspaceSnap = await getDoc(userWorkspaceRef);
      
      if (userWorkspaceSnap.exists()) {
        const userWorkspace = userWorkspaceSnap.data() as UserWorkspace;
        return userWorkspace.role;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      throw error;
    }
  }

  /**
   * Add user to workspace
   */  
  static async addUserToWorkspace(
    userId: string,
    workspaceId: string,
    role: 'owner' | 'admin' | 'member',
    invitedBy?: string
  ): Promise<void> {
    try {
      const userWorkspaceRef = doc(db, 'userWorkspaces', `${userId}_${workspaceId}`);
      const userWorkspace: UserWorkspace = {
        id: `${userId}_${workspaceId}`,
        userId,
        workspaceId,
        role,
        joinedAt: new Date(),
        invitedBy,
      };
      
      await setDoc(userWorkspaceRef, userWorkspace);
    } catch (error) {
      console.error('Error adding user to workspace:', error);
      throw error;
    }
  }
  
  /**
   * Update user's role in a workspace (only by owners/admins)
   */
  static async updateUserWorkspaceRole(
    userId: string, 
    workspaceId: string,
    newRole: 'owner' | 'admin' | 'member',
    updatedBy: string
  ): Promise<void> {
    try {
      // First check if the updater has permission to change roles
      const updaterRole = await this.getUserRole(updatedBy, workspaceId);
      
      if (!updaterRole || (updaterRole !== 'owner' && (updaterRole !== 'admin' || newRole === 'owner'))) {
        throw new Error('Insufficient permissions to update user role');
      }

      // When demoting from owner, check if there's at least one other owner
      if (newRole !== 'owner') {
        const currentRole = await this.getUserRole(userId, workspaceId);
        if (currentRole === 'owner') {
          const hasOtherOwners = await this.hasOtherOwners(workspaceId, userId);
          if (!hasOtherOwners) {
            throw new Error('Cannot remove the last owner from the workspace');
          }
        }
      }
      
      // Update the role in userWorkspace
      const userWorkspaceRef = doc(db, 'userWorkspaces', `${userId}_${workspaceId}`);
      await updateDoc(userWorkspaceRef, {
        role: newRole,
      });
      
      // Also update the role in the user document for convenience
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
      });
      
    } catch (error) {
      console.error('Error updating user workspace role:', error);
      throw error;
    }
  }

  /**
   * Update user role in a workspace
   */
  static async updateUserRole(workspaceId: string, userId: string, newRole: string): Promise<void> {
    try {
      const userWorkspaceRef = doc(db, 'userWorkspaces', `${userId}_${workspaceId}`);
      
      await updateDoc(userWorkspaceRef, {
        role: newRole,
        updatedAt: new Date()
      });
      
      console.log(`Updated user ${userId} role to ${newRole} in workspace ${workspaceId}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Check if there are other owners in the workspace
   */
  static async hasOtherOwners(workspaceId: string, excludeUserId: string): Promise<boolean> {
    try {
      const userWorkspacesRef = collection(db, 'userWorkspaces');
      const q = query(
        userWorkspacesRef,
        where('workspaceId', '==', workspaceId),
        where('role', '==', 'owner')
      );
      
      const snapshot = await getDocs(q);
      const otherOwners = snapshot.docs.filter(doc => !doc.id.startsWith(`${excludeUserId}_`));
      return otherOwners.length > 0;
    } catch (error) {
      console.error('Error checking for other owners:', error);
      return false;
    }
  }

  /**
   * Get users in a workspace with their roles
   */
  static async getWorkspaceUsers(workspaceId: string): Promise<{user: any, role: string, joinedAt: Date}[]> {
    try {
      const userWorkspacesRef = collection(db, 'userWorkspaces');
      const q = query(
        userWorkspacesRef,
        where('workspaceId', '==', workspaceId)
      );
      
      const querySnapshot = await getDocs(q);
      const results = [];
      
      for (const docSnap of querySnapshot.docs) {
        const userWorkspace = docSnap.data() as UserWorkspace;
        const userData = await getDoc(doc(db, 'users', userWorkspace.userId));
        
        if (userData.exists()) {
          results.push({
            user: { id: userData.id, ...userData.data() },
            role: userWorkspace.role,
            joinedAt: toDate(userWorkspace.joinedAt)
          });
        }
      }
      
      return sortByDateDesc(results, 'joinedAt');
    } catch (error) {
      console.error('Error fetching workspace users:', error);
      throw error;
    }
  }

  /**
   * Remove user from workspace
   */
  static async removeUserFromWorkspace(
    userId: string, 
    workspaceId: string,
    removedBy: string
  ): Promise<void> {
    try {
      // Check if removedBy has permission (owner or admin)
      const removerRole = await this.getUserRole(removedBy, workspaceId);
      if (!removerRole || (removerRole !== 'owner' && removerRole !== 'admin')) {
        throw new Error('Insufficient permissions to remove users');
      }

      // Cannot remove yourself if you're the only owner
      const userRole = await this.getUserRole(userId, workspaceId);
      if (userRole === 'owner') {
        const hasOtherOwners = await this.hasOtherOwners(workspaceId, userId);
        if (!hasOtherOwners) {
          throw new Error('Cannot remove the last owner from the workspace');
        }
      }
      
      // Remove from userWorkspaces
      await deleteDoc(doc(db, 'userWorkspaces', `${userId}_${workspaceId}`));
      
      // Also update user document if this is their current workspace
      const userData = await getDoc(doc(db, 'users', userId));
      if (userData.exists() && userData.data().workspaceId === workspaceId) {
        // This was their current workspace, we need to assign another one or mark them as inactive
        const otherWorkspaces = await this.getUserWorkspaces(userId);
        if (otherWorkspaces.length > 0) {
          // Assign another workspace as active
          await updateDoc(doc(db, 'users', userId), {
            workspaceId: otherWorkspaces[0].workspace.id
          });
        } else {
          // No other workspaces, mark as inactive
          await updateDoc(doc(db, 'users', userId), {
            status: 'inactive'
          });
        }
      }
    } catch (error) {
      console.error('Error removing user from workspace:', error);
      throw error;
    }
  }
}
