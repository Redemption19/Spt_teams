import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Expense, 
  ExpenseCategory, 
  ExpenseFormData,
  ExpenseAnalytics,
  ApprovalStep,
  CostCenter
} from './types/financial-types';
import { cleanFirestoreData, createUpdateData } from './firestore-utils';
import { convertTimestamps } from './utils';
import { CurrencyService } from './currency-service';
import { ExpenseAccessControl } from './expense-access-control';
import { BudgetTrackingService } from './budget-tracking-service';

import { safeNumber } from './utils';

export class ExpenseManagementService {
  // Expense caching system (5 minute TTL)
  private static expenseCache = new Map<string, { expenses: Expense[], timestamp: number }>();
  private static categoryCache = new Map<string, { categories: ExpenseCategory[], timestamp: number }>();
  private static analyticsCache = new Map<string, { analytics: any, timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private static isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  private static getCachedExpenses(key: string): Expense[] | null {
    const cached = this.expenseCache.get(key);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.expenses;
    }
    return null;
  }

  private static setCachedExpenses(key: string, expenses: Expense[]): void {
    this.expenseCache.set(key, {
      expenses: [...expenses], // Clone array
      timestamp: Date.now()
    });
  }

  private static getCachedCategories(workspaceId: string): ExpenseCategory[] | null {
    const cached = this.categoryCache.get(workspaceId);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.categories;
    }
    return null;
  }

  private static setCachedCategories(workspaceId: string, categories: ExpenseCategory[]): void {
    this.categoryCache.set(workspaceId, {
      categories: [...categories], // Clone array
      timestamp: Date.now()
    });
  }

  private static getCachedAnalytics(key: string): any | null {
    const cached = this.analyticsCache.get(key);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.analytics;
    }
    return null;
  }

  private static setCachedAnalytics(key: string, analytics: any): void {
    this.analyticsCache.set(key, {
      analytics: { ...analytics }, // Clone object
      timestamp: Date.now()
    });
  }

  // Clear cache when expenses are modified
  private static clearExpenseCache(workspaceId?: string): void {
    if (workspaceId) {
      // Clear specific workspace caches
      const keysToDelete = Array.from(this.expenseCache.keys()).filter(key => key.includes(workspaceId));
      keysToDelete.forEach(key => this.expenseCache.delete(key));
      
      this.categoryCache.delete(workspaceId);
      
      const analyticsKeysToDelete = Array.from(this.analyticsCache.keys()).filter(key => key.includes(workspaceId));
      analyticsKeysToDelete.forEach(key => this.analyticsCache.delete(key));
    } else {
      // Clear all caches
      this.expenseCache.clear();
      this.categoryCache.clear();
      this.analyticsCache.clear();
    }
  }
  
  // Utility function to safely convert amounts to numbers
  private static safeAmount(amount: any): number {
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
  
  // ===== EXPENSE OPERATIONS =====
  
  /**
   * Create a new expense
   */
  static async createExpense(
    workspaceId: string, 
    expenseData: ExpenseFormData, 
    submittedBy: string
  ): Promise<string> {
    try {
      console.log('[DEBUG] Creating expense', { workspaceId, expenseData, submittedBy });
      const expenseRef = doc(collection(db, 'expenses'));
      const expenseId = expenseRef.id;
      
      // Get currency exchange rate
      const defaultCurrency = await CurrencyService.getDefaultCurrency(workspaceId);
      const amountInBaseCurrency = await CurrencyService.convertAmount(
        workspaceId,
        expenseData.amount,
        expenseData.currency,
        defaultCurrency.code
      );
      console.log('[DEBUG] Amount in base currency', { amountInBaseCurrency, defaultCurrency });
      
      // Check if approval is required
      const category = await this.getExpenseCategory(expenseData.category);
      const requiresApproval = category?.requiresApproval || 
        (category?.approvalLimit && expenseData.amount > category.approvalLimit);
      
      const expense: Expense = {
        id: expenseId,
        title: expenseData.title,
        description: expenseData.description,
        amount: Number(expenseData.amount),
        currency: expenseData.currency,
        amountInBaseCurrency: Number(amountInBaseCurrency),
        category: category || { 
          id: expenseData.category, 
          name: expenseData.category,
          code: expenseData.category.toUpperCase(),
          requiresApproval: false,
          isActive: true,
          workspaceId
        },
        subcategory: expenseData.subcategory,
        workspaceId,
        costCenterId: expenseData.costCenterId,
        departmentId: expenseData.departmentId,
        projectId: expenseData.projectId,
        taskId: expenseData.taskId,
        submittedBy,
        status: requiresApproval ? 'submitted' : 'approved',
        expenseDate: expenseData.expenseDate,
        receiptUrl: expenseData.receiptFile ? await this.uploadReceipt(expenseData.receiptFile, expenseId) : undefined,
        tags: expenseData.tags || [],
        billable: expenseData.billable,
        reimbursable: expenseData.reimbursable,
        approvalWorkflow: requiresApproval ? await this.createApprovalWorkflow(workspaceId, expenseData.amount) : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(expenseRef, cleanFirestoreData(expense));
      
      // Update cost center spending if applicable
      if (expenseData.costCenterId) {
        await this.updateCostCenterSpending(expenseData.costCenterId, amountInBaseCurrency);
      }

      // Update relevant budget's spent field (department, project, team, cost center, workspace)
      // Department budget
      if (expenseData.departmentId) {
        const budgets = await BudgetTrackingService.getWorkspaceBudgets(workspaceId, { type: 'department', entityId: expenseData.departmentId, isActive: true });
        console.log('[DEBUG] Department budgets found', budgets);
        if (budgets && budgets.length > 0) {
          await BudgetTrackingService.updateBudgetSpending(budgets[0].id, amountInBaseCurrency);
          console.log('[DEBUG] Updated department budget spending', { budgetId: budgets[0].id, amountInBaseCurrency });
        }
      }
      // Project budget
      if (expenseData.projectId) {
        const budgets = await BudgetTrackingService.getWorkspaceBudgets(workspaceId, { type: 'project', entityId: expenseData.projectId, isActive: true });
        console.log('[DEBUG] Project budgets found', budgets);
        if (budgets && budgets.length > 0) {
          await BudgetTrackingService.updateBudgetSpending(budgets[0].id, amountInBaseCurrency);
          console.log('[DEBUG] Updated project budget spending', { budgetId: budgets[0].id, amountInBaseCurrency });
        }
      }
      // Cost center budget
      if (expenseData.costCenterId) {
        const budgets = await BudgetTrackingService.getWorkspaceBudgets(workspaceId, { type: 'costCenter', entityId: expenseData.costCenterId, isActive: true });
        console.log('[DEBUG] Cost center budgets found', budgets);
        if (budgets && budgets.length > 0) {
          await BudgetTrackingService.updateBudgetSpending(budgets[0].id, amountInBaseCurrency);
          console.log('[DEBUG] Updated cost center budget spending', { budgetId: budgets[0].id, amountInBaseCurrency });
        }
      }
      // Workspace budget (if no department/project/cost center, fallback)
      if (!expenseData.departmentId && !expenseData.projectId && !expenseData.costCenterId) {
        const budgets = await BudgetTrackingService.getWorkspaceBudgets(workspaceId, { type: 'workspace', entityId: workspaceId, isActive: true });
        console.log('[DEBUG] Workspace budgets found', budgets);
        if (budgets && budgets.length > 0) {
          await BudgetTrackingService.updateBudgetSpending(budgets[0].id, amountInBaseCurrency);
          console.log('[DEBUG] Updated workspace budget spending', { budgetId: budgets[0].id, amountInBaseCurrency });
        }
      }

      // Clear cache after creating expense
      this.clearExpenseCache(workspaceId);
      
      return expenseId;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }
  
  /**
   * Get expense by ID
   */
  static async getExpense(expenseId: string): Promise<Expense | null> {
    try {
      const docSnap = await getDoc(doc(db, 'expenses', expenseId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return convertTimestamps({
          id: docSnap.id,
          ...data
        }) as Expense;
      }
      return null;
    } catch (error) {
      console.error('Error fetching expense:', error);
      return null;
    }
  }
  
  /**
   * Get workspace expenses with owner cross-workspace support
   */
  static async getWorkspaceExpenses(
    workspaceId: string,
    options?: {
      status?: Expense['status'];
      submittedBy?: string;
      category?: string;
      dateRange?: { start: Date; end: Date };
      limit?: number;
      costCenterId?: string;
      departmentId?: string;
      projectId?: string;
      includeSubWorkspaces?: boolean; // New option for owner cross-workspace access
      userRole?: string;
    }
  ): Promise<Expense[]> {
    try {
      // Create cache key based on parameters
      const cacheKey = `${workspaceId}_${JSON.stringify(options || {})}`;
      
      // Check cache first (unless it's a specific user filter which should be fresh)
      if (!options?.submittedBy) {
        const cached = this.getCachedExpenses(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // If owner wants to include sub-workspaces, get expenses from all related workspaces
      if (options?.includeSubWorkspaces && options?.userRole === 'owner') {
        return await this.getOwnerCrossWorkspaceExpenses(workspaceId, options);
      }

      let q = query(
        collection(db, 'expenses'),
        where('workspaceId', '==', workspaceId)
      );
      
      if (options?.status) {
        q = query(q, where('status', '==', options.status));
      }
      
      if (options?.submittedBy) {
        q = query(q, where('submittedBy', '==', options.submittedBy));
      }
      
      if (options?.costCenterId) {
        q = query(q, where('costCenterId', '==', options.costCenterId));
      }
      
      if (options?.departmentId) {
        q = query(q, where('departmentId', '==', options.departmentId));
      }
      
      if (options?.projectId) {
        q = query(q, where('projectId', '==', options.projectId));
      }
      
      if (options?.dateRange) {
        q = query(q, 
          where('expenseDate', '>=', options.dateRange.start),
          where('expenseDate', '<=', options.dateRange.end)
        );
      }
      
      q = query(q, orderBy('expenseDate', 'desc'));
      
      if (options?.limit) {
        q = query(q, limit(options.limit));
      }
      
      const snapshot = await getDocs(q);
      const expenses = snapshot.docs.map(doc => {
        const data = doc.data();
        return convertTimestamps({
          id: doc.id,
          ...data
        });
      }) as Expense[];

      // Cache the results (but not user-specific queries)
      if (!options?.submittedBy) {
        this.setCachedExpenses(cacheKey, expenses);
      }

      return expenses;
    } catch (error) {
      console.error('Error fetching workspace expenses:', error);
      throw error;
    }
  }

  /**
   * Get expenses with department-level access control
   */
  static async getExpensesWithAccessControl(
    workspaceId: string,
    userId: string,
    options?: {
      status?: Expense['status'];
      category?: string;
      dateRange?: { start: Date; end: Date };
      limit?: number;
      costCenterId?: string;
      departmentId?: string;
      projectId?: string;
    }
  ): Promise<Expense[]> {
    try {
      console.log('🔍 getExpensesWithAccessControl called with:', { workspaceId, userId, options });
      
      // Get access control criteria
      const filterCriteria = await ExpenseAccessControl.getExpenseFilterCriteria(userId, workspaceId);
      console.log('🔒 Filter criteria:', filterCriteria);
      
      if (filterCriteria.filterType === 'none') {
        console.log('❌ No access - returning empty array');
        return [];
      }
      
      let q = query(
        collection(db, 'expenses'),
        where('workspaceId', '==', workspaceId)
      );
      
      // First, let's check the total count of expenses in the workspace
      const totalSnapshot = await getDocs(query(
        collection(db, 'expenses'),
        where('workspaceId', '==', workspaceId)
      ));
      console.log('📈 Total expenses in workspace:', totalSnapshot.docs.length);
      
      // Apply access control filters
      if (filterCriteria.filterType === 'own') {
        q = query(q, where('submittedBy', '==', userId));
      } else if (filterCriteria.filterType === 'department' && filterCriteria.departmentIds) {
        // For department-level access, we need to handle multiple departments
        if (filterCriteria.departmentIds.length === 1) {
          q = query(q, where('departmentId', '==', filterCriteria.departmentIds[0]));
        } else {
          // For multiple departments, we'll filter in memory after fetching
          // This is a limitation of Firestore's where clause
        }
      }
      
      // Apply additional filters
      if (options?.status) {
        q = query(q, where('status', '==', options.status));
      }
      
      if (options?.costCenterId) {
        q = query(q, where('costCenterId', '==', options.costCenterId));
      }
      
      if (options?.departmentId) {
        q = query(q, where('departmentId', '==', options.departmentId));
      }
      
      if (options?.projectId) {
        q = query(q, where('projectId', '==', options.projectId));
      }
      
      if (options?.dateRange) {
        q = query(q, 
          where('expenseDate', '>=', options.dateRange.start),
          where('expenseDate', '<=', options.dateRange.end)
        );
      }
      
      q = query(q, orderBy('expenseDate', 'desc'));
      
      if (options?.limit) {
        q = query(q, limit(options.limit));
      }
      
      const snapshot = await getDocs(q);
      console.log('📊 Raw query results count:', snapshot.docs.length);
      
      let expenses = snapshot.docs.map(doc => {
        const data = doc.data();
        return convertTimestamps({
          id: doc.id,
          ...data
        });
      }) as Expense[];
      
      console.log('📋 Converted expenses count:', expenses.length);
      
      // Apply additional filtering for department access
      if (filterCriteria.filterType === 'department' && filterCriteria.departmentIds) {
        expenses = expenses.filter(expense => {
          const departmentMatch = expense.departmentId && 
            filterCriteria.departmentIds!.includes(expense.departmentId);
          const ownExpense = filterCriteria.userId && 
            expense.submittedBy === filterCriteria.userId;
          
          return departmentMatch || ownExpense;
        });
        console.log('🏢 After department filtering:', expenses.length);
      }
      
      // Final validation - check each expense individually
      const validatedExpenses = [];
      for (const expense of expenses) {
        const canView = await ExpenseAccessControl.canUserViewExpense(
          userId, 
          workspaceId, 
          { submittedBy: expense.submittedBy, departmentId: expense.departmentId }
        );
        if (canView) {
          validatedExpenses.push(expense);
        }
      }
      
      console.log('✅ Final validated expenses count:', validatedExpenses.length);
      return validatedExpenses;
    } catch (error) {
      console.error('Error fetching expenses with access control:', error);
      throw error;
    }
  }
  
  /**
   * Update expense
   */
  static async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<void> {
    try {
      // Get expense to find workspaceId for cache clearing
      const expense = await this.getExpense(expenseId);
      const workspaceId = expense?.workspaceId;

      const updateData = createUpdateData(cleanFirestoreData(updates));
      await updateDoc(doc(db, 'expenses', expenseId), updateData);

      // Clear cache after updating expense
      if (workspaceId) {
        this.clearExpenseCache(workspaceId);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }
  
  /**
   * Approve expense
   */
  static async approveExpense(
    expenseId: string, 
    approverId: string, 
    comments?: string
  ): Promise<void> {
    try {
      const expense = await this.getExpense(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }
      
      const updatedWorkflow = expense.approvalWorkflow?.map(step => {
        if (step.approverId === approverId && step.status === 'pending') {
          return {
            ...step,
            status: 'approved' as const,
            comments,
            actionDate: new Date()
          };
        }
        return step;
      }) || [];
      
      // Check if all approvals are complete
      const allApproved = updatedWorkflow.every(step => step.status === 'approved');
      const status = allApproved ? 'approved' : 'submitted';
      
      await this.updateExpense(expenseId, {
        status,
        approvalWorkflow: updatedWorkflow,
        approvedBy: allApproved ? approverId : undefined,
        updatedAt: new Date()
      });
      
      // Record activity
      await this.recordExpenseActivity(expenseId, 'approved', `Approved by ${approverId}`, approverId);
    } catch (error) {
      console.error('Error approving expense:', error);
      throw error;
    }
  }
  
  /**
   * Reject expense
   */
  static async rejectExpense(
    expenseId: string, 
    approverId: string, 
    comments: string
  ): Promise<void> {
    try {
      const expense = await this.getExpense(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }
      
      const updatedWorkflow = expense.approvalWorkflow?.map(step => {
        if (step.approverId === approverId && step.status === 'pending') {
          return {
            ...step,
            status: 'rejected' as const,
            comments,
            actionDate: new Date()
          };
        }
        return step;
      }) || [];
      
      await this.updateExpense(expenseId, {
        status: 'rejected',
        approvalWorkflow: updatedWorkflow,
        updatedAt: new Date()
      });
      
      // Record activity
      await this.recordExpenseActivity(expenseId, 'rejected', `Rejected by ${approverId}: ${comments}`, approverId);
    } catch (error) {
      console.error('Error rejecting expense:', error);
      throw error;
    }
  }
  
  /**
   * Delete expense
   */
  static async deleteExpense(expenseId: string): Promise<void> {
    try {
      // Get expense to find workspaceId for cache clearing
      const expense = await this.getExpense(expenseId);
      const workspaceId = expense?.workspaceId;

      await deleteDoc(doc(db, 'expenses', expenseId));

      // Clear cache after deleting expense
      if (workspaceId) {
        this.clearExpenseCache(workspaceId);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }
  
  // ===== EXPENSE CATEGORIES =====
  
  /**
   * Create expense category
   */
  static async createExpenseCategory(
    workspaceId: string,
    categoryData: Omit<ExpenseCategory, 'id' | 'workspaceId'>
  ): Promise<string> {
    try {
      const categoryRef = doc(collection(db, 'expenseCategories'));
      const categoryId = categoryRef.id;
      
      const category: ExpenseCategory = {
        id: categoryId,
        name: categoryData.name || 'Untitled Category',
        code: categoryData.code || `CAT-${categoryId.slice(-6).toUpperCase()}`,
        description: categoryData.description,
        defaultCostCenter: categoryData.defaultCostCenter,
        requiresApproval: categoryData.requiresApproval !== undefined ? categoryData.requiresApproval : true,
        approvalLimit: categoryData.approvalLimit,
        isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
        workspaceId
      };
      
      // Clean the data to remove undefined values before saving to Firestore
      const cleanCategory = cleanFirestoreData(category);
      
      await setDoc(categoryRef, cleanCategory);
      return categoryId;
    } catch (error) {
      console.error('Error creating expense category:', error);
      throw error;
    }
  }
  
  /**
   * Get workspace expense categories
   */
  static async getWorkspaceExpenseCategories(workspaceId: string): Promise<ExpenseCategory[]> {
    try {
      // Check cache first
      const cached = this.getCachedCategories(workspaceId);
      if (cached) {
        return cached;
      }

      const q = query(
        collection(db, 'expenseCategories'),
        where('workspaceId', '==', workspaceId),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const categories = snapshot.docs.map(doc => {
        const data = doc.data();
        return convertTimestamps({
          id: doc.id,
          ...data
        });
      }) as ExpenseCategory[];

      // Cache the results
      this.setCachedCategories(workspaceId, categories);

      return categories;
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      throw error;
    }
  }
  
  /**
   * Get expense category by ID
   */
  static async getExpenseCategory(categoryId: string): Promise<ExpenseCategory | null> {
    try {
      const docSnap = await getDoc(doc(db, 'expenseCategories', categoryId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return convertTimestamps({
          id: docSnap.id,
          ...data
        }) as ExpenseCategory;
      }
      return null;
    } catch (error) {
      console.error('Error fetching expense category:', error);
      return null;
    }
  }

  /**
   * Update expense category
   */
  static async updateExpenseCategory(
    categoryId: string, 
    updates: Partial<Omit<ExpenseCategory, 'id' | 'workspaceId'>>
  ): Promise<void> {
    try {
      const updateData = cleanFirestoreData(updates);
      await updateDoc(doc(db, 'expenseCategories', categoryId), updateData);
    } catch (error) {
      console.error('Error updating expense category:', error);
      throw error;
    }
  }

  /**
   * Delete expense category
   */
  static async deleteExpenseCategory(categoryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'expenseCategories', categoryId));
    } catch (error) {
      console.error('Error deleting expense category:', error);
      throw error;
    }
  }

  /**
   * Toggle category active status
   */
  static async toggleCategoryStatus(categoryId: string, isActive: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'expenseCategories', categoryId), { 
        isActive,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling category status:', error);
      throw error;
    }
  }
  
  // ===== ANALYTICS =====
  
  /**
   * Get expense analytics
   */
  static async getExpenseAnalytics(
    workspaceId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<ExpenseAnalytics> {
    try {
      const expenses = await this.getWorkspaceExpenses(workspaceId, { 
        dateRange,
        status: 'approved'
      });
      
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amountInBaseCurrency, 0);
      
      // Group by category
      const totalByCategory = expenses.reduce((acc, expense) => {
        const categoryName = expense.category.name;
        acc[categoryName] = (acc[categoryName] || 0) + expense.amountInBaseCurrency;
        return acc;
      }, {} as { [category: string]: number });
      
      // Group by department
      const totalByDepartment = expenses.reduce((acc, expense) => {
        if (expense.departmentId) {
          acc[expense.departmentId] = (acc[expense.departmentId] || 0) + expense.amountInBaseCurrency;
        }
        return acc;
      }, {} as { [department: string]: number });
      
      // Group by project
      const totalByProject = expenses.reduce((acc, expense) => {
        if (expense.projectId) {
          acc[expense.projectId] = (acc[expense.projectId] || 0) + expense.amountInBaseCurrency;
        }
        return acc;
      }, {} as { [project: string]: number });
      
      // Monthly trend (simplified)
      const monthlyTrend: { month: string; amount: number }[] = [];
      
      // Top expense categories
      const topExpenseCategories = Object.entries(totalByCategory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: Math.round((amount / totalExpenses) * 100)
        }));
      
      // Budget utilization (placeholder)
      const budgetUtilization: { budgetName: string; used: number; total: number; percentage: number }[] = [];
      
      return {
        totalExpenses,
        totalByCategory,
        totalByDepartment,
        totalByProject,
        monthlyTrend,
        topExpenseCategories,
        budgetUtilization
      };
    } catch (error) {
      console.error('Error getting expense analytics:', error);
      throw error;
    }
  }
  
  // ===== HELPER METHODS =====
  
  /**
   * Upload receipt file
   */
  private static async uploadReceipt(file: File, expenseId: string): Promise<string> {
    try {
      // TODO: Implement file upload to Firebase Storage
      // For now, return a placeholder URL
      return `https://storage.yourplatform.com/receipts/${expenseId}/${file.name}`;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      throw error;
    }
  }
  
  /**
   * Get exchange rate (using currency service)
   */
  private static async getExchangeRate(
    workspaceId: string,
    fromCurrency: string, 
    toCurrency: string
  ): Promise<number> {
    try {
      return await CurrencyService.getExchangeRate(workspaceId, fromCurrency, toCurrency);
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      return 1;
    }
  }
  
  /**
   * Create approval workflow
   */
  private static async createApprovalWorkflow(workspaceId: string, amount: number): Promise<ApprovalStep[]> {
    try {
      // TODO: Implement approval workflow logic based on amount and workspace settings
      // For now, return a simple workflow
      return [
        {
          id: '1',
          approverId: 'manager_id', // Should be determined by org structure
          status: 'pending',
          order: 1
        }
      ];
    } catch (error) {
      console.error('Error creating approval workflow:', error);
      return [];
    }
  }
  
  /**
   * Update cost center spending
   */
  private static async updateCostCenterSpending(costCenterId: string, amount: number): Promise<void> {
    try {
      // TODO: Implement cost center spending tracking
      console.log(`Updating cost center ${costCenterId} spending: +${amount}`);
    } catch (error) {
      console.error('Error updating cost center spending:', error);
    }
  }
  
  /**
   * Record expense activity
   */
  private static async recordExpenseActivity(
    expenseId: string,
    action: string,
    details: string,
    userId: string
  ): Promise<void> {
    try {
      // TODO: Integrate with activity service
      console.log(`Activity: ${action} on expense ${expenseId} by ${userId}: ${details}`);
    } catch (error) {
      console.error('Error recording expense activity:', error);
    }
  }

  // ===== OWNER CROSS-WORKSPACE ACCESS =====

  /**
   * Get expenses across all workspaces for owners
   */
  static async getOwnerCrossWorkspaceExpenses(
    mainWorkspaceId: string,
    options?: {
      status?: Expense['status'];
      submittedBy?: string;
      category?: string;
      dateRange?: { start: Date; end: Date };
      limit?: number;
      costCenterId?: string;
      departmentId?: string;
      projectId?: string;
    }
  ): Promise<Expense[]> {
    try {
      // Get all workspace IDs that owner has access to
      const { WorkspaceService } = await import('./workspace-service');
      const accessibleWorkspaces = await WorkspaceService.getSubWorkspaces(mainWorkspaceId);
      const allWorkspaces = [
        await WorkspaceService.getWorkspace(mainWorkspaceId), 
        ...accessibleWorkspaces
      ].filter(Boolean);
      
      // Create workspace name mapping
      const workspaceNameMap = new Map<string, string>();
      allWorkspaces.forEach(workspace => {
        if (workspace) {
          workspaceNameMap.set(workspace.id, workspace.name);
        }
      });

      // Get expenses from all workspaces
      const allExpenses: Expense[] = [];
      
      for (const workspace of allWorkspaces) {
        if (!workspace) continue;
        
        let q = query(
          collection(db, 'expenses'),
          where('workspaceId', '==', workspace.id)
        );
        
        if (options?.status) {
          q = query(q, where('status', '==', options.status));
        }
        
        if (options?.submittedBy) {
          q = query(q, where('submittedBy', '==', options.submittedBy));
        }
        
        if (options?.category) {
          q = query(q, where('category.name', '==', options.category)); // Fixed: category is an object
        }
        
        if (options?.costCenterId) {
          q = query(q, where('costCenterId', '==', options.costCenterId));
        }
        
        if (options?.departmentId) {
          q = query(q, where('departmentId', '==', options.departmentId));
        }
        
        if (options?.projectId) {
          q = query(q, where('projectId', '==', options.projectId));
        }
        
        // Note: Removed orderBy to avoid Firestore index issues during cross-workspace queries
        // We'll sort the results in memory after fetching
        
        const querySnapshot = await getDocs(q);
        const workspaceExpenses = querySnapshot.docs.map((doc, index) => {
          const data = doc.data();
          const expense = convertTimestamps({
            id: doc.id,
            ...data
          }) as Expense;
          
          // Add workspace name for cross-workspace display
          (expense as any).workspaceName = workspaceNameMap.get(workspace.id) || workspace.name;
          
          return expense;
        });
        
        allExpenses.push(...workspaceExpenses);
      }
      
      // Filter by date range if specified
      let filteredExpenses = allExpenses;
      if (options?.dateRange) {
        filteredExpenses = allExpenses.filter(expense => {
          const expenseDate = expense.expenseDate;
          return expenseDate >= options.dateRange!.start && expenseDate <= options.dateRange!.end;
        });
      }
      
      // Sort by submitted date (most recent first)
      filteredExpenses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Apply limit if specified
      if (options?.limit) {
        filteredExpenses = filteredExpenses.slice(0, options.limit);
      }

      return filteredExpenses;
    } catch (error) {
      console.error('Error fetching cross-workspace expenses:', error);
      return [];
    }
  }

  /**
   * Get cross-workspace expense analytics for owners
   */
  static async getOwnerCrossWorkspaceAnalytics(
    mainWorkspaceId: string,
    options?: {
      dateRange?: { start: Date; end: Date };
      period?: 'week' | 'month' | 'quarter' | 'year';
    }
  ): Promise<{
    totalExpenses: number;
    totalAmount: number;
    expensesByStatus: { [status: string]: number };
    expensesByWorkspace: { workspaceId: string; workspaceName: string; count: number; amount: number }[];
    expensesByCategory: { [category: string]: number };
    expensesByDepartment: { [departmentId: string]: { name: string; count: number; amount: number } };
    monthlyTrend: { month: string; count: number; amount: number }[];
  }> {
    try {
      // Get all workspace IDs that owner has access to
      const { WorkspaceService } = await import('./workspace-service');
      const accessibleWorkspaces = await WorkspaceService.getSubWorkspaces(mainWorkspaceId);
      const mainWorkspace = await WorkspaceService.getWorkspace(mainWorkspaceId);
      const allWorkspaces = [mainWorkspace, ...accessibleWorkspaces].filter(Boolean);
      const workspaceMap = new Map(allWorkspaces.map(w => [w!.id, w!.name]));

      // Get cross-workspace expenses
      const expenses = await this.getOwnerCrossWorkspaceExpenses(mainWorkspaceId, {
        dateRange: options?.dateRange
      });

      // Calculate analytics
      const totalExpenses = expenses.length;
      const totalAmount = expenses.reduce((sum, expense) => sum + expense.amountInBaseCurrency, 0);

      // Group by status
      const expensesByStatus: { [status: string]: number } = {};
      expenses.forEach(expense => {
        expensesByStatus[expense.status] = (expensesByStatus[expense.status] || 0) + 1;
      });

      // Group by workspace
      const expensesByWorkspace: { workspaceId: string; workspaceName: string; count: number; amount: number }[] = [];
      const workspaceStats = new Map<string, { count: number; amount: number }>();
      
      expenses.forEach(expense => {
        const current = workspaceStats.get(expense.workspaceId) || { count: 0, amount: 0 };
        workspaceStats.set(expense.workspaceId, {
          count: current.count + 1,
          amount: current.amount + expense.amountInBaseCurrency
        });
      });

      workspaceStats.forEach((stats, workspaceId) => {
        expensesByWorkspace.push({
          workspaceId,
          workspaceName: workspaceMap.get(workspaceId) || 'Unknown Workspace',
          count: stats.count,
          amount: stats.amount
        });
      });

      // Group by category
      const expensesByCategory: { [category: string]: number } = {};
      expenses.forEach(expense => {
        const categoryName = expense.category.name;
        expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + expense.amountInBaseCurrency;
      });

      // Group by department (will need to resolve department names)
      const expensesByDepartment: { [departmentId: string]: { name: string; count: number; amount: number } } = {};
      expenses.forEach(expense => {
        if (expense.departmentId) {
          if (!expensesByDepartment[expense.departmentId]) {
            expensesByDepartment[expense.departmentId] = { name: 'Unknown Department', count: 0, amount: 0 };
          }
          expensesByDepartment[expense.departmentId].count++;
          expensesByDepartment[expense.departmentId].amount += expense.amountInBaseCurrency;
        }
      });

      // Monthly trend
      const monthlyTrend: { month: string; count: number; amount: number }[] = [];
      const monthlyStats = new Map<string, { count: number; amount: number }>();

      expenses.forEach(expense => {
        const monthKey = expense.createdAt.toISOString().slice(0, 7); // YYYY-MM
        const current = monthlyStats.get(monthKey) || { count: 0, amount: 0 };
        monthlyStats.set(monthKey, {
          count: current.count + 1,
          amount: current.amount + expense.amountInBaseCurrency
        });
      });

      Array.from(monthlyStats.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([month, stats]) => {
          monthlyTrend.push({
            month,
            count: stats.count,
            amount: stats.amount
          });
        });

      return {
        totalExpenses,
        totalAmount,
        expensesByStatus,
        expensesByWorkspace,
        expensesByCategory,
        expensesByDepartment,
        monthlyTrend
      };
    } catch (error) {
      console.error('Error getting cross-workspace analytics:', error);
      throw error;
    }
  }

  /**
   * Get workspace summary for owner dashboard
   */
  static async getOwnerWorkspaceSummary(mainWorkspaceId: string): Promise<{
    workspaces: {
      id: string;
      name: string;
      type: 'main' | 'sub';
      expenseCount: number;
      totalAmount: number;
      pendingCount: number;
      pendingAmount: number;
    }[];
    totalWorkspaces: number;
    totalExpenses: number;
    totalAmount: number;
    totalPending: number;
    pendingAmount: number;
    approvedAmount: number;
    workspaceCount: number; // For backward compatibility
    pendingCount: number; // For backward compatibility
  }> {
    try {
      const { WorkspaceService } = await import('./workspace-service');
      const accessibleWorkspaces = await WorkspaceService.getSubWorkspaces(mainWorkspaceId);
      const mainWorkspace = await WorkspaceService.getWorkspace(mainWorkspaceId);
      const allWorkspaces = [
        { ...mainWorkspace!, type: 'main' as const },
        ...accessibleWorkspaces.map(w => ({ ...w, type: 'sub' as const }))
      ];

      const workspaceSummaries = await Promise.all(
        allWorkspaces.map(async (workspace) => {
          // Use the same query method as cross-workspace expenses for consistency
          let q = query(
            collection(db, 'expenses'),
            where('workspaceId', '==', workspace.id)
          );
          
          const querySnapshot = await getDocs(q);
          const expenses = querySnapshot.docs.map((doc, index) => {
            const data = doc.data();
            const expense = convertTimestamps({
              id: doc.id,
              ...data
            }) as Expense;
            
            return expense;
          });
          
          const pendingExpenses = expenses.filter(e => e.status === 'submitted');
          
          const summary = {
            id: workspace.id,
            name: workspace.name,
            type: workspace.type,
            expenseCount: expenses.length,
            totalAmount: expenses.reduce((sum, e) => sum + ExpenseManagementService.safeAmount(e.amountInBaseCurrency), 0),
            pendingCount: pendingExpenses.length,
            pendingAmount: pendingExpenses.reduce((sum, e) => sum + ExpenseManagementService.safeAmount(e.amountInBaseCurrency), 0)
          };
          
          return summary;
        })
      );

      const totals = workspaceSummaries.reduce(
        (acc, ws) => ({
          totalWorkspaces: acc.totalWorkspaces + 1,
          totalExpenses: acc.totalExpenses + ws.expenseCount,
          totalAmount: acc.totalAmount + ExpenseManagementService.safeAmount(ws.totalAmount),
          totalPending: acc.totalPending + ws.pendingCount,
          pendingAmount: acc.pendingAmount + ExpenseManagementService.safeAmount(ws.pendingAmount),
          approvedAmount: acc.approvedAmount + (ExpenseManagementService.safeAmount(ws.totalAmount) - ExpenseManagementService.safeAmount(ws.pendingAmount))
        }),
        { 
          totalWorkspaces: 0, 
          totalExpenses: 0, 
          totalAmount: 0, 
          totalPending: 0, 
          pendingAmount: 0, 
          approvedAmount: 0 
        }
      );

      const result = {
        workspaces: workspaceSummaries,
        workspaceCount: totals.totalWorkspaces, // Add for backward compatibility
        pendingCount: totals.totalPending, // Add for backward compatibility
        ...totals
      };
      
      return result;
    } catch (error) {
      console.error('Error getting owner workspace summary:', error);
      throw error;
    }
  }

  /**
   * Get expenses for multiple workspaces (cross-workspace aggregation)
   */
  static async getExpensesForWorkspaces(workspaceIds: string[]): Promise<Expense[]> {
    try {
      const { getDocs, collection, query, where } = await import('firebase/firestore');
      const allExpenses: Expense[] = [];
      // Firestore does not support 'in' queries for more than 10 items, so batch if needed
      const batchSize = 10;
      for (let i = 0; i < workspaceIds.length; i += batchSize) {
        const batchIds = workspaceIds.slice(i, i + batchSize);
        const q = query(collection(db, 'expenses'), where('workspaceId', 'in', batchIds));
        const snapshot = await getDocs(q);
        allExpenses.push(...snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as Expense[]);
      }
      return allExpenses;
    } catch (error) {
      console.error('Error fetching expenses for workspaces:', error);
      throw error;
    }
  }
}
