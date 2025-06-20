'use client';

import { 
  doc, 
  collection,
  addDoc,
  updateDoc, 
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { Branch, User, Region } from './types';
import { ActivityService } from './activity-service';

export class BranchService {
  /**
   * Create a new branch
   */
  static async createBranch(branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>, createdBy?: string): Promise<string> {
    try {
      const branchesRef = collection(db, 'branches');
      
      const newBranch = {
        ...branchData,
        userIds: [],
        teamIds: [],
        metrics: {
          totalUsers: 0,
          activeProjects: 0,
          completedTasks: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(branchesRef, newBranch);
      
      // Update region to include this branch
      if (branchData.regionId) {
        const regionRef = doc(db, 'regions', branchData.regionId);
        await updateDoc(regionRef, {
          branches: [...await this.getRegionBranches(branchData.regionId), docRef.id],
          updatedAt: serverTimestamp(),
        });
      }

      // Log activity
      if (createdBy) {
        try {
          await ActivityService.logActivity(
            'branch_created',
            'branch',
            docRef.id,
            {
              targetName: branchData.name,
              regionId: branchData.regionId,
              managerId: branchData.managerId,
            },
            branchData.workspaceId,
            createdBy
          );
        } catch (activityError) {
          console.error('Error logging branch creation activity:', activityError);
          // Don't throw - activity logging failure shouldn't break branch creation
        }
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw new Error('Failed to create branch');
    }
  }  /**
   * Get all branches for a workspace
   */
  static async getBranches(workspaceId: string): Promise<Branch[]> {
    try {
      const branchesRef = collection(db, 'branches');
      
      // Try to get branches with the actual workspace ID first
      let q = query(branchesRef, where('workspaceId', '==', workspaceId));
      let querySnapshot = await getDocs(q);
      
      // If no branches found with actual workspace ID, try hardcoded fallbacks
      // This is a temporary fix for development
      if (querySnapshot.empty) {
        console.log('No branches found with workspace ID:', workspaceId);
        console.log('Trying fallback workspace IDs...');
        
        const fallbackIds = ['default-workspace', 'current-workspace'];
        for (const fallbackId of fallbackIds) {
          q = query(branchesRef, where('workspaceId', '==', fallbackId));
          querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            console.log('Found branches with fallback ID:', fallbackId);
            break;
          }
        }
      }      
      const branches: Branch[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        branches.push({
          id: doc.id,
          ...data,
          // Ensure userIds and teamIds arrays exist
          userIds: data.userIds || [],
          teamIds: data.teamIds || [],
          adminIds: data.adminIds || [],
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Branch);
      });

      // Sort in memory instead of using orderBy in query
      return branches.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting branches:', error);
      throw new Error('Failed to get branches');
    }
  }

  /**
   * Get all branches for a workspace (alias for getBranches)
   */
  static async getWorkspaceBranches(workspaceId: string): Promise<Branch[]> {
    return this.getBranches(workspaceId);
  }

  /**
   * Get a single branch by ID
   */
  static async getBranch(branchId: string): Promise<Branch | null> {
    try {
      const branchRef = doc(db, 'branches', branchId);
      const branchSnap = await getDoc(branchRef);      if (branchSnap.exists()) {
        const data = branchSnap.data();
        return {
          id: branchSnap.id,
          ...data,
          // Ensure userIds and teamIds arrays exist
          userIds: data.userIds || [],
          teamIds: data.teamIds || [],
          adminIds: data.adminIds || [],
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Branch;
      }
      return null;
    } catch (error) {
      console.error('Error getting branch:', error);
      throw new Error('Failed to get branch');
    }
  }

  /**
   * Update branch information
   */
  static async updateBranch(branchId: string, updates: Partial<Branch>, updatedBy?: string): Promise<void> {
    try {
      const branchRef = doc(db, 'branches', branchId);
      
      // Get current branch data for activity logging
      const currentBranch = await this.getBranch(branchId);
      
      // Remove read-only fields
      const { id, createdAt, metrics, ...updateData } = updates;
      
      await updateDoc(branchRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      if (updatedBy && currentBranch) {
        try {
          await ActivityService.logActivity(
            'branch_updated',
            'branch',
            branchId,
            {
              targetName: updates.name || currentBranch.name,
              changes: Object.keys(updateData),
              previousValues: Object.keys(updateData).reduce((prev, key) => {
                prev[key] = currentBranch[key as keyof Branch];
                return prev;
              }, {} as Record<string, any>),
            },
            currentBranch.workspaceId,
            updatedBy
          );
        } catch (activityError) {
          console.error('Error logging branch update activity:', activityError);
          // Don't throw - activity logging failure shouldn't break branch update
        }
      }
    } catch (error) {
      console.error('Error updating branch:', error);
      throw new Error('Failed to update branch');
    }
  }

  /**
   * Delete a branch (with safety checks)
   */
  static async deleteBranch(branchId: string, deletedBy?: string): Promise<void> {
    try {
      const branch = await this.getBranch(branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }

      // Check if branch has users
      if (branch.userIds && branch.userIds.length > 0) {
        throw new Error('Cannot delete branch with assigned users. Please reassign users first.');
      }

      // Check if branch has active teams
      if (branch.teamIds && branch.teamIds.length > 0) {
        throw new Error('Cannot delete branch with active teams. Please reassign teams first.');
      }

      const batch = writeBatch(db);

      // Remove branch
      const branchRef = doc(db, 'branches', branchId);
      batch.delete(branchRef);

      // Update region to remove this branch
      if (branch.regionId) {
        const regionBranches = await this.getRegionBranches(branch.regionId);
        const updatedBranches = regionBranches.filter(id => id !== branchId);
        
        const regionRef = doc(db, 'regions', branch.regionId);
        batch.update(regionRef, {
          branches: updatedBranches,
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();

      // Log activity
      if (deletedBy) {
        try {
          await ActivityService.logActivity(
            'branch_deleted',
            'branch',
            branchId,
            {
              targetName: branch.name,
              regionId: branch.regionId,
              hadUsers: branch.userIds?.length || 0,
              hadTeams: branch.teamIds?.length || 0,
            },
            branch.workspaceId,
            deletedBy
          );
        } catch (activityError) {
          console.error('Error logging branch deletion activity:', activityError);
          // Don't throw - activity logging failure shouldn't break branch deletion
        }
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error; // Re-throw to preserve the specific error message
    }
  }

  /**
   * Assign user to a branch
   */
  static async assignUserToBranch(userId: string, branchId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Update branch
      const branchRef = doc(db, 'branches', branchId);
      const branch = await this.getBranch(branchId);
      
      if (!branch) {
        throw new Error('Branch not found');
      }

      const updatedUserIds = [...(branch.userIds || [])];
      if (!updatedUserIds.includes(userId)) {
        updatedUserIds.push(userId);
      }

      batch.update(branchRef, {
        userIds: updatedUserIds,
        'metrics.totalUsers': increment(1),
        updatedAt: serverTimestamp(),
      });

      // Update user
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        branchId: branchId,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error('Error assigning user to branch:', error);
      throw new Error('Failed to assign user to branch');
    }
  }

  /**
   * Remove user from a branch
   */
  static async removeUserFromBranch(userId: string, branchId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Update branch
      const branchRef = doc(db, 'branches', branchId);
      const branch = await this.getBranch(branchId);
      
      if (!branch) {
        throw new Error('Branch not found');
      }

      const updatedUserIds = (branch.userIds || []).filter(id => id !== userId);

      batch.update(branchRef, {
        userIds: updatedUserIds,
        'metrics.totalUsers': increment(-1),
        updatedAt: serverTimestamp(),
      });

      // Update user
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        branchId: null,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error('Error removing user from branch:', error);
      throw new Error('Failed to remove user from branch');
    }
  }

  /**
   * Assign manager to a branch
   */
  static async assignBranchManager(branchId: string, managerId: string): Promise<void> {
    try {
      const branchRef = doc(db, 'branches', branchId);
      
      await updateDoc(branchRef, {
        managerId: managerId,
        updatedAt: serverTimestamp(),
      });

      // Also ensure the manager is assigned to the branch
      await this.assignUserToBranch(managerId, branchId);
    } catch (error) {
      console.error('Error assigning branch manager:', error);
      throw new Error('Failed to assign branch manager');
    }
  }

  /**
   * Get branches by region
   */
  static async getBranchesByRegion(regionId: string): Promise<Branch[]> {
    try {
      const branchesRef = collection(db, 'branches');
      const q = query(
        branchesRef,
        where('regionId', '==', regionId),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const branches: Branch[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        branches.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Branch);
      });

      return branches;
    } catch (error) {
      console.error('Error getting branches by region:', error);
      throw new Error('Failed to get branches by region');
    }
  }

  /**
   * Get users assigned to a branch
   */
  static async getBranchUsers(branchId: string): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('branchId', '==', branchId),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const users: User[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          lastActive: data.lastActive?.toDate(),
        } as User);
      });

      return users;
    } catch (error) {
      console.error('Error getting branch users:', error);
      throw new Error('Failed to get branch users');
    }
  }

  /**
   * Get branch statistics
   */
  static async getBranchStats(branchId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalTeams: number;
    activeProjects: number;
    completedTasks: number;
  }> {
    try {
      const branch = await this.getBranch(branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }

      const users = await this.getBranchUsers(branchId);
      const activeUsers = users.filter(user => user.status === 'active').length;

      // Get teams count
      const teamsRef = collection(db, 'teams');
      const teamsQuery = query(teamsRef, where('branchIds', 'array-contains', branchId));
      const teamsSnapshot = await getDocs(teamsQuery);

      // Get projects count
      const projectsRef = collection(db, 'projects');
      const projectsQuery = query(projectsRef, where('branchId', '==', branchId), where('status', '==', 'active'));
      const projectsSnapshot = await getDocs(projectsQuery);

      return {
        totalUsers: users.length,
        activeUsers,
        totalTeams: teamsSnapshot.size,
        activeProjects: projectsSnapshot.size,
        completedTasks: branch.metrics?.completedTasks || 0,
      };
    } catch (error) {
      console.error('Error getting branch stats:', error);
      throw new Error('Failed to get branch statistics');
    }
  }

  /**
   * Search branches by name or location
   */
  static async searchBranches(workspaceId: string, searchTerm: string): Promise<Branch[]> {
    try {
      const branches = await this.getBranches(workspaceId);
      
      return branches.filter(branch => 
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.address?.state?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching branches:', error);
      throw new Error('Failed to search branches');
    }
  }

  /**
   * Transfer users between branches
   */
  static async transferUsersBetweenBranches(userIds: string[], fromBranchId: string, toBranchId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Update users
      for (const userId of userIds) {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          branchId: toBranchId,
          updatedAt: serverTimestamp(),
        });
      }

      // Update from branch
      const fromBranchRef = doc(db, 'branches', fromBranchId);
      const fromBranch = await this.getBranch(fromBranchId);
      if (fromBranch) {
        const fromUpdatedUserIds = fromBranch.userIds?.filter(id => !userIds.includes(id)) || [];
        batch.update(fromBranchRef, {
          userIds: fromUpdatedUserIds,
          'metrics.totalUsers': increment(-userIds.length),
          updatedAt: serverTimestamp(),
        });
      }

      // Update to branch
      const toBranchRef = doc(db, 'branches', toBranchId);
      const toBranch = await this.getBranch(toBranchId);
      if (toBranch) {
        const toUpdatedUserIds = [...(toBranch.userIds || []), ...userIds];
        batch.update(toBranchRef, {
          userIds: toUpdatedUserIds,
          'metrics.totalUsers': increment(userIds.length),
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error transferring users between branches:', error);
      throw new Error('Failed to transfer users between branches');
    }
  }

  /**
   * Create a new region
   */
  static async createRegion(regionData: Omit<Region, 'id' | 'createdAt' | 'updatedAt'>, createdBy?: string): Promise<string> {
    try {
      const regionsRef = collection(db, 'regions');
      
      const newRegion = {
        ...regionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(regionsRef, newRegion);

      // Log activity
      if (createdBy) {
        try {
          await ActivityService.logActivity(
            'region_created',
            'region',
            docRef.id,
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
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating region:', error);
      throw new Error('Failed to create region');
    }
  }

  /**
   * Get all regions
   */  static async getAllRegions(): Promise<Region[]> {
    try {
      const regionsRef = collection(db, 'regions');
      // Simplified query to avoid index requirements
      const querySnapshot = await getDocs(regionsRef);
      
      const regions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Region[];
      
      // Sort in memory instead of using orderBy in query
      return regions.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting regions:', error);
      throw new Error('Failed to fetch regions');
    }
  }

  /**
   * Get a specific region
   */
  static async getRegion(regionId: string): Promise<Region | null> {
    try {
      const regionRef = doc(db, 'regions', regionId);
      const regionSnap = await getDoc(regionRef);
      
      if (regionSnap.exists()) {
        return {
          id: regionSnap.id,
          ...regionSnap.data(),
          createdAt: regionSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: regionSnap.data().updatedAt?.toDate() || new Date(),
        } as Region;
      }
      return null;
    } catch (error) {
      console.error('Error getting region:', error);
      throw new Error('Failed to fetch region');
    }
  }

  /**
   * Update a region
   */
  static async updateRegion(regionId: string, updateData: Partial<Omit<Region, 'id' | 'createdAt' | 'updatedAt'>>, updatedBy?: string): Promise<void> {
    try {
      const regionRef = doc(db, 'regions', regionId);
      
      // Get current region data for activity logging
      const currentRegion = await this.getRegion(regionId);
      
      await updateDoc(regionRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      if (updatedBy && currentRegion) {
        try {
          await ActivityService.logActivity(
            'region_updated',
            'region',
            regionId,
            {
              targetName: updateData.name || currentRegion.name,
              changes: Object.keys(updateData),
              previousValues: Object.keys(updateData).reduce((prev, key) => {
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
      throw new Error('Failed to update region');
    }
  }

  /**
   * Delete a region
   */
  static async deleteRegion(regionId: string, deletedBy?: string): Promise<void> {
    try {
      // Get region data before deletion for activity logging
      const region = await this.getRegion(regionId);
      
      // Check if region has branches
      const branches = await this.getBranchesByRegion(regionId);
      if (branches.length > 0) {
        throw new Error('Cannot delete region with existing branches');
      }

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
              hadBranches: branches.length,
            },
            region.workspaceId,
            deletedBy
          );
        } catch (activityError) {
          console.error('Error logging region deletion activity:', activityError);
          // Don't throw - activity logging failure shouldn't break region deletion
        }
      }
    } catch (error) {
      console.error('Error deleting region:', error);
      throw new Error('Failed to delete region');
    }
  }  /**
   * Get potential managers (users with admin/owner roles)
   */
  static async getPotentialManagers(): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      // Simplified query to avoid index requirements
      const managersQuery = query(usersRef, where('role', 'in', ['admin', 'owner']));
      const querySnapshot = await getDocs(managersQuery);
      
      const managers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastActive: doc.data().lastActive?.toDate() || new Date(),
        dateOfBirth: doc.data().dateOfBirth?.toDate(),
      })) as User[];
      
      // Sort in memory instead of using orderBy in query
      return managers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (error) {
      console.error('Error getting potential managers:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  /**
   * Create sample managers for testing
   */
  static async createSampleManagers(): Promise<void> {
    try {
      const usersRef = collection(db, 'users');
      const sampleManagers = [
        {
          email: 'john.doe@company.com',
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin',
          status: 'active',
          jobTitle: 'Regional Manager',
          department: 'Operations',
          workspaceId: 'current-workspace',
          teamIds: [],
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        },
        {
          email: 'sarah.wilson@company.com',
          name: 'Sarah Wilson',
          firstName: 'Sarah',
          lastName: 'Wilson',
          role: 'admin',
          status: 'active',
          jobTitle: 'Branch Manager',
          department: 'Operations',
          workspaceId: 'current-workspace',
          teamIds: [],
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        },
        {
          email: 'mike.chen@company.com',
          name: 'Mike Chen',
          firstName: 'Mike',
          lastName: 'Chen',
          role: 'admin',
          status: 'active',
          jobTitle: 'Area Manager',
          department: 'Operations',
          workspaceId: 'current-workspace',
          teamIds: [],
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        }
      ];

      for (const manager of sampleManagers) {
        await addDoc(usersRef, manager);
      }
    } catch (error) {
      console.error('Error creating sample managers:', error);
      throw new Error('Failed to create sample managers');
    }
  }

  /**
   * Create sample regions for testing
   */
  static async createSampleRegions(): Promise<void> {
    try {
      const regionsRef = collection(db, 'regions');
      const sampleRegions = [
        {
          name: 'Greater Accra',
          description: 'Capital region with main headquarters',
          workspaceId: 'current-workspace',
          branches: [],
          adminIds: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        {
          name: 'Ashanti',
          description: 'Northern operations center',
          workspaceId: 'current-workspace',
          branches: [],
          adminIds: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        {
          name: 'Eastern',
          description: 'Eastern region operations',
          workspaceId: 'current-workspace',
          branches: [],
          adminIds: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      ];

      for (const region of sampleRegions) {
        await addDoc(regionsRef, region);
      }
    } catch (error) {
      console.error('Error creating sample regions:', error);
      throw new Error('Failed to create sample regions');
    }
  }

  /**
   * Helper method to get region branches
   */
  private static async getRegionBranches(regionId: string): Promise<string[]> {
    try {
      const regionRef = doc(db, 'regions', regionId);
      const regionSnap = await getDoc(regionRef);
      
      if (regionSnap.exists()) {
        return regionSnap.data().branches || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting region branches:', error);
      return [];
    }
  }

  /**
   * Add a team to a branch's teamIds array
   */
  static async assignTeamToBranch(teamId: string, branchId: string): Promise<void> {
    try {
      const branchRef = doc(db, 'branches', branchId);
      const branchSnap = await getDoc(branchRef);
      
      if (!branchSnap.exists()) {
        throw new Error('Branch not found');
      }
      
      const branch = branchSnap.data() as Branch;
      const currentTeamIds = branch.teamIds || [];
      
      if (!currentTeamIds.includes(teamId)) {
        await updateDoc(branchRef, {
          teamIds: [...currentTeamIds, teamId],
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error assigning team to branch:', error);
      throw new Error('Failed to assign team to branch');
    }
  }

  /**
   * Remove a team from a branch's teamIds array
   */
  static async removeTeamFromBranch(teamId: string, branchId: string): Promise<void> {
    try {
      const branchRef = doc(db, 'branches', branchId);
      const branchSnap = await getDoc(branchRef);
      
      if (!branchSnap.exists()) {
        throw new Error('Branch not found');
      }
      
      const branch = branchSnap.data() as Branch;
      const updatedTeamIds = (branch.teamIds || []).filter(id => id !== teamId);
      
      await updateDoc(branchRef, {
        teamIds: updatedTeamIds,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error removing team from branch:', error);
      throw new Error('Failed to remove team from branch');
    }
  }

  /**
   * Update team assignment when a team's branchId changes
   */
  static async updateTeamBranchAssignment(teamId: string, oldBranchId: string | null, newBranchId: string | null): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Remove from old branch if it exists
      if (oldBranchId) {
        const oldBranchRef = doc(db, 'branches', oldBranchId);
        const oldBranchSnap = await getDoc(oldBranchRef);
        if (oldBranchSnap.exists()) {
          const oldBranch = oldBranchSnap.data() as Branch;
          const updatedOldTeamIds = (oldBranch.teamIds || []).filter(id => id !== teamId);
          batch.update(oldBranchRef, {
            teamIds: updatedOldTeamIds,
            updatedAt: serverTimestamp(),
          });
        }
      }
      
      // Add to new branch if it exists
      if (newBranchId) {
        const newBranchRef = doc(db, 'branches', newBranchId);
        const newBranchSnap = await getDoc(newBranchRef);
        if (newBranchSnap.exists()) {
          const newBranch = newBranchSnap.data() as Branch;
          const currentTeamIds = newBranch.teamIds || [];
          if (!currentTeamIds.includes(teamId)) {
            batch.update(newBranchRef, {
              teamIds: [...currentTeamIds, teamId],
              updatedAt: serverTimestamp(),
            });
          }
        }
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error updating team branch assignment:', error);
      throw new Error('Failed to update team branch assignment');
    }
  }

  /**
   * Sync existing teams and users with branches
   * This utility function updates branch documents to include correct teamIds and userIds
   * based on existing team.branchId and user.branchId relationships
   */
  static async syncBranchAssignments(workspaceId: string): Promise<void> {
    try {
      console.log('Starting branch assignments sync for workspace:', workspaceId);
      
      // Get all branches in workspace
      const branches = await this.getBranches(workspaceId);
        // Get all teams in workspace
      const teamsRef = collection(db, 'teams');
      const teamsQuery = query(teamsRef, where('workspaceId', '==', workspaceId));
      const teamsSnapshot = await getDocs(teamsQuery);
      const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Get all users in workspace
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, where('workspaceId', '==', workspaceId));
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Update each branch with correct teamIds and userIds
      for (const branch of branches) {
        const branchTeams = teams.filter(team => team.branchId === branch.id);
        const branchUsers = users.filter(user => user.branchId === branch.id);
        
        const teamIds = branchTeams.map(team => team.id);
        const userIds = branchUsers.map(user => user.id);
        
        console.log(`Branch ${branch.name}: syncing ${teamIds.length} teams and ${userIds.length} users`);
        
        // Update branch document
        const branchRef = doc(db, 'branches', branch.id);
        await updateDoc(branchRef, {
          teamIds,
          userIds,
          'metrics.totalUsers': userIds.length,
          updatedAt: serverTimestamp(),
        });
      }
      
      console.log('Branch assignments sync completed');
    } catch (error) {
      console.error('Error syncing branch assignments:', error);
      throw new Error('Failed to sync branch assignments');
    }
  }
}
