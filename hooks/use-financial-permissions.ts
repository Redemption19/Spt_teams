import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { PermissionsService } from '@/lib/permissions-service';

interface FinancialPermissions {
  // Overview Permissions
  canViewOverview: boolean;
  canViewAllFinancialData: boolean;
  canViewDepartmentFinancialData: boolean;
  
  // Expense Permissions
  canViewExpenses: boolean;
  canViewAllExpenses: boolean;
  canViewDepartmentExpenses: boolean;
  canViewOwnExpenses: boolean;
  canCreateExpenses: boolean;
  canEditExpenses: boolean;
  canEditOwnExpenses: boolean;
  canDeleteExpenses: boolean;
  canDeleteOwnExpenses: boolean;
  canApproveExpenses: boolean;
  canApproveDepartmentExpenses: boolean;
  canRejectExpenses: boolean;
  canExportExpenses: boolean;
  canViewExpenseAnalytics: boolean;
  canManageExpenseCategories: boolean;
  
  // Budget Permissions
  canViewBudgets: boolean;
  canCreateBudgets: boolean;
  canEditBudgets: boolean;
  canDeleteBudgets: boolean;
  canAssignBudgets: boolean;
  canViewBudgetAnalytics: boolean;
  canExportBudgets: boolean;
  canManageBudgetTypes: boolean;
  
  // Invoice Permissions
  canViewInvoices: boolean;
  canViewAllInvoices: boolean;
  canViewOwnInvoices: boolean;
  canCreateInvoices: boolean;
  canEditInvoices: boolean;
  canEditOwnInvoices: boolean;
  canDeleteInvoices: boolean;
  canDeleteOwnInvoices: boolean;
  canSendInvoices: boolean;
  canExportInvoices: boolean;
  canViewInvoiceAnalytics: boolean;
  
  // Cost Center Permissions
  canViewCostCenters: boolean;
  canCreateCostCenters: boolean;
  canEditCostCenters: boolean;
  canDeleteCostCenters: boolean;
  canAssignCostCenters: boolean;
  canViewCostCenterAnalytics: boolean;
  canExportCostCenters: boolean;
  
  // Financial Reports & Analytics
  canViewFinancialReports: boolean;
  canGenerateFinancialReports: boolean;
  canExportFinancialReports: boolean;
  canDeleteFinancialReports: boolean;
  canViewFinancialAnalytics: boolean;
  
  // Financial Settings
  canManageFinancialSettings: boolean;
  canManageCurrencySettings: boolean;
  
  // Loading state
  loading: boolean;
  error: string | null;
}

