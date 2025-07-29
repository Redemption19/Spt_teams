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
  DollarSign, 
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
  Shield
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
}

interface ExpenseAnalytics {
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
  totalAmount: number;
  previousMonthAmount: number;
  changePercentage: number;
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
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
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

  const loadFinancialData = useCallback(async (showRefreshing = false) => {
    if (!workspaceIds.length) return;

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
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
  }, [workspaceIds, toast]);

  const processFinancialData = async (data: any): Promise<FinancialData> => {
    const { 
      allExpenses, 
      previousMonthExpenses, 
      allBudgets, 
      allInvoices, 
      previousMonthInvoices, 
      budgetAnalytics,
      workspaceIds 
    } = data;

    // Calculate overview metrics
    const totalBudget = budgetAnalytics.totalBudget || 0;
    const totalSpent = budgetAnalytics.totalSpent || 0;
    const totalRemaining = totalBudget - totalSpent;
    const utilizationRate = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    
    // Calculate trends
    const currentMonthExpenseTotal = allExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    const previousMonthExpenseTotal = previousMonthExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    const monthlyBurn = currentMonthExpenseTotal;
    const spendingTrend = previousMonthExpenseTotal > 0 
      ? ((currentMonthExpenseTotal - previousMonthExpenseTotal) / previousMonthExpenseTotal) * 100 
      : 0;

    // Calculate expense analytics
    const expensesByStatus = allExpenses.reduce((acc: any, exp: any) => {
      acc[exp.status] = (acc[exp.status] || 0) + 1;
      return acc;
    }, {});

    const expensesByCategory = allExpenses.reduce((acc: any, exp: any) => {
      // Handle category field which might be a string or an object
      let category = 'Other';
      if (exp.category) {
        if (typeof exp.category === 'string') {
          category = exp.category;
        } else if (typeof exp.category === 'object' && exp.category.name) {
          category = exp.category.name;
        } else if (typeof exp.category === 'object' && exp.category.id) {
          category = exp.category.id;
        } else {
          category = String(exp.category);
        }
      }
      
      if (!acc[category]) {
        acc[category] = { amount: 0, count: 0 };
      }
      acc[category].amount += exp.amount || 0;
      acc[category].count += 1;
      return acc;
    }, {});

    const topCategories = Object.entries(expensesByCategory)
      .map(([name, data]: [string, any]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: currentMonthExpenseTotal > 0 ? (data.amount / currentMonthExpenseTotal) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Calculate invoice analytics
    const invoicesByStatus = allInvoices.reduce((acc: any, inv: any) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {});

    const currentMonthInvoiceTotal = allInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
    const previousMonthInvoiceTotal = previousMonthInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
    const invoiceChangePercentage = previousMonthInvoiceTotal > 0 
      ? ((currentMonthInvoiceTotal - previousMonthInvoiceTotal) / previousMonthInvoiceTotal) * 100 
      : 0;

    // Process budgets with enhanced information
    const budgetSummaries: BudgetSummary[] = await Promise.all(
      allBudgets.map(async (budget: any) => {
        let entityName = '';
        let departmentName = '';

        try {
          if (budget.entityId) {
            switch (budget.type) {
              case 'department':
                const dept = await DepartmentService.getDepartment(budget.workspaceId, budget.entityId);
                entityName = dept?.name || 'Unknown Department';
                departmentName = dept?.name || '';
                break;
              case 'workspace':
                const workspace = await WorkspaceService.getWorkspace(budget.entityId);
                entityName = workspace?.name || 'Unknown Workspace';
                break;
              default:
                entityName = budget.entityId;
            }
          }
        } catch (error) {
          console.warn('Error fetching entity name for budget:', error);
          entityName = budget.entityId || 'Unknown';
        }

        const spent = budget.spent || 0;
        const amount = budget.amount || 0;
        const utilizationRate = amount > 0 ? Math.round((spent / amount) * 100) : 0;
        
        let status: BudgetSummary['status'] = 'on-track';
        if (utilizationRate >= 100) status = 'over-budget';
        else if (utilizationRate >= 90) status = 'critical';
        else if (utilizationRate >= 75) status = 'warning';

        return {
          id: budget.id,
          name: budget.name || `${budget.type} Budget`,
          type: budget.type || 'general',
          amount,
          spent,
          remaining: amount - spent,
          utilizationRate,
          status,
          entityName,
          departmentName
        };
      })
    );

    // Generate alerts
    const alerts: FinancialAlert[] = [];

    // Budget alerts
    budgetSummaries.forEach(budget => {
      if (budget.status === 'over-budget') {
        alerts.push({
          id: `budget-over-${budget.id}`,
          type: 'budget_critical',
          message: `${budget.name} is over budget by ${formatAmount(Math.abs(budget.remaining))}`,
          severity: 'critical',
          timestamp: new Date(),
          entityId: budget.id,
          entityName: budget.name,
          amount: Math.abs(budget.remaining)
        });
      } else if (budget.status === 'critical') {
        alerts.push({
          id: `budget-critical-${budget.id}`,
          type: 'budget_critical',
          message: `${budget.name} is at ${budget.utilizationRate}% utilization`,
          severity: 'critical',
          timestamp: new Date(),
          entityId: budget.id,
          entityName: budget.name
        });
      } else if (budget.status === 'warning') {
        alerts.push({
          id: `budget-warning-${budget.id}`,
          type: 'budget_warning',
          message: `${budget.name} is at ${budget.utilizationRate}% utilization`,
          severity: 'warning',
          timestamp: new Date(),
          entityId: budget.id,
          entityName: budget.name
        });
      }
    });

    // Invoice alerts
    const overdueInvoices = allInvoices.filter((inv: any) => inv.status === 'overdue');
    if (overdueInvoices.length > 0) {
      alerts.push({
        id: 'invoices-overdue',
        type: 'invoice_overdue',
        message: `${overdueInvoices.length} invoice(s) are overdue for payment`,
        severity: 'critical',
        timestamp: new Date(),
        amount: overdueInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0)
      });
    }

    // Expense alerts
    const pendingExpenses = allExpenses.filter((exp: any) => exp.status === 'pending');
    if (pendingExpenses.length > 10) {
      alerts.push({
        id: 'expenses-pending',
        type: 'expense_pending',
        message: `${pendingExpenses.length} expenses are pending approval`,
        severity: 'warning',
        timestamp: new Date(),
        amount: pendingExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
      });
    }

    // Cash flow alert
    if (totalRemaining < monthlyBurn * 2) {
      alerts.push({
        id: 'cash-flow-warning',
        type: 'cash_flow',
        message: `Current budget will last approximately ${Math.round(totalRemaining / monthlyBurn)} month(s) at current spending rate`,
        severity: 'warning',
        timestamp: new Date(),
        amount: totalRemaining
      });
    }

    return {
      overview: {
        totalBudget,
        totalSpent,
        totalRemaining,
        monthlyBurn,
        projectedOverrun: Math.max(0, totalSpent - totalBudget),
        utilizationRate,
        previousMonthSpent: previousMonthExpenseTotal,
        spendingTrend
      },
      expenses: {
        pending: expensesByStatus.pending || 0,
        approved: expensesByStatus.approved || 0,
        rejected: expensesByStatus.rejected || 0,
        draft: expensesByStatus.draft || 0,
        totalAmount: currentMonthExpenseTotal,
        previousMonthAmount: previousMonthExpenseTotal,
        changePercentage: spendingTrend,
        topCategories
      },
      invoices: {
        draft: invoicesByStatus.draft || 0,
        sent: invoicesByStatus.sent || 0,
        paid: invoicesByStatus.paid || 0,
        overdue: invoicesByStatus.overdue || 0,
        totalAmount: currentMonthInvoiceTotal,
        avgPaymentTime: 15, // TODO: Calculate from actual data
        previousMonthAmount: previousMonthInvoiceTotal,
        changePercentage: invoiceChangePercentage
      },
      budgets: budgetSummaries,
      alerts: alerts.sort((a, b) => {
        const severityOrder = { critical: 3, warning: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
      lastUpdated: new Date()
    };
  };

  useEffect(() => {
    if (workspaceIds.length > 0) {
      loadFinancialData();
    }
  }, [loadFinancialData, workspaceIds]);

  const handleRefresh = useCallback(() => {
    loadFinancialData(true);
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

  // Check permissions first
  if (!financialPermissions.loading && !financialPermissions.canViewOverview) {
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
              You don't have permission to view the financial overview. Please contact your administrator.
            </p>
            <Badge variant="destructive">
              Requires: View Financial Overview
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && !financialData) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground">
            Track expenses, manage budgets, and monitor financial performance
            {financialData.lastUpdated && (
              <span className="ml-2">• Last updated: {financialData.lastUpdated.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {/* Quick Access Navigation */}
          <div className="flex gap-2">
            {financialPermissions.canViewExpenses && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/financial/expenses">
                  <Receipt className="w-4 h-4 mr-2" />
                  Expenses
                </Link>
              </Button>
            )}
            {financialPermissions.canViewInvoices && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/financial/invoices">
                  <FileText className="w-4 h-4 mr-2" />
                  Invoices
                </Link>
              </Button>
            )}
            {financialPermissions.canViewBudgets && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/financial/budgets">
                  <Target className="w-4 h-4 mr-2" />
                  Budgets
                </Link>
              </Button>
            )}
          </div>
          
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
          
          <Button className="bg-primary hover:bg-primary/90" asChild>
            <Link href="/dashboard/financial/reports">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(financialData.overview.totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialData.overview.utilizationRate}% utilized
            </p>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <div className="flex items-center gap-1">
              {getTrendIcon(financialData.overview.spendingTrend)}
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(financialData.overview.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatTrend(financialData.overview.spendingTrend)} from last month
            </p>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(financialData.overview.totalRemaining)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialData.overview.monthlyBurn > 0 
                ? `${Math.round(financialData.overview.totalRemaining / financialData.overview.monthlyBurn)} months remaining`
                : 'No spending this month'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.expenses.pending}</div>
            <p className="text-xs text-muted-foreground">
              {formatAmount(financialData.expenses.totalAmount)} total this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {financialPermissions.canViewBudgets && (
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
          )}
          {financialPermissions.canViewExpenses && (
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          )}
          {financialPermissions.canViewInvoices && (
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          )}
          {financialPermissions.canViewFinancialAnalytics && (
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Budget Utilization */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Budget Utilization
                </CardTitle>
                <CardDescription>Current spending across all budgets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {financialData.overview.utilizationRate}%
                    </span>
                  </div>
                  <Progress 
                    value={financialData.overview.utilizationRate} 
                    className="h-3"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatAmount(financialData.overview.totalSpent)} spent</span>
                    <span>{formatAmount(financialData.overview.totalRemaining)} remaining</span>
                  </div>
                  {financialData.overview.projectedOverrun > 0 && (
                    <div className="text-sm text-red-600 font-medium">
                      Over budget by {formatAmount(financialData.overview.projectedOverrun)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Expense Categories */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Top Expense Categories
                </CardTitle>
                <CardDescription>Spending breakdown by category this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {financialData.expenses.topCategories.length > 0 ? (
                    financialData.expenses.topCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{
                              backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                            }} 
                          />
                          <span className="text-sm font-medium">{category.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {category.count}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatAmount(category.amount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {category.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No expense data available for this month
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Alerts */}
          {financialData.alerts.length > 0 && (
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Financial Alerts
                  <Badge variant="destructive" className="ml-auto">
                    {financialData.alerts.length}
                  </Badge>
                </CardTitle>
                <CardDescription>Important notifications requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {financialData.alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {alert.timestamp.toLocaleDateString()}
                          </p>
                          {alert.amount && (
                            <Badge variant="outline" className="text-xs">
                              {formatAmount(alert.amount)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
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
          <TabsContent value="budgets" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Budget Management</h2>
              {financialPermissions.canCreateBudgets && (
                <Button asChild>
                  <Link href="/dashboard/financial/budgets/new">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Create Budget
                  </Link>
                </Button>
              )}
            </div>

          <div className="grid gap-4">
            {financialData.budgets.length > 0 ? (
              financialData.budgets.map((budget) => (
                <Card key={budget.id} className="card-enhanced">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{budget.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{budget.type}</Badge>
                        <Badge variant={getStatusBadgeVariant(budget.status)}>
                          {budget.status.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>
                    {budget.entityName && (
                      <CardDescription>{budget.entityName}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Budget Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {budget.utilizationRate}%
                        </span>
                      </div>
                      <Progress value={Math.min(budget.utilizationRate, 100)} className="h-2" />
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Budget</p>
                          <p className="text-sm font-medium">{formatAmount(budget.amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Spent</p>
                          <p className="text-sm font-medium">{formatAmount(budget.spent)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Remaining</p>
                          <p className={`text-sm font-medium ${budget.remaining < 0 ? 'text-red-600' : ''}`}>
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
                <CardContent className="text-center py-12">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Budgets Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first budget to start tracking expenses
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/financial/budgets/new">
                      <DollarSign className="w-4 h-4 mr-2" />
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
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Expense Management</h2>
              {financialPermissions.canCreateExpenses && (
                <Button asChild>
                  <Link href="/dashboard/financial/expenses/new">
                    <FileText className="w-4 h-4 mr-2" />
                    Add Expense
                  </Link>
                </Button>
              )}
            </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="stats-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData.expenses.pending}</div>
              </CardContent>
            </Card>
            
            <Card className="stats-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData.expenses.approved}</div>
              </CardContent>
            </Card>
            
            <Card className="stats-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData.expenses.rejected}</div>
              </CardContent>
            </Card>
            
            <Card className="stats-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Total Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(financialData.expenses.totalAmount)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTrend(financialData.expenses.changePercentage)} vs last month
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        )}

        {financialPermissions.canViewInvoices && (
          <TabsContent value="invoices" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Invoice Management</h2>
              {financialPermissions.canCreateInvoices && (
                <Button asChild>
                  <Link href="/dashboard/financial/invoices/create">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Link>
                </Button>
              )}
            </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="stats-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  Draft
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData.invoices.draft}</div>
              </CardContent>
            </Card>
            
            <Card className="stats-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData.invoices.sent}</div>
              </CardContent>
            </Card>
            
            <Card className="stats-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData.invoices.paid}</div>
              </CardContent>
            </Card>
            
            <Card className="stats-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {financialData.invoices.overdue}
                </div>
              </CardContent>
            </Card>
          </div>

          {financialData.invoices.totalAmount > 0 && (
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
                <CardDescription>Current month invoice performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">{formatAmount(financialData.invoices.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Change from Last Month</p>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(financialData.invoices.changePercentage)}
                      <span className="text-lg font-semibold">
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
          <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Financial Analytics</h2>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/financial/reports">
                  <PieChart className="w-4 h-4 mr-2" />
                  View Reports
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/financial/budgets/analytics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Budget Analytics
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Spending Trend */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Monthly Spending Trend
                </CardTitle>
                <CardDescription>Current vs previous month comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Month</span>
                    <span className="font-semibold">{formatAmount(financialData.expenses.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Previous Month</span>
                    <span className="font-semibold">{formatAmount(financialData.expenses.previousMonthAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Change</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(financialData.expenses.changePercentage)}
                      <span className={`font-semibold ${
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Budget Health
                </CardTitle>
                <CardDescription>Budget status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['on-track', 'warning', 'critical', 'over-budget'].map(status => {
                    const count = financialData.budgets.filter(b => b.status === status).length;
                    const percentage = financialData.budgets.length > 0 
                      ? (count / financialData.budgets.length) * 100 
                      : 0;
                    
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                          <span className="text-sm capitalize">{status.replace('-', ' ')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">{count}</span>
                          <span className="text-xs text-muted-foreground ml-2">
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Cash Flow Projection
                </CardTitle>
                <CardDescription>Based on current spending rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Burn Rate</p>
                    <p className="text-xl font-bold">{formatAmount(financialData.overview.monthlyBurn)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Projected Runway</p>
                    <p className="text-xl font-bold">
                      {financialData.overview.monthlyBurn > 0 
                        ? `${Math.round(financialData.overview.totalRemaining / financialData.overview.monthlyBurn)} months`
                        : 'N/A'
                      }
                    </p>
                  </div>
                  {financialData.overview.projectedOverrun > 0 && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-800 font-medium">
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
