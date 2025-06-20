'use client';

import React from 'react';
import { useWorkspace } from './workspace-context';

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
  canManageBranches: boolean;
  canManageRegions: boolean;
}

export function useRolePermissions(): RolePermissions {
  const { userRole } = useWorkspace();

  const permissions: RolePermissions = {
    canCreateWorkspace: true, // Anyone can create a workspace (they become owner)
    canEditWorkspace: userRole === 'owner' || userRole === 'admin',
    canDeleteWorkspace: userRole === 'owner',
    canInviteUsers: userRole === 'owner' || userRole === 'admin',
    canRemoveUsers: userRole === 'owner' || userRole === 'admin',
    canCreateTeams: userRole === 'owner' || userRole === 'admin',
    canEditTeams: userRole === 'owner' || userRole === 'admin',
    canDeleteTeams: userRole === 'owner' || userRole === 'admin',
    canAssignUserRoles: userRole === 'owner',
    canViewReports: true, // Everyone can view reports
    canManageBranches: userRole === 'owner' || userRole === 'admin',
    canManageRegions: userRole === 'owner' || userRole === 'admin',
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
