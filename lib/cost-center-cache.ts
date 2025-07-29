'use client';

import { CostCenterWithDetails, Department, User } from '@/components/financial/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

interface CostCenterCache {
  costCenters: Map<string, CacheEntry<any[]>>;
  departments: Map<string, CacheEntry<Department[]>>;
  users: Map<string, CacheEntry<User[]>>;
  projects: Map<string, CacheEntry<any[]>>;
  workspaceData: Map<string, CacheEntry<{
    costCenters: any[];
    departments: Department[];
    users: User[];
    projects: any[];
  }>>;
}

class CostCenterCacheService {
  private static instance: CostCenterCacheService;
  private cache: CostCenterCache;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly WORKSPACE_DATA_TTL = 3 * 60 * 1000; // 3 minutes

  private constructor() {
    this.cache = {
      costCenters: new Map(),
      departments: new Map(),
      users: new Map(),
      projects: new Map(),
      workspaceData: new Map(),
    };
  }

  static getInstance(): CostCenterCacheService {
    if (!CostCenterCacheService.instance) {
      CostCenterCacheService.instance = new CostCenterCacheService();
    }
    return CostCenterCacheService.instance;
  }

  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.expiresIn;
  }

  private set<T>(map: Map<string, CacheEntry<T>>, key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    map.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    });
  }

  private get<T>(map: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = map.get(key);
    if (!entry || !this.isValid(entry)) {
      map.delete(key);
      return null;
    }
    return entry.data;
  }

  // Cost Centers
  setCostCenters(workspaceId: string, data: any[]): void {
    this.set(this.cache.costCenters, workspaceId, data);
  }

  getCostCenters(workspaceId: string): any[] | null {
    return this.get(this.cache.costCenters, workspaceId);
  }

  // Departments
  setDepartments(workspaceId: string, data: Department[]): void {
    this.set(this.cache.departments, workspaceId, data);
  }

  getDepartments(workspaceId: string): Department[] | null {
    return this.get(this.cache.departments, workspaceId);
  }

  // Users
  setUsers(workspaceId: string, data: User[]): void {
    this.set(this.cache.users, workspaceId, data);
  }

  getUsers(workspaceId: string): User[] | null {
    return this.get(this.cache.users, workspaceId);
  }

  // Projects
  setProjects(workspaceId: string, data: any[]): void {
    this.set(this.cache.projects, workspaceId, data);
  }

  getProjects(workspaceId: string): any[] | null {
    return this.get(this.cache.projects, workspaceId);
  }

  // Complete workspace data (for batch operations)
  setWorkspaceData(workspaceId: string, data: {
    costCenters: any[];
    departments: Department[];
    users: User[];
    projects: any[];
  }): void {
    this.set(this.cache.workspaceData, workspaceId, data, this.WORKSPACE_DATA_TTL);
    
    // Also cache individual data types
    this.setCostCenters(workspaceId, data.costCenters);
    this.setDepartments(workspaceId, data.departments);
    this.setUsers(workspaceId, data.users);
    this.setProjects(workspaceId, data.projects);
  }

  getWorkspaceData(workspaceId: string): {
    costCenters: any[];
    departments: Department[];
    users: User[];
    projects: any[];
  } | null {
    return this.get(this.cache.workspaceData, workspaceId);
  }

  // Cache invalidation
  invalidateWorkspace(workspaceId: string): void {
    this.cache.costCenters.delete(workspaceId);
    this.cache.departments.delete(workspaceId);
    this.cache.users.delete(workspaceId);
    this.cache.projects.delete(workspaceId);
    this.cache.workspaceData.delete(workspaceId);
  }

  invalidateAll(): void {
    this.cache.costCenters.clear();
    this.cache.departments.clear();
    this.cache.users.clear();
    this.cache.projects.clear();
    this.cache.workspaceData.clear();
  }

  // Clear expired entries
  cleanup(): void {
    const cleanMap = <T>(map: Map<string, CacheEntry<T>>) => {
      for (const [key, entry] of map.entries()) {
        if (!this.isValid(entry)) {
          map.delete(key);
        }
      }
    };

    cleanMap(this.cache.costCenters);
    cleanMap(this.cache.departments);
    cleanMap(this.cache.users);
    cleanMap(this.cache.projects);
    cleanMap(this.cache.workspaceData);
  }

  // Get cache statistics
  getStats(): {
    costCenters: number;
    departments: number;
    users: number;
    projects: number;
    workspaceData: number;
    total: number;
  } {
    return {
      costCenters: this.cache.costCenters.size,
      departments: this.cache.departments.size,
      users: this.cache.users.size,
      projects: this.cache.projects.size,
      workspaceData: this.cache.workspaceData.size,
      total: this.cache.costCenters.size + this.cache.departments.size + 
             this.cache.users.size + this.cache.projects.size + this.cache.workspaceData.size,
    };
  }
}

export const costCenterCache = CostCenterCacheService.getInstance();

// Auto cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    costCenterCache.cleanup();
  }, 10 * 60 * 1000);
} 