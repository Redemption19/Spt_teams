'use client';

import React from 'react';
import { useWorkspace } from './workspace-context';
import { Project, Task } from './types';
import { useAuth } from './auth-context';
import { Folder } from './types';

export interface RolePermissions {
  canCreateWorkspace: boolean;
  canEditWorkspace: boolean;
  canDeleteWorkspace: boolean;
  canInviteUsers: boolean;
  canRemoveUsers: boolean;
  canCreateTeams: boolean;
  canEditTeams: boolean;
  canDeleteTeams: boolean;
  canAssignUserRoles: boolean;
  canViewReports: boolean;
  canManageReports: boolean;
  canManageBranches: boolean;
  canManageRegions: boolean;
  
  // === PROJECT PERMISSIONS ===
  canCreateProjects: boolean;
  canViewAllProjects: boolean;
  canEditAllProjects: boolean;
  canDeleteAllProjects: boolean;
  canManageProjectMembers: boolean;
  canAccessPrivateProjects: boolean;
  
  // === TASK PERMISSIONS ===
  canCreateTasks: boolean; // General task creation (admin/owner level)
  canViewAllTasks: boolean;
  canEditAllTasks: boolean;
  canDeleteAllTasks: boolean;
  canAssignAllTasks: boolean;
  canManageTaskPermissions: boolean;

  // === TEAM PERMISSIONS ===
  canManageTeamMembers: boolean;
  canAssignTeamLeads: boolean;
  canViewAllTeams: boolean;

  // === FOLDER PERMISSIONS ===
  canCreateFolders: boolean;
  canManageFolders: boolean;
  canShareFolders: boolean;

  // === CALENDAR PERMISSIONS ===
  canViewCalendar: boolean;
  canCreateEvents: boolean;
  canEditAllEvents: boolean;
  canDeleteAllEvents: boolean;
  canManageCalendarSettings: boolean;
  canViewReportDeadlines: boolean;
  canManageReportDeadlines: boolean;
  
  // === AI ASSISTANT PERMISSIONS ===
  canAccessAI: boolean;
  canUseAIRecommendations: boolean;
  canApplyAIRecommendations: boolean;
  canViewAIInsights: boolean;
  canManageAISettings: boolean;
  canUseAdvancedAIFeatures: boolean;
  
  // === SUPPORT PERMISSIONS ===
  canCreateSupportTickets: boolean;
  canViewAllSupportTickets: boolean;
  canManageSupportTickets: boolean;
  canViewSupportAnalytics: boolean;
  canManageSupportSettings: boolean;
}

export function useRolePermissions(): RolePermissions {
  const { userRole, currentWorkspace } = useWorkspace();

  // Check if admin workspace creation is allowed
  const adminCanCreateWorkspace = currentWorkspace?.settings?.allowAdminWorkspaceCreation === true;

  const permissions: RolePermissions = {
    canCreateWorkspace: userRole === 'owner' || (userRole === 'admin' && adminCanCreateWorkspace),
    canEditWorkspace: userRole === 'owner' || userRole === 'admin',
    canDeleteWorkspace: userRole === 'owner',
    canInviteUsers: userRole === 'owner' || userRole === 'admin',
    canRemoveUsers: userRole === 'owner' || userRole === 'admin',
    canCreateTeams: userRole === 'owner' || userRole === 'admin',
    canEditTeams: userRole === 'owner' || userRole === 'admin',
    canDeleteTeams: userRole === 'owner' || userRole === 'admin',
    canAssignUserRoles: userRole === 'owner',
    canViewReports: true, // Everyone can view reports
    canManageReports: userRole === 'owner' || userRole === 'admin',
    canManageBranches: userRole === 'owner' || userRole === 'admin',
    canManageRegions: userRole === 'owner' || userRole === 'admin',
    
    // === PROJECT PERMISSIONS ===
    canCreateProjects: userRole === 'owner' || userRole === 'admin',
    canViewAllProjects: true,
    canEditAllProjects: userRole === 'owner' || userRole === 'admin',
    canDeleteAllProjects: userRole === 'owner',
    canManageProjectMembers: userRole === 'owner' || userRole === 'admin',
    canAccessPrivateProjects: userRole === 'owner' || userRole === 'admin',
    
    // === TASK PERMISSIONS ===
    canCreateTasks: userRole === 'owner' || userRole === 'admin', // General task creation permission
    canViewAllTasks: true,
    canEditAllTasks: userRole === 'owner' || userRole === 'admin',
    canDeleteAllTasks: userRole === 'owner',
    canAssignAllTasks: userRole === 'owner' || userRole === 'admin',
    canManageTaskPermissions: userRole === 'owner' || userRole === 'admin',

    // === TEAM PERMISSIONS ===
    canManageTeamMembers: userRole === 'owner' || userRole === 'admin',
    canAssignTeamLeads: userRole === 'owner' || userRole === 'admin',
    canViewAllTeams: userRole === 'owner' || userRole === 'admin', // Members see only their teams

    // === FOLDER PERMISSIONS ===
    canCreateFolders: true, // All users can create folders (type restrictions apply)
    canManageFolders: userRole === 'owner' || userRole === 'admin',
    canShareFolders: userRole === 'owner' || userRole === 'admin',

    // === CALENDAR PERMISSIONS ===
    canViewCalendar: true, // Everyone can view calendar
    canCreateEvents: userRole === 'owner' || userRole === 'admin',
    canEditAllEvents: userRole === 'owner' || userRole === 'admin',
    canDeleteAllEvents: userRole === 'owner',
    canManageCalendarSettings: userRole === 'owner' || userRole === 'admin',
    canViewReportDeadlines: true, // Everyone can view report deadlines
    canManageReportDeadlines: userRole === 'owner' || userRole === 'admin',
    
    // === AI ASSISTANT PERMISSIONS ===
    canAccessAI: true, // Everyone can access basic AI features
    canUseAIRecommendations: true, // Everyone can view AI recommendations
    canApplyAIRecommendations: userRole === 'owner' || userRole === 'admin', // Only admins+ can apply recommendations
    canViewAIInsights: true, // Everyone can view AI insights
    canManageAISettings: userRole === 'owner', // Only owners can manage AI settings
    canUseAdvancedAIFeatures: userRole === 'owner' || userRole === 'admin', // Advanced features for admins+
    
    // === SUPPORT PERMISSIONS ===
    canCreateSupportTickets: true, // All users can create support tickets
    canViewAllSupportTickets: userRole === 'owner' || userRole === 'admin', // Only admins+ can view all tickets
    canManageSupportTickets: userRole === 'owner' || userRole === 'admin', // Only admins+ can manage tickets
    canViewSupportAnalytics: userRole === 'owner' || userRole === 'admin', // Only admins+ can view analytics
    canManageSupportSettings: userRole === 'owner', // Only owners can manage support settings
  };

  return permissions;
}

