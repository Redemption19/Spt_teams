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
  departmentId?: string;
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
  // Password management fields
  requiresPasswordChange?: boolean; // True if admin set initial password
  firstLogin?: boolean; // True if user hasn't logged in yet
  isGuest?: boolean;
}

// ===== HIERARCHICAL WORKSPACE TYPES =====

export interface WorkspaceSettings {
  allowSubWorkspaces: boolean;
  maxSubWorkspaces: number;
  inheritUsers: boolean;
  inheritRoles: boolean;
  inheritTeams: boolean;
  inheritBranches: boolean;
  crossWorkspaceReporting: boolean;
  subWorkspaceNamingPattern?: string;
  // Admin workspace creation control
  allowAdminWorkspaceCreation: boolean;
  allowGuestAccess?: boolean;
}

export interface HierarchyPermissions {
  canManage: boolean;
  canView: boolean;
  canInheritUsers: boolean;
  canInheritRoles: boolean;
  canCreateSubWorkspaces: boolean;
  canDeleteSubWorkspaces: boolean;
  canMoveSubWorkspaces: boolean;
}

export interface UserWorkspacePermissions {
  canAccessSubWorkspaces: boolean;
  canCreateSubWorkspaces: boolean;
  canManageInherited: boolean;
  canViewHierarchy: boolean;
  canSwitchWorkspaces: boolean;
  canInviteToSubWorkspaces: boolean;
}

export interface WorkspaceHierarchy {
  id: string; // parentId_childId
  parentWorkspaceId: string;
  childWorkspaceId: string;
  relationship: 'direct' | 'inherited';
  permissions: HierarchyPermissions;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

// ===== ENHANCED CORE INTERFACES =====

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  type?: 'company' | 'nonprofit' | 'government' | 'education' | 'other';
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // === NEW HIERARCHICAL FIELDS (Optional for backward compatibility) ===
  workspaceType?: 'main' | 'sub'; // Defaults to 'main' for existing workspaces
  parentWorkspaceId?: string; // null for main workspaces
  level?: number; // 0 = main, 1 = sub, 2 = sub-sub (future)
  path?: string[]; // ['main-id'] or ['main-id', 'sub-id']
  settings?: WorkspaceSettings;
  
  // Sub-workspace specific bindings
  regionId?: string; // For sub-workspaces: bound region
  branchId?: string; // For sub-workspaces: bound branch
  
  // Computed fields (not stored in DB, calculated on load)
  hasSubWorkspaces?: boolean;
  subWorkspaceCount?: number;
  totalUsers?: number;
  isInherited?: boolean;
}

export interface UserWorkspace {
  id: string; // userId_workspaceId
  userId: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  invitedBy?: string;
  
  // === NEW HIERARCHICAL FIELDS (Optional for backward compatibility) ===
  scope?: 'direct' | 'inherited' | 'both'; // How user got access to this workspace
  inheritedFrom?: string; // Parent workspace ID if inherited
  permissions?: UserWorkspacePermissions;
  effectiveRole?: 'owner' | 'admin' | 'member'; // Computed from direct + inherited
  
  // Access control
  canAccessSubWorkspaces?: boolean;
  accessibleWorkspaces?: string[]; // Cached list of accessible workspace IDs
}

// ===== WORKSPACE INHERITANCE TRACKING =====

export interface WorkspaceInheritance {
  id: string; // workspaceId_userId
  workspaceId: string;
  userId: string;
  sourceWorkspaceId: string; // Where the inheritance came from
  inheritedRole: 'owner' | 'admin' | 'member';
  directRole?: 'owner' | 'admin' | 'member'; // If user also has direct access
  effectiveRole: 'owner' | 'admin' | 'member'; // Final computed role
  isActive: boolean;
  inheritedAt: Date;
  lastSyncAt: Date;
}

// ===== SUB-WORKSPACE CREATION DATA =====

export interface SubWorkspaceData {
  name: string;
  description?: string;
  logo?: string;
  regionId?: string; // Required for sub-workspace binding
  branchId?: string; // Required for sub-workspace binding
  inheritUsers?: boolean;
  inheritRoles?: boolean;
  inheritTeams?: boolean;
  inheritBranches?: boolean;
  initialUsers?: string[]; // User IDs to add directly
  initialTeams?: string[]; // Team IDs to copy/move
  template?: 'blank' | 'copy-parent' | 'minimal';
}

// ===== EXISTING INTERFACES (Unchanged) =====

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

