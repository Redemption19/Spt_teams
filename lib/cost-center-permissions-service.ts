import { Permission } from './permissions-service';

export const COST_CENTER_PERMISSIONS: Permission[] = [
  { id: 'costcenters.view', name: 'View Cost Centers', description: 'Can view cost center list and details', category: 'Financial Management', feature: 'costcenters' },
  { id: 'costcenters.create', name: 'Create Cost Centers', description: 'Can create new cost centers', category: 'Financial Management', feature: 'costcenters' },
  { id: 'costcenters.edit', name: 'Edit Cost Centers', description: 'Can edit cost center information', category: 'Financial Management', feature: 'costcenters' },
  { id: 'costcenters.delete', name: 'Delete Cost Centers', description: 'Can delete cost centers', category: 'Financial Management', feature: 'costcenters' },
  { id: 'costcenters.assign', name: 'Assign Cost Centers', description: 'Can assign cost centers to projects and departments', category: 'Financial Management', feature: 'costcenters' },
  { id: 'costcenters.analytics', name: 'View Cost Center Analytics', description: 'Can view cost center analytics and reports', category: 'Financial Management', feature: 'costcenters' },
  { id: 'costcenters.export', name: 'Export Cost Centers', description: 'Can export cost center data', category: 'Financial Management', feature: 'costcenters' },
  { id: 'costcenters.budget', name: 'Manage Cost Center Budgets', description: 'Can manage budget allocations for cost centers', category: 'Financial Management', feature: 'costcenters' },
];

export class CostCenterPermissionsService {
  static getAllCostCenterPermissions(): Permission[] {
    return COST_CENTER_PERMISSIONS;
  }

  static getCostCenterPermissionIds(): string[] {
    return COST_CENTER_PERMISSIONS.map(p => p.id);
  }

  static getCostCenterPermissionById(id: string): Permission | undefined {
    return COST_CENTER_PERMISSIONS.find(p => p.id === id);
  }

  /**
   * Get default cost center permissions for a role
   */
  static getDefaultPermissionsForRole(role: 'owner' | 'admin' | 'member'): { [permissionId: string]: { granted: boolean } } {
    const permissions: { [permissionId: string]: { granted: boolean } } = {};
    
    switch (role) {
      case 'owner':
        // Owners get all cost center permissions
        COST_CENTER_PERMISSIONS.forEach(permission => {
          permissions[permission.id] = { granted: true };
        });
        break;
        
      case 'admin':
        // Admins get most permissions except delete
        COST_CENTER_PERMISSIONS.forEach(permission => {
          permissions[permission.id] = { 
            granted: permission.id !== 'costcenters.delete' 
          };
        });
        break;
        
      case 'member':
        // Members get only view permission
        permissions['costcenters.view'] = { granted: true };
        COST_CENTER_PERMISSIONS.slice(1).forEach(permission => {
          permissions[permission.id] = { granted: false };
        });
        break;
    }
    
    return permissions;
  }

  /**
   * Grant default cost center permissions to a user
   */
  static async grantDefaultPermissions(
    userId: string, 
    workspaceId: string, 
    role: 'owner' | 'admin' | 'member',
    grantedBy: string
  ): Promise<void> {
    try {
      const { PermissionsService } = await import('./permissions-service');
      const defaultPermissions = this.getDefaultPermissionsForRole(role);
      
      // Convert to the format expected by PermissionsService
      const permissionUpdates: { [permissionId: string]: { granted: boolean; grantedBy?: string } } = {};
      Object.keys(defaultPermissions).forEach(permissionId => {
        permissionUpdates[permissionId] = {
          granted: defaultPermissions[permissionId].granted,
          grantedBy: grantedBy
        };
      });
      
      await PermissionsService.updateUserPermissions(
        userId,
        workspaceId,
        permissionUpdates,
        grantedBy
      );
      
      console.log(`Granted default cost center permissions to user ${userId} with role ${role}`);
    } catch (error) {
      console.error('Error granting default cost center permissions:', error);
      throw error;
    }
  }
} 