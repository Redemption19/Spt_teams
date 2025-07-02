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
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  UserWorkspace, 
  WorkspaceInheritance, 
  Workspace,
  UserWorkspacePermissions 
} from './types';
import { WorkspaceService } from './workspace-service';

/**
 * Service for managing user inheritance across workspace hierarchy
 */
export class InheritanceService {
  
  /**
   * Propagate user access to all sub-workspaces
   */
  static async propagateUserToSubWorkspaces(
    userId: string, 
    mainWorkspaceId: string,
    userRole: 'owner' | 'admin' | 'member',
    propagatedBy: string
  ): Promise<void> {
    try {
      console.log(`Propagating user ${userId} with role ${userRole} to sub-workspaces of ${mainWorkspaceId}`);
      
      // Get all sub-workspaces of the main workspace
      const subWorkspaces = await WorkspaceService.getSubWorkspaces(mainWorkspaceId);
      
      if (subWorkspaces.length === 0) {
        console.log('No sub-workspaces found to propagate to');
        return;
      }
      
      const batch = writeBatch(db);
      const propagatedUsers: string[] = [];
      
      for (const subWorkspace of subWorkspaces) {
        // Check if sub-workspace allows user inheritance
        if (!subWorkspace.settings?.inheritUsers) {
          console.log(`Skipping sub-workspace ${subWorkspace.id} - inheritance disabled`);
          continue;
        }
        
        // Check if user already has access to this sub-workspace
        const existingAccess = await this.getUserWorkspaceRelationship(userId, subWorkspace.id);
        if (existingAccess && existingAccess.scope === 'direct') {
          console.log(`User ${userId} already has direct access to ${subWorkspace.id} - skipping inheritance`);
          continue;
        }
        
        // Determine inherited role (owners become admins in sub-workspaces)
        const inheritedRole: 'admin' | 'member' = userRole === 'owner' ? 'admin' : 
                                                  userRole === 'admin' ? 'admin' : 'member';
        
        // Create or update inherited access
        const userWorkspaceRef = doc(db, 'userWorkspaces', `${userId}_${subWorkspace.id}`);
        const inheritedUserWorkspace: UserWorkspace = {
          id: `${userId}_${subWorkspace.id}`,
          userId,
          workspaceId: subWorkspace.id,
          role: inheritedRole,
          joinedAt: new Date(),
          scope: 'inherited',
          inheritedFrom: mainWorkspaceId,
          permissions: this.getInheritedPermissions(inheritedRole),
          effectiveRole: inheritedRole,
          canAccessSubWorkspaces: false, // Sub-workspace users can't access further sub-workspaces
          accessibleWorkspaces: [subWorkspace.id]
        };
        
        batch.set(userWorkspaceRef, inheritedUserWorkspace);
        
        // Create inheritance tracking record
        const inheritanceRef = doc(db, 'workspaceInheritance', `${subWorkspace.id}_${userId}`);
        const inheritanceData: WorkspaceInheritance = {
          id: `${subWorkspace.id}_${userId}`,
          workspaceId: subWorkspace.id,
          userId,
          sourceWorkspaceId: mainWorkspaceId,
          inheritedRole: inheritedRole,
          effectiveRole: inheritedRole,
          isActive: true,
          inheritedAt: new Date(),
          lastSyncAt: new Date()
        };
        
        batch.set(inheritanceRef, inheritanceData);
        propagatedUsers.push(subWorkspace.id);
      }
      
      if (propagatedUsers.length > 0) {
        await batch.commit();
        console.log(`Successfully propagated user ${userId} to ${propagatedUsers.length} sub-workspaces`);
      } else {
        console.log('No sub-workspaces required propagation');
      }
      
    } catch (error) {
      console.error('Error propagating user to sub-workspaces:', error);
      throw error;
    }
  }
  
  /**
   * Remove user inheritance from all sub-workspaces
   */
  static async removeUserFromSubWorkspaces(
    userId: string, 
    mainWorkspaceId: string
  ): Promise<void> {
    try {
      console.log(`Removing user ${userId} inheritance from sub-workspaces of ${mainWorkspaceId}`);
      
      // Get all inherited relationships for this user from the main workspace
      const inheritanceQuery = query(
        collection(db, 'workspaceInheritance'),
        where('userId', '==', userId),
        where('sourceWorkspaceId', '==', mainWorkspaceId),
        where('isActive', '==', true)
      );
      
      const inheritanceSnapshot = await getDocs(inheritanceQuery);
      
      if (inheritanceSnapshot.empty) {
        console.log('No inherited relationships found to remove');
        return;
      }
      
      const batch = writeBatch(db);
      
      for (const inheritanceDoc of inheritanceSnapshot.docs) {
        const inheritance = inheritanceDoc.data() as WorkspaceInheritance;
        
        // Only remove inherited access, not direct access
        const userWorkspaceRef = doc(db, 'userWorkspaces', `${userId}_${inheritance.workspaceId}`);
        const userWorkspaceSnap = await getDoc(userWorkspaceRef);
        
        if (userWorkspaceSnap.exists()) {
          const userWorkspace = userWorkspaceSnap.data() as UserWorkspace;
          
          if (userWorkspace.scope === 'inherited') {
            // Remove inherited access
            batch.delete(userWorkspaceRef);
            console.log(`Removing inherited access for user ${userId} from workspace ${inheritance.workspaceId}`);
          } else if (userWorkspace.scope === 'both') {
            // Convert to direct access only
            batch.update(userWorkspaceRef, {
              scope: 'direct',
              inheritedFrom: null,
              effectiveRole: userWorkspace.role,
              lastSyncAt: serverTimestamp()
            });
            console.log(`Converting user ${userId} access to direct only in workspace ${inheritance.workspaceId}`);
          }
        }
        
        // Deactivate inheritance record
        batch.update(doc(db, 'workspaceInheritance', inheritanceDoc.id), {
          isActive: false,
          removedAt: serverTimestamp()
        });
      }
      
      await batch.commit();
      console.log(`Successfully removed inheritance for user ${userId} from ${inheritanceSnapshot.docs.length} sub-workspaces`);
      
    } catch (error) {
      console.error('Error removing user from sub-workspaces:', error);
      throw error;
    }
  }
  
