import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  writeBatch,
  query,
  where,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Workspace, 
  WorkspaceSettings, 
  UserWorkspace, 
  UserWorkspacePermissions,
  WorkspaceInheritance 
} from './types';

export class MigrationService {
  private static readonly MIGRATION_VERSION = '1.0.0';
  private static readonly BACKUP_COLLECTION = 'migration_backups';

  /**
   * Main migration function to convert existing workspaces to hierarchical structure
   * This is safe to run multiple times - it will skip already migrated workspaces
   */
  static async migrateExistingWorkspaces(): Promise<{
    success: boolean;
    migratedWorkspaces: number;
    migratedUsers: number;
    errors: string[];
  }> {
    console.log('🚀 Starting workspace hierarchy migration...');
    
    const result = {
      success: false,
      migratedWorkspaces: 0,
      migratedUsers: 0,
      errors: [] as string[]
    };

    try {
      // Step 1: Backup existing data
      await this.backupCurrentData();
      console.log('✅ Data backup completed');

      // Step 2: Migrate workspaces
      const workspaceResults = await this.migrateWorkspaces();
      result.migratedWorkspaces = workspaceResults.migrated;
      result.errors.push(...workspaceResults.errors);

      // Step 3: Migrate user-workspace relationships
      const userResults = await this.migrateUserWorkspaces();
      result.migratedUsers = userResults.migrated;
      result.errors.push(...userResults.errors);

      // Step 4: Validate migration
      const isValid = await this.validateWorkspaceHierarchy();
      if (!isValid) {
        result.errors.push('Migration validation failed');
      }

      // Step 5: Record migration completion
      await this.recordMigrationComplete();

      result.success = result.errors.length === 0;
      console.log(`✅ Migration completed: ${result.migratedWorkspaces} workspaces, ${result.migratedUsers} user relationships`);
      
      return result;
    } catch (error) {
      console.error('❌ Migration failed:', error);
      result.errors.push(`Migration error: ${error}`);
      return result;
    }
  }

  /**
   * Migrate workspace documents to include hierarchical fields
   */
  private static async migrateWorkspaces(): Promise<{
    migrated: number;
    errors: string[];
  }> {
    const result = { migrated: 0, errors: [] as string[] };
    
    try {
      const workspacesRef = collection(db, 'workspaces');
      const snapshot = await getDocs(workspacesRef);
      
      const batch = writeBatch(db);
      
      for (const docSnapshot of snapshot.docs) {
        try {
          const workspace = docSnapshot.data() as Workspace;
          
          // Skip if already migrated
          if (workspace.workspaceType !== undefined) {
            continue;
          }
          
          // Default settings for existing workspaces
          const defaultSettings: WorkspaceSettings = {
            allowSubWorkspaces: true,
            maxSubWorkspaces: 10,
            inheritUsers: true,
            inheritRoles: true,
            inheritTeams: false,
            inheritBranches: false,
            crossWorkspaceReporting: true,
            subWorkspaceNamingPattern: '{parentName} - {subName}',
            allowAdminWorkspaceCreation: false // Default to false for existing workspaces
          };

          // Migration data for existing workspace
          const migrationData = {
            workspaceType: 'main' as const,
            parentWorkspaceId: null,
            level: 0,
            path: [workspace.id],
            settings: defaultSettings,
            hasSubWorkspaces: false,
            subWorkspaceCount: 0,
            isInherited: false,
            updatedAt: serverTimestamp(),
            // Migration metadata
            migratedAt: serverTimestamp(),
            migrationVersion: this.MIGRATION_VERSION
          };

          batch.update(doc(db, 'workspaces', workspace.id), migrationData);
          result.migrated++;
          
        } catch (error) {
          result.errors.push(`Failed to migrate workspace ${docSnapshot.id}: ${error}`);
        }
      }
      
      // Commit all workspace updates
      if (result.migrated > 0) {
        await batch.commit();
        console.log(`✅ Migrated ${result.migrated} workspaces`);
      }
      
    } catch (error) {
      result.errors.push(`Workspace migration error: ${error}`);
    }
    
    return result;
  }

