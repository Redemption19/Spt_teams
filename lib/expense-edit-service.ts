import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Expense, 
  ExpenseCategory
} from './types/financial-types';
import { cleanFirestoreData, createUpdateData } from './firestore-utils';
import { ExpenseManagementService } from './expense-management-service';

/**
 * Enhanced expense editing service with workspace validation and security
 * This service extends the basic expense management functionality with
 * secure edit operations that validate workspace access and permissions
 */
export class ExpenseEditService {

  /**
   * Get expense by ID with workspace validation and cross-workspace support for owners
   * Ensures the expense belongs to the specified workspace or user has cross-workspace access
   */
  static async getExpenseById(expenseId: string, workspaceId: string, userId?: string): Promise<Expense | null> {
    try {
      const docSnap = await getDoc(doc(db, 'expenses', expenseId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const expense = {
          id: docSnap.id,
          ...data
        } as Expense;
        
        // First check if expense belongs to the current workspace
        if (expense.workspaceId === workspaceId) {
          return expense;
        }
        
        // If not in current workspace, check for cross-workspace access (owners only)
        if (userId) {
          const { ExpenseAccessControl } = await import('./expense-access-control');
          const canAccessCrossWorkspace = await ExpenseAccessControl.canUserManageCrossWorkspace(userId, workspaceId);
          
          if (canAccessCrossWorkspace) {
            return expense;
          }
        }
        
        throw new Error('Expense not found or access denied');
        
      }
      return null;
    } catch (error) {
      console.error('Error fetching expense by ID:', error);
      throw error;
    }
  }

  /**
   * Update expense with workspace validation and cross-workspace support
   * Ensures the expense belongs to the workspace before updating
   */
  static async updateExpenseSecure(
    expenseId: string, 
    updates: Partial<Expense>,
    workspaceId: string, 
    userId?: string,
    departmentId?: string
  ): Promise<void> {
    try {
      // Validate expense exists and belongs to workspace (with cross-workspace support)
      const existingExpense = await this.getExpenseById(expenseId, workspaceId, userId);
      if (!existingExpense) {
        throw new Error('Expense not found or access denied');
      }
      
      // Additional department validation if required
      if (departmentId && existingExpense.departmentId !== departmentId) {
        console.warn('Department ID mismatch during expense update');
      }
      
      // Prepare update data with validation
      const updateData = createUpdateData(cleanFirestoreData({
        ...updates,
        updatedAt: new Date()
      }));
      
      await updateDoc(doc(db, 'expenses', expenseId), updateData);
    } catch (error) {
      console.error('Error updating expense securely:', error);
      throw error;
    }
  }

  /**
   * Delete expense with workspace validation and cross-workspace support
   * Ensures the expense belongs to the workspace before deletion
   */
  static async deleteExpenseSecure(
    expenseId: string, 
    workspaceId: string, 
    userId?: string,
    departmentId?: string
  ): Promise<void> {
    try {
      // Validate expense exists and belongs to workspace (with cross-workspace support)
      const existingExpense = await this.getExpenseById(expenseId, workspaceId, userId);
      if (!existingExpense) {
        throw new Error('Expense not found or access denied');
      }
      
      // Additional department validation if required
      if (departmentId && existingExpense.departmentId !== departmentId) {
        console.warn('Department ID mismatch during expense deletion');
      }
      
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (error) {
      console.error('Error deleting expense securely:', error);
      throw error;
    }
  }

  /**
   * Validate expense edit permissions with cross-workspace support
   * Checks if a user can edit a specific expense
   */
  static async canUserEditExpense(
    userId: string,
    expenseId: string,
    workspaceId: string
  ): Promise<boolean> {
    try {
      // Get expense with cross-workspace support
      const expense = await this.getExpenseById(expenseId, workspaceId, userId);
      if (!expense) {
        return false;
      }

      // Import access control service for permission checking
      const { ExpenseAccessControl } = await import('./expense-access-control');
      
      // Check permissions in the expense's original workspace
      const canEditInOriginalWorkspace = await ExpenseAccessControl.canUserEditExpense(
        userId,
        expense.workspaceId, // Use the expense's original workspace
        {
          submittedBy: expense.submittedBy,
          departmentId: expense.departmentId,
          status: expense.status
        }
      );
      
      // If can edit in original workspace, return true
      if (canEditInOriginalWorkspace) {
        return true;
      }
      
      // If not in original workspace, check cross-workspace permissions
      if (expense.workspaceId !== workspaceId) {
        const canAccessCrossWorkspace = await ExpenseAccessControl.canUserManageCrossWorkspace(userId, workspaceId);
        if (canAccessCrossWorkspace) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking edit permissions:', error);
      return false;
    }
  }

  /**
   * Get workspace expense categories (delegated to main service)
   * This ensures consistency with the main expense management service
   */
  static async getWorkspaceExpenseCategories(workspaceId: string): Promise<ExpenseCategory[]> {
    return ExpenseManagementService.getWorkspaceExpenseCategories(workspaceId);
  }

  /**
   * Prepare expense data for editing
   * Formats expense data for form consumption with proper typing
   */
  static prepareExpenseForEdit(expense: Expense): {
    title: string;
    description?: string;
    amount: number;
    currency: string;
    expenseDate: string;
    category: string;
    departmentId?: string;
    costCenterId?: string;
    projectId?: string;
    vendor?: string;
    paymentMethod: string;
    notes?: string;
    tags: string[];
    billable: boolean;
    reimbursable: boolean;
  } {
    // Handle date conversion from Firestore Timestamp or Date object
    let expenseDateString = '';
    if (expense.expenseDate) {
      const dateValue = expense.expenseDate as any;
      
      // Check if it's a Firestore Timestamp
      if (dateValue && typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
        expenseDateString = dateValue.toDate().toISOString().split('T')[0];
      } 
      // Check if it's already a Date object
      else if (dateValue instanceof Date) {
        expenseDateString = dateValue.toISOString().split('T')[0];
      }
      // If it's a string, use as is (fallback)
      else if (typeof dateValue === 'string') {
        expenseDateString = dateValue.split('T')[0];
      }
      // Fallback to current date
      else {
        expenseDateString = new Date().toISOString().split('T')[0];
      }
    } else {
      expenseDateString = new Date().toISOString().split('T')[0];
    }

    return {
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount,
      currency: expense.currency,
      expenseDate: expenseDateString,
      category: typeof expense.category === 'object' ? expense.category.id : expense.category || '',
      departmentId: expense.departmentId || '',
      costCenterId: expense.costCenterId || '',
      projectId: expense.projectId || '',
      vendor: expense.vendor || '',
      paymentMethod: expense.paymentMethod || 'other',
      notes: expense.notes || '',
      tags: expense.tags || [],
      billable: expense.billable || false,
      reimbursable: expense.reimbursable !== undefined ? expense.reimbursable : true
    };
  }

  /**
   * Validate expense update data
   * Ensures all required fields are present and valid
   */
  static validateExpenseUpdateData(updateData: Partial<Expense>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (updateData.title !== undefined && !updateData.title.trim()) {
      errors.push('Title is required');
    }

    if (updateData.amount !== undefined && (updateData.amount <= 0 || isNaN(updateData.amount))) {
      errors.push('Amount must be a positive number');
    }

    if (updateData.currency !== undefined && !updateData.currency.trim()) {
      errors.push('Currency is required');
    }

    if (updateData.expenseDate !== undefined && isNaN(updateData.expenseDate.getTime())) {
      errors.push('Valid expense date is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get expense edit history (placeholder for future implementation)
   * This could track changes made to expenses for audit purposes
   */
  static async getExpenseEditHistory(expenseId: string, workspaceId: string): Promise<any[]> {
    try {
      // TODO: Implement edit history tracking
      // This would integrate with the activity service to track expense changes
      console.log(`Getting edit history for expense ${expenseId} in workspace ${workspaceId}`);
      return [];
    } catch (error) {
      console.error('Error getting expense edit history:', error);
      return [];
    }
  }
}