// Extended Team type for system-wide views with workspace context
export interface SystemWideTeam extends Team {
  workspaceName: string;
  workspaceType: 'main' | 'sub';
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
  
  // === PROJECT RBAC FIELDS ===
  visibility: 'public' | 'private' | 'restricted'; // Project access level
  projectAdmins: string[]; // Users with admin access to this specific project
  projectMembers: string[]; // Users with member access to this project
  permissions: {
    canView: string[]; // User IDs who can view
    canEdit: string[]; // User IDs who can edit project details
    canDelete: string[]; // User IDs who can delete project
    canManageTasks: string[]; // User IDs who can create/edit/delete tasks
    canAssignTasks: string[]; // User IDs who can assign tasks to others
    canManageMembers: string[]; // User IDs who can add/remove project members
  };
  
  // === PROJECT COMMENTS ===
  comments: Comment[]; // Project-level comments and discussions
  
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
  
  // === TASK RBAC FIELDS ===
  createdBy: string; // User who created the task
  visibility: 'public' | 'private' | 'assignee-only'; // Task access level
  permissions: {
    canView: string[]; // User IDs who can view this task
    canEdit: string[]; // User IDs who can edit this task
    canDelete: string[]; // User IDs who can delete this task
    canComment: string[]; // User IDs who can add comments
    canAssign: string[]; // User IDs who can reassign this task
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName?: string; // Cache author name for display
  authorRole?: string; // Cache author role for display
  createdAt: Date;
  updatedAt: Date;
  
  // === COMMENT METADATA ===
  isEdited?: boolean; // Track if comment has been edited
  editedAt?: Date; // When the comment was last edited
  parentId?: string; // For threaded replies (future feature)
  mentions?: string[]; // User IDs mentioned in the comment
  
  // === COMMENT PERMISSIONS ===
  canEdit?: boolean; // Computed field - can current user edit this comment
  canDelete?: boolean; // Computed field - can current user delete this comment
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  workspaceId: string;
  mainWorkspaceId: string;
  subWorkspaceId: string;
  teamId?: string;
  branchId?: string;
  ownerId: string;
  type: 'team' | 'personal' | 'member' | 'shared' | 'project' | 'member-assigned';
  
  // Enhanced folder structure for member management
  folderPath: string; // e.g., "Projects/Project A/Member Folders/John Doe"
  level: number; // Depth in hierarchy (0 = root, 1 = project, 2 = member folders, 3 = individual member)
  isSystemFolder: boolean; // Auto-created folders like "Member Folders"
  memberId?: string; // If this is a member's personal folder
  assignedMemberId?: string; // If this folder is assigned to a specific member by admin/owner
  projectId?: string; // If this belongs to a specific project
  
  // RBAC Permissions
  permissions: {
    read: string[]; // User IDs who can read
    write: string[]; // User IDs who can write
    admin: string[]; // User IDs who can admin
    delete: string[]; // User IDs who can delete
  };
  
  // Enhanced access control
  visibility: 'private' | 'team' | 'project' | 'public';
  inheritPermissions: boolean; // Whether to inherit from parent folder
  
  // File management
  fileCount: number;
  memberCount?: number; // Number of members with access to this folder
  totalSize: number; // in bytes
  allowedFileTypes?: string[]; // ['pdf', 'doc', 'jpg'] etc.
  maxFileSize?: number; // in bytes
  
  // Audit and metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
  department?: string; // Department this folder belongs to
  
  // Folder settings
  settings: {
    autoArchive?: boolean;
    archiveAfterDays?: number;
    notifyOnUpload?: boolean;
    requireApproval?: boolean;
    allowSubfolders?: boolean;
    maxSubfolders?: number;
  };
  
  // Status
  status: 'active' | 'archived' | 'deleted' | 'locked';
  archivedAt?: Date;
  archivedBy?: string;
  
  // Tags and categories
  tags: string[];
  category?: string;
  
  // Sharing and collaboration
  isShared: boolean;
  sharedWith: {
    userId: string;
    role: 'viewer' | 'editor' | 'admin';
    sharedAt: Date;
    sharedBy: string;
    expiresAt?: Date;
  }[];
}

export interface FolderFile {
  id: string;
  name: string;
  originalName: string;
  folderId: string;
  ownerId: string;
  size: number;
  type: 'document' | 'image' | 'video' | 'archive';
  mimeType: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  
  // File metadata
  uploadedAt: Date;
  uploadedBy: string;
  lastModified: Date;
  lastModifiedBy: string;
  
