import { SYSTEM_PERMISSIONS, Permission } from './permissions-service';

export const BUDGET_PERMISSIONS: Permission[] = [
  { id: 'budgets.view', name: 'View Budgets', description: 'Can view budget list and details', category: 'Financial Management', feature: 'budgets' },
  { id: 'budgets.create', name: 'Create Budgets', description: 'Can create new budgets', category: 'Financial Management', feature: 'budgets' },
  { id: 'budgets.edit', name: 'Edit Budgets', description: 'Can edit budget information', category: 'Financial Management', feature: 'budgets' },
  { id: 'budgets.delete', name: 'Delete Budgets', description: 'Can delete budgets', category: 'Financial Management', feature: 'budgets' },
  { id: 'budgets.approve', name: 'Approve Budgets', description: 'Can approve submitted budgets', category: 'Financial Management', feature: 'budgets' },
  { id: 'budgets.export', name: 'Export Budgets', description: 'Can export budget data', category: 'Financial Management', feature: 'budgets' },
];

export class BudgetPermissionsService {
  static getAllBudgetPermissions(): Permission[] {
    return BUDGET_PERMISSIONS;
  }

  static getBudgetPermissionIds(): string[] {
    return BUDGET_PERMISSIONS.map(p => p.id);
  }

  static getBudgetPermissionById(id: string): Permission | undefined {
    return BUDGET_PERMISSIONS.find(p => p.id === id);
  }
} 