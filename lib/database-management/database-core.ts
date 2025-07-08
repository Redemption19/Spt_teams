// lib/database-core.ts
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';
import { db, storage } from '../firebase';

export interface DatabaseBackup {
  id: string;
  workspaceId: string;
  createdBy: string;
  timestamp: Date;
  backupType: 'full' | 'incremental' | 'differential';
  compression: 'none' | 'gzip' | 'zip';
  size: number;
  collections: string[];
  status: 'completed' | 'failed' | 'in-progress';
  downloadUrl?: string;
  metadata: {
    userCount: number;
    projectCount: number;
    taskCount: number;
    teamCount: number;
    reportCount: number;
  };
}

// Private helper methods (moved from original file to be accessible within DatabaseService)
async function collectWorkspaceData(
  workspaceId: string,
  options: any
): Promise<Record<string, any[]>> {
  const collections: Record<string, any[]> = {};

  // Collect from main collections
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
}

async function restoreWorkspaceData(
  workspaceId: string,
  collections: Record<string, any[]>,
  options: any
): Promise<void> {
  const batch = writeBatch(db);

  for (const [collectionName, documents] of Object.entries(collections)) {
    for (const document of documents) {
      const docRef = doc(db, collectionName, document.id);
      const documentData = document as Record<string, any>;
      batch.set(docRef, { ...documentData, workspaceId });
    }
  }

  await batch.commit();
}

async function logRestoreActivity(
  workspaceId: string,
  userId: string,
  backupId: string
): Promise<void> {
  // Log restore activity for audit trail
  const activityRef = doc(collection(db, 'activityLogs'));
  await setDoc(activityRef, {
    workspaceId,
    userId,
    action: 'database_restore',
    details: { backupId },
    timestamp: serverTimestamp()
  });
}

export class DatabaseService {
  protected static readonly BACKUP_COLLECTION = 'database_backups';
  protected static readonly HEALTH_COLLECTION = 'database_health';
  protected static readonly SETTINGS_COLLECTION = 'database_settings';

  /**
   * Create a comprehensive database backup
   */
  static async createBackup(
    workspaceId: string,
    userId: string,
    options: {
      backupType: 'full' | 'incremental' | 'differential';
      compression: 'none' | 'gzip' | 'zip';
      includeFiles?: boolean;
      includeUsers?: boolean;
      includeSettings?: boolean;
    }
  ): Promise<DatabaseBackup> {
    try {
      const backupId = `backup_${workspaceId}_${Date.now()}`;
      const backupRef = doc(db, this.BACKUP_COLLECTION, backupId);

      // Create backup record first
      const backup: DatabaseBackup = {
        id: backupId,
        workspaceId,
        createdBy: userId,
        timestamp: new Date(),
        backupType: options.backupType,
        compression: options.compression,
        size: 0,
        collections: [],
        status: 'in-progress',
        metadata: {
          userCount: 0,
          projectCount: 0,
          taskCount: 0,
          teamCount: 0,
          reportCount: 0
        }
      };

      await setDoc(backupRef, backup);

      // Collect data from all collections
      const collections = await collectWorkspaceData(workspaceId, options);
      
      // Compress and store backup data
      const backupData = {
        workspaceId,
        timestamp: new Date(),
        collections,
        metadata: backup.metadata
      };

      // Try to upload to Firebase Storage first
      let downloadUrl: string | undefined;
      let backupSize = 0;

      try {
        const storageRef = ref(storage, `backups/${workspaceId}/${backupId}.json`);
        const jsonData = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        
        const uploadResult = await uploadBytes(storageRef, blob);
        downloadUrl = await getDownloadURL(uploadResult.ref);
        backupSize = blob.size;

        console.log('✅ Backup uploaded to Firebase Storage successfully');
      } catch (storageError) {
        console.warn('⚠️ Firebase Storage upload failed, storing in Firestore as fallback:', storageError);
        
        // Fallback: Store backup data directly in Firestore
        const fallbackBackupRef = doc(db, `${this.BACKUP_COLLECTION}_data`, backupId);
        await setDoc(fallbackBackupRef, {
          backupId,
          data: backupData,
          createdAt: serverTimestamp()
        });
        
        backupSize = JSON.stringify(backupData).length;
        downloadUrl = undefined; // No download URL for Firestore-stored backups
      }

      // Update backup record
      const updatedBackup: Partial<DatabaseBackup> = {
        size: backupSize,
        collections: Object.keys(collections),
        status: 'completed',
        downloadUrl,
        metadata: backup.metadata
      };

      await updateDoc(backupRef, updatedBackup);

      return { ...backup, ...updatedBackup };
    } catch (error) {
      console.error('Backup failed:', error);
      throw new Error(`Backup failed: ${error}`);
    }
  }