  /**
   * Sync inherited users for a sub-workspace
   */
  static async syncInheritedUsers(subWorkspaceId: string): Promise<void> {
    try {
      console.log(`Syncing inherited users for sub-workspace ${subWorkspaceId}`);
      
      const subWorkspace = await WorkspaceService.getWorkspace(subWorkspaceId);
      if (!subWorkspace || !subWorkspace.parentWorkspaceId) {
        throw new Error('Sub-workspace not found or missing parent reference');
      }
      
      if (!subWorkspace.settings?.inheritUsers) {
        console.log('User inheritance disabled for this sub-workspace');
        return;
      }
      
      // Get all users from parent workspace
      const parentUsers = await WorkspaceService.getWorkspaceUsers(subWorkspace.parentWorkspaceId);
      
      // Get current inherited users
      const currentInheritedQuery = query(
        collection(db, 'workspaceInheritance'),
        where('workspaceId', '==', subWorkspaceId),
        where('sourceWorkspaceId', '==', subWorkspace.parentWorkspaceId),
        where('isActive', '==', true)
      );
      
      const currentInheritedSnapshot = await getDocs(currentInheritedQuery);
      const currentInheritedUserIds = new Set(
        currentInheritedSnapshot.docs.map(doc => doc.data().userId)
      );
      
      const batch = writeBatch(db);
      let syncedCount = 0;
      
      // Add missing inherited users
      for (const { user, role } of parentUsers) {
        if (!currentInheritedUserIds.has(user.id)) {
          const inheritedRole: 'admin' | 'member' = role === 'owner' ? 'admin' : 
                                                    role === 'admin' ? 'admin' : 'member';
          
          // Check if user already has direct access
          const existingAccess = await this.getUserWorkspaceRelationship(user.id, subWorkspaceId);
          if (existingAccess && existingAccess.scope === 'direct') {
            continue; // Skip if user has direct access
          }
          
          // Create inherited access
          const userWorkspaceRef = doc(db, 'userWorkspaces', `${user.id}_${subWorkspaceId}`);
          const inheritedUserWorkspace: UserWorkspace = {
            id: `${user.id}_${subWorkspaceId}`,
            userId: user.id,
            workspaceId: subWorkspaceId,
            role: inheritedRole,
            joinedAt: new Date(),
            scope: 'inherited',
            inheritedFrom: subWorkspace.parentWorkspaceId,
            permissions: this.getInheritedPermissions(inheritedRole),
            effectiveRole: inheritedRole,
            canAccessSubWorkspaces: false,
            accessibleWorkspaces: [subWorkspaceId]
          };
          
          batch.set(userWorkspaceRef, inheritedUserWorkspace);
          
          // Create inheritance tracking
          const inheritanceRef = doc(db, 'workspaceInheritance', `${subWorkspaceId}_${user.id}`);
          const inheritanceData: WorkspaceInheritance = {
            id: `${subWorkspaceId}_${user.id}`,
            workspaceId: subWorkspaceId,
            userId: user.id,
            sourceWorkspaceId: subWorkspace.parentWorkspaceId,
            inheritedRole: inheritedRole,
            effectiveRole: inheritedRole,
            isActive: true,
            inheritedAt: new Date(),
            lastSyncAt: new Date()
          };
          
          batch.set(inheritanceRef, inheritanceData);
          syncedCount++;
        }
      }
      
      if (syncedCount > 0) {
        await batch.commit();
        console.log(`Synced ${syncedCount} inherited users for sub-workspace ${subWorkspaceId}`);
      } else {
        console.log('No users required syncing');
      }
      
    } catch (error) {
      console.error('Error syncing inherited users:', error);
      throw error;
    }
  }
  
