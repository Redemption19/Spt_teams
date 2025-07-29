import { PermissionsService } from './permissions-service';

export class FinancialPermissionsService {
  /**
   * Grant default financial permissions based on user role
   */
  static async grantDefaultPermissions(
    userId: string,
    workspaceId: string,
    userRole: 'owner' | 'admin' | 'member',
    grantedBy: string
  ): Promise<void> {
    const permissions: { [key: string]: { granted: boolean; grantedBy: string } } = {};

    // Define permissions based on role
    switch (userRole) {
      case 'owner':
        // Owners get all financial permissions
        this.getOwnerPermissions().forEach(permissionId => {
          permissions[permissionId] = { granted: true, grantedBy };
        });
        break;

      case 'admin':
        // Admins get most permissions except some critical ones
        this.getAdminPermissions().forEach(permissionId => {
          permissions[permissionId] = { granted: true, grantedBy };
        });
        break;

      case 'member':
        // Members get basic view permissions
        this.getMemberPermissions().forEach(permissionId => {
          permissions[permissionId] = { granted: true, grantedBy };
        });
        break;
    }

    // Apply the permissions
    await PermissionsService.updateUserPermissions(
      userId,
      workspaceId,
      permissions,
      grantedBy
    );
  }

  /**
   * Get all financial permissions for owners
   */
  private static getOwnerPermissions(): string[] {
    return [
      // Overview & General
      'financial.overview',
      'financial.overview.all',
      'financial.overview.department',
      'financial.analytics',
      'financial.settings',
      'financial.currency',
      
      // Expenses
      'expenses.view',
      'expenses.view.all',
      'expenses.view.department',
      'expenses.view.own',
      'expenses.create',
      'expenses.edit',
      'expenses.edit.own',
      'expenses.delete',
      'expenses.delete.own',
      'expenses.approve',
      'expenses.approve.department',
      'expenses.reject',
      'expenses.export',
      'expenses.analytics',
      'expenses.categories',
      
      // Budgets
      'budgets.view',
      'budgets.create',
      'budgets.edit',
      'budgets.delete',
      'budgets.assign',
      'budgets.analytics',
      'budgets.export',
      'budgets.types',
      
      // Invoices
      'invoices.view',
      'invoices.view.all',
      'invoices.view.own',
      'invoices.create',
      'invoices.edit',
      'invoices.edit.own',
      'invoices.delete',
      'invoices.delete.own',
      'invoices.send',
      'invoices.export',
      'invoices.analytics',
      
      // Cost Centers
      'costcenters.view',
      'costcenters.create',
      'costcenters.edit',
      'costcenters.delete',
      'costcenters.assign',
      'costcenters.analytics',
      'costcenters.export',
      
      // Financial Reports
      'financial.reports.view',
      'financial.reports.generate',
      'financial.reports.export',
      'financial.reports.delete'
    ];
  }

  /**
   * Get financial permissions for admins
   */
  private static getAdminPermissions(): string[] {
    return [
      // Overview & General
      'financial.overview',
      'financial.overview.all',
      'financial.overview.department',
      'financial.analytics',
      
      // Expenses (all except system-wide categories)
      'expenses.view',
      'expenses.view.all',
      'expenses.view.department',
      'expenses.view.own',
      'expenses.create',
      'expenses.edit',
      'expenses.edit.own',
      'expenses.delete.own',
      'expenses.approve',
      'expenses.approve.department',
      'expenses.reject',
      'expenses.export',
      'expenses.analytics',
      
      // Budgets (all except deletion)
      'budgets.view',
      'budgets.create',
      'budgets.edit',
      'budgets.assign',
      'budgets.analytics',
      'budgets.export',
      
      // Invoices (all except deletion)
      'invoices.view',
      'invoices.view.all',
      'invoices.view.own',
      'invoices.create',
      'invoices.edit',
      'invoices.edit.own',
      'invoices.delete.own',
      'invoices.send',
      'invoices.export',
      'invoices.analytics',
      
      // Cost Centers (all except deletion)
      'costcenters.view',
      'costcenters.create',
      'costcenters.edit',
      'costcenters.assign',
      'costcenters.analytics',
      'costcenters.export',
      
      // Financial Reports
      'financial.reports.view',
      'financial.reports.generate',
      'financial.reports.export'
    ];
  }

  /**
   * Get financial permissions for members
   */
  private static getMemberPermissions(): string[] {
    return [
      // Overview (department level only)
      'financial.overview',
      'financial.overview.department',
      
      // Expenses (own only)
      'expenses.view.own',
      'expenses.create',
      'expenses.edit.own',
      'expenses.delete.own',
      
      // Budgets (view only)
      'budgets.view',
      
      // Invoices (own only)
      'invoices.view.own',
      'invoices.create',
      'invoices.edit.own',
      'invoices.delete.own',
      
      // Cost Centers (view only)
      'costcenters.view',
      
      // Financial Reports (view only)
      'financial.reports.view'
    ];
  }

  /**
   * Get all financial permission IDs
   */
  static getAllFinancialPermissions(): string[] {
    return this.getOwnerPermissions();
  }

  /**
   * Check if a permission is a financial permission
   */
  static isFinancialPermission(permissionId: string): boolean {
    return this.getAllFinancialPermissions().includes(permissionId);
  }

  /**
   * Migrate financial permissions for existing users
   */
  static async migrateFinancialPermissions(workspaceId: string): Promise<void> {
    try {
      // This would typically get all users in a workspace and apply permissions
      // For now, this is a placeholder for the migration logic
      console.log(`Migrating financial permissions for workspace: ${workspaceId}`);
      
      // Implementation would involve:
      // 1. Get all users in workspace
      // 2. For each user, determine their role
      // 3. Apply appropriate default permissions
      // 4. Log the results
      
    } catch (error) {
      console.error('Error migrating financial permissions:', error);
      throw error;
    }
  }
} 