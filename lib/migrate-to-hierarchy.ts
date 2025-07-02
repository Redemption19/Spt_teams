import { MigrationService } from './migration-service';
import { auth } from './firebase';

/**
 * One-time migration script to convert existing workspaces to hierarchical structure
 * 
 * This script should be run by the system administrator to migrate existing data
 * to the new hierarchical workspace structure.
 * 
 * Usage:
 * 1. Make sure you have admin access to the system
 * 2. Run this script in the browser console or as a Node.js script
 * 3. Monitor the console for migration progress
 * 4. Keep the backup ID for potential rollback
 */

export interface MigrationResult {
  success: boolean;
  message: string;
  details: {
    migratedWorkspaces: number;
    migratedUsers: number;
    errors: string[];
    backupId?: string;
  };
}

export class HierarchyMigrationRunner {
  
  /**
   * Main migration function with comprehensive error handling and logging
   */
  static async runMigration(): Promise<MigrationResult> {
    console.log('='.repeat(60));
    console.log('🚀 WORKSPACE HIERARCHY MIGRATION STARTING');
    console.log('='.repeat(60));
    
    try {
      // Step 1: Check if migration is already completed
      const isAlreadyMigrated = await MigrationService.isMigrationCompleted();
      if (isAlreadyMigrated) {
        console.log('✅ Migration already completed!');
        return {
          success: true,
          message: 'Migration already completed successfully',
          details: {
            migratedWorkspaces: 0,
            migratedUsers: 0,
            errors: ['Migration was already completed previously']
          }
        };
      }

      // Step 2: Validate environment
      const envCheck = await this.validateEnvironment();
      if (!envCheck.valid) {
        console.error('❌ Environment validation failed:', envCheck.errors);
        return {
          success: false,
          message: 'Environment validation failed',
          details: {
            migratedWorkspaces: 0,
            migratedUsers: 0,
            errors: envCheck.errors
          }
        };
      }

      // Step 3: Get user confirmation (in production, this would be a UI dialog)
      console.log('⚠️  IMPORTANT: This migration will modify your database structure.');
      console.log('📦 A backup will be created before migration begins.');
      console.log('🔄 This process is reversible using the backup.');
      console.log('⏱️  Estimated time: 2-5 minutes depending on data size.');
      
      // Step 4: Run the migration
      console.log('\n🔄 Starting migration process...');
      const migrationResult = await MigrationService.migrateExistingWorkspaces();
      
      // Step 5: Get backup information
      const backups = await MigrationService.getAvailableBackups();
      const latestBackup = backups[0];
      
      if (migrationResult.success) {
        console.log('\n' + '='.repeat(60));
        console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log(`📊 Migrated ${migrationResult.migratedWorkspaces} workspaces`);
        console.log(`👥 Migrated ${migrationResult.migratedUsers} user relationships`);
        if (latestBackup) {
          console.log(`💾 Backup ID: ${latestBackup.id}`);
          console.log(`📅 Backup created: ${latestBackup.timestamp.toLocaleString()}`);
        }
        console.log('\n🎉 Your workspace now supports hierarchical structure!');
        console.log('🔧 You can now create sub-workspaces from the settings panel.');
        
        return {
          success: true,
          message: 'Migration completed successfully',
          details: {
            migratedWorkspaces: migrationResult.migratedWorkspaces,
            migratedUsers: migrationResult.migratedUsers,
            errors: migrationResult.errors,
            backupId: latestBackup?.id
          }
        };
      } else {
        console.log('\n' + '='.repeat(60));
        console.log('❌ MIGRATION FAILED');
        console.log('='.repeat(60));
        console.log('Errors:', migrationResult.errors);
        
        return {
          success: false,
          message: 'Migration failed with errors',
          details: {
            migratedWorkspaces: migrationResult.migratedWorkspaces,
            migratedUsers: migrationResult.migratedUsers,
            errors: migrationResult.errors,
            backupId: latestBackup?.id
          }
        };
      }
      
    } catch (error) {
      console.error('💥 Migration crashed:', error);
      return {
        success: false,
        message: 'Migration crashed unexpectedly',
        details: {
          migratedWorkspaces: 0,
          migratedUsers: 0,
          errors: [`Migration crashed: ${error}`]
        }
      };
    }
  }

