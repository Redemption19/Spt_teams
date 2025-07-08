// lib/database-multi-workspace.ts
import { 
    collection, 
    doc, 
    getDocs, 
    getDoc,
    where,
    query,
  } from 'firebase/firestore';
  import { db } from '../firebase';
  import { DatabaseBackup, DatabaseService } from './database-core'; // Import DatabaseBackup and DatabaseService
  
  export class DatabaseMultiWorkspaceService extends DatabaseService { // Extend DatabaseService
    /**
     * Multi-workspace backup with hierarchical strategy
     */
    static async createMultiWorkspaceBackup(
      workspaceIds: string[],
      userId: string,
      options: {
        strategy: 'hierarchical' | 'individual' | 'selective';
        backupType: 'full' | 'incremental' | 'differential';
        compression: 'none' | 'gzip' | 'zip';
        includeFiles?: boolean;
        includeUsers?: boolean;
        includeSettings?: boolean;
      }
    ): Promise<{
      success: boolean;
      backups: DatabaseBackup[];
      errors: string[];
      totalSize: number;
    }> {
      const result = {
        success: false,
        backups: [] as DatabaseBackup[],
        errors: [] as string[],
        totalSize: 0
      };
  
      try {
        // Sort workspaces by hierarchy (main workspaces first)
        const sortedWorkspaces = await this.sortWorkspacesByHierarchy(workspaceIds);
  
        for (const workspaceId of sortedWorkspaces) {
          try {
            // Call the createBackup from the extended DatabaseService
            const backup = await DatabaseService.createBackup(workspaceId, userId, { 
              backupType: options.backupType,
              compression: options.compression,
              includeFiles: options.includeFiles,
              includeUsers: options.includeUsers,
              includeSettings: options.includeSettings
            });
  
            result.backups.push(backup);
            result.totalSize += backup.size;
          } catch (error) {
            const errorMsg = `Failed to backup workspace ${workspaceId}: ${error}`;
            result.errors.push(errorMsg);
            console.error(errorMsg);
          }
        }
  
        result.success = result.errors.length === 0;
        return result;
      } catch (error) {
        result.errors.push(`Multi-workspace backup failed: ${error}`);
        return result;
      }
    }
  
    /**
     * Cross-workspace restore with conflict resolution
     */
    static async crossWorkspaceRestore(
      sourceWorkspaceId: string,
      targetWorkspaceIds: string[],
      userId: string,
      options: {
        conflictResolution: 'overwrite' | 'skip' | 'merge' | 'manual';
        restoreType: 'full' | 'selective';
        validateBeforeRestore?: boolean;
      }
    ): Promise<{
      success: boolean;
      restoredWorkspaces: string[];
      errors: string[];
      conflicts: Array<{
        workspaceId: string;
        conflicts: number;
        details: string[];
      }>;
    }> {
      const result = {
        success: false,
        restoredWorkspaces: [] as string[],
        errors: [] as string[],
        conflicts: [] as Array<{
          workspaceId: string;
          conflicts: number;
          details: string[];
        }>
      };
  
      try {
        // Get source backup data
        const sourceBackup = await this.getLatestBackup(sourceWorkspaceId);
        if (!sourceBackup) {
          throw new Error(`No backup found for source workspace ${sourceWorkspaceId}`);
        }
  
        // Validate targets if requested
        if (options.validateBeforeRestore) {
          for (const targetWorkspaceId of targetWorkspaceIds) {
            const validation = await this.validateRestoreTarget(targetWorkspaceId, sourceBackup);
            if (validation.conflicts > 0) {
              result.conflicts.push(validation);
            }
          }
        }
  
        // Perform restore for each target
        for (const targetWorkspaceId of targetWorkspaceIds) {
          try {
            // Handle 'manual' conflict resolution by converting to 'skip'
            // In a real implementation, this would trigger a manual review process
            const effectiveConflictResolution = options.conflictResolution === 'manual' 
              ? 'skip' 
              : options.conflictResolution;
  
            const restoreSuccess = await DatabaseService.restoreBackup( // Call restoreBackup from DatabaseService
              targetWorkspaceId,
              userId,
              sourceBackup.id,
              {
                conflictResolution: effectiveConflictResolution,
                restoreType: options.restoreType
              }
            );
  
            if (restoreSuccess) {
              result.restoredWorkspaces.push(targetWorkspaceId);
            }
          } catch (error) {
            const errorMsg = `Failed to restore workspace ${targetWorkspaceId}: ${error}`;
            result.errors.push(errorMsg);
            console.error(errorMsg);
          }
        }
  
        result.success = result.errors.length === 0;
        return result;
      } catch (error) {
        result.errors.push(`Cross-workspace restore failed: ${error}`);
        return result;
      }
    }
  
    /**
     * Get available workspaces for multi-workspace operations
     */
    static async getAvailableWorkspaces(userId: string): Promise<Array<{
      id: string;
      name: string;
      workspaceType: 'main' | 'sub';
      level: number;
      children: string[];
      parent?: string;
      status: 'active' | 'inactive';
      lastBackup?: Date;
    }>> {
      try {
        // Get user's accessible workspaces
        const userWorkspacesQuery = query(
          collection(db, 'userWorkspaces'),
          where('userId', '==', userId)
        );
        
        const userWorkspacesSnapshot = await getDocs(userWorkspacesQuery);
        const workspaceIds = userWorkspacesSnapshot.docs.map(doc => doc.data().workspaceId);
  
        // Get workspace details
        const workspaces = [];
        for (const workspaceId of workspaceIds) {
          const workspaceDoc = await getDoc(doc(db, 'workspaces', workspaceId));
          if (workspaceDoc.exists()) {
            const workspaceData = workspaceDoc.data();
            workspaces.push({
              id: workspaceId,
              name: workspaceData.name,
              workspaceType: workspaceData.workspaceType || 'main',
              level: workspaceData.level || 0,
              children: workspaceData.children || [],
              parent: workspaceData.parent,
              status: workspaceData.status || 'active',
              lastBackup: workspaceData.lastBackup?.toDate()
            });
          }
        }
  
        return workspaces;
      } catch (error) {
        console.error('Error getting available workspaces:', error);
        return [];
      }
    }
  
    /**
     * Validate restore target for conflicts
     */
    public static async validateRestoreTarget(
      targetWorkspaceId: string,
      sourceBackup: DatabaseBackup
    ): Promise<{
      workspaceId: string;
      conflicts: number;
      details: string[];
    }> {
      const conflicts = {
        workspaceId: targetWorkspaceId,
        conflicts: 0,
        details: [] as string[]
      };
  
      try {
        // This assumes `collectWorkspaceData` is accessible or re-implemented/imported
        // For now, it's a direct copy for demonstration purposes in this split file.
        // In a real scenario, this would ideally be a utility function or part of a shared module.
        const collectWorkspaceData = async (
          workspaceId: string,
          options: any
        ): Promise<Record<string, any[]>> => {
          const collections: Record<string, any[]> = {};
        
          const mainCollections = ['users', 'projects', 'tasks', 'teams', 'reports'];
          
          for (const collectionName of mainCollections) {
            const collectionQuery = query(
              collection(db, collectionName),
              where('workspaceId', '==', workspaceId)
            );
            
            const snapshot = await getDocs(collectionQuery);
            collections[collectionName] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          }
        
          return collections;
        };
  
        const existingData = await collectWorkspaceData(targetWorkspaceId, {});
        const sourceData = sourceBackup.collections || [];
  
        for (const collectionName of sourceData) {
          if (existingData[collectionName] && existingData[collectionName].length > 0) {
            conflicts.conflicts += existingData[collectionName].length;
            conflicts.details.push(`${collectionName}: ${existingData[collectionName].length} existing records`);
          }
        }
      } catch (error) {
        conflicts.details.push(`Validation error: ${error}`);
      }
  
      return conflicts;
    }
  
    /**
     * Sort workspaces by hierarchy (main workspaces first)
     */
    protected static async sortWorkspacesByHierarchy(workspaceIds: string[]): Promise<string[]> {
      try {
        const workspaces = [];
        
        // Get workspace details
        for (const workspaceId of workspaceIds) {
          const workspaceDoc = await getDoc(doc(db, 'workspaces', workspaceId));
          if (workspaceDoc.exists()) {
            const data = workspaceDoc.data();
            workspaces.push({
              id: workspaceId,
              level: data.level || 0,
              workspaceType: data.workspaceType || 'main'
            });
          }
        }
  
        // Sort by level (main workspaces first, then sub-workspaces)
        return workspaces
          .sort((a, b) => a.level - b.level)
          .map(w => w.id);
      } catch (error) {
        console.error('Error sorting workspaces:', error);
        return workspaceIds; // Return original order if sorting fails
      }
    }
  }