  /**
   * Restore database from backup
   */
  static async restoreBackup(
    workspaceId: string,
    userId: string,
    backupId: string,
    options: {
      conflictResolution: 'overwrite' | 'skip' | 'merge';
      restoreType: 'full' | 'selective';
    }
  ): Promise<boolean> {
    try {
      // Get backup data
      const backupRef = doc(db, this.BACKUP_COLLECTION, backupId);
      const backupDoc = await getDoc(backupRef);
      
      if (!backupDoc.exists()) {
        throw new Error('Backup not found');
      }

      const backup = backupDoc.data() as DatabaseBackup;

      // Download backup data from storage
      const storageRef = ref(storage, `backups/${workspaceId}/${backupId}.json`);
      const response = await fetch(backup.downloadUrl!);
      const backupData = await response.json();

      // Restore data to Firestore
      await restoreWorkspaceData(workspaceId, backupData.collections, options);

      // Log restore activity
      await logRestoreActivity(workspaceId, userId, backupId);

      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      throw new Error(`Restore failed: ${error}`);
    }
  }

  /**
   * Download backup file with proper CORS handling
   */
  static async downloadBackup(backupId: string, workspaceId: string): Promise<Blob> {
    try {
      const storageRef = ref(storage, `backups/${workspaceId}/${backupId}.json`);
      
      // Use Firebase Storage SDK to get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Fetch the file using the Firebase SDK
      const response = await fetch(downloadURL);
      
      if (!response.ok) {
        throw new Error(`Failed to download backup: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Download error:', error);
      throw new Error(`Failed to download backup: ${error}`);
    }
  }

  /**
   * Get backup data from Firestore fallback if storage download fails
   */
  static async getBackupFromFirestore(backupId: string): Promise<any> {
    try {
      const backupDataRef = doc(db, `${this.BACKUP_COLLECTION}_data`, backupId);
      const backupDataDoc = await getDoc(backupDataRef);
      
      if (!backupDataDoc.exists()) {
        throw new Error('Backup data not found in Firestore');
      }
      
      return backupDataDoc.data();
    } catch (error) {
      console.error('Error getting backup from Firestore:', error);
      throw error;
    }
  }

  /**
   * Get available backups for workspace
   */
  static async getWorkspaceBackups(workspaceId: string): Promise<DatabaseBackup[]> {
    try {
      const backupsQuery = query(
        collection(db, this.BACKUP_COLLECTION),
        where('workspaceId', '==', workspaceId),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(backupsQuery);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as DatabaseBackup[];
    } catch (error) {
      console.error('Error getting workspace backups:', error);
      return [];
    }
  }

  /**
   * Delete old backups based on retention policy
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
      const batch = writeBatch(db);
      let deletedCount = 0;

      for (const backupDoc of snapshot.docs) {
        const backup = backupDoc.data() as DatabaseBackup;
        
        // Delete from storage
        if (backup.downloadUrl) {
          const storageRef = ref(storage, `backups/${workspaceId}/${backup.id}.json`);
          await deleteObject(storageRef);
        }

        // Delete from Firestore
        batch.delete(backupDoc.ref);
        deletedCount++;
      }

      await batch.commit();
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
      return 0;
    }
  }

  /**
   * Get the latest backup for a workspace
   */
  static async getLatestBackup(workspaceId: string): Promise<DatabaseBackup | null> {
    try {
      const backupsQuery = query(
        collection(db, this.BACKUP_COLLECTION),
        where('workspaceId', '==', workspaceId),
        where('status', '==', 'completed'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(backupsQuery);
      if (snapshot.empty) {
        return null;
      }

      const backupDoc = snapshot.docs[0];
      return {
        ...backupDoc.data(),
        timestamp: backupDoc.data().timestamp.toDate()
      } as DatabaseBackup;
    } catch (error) {
      console.error('Error getting latest backup:', error);
      return null;
    }
  }
}