import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { CostCenterPermissionsService } from './cost-center-permissions-service';

export class CostCenterMigration {
  /**
   * Grant cost center permissions to all existing users based on their roles
   */
  static async migrateCostCenterPermissions(): Promise<{
    success: number;
    errors: string[];
    details: { userId: string; workspaceId: string; role: string; status: string }[];
  }> {
    const result = {
      success: 0,
      errors: [] as string[],
      details: [] as { userId: string; workspaceId: string; role: string; status: string }[]
    };

    try {
      console.log('Starting cost center permissions migration...');
      
      // Get all user-workspace relationships
      const userWorkspacesRef = collection(db, 'userWorkspaces');
      const snapshot = await getDocs(userWorkspacesRef);
      
      console.log(`Found ${snapshot.docs.length} user-workspace relationships to process`);

      for (const docSnapshot of snapshot.docs) {
        try {
          const userWorkspace = docSnapshot.data();
          const { userId, workspaceId, role } = userWorkspace;
          
          if (!userId || !workspaceId || !role) {
            result.errors.push(`Invalid user-workspace data: ${docSnapshot.id}`);
            result.details.push({
              userId: userId || 'unknown',
              workspaceId: workspaceId || 'unknown',
              role: role || 'unknown',
              status: 'Error - Invalid data'
            });
            continue;
          }

          // Grant default cost center permissions based on role
          await CostCenterPermissionsService.grantDefaultPermissions(
            userId,
            workspaceId,
            role,
            'system-migration'
          );

          result.success++;
          result.details.push({
            userId,
            workspaceId,
            role,
            status: 'Success'
          });

          console.log(`✓ Granted cost center permissions to user ${userId} (${role}) in workspace ${workspaceId}`);
          
        } catch (error) {
          const errorMsg = `Failed to migrate user ${docSnapshot.id}: ${error}`;
          result.errors.push(errorMsg);
          console.error('❌', errorMsg);
          
          const userWorkspace = docSnapshot.data();
          result.details.push({
            userId: userWorkspace.userId || 'unknown',
            workspaceId: userWorkspace.workspaceId || 'unknown',
            role: userWorkspace.role || 'unknown',
            status: `Error: ${error}`
          });
        }
      }

      console.log(`Migration completed: ${result.success} successful, ${result.errors.length} errors`);
      return result;
      
    } catch (error) {
      console.error('Migration failed:', error);
      result.errors.push(`Migration failed: ${error}`);
      return result;
    }
  }

  /**
   * Grant cost center permissions to a specific user in a specific workspace
   */
  static async grantCostCenterPermissionsToUser(
    userId: string,
    workspaceId: string,
    role: 'owner' | 'admin' | 'member',
    grantedBy: string
  ): Promise<void> {
    try {
      await CostCenterPermissionsService.grantDefaultPermissions(
        userId,
        workspaceId,
        role,
        grantedBy
      );
      console.log(`✓ Granted cost center permissions to user ${userId} (${role}) in workspace ${workspaceId}`);
    } catch (error) {
      console.error(`❌ Failed to grant cost center permissions to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Grant cost center permissions to all users in a specific workspace
   */
  static async migrateCostCenterPermissionsForWorkspace(workspaceId: string): Promise<{
    success: number;
    errors: string[];
    details: { userId: string; role: string; status: string }[];
  }> {
    const result = {
      success: 0,
      errors: [] as string[],
      details: [] as { userId: string; role: string; status: string }[]
    };

    try {
      console.log(`Starting cost center permissions migration for workspace ${workspaceId}...`);
      
      // Get all user-workspace relationships for this workspace
      const userWorkspacesRef = collection(db, 'userWorkspaces');
      const q = query(userWorkspacesRef, where('workspaceId', '==', workspaceId));
      const snapshot = await getDocs(q);
      
      console.log(`Found ${snapshot.docs.length} users in workspace ${workspaceId}`);

      for (const docSnapshot of snapshot.docs) {
        try {
          const userWorkspace = docSnapshot.data();
          const { userId, role } = userWorkspace;
          
          if (!userId || !role) {
            result.errors.push(`Invalid user data: ${docSnapshot.id}`);
            result.details.push({
              userId: userId || 'unknown',
              role: role || 'unknown',
              status: 'Error - Invalid data'
            });
            continue;
          }

          // Grant default cost center permissions based on role
          await CostCenterPermissionsService.grantDefaultPermissions(
            userId,
            workspaceId,
            role,
            'system-migration'
          );

          result.success++;
          result.details.push({
            userId,
            role,
            status: 'Success'
          });

          console.log(`✓ Granted cost center permissions to user ${userId} (${role})`);
          
        } catch (error) {
          const errorMsg = `Failed to migrate user ${docSnapshot.id}: ${error}`;
          result.errors.push(errorMsg);
          console.error('❌', errorMsg);
          
          const userWorkspace = docSnapshot.data();
          result.details.push({
            userId: userWorkspace.userId || 'unknown',
            role: userWorkspace.role || 'unknown',
            status: `Error: ${error}`
          });
        }
      }

      console.log(`Workspace migration completed: ${result.success} successful, ${result.errors.length} errors`);
      return result;
      
    } catch (error) {
      console.error('Workspace migration failed:', error);
      result.errors.push(`Migration failed: ${error}`);
      return result;
    }
  }
} 