  /**
   * Rollback migration using a backup ID
   */
  static async rollbackMigration(backupId: string): Promise<MigrationResult> {
    console.log('='.repeat(60));
    console.log('🔄 STARTING MIGRATION ROLLBACK');
    console.log('='.repeat(60));
    
    try {
      console.log(`📦 Using backup: ${backupId}`);
      
      const success = await MigrationService.rollbackMigration(backupId);
      
      if (success) {
        console.log('\n✅ ROLLBACK COMPLETED SUCCESSFULLY!');
        console.log('🔄 Your workspace has been restored to the previous state.');
        
        return {
          success: true,
          message: 'Rollback completed successfully',
          details: {
            migratedWorkspaces: 0,
            migratedUsers: 0,
            errors: []
          }
        };
      } else {
        console.log('\n❌ ROLLBACK FAILED');
        
        return {
          success: false,
          message: 'Rollback failed',
          details: {
            migratedWorkspaces: 0,
            migratedUsers: 0,
            errors: ['Rollback operation failed']
          }
        };
      }
      
    } catch (error) {
      console.error('💥 Rollback crashed:', error);
      return {
        success: false,
        message: 'Rollback crashed unexpectedly',
        details: {
          migratedWorkspaces: 0,
          migratedUsers: 0,
          errors: [`Rollback crashed: ${error}`]
        }
      };
    }
  }

  /**
   * Get migration status and available backups
   */
  static async getMigrationStatus(): Promise<{
    isCompleted: boolean;
    availableBackups: Array<{
      id: string;
      timestamp: Date;
      workspaceCount: number;
      userWorkspaceCount: number;
    }>;
  }> {
    try {
      const [isCompleted, backups] = await Promise.all([
        MigrationService.isMigrationCompleted(),
        MigrationService.getAvailableBackups()
      ]);
      
      return {
        isCompleted,
        availableBackups: backups
      };
    } catch (error) {
      console.error('Error getting migration status:', error);
      return {
        isCompleted: false,
        availableBackups: []
      };
    }
  }

  /**
   * Validate environment before migration
   */
  private static async validateEnvironment(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    try {
      // Check Firebase connection
      if (!auth.currentUser) {
        errors.push('No authenticated user - please login first');
      }
      
      // Check if user has admin privileges (basic check)
      if (auth.currentUser) {
        // In a real implementation, you'd check user role from Firestore
        console.log('✅ User authenticated:', auth.currentUser.email);
      }
      
      // Check if required services are available
      if (typeof MigrationService === 'undefined') {
        errors.push('MigrationService not available');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
      
    } catch (error) {
      errors.push(`Environment validation error: ${error}`);
      return {
        valid: false,
        errors
      };
    }
  }

  /**
   * Development helper - show current workspace structure
   */
  static async showCurrentStructure(): Promise<void> {
    try {
      console.log('📊 Current Workspace Structure:');
      console.log('='.repeat(40));
      
      const status = await this.getMigrationStatus();
      
      console.log(`Migration Status: ${status.isCompleted ? '✅ Completed' : '⏳ Pending'}`);
      console.log(`Available Backups: ${status.availableBackups.length}`);
      
      if (status.availableBackups.length > 0) {
        console.log('\nBackups:');
        status.availableBackups.forEach((backup, index) => {
          console.log(`  ${index + 1}. ${backup.id}`);
          console.log(`     📅 ${backup.timestamp.toLocaleString()}`);
          console.log(`     📊 ${backup.workspaceCount} workspaces, ${backup.userWorkspaceCount} user relationships`);
        });
      }
      
    } catch (error) {
      console.error('Error showing structure:', error);
    }
  }
}

// Convenience functions for browser console usage
export const runMigration = () => HierarchyMigrationRunner.runMigration();
export const rollbackMigration = (backupId: string) => HierarchyMigrationRunner.rollbackMigration(backupId);
export const showMigrationStatus = () => HierarchyMigrationRunner.getMigrationStatus();
export const showCurrentStructure = () => HierarchyMigrationRunner.showCurrentStructure();

// Browser console helper
if (typeof window !== 'undefined') {
  (window as any).migrationUtils = {
    run: runMigration,
    rollback: rollbackMigration,
    status: showMigrationStatus,
    structure: showCurrentStructure
  };
  
  console.log('🔧 Migration utilities available in browser console:');
  console.log('   migrationUtils.run() - Run migration');
  console.log('   migrationUtils.rollback(backupId) - Rollback migration');
  console.log('   migrationUtils.status() - Check migration status');
  console.log('   migrationUtils.structure() - Show current structure');
} 