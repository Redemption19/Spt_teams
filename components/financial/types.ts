export interface CostCenterWithDetails {
  id: string;
  name: string;
  code?: string;
  description?: string;
  budget?: number;
  budgetPeriod?: 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
  departmentId?: string;
  departmentName?: string;
  managerId?: string;
  managerName?: string;
  branchId?: string;
  regionId?: string;
  projectId?: string;
  workspaceId: string;
  currentSpent?: number;
  projects?: number;
  teams?: number;
  employees?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EditFormData {
  name: string;
  code: string;
  description: string;
  departmentId: string;
  branchId: string;
  managerId: string;
  projectId: string;
  budget: string;
  budgetPeriod: 'monthly' | 'quarterly' | 'yearly';
  workspaceId: string;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name?: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  teamId: string;
  branchId?: string;
  ownerId: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: Date;
  dueDate?: Date;
  progress: number;
  epics: string[];
  tags: string[];
  visibility: 'public' | 'private' | 'restricted';
  projectAdmins: string[];
  projectMembers: string[];
  permissions: {
    canView: string[];
    canEdit: string[];
    canDelete: string[];
    canManageTasks: string[];
    canAssignTasks: string[];
    canManageMembers: string[];
  };
  comments: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  type?: 'company' | 'nonprofit' | 'government' | 'education' | 'other';
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  workspaceType?: 'main' | 'sub';
  parentWorkspaceId?: string;
  level?: number;
  path?: string[];
  regionId?: string;
  branchId?: string;
  hasSubWorkspaces?: boolean;
  subWorkspaceCount?: number;
  totalUsers?: number;
  isInherited?: boolean;
} 