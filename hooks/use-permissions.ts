import { useState, useEffect, useCallback } from 'react';
import { PermissionsService, UserPermission } from '@/lib/permissions-service';
import { useAuth } from '@/lib/auth-context';

interface UsePermissionsProps {
  userId?: string;
  workspaceId?: string;
}

interface UsePermissionsReturn {
  userPermissions: UserPermission | null;
  loading: boolean;
  error: string | null;
  hasPermission: (permissionId: string) => boolean;
  updatePermissions: (permissions: { [key: string]: { granted: boolean; grantedBy?: string; expiresAt?: Date } }) => Promise<void>;
  refreshPermissions: () => Promise<void>;
  permissionCounts: {
    total: number;
    granted: number;
    view: number;
    create: number;
    edit: number;
    delete: number;
  };
}

export function usePermissions({ userId, workspaceId }: UsePermissionsProps): UsePermissionsReturn {
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<UserPermission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionCounts, setPermissionCounts] = useState({
    total: 0,
    granted: 0,
    view: 0,
    create: 0,
    edit: 0,
    delete: 0
  });

  const loadPermissions = useCallback(async () => {
    if (!userId || !workspaceId) {
      setUserPermissions(null);
      setPermissionCounts({ total: 0, granted: 0, view: 0, create: 0, edit: 0, delete: 0 });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const permissions = await PermissionsService.getUserPermissions(userId, workspaceId);
      setUserPermissions(permissions);
      
      if (permissions) {
        const counts = {
          total: 0,
          granted: 0,
          view: 0,
          create: 0,
          edit: 0,
          delete: 0
        };
        
        Object.keys(permissions.permissions).forEach(permissionId => {
          const permission = permissions.permissions[permissionId];
          counts.total++;
          
          if (permission.granted) {
            counts.granted++;
            
            if (permissionId.includes('.view')) counts.view++;
            if (permissionId.includes('.create')) counts.create++;
            if (permissionId.includes('.edit')) counts.edit++;
            if (permissionId.includes('.delete')) counts.delete++;
          }
        });
        
        setPermissionCounts(counts);
      } else {
        setPermissionCounts({ total: 0, granted: 0, view: 0, create: 0, edit: 0, delete: 0 });
      }
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('Failed to load permissions');
      setPermissionCounts({ total: 0, granted: 0, view: 0, create: 0, edit: 0, delete: 0 });
    } finally {
      setLoading(false);
    }
  }, [userId, workspaceId]);

  const hasPermission = useCallback((permissionId: string): boolean => {
    if (!userPermissions) return false;
    
    const permission = userPermissions.permissions[permissionId];
    if (!permission) return false;
    
    // Check if permission is granted
    if (!permission.granted) return false;
    
    // Check if permission has expired
    if (permission.expiresAt && new Date() > permission.expiresAt) return false;
    
    return true;
  }, [userPermissions]);

  const updatePermissions = useCallback(async (
    permissionUpdates: { [key: string]: { granted: boolean; grantedBy?: string; expiresAt?: Date } }
  ) => {
    if (!userId || !workspaceId || !user?.uid) {
      throw new Error('Missing required parameters for permission update');
    }

    try {
      setLoading(true);
      setError(null);
      
      await PermissionsService.updateUserPermissions(
        userId,
        workspaceId,
        permissionUpdates,
        user.uid
      );
      
      // Refresh permissions after update
      await loadPermissions();
    } catch (err) {
      console.error('Error updating permissions:', err);
      setError('Failed to update permissions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, workspaceId, user?.uid, loadPermissions]);

  const refreshPermissions = useCallback(async () => {
    await loadPermissions();
  }, [loadPermissions]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  return {
    userPermissions,
    loading,
    error,
    hasPermission,
    updatePermissions,
    refreshPermissions,
    permissionCounts
  };
} 