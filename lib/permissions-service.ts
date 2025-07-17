import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  feature: string;
}

export interface UserPermission {
  userId: string;
  workspaceId: string;
  permissions: {
    [permissionId: string]: {
      granted: boolean;
      grantedBy?: string;
      grantedAt?: Date;
      expiresAt?: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionCategory {
  id: string;
  name: string;
  description: string;
  features: PermissionFeature[];
}

export interface PermissionFeature {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

// Define all system permissions
export const SYSTEM_PERMISSIONS: Permission[] = [
  // User Management
  { id: 'users.view', name: 'View Users', description: 'Can view user list and profiles', category: 'User Management', feature: 'users' },
  { id: 'users.create', name: 'Create Users', description: 'Can create new users', category: 'User Management', feature: 'users' },
  { id: 'users.edit', name: 'Edit Users', description: 'Can edit user information', category: 'User Management', feature: 'users' },
  { id: 'users.delete', name: 'Delete Users', description: 'Can delete users', category: 'User Management', feature: 'users' },
  { id: 'users.invite', name: 'Invite Users', description: 'Can send user invitations', category: 'User Management', feature: 'users' },
  { id: 'users.permissions', name: 'Manage Permissions', description: 'Can assign and manage user permissions', category: 'User Management', feature: 'users' },

  // Workspace Management
  { id: 'workspaces.view', name: 'View Workspaces', description: 'Can view workspace information', category: 'Workspace Management', feature: 'workspaces' },
  { id: 'workspaces.create', name: 'Create Workspaces', description: 'Can create new workspaces', category: 'Workspace Management', feature: 'workspaces' },
  { id: 'workspaces.edit', name: 'Edit Workspaces', description: 'Can edit workspace settings', category: 'Workspace Management', feature: 'workspaces' },
  { id: 'workspaces.delete', name: 'Delete Workspaces', description: 'Can delete workspaces', category: 'Workspace Management', feature: 'workspaces' },

  // Project Management
  { id: 'projects.view', name: 'View Projects', description: 'Can view project list and details', category: 'Project Management', feature: 'projects' },
  { id: 'projects.create', name: 'Create Projects', description: 'Can create new projects', category: 'Project Management', feature: 'projects' },
  { id: 'projects.edit', name: 'Edit Projects', description: 'Can edit project information', category: 'Project Management', feature: 'projects' },
  { id: 'projects.delete', name: 'Delete Projects', description: 'Can delete projects', category: 'Project Management', feature: 'projects' },
  { id: 'projects.assign', name: 'Assign Projects', description: 'Can assign projects to users', category: 'Project Management', feature: 'projects' },

  // Task Management
  { id: 'tasks.view', name: 'View Tasks', description: 'Can view task list and details', category: 'Task Management', feature: 'tasks' },
  { id: 'tasks.create', name: 'Create Tasks', description: 'Can create new tasks', category: 'Task Management', feature: 'tasks' },
  { id: 'tasks.edit', name: 'Edit Tasks', description: 'Can edit task information', category: 'Task Management', feature: 'tasks' },
  { id: 'tasks.delete', name: 'Delete Tasks', description: 'Can delete tasks', category: 'Task Management', feature: 'tasks' },
  { id: 'tasks.assign', name: 'Assign Tasks', description: 'Can assign tasks to users', category: 'Task Management', feature: 'tasks' },
  { id: 'tasks.complete', name: 'Complete Tasks', description: 'Can mark tasks as complete', category: 'Task Management', feature: 'tasks' },

  // Team Management
  { id: 'teams.view', name: 'View Teams', description: 'Can view team list and details', category: 'Team Management', feature: 'teams' },
  { id: 'teams.create', name: 'Create Teams', description: 'Can create new teams', category: 'Team Management', feature: 'teams' },
  { id: 'teams.edit', name: 'Edit Teams', description: 'Can edit team information', category: 'Team Management', feature: 'teams' },
  { id: 'teams.delete', name: 'Delete Teams', description: 'Can delete teams', category: 'Team Management', feature: 'teams' },
  { id: 'teams.members', name: 'Manage Team Members', description: 'Can add/remove team members', category: 'Team Management', feature: 'teams' },

  // Department Management
  { id: 'departments.view', name: 'View Departments', description: 'Can view department list and details', category: 'Department Management', feature: 'departments' },
  { id: 'departments.create', name: 'Create Departments', description: 'Can create new departments', category: 'Department Management', feature: 'departments' },
  { id: 'departments.edit', name: 'Edit Departments', description: 'Can edit department information', category: 'Department Management', feature: 'departments' },
  { id: 'departments.delete', name: 'Delete Departments', description: 'Can delete departments', category: 'Department Management', feature: 'departments' },
  { id: 'departments.members', name: 'Manage Department Members', description: 'Can add/remove department members', category: 'Department Management', feature: 'departments' },

  // Branch Management
  { id: 'branches.view', name: 'View Branches', description: 'Can view branch list and details', category: 'Branch Management', feature: 'branches' },
  { id: 'branches.create', name: 'Create Branches', description: 'Can create new branches', category: 'Branch Management', feature: 'branches' },
  { id: 'branches.edit', name: 'Edit Branches', description: 'Can edit branch information', category: 'Branch Management', feature: 'branches' },
  { id: 'branches.delete', name: 'Delete Branches', description: 'Can delete branches', category: 'Branch Management', feature: 'branches' },

  // Region Management
  { id: 'regions.view', name: 'View Regions', description: 'Can view region list and details', category: 'Region Management', feature: 'regions' },
  { id: 'regions.create', name: 'Create Regions', description: 'Can create new regions', category: 'Region Management', feature: 'regions' },
  { id: 'regions.edit', name: 'Edit Regions', description: 'Can edit region information', category: 'Region Management', feature: 'regions' },
  { id: 'regions.delete', name: 'Delete Regions', description: 'Can delete regions', category: 'Region Management', feature: 'regions' },

  // Folder Management
  { id: 'folders.view', name: 'View Folders', description: 'Can view folder list and contents', category: 'Folder Management', feature: 'folders' },
  { id: 'folders.create', name: 'Create Folders', description: 'Can create new folders', category: 'Folder Management', feature: 'folders' },
  { id: 'folders.edit', name: 'Edit Folders', description: 'Can edit folder information', category: 'Folder Management', feature: 'folders' },
  { id: 'folders.delete', name: 'Delete Folders', description: 'Can delete folders', category: 'Folder Management', feature: 'folders' },
  { id: 'folders.assign', name: 'Assign Folders', description: 'Can assign folders to users/teams', category: 'Folder Management', feature: 'folders' },

  // Report Management
  { id: 'reports.view', name: 'View Reports', description: 'Can view report list and details', category: 'Report Management', feature: 'reports' },
  { id: 'reports.create', name: 'Create Reports', description: 'Can create new reports', category: 'Report Management', feature: 'reports' },
  { id: 'reports.edit', name: 'Edit Reports', description: 'Can edit report information', category: 'Report Management', feature: 'reports' },
  { id: 'reports.delete', name: 'Delete Reports', description: 'Can delete reports', category: 'Report Management', feature: 'reports' },
  { id: 'reports.approve', name: 'Approve Reports', description: 'Can approve submitted reports', category: 'Report Management', feature: 'reports' },
  { id: 'reports.export', name: 'Export Reports', description: 'Can export reports to various formats', category: 'Report Management', feature: 'reports' },

  // Analytics & Dashboard
  { id: 'analytics.view', name: 'View Analytics', description: 'Can view analytics and dashboard data', category: 'Analytics', feature: 'analytics' },
  { id: 'analytics.export', name: 'Export Analytics', description: 'Can export analytics data', category: 'Analytics', feature: 'analytics' },

  // Calendar Management
  { id: 'calendar.view', name: 'View Calendar', description: 'Can view calendar events', category: 'Calendar Management', feature: 'calendar' },
  { id: 'calendar.create', name: 'Create Events', description: 'Can create calendar events', category: 'Calendar Management', feature: 'calendar' },
  { id: 'calendar.edit', name: 'Edit Events', description: 'Can edit calendar events', category: 'Calendar Management', feature: 'calendar' },
  { id: 'calendar.delete', name: 'Delete Events', description: 'Can delete calendar events', category: 'Calendar Management', feature: 'calendar' },

  // Settings & Configuration
  { id: 'settings.view', name: 'View Settings', description: 'Can view system settings', category: 'Settings', feature: 'settings' },
  { id: 'settings.edit', name: 'Edit Settings', description: 'Can edit system settings', category: 'Settings', feature: 'settings' },

  // Support & Tickets
  { id: 'support.view', name: 'View Support Tickets', description: 'Can view support tickets', category: 'Support', feature: 'support' },
  { id: 'support.create', name: 'Create Support Tickets', description: 'Can create support tickets', category: 'Support', feature: 'support' },
  { id: 'support.edit', name: 'Edit Support Tickets', description: 'Can edit support tickets', category: 'Support', feature: 'support' },
  { id: 'support.resolve', name: 'Resolve Support Tickets', description: 'Can resolve support tickets', category: 'Support', feature: 'support' },

  // Database Management
  { id: 'database.view', name: 'View Database', description: 'Can view database information', category: 'Database Management', feature: 'database' },
  { id: 'database.backup', name: 'Database Backup', description: 'Can create database backups', category: 'Database Management', feature: 'database' },
  { id: 'database.restore', name: 'Database Restore', description: 'Can restore database from backup', category: 'Database Management', feature: 'database' },

  // AI Assistant
  { id: 'ai.view', name: 'View AI Assistant', description: 'Can access AI assistant features', category: 'AI Assistant', feature: 'ai' },
  { id: 'ai.configure', name: 'Configure AI', description: 'Can configure AI assistant settings', category: 'AI Assistant', feature: 'ai' },
];

// Group permissions by category
export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'user-management',
    name: 'User Management',
    description: 'Manage users, roles, and permissions',
    features: [
      {
        id: 'users',
        name: 'Users',
        description: 'User management operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'users')
      }
    ]
  },
  {
    id: 'workspace-management',
    name: 'Workspace Management',
    description: 'Manage workspaces and workspace settings',
    features: [
      {
        id: 'workspaces',
        name: 'Workspaces',
        description: 'Workspace management operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'workspaces')
      }
    ]
  },
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Manage projects and project-related operations',
    features: [
      {
        id: 'projects',
        name: 'Projects',
        description: 'Project management operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'projects')
      },
      {
        id: 'tasks',
        name: 'Tasks',
        description: 'Task management operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'tasks')
      }
    ]
  },
  {
    id: 'team-management',
    name: 'Team Management',
    description: 'Manage teams and team-related operations',
    features: [
      {
        id: 'teams',
        name: 'Teams',
        description: 'Team management operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'teams')
      }
    ]
  },
  {
    id: 'organization-management',
    name: 'Organization Management',
    description: 'Manage organizational structure',
    features: [
      {
        id: 'departments',
        name: 'Departments',
        description: 'Department management operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'departments')
      },
      {
        id: 'branches',
        name: 'Branches',
        description: 'Branch management operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'branches')
      },
      {
        id: 'regions',
        name: 'Regions',
        description: 'Region management operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'regions')
      }
    ]
  },
  {
    id: 'content-management',
    name: 'Content Management',
    description: 'Manage content and files',
    features: [
      {
        id: 'folders',
        name: 'Folders',
        description: 'Folder management operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'folders')
      }
    ]
  },
  {
    id: 'reporting',
    name: 'Reporting',
    description: 'Manage reports and analytics',
    features: [
      {
        id: 'reports',
        name: 'Reports',
        description: 'Report management operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'reports')
      },
      {
        id: 'analytics',
        name: 'Analytics',
        description: 'Analytics and dashboard operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'analytics')
      }
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Manage communication tools',
    features: [
      {
        id: 'calendar',
        name: 'Calendar',
        description: 'Calendar management operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'calendar')
      }
    ]
  },
  {
    id: 'system',
    name: 'System',
    description: 'System-level operations',
    features: [
      {
        id: 'settings',
        name: 'Settings',
        description: 'System settings operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'settings')
      },
      {
        id: 'support',
        name: 'Support',
        description: 'Support ticket operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'support')
      },
      {
        id: 'database',
        name: 'Database',
        description: 'Database management operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'database')
      },
      {
        id: 'ai',
        name: 'AI Assistant',
        description: 'AI assistant operations',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.feature === 'ai')
      }
    ]
  }
];

export class PermissionsService {
  /**
   * Get user permissions for a specific workspace
   */
  static async getUserPermissions(userId: string, workspaceId: string): Promise<UserPermission | null> {
    try {
      const docRef = doc(db, 'userPermissions', `${userId}_${workspaceId}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          userId: data.userId,
          workspaceId: data.workspaceId,
          permissions: data.permissions || {},
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
        } as UserPermission;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw error;
    }
  }

  /**
   * Set user permissions for a specific workspace
   */
  static async setUserPermissions(
    userId: string, 
    workspaceId: string, 
    permissions: { [permissionId: string]: { granted: boolean; grantedBy?: string; expiresAt?: Date } },
    grantedBy: string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'userPermissions', `${userId}_${workspaceId}`);
      const now = new Date();
      
      const userPermission: UserPermission = {
        userId,
        workspaceId,
        permissions: Object.keys(permissions).reduce((acc, permissionId) => {
          acc[permissionId] = {
            granted: permissions[permissionId].granted,
            grantedBy: grantedBy,
            grantedAt: now,
            expiresAt: permissions[permissionId].expiresAt
          };
          return acc;
        }, {} as any),
        createdAt: now,
        updatedAt: now
      };
      
      await setDoc(docRef, userPermission);
    } catch (error) {
      console.error('Error setting user permissions:', error);
      throw error;
    }
  }

  /**
   * Update specific permissions for a user
   */
  static async updateUserPermissions(
    userId: string,
    workspaceId: string,
    permissionUpdates: { [permissionId: string]: { granted: boolean; grantedBy?: string; expiresAt?: Date } },
    updatedBy: string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'userPermissions', `${userId}_${workspaceId}`);
      const now = new Date();
      
      // Get existing permissions
      const existingDoc = await getDoc(docRef);
      let existingPermissions = {};
      
      if (existingDoc.exists()) {
        existingPermissions = existingDoc.data().permissions || {};
      }
      
      // Update permissions
      const updatedPermissions = {
        ...existingPermissions,
        ...Object.keys(permissionUpdates).reduce((acc, permissionId) => {
          acc[permissionId] = {
            granted: permissionUpdates[permissionId].granted,
            grantedBy: updatedBy,
            grantedAt: now,
            expiresAt: permissionUpdates[permissionId].expiresAt
          };
          return acc;
        }, {} as any)
      };
      
      await updateDoc(docRef, {
        permissions: updatedPermissions,
        updatedAt: now
      });
    } catch (error) {
      console.error('Error updating user permissions:', error);
      throw error;
    }
  }

  /**
   * Check if user has a specific permission
   */
  static async hasPermission(userId: string, workspaceId: string, permissionId: string): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId, workspaceId);
      
      if (!userPermissions) {
        return false;
      }
      
      const permission = userPermissions.permissions[permissionId];
      if (!permission) {
        return false;
      }
      
      // Check if permission is granted
      if (!permission.granted) {
        return false;
      }
      
      // Check if permission has expired
      if (permission.expiresAt && new Date() > permission.expiresAt) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Get all permissions for a user across all workspaces
   */
  static async getUserAllPermissions(userId: string): Promise<UserPermission[]> {
    try {
      const permissionsRef = collection(db, 'userPermissions');
      const q = query(permissionsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: data.userId,
          workspaceId: data.workspaceId,
          permissions: data.permissions || {},
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
        } as UserPermission;
      });
    } catch (error) {
      console.error('Error fetching all user permissions:', error);
      throw error;
    }
  }

  /**
   * Get all users with permissions for a specific workspace
   */
  static async getWorkspaceUserPermissions(workspaceId: string): Promise<UserPermission[]> {
    try {
      const permissionsRef = collection(db, 'userPermissions');
      const q = query(permissionsRef, where('workspaceId', '==', workspaceId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: data.userId,
          workspaceId: data.workspaceId,
          permissions: data.permissions || {},
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
        } as UserPermission;
      });
    } catch (error) {
      console.error('Error fetching workspace user permissions:', error);
      throw error;
    }
  }

  /**
   * Delete user permissions for a specific workspace
   */
  static async deleteUserPermissions(userId: string, workspaceId: string): Promise<void> {
    try {
      const docRef = doc(db, 'userPermissions', `${userId}_${workspaceId}`);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting user permissions:', error);
      throw error;
    }
  }

  /**
   * Get permission categories and features
   */
  static getPermissionCategories(): PermissionCategory[] {
    return PERMISSION_CATEGORIES;
  }

  /**
   * Get all system permissions
   */
  static getAllPermissions(): Permission[] {
    return SYSTEM_PERMISSIONS;
  }

  /**
   * Get permissions by category
   */
  static getPermissionsByCategory(categoryId: string): Permission[] {
    return SYSTEM_PERMISSIONS.filter(p => {
      const category = PERMISSION_CATEGORIES.find(c => c.id === categoryId);
      return category?.features.some(f => f.id === p.feature);
    });
  }

  /**
   * Get permissions by feature
   */
  static getPermissionsByFeature(featureId: string): Permission[] {
    return SYSTEM_PERMISSIONS.filter(p => p.feature === featureId);
  }
} 