export function useHasPermission(permission: keyof RolePermissions): boolean {
  const permissions = useRolePermissions();
  return permissions[permission];
}

export function useRequirePermission(permission: keyof RolePermissions) {
  const hasPermission = useHasPermission(permission);
  
  if (!hasPermission) {
    throw new Error(`Insufficient permissions: ${permission} required`);
  }
  
  return hasPermission;
}

// Higher-order component for role-based access control
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: keyof RolePermissions
) {
  return function GuardedComponent(props: P) {
    const hasPermission = useHasPermission(requiredPermission);
    
    if (!hasPermission) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">Access Denied</h3>
            <p className="text-sm text-muted-foreground">
              You don&apos;t have permission to access this feature.
            </p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}

// Utility function to check if user is admin or owner
export function useIsAdminOrOwner(): boolean {
  const { userRole } = useWorkspace();
  return userRole === 'owner' || userRole === 'admin';
}

// Utility function to check if user is owner
export function useIsOwner(): boolean {
  const { userRole } = useWorkspace();
  return userRole === 'owner';
}

// ===============================
// ENHANCED TASK CREATION PERMISSIONS
// ===============================

/**
 * Hook to check if user can create tasks in a specific project context
 * This allows members to create tasks in projects they're part of
 */
export function useCanCreateTasksInProject(projects: any[] = [], userId?: string): boolean {
  const { userRole } = useWorkspace();
  const basePermissions = useRolePermissions();
  
  // Admin/Owner can create tasks anywhere
  if (basePermissions.canCreateTasks) {
    return true;
  }
  
  // Members can create tasks if they're part of at least one project
  if (userRole === 'member' && userId) {
    return projects.some(project => {
      // Check if user is project member, admin, or owner
      return project.ownerId === userId ||
             project.projectAdmins?.includes(userId) ||
             project.projectMembers?.includes(userId);
    });
  }
  
  return false;
}

/**
 * Hook to check if user can create tasks in a specific project
 */
export function useCanCreateTasksInSpecificProject(project: any, userId?: string): boolean {
  const { userRole } = useWorkspace();
  const basePermissions = useRolePermissions();
  
  // Admin/Owner can create tasks anywhere
  if (basePermissions.canCreateTasks) {
    return true;
  }
  
  // Members can create tasks if they're part of this specific project
  if (userRole === 'member' && userId && project) {
    return project.ownerId === userId ||
           project.projectAdmins?.includes(userId) ||
           project.projectMembers?.includes(userId);
  }
  
  return false;
}

// Team role permissions
export interface TeamRolePermissions {
  canEditTeam: boolean;
  canDeleteTeam: boolean;
  canAssignMembers: boolean;
  canRemoveMembers: boolean;
  canCreateTasks: boolean;
  canAssignTasks: boolean;
}

export function useTeamRolePermissions(teamRole?: string): TeamRolePermissions {
  // User's workspace role from context
  const { userRole } = useWorkspace();
  const isWorkspaceAdmin = userRole === 'owner' || userRole === 'admin';
  
  // Team-specific role
  const isTeamLead = teamRole === 'lead';
  
  const permissions: TeamRolePermissions = {
    canEditTeam: isWorkspaceAdmin || isTeamLead,
    canDeleteTeam: isWorkspaceAdmin,
    canAssignMembers: isWorkspaceAdmin || isTeamLead,
    canRemoveMembers: isWorkspaceAdmin || isTeamLead,
    canCreateTasks: true, // Everyone in team can create tasks
    canAssignTasks: isWorkspaceAdmin || isTeamLead
  };
  
  return permissions;
}

export function useHasTeamPermission(
  permission: keyof TeamRolePermissions,
  teamRole?: string
): boolean {
  const permissions = useTeamRolePermissions(teamRole);
  return permissions[permission];
}

// ===============================
// PROJECT & TASK RBAC SYSTEM
// ===============================

export interface ProjectPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreateTasks: boolean;
  canManageTasks: boolean;
  canAssignTasks: boolean;
  canManageMembers: boolean;
  canChangeVisibility: boolean;
  canArchive: boolean;
}

export interface TaskPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canComment: boolean;
  canAssign: boolean;
  canChangeStatus: boolean;
  canViewComments: boolean;
  canEditComments: boolean;
}

// ===============================
// ENHANCED PROJECT ROLE CHECKING
// ===============================

