'use client';

import { BudgetTrackingService } from './budget-tracking-service';
import { DepartmentService } from './department-service';
import { UserService } from './user-service';
import { ProjectService } from './project-service';
import { WorkspaceService } from './workspace-service';
import { costCenterCache } from './cost-center-cache';
import { CostCenterWithDetails, Department, User } from '@/components/financial/types';

interface WorkspaceData {
  costCenters: any[];
  departments: Department[];
  users: User[];
  projects: any[];
}

interface LoadDataOptions {
  useCache?: boolean;
  forceRefresh?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

export class CostCenterDataService {
  private static loadingPromises = new Map<string, Promise<WorkspaceData>>();
  private static batchedRequests = new Map<string, {
    promise: Promise<any>;
    resolver: (data: any) => void;
    rejector: (error: any) => void;
  }>();

  /**
   * Load data for a single workspace with caching
   */
  static async loadWorkspaceData(
    workspaceId: string, 
    options: LoadDataOptions = {}
  ): Promise<WorkspaceData> {
    const { useCache = true, forceRefresh = false } = options;

    // Check cache first
    if (useCache && !forceRefresh) {
      const cached = costCenterCache.getWorkspaceData(workspaceId);
      if (cached) {
        return cached;
      }
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(workspaceId);
    if (existingPromise) {
      return existingPromise;
    }

    // Create new loading promise
    const loadPromise = this.fetchWorkspaceData(workspaceId);
    this.loadingPromises.set(workspaceId, loadPromise);

    try {
      const data = await loadPromise;
      
      // Cache the result
      if (useCache) {
        costCenterCache.setWorkspaceData(workspaceId, data);
      }
      
      return data;
    } catch (error) {
      throw error;
    } finally {
      // Clean up loading promise
      this.loadingPromises.delete(workspaceId);
    }
  }

  /**
   * Fetch workspace data from services
   */
  private static async fetchWorkspaceData(workspaceId: string): Promise<WorkspaceData> {
    try {
      // Load all data in parallel
      const [costCenters, departments, users, projects] = await Promise.all([
        BudgetTrackingService.getWorkspaceCostCenters(workspaceId),
        DepartmentService.getWorkspaceDepartments(workspaceId),
        UserService.getUsersByWorkspace(workspaceId),
        ProjectService.getWorkspaceProjects(workspaceId)
      ]);

      return {
        costCenters,
        departments,
        users,
        projects
      };
    } catch (error) {
      console.error(`Error fetching data for workspace ${workspaceId}:`, error);
      throw error;
    }
  }

  /**
   * Load data for multiple workspaces efficiently
   */
  static async loadMultipleWorkspaces(
    workspaceIds: string[],
    options: LoadDataOptions = {}
  ): Promise<{
    allCostCenters: any[];
    allDepartments: Department[];
    allUsers: User[];
    allProjects: any[];
    errors: string[];
  }> {
    const { useCache = true, forceRefresh = false } = options;
    
    const result = {
      allCostCenters: [] as any[],
      allDepartments: [] as Department[],
      allUsers: [] as User[],
      allProjects: [] as any[],
      errors: [] as string[]
    };

    // Process workspaces in batches of 3 for better performance
    const BATCH_SIZE = 3;
    const batches = [];
    for (let i = 0; i < workspaceIds.length; i += BATCH_SIZE) {
      batches.push(workspaceIds.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (workspaceId) => {
        try {
          return await this.loadWorkspaceData(workspaceId, { useCache, forceRefresh });
        } catch (error) {
          result.errors.push(`Error loading workspace ${workspaceId}: ${error}`);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);

      // Merge results and deduplicate
      for (const workspaceData of batchResults) {
        if (!workspaceData) continue;

        // Add cost centers
        result.allCostCenters.push(...workspaceData.costCenters);

        // Add departments (deduplicate by ID)
        workspaceData.departments.forEach(dept => {
          if (!result.allDepartments.some(d => d.id === dept.id)) {
            result.allDepartments.push(dept);
          }
        });

        // Add users (deduplicate by ID)
        workspaceData.users.forEach(user => {
          if (!result.allUsers.some(u => u.id === user.id)) {
            result.allUsers.push(user);
          }
        });

        // Add projects (deduplicate by ID)
        workspaceData.projects.forEach(project => {
          if (!result.allProjects.some(p => p.id === project.id)) {
            result.allProjects.push(project);
          }
        });
      }
    }

    return result;
  }

  /**
   * Get enhanced cost centers with lookup data
   */
  static async getEnhancedCostCenters(
    userId: string,
    currentWorkspaceId: string,
    options: LoadDataOptions = {}
  ): Promise<{
    costCenters: CostCenterWithDetails[];
    departments: Department[];
    users: User[];
    errors: string[];
  }> {
    try {
      // Get accessible workspaces
      const { mainWorkspaces, subWorkspaces } = await WorkspaceService.getUserAccessibleWorkspaces(userId);
      const workspaceIds = [
        ...mainWorkspaces.map(ws => ws.id),
        ...Object.values(subWorkspaces).flat().map(ws => ws.id)
      ];

      // Load data from all workspaces
      const { allCostCenters, allDepartments, allUsers, allProjects, errors } = 
        await this.loadMultipleWorkspaces(workspaceIds, options);

      // Create lookup maps for performance
      const departmentMap = new Map(allDepartments.map(d => [d.id, d.name]));
      const userMap = new Map(allUsers.map(u => [u.id, u.name || u.email || u.id]));

      // Calculate project counts by workspace
      const projectCountMap = new Map<string, number>();
      allProjects.forEach(project => {
        const count = projectCountMap.get(project.workspaceId) || 0;
        projectCountMap.set(project.workspaceId, count + 1);
      });

      // Enhance cost centers with additional details
      const enhancedCostCenters: CostCenterWithDetails[] = allCostCenters.map(center => ({
        ...center,
        departmentName: center.departmentId ? departmentMap.get(center.departmentId) : undefined,
        managerName: center.managerId ? userMap.get(center.managerId) : undefined,
        currentSpent: 0, // TODO: Calculate from expenses
        projects: center.projectId ? 1 : (projectCountMap.get(center.workspaceId) || 0),
        teams: 0, // TODO: Calculate from teams
        employees: 0 // TODO: Calculate from users
      }));

      return {
        costCenters: enhancedCostCenters,
        departments: allDepartments,
        users: allUsers,
        errors
      };

    } catch (error) {
      console.error('Error getting enhanced cost centers:', error);
      throw error;
    }
  }

  /**
   * Preload data for common operations
   */
  static async preloadData(workspaceIds: string[]): Promise<void> {
    try {
      // Load first workspace immediately, others in background
      if (workspaceIds.length > 0) {
        await this.loadWorkspaceData(workspaceIds[0]);
        
        // Load remaining workspaces in background
        if (workspaceIds.length > 1) {
          Promise.all(
            workspaceIds.slice(1).map(id => this.loadWorkspaceData(id))
          ).catch(console.error);
        }
      }
    } catch (error) {
      console.error('Error preloading data:', error);
    }
  }

  /**
   * Invalidate cache for specific workspace
   */
  static invalidateWorkspaceCache(workspaceId: string): void {
    costCenterCache.invalidateWorkspace(workspaceId);
    this.loadingPromises.delete(workspaceId);
  }

  /**
   * Invalidate all caches
   */
  static invalidateAllCache(): void {
    costCenterCache.invalidateAll();
    this.loadingPromises.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): any {
    return {
      cache: costCenterCache.getStats(),
      activeLoads: this.loadingPromises.size,
    };
  }
} 