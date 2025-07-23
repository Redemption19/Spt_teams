import { UserService } from './user-service';
import { DepartmentService } from './department-service';
import { PermissionsService } from './permissions-service';
import { User } from './types';

export interface ExpenseAccessLevel {
  canViewAll: boolean;
  canViewDepartment: boolean;
  canViewOwn: boolean;
  canApprove: boolean;
  canApproveDepartment: boolean;
  canEdit: boolean;
  canEditOwn: boolean;
  canDelete: boolean;
  canDeleteOwn: boolean;
  allowedDepartments: string[];
  canAccessCrossWorkspace?: boolean; // New property for owner cross-workspace access
  canManageWorkspace?: boolean; // Add workspace management permission
}

export class ExpenseAccessControl {
  /**
   * Get expense access level for a user in a workspace
   */
  static async getExpenseAccessLevel(
    userId: string, 
    workspaceId: string
  ): Promise<ExpenseAccessLevel> {
    try {
      // Get user details
      const user = await UserService.getUserById(userId);
      if (!user) {
        return this.getNoAccessLevel();
      }

      // Get user permissions
      const userPermissions = await PermissionsService.getUserPermissions(userId, workspaceId);
      
      // Use user permissions (no role-based permissions lookup for now)
      const allPermissions = userPermissions?.permissions || {};

      // Check specific permissions
      const hasViewAllPermission = this.hasPermission(allPermissions, 'expenses.view.all');

      // Determine access levels
      const canViewAll = hasViewAllPermission || user.role === 'owner';
      const canViewDepartment = this.hasPermission(allPermissions, 'expenses.view.department') || user.role === 'admin';
      const canViewOwn = this.hasPermission(allPermissions, 'expenses.view.own') || this.hasPermission(allPermissions, 'expenses.view');
      
      const canApprove = this.hasPermission(allPermissions, 'expenses.approve') || user.role === 'owner';
      const canApproveDepartment = this.hasPermission(allPermissions, 'expenses.approve.department') || 
                                  (user.role === 'admin' && !!user.departmentId);
      
      const canEdit = this.hasPermission(allPermissions, 'expenses.edit') || user.role === 'owner';
      const canEditOwn = this.hasPermission(allPermissions, 'expenses.edit.own');
      
      const canDelete = this.hasPermission(allPermissions, 'expenses.delete') || user.role === 'owner';
      const canDeleteOwn = this.hasPermission(allPermissions, 'expenses.delete.own');

      // Get allowed departments
      const allowedDepartments = await this.getAllowedDepartments(user, canViewAll, canViewDepartment);

      // Check if user can access cross-workspace features (owners only)
      const canAccessCrossWorkspace = user.role === 'owner';
      
      // Check if user can manage workspace (owners only)
      const canManageWorkspace = user.role === 'owner';

      return {
        canViewAll,
        canViewDepartment,
        canViewOwn,
        canApprove,
        canApproveDepartment,
        canEdit,
        canEditOwn,
        canDelete,
        canDeleteOwn,
        allowedDepartments,
        canAccessCrossWorkspace, // New property
        canManageWorkspace // New property for workspace management
      };
    } catch (error) {
      console.error('Error getting expense access level:', error);
      return this.getNoAccessLevel();
    }
  }

  /**
   * Check if user can view a specific expense
   */
  static async canUserViewExpense(
    userId: string, 
    workspaceId: string, 
    expense: { submittedBy: string; departmentId?: string }
  ): Promise<boolean> {
    const accessLevel = await this.getExpenseAccessLevel(userId, workspaceId);
    
    // Can view all expenses
    if (accessLevel.canViewAll) {
      return true;
    }
    
    // Can view own expenses
    if (accessLevel.canViewOwn && expense.submittedBy === userId) {
      return true;
    }
    
    // Can view department expenses
    if (accessLevel.canViewDepartment && expense.departmentId) {
      return accessLevel.allowedDepartments.includes(expense.departmentId);
    }
    
    return false;
  }

  /**
   * Check if user can approve a specific expense
   */
  static async canUserApproveExpense(
    userId: string, 
    workspaceId: string, 
    expense: { submittedBy: string; departmentId?: string }
  ): Promise<boolean> {
    const accessLevel = await this.getExpenseAccessLevel(userId, workspaceId);
    
    // Cannot approve own expenses
    if (expense.submittedBy === userId) {
      return false;
    }
    
    // Can approve all expenses
    if (accessLevel.canApprove) {
      return true;
    }
    
    // Can approve department expenses
    if (accessLevel.canApproveDepartment && expense.departmentId) {
      return accessLevel.allowedDepartments.includes(expense.departmentId);
    }
    
    return false;
  }