/**
 * Get user's relationship to a project
 */
export function useProjectRole(project: Project | null, userId?: string): {
  role: 'none' | 'viewer' | 'member' | 'admin' | 'owner';
  isProjectCreator: boolean;
  isProjectAdmin: boolean;
  isProjectMember: boolean;
  canManageProject: boolean;
} {
  const { userRole } = useWorkspace();
  
  if (!project || !userId) {
    return {
      role: 'none',
      isProjectCreator: false,
      isProjectAdmin: false,
      isProjectMember: false,
      canManageProject: false,
    };
  }

  // Check workspace-level roles first
  if (userRole === 'owner') {
    return {
      role: 'owner',
      isProjectCreator: project.ownerId === userId,
      isProjectAdmin: true,
      isProjectMember: true,
      canManageProject: true,
    };
  }

  if (userRole === 'admin') {
    return {
      role: 'admin',
      isProjectCreator: project.ownerId === userId,
      isProjectAdmin: true,
      isProjectMember: true,
      canManageProject: true,
    };
  }

  // Check project-specific roles
  const isProjectOwner = project.ownerId === userId;
  if (isProjectOwner) {
    return {
      role: 'owner',
      isProjectCreator: true,
      isProjectAdmin: true,
      isProjectMember: true,
      canManageProject: true,
    };
  }

  const isProjectAdmin = project.projectAdmins?.includes(userId);
  if (isProjectAdmin) {
    return {
      role: 'admin',
      isProjectCreator: false,
      isProjectAdmin: true,
      isProjectMember: true,
      canManageProject: true,
    };
  }

  const isProjectMember = project.projectMembers?.includes(userId);
  if (isProjectMember) {
    return {
      role: 'member',
      isProjectCreator: false,
      isProjectAdmin: false,
      isProjectMember: true,
      canManageProject: false,
    };
  }

  // Check if user has view access
  const canView = project.visibility === 'public' || 
                  project.permissions?.canView?.includes(userId);

  return {
    role: canView ? 'viewer' : 'none',
    isProjectCreator: false,
    isProjectAdmin: false,
    isProjectMember: false,
    canManageProject: false,
  };
}

/**
 * Hook to get user's permissions for a specific project
 */
export function useProjectPermissions(project: Project | null, userId?: string): ProjectPermissions {
  const { userRole } = useWorkspace();
  const basePermissions = useRolePermissions();
  const projectRole = useProjectRole(project, userId);

  if (!project || !userId) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canCreateTasks: false,
      canManageTasks: false,
      canAssignTasks: false,
      canManageMembers: false,
      canChangeVisibility: false,
      canArchive: false,
    };
  }

  // Owner has ultimate authority over all projects
  if (userRole === 'owner') {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canCreateTasks: true,
      canManageTasks: true,
      canAssignTasks: true,
      canManageMembers: true,
      canChangeVisibility: true,
      canArchive: true,
    };
  }

  // System admin has extensive control
  if (userRole === 'admin') {
    return {
      canView: true,
      canEdit: true,
      canDelete: false, // Only owner can delete projects
      canCreateTasks: true,
      canManageTasks: true,
      canAssignTasks: true,
      canManageMembers: true,
      canChangeVisibility: false, // Only owner can change visibility
      canArchive: true,
    };
  }

  // Project creator (owner) permissions
  if (projectRole.isProjectCreator) {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canCreateTasks: true,
      canManageTasks: true,
      canAssignTasks: true,
      canManageMembers: true,
      canChangeVisibility: true,
      canArchive: true,
    };
  }

  // Project admin permissions
  if (projectRole.isProjectAdmin) {
    return {
      canView: true,
      canEdit: true,
      canDelete: false,
      canCreateTasks: true,
      canManageTasks: true,
      canAssignTasks: true,
      canManageMembers: true,
      canChangeVisibility: false,
      canArchive: false,
    };
  }

  // Project member permissions (enhanced to allow task creation)
  if (projectRole.isProjectMember) {
    return {
      canView: true,
      canEdit: false,
      canDelete: false,
      canCreateTasks: true, // ✅ ENHANCED: Members can now create tasks
      canManageTasks: false,
      canAssignTasks: false,
      canManageMembers: false,
      canChangeVisibility: false,
      canArchive: false,
    };
  }

  // Check project visibility and specific permissions
  const canView = project.visibility === 'public' || 
                  project.permissions?.canView?.includes(userId) ||
                  false;

  if (!canView) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canCreateTasks: false,
      canManageTasks: false,
      canAssignTasks: false,
      canManageMembers: false,
      canChangeVisibility: false,
      canArchive: false,
    };
  }

  // Viewer permissions with specific grants
  return {
    canView: canView,
    canEdit: project.permissions?.canEdit?.includes(userId) || false,
    canDelete: project.permissions?.canDelete?.includes(userId) || false,
    canCreateTasks: project.permissions?.canManageTasks?.includes(userId) || false, // Only if explicitly granted
    canManageTasks: project.permissions?.canManageTasks?.includes(userId) || false,
    canAssignTasks: project.permissions?.canAssignTasks?.includes(userId) || false,
    canManageMembers: project.permissions?.canManageMembers?.includes(userId) || false,
    canChangeVisibility: false, // Only owner/admin
    canArchive: false, // Only owner/admin
  };
}

/**
 * Hook to get user's permissions for a specific task
 */
