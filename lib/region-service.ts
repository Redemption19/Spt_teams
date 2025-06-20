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
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { Region } from './types';
import { ActivityService } from './activity-service';

export class RegionService {
  
  /**
   * Create a new region
   */
  static async createRegion(
    regionData: Omit<Region, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<string> {
    try {
      const regionRef = doc(collection(db, 'regions'));
      const regionId = regionRef.id;
      
      const region: Region = {
        ...regionData,
        id: regionId,
        branches: regionData.branches || [],
        adminIds: regionData.adminIds || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(regionRef, region);
      
      // Log activity
      try {
        await ActivityService.logActivity(
          'region_created',
          'region',
          regionId,
          {
            targetName: regionData.name,
            description: regionData.description,
          },
          regionData.workspaceId,
          createdBy
        );
      } catch (activityError) {
        console.error('Error logging region creation activity:', activityError);
        // Don't throw - activity logging failure shouldn't break region creation
      }
      
      return regionId;
    } catch (error) {
      console.error('Error creating region:', error);
      throw error;
    }
  }

  /**
   * Get region by ID
   */
  static async getRegion(regionId: string): Promise<Region | null> {
    try {
      const regionRef = doc(db, 'regions', regionId);
      const regionSnap = await getDoc(regionRef);
      
      if (regionSnap.exists()) {
        const data = regionSnap.data();
        return {
          id: regionSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as Region;
      }
      return null;
    } catch (error) {
      console.error('Error fetching region:', error);
      throw error;
    }
  }
  /**
   * Get all regions in a workspace
   */
  static async getWorkspaceRegions(workspaceId: string): Promise<Region[]> {
    try {
      const regionsRef = collection(db, 'regions');
      
      // For development: remove orderBy to avoid index requirement
      // In production, add the composite index and use the commented query below
      const q = query(
        regionsRef,
        where('workspaceId', '==', workspaceId)
      );
      
      // Production query (requires composite index):
      // const q = query(
      //   regionsRef,
      //   where('workspaceId', '==', workspaceId),
      //   orderBy('createdAt', 'desc')
      // );
      
      const querySnapshot = await getDocs(q);
      const regions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as Region;
      });
      
      // Sort in memory for development
      return regions.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error fetching workspace regions:', error);
      throw error;
    }
  }

  /**
   * Update region
   */
  static async updateRegion(regionId: string, updates: Partial<Region>, updatedBy?: string): Promise<void> {
    try {
      const regionRef = doc(db, 'regions', regionId);
      
      // Get current region data for activity logging
      const currentRegion = await this.getRegion(regionId);
      
      // Filter out undefined values
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      await updateDoc(regionRef, {
        ...cleanUpdates,
        updatedAt: new Date(),
      });

      // Log activity
      if (updatedBy && currentRegion) {
        try {
          await ActivityService.logActivity(
            'region_updated',
            'region',
            regionId,
            {
              targetName: updates.name || currentRegion.name,
              changes: Object.keys(cleanUpdates),
              previousValues: Object.keys(cleanUpdates).reduce((prev, key) => {
                prev[key] = currentRegion[key as keyof Region];
                return prev;
              }, {} as Record<string, any>),
            },
            currentRegion.workspaceId,
            updatedBy
          );
        } catch (activityError) {
          console.error('Error logging region update activity:', activityError);
          // Don't throw - activity logging failure shouldn't break region update
        }
      }
    } catch (error) {
      console.error('Error updating region:', error);
      throw error;
    }
  }

  /**
   * Delete region
   */
  static async deleteRegion(regionId: string, deletedBy?: string): Promise<void> {
    try {
      // Get region data before deletion for activity logging
      const region = await this.getRegion(regionId);
      
      const regionRef = doc(db, 'regions', regionId);
      await deleteDoc(regionRef);
      
      // Log activity
      if (deletedBy && region) {
        try {
          await ActivityService.logActivity(
            'region_deleted',
            'region',
            regionId,
            {
              targetName: region.name,
              description: region.description,
              hadBranches: region.branches?.length || 0,
            },
            region.workspaceId,
            deletedBy
          );
        } catch (activityError) {
          console.error('Error logging region deletion activity:', activityError);
          // Don't throw - activity logging failure shouldn't break region deletion
        }
      }
      
      // Note: In production, you'd also want to update/reassign branches
    } catch (error) {
      console.error('Error deleting region:', error);
      throw error;
    }
  }

  /**
   * Add branch to region
   */
  static async addBranchToRegion(regionId: string, branchId: string): Promise<void> {
    try {
      const region = await this.getRegion(regionId);
      if (!region) {
        throw new Error('Region not found');
      }

      const updatedBranches = [...(region.branches || []), branchId];
      await this.updateRegion(regionId, { branches: updatedBranches });
    } catch (error) {
      console.error('Error adding branch to region:', error);
      throw error;
    }
  }

  /**
   * Remove branch from region
   */
  static async removeBranchFromRegion(regionId: string, branchId: string): Promise<void> {
    try {
      const region = await this.getRegion(regionId);
      if (!region) {
        throw new Error('Region not found');
      }

      const updatedBranches = (region.branches || []).filter(id => id !== branchId);
      await this.updateRegion(regionId, { branches: updatedBranches });
    } catch (error) {
      console.error('Error removing branch from region:', error);
      throw error;
    }
  }
}
