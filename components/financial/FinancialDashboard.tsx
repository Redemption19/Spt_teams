'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  PieChart,
  BarChart3,
  Calendar,
  Settings,
  ChevronDown,
  Receipt,
  Building,
  Users,
  Target,
  Coins,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  Zap,
  Activity,
  Shield,
  Wallet
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useFinancialPermissions } from '@/hooks/use-financial-permissions';
import { ExpenseManagementService } from '@/lib/expense-management-service';
import { BudgetTrackingService } from '@/lib/budget-tracking-service';
import { InvoiceService } from '@/lib/invoice-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { DepartmentService } from '@/lib/department-service';

interface FinancialOverview {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  monthlyBurn: number;
  projectedOverrun: number;
  utilizationRate: number;
  previousMonthSpent: number;
  spendingTrend: number;
  burnRate: number;
  utilizationPercentage: number;
}

interface ExpenseAnalytics {
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
  totalAmount: number;
  previousMonthAmount: number;
  changePercentage: number;
  trend: number;
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
}

interface InvoiceAnalytics {
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalAmount: number;
  avgPaymentTime: number;
  previousMonthAmount: number;
  changePercentage: number;
  trend: number;
}

interface BudgetSummary {
  id: string;
  name: string;
  type: string;
  amount: number;
  spent: number;
  remaining: number;
  utilizationRate: number;
  status: 'on-track' | 'warning' | 'critical' | 'over-budget';
  entityName?: string;
  departmentName?: string;
}

interface FinancialAlert {
  id: string;
  type: 'budget_warning' | 'budget_critical' | 'invoice_overdue' | 'expense_pending' | 'cash_flow';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp?: Date;
  createdAt: Date;
  entityId?: string;
  entityName?: string;
  amount?: number;
}

interface FinancialData {
  overview: FinancialOverview;
  expenses: ExpenseAnalytics;
  invoices: InvoiceAnalytics;
  budgets: BudgetSummary[];
  alerts: FinancialAlert[];
  lastUpdated: Date;
}