export function useTaskPermissions(task: Task | null, project: Project | null, userId?: string): TaskPermissions {
  const { userRole } = useWorkspace();
  const projectPermissions = useProjectPermissions(project, userId);

  if (!task || !project || !userId) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canComment: false,
      canAssign: false,
      canChangeStatus: false,
      canViewComments: false,
      canEditComments: false,
    };
  }

  // Owner has ultimate authority
  if (userRole === 'owner') {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canComment: true,
      canAssign: true,
      canChangeStatus: true,
      canViewComments: true,
      canEditComments: true,
    };
  }

  // Admin has extensive control
  if (userRole === 'admin') {
    return {
      canView: true,
      canEdit: true,
      canDelete: false, // Only owner can delete
      canComment: true,
      canAssign: true,
      canChangeStatus: true,
      canViewComments: true,
      canEditComments: true,
    };
  }

  // Check if user is task assignee
  const isAssignee = task.assigneeId === userId;
  
  // Check if user is task creator
  const isCreator = task.createdBy === userId;

  // If user doesn't have project access, deny all task access
  if (!projectPermissions.canView) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canComment: false,
      canAssign: false,
      canChangeStatus: false,
      canViewComments: false,
      canEditComments: false,
    };
  }

  // Check task visibility
  let canViewTask = false;
  if (task.visibility === 'public') {
    canViewTask = true;
  } else if (task.visibility === 'assignee-only') {
    canViewTask = isAssignee || isCreator;
  } else if (task.visibility === 'private') {
    canViewTask = task.permissions?.canView?.includes(userId) || isCreator || isAssignee;
  }

  if (!canViewTask) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canComment: false,
      canAssign: false,
      canChangeStatus: false,
      canViewComments: false,
      canEditComments: false,
    };
  }

  // Task creator permissions
  if (isCreator) {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canComment: true,
      canAssign: projectPermissions.canAssignTasks,
      canChangeStatus: true,
      canViewComments: true,
      canEditComments: true,
    };
  }

  // Task assignee permissions
  if (isAssignee) {
    return {
      canView: true,
      canEdit: task.permissions?.canEdit?.includes(userId) || true, // Assignee can edit by default
      canDelete: false,
      canComment: true,
      canAssign: false,
      canChangeStatus: true, // Assignee can change status
      canViewComments: true,
      canEditComments: false, // Can't edit others' comments
    };
  }

  // Project-level permissions apply to tasks
  return {
    canView: canViewTask,
    canEdit: task.permissions?.canEdit?.includes(userId) || projectPermissions.canManageTasks,
    canDelete: task.permissions?.canDelete?.includes(userId) || projectPermissions.canManageTasks,
    canComment: task.permissions?.canComment?.includes(userId) || true, // Anyone who can view can comment
    canAssign: task.permissions?.canAssign?.includes(userId) || projectPermissions.canAssignTasks,
    canChangeStatus: projectPermissions.canManageTasks || isAssignee,
    canViewComments: canViewTask,
    canEditComments: false, // Only comment author can edit their own comments
  };
}

/**
 * Hook to check if user can perform a specific action on a project
 */
export function useHasProjectPermission(
  permission: keyof ProjectPermissions,
  project: Project | null,
  userId?: string
): boolean {
  const permissions = useProjectPermissions(project, userId);
  return permissions[permission];
}

/**
 * Hook to check if user can perform a specific action on a task
 */
export function useHasTaskPermission(
  permission: keyof TaskPermissions,
  task: Task | null,
  project: Project | null,
  userId?: string
): boolean {
  const permissions = useTaskPermissions(task, project, userId);
  return permissions[permission];
}

/**
 * Utility function to get projects accessible to a user
 */
export function getAccessibleProjects(projects: Project[], userId: string, userRole: string): Project[] {
  return projects.filter(project => {
    // Owner and admin can see all projects
    if (userRole === 'owner' || userRole === 'admin') {
      return true;
    }

    // Project owner can see their projects
    if (project.ownerId === userId) {
      return true;
    }

    // Project admin can see the project
    if (project.projectAdmins?.includes(userId)) {
      return true;
    }

    // Project member can see the project
    if (project.projectMembers?.includes(userId)) {
      return true;
    }

    // Public projects are visible to all
    if (project.visibility === 'public') {
      return true;
    }

    // Check specific view permissions
    if (project.permissions?.canView?.includes(userId)) {
      return true;
    }

    return false;
  });
}

/**
 * Utility function to get tasks accessible to a user within a project
 */
export function getAccessibleTasks(tasks: Task[], project: Project, userId: string, userRole: string): Task[] {
  return tasks.filter(task => {
    // Owner and admin can see all tasks
    if (userRole === 'owner' || userRole === 'admin') {
      return true;
    }

    // Task creator can see their tasks
    if (task.createdBy === userId) {
      return true;
    }

    // Task assignee can see assigned tasks
    if (task.assigneeId === userId) {
      return true;
    }

    // Check task visibility
    if (task.visibility === 'public') {
      return true;
    }

    if (task.visibility === 'assignee-only') {
      return task.assigneeId === userId || task.createdBy === userId;
    }

    if (task.visibility === 'private') {
      return task.permissions?.canView?.includes(userId) || 
             task.createdBy === userId || 
             task.assigneeId === userId;
    }

    return false;
  });
}

// ===============================
// TEAM-SPECIFIC RBAC FUNCTIONS
// ===============================

/**
 * Check if user can create teams in the current workspace
 * Admin: Can create teams only under the sub-workspace they're under
 * Owner: Can create teams for both main workspace and sub-workspaces
 */
export function useCanCreateTeamsInWorkspace(): boolean {
  const { userRole, currentWorkspace } = useWorkspace();
  
  if (!currentWorkspace) return false;
  
  // Owner can create teams in any workspace
  if (userRole === 'owner') {
    return true;
  }
  
  // Admin can create teams only in their assigned workspace
  if (userRole === 'admin') {
    return true; // Admin is already restricted to their workspace by context
  }
  
  // Members cannot create teams
  return false;
}

