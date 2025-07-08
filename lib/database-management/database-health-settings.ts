// lib/database-health-settings.ts
import { 
    collection, 
    doc, 
    getDocs, 
    getDoc,
    setDoc,
    query,
    where,
    deleteDoc,
  } from 'firebase/firestore';
  import { db } from '../firebase';
  import { DatabaseService } from './database-core'; // Import DatabaseService
  import { storage } from '../firebase'; // Import storage
  import { ref, deleteObject } from 'firebase/storage'; // Import ref and deleteObject
  
  export interface DatabaseHealth {
    status: 'healthy' | 'warning' | 'critical';
    storageUsed: number;
    performance: number;
    connections: number;
    lastCheck: Date;
    issues: string[];
  }
  
  export interface WorkspaceBackupSettings {
    autoBackup: boolean;
    backupFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
    encryptionEnabled: boolean;
    compressionEnabled: boolean;
    notificationsEnabled: boolean;
  }

  export interface DatabaseBackup {
    id: string;
    workspaceId: string;
    timestamp: Date;
    size: number;
    downloadUrl?: string;
    encryptionKey?: string;
    compressionType?: string;
  }
  
  // Private helper methods (moved from original file)
  async function calculateStorageUsage(workspaceId: string): Promise<number> {
    // Simulate storage calculation
    return Math.floor(Math.random() * 40) + 20;
  }
  
  async function calculatePerformance(workspaceId: string): Promise<number> {
    // Simulate performance calculation
    return Math.floor(Math.random() * 20) + 80;
  }
  
  async function calculateHealthMetrics(workspaceId: string): Promise<DatabaseHealth> {
    // Calculate storage usage
    const storageUsage = await calculateStorageUsage(workspaceId);
    
    // Calculate performance metrics
    const performance = await calculatePerformance(workspaceId);
    
    // Get active connections (simulated)
    const connections = Math.floor(Math.random() * 20) + 5;
  
    return {
      status: performance > 80 ? 'healthy' : performance > 60 ? 'warning' : 'critical',
      storageUsed: storageUsage,
      performance,
      connections,
      lastCheck: new Date(),
      issues: []
    };
  }
  
  export class DatabaseHealthSettingsService extends DatabaseService { // Extend DatabaseService
    /**
     * Get database health information
     */
    static async getDatabaseHealth(workspaceId: string): Promise<DatabaseHealth> {
      try {
        const healthRef = doc(db, this.HEALTH_COLLECTION, workspaceId);
        const healthDoc = await getDoc(healthRef);
  
        if (healthDoc.exists()) {
          return healthDoc.data() as DatabaseHealth;
        }
  
        // Calculate health metrics
        const health = await calculateHealthMetrics(workspaceId);
        await setDoc(healthRef, health);
  
        return health;
      } catch (error) {
        console.error('Error getting database health:', error);
        return {
          status: 'critical',
          storageUsed: 0,
          performance: 0,
          connections: 0,
          lastCheck: new Date(),
          issues: ['Unable to retrieve health data']
        };
      }
    }
  
    /**
     * Get workspace backup settings
     */
    static async getBackupSettings(workspaceId: string): Promise<WorkspaceBackupSettings> {
      try {
        const settingsRef = doc(db, this.SETTINGS_COLLECTION, workspaceId);
        const settingsDoc = await getDoc(settingsRef);
  
        if (settingsDoc.exists()) {
          return settingsDoc.data() as WorkspaceBackupSettings;
        }
  
        // Return default settings
        return {
          autoBackup: true,
          backupFrequency: 'daily',
          retentionDays: 30,
          encryptionEnabled: true,
          compressionEnabled: true,
          notificationsEnabled: true
        };
      } catch (error) {
        console.error('Error getting backup settings:', error);
        throw error;
      }
    }
  
    /**
     * Update workspace backup settings
     */
    static async updateBackupSettings(
      workspaceId: string,
      settings: Partial<WorkspaceBackupSettings>
    ): Promise<void> {
      try {
        const settingsRef = doc(db, this.SETTINGS_COLLECTION, workspaceId);
        await setDoc(settingsRef, settings, { merge: true });
      } catch (error) {
        console.error('Error updating backup settings:', error);
        throw error;
      }
    }

    /**
     * Clean up old backups based on retention policy
     */
    static async cleanupOldBackups(workspaceId: string, retentionDays: number): Promise<number> {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const backupsQuery = query(
          collection(db, this.BACKUP_COLLECTION),
          where('workspaceId', '==', workspaceId),
          where('timestamp', '<', cutoffDate)
        );

        const snapshot = await getDocs(backupsQuery);
        let deletedCount = 0;

        for (const backupDoc of snapshot.docs) {
          const backupData = backupDoc.data() as DatabaseBackup;
          
          // Delete from Firebase Storage if URL exists
          if (backupData.downloadUrl) {
            try {
              const storageRef = ref(storage, `backups/${workspaceId}/${backupData.id}.json`);
              await deleteObject(storageRef);
            } catch (storageError) {
              console.warn('Failed to delete backup from storage:', storageError);
            }
          }

          // Delete from Firestore
          await deleteDoc(backupDoc.ref);
          deletedCount++;
        }

        return deletedCount;
      } catch (error) {
        console.error('Error cleaning up old backups:', error);
        throw error;
      }
    }
  }