  /**
   * Migrate user-workspace relationships to include hierarchical permissions
   */
  private static async migrateUserWorkspaces(): Promise<{
    migrated: number;
    errors: string[];
  }> {
    const result = { migrated: 0, errors: [] as string[] };
    
    try {
      const userWorkspacesRef = collection(db, 'userWorkspaces');
      const snapshot = await getDocs(userWorkspacesRef);
      
      const batch = writeBatch(db);
      
      for (const docSnapshot of snapshot.docs) {
        try {
          const userWorkspace = docSnapshot.data() as UserWorkspace;
          
          // Skip if already migrated
          if (userWorkspace.scope !== undefined) {
            continue;
          }
          
          // Default permissions based on role
          const permissions: UserWorkspacePermissions = {
            canAccessSubWorkspaces: userWorkspace.role !== 'member',
            canCreateSubWorkspaces: userWorkspace.role === 'owner',
            canManageInherited: userWorkspace.role !== 'member',
            canViewHierarchy: true,
            canSwitchWorkspaces: true,
            canInviteToSubWorkspaces: userWorkspace.role !== 'member'
          };

          // Migration data for existing user-workspace relationship
          const migrationData = {
            scope: 'direct' as const,
            inheritedFrom: null,
            permissions: permissions,
            effectiveRole: userWorkspace.role,
            canAccessSubWorkspaces: userWorkspace.role !== 'member',
            accessibleWorkspaces: [userWorkspace.workspaceId],
            // Migration metadata
            migratedAt: serverTimestamp(),
            migrationVersion: this.MIGRATION_VERSION
          };

          batch.update(doc(db, 'userWorkspaces', userWorkspace.id), migrationData);
          result.migrated++;
          
        } catch (error) {
          result.errors.push(`Failed to migrate user-workspace ${docSnapshot.id}: ${error}`);
        }
      }
      
      // Commit all user-workspace updates
      if (result.migrated > 0) {
        await batch.commit();
        console.log(`✅ Migrated ${result.migrated} user-workspace relationships`);
      }
      
    } catch (error) {
      result.errors.push(`User-workspace migration error: ${error}`);
    }
    
    return result;
  }

