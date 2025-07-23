import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, Key, Eye, Edit, Trash2, Plus, MoreHorizontal } from 'lucide-react';
import { PermissionsService, UserPermission } from '@/lib/permissions-service';
import { useRouter } from 'next/navigation';

interface PermissionsSummaryProps {
  userId: string;
  workspaceId: string;
  userName: string;
  userRole: string;
  disabled?: boolean;
  onManagePermissions?: () => void; // Add callback for managing permissions
}

export function PermissionsSummary({
  userId,
  workspaceId,
  userName,
  userRole,
  disabled = false,
  onManagePermissions
}: PermissionsSummaryProps) {
  const [userPermissions, setUserPermissions] = useState<UserPermission | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionCounts, setPermissionCounts] = useState({
    total: 0,
    granted: 0,
    view: 0,
    create: 0,
    edit: 0,
    delete: 0
  });
  const router = useRouter();

  const loadUserPermissions = useCallback(async () => {
    try {
      setLoading(true);
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
      }
    } catch (error) {
      console.error('Error loading user permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, workspaceId]);

  useEffect(() => {
    loadUserPermissions();
  }, [userId, workspaceId, loadUserPermissions]);

  const getPermissionLevel = () => {
    if (userRole === 'owner') return 'Full Access';
    if (userRole === 'admin') return 'Admin Access';
    if (permissionCounts.granted > 20) return 'Extended Access';
    if (permissionCounts.granted > 10) return 'Standard Access';
    if (permissionCounts.granted > 0) return 'Limited Access';
    return 'No Permissions';
  };

  const getPermissionColor = () => {
    const level = getPermissionLevel();
    switch (level) {
      case 'Full Access': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'Admin Access': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'Extended Access': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'Standard Access': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'Limited Access': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push(`/dashboard/permissions/manage/${userId}`)}
              className="h-8 px-4 flex items-center space-x-2 font-semibold bg-gradient-to-r from-primary to-accent text-white shadow-md transition-transform duration-150 hover:scale-105 hover:shadow-lg hover:from-primary/90 hover:to-accent/90"
              disabled={disabled}
            >
              <Shield className="h-4 w-4 mr-1" />
              <span>Manage Permissions</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {disabled ? (
              <span className="text-xs text-red-500">Cannot manage permissions for users in missing or deleted workspaces.</span>
            ) : (
              <div className="space-y-2">
                <p className="font-medium">Permissions & Privileges</p>
                <div className="text-xs space-y-1">
                  <div>Level: {getPermissionLevel()}</div>
                  <div>Granted: {permissionCounts.granted}/{permissionCounts.total}</div>
                  <div className="flex space-x-2">
                    <span>👁️ {permissionCounts.view}</span>
                    <span>➕ {permissionCounts.create}</span>
                    <span>✏️ {permissionCounts.edit}</span>
                    <span>🗑️ {permissionCounts.delete}</span>
                  </div>
                </div>
              </div>
            )}
          </TooltipContent>
        </Tooltip>

        <Badge 
          variant="outline" 
          className={`text-xs ${getPermissionColor()}`}
        >
          {permissionCounts.granted} perms
        </Badge>

        {permissionCounts.granted > 0 && (
          <div className="flex space-x-1">
            {permissionCounts.view > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">View permissions: {permissionCounts.view}</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {permissionCounts.create > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Create permissions: {permissionCounts.create}</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {permissionCounts.edit > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Edit permissions: {permissionCounts.edit}</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {permissionCounts.delete > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Delete permissions: {permissionCounts.delete}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
} 