/**
 * Check if user can manage team members
 */
export function useCanManageTeamMembers(): boolean {
  const { userRole } = useWorkspace();
  return userRole === 'owner' || userRole === 'admin';
}

/**
 * Check if user can assign team leads
 */
export function useCanAssignTeamLeads(): boolean {
  const { userRole } = useWorkspace();
  return userRole === 'owner' || userRole === 'admin';
}

/**
 * Check if user can view all teams or only their teams
 */
export function useCanViewAllTeams(): boolean {
  const { userRole } = useWorkspace();
  return userRole === 'owner' || userRole === 'admin';
}

/**
 * Check if user can edit a specific team
 */
export function useCanEditTeam(team: any, userId?: string): boolean {
  const { userRole } = useWorkspace();
  
  if (!team || !userId) return false;
  
  // Owner can edit any team
  if (userRole === 'owner') return true;
  
  // Admin can edit teams in their workspace
  if (userRole === 'admin') return true;
  
  // Team lead can edit their team
  if (team.leadId === userId) return true;
  
  return false;
}

/**
 * Check if user can delete a specific team
 */
export function useCanDeleteTeam(team: any): boolean {
  const { userRole } = useWorkspace();
  
  if (!team) return false;
  
  // Only owner and admin can delete teams
  return userRole === 'owner' || userRole === 'admin';
}

// ===== FOLDER RBAC HOOKS =====

/**
 * Check if user can create folders in workspace
 */
export function useCanCreateFolders(): boolean {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  
  if (!userProfile || !userRole) return false;
  
  // All users can create folders, but type restrictions apply
  return true;
}

/**
 * Check if user can access specific folder
 */
export function useCanAccessFolder(folder?: Folder): boolean {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  
  if (!userProfile || !folder || !userRole) return false;
  
  // Owner and Admin have access to all folders
  if (userRole === 'owner' || userRole === 'admin') {
    return true;
  }
  
  // Folder owner can always access their folder
  if (folder.ownerId === userProfile.id) {
    return true;
  }
  
  // Member folder: only the member can access (admins/owners already handled above)
  if (folder.type === 'member' && folder.memberId === userProfile.id) {
    return true;
  }
  
  // Member-assigned folder: assigned member can access
  if (folder.type === 'member-assigned' && folder.assignedMemberId === userProfile.id) {
    return true;
  }
  
  // Check explicit permissions
  if (folder.permissions.read.includes(userProfile.id) || 
      folder.permissions.write.includes(userProfile.id) || 
      folder.permissions.admin.includes(userProfile.id)) {
    return true;
  }
  
  // Check visibility settings
  if (folder.visibility === 'public') {
    return true;
  }
  
  if (folder.visibility === 'team' && folder.teamId) {
    // Check if user is in the team
    return userProfile.teamIds.includes(folder.teamId);
  }
  
  return false;
}

/**
 * Check if user can edit specific folder
 */
export function useCanEditFolder(folder?: Folder): boolean {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  
  if (!userProfile || !folder || !userRole) return false;
  
  // Owner and Admin can edit all folders
  if (userRole === 'owner' || userRole === 'admin') {
    return true;
  }
  
  // Folder owner can edit their folder
  if (folder.ownerId === userProfile.id) {
    return true;
  }
  
  // Member-assigned folder: assigned member can edit content but not folder settings
  if (folder.type === 'member-assigned' && folder.assignedMemberId === userProfile.id) {
    return true;
  }
  
  // Check explicit write/admin permissions
  return folder.permissions.write.includes(userProfile.id) || 
         folder.permissions.admin.includes(userProfile.id);
}

/**
 * Check if user can delete specific folder
 */
export function useCanDeleteFolder(folder?: Folder): boolean {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  
  if (!userProfile || !folder || !userRole) return false;
  
  // Only Owner can delete system folders
  if (folder.isSystemFolder && userRole !== 'owner') {
    return false;
  }
  
  // Member-assigned folders can only be deleted by admins/owners
  if (folder.type === 'member-assigned' && userRole === 'member') {
    return false;
  }
  
  // Owner can delete all folders
  if (userRole === 'owner') {
    return true;
  }
  
  // Admin can delete non-system folders
  if (userRole === 'admin' && !folder.isSystemFolder) {
    return true;
  }
  
  // Check explicit delete permissions
  return folder.permissions.delete.includes(userProfile.id);
}

/**
 * Check if user can upload files to folder
 */
export function useCanUploadToFolder(folder?: Folder): boolean {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  
  if (!userProfile || !folder || !userRole) return false;
  
  // Can't upload to archived/deleted folders
  if (folder.status !== 'active') return false;
  
  // Owner and Admin can upload anywhere
  if (userRole === 'owner' || userRole === 'admin') {
    return true;
  }
  
  // Folder owner can upload
  if (folder.ownerId === userProfile.id) {
    return true;
  }
  
  // Member can upload to their own member folder
  if (folder.type === 'member' && folder.memberId === userProfile.id) {
    return true;
  }
  
  // Member can upload to folders assigned to them
  if (folder.type === 'member-assigned' && folder.assignedMemberId === userProfile.id) {
    return true;
  }
  
  // Check explicit write/admin permissions
  return folder.permissions.write.includes(userProfile.id) || 
         folder.permissions.admin.includes(userProfile.id);
}

/**
 * Check if user can manage folder permissions
 */