export function useFinancialPermissions(): FinancialPermissions {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [permissions, setPermissions] = useState<FinancialPermissions>({
    // Initialize all permissions as false
    canViewOverview: false,
    canViewAllFinancialData: false,
    canViewDepartmentFinancialData: false,
    canViewExpenses: false,
    canViewAllExpenses: false,
    canViewDepartmentExpenses: false,
    canViewOwnExpenses: false,
    canCreateExpenses: false,
    canEditExpenses: false,
    canEditOwnExpenses: false,
    canDeleteExpenses: false,
    canDeleteOwnExpenses: false,
    canApproveExpenses: false,
    canApproveDepartmentExpenses: false,
    canRejectExpenses: false,
    canExportExpenses: false,
    canViewExpenseAnalytics: false,
    canManageExpenseCategories: false,
    canViewBudgets: false,
    canCreateBudgets: false,
    canEditBudgets: false,
    canDeleteBudgets: false,
    canAssignBudgets: false,
    canViewBudgetAnalytics: false,
    canExportBudgets: false,
    canManageBudgetTypes: false,
    canViewInvoices: false,
    canViewAllInvoices: false,
    canViewOwnInvoices: false,
    canCreateInvoices: false,
    canEditInvoices: false,
    canEditOwnInvoices: false,
    canDeleteInvoices: false,
    canDeleteOwnInvoices: false,
    canSendInvoices: false,
    canExportInvoices: false,
    canViewInvoiceAnalytics: false,
    canViewCostCenters: false,
    canCreateCostCenters: false,
    canEditCostCenters: false,
    canDeleteCostCenters: false,
    canAssignCostCenters: false,
    canViewCostCenterAnalytics: false,
    canExportCostCenters: false,
    canViewFinancialReports: false,
    canGenerateFinancialReports: false,
    canExportFinancialReports: false,
    canDeleteFinancialReports: false,
    canViewFinancialAnalytics: false,
    canManageFinancialSettings: false,
    canManageCurrencySettings: false,
    loading: true,
    error: null
  });

  const checkPermissions = useCallback(async () => {
    if (!user?.uid || !currentWorkspace?.id) {
      setPermissions(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setPermissions(prev => ({ ...prev, loading: true, error: null }));

      // Get user permissions for the current workspace
      const userPermissions = await PermissionsService.getUserPermissions(
        user.uid,
        currentWorkspace.id
      );

      // Helper function to check if user has a specific permission
      const hasPermission = (permissionId: string): boolean => {
        if (!userPermissions) return false;
        
        const permission = userPermissions.permissions[permissionId];
        if (!permission) return false;
        
        // Check if permission is granted
        if (!permission.granted) return false;
        
        // Check if permission has expired
        if (permission.expiresAt && new Date() > permission.expiresAt) {
          return false;
        }
        
        return true;
      };

      // Update permissions based on actual user permissions
      setPermissions({
        // Overview Permissions
        canViewOverview: hasPermission('financial.overview'),
        canViewAllFinancialData: hasPermission('financial.overview.all'),
        canViewDepartmentFinancialData: hasPermission('financial.overview.department'),
        
        // Expense Permissions
        canViewExpenses: hasPermission('expenses.view'),
        canViewAllExpenses: hasPermission('expenses.view.all'),
        canViewDepartmentExpenses: hasPermission('expenses.view.department'),
        canViewOwnExpenses: hasPermission('expenses.view.own'),
        canCreateExpenses: hasPermission('expenses.create'),
        canEditExpenses: hasPermission('expenses.edit'),
        canEditOwnExpenses: hasPermission('expenses.edit.own'),
        canDeleteExpenses: hasPermission('expenses.delete'),
        canDeleteOwnExpenses: hasPermission('expenses.delete.own'),
        canApproveExpenses: hasPermission('expenses.approve'),
        canApproveDepartmentExpenses: hasPermission('expenses.approve.department'),
        canRejectExpenses: hasPermission('expenses.reject'),
        canExportExpenses: hasPermission('expenses.export'),
        canViewExpenseAnalytics: hasPermission('expenses.analytics'),
        canManageExpenseCategories: hasPermission('expenses.categories'),
        
        // Budget Permissions
        canViewBudgets: hasPermission('budgets.view'),
        canCreateBudgets: hasPermission('budgets.create'),
        canEditBudgets: hasPermission('budgets.edit'),
        canDeleteBudgets: hasPermission('budgets.delete'),
        canAssignBudgets: hasPermission('budgets.assign'),
        canViewBudgetAnalytics: hasPermission('budgets.analytics'),
        canExportBudgets: hasPermission('budgets.export'),
        canManageBudgetTypes: hasPermission('budgets.types'),
        
        // Invoice Permissions
        canViewInvoices: hasPermission('invoices.view'),
        canViewAllInvoices: hasPermission('invoices.view.all'),
        canViewOwnInvoices: hasPermission('invoices.view.own'),
        canCreateInvoices: hasPermission('invoices.create'),
        canEditInvoices: hasPermission('invoices.edit'),
        canEditOwnInvoices: hasPermission('invoices.edit.own'),
        canDeleteInvoices: hasPermission('invoices.delete'),
        canDeleteOwnInvoices: hasPermission('invoices.delete.own'),
        canSendInvoices: hasPermission('invoices.send'),
        canExportInvoices: hasPermission('invoices.export'),
        canViewInvoiceAnalytics: hasPermission('invoices.analytics'),
        
        // Cost Center Permissions
        canViewCostCenters: hasPermission('costcenters.view'),
        canCreateCostCenters: hasPermission('costcenters.create'),
        canEditCostCenters: hasPermission('costcenters.edit'),
        canDeleteCostCenters: hasPermission('costcenters.delete'),
        canAssignCostCenters: hasPermission('costcenters.assign'),
        canViewCostCenterAnalytics: hasPermission('costcenters.analytics'),
        canExportCostCenters: hasPermission('costcenters.export'),
        
        // Financial Reports & Analytics
        canViewFinancialReports: hasPermission('financial.reports.view'),
        canGenerateFinancialReports: hasPermission('financial.reports.generate'),
        canExportFinancialReports: hasPermission('financial.reports.export'),
        canDeleteFinancialReports: hasPermission('financial.reports.delete'),
        canViewFinancialAnalytics: hasPermission('financial.analytics'),
        
        // Financial Settings
        canManageFinancialSettings: hasPermission('financial.settings'),
        canManageCurrencySettings: hasPermission('financial.currency'),
        
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error checking financial permissions:', error);
      setPermissions(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load permissions'
      }));
    }
  }, [user?.uid, currentWorkspace?.id]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return permissions;
}

// Helper hook for checking specific financial permissions
export function useFinancialPermission(permissionId: string): boolean {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user?.uid || !currentWorkspace?.id) {
        setHasPermission(false);
        return;
      }

      try {
        const userPermissions = await PermissionsService.getUserPermissions(
          user.uid,
          currentWorkspace.id
        );
        
        // Check permission synchronously
        if (!userPermissions) {
          setHasPermission(false);
          return;
        }
        
        const permission = userPermissions.permissions[permissionId];
        if (!permission) {
          setHasPermission(false);
          return;
        }
        
        // Check if permission is granted
        if (!permission.granted) {
          setHasPermission(false);
          return;
        }
        
        // Check if permission has expired
        if (permission.expiresAt && new Date() > permission.expiresAt) {
          setHasPermission(false);
          return;
        }
        
        setHasPermission(true);
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      }
    };

    checkPermission();
  }, [user?.uid, currentWorkspace?.id, permissionId]);

  return hasPermission;
}