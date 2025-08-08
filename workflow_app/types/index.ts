// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  avatar?: string;
  phone?: string;
  role: 'owner' | 'admin' | 'member';
  workspaceId: string;
  teamIds: string[];
  branchId?: string;
  regionId?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      push: boolean;
      email: boolean;
      inApp: boolean;
    };
    language: string;
    timezone: string;
  };
  deviceTokens?: string[];
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  requiresPasswordChange?: boolean;
  firstLogin?: boolean;
  isGuest?: boolean;
}

// Workspace Types
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  parentId?: string;
  settings?: {
    currency: string;
    timezone: string;
    features: {
      financial: boolean;
      hr: boolean;
      tasks: boolean;
      analytics: boolean;
      ai: boolean;
    };
    branding?: {
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
  };
  stats?: {
    memberCount: number;
    taskCount: number;
    activeProjects: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
  joinedAt: Date;
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId: string;
  assignerId: string;
  workspaceId: string;
  projectId?: string;
  teamId?: string;
  dueDate?: Date;
  startDate?: Date;
  completedDate?: Date;
  tags: string[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  timeTracking?: {
    estimatedHours: number;
    loggedHours: number;
    sessions: TimeSession[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface TaskComment {
  id: string;
  userId: string;
  message: string;
  createdAt: Date;
}

export interface TimeSession {
  startTime: Date;
  endTime: Date;
  duration: number;
}

// Financial Types
export interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: 'travel' | 'meals' | 'office' | 'software' | 'other';
  subcategory?: string;
  description?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'reimbursed';
  userId: string;
  workspaceId: string;
  projectId?: string;
  receiptUrl?: string;
  receiptData?: {
    vendor?: string;
    date?: string;
    extractedText?: string;
    confidence?: number;
  };
  expenseDate: Date;
  submittedDate: Date;
  approvedDate?: Date;
  approvedBy?: string;
  reimbursedDate?: Date;
  notes?: string;
  mileage?: {
    distance: number;
    rate: number;
    startLocation: string;
    endLocation: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Document Types
export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  ownerId: string;
  workspaceId: string;
  folderId?: string;
  teamId?: string;
  projectId?: string;
  permissions: {
    public: boolean;
    allowedUsers: string[];
    allowedRoles: string[];
  };
  metadata?: {
    description?: string;
    tags: string[];
    version: string;
    language: string;
  };
  versions?: DocumentVersion[];
  downloadCount: number;
  lastAccessed: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersion {
  id: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  changes: string;
}

// Team Types
export interface Team {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  leaderId: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: 'leader' | 'member';
  joinedAt: Date;
}

// HR Types
export interface Employee {
  id: string;
  userId: string;
  workspaceId: string;
  employeeId: string;
  department: string;
  position: string;
  hireDate: Date;
  salary?: number;
  managerId?: string;
  status: 'active' | 'inactive' | 'terminated';
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  id: string;
  userId: string;
  workspaceId: string;
  date: Date;
  checkIn: Date;
  checkOut?: Date;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
  createdAt: Date;
}

// Analytics Types
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingReports: number;
  activeTeams: number;
  totalFiles: number;
  totalFolders: number;
  activityScore: number;
  weeklyProgress: number;
  recentActivity: ActivityItem[];
  upcomingDeadlines: DeadlineItem[];
  notifications: NotificationItem[];
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  userId: string;
  workspaceId: string;
}

export interface DeadlineItem {
  id: string;
  title: string;
  dueDate: Date;
  type: 'task' | 'expense' | 'report';
  priority: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  timestamp: Date;
  actionUrl?: string;
}

// Navigation Types
export interface NavigationItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  badge?: number;
  children?: NavigationItem[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  jobTitle?: string;
  department?: string;
  region?: string;
  branch?: string;
  acceptTerms: boolean;
}

// Theme Types
export interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
}