export function useCanManageFolderPermissions(folder?: Folder): boolean {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  
  if (!userProfile || !folder || !userRole) return false;
  
  // Owner can manage all permissions
  if (userRole === 'owner') {
    return true;
  }
  
  // Admin can manage non-member folder permissions
  if (userRole === 'admin' && folder.type !== 'member') {
    return true;
  }
  
  // Admin can manage member folder permissions they created
  if (userRole === 'admin' && folder.type === 'member' && folder.createdBy === userProfile.id) {
    return true;
  }
  
  // Admin can manage member-assigned folders they created
  if (userRole === 'admin' && folder.type === 'member-assigned') {
    return true;
  }
  
  // Check explicit admin permissions
  return folder.permissions.admin.includes(userProfile.id);
}

/**
 * Check if user can view member folders (for admins/owners)
 */
export function useCanViewMemberFolders(): boolean {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  
  if (!userProfile || !userRole) return false;
  
  return userRole === 'owner' || userRole === 'admin';
}

/**
 * Check if user can create member folders
 */
export function useCanCreateMemberFolders(): boolean {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  
  if (!userProfile || !userRole) return false;
  
  return userRole === 'owner' || userRole === 'admin';
}

/**
 * Get user's accessible folders with RBAC filtering
 */
export function useAccessibleFolders(folders: Folder[]): Folder[] {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  
  if (!userProfile || !userRole) return [];
  
  return folders.filter(folder => {
    // Owner and Admin see all folders
    if (userRole === 'owner' || userRole === 'admin') {
      return true;
    }
    
    // Folder owner can see their folder
    if (folder.ownerId === userProfile.id) {
      return true;
    }
    
    // Member can see their own member folder
    if (folder.type === 'member' && folder.memberId === userProfile.id) {
      return true;
    }
    
    // Member can see folders assigned to them
    if (folder.type === 'member-assigned' && folder.assignedMemberId === userProfile.id) {
      return true;
    }
    
    // Check explicit permissions
    if (folder.permissions.read.includes(userProfile.id) || 
        folder.permissions.write.includes(userProfile.id) || 
        folder.permissions.admin.includes(userProfile.id)) {
      return true;
    }
    
    // Check visibility settings
    if (folder.visibility === 'public') {
      return true;
    }
    
    if (folder.visibility === 'team' && folder.teamId) {
      return userProfile.teamIds.includes(folder.teamId);
    }
    
    return false;
  });
}

/**
 * Get folder type user can create
 */
export function useAllowedFolderTypes(): Array<'team' | 'personal' | 'project' | 'shared' | 'member-assigned'> {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  
  if (!userProfile || !userRole) return [];
  
  const allowedTypes: Array<'team' | 'personal' | 'project' | 'shared' | 'member-assigned'> = ['personal'];
  
  if (userRole === 'owner' || userRole === 'admin') {
    allowedTypes.push('team', 'project', 'shared', 'member-assigned');
  }
  
  return allowedTypes;
}

/**
 * Check folder creation limits
 */
export function useFolderCreationLimits() {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  
  if (!userProfile || !userRole) {
    return {
      canCreateMore: false,
      maxFolders: 0,
      currentCount: 0,
      remaining: 0
    };
  }
  
  // Define limits based on role
  const limits: { [key: string]: number } = {
    owner: 1000,
    admin: 500,
    member: 50
  };
  
  const maxFolders = limits[userRole] || 10;
  
  // For now, we'll assume currentCount is 0 - this would need to be fetched from state
  const currentCount = 0;
  const remaining = Math.max(0, maxFolders - currentCount);
  
  return {
    canCreateMore: remaining > 0,
    maxFolders,
    currentCount,
    remaining
  };
}

/**
 * Check if user can share folders
 */
export function useCanShareFolders(): boolean {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  const hasSharePermission = useHasPermission('canCreateFolders'); // Using existing permission
  
  if (!userProfile || !userRole) return false;
  
  return hasSharePermission || userRole === 'owner' || userRole === 'admin';
}

/**
 * Get folder action permissions for a specific folder
 */
export function useFolderPermissions(folder?: Folder) {
  const canAccess = useCanAccessFolder(folder);
  const canEdit = useCanEditFolder(folder);
  const canDelete = useCanDeleteFolder(folder);
  const canUpload = useCanUploadToFolder(folder);
  const canManagePermissions = useCanManageFolderPermissions(folder);
  const canShare = useCanShareFolders();
  
  return {
    canAccess,
    canEdit,
    canDelete,
    canUpload,
    canManagePermissions,
    canShare,
    canOpen: canAccess,
    canRename: canEdit,
    canMove: canEdit && !folder?.isSystemFolder,
    canArchive: canDelete && !folder?.isSystemFolder,
    canDownload: canAccess,
    canViewActivity: canAccess
  };
}

// ===============================
// CALENDAR RBAC SYSTEM WITH WORKSPACE ISOLATION
// ===============================

export interface CalendarEventPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canComment: boolean;
  canChangeStatus: boolean;
  canInviteUsers: boolean;
  canManageAttendees: boolean;
}

export interface CalendarReportPermissions {
  canView: boolean;
  canSubmit: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReject: boolean;
  canExport: boolean;
  canViewAnalytics: boolean;
}

export interface CalendarWorkspacePermissions {
  canViewWorkspaceEvents: boolean;
  canViewCrossWorkspace: boolean;
  canManageWorkspaceCalendar: boolean;
  canAccessSubWorkspaces: boolean;
  canViewAllRegions: boolean;
  canViewAllBranches: boolean;
}

/**
 * Hook to get user's workspace-level calendar permissions
 * Handles the hierarchical workspace structure (Region/Branch sub-workspaces)
 */