  /**
   * Check if user can edit a specific expense
   */
  static async canUserEditExpense(
    userId: string, 
    workspaceId: string, 
    expense: { submittedBy: string; departmentId?: string; status: string }
  ): Promise<boolean> {
    const accessLevel = await this.getExpenseAccessLevel(userId, workspaceId);
    
    // Cannot edit approved or paid expenses
    if (expense.status === 'approved' || expense.status === 'paid') {
      return false;
    }
    
    // Can edit all expenses
    if (accessLevel.canEdit) {
      return true;
    }
    
    // Can edit own expenses
    if (accessLevel.canEditOwn && expense.submittedBy === userId) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if user can delete a specific expense
   */
  static async canUserDeleteExpense(
    userId: string, 
    workspaceId: string, 
    expense: { submittedBy: string; departmentId?: string; status: string }
  ): Promise<boolean> {
    const accessLevel = await this.getExpenseAccessLevel(userId, workspaceId);
    
    // Cannot delete approved or paid expenses
    if (expense.status === 'approved' || expense.status === 'paid') {
      return false;
    }
    
    // Can delete all expenses
    if (accessLevel.canDelete) {
      return true;
    }
    
    // Can delete own expenses
    if (accessLevel.canDeleteOwn && expense.submittedBy === userId) {
      return true;
    }
    
    return false;
  }

  /**
   * Get filter criteria for expense queries based on user access
   */
  static async getExpenseFilterCriteria(
    userId: string, 
    workspaceId: string
  ): Promise<{
    filterType: 'all' | 'department' | 'own' | 'none';
    departmentIds?: string[];
    userId?: string;
  }> {
    const accessLevel = await this.getExpenseAccessLevel(userId, workspaceId);
    
    if (accessLevel.canViewAll) {
      return { filterType: 'all' };
    }
    
    if (accessLevel.canViewDepartment && accessLevel.allowedDepartments.length > 0) {
      return { 
        filterType: 'department', 
        departmentIds: accessLevel.allowedDepartments,
        userId: accessLevel.canViewOwn ? userId : undefined
      };
    }
    
    if (accessLevel.canViewOwn) {
      return { filterType: 'own', userId };
    }
    
    return { filterType: 'none' };
  }

  /**
   * Get cross-workspace filter criteria for owners
   */
  static async getCrossWorkspaceFilterCriteria(
    userId: string, 
    mainWorkspaceId: string
  ): Promise<{
    filterType: 'cross-workspace' | 'none';
    workspaceIds?: string[];
    canManageAll?: boolean;
  }> {
    const accessLevel = await this.getExpenseAccessLevel(userId, mainWorkspaceId);
    
    if (accessLevel.canAccessCrossWorkspace) {
      // Get all accessible workspace IDs
      const { WorkspaceService } = await import('./workspace-service');
      const subWorkspaces = await WorkspaceService.getSubWorkspaces(mainWorkspaceId);
      const workspaceIds = [mainWorkspaceId, ...subWorkspaces.map(w => w.id)];
      
      return { 
        filterType: 'cross-workspace',
        workspaceIds,
        canManageAll: true
      };
    }
    
    return { filterType: 'none' };
  }

  /**
   * Check if user can manage expenses across workspaces
   */
  static async canUserManageCrossWorkspace(userId: string, mainWorkspaceId: string): Promise<boolean> {
    const accessLevel = await this.getExpenseAccessLevel(userId, mainWorkspaceId);
    return accessLevel.canAccessCrossWorkspace || false;
  }

  /**
   * Helper method to check if a permission is granted
   */
  private static hasPermission(
    permissions: any, 
    permissionId: string
  ): boolean {
    const permission = permissions?.[permissionId];
    return permission?.granted === true;
  }

  /**
   * Get allowed departments for a user
   */
  private static async getAllowedDepartments(
    user: User, 
    canViewAll: boolean, 
    canViewDepartment: boolean
  ): Promise<string[]> {
    if (canViewAll) {
      // Can view all departments - return empty array to indicate no restriction
      return [];
    }
    
    if (canViewDepartment && user.departmentId) {
      // For department managers/admins, they can view their department
      return [user.departmentId];
    }
    
    return [];
  }

  /**
   * Get default no-access level
   */
  private static getNoAccessLevel(): ExpenseAccessLevel {
    return {
      canViewAll: false,
      canViewDepartment: false,
      canViewOwn: false,
      canApprove: false,
      canApproveDepartment: false,
      canEdit: false,
      canEditOwn: false,
      canDelete: false,
      canDeleteOwn: false,
      allowedDepartments: [],
      canAccessCrossWorkspace: false,
      canManageWorkspace: false
    };
  }
}
