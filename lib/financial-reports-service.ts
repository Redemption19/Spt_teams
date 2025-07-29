'use client';

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  addDoc,
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  FinancialReport, 
  ReportFilters, 
  ExpenseAnalytics, 
  BudgetAnalytics,
  Expense,
  Budget,
  Invoice,
  CostCenter
} from './types/financial-types';
import { BudgetTrackingService } from './budget-tracking-service';
import { ExpenseManagementService } from './expense-management-service';
import { InvoiceService } from './invoice-service';
import { CurrencyService } from './currency-service';
import { DepartmentService } from './department-service';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'expense_analysis' | 'budget_analysis' | 'cost_center_analysis' | 'profit_loss' | 'cash_flow' | 'invoice_aging';
  estimatedTime: string;
  dataPoints: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedReport extends FinancialReport {
  fileSize: string;
  downloadUrl?: string;
  status: 'generating' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

export interface QuickInsight {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
  color: string;
  icon?: string;
}

export interface ReportGenerationOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  includeSummary: boolean;
  includeDetails: boolean;
  emailRecipients?: string[];
  scheduledReport?: boolean;
}

export class FinancialReportsService {
  private static readonly REPORTS_COLLECTION = 'financialReports';
  private static readonly TEMPLATES_COLLECTION = 'reportTemplates';