export function useCalendarWorkspacePermissions(): CalendarWorkspacePermissions {
  const { userRole, currentWorkspace } = useWorkspace();
  const basePermissions = useRolePermissions();

  // Owner has access across all workspaces
  if (userRole === 'owner') {
    return {
      canViewWorkspaceEvents: true,
      canViewCrossWorkspace: true,
      canManageWorkspaceCalendar: true,
      canAccessSubWorkspaces: true,
      canViewAllRegions: true,
      canViewAllBranches: true,
    };
  }

  // Admin has control within their assigned workspace and sub-workspaces
  if (userRole === 'admin') {
    return {
      canViewWorkspaceEvents: true,
      canViewCrossWorkspace: false, // Cannot access other Region/Branch workspaces
      canManageWorkspaceCalendar: true,
      canAccessSubWorkspaces: false, // Limited to their assigned workspace
      canViewAllRegions: false,
      canViewAllBranches: false,
    };
  }

  // Member has limited access within their workspace only
  return {
    canViewWorkspaceEvents: true,
    canViewCrossWorkspace: false,
    canManageWorkspaceCalendar: false,
    canAccessSubWorkspaces: false,
    canViewAllRegions: false,
    canViewAllBranches: false,
  };
}

/**
 * Hook to get user's permissions for a specific calendar event with workspace isolation
 */
export function useCalendarEventPermissions(event: any | null, userId?: string): CalendarEventPermissions {
  const { userRole, currentWorkspace } = useWorkspace();
  const basePermissions = useRolePermissions();
  const workspacePermissions = useCalendarWorkspacePermissions();

  if (!event || !userId || !currentWorkspace) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canComment: false,
      canChangeStatus: false,
      canInviteUsers: false,
      canManageAttendees: false,
    };
  }

  // Check if event belongs to current workspace (workspace isolation)
  const isEventInCurrentWorkspace = event.workspaceId === currentWorkspace.id;
  
  // If event is not in current workspace, check cross-workspace permissions
  if (!isEventInCurrentWorkspace && !workspacePermissions.canViewCrossWorkspace) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canComment: false,
      canChangeStatus: false,
      canInviteUsers: false,
      canManageAttendees: false,
    };
  }

  // Owner has ultimate authority over all events in accessible workspaces
  if (userRole === 'owner') {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canComment: true,
      canChangeStatus: true,
      canInviteUsers: true,
      canManageAttendees: true,
    };
  }

  // Admin has extensive control within their workspace
  if (userRole === 'admin') {
    const canManageInWorkspace = isEventInCurrentWorkspace;
    return {
      canView: true,
      canEdit: canManageInWorkspace,
      canDelete: canManageInWorkspace && basePermissions.canDeleteAllEvents,
      canComment: true,
      canChangeStatus: canManageInWorkspace,
      canInviteUsers: canManageInWorkspace && basePermissions.canCreateEvents,
      canManageAttendees: canManageInWorkspace,
    };
  }

  // Event creator permissions (within same workspace)
  const isEventCreator = event.createdBy === userId && isEventInCurrentWorkspace;
  if (isEventCreator) {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canComment: true,
      canChangeStatus: true,
      canInviteUsers: true,
      canManageAttendees: true,
    };
  }

  // Check event visibility and access permissions
  const isPublicEvent = event.visibility === 'public' || !event.visibility;
  const isInvitedUser = event.invitees?.includes(userId) || event.attendees?.includes(userId);
  const hasTeamAccess = event.teamId && event.teamMembers?.includes(userId);
  const hasWorkspaceAccess = isEventInCurrentWorkspace && (isPublicEvent || isInvitedUser || hasTeamAccess);

  if (!hasWorkspaceAccess) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canComment: false,
      canChangeStatus: false,
      canInviteUsers: false,
      canManageAttendees: false,
    };
  }

  // Regular member permissions for accessible events
  return {
    canView: true,
    canEdit: false,
    canDelete: false,
    canComment: true,
    canChangeStatus: false,
    canInviteUsers: false,
    canManageAttendees: false,
  };
}

/**
 * Hook to get user's permissions for calendar reports with workspace isolation
 */
export function useCalendarReportPermissions(report: any | null, userId?: string): CalendarReportPermissions {
  const { userRole, currentWorkspace } = useWorkspace();
  const basePermissions = useRolePermissions();
  const workspacePermissions = useCalendarWorkspacePermissions();

  if (!report || !userId || !currentWorkspace) {
    return {
      canView: false,
      canSubmit: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canReject: false,
      canExport: false,
      canViewAnalytics: false,
    };
  }

  // Check if report belongs to current workspace (workspace isolation)
  const isReportInCurrentWorkspace = report.workspaceId === currentWorkspace.id;
  
  // If report is not in current workspace, check cross-workspace permissions
  if (!isReportInCurrentWorkspace && !workspacePermissions.canViewCrossWorkspace) {
    return {
      canView: false,
      canSubmit: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canReject: false,
      canExport: false,
      canViewAnalytics: false,
    };
  }

  // Owner has ultimate authority
  if (userRole === 'owner') {
    return {
      canView: true,
      canSubmit: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canReject: true,
      canExport: true,
      canViewAnalytics: true,
    };
  }

  // Admin permissions within their workspace
  if (userRole === 'admin') {
    const canManageInWorkspace = isReportInCurrentWorkspace;
    return {
      canView: true,
      canSubmit: canManageInWorkspace,
      canEdit: false, // Can't edit others' reports
      canDelete: false, // Can't delete others' reports
      canApprove: canManageInWorkspace && basePermissions.canManageReports,
      canReject: canManageInWorkspace && basePermissions.canManageReports,
      canExport: canManageInWorkspace && basePermissions.canManageReports,
      canViewAnalytics: canManageInWorkspace && basePermissions.canManageReports,
    };
  }

  // Report author permissions (within same workspace)
  const isReportAuthor = report.authorId === userId && isReportInCurrentWorkspace;
  if (isReportAuthor) {
    return {
      canView: true,
      canSubmit: report.status === 'draft',
      canEdit: report.status === 'draft',
      canDelete: report.status === 'draft',
      canApprove: false,
      canReject: false,
      canExport: false,
      canViewAnalytics: false,
    };
  }

  // Regular member permissions for accessible reports
  const hasReportAccess = isReportInCurrentWorkspace && 
                         basePermissions.canViewReports && 
                         (report.visibility === 'public' || !report.visibility);

  return {
    canView: hasReportAccess,
    canSubmit: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canReject: false,
    canExport: false,
    canViewAnalytics: false,
  };
}

