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

// Helper function to define permissions for each role
export function getRolePermissions(role: string): RolePermissions {
  switch (role) {
    case 'owner':
      return {
        canCreateWorkspace: true,
        canEditWorkspace: true,
        canDeleteWorkspace: true,
        canInviteUsers: true,
        canRemoveUsers: true,
        canCreateTeams: true,
        canEditTeams: true,
        canDeleteTeams: true,
        canAssignUserRoles: true,
        canViewReports: true,
        canManageBranches: true,
        canManageRegions: true,
      };
    case 'admin':
      return {
        canCreateWorkspace: false,
        canEditWorkspace: true,
        canDeleteWorkspace: false,
        canInviteUsers: true,
        canRemoveUsers: true,
        canCreateTeams: true,
        canEditTeams: true,
        canDeleteTeams: true,
        canAssignUserRoles: true,  // Can assign roles except owner
        canViewReports: true,
        canManageBranches: true,
        canManageRegions: true,
      };
    case 'member':
    default:
      return {
        canCreateWorkspace: false,
        canEditWorkspace: false,
        canDeleteWorkspace: false,
        canInviteUsers: false,
        canRemoveUsers: false,
        canCreateTeams: false,
        canEditTeams: false,
        canDeleteTeams: false,
        canAssignUserRoles: false,
        canViewReports: false,
        canManageBranches: false,
        canManageRegions: false,
      };
  }
}

// Hook for getting permissions based on user's role in current workspace
export function useRolePermissions(): RolePermissions {
  const { currentWorkspace, userRole } = useWorkspace();
  
  // Default to member permissions if no workspace or role
  if (!currentWorkspace || !userRole) {
    return getRolePermissions('member');
  }
  
  return getRolePermissions(userRole);
}

// Hook to check if user is workspace owner
export function useIsOwner(): boolean {
  const { userRole } = useWorkspace();
  return userRole === 'owner';
}

// Hook to check if user is admin or owner
export function useIsAdminOrOwner(): boolean {
  const { userRole } = useWorkspace();
  return userRole === 'owner' || userRole === 'admin';
}

// Helper functions for team-level permissions
export function getTeamRolePermissions(role: string) {
  switch (role) {
    case 'leader':
      return {
        canEditTeam: true,
        canAddMembers: true,
        canRemoveMembers: true,
        canAssignRoles: true,
        canCreateTasks: true,
        canAssignTasks: true,
      };
    case 'manager':
      return {
        canEditTeam: false,
        canAddMembers: true,
        canRemoveMembers: true,
        canAssignRoles: false,
        canCreateTasks: true,
        canAssignTasks: true,
      };
    case 'member':
    default:
      return {
        canEditTeam: false,
        canAddMembers: false,
        canRemoveMembers: false,
        canAssignRoles: false,
        canCreateTasks: true,
        canAssignTasks: false,
      };
  }
}

// Hook for checking if user has permission to do something in a team
export function useTeamPermission(teamId: string, permission: string): boolean {
  // Here you would implement the logic to check if user has specified permission
  // in the given team. This is just a placeholder implementation.
  return true;
}

const hooks = {
  useRolePermissions,
  useIsOwner,
  getRolePermissions,
  getTeamRolePermissions,
  useTeamPermission,
};

export default hooks;