  // File permissions (can override folder permissions)
  permissions?: {
    read: string[];
    write: string[];
    delete: string[];
  };
  
  // File status
  status: 'active' | 'archived' | 'deleted' | 'processing';
  version: number;
  previousVersions?: string[]; // File IDs of previous versions
  
  // File properties
  isEncrypted: boolean;
  checksum?: string;
  tags: string[];
  description?: string;
  
  // Approval workflow
  requiresApproval: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  
  // Firebase Storage metadata
  storagePath?: string; // Firebase Storage path
  storageMetadata?: {
    fullPath: string;
    bucket: string;
    generation: string;
    timeCreated: string;
  };
}

export interface FolderActivity {
  id: string;
  folderId: string;
  userId: string;
  userName: string;
  action: 'created' | 'updated' | 'deleted' | 'accessed' | 'uploaded' | 'downloaded' | 'shared' | 'permission_changed';
  description: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  
  // Action-specific data
  targetId?: string; // File ID or subfolder ID
  targetName?: string;
  oldValue?: any;
  newValue?: any;
  
  // Context
  workspaceId: string;
  projectId?: string;
  teamId?: string;
}

export interface MemberFolderStructure {
  id: string;
  projectId: string;
  projectName: string;
  memberFoldersId: string; // The "Member Folders" system folder
  memberFolders: {
    userId: string;
    userName: string;
    folderId: string;
    folderName: string;
    lastActivity: Date;
    fileCount: number;
    totalSize: number;
    hasNewContent: boolean;
  }[];
  sharedProjectFolder?: {
    id: string;
    name: string;
    description: string;
  };
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

// ===== REPORT TEMPLATE SYSTEM =====

export type ReportFieldType = 'text' | 'textarea' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'file';

export interface ReportDeadlineConfig {
  enabled: boolean;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reminderDays?: number[]; // Days before deadline to send reminders
  autoCreateEvents?: boolean; // Whether to automatically create calendar events
  requiredDepartments?: string[]; // Departments required to submit
  description?: string; // Custom deadline description
}

export interface ReportTemplateField {
  id: string;
  label: string;
  type: ReportFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number; // For number fields
    max?: number; // For number fields
    pattern?: string; // Regex pattern
    customMessage?: string;
  };
  // For dropdown fields
  options?: string[];
  allowMultiple?: boolean; // For dropdown and checkbox fields
  // For file fields
  acceptedFileTypes?: string[]; // ['pdf', 'doc', 'jpg']
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  // For conditional logic (future enhancement)
  conditionalLogic?: {
    dependsOn: string; // Field ID
    condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
    action: 'show' | 'hide' | 'require' | 'disable';
  };
  // UI settings
  columnSpan?: 1 | 2 | 3; // For grid layout
  order: number; // Display order
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdBy: string;
  updatedBy?: string;
  
  // Template structure
  fields: ReportTemplateField[];
  
  // Categorization and organization
  category?: string;
  tags?: string[];
  department?: string; // The department that owns/created this template
  
  // Enhanced department-based access control
  departmentAccess: {
    type: 'global' | 'department_specific' | 'multi_department' | 'custom';
    // global: Available to all departments
    // department_specific: Only for the owner department
    // multi_department: Selected departments only
    // custom: Advanced custom rules
    allowedDepartments?: string[]; // Departments that can access this template
    restrictedDepartments?: string[]; // Departments explicitly denied access
    ownerDepartment?: string; // Department that owns/manages this template
    inheritFromParent?: boolean; // For sub-workspaces: inherit from parent workspace
  };
  
  // Template settings
  settings: {
    allowFileAttachments: boolean;
    maxFileAttachments?: number;
    autoSave: boolean;
    autoSaveInterval?: number; // minutes
    requiresApproval: boolean;
    approvalWorkflow?: {
      steps: {
        order: number;
        approverRole: 'admin' | 'owner' | 'specific_user' | 'department_head';
        approverIds?: string[]; // If specific_user
        approverDepartments?: string[]; // If department_head
        isOptional: boolean;
      }[];
    };
    notifications: {
      onSubmission: boolean;
      onApproval: boolean;
      onRejection: boolean;
      recipientRoles: ('owner' | 'admin' | 'author' | 'department_head')[];
      customRecipients?: string[]; // User IDs
      departmentNotifications?: {
        department: string;
        roles: ('head' | 'admin' | 'all_members')[];
      }[];
    };
  };
  
