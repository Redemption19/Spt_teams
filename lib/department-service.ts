import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { ActivityService } from './activity-service';

export interface Department {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  headId?: string; // Department head (user ID)
  headName?: string; // Cached department head name
  memberCount: number;
  color?: string; // Optional color for UI
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface DepartmentUser {
  id: string;
  userId: string;
  departmentId: string;
  userName: string;
  userEmail: string;
  userRole: 'owner' | 'admin' | 'member';
  departmentRole: 'head' | 'member';
  joinedAt: Date;
}

export class DepartmentService {
  // Simple cache for department data (3 minute TTL)
  private static departmentCache = new Map<string, { departments: Department[], timestamp: number }>();
  private static memberCache = new Map<string, { members: DepartmentUser[], timestamp: number }>();
  private static CACHE_TTL = 3 * 60 * 1000; // 3 minutes

  private static isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  private static getCachedDepartments(workspaceId: string): Department[] | null {
    const cached = this.departmentCache.get(workspaceId);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.departments;
    }
    return null;
  }

  private static setCachedDepartments(workspaceId: string, departments: Department[]): void {
    this.departmentCache.set(workspaceId, {
      departments: [...departments], // Clone array
      timestamp: Date.now()
    });
  }

  private static getCachedMembers(key: string): DepartmentUser[] | null {
    const cached = this.memberCache.get(key);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.members;
    }
    return null;
  }

  private static setCachedMembers(key: string, members: DepartmentUser[]): void {
    this.memberCache.set(key, {
      members: [...members], // Clone array
      timestamp: Date.now()
    });
  }

  // Clear cache when departments are modified
  private static clearCache(workspaceId?: string): void {
    if (workspaceId) {
      this.departmentCache.delete(workspaceId);
      // Clear member cache for this workspace
      for (const key of this.memberCache.keys()) {
        if (key.startsWith(`${workspaceId}:`)) {
          this.memberCache.delete(key);
        }
      }
    } else {
      this.departmentCache.clear();
      this.memberCache.clear();
    }
  }
  // Optimized batch loading for multiple departments' members
  static async getBatchDepartmentMembers(workspaceId: string, departmentIds: string[]): Promise<{[key: string]: DepartmentUser[]}> {
    try {
      const memberPromises = departmentIds.map(async (deptId) => {
        try {
          const members = await this.getDepartmentMembers(workspaceId, deptId);
          return { departmentId: deptId, members };
        } catch (error) {
          console.warn(`Failed to load members for department ${deptId}:`, error);
          return { departmentId: deptId, members: [] };
        }
      });

      const results = await Promise.all(memberPromises);
      const memberMap: {[key: string]: DepartmentUser[]} = {};
      
      results.forEach(({ departmentId, members }) => {
        memberMap[departmentId] = members;
      });

      return memberMap;
    } catch (error) {
      console.error('Error in batch loading department members:', error);
      throw new Error('Failed to batch load department members');
    }
  }

  // Get all departments for a workspace
  static async getWorkspaceDepartments(workspaceId: string): Promise<Department[]> {
    try {
      // Check cache first
      const cached = this.getCachedDepartments(workspaceId);
      if (cached) {
        return cached;
      }

      const q = query(
        collection(db, 'workspaces', workspaceId, 'departments'),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const departments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Department[];

      // Cache the results
      this.setCachedDepartments(workspaceId, departments);
      
      return departments;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw new Error('Failed to fetch departments');
    }
  }

  // Get departments from workspace and all its sub-workspaces (for cross-workspace support)
  static async getWorkspaceDepartmentsWithSubs(workspaceId: string, subWorkspaceIds: string[] = []): Promise<Department[]> {
    try {
      // Get departments from main workspace
      const mainDepartments = await this.getWorkspaceDepartments(workspaceId);
      
      // Get departments from all sub-workspaces
      const subDepartments: Department[] = [];
      
      for (const subWorkspaceId of subWorkspaceIds) {
        try {
          const depts = await this.getWorkspaceDepartments(subWorkspaceId);
          // Add workspace identifier to distinguish departments
          const departmentsWithWorkspace = depts.map(dept => ({
            ...dept,
            name: `${dept.name} (Sub-workspace)` // Add identifier
          }));
          subDepartments.push(...departmentsWithWorkspace);
        } catch (error) {
          console.warn(`Failed to load departments from sub-workspace ${subWorkspaceId}:`, error);
        }
      }
      
      return [...mainDepartments, ...subDepartments];
    } catch (error) {
      console.error('Error fetching departments with sub-workspaces:', error);
      // Fallback to just main workspace departments
      return await this.getWorkspaceDepartments(workspaceId);
    }
  }

  // Get a specific department
  static async getDepartment(workspaceId: string, departmentId: string): Promise<Department | null> {
    try {
      const docRef = doc(db, 'workspaces', workspaceId, 'departments', departmentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as Department;
    } catch (error) {
      console.error('Error fetching department:', error);
      return null;
    }
  }

  // Create a new department
  static async createDepartment(
    workspaceId: string,
    departmentData: {
      name: string;
      description?: string;
      headId?: string;
      color?: string;
    },
    userId: string
  ): Promise<Department> {
    try {
      // Check if department name already exists
      const existing = await this.getDepartmentByName(workspaceId, departmentData.name);
      if (existing) {
        throw new Error('Department name already exists');
      }

      // Get department head info if specified
      let headName: string | undefined;
      if (departmentData.headId) {
        const { UserService } = await import('./user-service');
        const headUser = await UserService.getUserById(departmentData.headId);
        headName = headUser?.name;
      }

      const docRef = await addDoc(collection(db, 'workspaces', workspaceId, 'departments'), {
        name: departmentData.name.trim(),
        description: departmentData.description?.trim() || '',
        workspaceId,
        headId: departmentData.headId || null,
        headName: headName || null,
        memberCount: 0,
        color: departmentData.color || '#3B82F6',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      });

      // Log activity
      await ActivityService.logActivity(
        'settings_changed',
        'department',
        docRef.id,
        {
          targetName: departmentData.name,
          description: departmentData.description,
          event: 'department_created'
        },
        workspaceId,
        userId
      );

      // Clear cache after creating department
      this.clearCache(workspaceId);

      // Return the created department
      const newDept = await this.getDepartment(workspaceId, docRef.id);
      if (!newDept) throw new Error('Failed to retrieve created department');
      
      return newDept;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  // Update a department
  static async updateDepartment(
    workspaceId: string,
    departmentId: string,
    updates: {
      name?: string;
      description?: string;
      headId?: string;
      color?: string;
      status?: 'active' | 'inactive';
    },
    userId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'workspaces', workspaceId, 'departments', departmentId);
      
      // Get department head info if updating
      let headName: string | undefined;
      if (updates.headId) {
        const { UserService } = await import('./user-service');
        const headUser = await UserService.getUserById(updates.headId);
        headName = headUser?.name;
      }

      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      if (updates.name) updateData.name = updates.name.trim();
      if (updates.description !== undefined) updateData.description = updates.description.trim();
      if (updates.headId !== undefined) {
        updateData.headId = updates.headId || null;
        updateData.headName = headName || null;
      }
      if (updates.color) updateData.color = updates.color;
      if (updates.status) updateData.status = updates.status;

      await updateDoc(docRef, updateData);

      // Log activity
      await ActivityService.logActivity(
        'settings_changed',
        'department',
        departmentId,
        {
          targetName: updates.name || 'Department',
          changes: Object.keys(updates),
          event: 'department_updated'
        },
        workspaceId,
        userId
      );

      // Clear cache after updating department
      this.clearCache(workspaceId);
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  // Delete a department
  static async deleteDepartment(
    workspaceId: string,
    departmentId: string,
    userId: string
  ): Promise<void> {
    try {
      // Get department info before deletion
      const department = await this.getDepartment(workspaceId, departmentId);
      if (!department) throw new Error('Department not found');

      // Check if department has members
      const memberCount = await this.getDepartmentMemberCount(workspaceId, departmentId);
      if (memberCount > 0) {
        throw new Error(`Cannot delete department with ${memberCount} members. Please reassign members first.`);
      }

      const docRef = doc(db, 'workspaces', workspaceId, 'departments', departmentId);
      await deleteDoc(docRef);

      // Log activity
      await ActivityService.logActivity(
        'settings_changed',
        'department',
        departmentId,
        {
          targetName: department.name,
          event: 'department_deleted'
        },
        workspaceId,
        userId
      );

      // Clear cache after deleting department
      this.clearCache(workspaceId);
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  // Get department by name
  static async getDepartmentByName(workspaceId: string, name: string): Promise<Department | null> {
    try {
      const q = query(
        collection(db, 'workspaces', workspaceId, 'departments'),
        where('name', '==', name.trim())
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as Department;
    } catch (error) {
      console.error('Error fetching department by name:', error);
      return null;
    }
  }

  // Get department members
  static async getDepartmentMembers(workspaceId: string, departmentId: string): Promise<DepartmentUser[]> {
    try {
      // Check cache first
      const cacheKey = `${workspaceId}:${departmentId}`;
      const cached = this.getCachedMembers(cacheKey);
      if (cached) {
        return cached;
      }

      const { UserService } = await import('./user-service');
      const allUsers = await UserService.getUsersByWorkspace(workspaceId);
      
      // Get department name first (await outside of filter)
      const departmentName = await this.getDepartmentName(workspaceId, departmentId);
      
      // Filter users who belong to this department
      const departmentUsers = allUsers
        .filter(user => user.department === departmentId || user.department === departmentName)
        .map(user => ({
          id: `${user.id}_${departmentId}`,
          userId: user.id,
          departmentId,
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          departmentRole: 'member' as 'head' | 'member',
          joinedAt: user.createdAt,
        }));

      // Cache the results
      this.setCachedMembers(cacheKey, departmentUsers);

      return departmentUsers;
    } catch (error) {
      console.error('Error fetching department members:', error);
      return [];
    }
  }

  // Get department member count
  static async getDepartmentMemberCount(workspaceId: string, departmentId: string): Promise<number> {
    try {
      const { UserService } = await import('./user-service');
      const allUsers = await UserService.getUsersByWorkspace(workspaceId);
      
      // Count users who belong to this department
      const departmentName = await this.getDepartmentName(workspaceId, departmentId);
      const memberCount = allUsers.filter(user => 
        user.department === departmentId || user.department === departmentName
      ).length;
      
      return memberCount;
    } catch (error) {
      console.error('Error getting department member count:', error);
      return 0;
    }
  }

  // Get department name by ID
  static async getDepartmentName(workspaceId: string, departmentId: string): Promise<string | null> {
    try {
      const department = await this.getDepartment(workspaceId, departmentId);
      return department?.name || null;
    } catch (error) {
      console.error('Error getting department name:', error);
      return null;
    }
  }

  // Update department member counts (should be called when users are added/removed)
  static async updateDepartmentMemberCounts(workspaceId: string): Promise<void> {
    try {
      const departments = await this.getWorkspaceDepartments(workspaceId);
      
      for (const department of departments) {
        const memberCount = await this.getDepartmentMemberCount(workspaceId, department.id);
        
        if (memberCount !== department.memberCount) {
          await updateDoc(
            doc(db, 'workspaces', workspaceId, 'departments', department.id),
            {
              memberCount,
              updatedAt: serverTimestamp()
            }
          );
        }
      }
    } catch (error) {
      console.error('Error updating department member counts:', error);
    }
  }

  // Create sample departments for a workspace
  static async createSampleDepartments(workspaceId: string, userId: string): Promise<void> {
    const sampleDepartments = [
      { name: 'Finance', description: 'Financial planning, accounting, and budget management', color: '#10B981' },
      { name: 'Human Resources', description: 'Employee recruitment, training, and relations', color: '#F59E0B' },
      { name: 'Marketing', description: 'Brand promotion, advertising, and market research', color: '#EF4444' },
      { name: 'Operations', description: 'Daily operations, logistics, and process management', color: '#6366F1' },
      { name: 'Information Technology', description: 'IT infrastructure, software development, and tech support', color: '#8B5CF6' },
      { name: 'Sales', description: 'Customer acquisition, account management, and revenue generation', color: '#06B6D4' },
      { name: 'Administration', description: 'General administration, facilities, and office management', color: '#84CC16' },
    ];

    for (const dept of sampleDepartments) {
      try {
        await this.createDepartment(workspaceId, dept, userId);
      } catch (error) {
        // Skip if department already exists
        console.warn(`Department ${dept.name} might already exist:`, error);
      }
    }
  }

  // Get department statistics
  static async getDepartmentStatistics(workspaceId: string): Promise<{
    totalDepartments: number;
    activeDepartments: number;
    totalMembers: number;
    averageMembersPerDepartment: number;
    departmentsWithHeads: number;
  }> {
    try {
      const departments = await this.getWorkspaceDepartments(workspaceId);
      
      const totalDepartments = departments.length;
      const activeDepartments = departments.filter(d => d.status === 'active').length;
      const totalMembers = departments.reduce((sum, d) => sum + d.memberCount, 0);
      const averageMembersPerDepartment = totalDepartments > 0 ? Math.round(totalMembers / totalDepartments) : 0;
      const departmentsWithHeads = departments.filter(d => d.headId).length;

      return {
        totalDepartments,
        activeDepartments,
        totalMembers,
        averageMembersPerDepartment,
        departmentsWithHeads,
      };
    } catch (error) {
      console.error('Error getting department statistics:', error);
      return {
        totalDepartments: 0,
        activeDepartments: 0,
        totalMembers: 0,
        averageMembersPerDepartment: 0,
        departmentsWithHeads: 0,
      };
    }
  }
} 