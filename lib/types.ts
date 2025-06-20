export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  role: 'owner' | 'admin' | 'member';
  status?: 'active' | 'inactive' | 'suspended';
  jobTitle?: string;
  department?: string;
  workspaceId: string;
  teamIds: string[];
  branchId?: string;
  regionId?: string;
  // Profile specific fields
  dateOfBirth?: Date;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
  skills?: string[];
  languages?: string[];
  timezone?: string;
  preferredContactMethod?: 'email' | 'phone' | 'slack' | 'teams';
  // System fields
  createdAt: Date;
  lastActive: Date;
  profileCompleteness?: number; // Percentage of profile completion
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
}

export interface UserWorkspace {
  id: string; // userId_workspaceId
  userId: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  invitedBy?: string;
}

export interface TeamUser {
  id: string; // userId_teamId
  userId: string;
  teamId: string;
  role: 'lead' | 'member';
  joinedAt: Date;
  assignedBy?: string;
}

export interface Invitation {
  id: string;
  email: string;
  workspaceId: string;
  teamId?: string;
  role: 'admin' | 'member';
  teamRole?: 'lead' | 'member';
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  branchId?: string;
  regionId?: string;
  leadId?: string; // Team lead
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Region {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  branches: string[];
  adminIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Branch {
  id: string;
  name: string;
  description?: string;
  regionId: string;
  workspaceId: string;
  managerId?: string; // Branch manager (single user)
  adminIds: string[];
  teamIds: string[];
  userIds: string[]; // Users assigned to this branch
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
  };
  status: 'active' | 'inactive' | 'closed';
  capacity?: number; // Maximum users this branch can handle
  metrics?: {
    totalUsers: number;
    activeProjects: number;
    completedTasks: number;
  };
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Epic {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  workspaceId: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  dueDate?: Date;
  progress: number;
  tasks: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  epicId?: string;
  projectId: string;
  workspaceId: string;
  assigneeId?: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  attachments: string[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  workspaceId: string;
  teamId?: string;
  branchId?: string;
  ownerId: string;
  type: 'team' | 'personal';
  permissions: {
    read: string[];
    write: string[];
    admin: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  title: string;
  content: string;
  type: 'weekly' | 'monthly' | 'project' | 'custom';
  workspaceId: string;
  teamId?: string;
  branchId?: string;
  authorId: string;
  folderId?: string;
  status: 'draft' | 'submitted' | 'approved' | 'archived';
  attachments: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  workspaceId: string;
  branchId?: string;
  teamId?: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  date: Date;
  metrics: {
    tasksCompleted: number;
    tasksCreated: number;
    activeUsers: number;
    projectsCompleted: number;
    averageTaskTime: number;
    teamProductivity: number;
  };
}

export interface ActivityLog {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, any>;
  timestamp: Date;
}