  // Usage tracking
  usage: {
    totalReports: number;
    drafts: number;
    submitted: number;
    approved: number;
    rejected: number;
    lastUsed?: Date;
    // Department-specific usage
    departmentUsage?: {
      department: string;
      totalReports: number;
      lastUsed?: Date;
    }[];
  };
  
  // Version control
  version: number;
  previousVersions?: string[]; // Template IDs of previous versions
  changeLog?: {
    version: number;
    changes: string;
    changedBy: string;
    changedAt: Date;
  }[];
  
  // Template status
  status: 'active' | 'draft' | 'archived' | 'deprecated';
  isDefault?: boolean; // Default template for this category
  
  // Deadline configuration for calendar integration
  deadlineConfig?: ReportDeadlineConfig;
  
  // Legacy access control (kept for backward compatibility)
  visibility: 'public' | 'restricted'; // All workspace members vs specific users
  allowedRoles?: ('owner' | 'admin' | 'member')[];
  allowedUsers?: string[]; // Specific user IDs if restricted
  allowedDepartments?: string[]; // Deprecated - use departmentAccess instead
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  
  // Preview and UI
  previewData?: Record<string, any>; // Sample data for preview
  uiSettings?: {
    theme?: 'default' | 'compact' | 'detailed';
    showProgress?: boolean;
    allowSaveAndContinue?: boolean;
    showFieldNumbers?: boolean;
  };
}

// Enhanced Report interface that uses templates
export interface EnhancedReport {
  id: string;
  title: string;
  templateId?: string; // Reference to the template used
  templateVersion?: number; // Version of template when report was created
  workspaceId: string;
  authorId: string;
  authorEmail?: string; // Fallback author email for legacy reports
  authorDepartment?: string; // Fallback author department for legacy reports
  
  // Report content - dynamic based on template
  fieldData: Record<string, any>; // Field ID -> Field Value mapping
  attachments: {
    fieldId?: string; // Which field this attachment belongs to
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadedAt: Date;
  }[];
  
  // Report metadata
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags?: string[];
  
  // Workflow and approval
  submittedAt?: Date;
  approvalWorkflow?: {
    currentStep: number;
    steps: {
      order: number;
      approverRole: 'admin' | 'owner' | 'specific_user';
      approverId?: string;
      status: 'pending' | 'approved' | 'rejected' | 'skipped';
      reviewedAt?: Date;
      comments?: string;
    }[];
    finalStatus?: 'approved' | 'rejected';
    finalizedAt?: Date;
    finalizedBy?: string;
  };
  
  // Comments and feedback
  comments: {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    type: 'general' | 'field_specific' | 'approval';
    fieldId?: string; // If field-specific comment
    createdAt: Date;
    isInternal?: boolean; // Internal reviewer comments vs public
  }[];
  
  // Revision history
  revisions: {
    version: number;
    changedBy: string;
    changedAt: Date;
    changes: {
      fieldId: string;
      oldValue: any;
      newValue: any;
      changeType: 'added' | 'modified' | 'removed';
    }[];
    comment?: string;
  }[];
  
  // Submission metadata
  submissionMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    submissionTime: Date;
    timeSpent?: number; // minutes
    autoSaved?: boolean;
    lastAutoSave?: Date;
  };
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
  
  // Integration fields
  linkedProjects?: string[]; // Project IDs
  linkedTasks?: string[]; // Task IDs
  linkedTeams?: string[]; // Team IDs
  
  // Export and sharing
  isPublic?: boolean;
  sharedWith?: {
    userId: string;
    role: 'viewer' | 'commenter';
    sharedAt: Date;
    expiresAt?: Date;
  }[];
  exportHistory?: {
    exportedAt: Date;
    exportedBy: string;
    format: 'pdf' | 'excel' | 'word';
    size: number;
  }[];
}