  /**
   * Create backup of current data before migration
   */
  static async backupCurrentData(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const backupId = `backup_${timestamp.replace(/[:.]/g, '-')}`;
      
      // Backup workspaces
      const workspacesSnapshot = await getDocs(collection(db, 'workspaces'));
      const workspacesBackup = workspacesSnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
      
      // Backup user-workspaces
      const userWorkspacesSnapshot = await getDocs(collection(db, 'userWorkspaces'));
      const userWorkspacesBackup = userWorkspacesSnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
      
      // Store backup
      const backupDoc = doc(db, this.BACKUP_COLLECTION, backupId);
      await setDoc(backupDoc, {
        backupId,
        timestamp: new Date(),
        workspaces: workspacesBackup,
        userWorkspaces: userWorkspacesBackup,
        migrationVersion: this.MIGRATION_VERSION
      });
      
      console.log(`✅ Backup created: ${backupId}`);
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw new Error(`Backup failed: ${error}`);
    }
  }

  /**
   * Validate the hierarchical workspace structure
   */
  static async validateWorkspaceHierarchy(): Promise<boolean> {
    try {
      console.log('🔍 Validating workspace hierarchy...');
      
      const workspacesSnapshot = await getDocs(collection(db, 'workspaces'));
      let isValid = true;
      const errors: string[] = [];
      
      for (const docSnapshot of workspacesSnapshot.docs) {
        const workspace = docSnapshot.data() as Workspace;
        
        // Validate required fields after migration
        if (workspace.workspaceType === undefined) {
          errors.push(`Workspace ${workspace.id} missing workspaceType`);
          isValid = false;
        }
        
        if (workspace.level === undefined) {
          errors.push(`Workspace ${workspace.id} missing level`);
          isValid = false;
        }
        
        if (!workspace.path || workspace.path.length === 0) {
          errors.push(`Workspace ${workspace.id} missing or empty path`);
          isValid = false;
        }
        
        // Validate hierarchy consistency
        if (workspace.workspaceType === 'sub' && !workspace.parentWorkspaceId) {
          errors.push(`Sub-workspace ${workspace.id} missing parentWorkspaceId`);
          isValid = false;
        }
        
        if (workspace.workspaceType === 'main' && workspace.parentWorkspaceId) {
          errors.push(`Main workspace ${workspace.id} should not have parentWorkspaceId`);
          isValid = false;
        }
      }
      
      if (errors.length > 0) {
        console.error('❌ Validation errors:', errors);
        return false;
      }
      
      console.log('✅ Hierarchy validation passed');
      return isValid;
    } catch (error) {
      console.error('❌ Validation failed:', error);
      return false;
    }
  }

  /**
   * Check if migration has already been completed
   */
  static async isMigrationCompleted(): Promise<boolean> {
    try {
      const migrationDoc = await getDoc(doc(db, 'system', 'migration_status'));
      if (migrationDoc.exists()) {
        const data = migrationDoc.data();
        return data.hierarchyMigrationCompleted === true;
      }
      return false;
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Record that migration has been completed
   */
  private static async recordMigrationComplete(): Promise<void> {
    try {
      const migrationDoc = doc(db, 'system', 'migration_status');
      await setDoc(migrationDoc, {
        hierarchyMigrationCompleted: true,
        migrationVersion: this.MIGRATION_VERSION,
        completedAt: serverTimestamp(),
        completedBy: 'system'
      }, { merge: true });
      
      console.log('✅ Migration completion recorded');
    } catch (error) {
      console.error('❌ Failed to record migration completion:', error);
      throw error;
    }
  }

  /**
   * Rollback migration if needed (emergency use only)
   */
  static async rollbackMigration(backupId: string): Promise<boolean> {
    try {
      console.log('🔄 Starting migration rollback...');
      
      // Get backup data
      const backupDoc = await getDoc(doc(db, this.BACKUP_COLLECTION, backupId));
      if (!backupDoc.exists()) {
        throw new Error(`Backup ${backupId} not found`);
      }
      
      const backup = backupDoc.data();
      const batch = writeBatch(db);
      
      // Restore workspaces
      for (const workspace of backup.workspaces) {
        batch.set(doc(db, 'workspaces', workspace.id), workspace.data);
      }
      
      // Restore user-workspaces
      for (const userWorkspace of backup.userWorkspaces) {
        batch.set(doc(db, 'userWorkspaces', userWorkspace.id), userWorkspace.data);
      }
      
      await batch.commit();
      
      // Clear migration status
      await setDoc(doc(db, 'system', 'migration_status'), {
        hierarchyMigrationCompleted: false,
        rolledBackAt: serverTimestamp(),
        rolledBackFrom: backupId
      }, { merge: true });
      
      console.log('✅ Migration rollback completed');
      return true;
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return false;
    }
  }

  /**
   * Get available backup versions
   */
  static async getAvailableBackups(): Promise<Array<{
    id: string;
    timestamp: Date;
    workspaceCount: number;
    userWorkspaceCount: number;
  }>> {
    try {
      const backupsSnapshot = await getDocs(collection(db, this.BACKUP_COLLECTION));
      
      return backupsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          timestamp: data.timestamp.toDate(),
          workspaceCount: data.workspaces?.length || 0,
          userWorkspaceCount: data.userWorkspaces?.length || 0
        };
      }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error getting backups:', error);
      return [];
    }
  }
} 