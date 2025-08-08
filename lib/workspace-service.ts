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
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Workspace, 
  UserWorkspace, 
  SubWorkspaceData,
  WorkspaceSettings,
  UserWorkspacePermissions,
  WorkspaceHierarchy 
} from './types';
import { cleanFirestoreData, createDocumentData, createUpdateData, sortByDateDesc, toDate } from './firestore-utils';

export class WorkspaceService {
  /**
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
      
      // Create workspace document with hierarchical defaults
      const workspace: Workspace = {
        ...cleanData,
        id: workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Default hierarchical fields for new workspaces
        workspaceType: 'main',
        level: 0,
        path: [workspaceId],
        settings: {
          allowSubWorkspaces: true,
          maxSubWorkspaces: 10,
          inheritUsers: true,
          inheritRoles: true,
          inheritTeams: false,
          inheritBranches: false,
          crossWorkspaceReporting: true,
          subWorkspaceNamingPattern: '{parentName} - {subName}',
          allowAdminWorkspaceCreation: false // Default to false for security
        }
      } as Workspace;

      // Create workspace
      await setDoc(workspaceRef, workspace);

      // Add creator as owner with hierarchical permissions
      const userWorkspaceRef = doc(db, 'userWorkspaces', `${userId}_${workspaceId}`);
      const userWorkspace: UserWorkspace = {
        id: `${userId}_${workspaceId}`,
        userId,
        workspaceId,
        role: 'owner',
        joinedAt: new Date(),
        scope: 'direct',
        permissions: {
          canAccessSubWorkspaces: true,
          canCreateSubWorkspaces: true,
          canManageInherited: true,
          canViewHierarchy: true,
          canSwitchWorkspaces: true,
          canInviteToSubWorkspaces: true
        },
        effectiveRole: 'owner',
        canAccessSubWorkspaces: true,
        accessibleWorkspaces: [workspaceId]
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

  // ===== NEW HIERARCHICAL WORKSPACE METHODS =====

  /**
   * Create a sub-workspace under a main workspace
   */
  static async createSubWorkspace(
    parentWorkspaceId: string,
    subWorkspaceData: SubWorkspaceData,
    creatorId: string
  ): Promise<string> {
    try {
      // Validate parent workspace exists and user has permission
      const parentWorkspace = await this.getWorkspace(parentWorkspaceId);
      if (!parentWorkspace) {
        throw new Error('Parent workspace not found');
      }

      // Check if user can create sub-workspaces
      const userRole = await this.getUserRole(creatorId, parentWorkspaceId);
      if (userRole !== 'owner' && userRole !== 'admin') {
        throw new Error('Only workspace owners or admins can create sub-workspaces');
      }

      // Check sub-workspace limits
      const currentSubWorkspaces = await this.getSubWorkspaces(parentWorkspaceId);
      const maxSubWorkspaces = parentWorkspace.settings?.maxSubWorkspaces || 10;
      if (currentSubWorkspaces.length >= maxSubWorkspaces) {
        throw new Error(`Maximum sub-workspaces limit (${maxSubWorkspaces}) reached`);
      }

      // Create sub-workspace
      const subWorkspaceRef = doc(collection(db, 'workspaces'));
      const subWorkspaceId = subWorkspaceRef.id;

      const subWorkspace = {
        id: subWorkspaceId,
        name: subWorkspaceData.name,
        description: subWorkspaceData.description,
        logo: subWorkspaceData.logo,
        type: parentWorkspace.type,
        ownerId: parentWorkspace.ownerId, // Always set main workspace owner as owner
        createdAt: new Date(),
        updatedAt: new Date(),
        // Hierarchical fields
        workspaceType: 'sub',
        parentWorkspaceId: parentWorkspaceId,
        level: (parentWorkspace.level || 0) + 1,
        path: [...(parentWorkspace.path || []), subWorkspaceId],
        // Sub-workspace bindings
        regionId: subWorkspaceData.regionId,
        branchId: subWorkspaceData.branchId,
        settings: {
          allowSubWorkspaces: false, // Sub-workspaces can't have sub-workspaces by default
          maxSubWorkspaces: 0,
          inheritUsers: subWorkspaceData.inheritUsers || true,
          inheritRoles: subWorkspaceData.inheritRoles || true,
          inheritTeams: subWorkspaceData.inheritTeams || false,
          inheritBranches: subWorkspaceData.inheritBranches || false,
          crossWorkspaceReporting: false,
        }
      };

      // Clean data to remove undefined values before saving to Firestore
      const cleanSubWorkspace = cleanFirestoreData(subWorkspace);
      
      console.log('Creating sub-workspace with data:', {
        id: subWorkspaceId,
        name: subWorkspace.name,
        regionId: subWorkspace.regionId,
        branchId: subWorkspace.branchId,
        workspaceType: subWorkspace.workspaceType
      });
      
      await setDoc(subWorkspaceRef, cleanSubWorkspace);

      // Always add main workspace owner as owner of the sub-workspace
      await this.addUserToWorkspace(parentWorkspace.ownerId, subWorkspaceId, 'owner');

      // If creator is not the owner, add creator as admin
      if (creatorId !== parentWorkspace.ownerId) {
        await this.addUserToWorkspace(creatorId, subWorkspaceId, 'admin');
      }

      // Create hierarchy relationship
      await this.createHierarchyRelationship(parentWorkspaceId, subWorkspaceId, creatorId);

      // Handle user inheritance
      if (subWorkspaceData.inheritUsers) {
        await this.inheritUsersToSubWorkspace(parentWorkspaceId, subWorkspaceId, creatorId);
      }

      // Add initial users if specified
      if (subWorkspaceData.initialUsers?.length) {
        for (const userId of subWorkspaceData.initialUsers) {
          await this.addUserToWorkspace(userId, subWorkspaceId, 'member', creatorId);
        }
      }

      // Update parent workspace sub-workspace count
      await this.updateParentWorkspaceStats(parentWorkspaceId);

      return subWorkspaceId;
    } catch (error) {
      console.error('Error creating sub-workspace:', error);
      throw error;
    }
  }