// Template builder specific types
export interface TemplateFieldDraft {
  id: string;
  label: string;
  type: ReportFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    customMessage?: string;
  };
  // For file fields
  acceptedFileTypes?: string[]; // ['pdf', 'doc', 'jpg']
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  order: number;
  columnSpan?: 1 | 2 | 3;
  // Temporary fields for builder UI
  isNew?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export interface TemplateBuilderState {
  template: Partial<ReportTemplate>;
  fields: TemplateFieldDraft[];
  isDirty: boolean;
  isValid: boolean;
  errors: {
    template: Record<string, string>;
    fields: Record<string, Record<string, string>>;
  };
  previewMode: boolean;
  draggedFieldId?: string;
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

// ===== REPORTS DASHBOARD TYPES =====

export interface DashboardSummaryData {
  totalReports: number;
  approvedReports: number;
  rejectedReports: number;
  pendingReports: number;
  draftReports: number;
  monthlySubmissions: number;
  avgApprovalTime: number; // in hours
  topPerformingDepartment: string;
}

export interface ReportsOverTimeData {
  date: string;
  submitted: number;
  approved: number;
  rejected: number;
  drafts: number;
}

export interface StatusBreakdownData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface DepartmentReportsData {
  department: string;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  approvalRate: number;
}

export interface TopTemplatesData {
  templateId: string;
  templateName: string;
  usageCount: number;
  category: string;
  department: string;
  lastUsed: Date;
}

export interface SubmissionsByDayData {
  day: string;
  submissions: number;
  intensity: number; // 0-1 for heatmap color intensity
}

export interface ApprovalTrendData {
  month: string;
  totalSubmissions: number;
  approvedCount: number;
  rejectedCount: number;
  approvalRate: number;
  avgProcessingTime: number; // in days
}

export interface UserSubmissionData {
  userId: string;
  userName: string;
  department: string;
  totalSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  approvalRate: number;
  avgSubmissionTime: number; // in minutes
}

export interface DashboardFilters {
  dateRange: {
    from: Date;
    to: Date;
    preset: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  };
  department: string; // 'all' or specific department
  status: string; // 'all' | 'draft' | 'submitted' | 'approved' | 'rejected'
  template: string; // 'all' or specific template ID
  user: string; // 'all' or specific user ID
}

export interface DashboardData {
  summary: DashboardSummaryData;
  reportsOverTime: ReportsOverTimeData[];
  statusBreakdown: StatusBreakdownData[];
  departmentReports: DepartmentReportsData[];
  topTemplates: TopTemplatesData[];
  submissionsByDay: SubmissionsByDayData[];
  approvalTrend: ApprovalTrendData[];
  userSubmissions: UserSubmissionData[];
  lastUpdated: Date;
}

export interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

export interface DashboardDatePreset {
  label: string;
  value: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  days: number;
}

export interface DashboardExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  includeFilters: boolean;
  dateRange: {
    from: Date;
    to: Date;
  };
  selectedData: string[]; // Array of data types to include
}

// ===== REPORT EXPORT TYPES =====

export interface ReportExportFilters {
  status: 'all' | 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'archived';
  department: string; // 'all' or specific department ID
  template: string; // 'all' or specific template ID
  user: string; // 'all' or specific user ID
  dateRange: {
    from: Date | null;
    to: Date | null;
    preset: 'week' | 'month' | 'quarter' | 'year' | 'custom' | null;
  };
  search: string;
  includeComments: boolean;
  includeAttachments: boolean;
}

export interface ReportExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeComments: boolean;
  includeAttachments: boolean;
  includeFieldLabels: boolean;
  includeTemplateInfo: boolean;
  includeApprovalWorkflow: boolean;
  groupByTemplate: boolean;
  groupByDepartment: boolean;
  sortBy: 'submittedAt' | 'updatedAt' | 'title' | 'status' | 'department';
  sortDirection: 'asc' | 'desc';
  customFields: string[]; // Field IDs to include in export
  fileName?: string;
}

export interface ExportProgress {
  id: string;
  status: 'preparing' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  totalItems: number;
  processedItems: number;
  startedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
}

export interface ExportJob {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  type: 'reports' | 'users' | 'projects' | 'tasks' | 'dashboard';
  filters: ReportExportFilters;
  options: ReportExportOptions;
  progress: ExportProgress;
  createdAt: Date;
  completedAt?: Date;
}

export interface ExportHistory {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  type: 'reports' | 'users' | 'projects' | 'tasks' | 'dashboard';
  format: 'pdf' | 'excel' | 'csv';
  fileName: string;
  fileSize: number;
  totalRecords: number;
  filters: ReportExportFilters;
  options: ReportExportOptions;
  status: 'completed' | 'failed' | 'expired';
  downloadUrl?: string;
  expiresAt: Date;
  createdAt: Date;
  downloadCount: number;
  lastDownloadedAt?: Date;
}

export interface BatchExportRequest {
  reportIds: string[];
  format: 'pdf' | 'excel' | 'csv';
  includeAttachments: boolean;
  includeComments: boolean;
  zipFileName?: string;
}

export interface ExportPreview {
  totalRecords: number;
  estimatedFileSize: string;
  estimatedProcessingTime: string;
  includedFields: string[];
  sampleData: any[];
  warnings: string[];
}