  /**
   * Get all report templates
   */
  static async getReportTemplates(): Promise<ReportTemplate[]> {
    try {
      const templatesRef = collection(db, this.TEMPLATES_COLLECTION);
      const q = query(templatesRef, where('isActive', '==', true), orderBy('name'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // If no templates found in database, return default templates
        console.log('No templates found in database, using default templates');
        return this.getDefaultTemplates();
      }
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as ReportTemplate[];
    } catch (error) {
      console.error('Error fetching report templates:', error);
      return this.getDefaultTemplates();
    }
  }

  /**
   * Get default report templates if none exist in database
   */
  private static getDefaultTemplates(): ReportTemplate[] {
    return [
      {
        id: 'budget_analysis',
        name: 'Budget Analysis Report',
        description: 'Compare budgets vs actual spending across departments and projects',
        category: 'Budget Management',
        type: 'budget_analysis',
        estimatedTime: '2-3 minutes',
        dataPoints: ['Budget allocations', 'Actual expenses', 'Variance analysis', 'Forecasting'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'expense_analysis',
        name: 'Expense Analysis Report',
        description: 'Detailed breakdown of expenses by category, department, and time period',
        category: 'Expense Management',
        type: 'expense_analysis',
        estimatedTime: '1-2 minutes',
        dataPoints: ['Expense categories', 'Department spending', 'Trend analysis', 'Top expenses'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cost_center_analysis',
        name: 'Cost Center Performance',
        description: 'Performance analysis of all cost centers including budget utilization',
        category: 'Cost Management',
        type: 'cost_center_analysis',
        estimatedTime: '3-4 minutes',
        dataPoints: ['Cost center budgets', 'Utilization rates', 'Performance metrics', 'Comparisons'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'profit_loss',
        name: 'Profit & Loss Statement',
        description: 'Comprehensive P&L statement with revenue, expenses, and net income',
        category: 'Financial Statements',
        type: 'profit_loss',
        estimatedTime: '4-5 minutes',
        dataPoints: ['Revenue streams', 'Operating expenses', 'Net income', 'Period comparisons'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cash_flow',
        name: 'Cash Flow Report',
        description: 'Cash flow analysis including operating, investing, and financing activities',
        category: 'Financial Statements',
        type: 'cash_flow',
        estimatedTime: '3-4 minutes',
        dataPoints: ['Cash inflows', 'Cash outflows', 'Net cash flow', 'Cash position'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'invoice_aging',
        name: 'Invoice Aging Report',
        description: 'Analysis of outstanding invoices and payment patterns',
        category: 'Accounts Receivable',
        type: 'invoice_aging',
        estimatedTime: '1-2 minutes',
        dataPoints: ['Outstanding invoices', 'Payment terms', 'Aging buckets', 'Collection metrics'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get quick financial insights for dashboard
   */
  static async getQuickInsights(
    workspaceIds: string[],
    period: string = 'current-month'
  ): Promise<QuickInsight[]> {
    try {
      // If no workspaces provided, return default insights
      if (!workspaceIds || workspaceIds.length === 0) {
        console.log('No workspaces provided, returning default insights');
        return this.getDefaultInsights();
      }

      const dateRange = this.getPeriodDateRange(period);
      
      // Get default currency for the primary workspace
      const defaultCurrency = await CurrencyService.getDefaultCurrency(workspaceIds[0]);
      
      // Fetch parallel data
      const [expenseData, budgetData, invoiceData] = await Promise.all([
        this.getExpenseInsights(workspaceIds, dateRange),
        this.getBudgetInsights(workspaceIds, dateRange),
        this.getInvoiceInsights(workspaceIds, dateRange)
      ]);

      return [
        {
          title: 'Budget Variance',
          value: this.formatCurrencyWithSymbol(budgetData.variance, defaultCurrency.symbol),
          change: budgetData.variancePercentage,
          trend: budgetData.variance > 0 ? 'up' : 'down',
          description: budgetData.variance > 0 ? 'Over budget this period' : 'Under budget this period',
          color: budgetData.variance > 0 ? 'text-red-600' : 'text-green-600',
          icon: 'TrendingUp'
        },
        {
          title: 'Total Expenses',
          value: this.formatCurrencyWithSymbol(expenseData.total, defaultCurrency.symbol),
          change: expenseData.changePercentage,
          trend: this.getTrend(expenseData.changePercentage),
          description: 'Compared to last period',
          color: this.getTrend(expenseData.changePercentage) === 'down' ? 'text-green-600' : 'text-red-600',
          icon: 'DollarSign'
        },
        {
          title: 'Outstanding Invoices',
          value: this.formatCurrencyWithSymbol(invoiceData.outstanding, defaultCurrency.symbol),
          change: invoiceData.changePercentage,
          trend: this.getTrend(invoiceData.changePercentage),
          description: 'Pending payment',
          color: 'text-blue-600',
          icon: 'FileText'
        },
        {
          title: 'Budget Utilization',
          value: `${budgetData.utilizationPercentage}%`,
          change: budgetData.utilizationChange,
          trend: this.getTrend(budgetData.utilizationChange),
          description: 'Of total budget',
          color: this.getUtilizationColor(budgetData.utilizationPercentage),
          icon: 'BarChart3'
        }
      ];
    } catch (error) {
      console.error('Error getting quick insights:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Generate a financial report
   */
  static async generateReport(
    templateId: string,
    workspaceIds: string[],
    filters: ReportFilters,
    options: ReportGenerationOptions,
    userId: string
  ): Promise<GeneratedReport> {
    try {
      const reportId = `report_${templateId}_${Date.now()}`;
      
      // Create initial report record
      const report: GeneratedReport = {
        id: reportId,
        name: `${templateId} - ${new Date().toLocaleDateString()}`,
        type: this.getReportTypeFromTemplate(templateId),
        workspaceId: workspaceIds[0], // Primary workspace
        filters,
        data: {},
        generatedBy: userId,
        generatedAt: new Date(),
        status: 'generating',
        progress: 0,
        fileSize: '0 KB'
      };

      // Save initial report
      await this.saveReport(report);

      // Generate report data based on template
      const reportData = await this.generateReportData(templateId, workspaceIds, filters);
      
      // Update report with data
      report.data = reportData;
      report.status = 'completed';
      report.progress = 100;
      report.fileSize = this.calculateFileSize(reportData);

      // Save final report
      await this.saveReport(report);

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Get a single financial report by ID
   */
  static async getReport(reportId: string): Promise<GeneratedReport | null> {
    try {
      const reportRef = doc(db, this.REPORTS_COLLECTION, reportId);
      const reportSnap = await getDoc(reportRef);
      
      if (reportSnap.exists()) {
        const data = reportSnap.data();
        return {
          id: reportSnap.id,
          ...data,
          generatedAt: data.generatedAt?.toDate() || new Date(),
          filters: {
            ...data.filters,
            dateRange: {
              start: data.filters?.dateRange?.start?.toDate() || new Date(),
              end: data.filters?.dateRange?.end?.toDate() || new Date()
            }
          }
        } as GeneratedReport;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting report:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive report content with real data
   */
  static async getReportContent(report: GeneratedReport): Promise<any> {
    try {
      const workspaceIds = [report.workspaceId];
      const { dateRange } = report.filters;
      
      // Fetch real data in parallel
      const [
        expenseInsights,
        budgetInsights,
        invoiceInsights,
        departmentData
      ] = await Promise.all([
        this.getExpenseInsights(workspaceIds, dateRange),
        this.getBudgetInsights(workspaceIds, dateRange),
        this.getInvoiceInsights(workspaceIds, dateRange),
        this.getDepartmentBreakdown(workspaceIds, dateRange)
      ]);

      return {
        summary: {
          totalBudget: Math.abs(budgetInsights.variance) + expenseInsights.total, // Estimate budget from variance
          totalSpent: expenseInsights.total,
          remainingBudget: Math.abs(budgetInsights.variance),
          utilizationPercentage: budgetInsights.utilizationPercentage,
          outstandingInvoices: invoiceInsights.outstanding,
          totalInvoices: invoiceInsights.outstanding // Use outstanding as total for now
        },
        expenses: expenseInsights,
        budgets: budgetInsights,
        invoices: invoiceInsights,
        departments: departmentData,
        insights: await this.generateDataInsights(expenseInsights, budgetInsights, invoiceInsights, departmentData),
        recommendations: await this.generateRecommendations(expenseInsights, budgetInsights, invoiceInsights, departmentData)
      };
    } catch (error) {
      console.error('Error getting report content:', error);
      throw error;
    }
  }

  /**
   * Get department breakdown with real data
   */
  private static async getDepartmentBreakdown(workspaceIds: string[], dateRange: { start: Date; end: Date }) {
    try {
      const departmentData = [];
      
      for (const workspaceId of workspaceIds) {
        // Get departments
        const departments = await DepartmentService.getWorkspaceDepartments(workspaceId);
        
        for (const dept of departments) {
                     // Get department expenses
           const expenses = await ExpenseManagementService.getWorkspaceExpenses(workspaceId, {
             dateRange,
             departmentId: dept.id
           });
           
           // Get department budget
           const budgets = await BudgetTrackingService.getWorkspaceBudgets(workspaceId, {
             entityId: dept.id,
             type: 'department'
           });
          
          const totalBudget = budgets.reduce((sum, budget) => sum + (budget.amount || 0), 0);
          const totalSpent = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
          
          departmentData.push({
            id: dept.id,
            name: dept.name,
            budget: totalBudget,
            spent: totalSpent,
            remaining: totalBudget - totalSpent,
            utilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
            expenseCount: expenses.length,
            budgetCount: budgets.length
          });
        }
      }
      
      return departmentData;
    } catch (error) {
      console.error('Error getting department breakdown:', error);
      return [];
    }
  }

  /**
   * Generate data-driven insights
   */
  private static async generateDataInsights(expenses: any, budgets: any, invoices: any, departments: any[]) {
    const insights = [];
    
    // Budget variance insights
    const overBudgetDepts = departments.filter(dept => dept.utilization > 100);
    if (overBudgetDepts.length > 0) {
      insights.push({
        title: 'Departments Over Budget',
        description: `${overBudgetDepts.length} department(s) have exceeded their allocated budget. ${overBudgetDepts.map(d => d.name).join(', ')} require immediate attention.`,
        impact: 'High',
        category: 'Budget Variance',
        recommendation: 'Review spending patterns and consider budget reallocation or expense reduction strategies.'
      });
    }
    
    // Expense trend insights
    const expenseChangePercent = parseFloat(expenses.changePercentage?.replace('%', '') || '0');
    if (expenseChangePercent > 20) {
      insights.push({
        title: 'Significant Expense Increase',
        description: `Expenses have increased by ${expenses.changePercentage} compared to the previous period. This represents a notable change in spending patterns.`,
        impact: 'Medium',
        category: 'Expense Trend',
        recommendation: 'Analyze the drivers of increased spending and implement cost control measures where appropriate.'
      });
    }
    
    // Outstanding invoices
    if (invoices.outstanding > 0) {
      insights.push({
        title: 'Outstanding Invoices',
        description: `There are ${invoices.outstanding} outstanding invoices that require attention for payment processing.`,
        impact: 'Medium',
        category: 'Cash Flow',
        recommendation: 'Review and process outstanding invoices to maintain healthy cash flow.'
      });
    }
    
    return insights;
  }

  /**
   * Generate actionable recommendations
   */
  private static async generateRecommendations(expenses: any, budgets: any, invoices: any, departments: any[]) {
    const recommendations = [];
    
    // High priority recommendations
    const highUtilizationDepts = departments.filter(dept => dept.utilization > 80);
    if (highUtilizationDepts.length > 0) {
      recommendations.push({
        priority: 'High',
        title: 'Monitor High-Utilization Departments',
        description: `${highUtilizationDepts.length} department(s) are approaching budget limits. Implement closer monitoring and approval processes.`,
        expectedImpact: 'Prevent budget overruns and improve cost control',
        timeline: '1-2 weeks',
        owner: 'Finance Team',
        category: 'Budget Management'
      });
    }
    
    // Medium priority recommendations
    if (expenses.total > budgets.total * 0.7) {
      recommendations.push({
        priority: 'Medium',
        title: 'Implement Expense Approval Workflow',
        description: 'Current spending is at 70%+ of budget. Implement stricter approval workflows for non-essential expenses.',
        expectedImpact: '10-15% reduction in discretionary spending',
        timeline: '2-3 weeks',
        owner: 'Operations Team',
        category: 'Process Improvement'
      });
    }
    
    // Low priority recommendations
    recommendations.push({
      priority: 'Low',
      title: 'Regular Financial Reviews',
      description: 'Establish monthly financial review meetings to discuss performance and adjust strategies proactively.',
      expectedImpact: 'Improved financial visibility and control',
      timeline: 'Ongoing',
      owner: 'Finance Team',
      category: 'Governance'
    });
    
    return recommendations;
  }

  /**
   * Get report history for a workspace
   */
  static async getReportHistory(
    workspaceIds: string[],
    maxLimit: number = 20
  ): Promise<GeneratedReport[]> {
    try {
      const reportsRef = collection(db, this.REPORTS_COLLECTION);
      const q = query(
        reportsRef,
        where('workspaceId', 'in', workspaceIds.slice(0, 10)), // Firestore limit
        orderBy('generatedAt', 'desc'),
        limit(50) // Fixed limit
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        generatedAt: doc.data().generatedAt?.toDate() || new Date(),
        filters: {
          ...doc.data().filters,
          dateRange: {
            start: doc.data().filters?.dateRange?.start?.toDate() || new Date(),
            end: doc.data().filters?.dateRange?.end?.toDate() || new Date()
          }
        }
      })) as GeneratedReport[];
    } catch (error) {
      console.error('Error fetching report history:', error);
      return [];
    }
  }

  /**
   * Get expense analytics for insights
   */
  private static async getExpenseInsights(
    workspaceIds: string[],
    dateRange: { start: Date; end: Date }
  ) {
    try {
      let totalExpenses = 0;
      let previousPeriodExpenses = 0;
      
      for (const workspaceId of workspaceIds) {
        const currentExpenses = await ExpenseManagementService.getWorkspaceExpenses(
          workspaceId,
          {
            dateRange: {
              start: dateRange.start,
              end: dateRange.end
            }
          }
        );
        
        const previousStart = new Date(dateRange.start);
        previousStart.setDate(previousStart.getDate() - Math.round((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)));
        
        const previousExpenses = await ExpenseManagementService.getWorkspaceExpenses(
          workspaceId,
          {
            dateRange: {
              start: previousStart,
              end: dateRange.start
            }
          }
        );

        totalExpenses += currentExpenses.reduce((sum: number, exp: Expense) => sum + (exp.amount || 0), 0);
        previousPeriodExpenses += previousExpenses.reduce((sum: number, exp: Expense) => sum + (exp.amount || 0), 0);
      }

      const changePercentage = previousPeriodExpenses > 0 
        ? ((totalExpenses - previousPeriodExpenses) / previousPeriodExpenses * 100).toFixed(1) + '%'
        : '0%';

      return {
        total: totalExpenses,
        changePercentage,
        previous: previousPeriodExpenses
      };
    } catch (error) {
      console.error('Error getting expense insights:', error);
      return { total: 0, changePercentage: '0%', previous: 0 };
    }
  }

  /**
   * Get budget analytics for insights
   */
  private static async getBudgetInsights(
    workspaceIds: string[],
    dateRange: { start: Date; end: Date }
  ) {
    try {
      let totalBudget = 0;
      let totalSpent = 0;
      let totalVariance = 0;

      for (const workspaceId of workspaceIds) {
        const analytics = await BudgetTrackingService.getBudgetAnalyticsForWorkspaces([workspaceId]);
        totalBudget += analytics.totalBudget || 0;
        totalSpent += analytics.totalSpent || 0;
      }

      totalVariance = totalSpent - totalBudget;
      const variancePercentage = totalBudget > 0 
        ? ((totalVariance / totalBudget) * 100).toFixed(1) + '%'
        : '0%';
      
      const utilizationPercentage = totalBudget > 0 
        ? Math.round((totalSpent / totalBudget) * 100)
        : 0;

      return {
        variance: totalVariance,
        variancePercentage,
        utilizationPercentage,
        utilizationChange: '+2.3%' // TODO: Calculate actual change
      };
    } catch (error) {
      console.error('Error getting budget insights:', error);
      return { 
        variance: 0, 
        variancePercentage: '0%', 
        utilizationPercentage: 0,
        utilizationChange: '0%'
      };
    }
  }

  /**
   * Get invoice analytics for insights
   */
  private static async getInvoiceInsights(
    workspaceIds: string[],
    dateRange: { start: Date; end: Date }
  ) {
    try {
      let totalOutstanding = 0;
      
      for (const workspaceId of workspaceIds) {
        const invoices = await InvoiceService.getWorkspaceInvoices(workspaceId);
        const outstanding = invoices
          .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
          .reduce((sum, inv) => sum + (inv.total || 0), 0);
        
        totalOutstanding += outstanding;
      }

      return {
        outstanding: totalOutstanding,
        changePercentage: '+5.2%' // TODO: Calculate actual change
      };
    } catch (error) {
      console.error('Error getting invoice insights:', error);
      return { outstanding: 0, changePercentage: '0%' };
    }
  }

  /**
   * Generate report data based on template type
   */
  private static async generateReportData(
    templateId: string,
    workspaceIds: string[],
    filters: ReportFilters
  ): Promise<any> {
    switch (templateId) {
      case 'expense_analysis':
        return this.generateExpenseAnalysis(workspaceIds, filters);
      case 'budget_analysis':
        return this.generateBudgetAnalysis(workspaceIds, filters);
      case 'cost_center_analysis':
        return this.generateCostCenterAnalysis(workspaceIds, filters);
      case 'profit_loss':
        return this.generateProfitLossStatement(workspaceIds, filters);
      case 'cash_flow':
        return this.generateCashFlowReport(workspaceIds, filters);
      case 'invoice_aging':
        return this.generateInvoiceAgingReport(workspaceIds, filters);
      default:
        throw new Error(`Unknown template: ${templateId}`);
    }
  }

  private static async generateExpenseAnalysis(workspaceIds: string[], filters: ReportFilters) {
    // Implementation for expense analysis
    const expenses: Expense[] = [];
    
    for (const workspaceId of workspaceIds) {
      const workspaceExpenses = await ExpenseManagementService.getWorkspaceExpenses(
        workspaceId,
        {
          dateRange: filters.dateRange
        }
      );
      expenses.push(...workspaceExpenses);
    }

    return {
      summary: {
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
        averageExpense: expenses.length > 0 ? expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0) / expenses.length : 0
      },
      byCategory: this.groupExpensesByCategory(expenses),
      byDepartment: this.groupExpensesByDepartment(expenses),
      trends: this.calculateExpenseTrends(expenses),
      expenses: expenses.slice(0, 100) // Limit for performance
    };
  }

  private static async generateBudgetAnalysis(workspaceIds: string[], filters: ReportFilters) {
    const analytics = await BudgetTrackingService.getBudgetAnalyticsForWorkspaces(workspaceIds);
    return analytics;
  }

  private static async generateCostCenterAnalysis(workspaceIds: string[], filters: ReportFilters) {
    const costCenters: CostCenter[] = [];
    
    for (const workspaceId of workspaceIds) {
      const workspaceCostCenters = await BudgetTrackingService.getWorkspaceCostCenters(workspaceId);
      costCenters.push(...workspaceCostCenters);
    }

    return {
      summary: {
        totalCostCenters: costCenters.length,
        activeCostCenters: costCenters.filter(cc => cc.isActive).length,
        totalBudget: costCenters.reduce((sum, cc) => sum + (cc.budget || 0), 0)
      },
      costCenters: costCenters,
      performance: await this.calculateCostCenterPerformance(costCenters)
    };
  }

  private static async generateProfitLossStatement(workspaceIds: string[], filters: ReportFilters) {
    // Implementation for P&L statement
    return {
      revenue: 0, // TODO: Implement revenue calculation
      expenses: 0, // TODO: Calculate total expenses
      netIncome: 0, // Revenue - Expenses
      period: filters.dateRange
    };
  }

  private static async generateCashFlowReport(workspaceIds: string[], filters: ReportFilters) {
    // Implementation for cash flow report
    return {
      operatingCashFlow: 0,
      investingCashFlow: 0,
      financingCashFlow: 0,
      netCashFlow: 0,
      period: filters.dateRange
    };
  }

  private static async generateInvoiceAgingReport(workspaceIds: string[], filters: ReportFilters) {
    const invoices: Invoice[] = [];
    
    for (const workspaceId of workspaceIds) {
      const workspaceInvoices = await InvoiceService.getWorkspaceInvoices(workspaceId);
      invoices.push(...workspaceInvoices);
    }

    return {
      summary: {
        totalInvoices: invoices.length,
        totalOutstanding: invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0),
        overdueinvoices: invoices.filter(inv => inv.status === 'overdue').length
      },
      agingBuckets: this.calculateAgingBuckets(invoices),
      invoices: invoices
    };
  }

  // Helper methods
  private static getPeriodDateRange(period: string): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'current-month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'last-month':
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        now.setDate(0); // Last day of previous month
        break;
      case 'current-quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        start.setMonth(quarterStart);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'current-year':
        start.setMonth(0);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    }
    
    return { start, end: now };
  }

  private static formatCurrencyWithSymbol(amount: number, symbol: string = '₵'): string {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    
    return `${symbol}${formattedAmount}`;
  }

  private static getTrend(changePercentage: string): 'up' | 'down' | 'stable' {
    const value = parseFloat(changePercentage.replace('%', ''));
    if (value > 0.5) return 'up';
    if (value < -0.5) return 'down';
    return 'stable';
  }

  private static getUtilizationColor(percentage: number): string {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  }

  private static getReportTypeFromTemplate(templateId: string): FinancialReport['type'] {
    const mapping: { [key: string]: FinancialReport['type'] } = {
      'expense_analysis': 'expense',
      'budget_analysis': 'budget',
      'cost_center_analysis': 'budget',
      'profit_loss': 'profit_loss',
      'cash_flow': 'cash_flow',
      'invoice_aging': 'invoice'
    };
    return mapping[templateId] || 'expense';
  }

  private static calculateFileSize(data: any): string {
    const jsonString = JSON.stringify(data);
    const bytes = new Blob([jsonString]).size;
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private static async saveReport(report: GeneratedReport): Promise<void> {
    const reportRef = doc(db, this.REPORTS_COLLECTION, report.id);
    
    // Clean filters to remove undefined values (Firestore doesn't allow them)
    const cleanFilters: any = {
      dateRange: {
        start: Timestamp.fromDate(report.filters.dateRange.start),
        end: Timestamp.fromDate(report.filters.dateRange.end)
      }
    };
    
    // Only add non-undefined filter fields
    if (report.filters.workspaces && report.filters.workspaces.length > 0) {
      cleanFilters.workspaces = report.filters.workspaces;
    }
    if (report.filters.departments && report.filters.departments.length > 0) {
      cleanFilters.departments = report.filters.departments;
    }
    if (report.filters.costCenters && report.filters.costCenters.length > 0) {
      cleanFilters.costCenters = report.filters.costCenters;
    }
    if (report.filters.projects && report.filters.projects.length > 0) {
      cleanFilters.projects = report.filters.projects;
    }
    if (report.filters.categories && report.filters.categories.length > 0) {
      cleanFilters.categories = report.filters.categories;
    }
    if (report.filters.currency) {
      cleanFilters.currency = report.filters.currency;
    }
    if (report.filters.status && report.filters.status.length > 0) {
      cleanFilters.status = report.filters.status;
    }

    await setDoc(reportRef, {
      ...report,
      generatedAt: Timestamp.fromDate(report.generatedAt),
      filters: cleanFilters
    });
  }

  private static groupExpensesByCategory(expenses: Expense[]): { [category: string]: number } {
    return expenses.reduce((acc, expense) => {
      const category = expense.category?.name || 'Uncategorized';
      acc[category] = (acc[category] || 0) + (expense.amount || 0);
      return acc;
    }, {} as { [category: string]: number });
  }

  private static groupExpensesByDepartment(expenses: Expense[]): { [department: string]: number } {
    return expenses.reduce((acc, expense) => {
      const department = expense.departmentId || 'Unassigned';
      acc[department] = (acc[department] || 0) + (expense.amount || 0);
      return acc;
    }, {} as { [department: string]: number });
  }

  private static calculateExpenseTrends(expenses: Expense[]): any[] {
    // Simple monthly trend calculation
    const monthlyData: { [month: string]: number } = {};
    
    expenses.forEach(expense => {
      const month = new Date(expense.expenseDate).toISOString().substring(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + (expense.amount || 0);
    });

    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount
    }));
  }

  private static async calculateCostCenterPerformance(costCenters: CostCenter[]): Promise<any[]> {
    return costCenters.map(cc => ({
      id: cc.id,
      name: cc.name,
      budget: cc.budget || 0,
      spent: 0, // TODO: Calculate actual spending
      utilization: 0, // TODO: Calculate utilization
      variance: 0 // TODO: Calculate variance
    }));
  }

  private static calculateAgingBuckets(invoices: Invoice[]): any {
    const now = new Date();
    const buckets = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0
    };

    invoices.forEach(invoice => {
      if (invoice.status === 'paid') return;
      
      const daysPastDue = Math.floor((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysPastDue <= 0) buckets.current += invoice.total;
      else if (daysPastDue <= 30) buckets['1-30'] += invoice.total;
      else if (daysPastDue <= 60) buckets['31-60'] += invoice.total;
      else if (daysPastDue <= 90) buckets['61-90'] += invoice.total;
      else buckets['90+'] += invoice.total;
    });

    return buckets;
  }

  private static getDefaultInsights(): QuickInsight[] {
    return [
      {
        title: 'Budget Variance',
        value: '₵0',
        change: '0%',
        trend: 'stable',
        description: 'No data available',
        color: 'text-muted-foreground',
        icon: 'TrendingUp'
      },
      {
        title: 'Total Expenses',
        value: '₵0',
        change: '0%',
        trend: 'stable',
        description: 'No data available',
        color: 'text-muted-foreground',
        icon: 'DollarSign'
      },
      {
        title: 'Outstanding Invoices',
        value: '₵0',
        change: '0%',
        trend: 'stable',
        description: 'No data available',
        color: 'text-muted-foreground',
        icon: 'FileText'
      },
      {
        title: 'Budget Utilization',
        value: '0%',
        change: '0%',
        trend: 'stable',
        description: 'No data available',
        color: 'text-muted-foreground',
        icon: 'BarChart3'
      }
    ];
  }
} 