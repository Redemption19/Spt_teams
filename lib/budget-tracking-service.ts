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
  Budget, 
  BudgetAlert, 
  BudgetFormData,
  BudgetAnalytics,
  CostCenter
} from './types/financial-types';
import { cleanFirestoreData, createUpdateData } from './firestore-utils';

export class BudgetTrackingService {
  
  // ===== BUDGET OPERATIONS =====
  
  /**
   * Create a new budget
   */
  static async createBudget(
    workspaceId: string,
    budgetData: BudgetFormData,
    createdBy: string
  ): Promise<string> {
    try {
      const budgetRef = doc(collection(db, 'budgets'));
      const budgetId = budgetRef.id;
      
      // Create budget alerts with IDs
      const alerts: BudgetAlert[] = budgetData.alerts.map((alert, index) => ({
        id: `${budgetId}_alert_${index}`,
        budgetId,
        threshold: alert.threshold,
        type: alert.threshold >= 90 ? 'critical' : alert.threshold >= 75 ? 'warning' : 'warning',
        message: `Budget ${alert.threshold}% utilized`,
        notifyUsers: alert.notifyUsers,
        triggered: false
      }));
      
      const budget: Budget = {
        id: budgetId,
        name: budgetData.name,
        type: budgetData.type,
        entityId: budgetData.entityId,
        workspaceId,
        amount: budgetData.amount,
        currency: budgetData.currency,
        period: budgetData.period,
        startDate: budgetData.startDate,
        endDate: budgetData.endDate,
        categories: budgetData.categories,
        spent: 0,
        committed: 0,
        remaining: budgetData.amount,
        alerts,
        isActive: true,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(budgetRef, cleanFirestoreData(budget));
      return budgetId;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  }
  
  /**
   * Get budget by ID
   */
  static async getBudget(budgetId: string): Promise<Budget | null> {
    try {
      const docSnap = await getDoc(doc(db, 'budgets', budgetId));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Budget : null;
    } catch (error) {
      console.error('Error fetching budget:', error);
      return null;
    }
  }
  
  /**
   * Get workspace budgets
   */
  static async getWorkspaceBudgets(
    workspaceId: string,
    options?: {
      type?: Budget['type'];
      entityId?: string;
      isActive?: boolean;
      period?: Budget['period'];
    }
  ): Promise<Budget[]> {
    try {
      let q = query(
        collection(db, 'budgets'),
        where('workspaceId', '==', workspaceId)
      );
      
      if (options?.type) {
        q = query(q, where('type', '==', options.type));
      }
      
      if (options?.entityId) {
        q = query(q, where('entityId', '==', options.entityId));
      }
      
      if (options?.isActive !== undefined) {
        q = query(q, where('isActive', '==', options.isActive));
      }
      
      if (options?.period) {
        q = query(q, where('period', '==', options.period));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Budget[];
    } catch (error) {
      console.error('Error fetching workspace budgets:', error);
      throw error;
    }
  }
  
  /**
   * Update budget
   */
  static async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<void> {
    try {
      const updateData = createUpdateData(cleanFirestoreData(updates));
      await updateDoc(doc(db, 'budgets', budgetId), updateData);
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }
  
  /**
   * Update budget spending
   */
  static async updateBudgetSpending(
    budgetId: string,
    spentAmount: number,
    committedAmount: number = 0
  ): Promise<void> {
    try {
      const budget = await this.getBudget(budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }
      
      const newSpent = budget.spent + spentAmount;
      const newCommitted = budget.committed + committedAmount;
      const newRemaining = budget.amount - newSpent - newCommitted;
      
      await this.updateBudget(budgetId, {
        spent: newSpent,
        committed: newCommitted,
        remaining: newRemaining,
        updatedAt: new Date()
      });
      
      // Check for budget alerts
      await this.checkBudgetAlerts(budgetId, newSpent + newCommitted, budget.amount);
    } catch (error) {
      console.error('Error updating budget spending:', error);
      throw error;
    }
  }
  
  /**
   * Delete budget
   */
  static async deleteBudget(budgetId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'budgets', budgetId), {
        isActive: false,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  }
  
  // ===== COST CENTERS =====
  
  /**
   * Create cost center
   */
  static async createCostCenter(
    workspaceId: string,
    costCenterData: Omit<CostCenter, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const costCenterRef = doc(collection(db, 'costCenters'));
      const costCenterId = costCenterRef.id;
      
      const costCenter: CostCenter = {
        id: costCenterId,
        name: costCenterData.name || 'Untitled Cost Center',
        code: costCenterData.code || `CC-${costCenterId.slice(-6).toUpperCase()}`,
        description: costCenterData.description,
        workspaceId,
        departmentId: costCenterData.departmentId,
        branchId: costCenterData.branchId,
        regionId: costCenterData.regionId,
        managerId: costCenterData.managerId,
        budget: costCenterData.budget,
        budgetPeriod: costCenterData.budgetPeriod,
        isActive: costCenterData.isActive !== undefined ? costCenterData.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(costCenterRef, costCenter);
      return costCenterId;
    } catch (error) {
      console.error('Error creating cost center:', error);
      throw error;
    }
  }
  
  /**
   * Get workspace cost centers
   */
  static async getWorkspaceCostCenters(workspaceId: string): Promise<CostCenter[]> {
    try {
      const q = query(
        collection(db, 'costCenters'),
        where('workspaceId', '==', workspaceId),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CostCenter[];
    } catch (error) {
      console.error('Error fetching cost centers:', error);
      throw error;
    }
  }
  
  /**
   * Update cost center
   */
  static async updateCostCenter(costCenterId: string, updates: Partial<CostCenter>): Promise<void> {
    try {
      const updateData = createUpdateData(cleanFirestoreData(updates));
      await updateDoc(doc(db, 'costCenters', costCenterId), updateData);
    } catch (error) {
      console.error('Error updating cost center:', error);
      throw error;
    }
  }
  
  // ===== BUDGET ANALYTICS =====
  
  /**
   * Get budget analytics
   */
  static async getBudgetAnalytics(
    workspaceId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<BudgetAnalytics> {
    try {
      let budgetsQuery = query(
        collection(db, 'budgets'),
        where('workspaceId', '==', workspaceId),
        where('isActive', '==', true)
      );
      
      if (dateRange) {
        budgetsQuery = query(budgetsQuery,
          where('startDate', '>=', dateRange.start),
          where('endDate', '<=', dateRange.end)
        );
      }
      
      const budgetsSnapshot = await getDocs(budgetsQuery);
      const budgets = budgetsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Budget[];
      
      const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
      const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
      const totalRemaining = budgets.reduce((sum, budget) => sum + budget.remaining, 0);
      const utilizationPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
      
      // Department breakdown
      const departmentBreakdown = await this.getDepartmentBudgetBreakdown(workspaceId, budgets);
      
      // Collect all alerts
      const alerts: BudgetAlert[] = budgets.flatMap(budget => 
        budget.alerts.filter(alert => alert.triggered)
      );
      
      // Projected overruns (simplified calculation)
      const projectedOverruns = budgets
        .filter(budget => {
          const utilizationRate = budget.amount > 0 ? budget.spent / budget.amount : 0;
          return utilizationRate > 0.8; // 80% threshold for overrun risk
        })
        .map(budget => {
          const timeElapsed = (new Date().getTime() - budget.startDate.getTime()) / 
                             (budget.endDate.getTime() - budget.startDate.getTime());
          const projectedSpend = timeElapsed > 0 ? budget.spent / timeElapsed : budget.spent;
          const projectedOverrun = Math.max(0, projectedSpend - budget.amount);
          
          return {
            entity: budget.name,
            projectedAmount: projectedOverrun,
            timeline: this.calculateTimeToOverrun(budget)
          };
        })
        .filter(item => item.projectedAmount > 0);
      
      return {
        totalBudget,
        totalSpent,
        totalRemaining,
        utilizationPercentage,
        departmentBreakdown,
        alerts,
        projectedOverruns
      };
    } catch (error) {
      console.error('Error getting budget analytics:', error);
      throw error;
    }
  }
  
  /**
   * Get budget performance report
   */
  static async getBudgetPerformanceReport(
    workspaceId: string,
    budgetId?: string
  ): Promise<{
    budget: Budget;
    performance: {
      utilizationRate: number;
      spendingRate: number; // Per day
      projectedCompletion: Date;
      variance: number; // Budget vs actual
      efficiency: 'under' | 'on-track' | 'over';
    };
    trends: {
      dailySpending: { date: string; amount: number }[];
      categoryBreakdown: { category: string; amount: number; percentage: number }[];
    };
  }[]> {
    try {
      const budgets = budgetId 
        ? [await this.getBudget(budgetId)].filter(Boolean) as Budget[]
        : await this.getWorkspaceBudgets(workspaceId, { isActive: true });
      
      const reports = await Promise.all(budgets.map(async (budget) => {
        const utilizationRate = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
        const daysElapsed = Math.max(1, 
          (new Date().getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const spendingRate = budget.spent / daysElapsed;
        
        const totalDays = (budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24);
        const projectedTotalSpend = spendingRate * totalDays;
        const projectedCompletion = new Date(
          budget.startDate.getTime() + (budget.amount / spendingRate) * (1000 * 60 * 60 * 24)
        );
        
        const variance = ((budget.spent - (budget.amount * (daysElapsed / totalDays))) / budget.amount) * 100;
        const efficiency: 'under' | 'on-track' | 'over' = 
          variance < -10 ? 'under' : variance > 10 ? 'over' : 'on-track';
        
        return {
          budget,
          performance: {
            utilizationRate,
            spendingRate,
            projectedCompletion,
            variance,
            efficiency
          },
          trends: {
            dailySpending: [], // Would be populated with real expense data
            categoryBreakdown: [] // Would be populated with expense category breakdown
          }
        };
      }));
      
      return reports;
    } catch (error) {
      console.error('Error getting budget performance report:', error);
      throw error;
    }
  }
  
  // ===== HELPER METHODS =====
  
  /**
   * Check budget alerts
   */
  private static async checkBudgetAlerts(
    budgetId: string,
    currentSpending: number,
    totalBudget: number
  ): Promise<void> {
    try {
      const budget = await this.getBudget(budgetId);
      if (!budget) return;
      
      const utilizationPercentage = (currentSpending / totalBudget) * 100;
      const updatedAlerts = budget.alerts.map(alert => {
        if (utilizationPercentage >= alert.threshold && !alert.triggered) {
          return {
            ...alert,
            triggered: true,
            triggeredAt: new Date()
          };
        }
        return alert;
      });
      
      // Check if any new alerts were triggered
      const newlyTriggeredAlerts = updatedAlerts.filter((alert, index) => 
        alert.triggered && !budget.alerts[index].triggered
      );
      
      if (newlyTriggeredAlerts.length > 0) {
        await this.updateBudget(budgetId, { alerts: updatedAlerts });
        
        // Send notifications for triggered alerts
        for (const alert of newlyTriggeredAlerts) {
          await this.sendBudgetAlert(budget, alert);
        }
      }
    } catch (error) {
      console.error('Error checking budget alerts:', error);
    }
  }
  
  /**
   * Send budget alert
   */
  private static async sendBudgetAlert(budget: Budget, alert: BudgetAlert): Promise<void> {
    try {
      // TODO: Integrate with notification service
      console.log(`Budget Alert: ${budget.name} - ${alert.message}`, {
        budgetId: budget.id,
        threshold: alert.threshold,
        notifyUsers: alert.notifyUsers
      });
    } catch (error) {
      console.error('Error sending budget alert:', error);
    }
  }
  
  /**
   * Get department budget breakdown
   */
  private static async getDepartmentBudgetBreakdown(
    workspaceId: string,
    budgets: Budget[]
  ): Promise<{ department: string; budget: number; spent: number; remaining: number }[]> {
    try {
      const departmentBudgets = budgets.filter(budget => budget.type === 'department');
      
      return departmentBudgets.map(budget => ({
        department: budget.entityId, // Department ID - would need to resolve to name
        budget: budget.amount,
        spent: budget.spent,
        remaining: budget.remaining
      }));
    } catch (error) {
      console.error('Error getting department budget breakdown:', error);
      return [];
    }
  }
  
  /**
   * Calculate time to budget overrun
   */
  private static calculateTimeToOverrun(budget: Budget): string {
    try {
      const timeElapsed = new Date().getTime() - budget.startDate.getTime();
      const totalTime = budget.endDate.getTime() - budget.startDate.getTime();
      const timeElapsedRatio = timeElapsed / totalTime;
      
      if (timeElapsedRatio <= 0 || budget.spent <= 0) {
        return 'Unknown';
      }
      
      const spendingRate = budget.spent / timeElapsedRatio;
      const timeToOverrun = (budget.amount - budget.spent) / (spendingRate - budget.amount / (totalTime / timeElapsed));
      
      if (timeToOverrun <= 0) {
        return 'Already exceeded';
      }
      
      const daysToOverrun = timeToOverrun / (1000 * 60 * 60 * 24);
      
      if (daysToOverrun < 30) {
        return `${Math.round(daysToOverrun)} days`;
      } else if (daysToOverrun < 365) {
        return `${Math.round(daysToOverrun / 30)} months`;
      } else {
        return `${Math.round(daysToOverrun / 365)} years`;
      }
    } catch (error) {
      console.error('Error calculating time to overrun:', error);
      return 'Unknown';
    }
  }
}