  /**
   * Get all sub-workspaces for a parent workspace
   */
  static async getSubWorkspaces(parentWorkspaceId: string): Promise<Workspace[]> {
    try {
      const workspacesRef = collection(db, 'workspaces');
      const q = query(
        workspacesRef,
        where('parentWorkspaceId', '==', parentWorkspaceId),
        where('workspaceType', '==', 'sub')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: toDate(doc.data().createdAt),
        updatedAt: toDate(doc.data().updatedAt)
      } as Workspace));
    } catch (error) {
      console.error('Error fetching sub-workspaces:', error);
      throw error;
    }
  }

  /**
   * Get workspace hierarchy for a user (all accessible workspaces)
   */
  static async getUserAccessibleWorkspaces(userId: string): Promise<{
    mainWorkspaces: Workspace[];
    subWorkspaces: { [parentId: string]: Workspace[] };
    userRoles: { [workspaceId: string]: string };
  }> {
    try {
      // Get all user's workspace relationships
      const userWorkspaces = await this.getUserWorkspaces(userId);
      const userRoles: { [workspaceId: string]: string } = {};
      
      userWorkspaces.forEach(uw => {
        userRoles[uw.workspace.id] = uw.role;
      });

      // Separate main and sub workspaces
      const mainWorkspaces: Workspace[] = [];
      const subWorkspaces: { [parentId: string]: Workspace[] } = {};

      for (const { workspace } of userWorkspaces) {
        if (workspace.workspaceType === 'main') {
          mainWorkspaces.push(workspace);
          
          // If user is owner of main workspace, get all sub-workspaces
          if (userRoles[workspace.id] === 'owner') {
            const subWs = await this.getSubWorkspaces(workspace.id);
            subWorkspaces[workspace.id] = subWs;
          }
        } else if (workspace.workspaceType === 'sub') {
          const parentId = workspace.parentWorkspaceId!;
          if (!subWorkspaces[parentId]) {
            subWorkspaces[parentId] = [];
          }
          
          // Check if this sub-workspace is already included via owner access
          const isAlreadyIncluded = subWorkspaces[parentId].some(sw => sw.id === workspace.id);
          if (!isAlreadyIncluded) {
            subWorkspaces[parentId].push(workspace);
          }
        }
      }

      return {
        mainWorkspaces: sortByDateDesc(mainWorkspaces, 'createdAt'),
        subWorkspaces,
        userRoles
      };
    } catch (error) {
      console.error('Error fetching user accessible workspaces:', error);
      throw error;
    }
  }

  /**
   * Switch user's active workspace
   */
  static async switchUserWorkspace(userId: string, workspaceId: string): Promise<void> {
    try {
      // Verify user has access to this workspace
      const userRole = await this.getUserRole(userId, workspaceId);
      if (!userRole) {
        throw new Error('User does not have access to this workspace');
      }

      // Update user's active workspace
      await updateDoc(doc(db, 'users', userId), {
        workspaceId: workspaceId,
        updatedAt: new Date()
      });

    } catch (error) {
      console.error('Error switching workspace:', error);
      throw error;
    }
  }

  /**
   * Get workspace hierarchy path (breadcrumb)
   */
  static async getWorkspaceHierarchyPath(workspaceId: string): Promise<Workspace[]> {
    try {
      const workspace = await this.getWorkspace(workspaceId);
      if (!workspace || !workspace.path) {
        return workspace ? [workspace] : [];
      }

      const hierarchyPath: Workspace[] = [];
      
      for (const pathWorkspaceId of workspace.path) {
        const pathWorkspace = await this.getWorkspace(pathWorkspaceId);
        if (pathWorkspace) {
          hierarchyPath.push(pathWorkspace);
        }
      }

      return hierarchyPath;
    } catch (error) {
      console.error('Error fetching workspace hierarchy path:', error);
      throw error;
    }
  }

  /**
   * Check if user can create sub-workspaces
   */
  static async canUserCreateSubWorkspace(userId: string, parentWorkspaceId: string): Promise<boolean> {
    try {
      const userRole = await this.getUserRole(userId, parentWorkspaceId);
      const parentWorkspace = await this.getWorkspace(parentWorkspaceId);
      
      return userRole === 'owner' && 
             parentWorkspace?.settings?.allowSubWorkspaces === true &&
             parentWorkspace?.workspaceType === 'main';
    } catch (error) {
      console.error('Error checking sub-workspace creation permission:', error);
      return false;
    }
  }

  // ===== HELPER METHODS =====

  /**
   * Create hierarchy relationship record
   */
  private static async createHierarchyRelationship(
    parentWorkspaceId: string,
    childWorkspaceId: string,
    creatorId: string
  ): Promise<void> {
    try {
      const hierarchyRef = doc(db, 'workspaceHierarchy', `${parentWorkspaceId}_${childWorkspaceId}`);
      const hierarchyData: WorkspaceHierarchy = {
        id: `${parentWorkspaceId}_${childWorkspaceId}`,
        parentWorkspaceId,
        childWorkspaceId,
        relationship: 'direct',
        permissions: {
          canManage: true,
          canView: true,
          canInheritUsers: true,
          canInheritRoles: true,
          canCreateSubWorkspaces: false,
          canDeleteSubWorkspaces: true,
          canMoveSubWorkspaces: true
        },
        createdAt: new Date(),
        createdBy: creatorId,
        updatedAt: new Date()
      };

      await setDoc(hierarchyRef, hierarchyData);
    } catch (error) {
      console.error('Error creating hierarchy relationship:', error);
      throw error;
    }
  }

  /**
   * Inherit users from parent to sub-workspace
   */
  private static async inheritUsersToSubWorkspace(
    parentWorkspaceId: string,
    subWorkspaceId: string,
    creatorId: string
  ): Promise<void> {
    try {
      const parentUsers = await this.getWorkspaceUsers(parentWorkspaceId);
      const batch = writeBatch(db);

      for (const { user, role } of parentUsers) {
        // Don't inherit owner role, make them admin instead
        const inheritedRole: 'owner' | 'admin' | 'member' = role === 'owner' ? 'admin' : (role as 'admin' | 'member');
        
        const userWorkspaceRef = doc(db, 'userWorkspaces', `${user.id}_${subWorkspaceId}`);
        const inheritedUserWorkspace: UserWorkspace = {
          id: `${user.id}_${subWorkspaceId}`,
          userId: user.id,
          workspaceId: subWorkspaceId,
          role: inheritedRole,
          joinedAt: new Date(),
          scope: 'inherited',
          inheritedFrom: parentWorkspaceId,
          permissions: this.getDefaultPermissionsForRole(inheritedRole),
          effectiveRole: inheritedRole,
          canAccessSubWorkspaces: inheritedRole !== 'member',
          accessibleWorkspaces: [subWorkspaceId]
        };

        batch.set(userWorkspaceRef, inheritedUserWorkspace);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error inheriting users to sub-workspace:', error);
      throw error;
    }
  }

  /**
   * Update parent workspace statistics
   */
  private static async updateParentWorkspaceStats(parentWorkspaceId: string): Promise<void> {
    try {
      const subWorkspaces = await this.getSubWorkspaces(parentWorkspaceId);
      
      await updateDoc(doc(db, 'workspaces', parentWorkspaceId), {
        hasSubWorkspaces: subWorkspaces.length > 0,
        subWorkspaceCount: subWorkspaces.length,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating parent workspace stats:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Get default permissions for a role
   */
  private static getDefaultPermissionsForRole(role: string): UserWorkspacePermissions {
    switch (role) {
      case 'owner':
        return {
          canAccessSubWorkspaces: true,
          canCreateSubWorkspaces: true,
          canManageInherited: true,
          canViewHierarchy: true,
          canSwitchWorkspaces: true,
          canInviteToSubWorkspaces: true
        };
      case 'admin':
        return {
          canAccessSubWorkspaces: true,
          canCreateSubWorkspaces: false,
          canManageInherited: true,
          canViewHierarchy: true,
          canSwitchWorkspaces: true,
          canInviteToSubWorkspaces: true
        };
      default: // member
        return {
          canAccessSubWorkspaces: false,
          canCreateSubWorkspaces: false,
          canManageInherited: false,
          canViewHierarchy: true,
          canSwitchWorkspaces: true,
          canInviteToSubWorkspaces: false
        };
    }
  }

  // ===== EXISTING METHODS (keeping all current functionality) =====

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
      // console.log(`DEBUG: WorkspaceService.getUserWorkspaces called for userId: ${userId}`);
      
      const userWorkspacesRef = collection(db, 'userWorkspaces');
      const q = query(userWorkspacesRef, where('userId', '==', userId));
      
      const querySnapshot = await getDocs(q);
      // console.log(`DEBUG: Found ${querySnapshot.docs.length} userWorkspace documents`);
      
      const results = [];
      
      for (const docSnap of querySnapshot.docs) {
        const userWorkspace = docSnap.data() as UserWorkspace;
        // console.log(`DEBUG: Processing userWorkspace:`, userWorkspace);
        
        const workspaceData = await getDoc(doc(db, 'workspaces', userWorkspace.workspaceId));
        
        if (workspaceData.exists()) {
          const workspace = { id: workspaceData.id, ...workspaceData.data() } as Workspace;
          const result = { workspace, role: userWorkspace.role };
          // console.log(`DEBUG: Adding to results:`, result);
          results.push(result);
        } else {
          console.warn(`Workspace ${userWorkspace.workspaceId} not found for user ${userId}`);
        }
      }
      
      // console.log(`DEBUG: getUserWorkspaces returning ${results.length} results:`, results);
      
      // Sort by workspace creation date (newest first)
      return results.sort((a, b) => {
        const dateA = a.workspace.createdAt instanceof Date ? a.workspace.createdAt : new Date(a.workspace.createdAt);
        const dateB = b.workspace.createdAt instanceof Date ? b.workspace.createdAt : new Date(b.workspace.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
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
   * Update workspace settings
   */
  static async updateWorkspaceSettings(
    workspaceId: string, 
    settingsUpdates: Partial<WorkspaceSettings>
  ): Promise<void> {
    try {
      const workspaceRef = doc(db, 'workspaces', workspaceId);
      
      // Get current workspace to merge settings
      const currentWorkspace = await this.getWorkspace(workspaceId);
      if (!currentWorkspace) {
        throw new Error('Workspace not found');
      }

      // Merge current settings with updates
      const updatedSettings = {
        ...currentWorkspace.settings,
        ...settingsUpdates
      };

      // Update only the settings field
      await updateDoc(workspaceRef, {
        settings: updatedSettings,
        updatedAt: new Date()
      });
      
    } catch (error) {
      console.error('Error updating workspace settings:', error);
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
   * Add user to workspace with proper hierarchical permissions
   */  
  static async addUserToWorkspace(
    userId: string,
    workspaceId: string,
    role: 'owner' | 'admin' | 'member',
    invitedBy?: string
  ): Promise<void> {
    try {
      // console.log(`DEBUG: WorkspaceService.addUserToWorkspace called with userId: ${userId}, workspaceId: ${workspaceId}, role: ${role}`);
      
      // Skip permission checks for self-registration scenarios
      // This includes Google users, direct registration, and system operations
      const isSelfRegistration = invitedBy === 'system' || invitedBy === userId;
      
      console.log(`Adding user to workspace: userId=${userId}, workspaceId=${workspaceId}, role=${role}, invitedBy=${invitedBy}, isSelfRegistration=${isSelfRegistration}`);
      
      if (!isSelfRegistration && invitedBy) {
        const inviterRole = await this.getUserRole(invitedBy, workspaceId);
        console.log(`Inviter ${invitedBy} role in workspace: ${inviterRole}`);
        
        // If inviter doesn't have direct role, check if they're a global owner
        if (!inviterRole) {
          // Check if they're a global owner by looking for owner role in any main workspace
          const inviterWorkspaces = await this.getUserWorkspaces(invitedBy);
          const isGlobalOwner = inviterWorkspaces.some(uw => 
            uw.role === 'owner' && uw.workspace.workspaceType === 'main'
          );
          
          console.log(`Is global owner: ${isGlobalOwner}`);
          
          if (!isGlobalOwner) {
            throw new Error('Insufficient permissions to add users to this workspace');
          }
        } else if (!['owner', 'admin'].includes(inviterRole)) {
          throw new Error('Only owners and admins can add users to workspaces');
        }
      }
      
      const userWorkspaceRef = doc(db, 'userWorkspaces', `${userId}_${workspaceId}`);
      const userWorkspace: UserWorkspace = {
        id: `${userId}_${workspaceId}`,
        userId,
        workspaceId,
        role,
        joinedAt: new Date(),
        invitedBy: invitedBy || 'system',
        // Hierarchical fields for proper access control
        scope: 'direct',
        permissions: this.getDefaultPermissionsForRole(role),
        effectiveRole: role,
        canAccessSubWorkspaces: role !== 'member',
        accessibleWorkspaces: [workspaceId]
      };
      
      // console.log(`DEBUG: About to create UserWorkspace document with role: ${userWorkspace.role}`);
      await setDoc(userWorkspaceRef, userWorkspace);
      console.log(`Successfully added user ${userId} to workspace ${workspaceId} with role ${role}`);
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

  /**
   * Transfer user from one workspace to another
   * Only owners can perform transfers
   */
  static async transferUserBetweenWorkspaces(
    userId: string,
    fromWorkspaceId: string,
    toWorkspaceId: string,
    newRole: 'owner' | 'admin' | 'member',
    transferredBy: string
  ): Promise<void> {
    try {
      // Validate permissions - only owners can transfer users
      const transferrerRole = await this.getUserRole(transferredBy, fromWorkspaceId);
      if (transferrerRole !== 'owner') {
        throw new Error('Only workspace owners can transfer users');
      }

      // Get user data for validation and logging
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userData = userDoc.data();

      // Validate source workspace access
      const sourceRole = await this.getUserRole(userId, fromWorkspaceId);
      if (!sourceRole) {
        throw new Error('User is not a member of the source workspace');
      }

      // Prevent transferring the last owner
      if (sourceRole === 'owner') {
        const hasOtherOwners = await this.hasOtherOwners(fromWorkspaceId, userId);
        if (!hasOtherOwners) {
          throw new Error('Cannot transfer the last owner from workspace');
        }
      }

      // Validate destination workspace exists
      const destinationWorkspace = await this.getWorkspace(toWorkspaceId);
      if (!destinationWorkspace) {
        throw new Error('Destination workspace not found');
      }

      // Check if user is already in destination workspace
      const existingDestinationRole = await this.getUserRole(userId, toWorkspaceId);
      if (existingDestinationRole) {
        throw new Error('User is already a member of the destination workspace');
      }

      // Validate transferrer has permission in destination workspace
      const transferrerDestinationRole = await this.getUserRole(transferredBy, toWorkspaceId);
      if (transferrerDestinationRole !== 'owner') {
        throw new Error('You must be an owner of the destination workspace to transfer users there');
      }

      // Perform the transfer using batch operations
      const batch = writeBatch(db);

      // 1. Remove from source workspace
      const sourceUserWorkspaceRef = doc(db, 'userWorkspaces', `${userId}_${fromWorkspaceId}`);
      batch.delete(sourceUserWorkspaceRef);

      // 2. Add to destination workspace
      const destUserWorkspaceRef = doc(db, 'userWorkspaces', `${userId}_${toWorkspaceId}`);
      const destUserWorkspace: UserWorkspace = {
        id: `${userId}_${toWorkspaceId}`,
        userId,
        workspaceId: toWorkspaceId,
        role: newRole,
        joinedAt: new Date(),
        invitedBy: transferredBy,
        scope: 'direct',
        permissions: this.getDefaultPermissionsForRole(newRole),
        effectiveRole: newRole,
        canAccessSubWorkspaces: newRole !== 'member',
        accessibleWorkspaces: [toWorkspaceId]
      };
      batch.set(destUserWorkspaceRef, destUserWorkspace);

      // 3. Update user's primary workspace
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        workspaceId: toWorkspaceId,
        role: newRole,
        updatedAt: new Date()
      });

      // Commit the batch
      await batch.commit();

      // Log the transfer activity in both workspaces
      try {
        const { ActivityService } = await import('./activity-service');
        
        // Log in source workspace
        await ActivityService.logActivity(
          'user_transferred_out',
          'user',
          userId,
          {
            targetName: userData.name,
            email: userData.email,
            fromWorkspace: fromWorkspaceId,
            toWorkspace: toWorkspaceId,
            newRole: newRole,
            transferredBy: transferredBy
          },
          fromWorkspaceId,
          transferredBy
        );

        // Log in destination workspace
        await ActivityService.logActivity(
          'user_transferred_in',
          'user',
          userId,
          {
            targetName: userData.name,
            email: userData.email,
            fromWorkspace: fromWorkspaceId,
            toWorkspace: toWorkspaceId,
            newRole: newRole,
            transferredBy: transferredBy
          },
          toWorkspaceId,
          transferredBy
        );
      } catch (error) {
        console.warn('Warning: Could not log transfer activity:', error);
      }

      console.log(`Successfully transferred user ${userId} from ${fromWorkspaceId} to ${toWorkspaceId} with role ${newRole}`);
    } catch (error) {
      console.error('Error transferring user between workspaces:', error);
      throw error;
    }
  }

  /**
   * Transfer multiple users between workspaces
   */
  static async transferMultipleUsers(
    userIds: string[],
    fromWorkspaceId: string,
    toWorkspaceId: string,
    newRole: 'owner' | 'admin' | 'member',
    transferredBy: string
  ): Promise<{ success: string[], failed: { userId: string, error: string }[] }> {
    const results = {
      success: [] as string[],
      failed: [] as { userId: string, error: string }[]
    };

    for (const userId of userIds) {
      try {
        await this.transferUserBetweenWorkspaces(
          userId,
          fromWorkspaceId,
          toWorkspaceId,
          newRole,
          transferredBy
        );
        results.success.push(userId);
      } catch (error) {
        results.failed.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Get users that can be transferred from a workspace
   * (excludes the last owner)
   */
  static async getTransferableUsers(workspaceId: string, requestedBy: string): Promise<{
    user: any;
    role: string;
    canTransfer: boolean;
    reason?: string;
  }[]> {
    try {
      // Only owners can view transferable users
      const requesterRole = await this.getUserRole(requestedBy, workspaceId);
      if (requesterRole !== 'owner') {
        throw new Error('Only workspace owners can view transferable users');
      }

      const workspaceUsers = await this.getWorkspaceUsers(workspaceId);
      const owners = workspaceUsers.filter(u => u.role === 'owner');
      const hasMultipleOwners = owners.length > 1;

      return workspaceUsers.map(({ user, role }) => {
        let canTransfer = true;
        let reason: string | undefined;

        // Can't transfer the last owner
        if (role === 'owner' && !hasMultipleOwners) {
          canTransfer = false;
          reason = 'Cannot transfer the last owner';
        }

        // Can't transfer the requester (they need to stay to perform the transfer)
        if (user.id === requestedBy) {
          canTransfer = false;
          reason = 'Cannot transfer yourself';
        }

        return {
          user,
          role,
          canTransfer,
          reason
        };
      });
    } catch (error) {
      console.error('Error getting transferable users:', error);
      throw error;
    }
  }

  /**
   * Get workspaces where a user can transfer others
   * (workspaces where the user is an owner)
   */
  static async getTransferDestinations(userId: string): Promise<Workspace[]> {
    try {
      const userWorkspaces = await this.getUserWorkspaces(userId);
      const ownerWorkspaces = userWorkspaces.filter(({ role }: { role: string }) => role === 'owner');
      
      return ownerWorkspaces.map(({ workspace }: { workspace: Workspace }) => workspace);
    } catch (error) {
      console.error('Error getting transfer destinations:', error);
      throw error;
    }
  }
}
