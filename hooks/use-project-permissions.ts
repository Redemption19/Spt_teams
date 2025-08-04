import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { PermissionsService } from '@/lib/permissions-service';

export interface ProjectPermissions {
  canViewProjects: boolean;
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canDeleteProjects: boolean;
  canAssignProjects: boolean;
  canViewTasks: boolean;
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canAssignTasks: boolean;
  canCompleteTasks: boolean;
  loading: boolean;
}

export function useProjectPermissions(): ProjectPermissions {
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [permissions, setPermissions] = useState<ProjectPermissions>({
    canViewProjects: false,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canAssignProjects: false,
    canViewTasks: false,
    canCreateTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canAssignTasks: false,
    canCompleteTasks: false,
    loading: true,
  });

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user?.uid || !currentWorkspace?.id) {
        setPermissions(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Get user role for fallback permissions
        const userRole = userProfile?.role as 'owner' | 'admin' | 'member' | undefined;
        
        console.log('🔐 Loading permissions for user:', {
          userId: user.uid,
          workspaceId: currentWorkspace.id,
          userRole: userRole
        });

        // Check if user has explicit permissions first
        const explicitPermissions = await PermissionsService.getUserPermissions(user.uid, currentWorkspace.id);
        
        // If no explicit permissions and user has a role, migrate them automatically
        if (!explicitPermissions && userRole) {
          console.log('🔄 Migrating existing user to explicit permissions:', {
            userId: user.uid,
            workspaceId: currentWorkspace.id,
            userRole: userRole
          });
          
          try {
            await PermissionsService.migrateUserToExplicitPermissions(
              user.uid, 
              currentWorkspace.id, 
              userRole, 
              user.uid // migrated by themselves
            );
            console.log('✅ User permissions migrated successfully');
          } catch (error) {
            console.warn('⚠️ Failed to migrate user permissions, using fallback:', error);
          }
        }

        // Check all project and task permissions in parallel with fallback
        const [
          canViewProjects,
          canCreateProjects,
          canEditProjects,
          canDeleteProjects,
          canAssignProjects,
          canViewTasks,
          canCreateTasks,
          canEditTasks,
          canDeleteTasks,
          canAssignTasks,
          canCompleteTasks,
        ] = await Promise.all([
          PermissionsService.hasPermissionWithFallback(user.uid, currentWorkspace.id, 'projects.view', userRole),
          PermissionsService.hasPermissionWithFallback(user.uid, currentWorkspace.id, 'projects.create', userRole),
          PermissionsService.hasPermissionWithFallback(user.uid, currentWorkspace.id, 'projects.edit', userRole),
          PermissionsService.hasPermissionWithFallback(user.uid, currentWorkspace.id, 'projects.delete', userRole),
          PermissionsService.hasPermissionWithFallback(user.uid, currentWorkspace.id, 'projects.assign', userRole),
          PermissionsService.hasPermissionWithFallback(user.uid, currentWorkspace.id, 'tasks.view', userRole),
          PermissionsService.hasPermissionWithFallback(user.uid, currentWorkspace.id, 'tasks.create', userRole),
          PermissionsService.hasPermissionWithFallback(user.uid, currentWorkspace.id, 'tasks.edit', userRole),
          PermissionsService.hasPermissionWithFallback(user.uid, currentWorkspace.id, 'tasks.delete', userRole),
          PermissionsService.hasPermissionWithFallback(user.uid, currentWorkspace.id, 'tasks.assign', userRole),
          PermissionsService.hasPermissionWithFallback(user.uid, currentWorkspace.id, 'tasks.complete', userRole),
        ]);

        setPermissions({
          canViewProjects,
          canCreateProjects,
          canEditProjects,
          canDeleteProjects,
          canAssignProjects,
          canViewTasks,
          canCreateTasks,
          canEditTasks,
          canDeleteTasks,
          canAssignTasks,
          canCompleteTasks,
          loading: false,
        });

        console.log('🔐 Project permissions loaded:', {
          userId: user.uid,
          workspaceId: currentWorkspace.id,
          userRole: userRole,
          permissions: {
            canViewProjects,
            canCreateProjects,
            canEditProjects,
            canDeleteProjects,
            canAssignProjects,
            canViewTasks,
            canCreateTasks,
            canEditTasks,
            canDeleteTasks,
            canAssignTasks,
            canCompleteTasks,
          }
        });

      } catch (error) {
        console.error('Error loading project permissions:', error);
        setPermissions(prev => ({ ...prev, loading: false }));
      }
    };

    loadPermissions();
  }, [user?.uid, currentWorkspace?.id, userProfile?.role]);

  return permissions;
} 