/**
 * Hook to check calendar access permissions with workspace context
 */
export function useCalendarAccess() {
  const permissions = useRolePermissions();
  const workspacePermissions = useCalendarWorkspacePermissions();
  const { userRole } = useWorkspace();

  return {
    canAccessCalendar: permissions.canViewCalendar,
    canCreateEvents: permissions.canCreateEvents,
    canEditEvents: permissions.canEditAllEvents,
    canDeleteEvents: permissions.canDeleteAllEvents,
    canManageSettings: permissions.canManageCalendarSettings,
    canViewReportDeadlines: permissions.canViewReportDeadlines,
    canManageReportDeadlines: permissions.canManageReportDeadlines,
    
    // Workspace-specific permissions
    canViewWorkspaceEvents: workspacePermissions.canViewWorkspaceEvents,
    canViewCrossWorkspace: workspacePermissions.canViewCrossWorkspace,
    canManageWorkspaceCalendar: workspacePermissions.canManageWorkspaceCalendar,
    canAccessSubWorkspaces: workspacePermissions.canAccessSubWorkspaces,
    canViewAllRegions: workspacePermissions.canViewAllRegions,
    canViewAllBranches: workspacePermissions.canViewAllBranches,
    
    // Role information
    isAdminOrOwner: userRole === 'admin' || userRole === 'owner',
    userRole: userRole,
  };
}

/**
 * Hook to check if user can perform specific calendar event action
 */
export function useCanEditCalendarEvent(event: any | null, userId?: string): boolean {
  const permissions = useCalendarEventPermissions(event, userId);
  return permissions.canEdit;
}

/**
 * Hook to check if user can delete specific calendar event
 */
export function useCanDeleteCalendarEvent(event: any | null, userId?: string): boolean {
  const permissions = useCalendarEventPermissions(event, userId);
  return permissions.canDelete;
}

/**
 * Hook to check if user can invite users to calendar event
 */
export function useCanInviteToCalendarEvent(event: any | null, userId?: string): boolean {
  const permissions = useCalendarEventPermissions(event, userId);
  return permissions.canInviteUsers;
}

/**
 * Hook to check if user can submit specific report
 */
export function useCanSubmitReport(report: any | null, userId?: string): boolean {
  const permissions = useCalendarReportPermissions(report, userId);
  return permissions.canSubmit;
}

/**
 * Hook to check if user can edit specific report
 */
export function useCanEditReport(report: any | null, userId?: string): boolean {
  const permissions = useCalendarReportPermissions(report, userId);
  return permissions.canEdit;
}

/**
 * Hook to check if user can approve/reject reports
 */
export function useCanManageReportApproval(report: any | null, userId?: string): boolean {
  const permissions = useCalendarReportPermissions(report, userId);
  return permissions.canApprove || permissions.canReject;
}

/**
 * Hook to check if user can export reports
 */
export function useCanExportReports(report: any | null, userId?: string): boolean {
  const permissions = useCalendarReportPermissions(report, userId);
  return permissions.canExport;
}

/**
 * Utility function to filter events by workspace access
 */
export function getAccessibleCalendarEvents(events: any[], userId: string, currentWorkspaceId: string, userRole: string): any[] {
  return events.filter(event => {
    // Owner can see all events
    if (userRole === 'owner') {
      return true;
    }

    // Check workspace isolation
    const isEventInCurrentWorkspace = event.workspaceId === currentWorkspaceId;
    if (!isEventInCurrentWorkspace) {
      return false; // Admin and Member cannot see events from other workspaces
    }

    // Admin can see all events in their workspace
    if (userRole === 'admin') {
      return true;
    }

    // Member can see events they created, are invited to, or are public
    return event.createdBy === userId ||
           event.invitees?.includes(userId) ||
           event.attendees?.includes(userId) ||
           event.visibility === 'public' ||
           !event.visibility;
  });
}

/**
 * Utility function to filter reports by workspace access
 */
export function getAccessibleCalendarReports(reports: any[], userId: string, currentWorkspaceId: string, userRole: string): any[] {
  return reports.filter(report => {
    // Owner can see all reports
    if (userRole === 'owner') {
      return true;
    }

    // Check workspace isolation
    const isReportInCurrentWorkspace = report.workspaceId === currentWorkspaceId;
    if (!isReportInCurrentWorkspace) {
      return false; // Admin and Member cannot see reports from other workspaces
    }

    // Admin can see all reports in their workspace
    if (userRole === 'admin') {
      return true;
    }

    // Member can see reports they authored or are public
    return report.authorId === userId ||
           report.visibility === 'public' ||
           !report.visibility;
  });
} 