export default function FinancialDashboard() {
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { formatAmount, defaultCurrency } = useCurrency();
  const financialPermissions = useFinancialPermissions();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Determine workspace IDs to fetch data from
  const workspaceIds = useMemo(() => {
    const isOwner = userProfile?.role === 'owner';
    if (isOwner && accessibleWorkspaces.length > 0) {
      return accessibleWorkspaces.map(ws => ws.id);
    }
    return currentWorkspace?.id ? [currentWorkspace.id] : [];
  }, [userProfile?.role, accessibleWorkspaces, currentWorkspace?.id]);

  const processFinancialData = useCallback(async (data: any): Promise<FinancialData> => {
    const {
      allExpenses = [],
      previousMonthExpenses = [],
      allBudgets = [],
      allInvoices = [],
      previousMonthInvoices = [],
      budgetAnalytics = {},
      workspaceIds = []
    } = data;

    // Get default currency symbol
    const currencySymbol = defaultCurrency?.symbol || '₵';

    // Calculate overview metrics
    const totalBudget = allBudgets.reduce((sum: number, budget: any) => sum + (budget.amount || 0), 0);
    const totalSpent = allExpenses.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0);
    const totalRemaining = totalBudget - totalSpent;
    const burnRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const utilizationPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // Expense analytics
    const pendingExpenses = allExpenses.filter((exp: any) => exp.status === 'pending').length;
    const approvedExpenses = allExpenses.filter((exp: any) => exp.status === 'approved').length;
    const rejectedExpenses = allExpenses.filter((exp: any) => exp.status === 'rejected').length;
    const totalExpenseAmount = allExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);

    // Calculate expense trend
    const previousMonthTotal = previousMonthExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    const expenseTrend = previousMonthTotal > 0 
      ? Math.round(((totalExpenseAmount - previousMonthTotal) / previousMonthTotal) * 100)
      : 0;

    // Top expense categories - Fixed category name extraction
    const expensesByCategory = allExpenses.reduce((acc: Record<string, number>, exp: any) => {
      let categoryName: string;
      
      if (typeof exp.category === 'string') {
        categoryName = exp.category;
      } else if (exp.category && typeof exp.category === 'object') {
        if (exp.category.name) {
          categoryName = exp.category.name;
        } else if (exp.category.id) {
          categoryName = exp.category.id;
        } else {
          categoryName = String(exp.category);
        }
      } else {
        categoryName = 'Other';
      }
      
      acc[categoryName] = (acc[categoryName] || 0) + (exp.amount || 0);
      return acc;
    }, {});

    const topExpenseCategories = Object.entries(expensesByCategory)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([name, amount]) => ({ 
        name, 
        amount: amount as number,
        percentage: totalExpenseAmount > 0 ? Math.round(((amount as number) / totalExpenseAmount) * 100) : 0,
        count: allExpenses.filter((exp: any) => {
          let categoryName: string;
          if (typeof exp.category === 'string') {
            categoryName = exp.category;
          } else if (exp.category && typeof exp.category === 'object') {
            if (exp.category.name) {
              categoryName = exp.category.name;
            } else if (exp.category.id) {
              categoryName = exp.category.id;
            } else {
              categoryName = String(exp.category);
            }
          } else {
            categoryName = 'Other';
          }
          return categoryName === name;
        }).length
      }));

    // Invoice analytics
    const draftInvoices = allInvoices.filter((inv: any) => inv.status === 'draft').length;
    const sentInvoices = allInvoices.filter((inv: any) => inv.status === 'sent').length;
    const paidInvoices = allInvoices.filter((inv: any) => inv.status === 'paid').length;
    const overdueInvoices = allInvoices.filter((inv: any) => inv.status === 'overdue').length;
    const totalInvoiceAmount = allInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

    // Calculate invoice trend
    const previousMonthInvoiceTotal = previousMonthInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
    const invoiceTrend = previousMonthInvoiceTotal > 0 
      ? Math.round(((totalInvoiceAmount - previousMonthInvoiceTotal) / previousMonthInvoiceTotal) * 100)
      : 0;

    // Calculate average payment time (simplified)
    const paidInvoicesWithDates = allInvoices.filter((inv: any) => inv.status === 'paid' && inv.paidAt && inv.sentAt);
    const avgPaymentTime = paidInvoicesWithDates.length > 0
      ? Math.round(paidInvoicesWithDates.reduce((sum: number, inv: any) => {
          const sentDate = inv.sentAt instanceof Date ? inv.sentAt : new Date(inv.sentAt);
          const paidDate = inv.paidAt instanceof Date ? inv.paidAt : new Date(inv.paidAt);
          return sum + Math.round((paidDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / paidInvoicesWithDates.length)
      : 0;

    // Budget summaries
    const budgetSummaries = allBudgets.map((budget: {
      id: string;
      name?: string;
      department?: string;
      amount: number;
      period?: string;
    }) => {
      const spent = allExpenses
        .filter((exp: any) => exp.budgetId === budget.id || exp.department === budget.department)
        .reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
      
      const remaining = budget.amount - spent;
      const utilizationPercentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
      
      let status: 'on-track' | 'warning' | 'over-budget' = 'on-track';
      if (utilizationPercentage > 100) {
        status = 'over-budget';
      } else if (utilizationPercentage > 80) {
        status = 'warning';
      }

      return {
        id: budget.id,
        name: budget.name || budget.department || 'Unnamed Budget',
        allocated: budget.amount,
        spent,
        remaining,
        utilizationPercentage,
        status,
        period: budget.period || 'monthly'
      };
    });

    // Generate alerts
    const alerts: FinancialAlert[] = [];

    // Budget alerts
    budgetSummaries.forEach((budget: BudgetSummary) => {
      if (budget.status === 'over-budget') {
        alerts.push({
          id: `budget-over-${budget.id}`,
          type: 'budget_critical',
          title: 'Budget Exceeded',
          message: `${budget.name} has exceeded its budget by ${Math.abs(budget.remaining)}`,
          severity: 'critical',
          createdAt: new Date()
        });
      } else if (budget.status === 'warning') {
        alerts.push({
          id: `budget-warn-${budget.id}`,
          type: 'budget_warning',
          title: 'Budget Warning',
          message: `${budget.name} has used ${budget.utilizationRate}% of its budget`,
          severity: 'warning',
          createdAt: new Date()
        });
      }
    });

    // Expense alerts
    if (pendingExpenses > 10) {
      alerts.push({
        id: 'pending-expenses',
        type: 'expense_pending',
        title: 'Pending Expenses',
        message: `${pendingExpenses} expenses are awaiting approval`,
        severity: 'warning',
        createdAt: new Date()
      });
    }

    // Invoice alerts
    if (overdueInvoices > 0) {
      alerts.push({
        id: 'overdue-invoices',
        type: 'invoice_overdue',
        title: 'Overdue Invoices',
        message: `${overdueInvoices} invoices are overdue`,
        severity: 'critical',
        createdAt: new Date()
      });
    }

    return {
      overview: {
        totalBudget,
        totalSpent,
        totalRemaining,
        monthlyBurn: burnRate,
        projectedOverrun: totalRemaining < 0 ? Math.abs(totalRemaining) : 0,
        utilizationRate: utilizationPercentage,
        previousMonthSpent: previousMonthTotal,
        spendingTrend: expenseTrend,
        burnRate,
        utilizationPercentage
      },
      expenses: {
        pending: pendingExpenses,
        approved: approvedExpenses,
        rejected: rejectedExpenses,
        draft: 0,
        totalAmount: totalExpenseAmount,
        previousMonthAmount: previousMonthTotal,
        changePercentage: expenseTrend,
        trend: expenseTrend,
        topCategories: topExpenseCategories
      },
      invoices: {
        draft: draftInvoices,
        sent: sentInvoices,
        paid: paidInvoices,
        overdue: overdueInvoices,
        totalAmount: totalInvoiceAmount,
        avgPaymentTime,
        previousMonthAmount: previousMonthInvoiceTotal,
        changePercentage: invoiceTrend,
        trend: invoiceTrend
      },
      budgets: budgetSummaries,
      alerts,
      lastUpdated: new Date()
    };
  }, [defaultCurrency]);

  const loadFinancialData = useCallback(async () => {
    if (!workspaceIds.length) return;

    try {
      setLoading(true);
      setError(null);

      const dateRange = {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date()
      };

      const previousMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
      const previousMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);

      // Fetch all data in parallel
      const [
        allExpenses,
        previousMonthExpenses,
        allBudgets,
        allInvoices,
        previousMonthInvoices,
        budgetAnalytics
      ] = await Promise.all([
        // Current month expenses
        Promise.all(workspaceIds.map(id => 
          ExpenseManagementService.getWorkspaceExpenses(id, { dateRange })
        )).then(results => results.flat()),
        
        // Previous month expenses for trend calculation
        Promise.all(workspaceIds.map(id => 
          ExpenseManagementService.getWorkspaceExpenses(id, { 
            dateRange: { start: previousMonthStart, end: previousMonthEnd }
          })
        )).then(results => results.flat()),
        
        // All budgets
        Promise.all(workspaceIds.map(id => 
          BudgetTrackingService.getWorkspaceBudgets(id)
        )).then(results => results.flat()),
        
        // Current month invoices
        Promise.all(workspaceIds.map(id => 
          InvoiceService.getWorkspaceInvoices(id, { 
            startDate: dateRange.start,
            endDate: dateRange.end
          })
        )).then(results => results.flat()),
        
        // Previous month invoices
        Promise.all(workspaceIds.map(id => 
          InvoiceService.getWorkspaceInvoices(id, { 
            startDate: previousMonthStart,
            endDate: previousMonthEnd
          })
        )).then(results => results.flat()),
        
        // Budget analytics
        BudgetTrackingService.getBudgetAnalyticsForWorkspaces(workspaceIds)
      ]);

      // Process the data
      const processedData = await processFinancialData({
        allExpenses,
        previousMonthExpenses,
        allBudgets,
        allInvoices,
        previousMonthInvoices,
        budgetAnalytics,
        workspaceIds
      });

      setFinancialData(processedData);
    } catch (err) {
      console.error('Error loading financial data:', err);
      setError('Failed to load financial data. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceIds, toast, processFinancialData]);

  useEffect(() => {
    if (workspaceIds.length > 0) {
      loadFinancialData();
    }
  }, [loadFinancialData, workspaceIds]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadFinancialData();
  }, [loadFinancialData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      case 'over-budget': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'on-track': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      case 'over-budget': return 'destructive';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    if (trend < -5) return <ArrowDownRight className="w-4 h-4 text-green-500" />;
    return <TrendingUp className="w-4 h-4 text-gray-500" />;
  };

  const formatTrend = (trend: number) => {
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)}%`;
  };

  // Show loading state when either permissions or data are loading
  if (financialPermissions.loading || (loading && !financialData)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="card-enhanced">
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Check permissions after loading is complete
  if (!financialPermissions.canViewOverview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Financial Management</h1>
        </div>
        <Card className="card-enhanced">
          <CardContent className="text-center py-12">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              You don&apos;t have permission to view the financial overview. Please contact your administrator.
            </p>
            <Badge variant="destructive">
              Requires: View Financial Overview
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !financialData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Financial Management</h1>
        </div>
        <Card className="card-enhanced">
          <CardContent className="text-center py-12">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Financial Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => loadFinancialData()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">Financial Management</h1>
              {workspaceIds.length > 1 && (
                <Badge variant="outline" className="flex items-center gap-1 border-primary text-primary hover:bg-primary/10 whitespace-nowrap px-2 py-1 text-xs sm:px-3 sm:text-sm w-fit">
                  <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                  {workspaceIds.length} Workspaces
                </Badge>
              )}
            </div>
            <div className="text-sm sm:text-base text-muted-foreground">
              <p className="mb-1 sm:mb-0">Track expenses, manage budgets, and monitor financial performance</p>
              {workspaceIds.length > 1 && (
                <p className="text-xs sm:text-sm text-primary/80">
                  • Viewing aggregated data from {workspaceIds.length} workspaces
                </p>
              )}
              {financialData.lastUpdated && (
                <p className="text-xs sm:text-sm text-muted-foreground/80">
                  • Last updated: {financialData.lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons - Mobile Responsive */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Primary Actions Row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Refresh Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="min-h-[40px] sm:min-h-[36px] w-full sm:w-auto justify-center sm:justify-start"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button className="bg-primary hover:bg-primary/90 min-h-[40px] sm:min-h-[36px] w-full sm:w-auto justify-center sm:justify-start" asChild>
              <Link href="/dashboard/financial/reports">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Link>
            </Button>
          </div>
          
          {/* Quick Access Navigation - Responsive Grid */}
          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
            {financialPermissions.canViewExpenses && (
              <Button variant="outline" size="sm" asChild className="min-h-[40px] sm:min-h-[36px] justify-center sm:justify-start">
                <Link href="/dashboard/financial/expenses">
                  <Receipt className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Expenses</span>
                </Link>
              </Button>
            )}
            {financialPermissions.canViewInvoices && (
              <Button variant="outline" size="sm" asChild className="min-h-[40px] sm:min-h-[36px] justify-center sm:justify-start">
                <Link href="/dashboard/financial/invoices">
                  <FileText className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Invoices</span>
                </Link>
              </Button>
            )}
            {financialPermissions.canViewBudgets && (
              <Button variant="outline" size="sm" asChild className="min-h-[40px] sm:min-h-[36px] justify-center sm:justify-start">
                <Link href="/dashboard/financial/budgets">
                  <Target className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Budgets</span>
                </Link>
              </Button>
            )}
            
            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-h-[40px] sm:min-h-[36px] justify-center sm:justify-start">
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                  <ChevronDown className="w-4 h-4 ml-0 sm:ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Financial Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {financialPermissions.canManageCurrencySettings && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/financial/currency">
                      <Coins className="w-4 h-4 mr-2" />
                      Currency Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                {financialPermissions.canViewCostCenters && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/financial/cost-centers">
                      <Building className="w-4 h-4 mr-2" />
                      Cost Centers
                    </Link>
                  </DropdownMenuItem>
                )}
                {financialPermissions.canManageFinancialSettings && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/financial/billing">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Billing Management
                    </Link>
                  </DropdownMenuItem>
                )}
                {financialPermissions.canViewFinancialReports && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/financial/reports">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Financial Reports
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Workspace Breakdown - Only show when viewing multiple workspaces */}
      {workspaceIds.length > 1 && (
        <Card className="card-enhanced">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Building className="w-4 h-4 sm:w-5 sm:h-5" />
              Workspace Breakdown
            </CardTitle>
            <CardDescription className="text-sm">
              Data aggregated from {workspaceIds.length} workspaces
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {accessibleWorkspaces
                .filter(ws => workspaceIds.includes(ws.id))
                .map((workspace) => (
                  <div key={workspace.id} className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{workspace.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {workspace.type || 'Workspace'}
                      </p>
                    </div>
                    {workspace.id === currentWorkspace?.id && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        Current
                      </Badge>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stats-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base font-medium truncate">Total Budget</CardTitle>
            <div className="flex items-center gap-1 flex-shrink-0">
              {workspaceIds.length > 1 && (
                <Badge variant="outline" className="text-xs h-4 sm:h-5 px-1 sm:px-1.5 hidden sm:flex">
                  {workspaceIds.length} WS
                </Badge>
              )}
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
              {formatAmount(financialData.overview.totalBudget)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              <p className="truncate">{financialData.overview.utilizationRate}% utilized</p>
              {workspaceIds.length > 1 && (
                <p className="text-xs text-primary/70 truncate sm:hidden">Cross-workspace</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base font-medium truncate">Total Spent</CardTitle>
            <div className="flex items-center gap-1 flex-shrink-0">
              {workspaceIds.length > 1 && (
                <Badge variant="outline" className="text-xs h-4 sm:h-5 px-1 sm:px-1.5 hidden sm:flex">
                  {workspaceIds.length} WS
                </Badge>
              )}
              {getTrendIcon(financialData.overview.spendingTrend)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
              {formatAmount(financialData.overview.totalSpent)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              <p className="truncate">{formatTrend(financialData.overview.spendingTrend)} from last month</p>
              {workspaceIds.length > 1 && (
                <p className="text-xs text-primary/70 truncate sm:hidden">Cross-workspace</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base font-medium truncate">Remaining Budget</CardTitle>
            <div className="flex items-center gap-1 flex-shrink-0">
              {workspaceIds.length > 1 && (
                <Badge variant="outline" className="text-xs h-4 sm:h-5 px-1 sm:px-1.5 hidden sm:flex">
                  {workspaceIds.length} WS
                </Badge>
              )}
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
              {formatAmount(financialData.overview.totalRemaining)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              <p className="truncate">
                {financialData.overview.monthlyBurn > 0 
                  ? `${Math.round(financialData.overview.totalRemaining / financialData.overview.monthlyBurn)} months remaining`
                  : 'No spending this month'
                }
              </p>
              {workspaceIds.length > 1 && (
                <p className="text-xs text-primary/70 truncate sm:hidden">Cross-workspace</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base font-medium truncate">Pending Expenses</CardTitle>
            <div className="flex items-center gap-1 flex-shrink-0">
              {workspaceIds.length > 1 && (
                <Badge variant="outline" className="text-xs h-4 sm:h-5 px-1 sm:px-1.5 hidden sm:flex">
                  {workspaceIds.length} WS
                </Badge>
              )}
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{financialData.expenses.pending}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              <p className="truncate">{formatAmount(financialData.expenses.totalAmount)} total this month</p>
              {workspaceIds.length > 1 && (
                <p className="text-xs text-primary/70 truncate sm:hidden">Cross-workspace</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-10 sm:h-12 items-center justify-start sm:justify-center rounded-md bg-muted p-1 text-muted-foreground min-w-max">
              <TabsTrigger value="overview" className="text-sm sm:text-base px-3 sm:px-4 py-2">Overview</TabsTrigger>
              {financialPermissions.canViewBudgets && (
                <TabsTrigger value="budgets" className="text-sm sm:text-base px-3 sm:px-4 py-2">Budgets</TabsTrigger>
              )}
              {financialPermissions.canViewExpenses && (
                <TabsTrigger value="expenses" className="text-sm sm:text-base px-3 sm:px-4 py-2">Expenses</TabsTrigger>
              )}
              {financialPermissions.canViewInvoices && (
                <TabsTrigger value="invoices" className="text-sm sm:text-base px-3 sm:px-4 py-2">Invoices</TabsTrigger>
              )}
              {financialPermissions.canViewFinancialAnalytics && (
                <TabsTrigger value="analytics" className="text-sm sm:text-base px-3 sm:px-4 py-2">Analytics</TabsTrigger>
              )}
            </TabsList>
          </div>
          
          {/* Cross-workspace indicator */}
          {workspaceIds.length > 1 && (
            <div className="flex items-center gap-2 justify-center sm:justify-end">
              <Badge variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1">
                <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{workspaceIds.length} Workspaces</span>
                <span className="sm:hidden">{workspaceIds.length} WS</span>
              </Badge>
            </div>
          )}
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Budget Utilization */}
            <Card className="card-enhanced">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Budget Utilization
                </CardTitle>
                <CardDescription className="text-sm">Current spending across all budgets</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-medium">Overall Progress</span>
                    <span className="text-sm sm:text-base text-muted-foreground font-medium">
                      {financialData.overview.utilizationRate}%
                    </span>
                  </div>
                  <Progress 
                    value={financialData.overview.utilizationRate} 
                    className="h-3 sm:h-4"
                  />
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 text-sm sm:text-base text-muted-foreground">
                    <span className="truncate">{formatAmount(financialData.overview.totalSpent)} spent</span>
                    <span className="truncate">{formatAmount(financialData.overview.totalRemaining)} remaining</span>
                  </div>
                  {financialData.overview.projectedOverrun > 0 && (
                    <div className="text-sm sm:text-base text-red-600 font-medium p-3 bg-red-50 rounded-lg border border-red-200">
                      Over budget by {formatAmount(financialData.overview.projectedOverrun)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Expense Categories */}
            <Card className="card-enhanced">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Top Expense Categories
                </CardTitle>
                <CardDescription className="text-sm">Spending breakdown by category this month</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {financialData.expenses.topCategories.length > 0 ? (
                    financialData.expenses.topCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div 
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" 
                            style={{
                              backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                            }} 
                          />
                          <span className="text-sm sm:text-base font-medium truncate">{category.name}</span>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {category.count}
                          </Badge>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm sm:text-base font-medium">
                            {formatAmount(category.amount)}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {category.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8 sm:py-12">
                      <PieChart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-sm sm:text-base">No expense data available for this month</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Alerts */}
          {financialData.alerts.length > 0 && (
            <Card className="card-enhanced">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Financial Alerts
                  <Badge variant="destructive" className="ml-auto text-xs sm:text-sm">
                    {financialData.alerts.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm">Important notifications requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {financialData.alerts.map((alert) => (
                    <div key={alert.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium break-words">{alert.message}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {alert.createdAt.toLocaleDateString()}
                            </p>
                            {alert.amount && (
                              <Badge variant="outline" className="text-xs self-start sm:self-auto">
                                {formatAmount(alert.amount)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                        className="self-start sm:self-auto flex-shrink-0"
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {financialPermissions.canViewBudgets && (
          <TabsContent value="budgets" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-semibold">Budget Management</h2>
              {financialPermissions.canCreateBudgets && (
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/dashboard/financial/budgets/new">
                    <Wallet className="w-4 h-4 mr-2" />
                    <span className="sm:inline">Create Budget</span>
                  </Link>
                </Button>
              )}
            </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {financialData.budgets.length > 0 ? (
              financialData.budgets.map((budget) => (
                <Card key={budget.id} className="card-enhanced">
                  <CardHeader className="pb-3 sm:pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl truncate">{budget.name}</CardTitle>
                        {budget.entityName && (
                          <CardDescription className="text-sm mt-1">{budget.entityName}</CardDescription>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">{budget.type}</Badge>
                        <Badge variant={getStatusBadgeVariant(budget.status)} className="text-xs">
                          {budget.status.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base font-medium">Budget Progress</span>
                        <span className="text-sm sm:text-base text-muted-foreground font-medium">
                          {budget.utilizationRate}%
                        </span>
                      </div>
                      <Progress value={Math.min(budget.utilizationRate, 100)} className="h-3 sm:h-4" />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        <div className="text-center p-3 sm:p-4 rounded-lg bg-muted/20">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Budget</p>
                          <p className="text-sm sm:text-base font-medium">{formatAmount(budget.amount)}</p>
                        </div>
                        <div className="text-center p-3 sm:p-4 rounded-lg bg-muted/20">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Spent</p>
                          <p className="text-sm sm:text-base font-medium">{formatAmount(budget.spent)}</p>
                        </div>
                        <div className="text-center p-3 sm:p-4 rounded-lg bg-muted/20">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Remaining</p>
                          <p className={`text-sm sm:text-base font-medium ${budget.remaining < 0 ? 'text-red-600' : ''}`}>
                            {formatAmount(budget.remaining)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="card-enhanced">
                <CardContent className="text-center py-12 sm:py-16">
                  <Target className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No Budgets Found</h3>
                  <p className="text-muted-foreground mb-6 text-sm sm:text-base max-w-md mx-auto">
                    Create your first budget to start tracking expenses
                  </p>
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/dashboard/financial/budgets/new">
                      <Wallet className="w-4 h-4 mr-2" />
                      Create Budget
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        )}

        {financialPermissions.canViewExpenses && (
          <TabsContent value="expenses" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-semibold">Expense Management</h2>
              {financialPermissions.canCreateExpenses && (
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/dashboard/financial/expenses/new">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="sm:inline">Add Expense</span>
                  </Link>
                </Button>
              )}
            </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="stats-card">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{financialData.expenses.pending}</div>
              </CardContent>
            </Card>
            
            <Card className="stats-card">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{financialData.expenses.approved}</div>
              </CardContent>
            </Card>
            
            <Card className="stats-card">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{financialData.expenses.rejected}</div>
              </CardContent>
            </Card>
            
            <Card className="stats-card">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  Total Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold break-all">
                  {formatAmount(financialData.expenses.totalAmount)}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {formatTrend(financialData.expenses.changePercentage)} vs last month
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        )}

        {financialPermissions.canViewInvoices && (
          <TabsContent value="invoices" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-semibold">Invoice Management</h2>
              {financialPermissions.canCreateInvoices && (
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/dashboard/financial/invoices/create">
                    <CreditCard className="w-4 h-4 mr-2" />
                    <span className="sm:inline">Create Invoice</span>
                  </Link>
                </Button>
              )}
            </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="stats-card">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  Draft
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{financialData.invoices.draft}</div>
              </CardContent>
            </Card>
            
            <Card className="stats-card">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{financialData.invoices.sent}</div>
              </CardContent>
            </Card>
            
            <Card className="stats-card">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{financialData.invoices.paid}</div>
              </CardContent>
            </Card>
            
            <Card className="stats-card">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-red-600">
                  {financialData.invoices.overdue}
                </div>
              </CardContent>
            </Card>
          </div>

          {financialData.invoices.totalAmount > 0 && (
            <Card className="card-enhanced">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Invoice Summary</CardTitle>
                <CardDescription className="text-sm">Current month invoice performance</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="p-4 rounded-lg bg-muted/20">
                    <p className="text-sm sm:text-base text-muted-foreground mb-2">Total Amount</p>
                    <p className="text-xl sm:text-2xl font-bold break-all">{formatAmount(financialData.invoices.totalAmount)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20">
                    <p className="text-sm sm:text-base text-muted-foreground mb-2">Change from Last Month</p>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(financialData.invoices.changePercentage)}
                      <span className="text-lg sm:text-xl font-semibold">
                        {formatTrend(financialData.invoices.changePercentage)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        )}

        {financialPermissions.canViewFinancialAnalytics && (
          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-semibold">Financial Analytics</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/dashboard/financial/reports">
                  <PieChart className="w-4 h-4 mr-2" />
                  <span className="sm:inline">View Reports</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/dashboard/financial/budgets/analytics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span className="sm:inline">Budget Analytics</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Spending Trend */}
            <Card className="card-enhanced">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Monthly Spending Trend
                </CardTitle>
                <CardDescription className="text-sm">Current vs previous month comparison</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 rounded-lg bg-muted/20">
                    <span className="text-sm sm:text-base text-muted-foreground">Current Month</span>
                    <span className="font-semibold text-sm sm:text-base break-all">{formatAmount(financialData.expenses.totalAmount)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 rounded-lg bg-muted/20">
                    <span className="text-sm sm:text-base text-muted-foreground">Previous Month</span>
                    <span className="font-semibold text-sm sm:text-base break-all">{formatAmount(financialData.expenses.previousMonthAmount)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-4 border-t p-3 rounded-lg bg-primary/5">
                    <span className="text-sm sm:text-base font-medium">Change</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(financialData.expenses.changePercentage)}
                      <span className={`font-semibold text-sm sm:text-base ${
                        financialData.expenses.changePercentage > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatTrend(financialData.expenses.changePercentage)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Health */}
            <Card className="card-enhanced">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Budget Health
                </CardTitle>
                <CardDescription className="text-sm">Budget status distribution</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {['on-track', 'warning', 'critical', 'over-budget'].map(status => {
                    const count = financialData.budgets.filter(b => b.status === status).length;
                    const percentage = financialData.budgets.length > 0 
                      ? (count / financialData.budgets.length) * 100 
                      : 0;
                    
                    return (
                      <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 ${getStatusColor(status)}`} />
                          <span className="text-sm sm:text-base capitalize truncate">{status.replace('-', ' ')}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-sm sm:text-base font-medium">{count}</span>
                          <span className="text-xs sm:text-sm text-muted-foreground ml-2">
                            ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Projection */}
            <Card className="card-enhanced">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Cash Flow Projection
                </CardTitle>
                <CardDescription className="text-sm">Based on current spending rate</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 sm:space-y-6">
                  <div className="p-3 sm:p-4 rounded-lg bg-muted/20">
                    <p className="text-sm sm:text-base text-muted-foreground mb-2">Monthly Burn Rate</p>
                    <p className="text-xl sm:text-2xl font-bold break-all">{formatAmount(financialData.overview.monthlyBurn)}</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-lg bg-muted/20">
                    <p className="text-sm sm:text-base text-muted-foreground mb-2">Projected Runway</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {financialData.overview.monthlyBurn > 0 
                        ? `${Math.round(financialData.overview.totalRemaining / financialData.overview.monthlyBurn)} months`
                        : 'N/A'
                      }
                    </p>
                  </div>
                  {financialData.overview.projectedOverrun > 0 && (
                    <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm sm:text-base text-red-800 font-medium break-words">
                        Budget overrun: {formatAmount(financialData.overview.projectedOverrun)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