  /**
   * Update user role inheritance across hierarchy
   */
  static async updateUserRoleInheritance(
    userId: string,
    mainWorkspaceId: string,
    newRole: 'owner' | 'admin' | 'member'
  ): Promise<void> {
    try {
      console.log(`Updating role inheritance for user ${userId} to ${newRole} in hierarchy`);
      
      // Get all inherited relationships
      const inheritanceQuery = query(
        collection(db, 'workspaceInheritance'),
        where('userId', '==', userId),
        where('sourceWorkspaceId', '==', mainWorkspaceId),
        where('isActive', '==', true)
      );
      
      const inheritanceSnapshot = await getDocs(inheritanceQuery);
      
      if (inheritanceSnapshot.empty) {
        console.log('No inherited relationships found to update');
        return;
      }
      
      const batch = writeBatch(db);
      
      for (const inheritanceDoc of inheritanceSnapshot.docs) {
        const inheritance = inheritanceDoc.data() as WorkspaceInheritance;
        const newInheritedRole: 'admin' | 'member' = newRole === 'owner' ? 'admin' : 
                                                     newRole === 'admin' ? 'admin' : 'member';
        
        // Update user workspace relationship
        const userWorkspaceRef = doc(db, 'userWorkspaces', `${userId}_${inheritance.workspaceId}`);
        batch.update(userWorkspaceRef, {
          role: newInheritedRole,
          effectiveRole: newInheritedRole,
          permissions: this.getInheritedPermissions(newInheritedRole),
          canAccessSubWorkspaces: newInheritedRole !== 'member',
          lastSyncAt: serverTimestamp()
        });
        
        // Update inheritance record
        batch.update(doc(db, 'workspaceInheritance', inheritanceDoc.id), {
          inheritedRole: newInheritedRole,
          effectiveRole: newInheritedRole,
          lastSyncAt: serverTimestamp()
        });
      }
      
      await batch.commit();
      console.log(`Updated role inheritance for user ${userId} across ${inheritanceSnapshot.docs.length} sub-workspaces`);
      
    } catch (error) {
      console.error('Error updating user role inheritance:', error);
      throw error;
    }
  }
  
  /**
   * Get user's effective permissions across workspace hierarchy
   */
  static async getUserEffectivePermissions(
    userId: string,
    workspaceId: string
  ): Promise<{
    role: 'owner' | 'admin' | 'member';
    permissions: UserWorkspacePermissions;
    scope: 'direct' | 'inherited' | 'both';
    sourceWorkspace?: string;
  } | null> {
    try {
      const userWorkspace = await this.getUserWorkspaceRelationship(userId, workspaceId);
      
      if (!userWorkspace) {
        return null;
      }
      
      return {
        role: userWorkspace.effectiveRole || userWorkspace.role,
        permissions: userWorkspace.permissions || this.getInheritedPermissions(userWorkspace.role),
        scope: userWorkspace.scope || 'direct',
        sourceWorkspace: userWorkspace.inheritedFrom
      };
    } catch (error) {
      console.error('Error getting user effective permissions:', error);
      return null;
    }
  }
  
  /**
   * Get all inherited users for a workspace
   */
  static async getInheritedUsers(workspaceId: string): Promise<Array<{
    user: any;
    inheritedRole: string;
    sourceWorkspace: string;
    inheritedAt: Date;
  }>> {
    try {
      const inheritanceQuery = query(
        collection(db, 'workspaceInheritance'),
        where('workspaceId', '==', workspaceId),
        where('isActive', '==', true)
      );
      
      const inheritanceSnapshot = await getDocs(inheritanceQuery);
      const results = [];
      
      for (const docSnapshot of inheritanceSnapshot.docs) {
        const inheritance = docSnapshot.data() as WorkspaceInheritance;
        
        // Get user data
        const userRef = doc(db, 'users', inheritance.userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          results.push({
            user: { id: userDoc.id, ...userData },
            inheritedRole: inheritance.inheritedRole,
            sourceWorkspace: inheritance.sourceWorkspaceId,
            inheritedAt: inheritance.inheritedAt
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error getting inherited users:', error);
      throw error;
    }
  }
  
  // ===== HELPER METHODS =====
  
  /**
   * Get user workspace relationship
   */
  private static async getUserWorkspaceRelationship(
    userId: string, 
    workspaceId: string
  ): Promise<UserWorkspace | null> {
    try {
      const userWorkspaceRef = doc(db, 'userWorkspaces', `${userId}_${workspaceId}`);
      const userWorkspaceSnap = await getDoc(userWorkspaceRef);
      
      if (userWorkspaceSnap.exists()) {
        return userWorkspaceSnap.data() as UserWorkspace;
      }
      return null;
    } catch (error) {
      console.error('Error getting user workspace relationship:', error);
      return null;
    }
  }
  
  /**
   * Get inherited permissions based on role
   */
  private static getInheritedPermissions(role: 'owner' | 'admin' | 'member'): UserWorkspacePermissions {
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
          canAccessSubWorkspaces: false, // Inherited admins can't access further sub-workspaces
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
          canViewHierarchy: false,
          canSwitchWorkspaces: false,
          canInviteToSubWorkspaces: false
        };
    }
  }
} 