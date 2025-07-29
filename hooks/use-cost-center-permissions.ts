import { useState, useEffect } from 'react';
import { PermissionsService } from '@/lib/permissions-service';

interface CostCenterPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function useCostCenterPermissions(userId: string | undefined, workspaceId: string | undefined) {
  const [permissions, setPermissions] = useState<CostCenterPermissions>({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!userId || !workspaceId) {
        setLoading(false);
        return;
      }
      
      try {
        const [viewPerm, createPerm, editPerm, deletePerm] = await Promise.all([
          PermissionsService.hasPermission(userId, workspaceId, 'costcenters.view'),
          PermissionsService.hasPermission(userId, workspaceId, 'costcenters.create'),
          PermissionsService.hasPermission(userId, workspaceId, 'costcenters.edit'),
          PermissionsService.hasPermission(userId, workspaceId, 'costcenters.delete')
        ]);
        
        setPermissions({
          canView: viewPerm,
          canCreate: createPerm,
          canEdit: editPerm,
          canDelete: deletePerm,
        });
      } catch (error) {
        console.error('Error checking permissions:', error);
        // Set all permissions to false on error
        setPermissions({
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        });
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [userId, workspaceId]);

  return { permissions, loading };
} 