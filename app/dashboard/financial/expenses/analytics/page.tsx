'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  PieChart,
  BarChart3,
  Download,
  Filter,
  Users,
  Building,
  Target,
  AlertTriangle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { ExpenseManagementService } from '@/lib/expense-management-service';
import { DepartmentService, Department } from '@/lib/department-service';
import { ExportService } from '@/lib/export-service';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { useIsOwner } from '@/lib/rbac-hooks';
import { safeNumber, formatDate, isValidDate, formatChartDate } from '@/lib/utils';
import { Expense, ExpenseAnalytics } from '@/lib/types/financial-types';

// Chart colors
const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
  '#ff0000', '#00ffff', '#ff00ff', '#ffff00', '#000080'
];

export default function ExpenseAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  // Cross-workspace management state for owners - persisted
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('expenses-analytics-showAllWorkspaces') === 'true';
    }
    return false;
  });

  const router = useRouter();
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatAmount, getCurrencySymbol, getCurrencyCode, loading: currencyLoading } = useCurrency();
  const isOwner = useIsOwner();

  const fetchAnalytics = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setError('No workspace selected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 1);
      }

      // Determine workspace IDs to load from
      const workspaceIds = (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) 
        ? accessibleWorkspaces.map(w => w.id)
        : [currentWorkspace.id];
      
      console.log('🏢 Loading analytics data from workspaces:', workspaceIds);

      // Load all data in parallel - handle cross-workspace or single workspace
      if (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) {
        // Cross-workspace analytics for owners
        const [analyticsData, expensesData, allExpensesData, departmentsData] = await Promise.all([
          // Aggregate analytics from all accessible workspaces
          (async () => {
            const analyticsPromises = accessibleWorkspaces.map(async (workspace) => {
              try {
                return await ExpenseManagementService.getExpenseAnalytics(
                  workspace.id,
                  { start: startDate, end: endDate }
                );
              } catch (error) {
                console.warn(`Failed to load analytics for workspace ${workspace.name}:`, error);
                return null;
              }
            });
            
            const results = await Promise.all(analyticsPromises);
            
            // Aggregate analytics data
            const validResults = results.filter(result => result !== null);
            if (validResults.length === 0) return null;
            
            // Combine analytics data
            const aggregatedAnalytics: ExpenseAnalytics = {
              totalExpenses: validResults.reduce((sum, analytics) => sum + (analytics?.totalExpenses || 0), 0),
              totalByCategory: {},
              totalByDepartment: {},
              totalByProject: {},
              monthlyTrend: [],
              topExpenseCategories: [],
              budgetUtilization: []
            };
            
            // Merge category breakdowns
            validResults.forEach(analytics => {
              if (analytics?.totalByCategory) {
                Object.entries(analytics.totalByCategory).forEach(([category, amount]) => {
                  if (!aggregatedAnalytics.totalByCategory[category]) {
                    aggregatedAnalytics.totalByCategory[category] = 0;
                  }
                  aggregatedAnalytics.totalByCategory[category] += amount;
                });
              }
            });
            
            // Merge department breakdowns
            validResults.forEach(analytics => {
              if (analytics?.totalByDepartment) {
                Object.entries(analytics.totalByDepartment).forEach(([department, amount]) => {
                  if (!aggregatedAnalytics.totalByDepartment[department]) {
                    aggregatedAnalytics.totalByDepartment[department] = 0;
                  }
                  aggregatedAnalytics.totalByDepartment[department] += amount;
                });
              }
            });
            
            // Merge project breakdowns
            validResults.forEach(analytics => {
              if (analytics?.totalByProject) {
                Object.entries(analytics.totalByProject).forEach(([project, amount]) => {
                  if (!aggregatedAnalytics.totalByProject[project]) {
                    aggregatedAnalytics.totalByProject[project] = 0;
                  }
                  aggregatedAnalytics.totalByProject[project] += amount;
                });
              }
            });
            
            return aggregatedAnalytics;
          })(),
          
          // Cross-workspace expenses
          ExpenseManagementService.getOwnerCrossWorkspaceExpenses(
            currentWorkspace.id,
            { limit: 100 }
          ),
          
          // All cross-workspace expenses for analytics
          ExpenseManagementService.getOwnerCrossWorkspaceExpenses(
            currentWorkspace.id,
            { limit: 500 }
          ),
          
          // Cross-workspace departments
          (async () => {
            const allDepartments: Department[] = [];
            const departmentPromises = accessibleWorkspaces.map(async (workspace) => {
              try {
                const workspaceDepartments = await DepartmentService.getWorkspaceDepartments(workspace.id);
                return workspaceDepartments.map(dept => ({
                  ...dept,
                  workspaceName: workspace.name
                }));
              } catch (error) {
                console.warn(`Failed to load departments for workspace ${workspace.name}:`, error);
                return [];
              }
            });
            
            const departmentResults = await Promise.all(departmentPromises);
            departmentResults.forEach(depts => allDepartments.push(...depts));
            return allDepartments;
          })()
        ]);
        
        setAnalytics(analyticsData);
        setExpenses(expensesData);
        setAllExpenses(allExpensesData);
        setDepartments(departmentsData);
      } else {
        // Single workspace analytics
        const [analyticsData, expensesData, allExpensesData, departmentsData] = await Promise.all([
          ExpenseManagementService.getExpenseAnalytics(
            currentWorkspace.id,
            { start: startDate, end: endDate }
          ),
          ExpenseManagementService.getWorkspaceExpenses(
            currentWorkspace.id,
            { limit: 100 }
          ),
          ExpenseManagementService.getWorkspaceExpenses(
            currentWorkspace.id,
            { limit: 500 } // Get more data for analytics
          ),
          DepartmentService.getWorkspaceDepartments(currentWorkspace.id)
        ]);

        setAnalytics(analyticsData);
        setExpenses(expensesData);
        setAllExpenses(allExpensesData);
        setDepartments(departmentsData);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load analytics data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, timeframe, isOwner, showAllWorkspaces, accessibleWorkspaces, toast]);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchAnalytics();
    }
  }, [currentWorkspace?.id, timeframe, fetchAnalytics]);

  // Export handlers
  const handleExport = async (format: 'csv' | 'excel' | 'pdf', type: 'summary' | 'detailed' | 'tax') => {
    if (!allExpenses.length) {
      toast({
        title: 'No Data',
        description: 'No expense data available to export.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setExporting(true);
      
      switch (type) {
        case 'summary':
          await ExportService.exportExpenseSummary(allExpenses, analytics, format);
          toast({
            title: 'Export Successful',
            description: 'Expense summary report has been generated.'
          });
          break;
          
        case 'detailed':
          await ExportService.exportExpenses(allExpenses, format);
          toast({
            title: 'Export Successful',
            description: 'Detailed expense data has been exported.'
          });
          break;
          
        case 'tax':
          await ExportService.exportTaxReport(allExpenses, format);
          toast({
            title: 'Export Successful',
            description: 'Tax report has been generated.'
          });
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleQuickExport = async () => {
    await handleExport('csv', 'detailed');
  };

  // Calculate additional metrics
  const totalExpenses = allExpenses.length;
  const approvedExpenses = allExpenses.filter(e => e.status === 'approved').length;
  const pendingExpenses = allExpenses.filter(e => e.status === 'submitted').length;
  const rejectedExpenses = allExpenses.filter(e => e.status === 'rejected').length;

  const totalAmount = allExpenses.reduce((sum, expense) => {
    return sum + safeNumber(expense?.amountInBaseCurrency);
  }, 0);
  
  const approvedAmount = allExpenses
    .filter(expense => expense.status === 'approved')
    .reduce((sum, expense) => {
      return sum + safeNumber(expense?.amountInBaseCurrency);
    }, 0);
    
  const pendingAmount = allExpenses
    .filter(expense => expense.status === 'submitted')
    .reduce((sum, expense) => {
      return sum + safeNumber(expense?.amountInBaseCurrency);
    }, 0);

  // Enhanced Analytics Calculations
  const categoryBreakdown = allExpenses.reduce((acc, expense) => {
    const categoryName = expense.category.name;
    const amount = safeNumber(expense?.amountInBaseCurrency);
    acc[categoryName] = (acc[categoryName] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Department Analytics Calculations
  const departmentBreakdown = allExpenses.reduce((acc, expense) => {
    const departmentId = expense.departmentId || 'unassigned';
    const amount = safeNumber(expense?.amountInBaseCurrency);
    
    if (!acc[departmentId]) {
      acc[departmentId] = {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        draft: 0,
        paid: 0,
        count: 0
      };
    }
    
    acc[departmentId].total += amount;
    acc[departmentId].count += 1;
    
    // Track by status
    switch (expense.status) {
      case 'approved':
        acc[departmentId].approved += amount;
        break;
      case 'submitted':
        acc[departmentId].pending += amount;
        break;
      case 'rejected':
        acc[departmentId].rejected += amount;
        break;
      case 'draft':
        acc[departmentId].draft += amount;
        break;
      case 'paid':
        acc[departmentId].paid += amount;
        break;
    }
    
    return acc;
  }, {} as Record<string, {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    draft: number;
    paid: number;
    count: number;
  }>);

  const getDepartmentName = (departmentId: string) => {
    if (departmentId === 'unassigned') return 'No Department';
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Unknown Department';
  };

  const sortedDepartments = Object.entries(departmentBreakdown)
    .map(([id, data]) => ({
      id,
      name: getDepartmentName(id),
      ...data
    }))
    .sort((a, b) => b.total - a.total);

  // Department chart data for pie chart
  const departmentChartData = sortedDepartments.map((dept, index) => ({
    name: dept.name,
    value: dept.total,
    percentage: (dept.total / totalAmount) * 100,
    color: CHART_COLORS[index % CHART_COLORS.length],
    count: dept.count
  }));

  // Department status breakdown for stacked bar chart
  const departmentStatusData = sortedDepartments.map(dept => ({
    name: dept.name.length > 15 ? dept.name.substring(0, 15) + '...' : dept.name,
    fullName: dept.name,
    approved: dept.approved,
    pending: dept.pending,
    rejected: dept.rejected,
    draft: dept.draft,
    paid: dept.paid
  }));

  // Monthly trend calculation
  const monthlyData = allExpenses.reduce((acc, expense) => {
    try {
      if (!isValidDate(expense.expenseDate)) {
        // Skip invalid dates
        return acc;
      }
      
      const date = new Date(expense.expenseDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { 
          month: monthKey, 
          amount: 0, 
          count: 0,
          approved: 0,
          pending: 0,
          rejected: 0
        };
      }
      
      const amount = safeNumber(expense?.amountInBaseCurrency);
      acc[monthKey].amount += amount;
      acc[monthKey].count += 1;
      
      if (expense.status === 'approved') acc[monthKey].approved += 1;
      else if (expense.status === 'submitted') acc[monthKey].pending += 1;
      else if (expense.status === 'rejected') acc[monthKey].rejected += 1;
      
      return acc;
    } catch (error) {
      console.warn('Error processing expense date:', expense.id, error);
      return acc;
    }
  }, {} as Record<string, any>);

  const monthlyTrend = Object.values(monthlyData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months

  // Status distribution for pie chart
  const statusData = [
    { name: 'Approved', value: approvedExpenses, color: '#10b981' },
    { name: 'Pending', value: pendingExpenses, color: '#f59e0b' },
    { name: 'Rejected', value: rejectedExpenses, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Category data for charts
  const categoryChartData = sortedCategories.map(([name, amount], index) => ({
    name: name.length > 15 ? name.substring(0, 15) + '...' : name,
    fullName: name,
    amount: Number(amount.toFixed(2)),
    percentage: totalAmount > 0 ? Number(((amount / totalAmount) * 100).toFixed(1)) : 0,
    color: CHART_COLORS[index % CHART_COLORS.length]
  }));

  // Calculate trends (comparing with previous period)
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number(((current - previous) / previous * 100).toFixed(1));
  };

  // Mock previous period data for trend calculation
  const previousTotalAmount = totalAmount * 0.85; // Mock 15% less in previous period
  const totalTrend = calculateTrend(totalAmount, previousTotalAmount);
  const approvalRate = totalExpenses > 0 ? (approvedExpenses / totalExpenses) * 100 : 0;

  // Recent trends (mock data - you can enhance this with actual trend calculation)
  const trends = {
    totalChange: totalTrend,
    approvedChange: 8.3,
    pendingChange: -4.2,
    categoryTrends: sortedCategories.map(([name]) => ({
      name,
      change: Math.random() * 20 - 10 // Mock trend data
    }))
  };

  if (loading || currencyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchAnalytics} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Expense Analytics</h1>
            <p className="text-muted-foreground">
              Analyze your expense patterns and trends
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleQuickExport}
            disabled={exporting || !allExpenses.length}
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalAmount)}</div>
            <div className="flex items-center gap-1 text-xs">
              {trends.totalChange > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">+{trends.totalChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-red-500" />
                  <span className="text-red-600">{trends.totalChange}%</span>
                </>
              )}
              <span className="text-muted-foreground">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatAmount(approvedAmount)}</div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-green-600">{approvalRate.toFixed(1)}%</span>
              <span className="text-muted-foreground">approval rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatAmount(pendingAmount)}</div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-yellow-600">{pendingExpenses}</span>
              <span className="text-muted-foreground">awaiting approval</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Count</CardTitle>
            <PieChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExpenses}</div>
            <div className="text-xs text-muted-foreground">
              {approvedExpenses} approved, {pendingExpenses} pending
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Breakdown of expense statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => {
                          const total = statusData.reduce((sum, item) => sum + item.value, 0);
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                          return `${name} ${percentage}%`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [value, name]}
                        labelFormatter={() => ''}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Expense Trend</CardTitle>
                <CardDescription>Expense amounts over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(value) => formatChartDate(value, 'short')}
                      />
                      <YAxis tickFormatter={(value) => `${getCurrencySymbol()}${value.toLocaleString()}`} />
                      <Tooltip 
                        formatter={(value) => [`${formatAmount(Number(value))}`, 'Amount']}
                        labelFormatter={(label) => formatChartDate(label, 'long')}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Expense Categories</CardTitle>
                <CardDescription>Highest spending categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis tickFormatter={(value) => `${getCurrencySymbol()}${value.toLocaleString()}`} />
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${formatAmount(Number(value))}`,
                          'Amount',
                          `${props.payload.percentage}% of total`
                        ]}
                        labelFormatter={(label, payload) => {
                          const item = payload?.[0]?.payload;
                          return item ? item.fullName : label;
                        }}
                      />
                      <Bar dataKey="amount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest expense submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenses.slice(0, 8).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{expense.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{expense.category.name}</span>
                          <span>•</span>
                          <span>{formatDate(expense.expenseDate)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {formatAmount(safeNumber(expense.amountInBaseCurrency))}
                        </p>
                        <Badge 
                          variant={
                            expense.status === 'approved' ? 'default' :
                            expense.status === 'submitted' ? 'secondary' : 'destructive'
                          }
                          className="text-xs"
                        >
                          {expense.status === 'submitted' ? 'Pending' : expense.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Proportional spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryChartData.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {categoryChartData.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${formatAmount(Number(value))}`, 'Amount']}
                        labelFormatter={(label) => label}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Top Categories by Amount</CardTitle>
                <CardDescription>Highest spending categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={categoryChartData.slice(0, 6)} 
                      layout="horizontal"
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => `${getCurrencySymbol()}${value.toLocaleString()}`} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip 
                        formatter={(value) => [`${formatAmount(Number(value))}`, 'Amount']}
                        labelFormatter={(label, payload) => {
                          const item = payload?.[0]?.payload;
                          return item ? item.fullName : label;
                        }}
                      />
                      <Bar dataKey="amount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Category Breakdown */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Detailed Category Analysis</CardTitle>
                <CardDescription>
                  Complete breakdown of expenses by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedCategories.map(([category, amount], index) => {
                    const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
                    const trend = trends.categoryTrends.find(t => t.name === category);
                    
                    return (
                      <div key={category} className="space-y-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{category}</span>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{formatAmount(amount)}</span>
                              {trend && (
                                <div className="flex items-center gap-1 text-xs">
                                  {trend.change > 0 ? (
                                    <>
                                      <TrendingUp className="w-3 h-3 text-green-500" />
                                      <span className="text-green-600">+{trend.change.toFixed(1)}%</span>
                                    </>
                                  ) : trend.change < 0 ? (
                                    <>
                                      <TrendingDown className="w-3 h-3 text-red-500" />
                                      <span className="text-red-600">{trend.change.toFixed(1)}%</span>
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground">0%</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{percentage.toFixed(1)}% of total expenses</span>
                          <span>
                            {allExpenses.filter(e => e.category.name === category).length} expenses
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Summary Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{departments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active departments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Highest Spending</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {sortedDepartments.length > 0 ? formatAmount(sortedDepartments[0].total) : formatAmount(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sortedDepartments.length > 0 ? sortedDepartments[0].name : 'No data'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg per Department</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {departments.length > 0 ? formatAmount(totalAmount / departments.length) : formatAmount(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average spending
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Department Spending Distribution - Pie Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Department Spending Distribution</CardTitle>
                <CardDescription>Breakdown of expenses by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={departmentChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percentage}) => `${name}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {departmentChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatAmount(value), 'Amount']}
                        labelFormatter={(label) => `Department: ${label}`}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Spending Departments List */}
            <Card>
              <CardHeader>
                <CardTitle>Top Departments</CardTitle>
                <CardDescription>Ranked by total spending</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedDepartments.slice(0, 8).map((dept, index) => {
                    const percentage = (dept.total / totalAmount) * 100;
                    return (
                      <div key={dept.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="font-medium text-sm">{dept.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">{formatAmount(dept.total)}</span>
                            <div className="text-xs text-muted-foreground">
                              {dept.count} expenses
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{percentage.toFixed(1)}% of total</span>
                          <span>
                            Approved: {formatAmount(dept.approved)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Department Status Breakdown - Stacked Bar Chart */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Department Expense Status Breakdown</CardTitle>
                <CardDescription>Status distribution across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentStatusData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis tickFormatter={(value) => formatAmount(value)} />
                      <Tooltip 
                        formatter={(value: number, name: string) => [formatAmount(value), name]}
                        labelFormatter={(label) => {
                          const dept = departmentStatusData.find(d => d.name === label);
                          return dept ? dept.fullName : label;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="approved" stackId="a" fill="#22c55e" name="Approved" />
                      <Bar dataKey="pending" stackId="a" fill="#eab308" name="Pending" />
                      <Bar dataKey="paid" stackId="a" fill="#3b82f6" name="Paid" />
                      <Bar dataKey="draft" stackId="a" fill="#6b7280" name="Draft" />
                      <Bar dataKey="rejected" stackId="a" fill="#ef4444" name="Rejected" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Department Performance Table */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Department Performance Details</CardTitle>
                <CardDescription>Comprehensive breakdown of all departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Department</th>
                        <th className="text-right p-2">Total Spending</th>
                        <th className="text-right p-2">Expenses</th>
                        <th className="text-right p-2">Approved</th>
                        <th className="text-right p-2">Pending</th>
                        <th className="text-right p-2">Avg per Expense</th>
                        <th className="text-right p-2">% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDepartments.map((dept, index) => {
                        const percentage = (dept.total / totalAmount) * 100;
                        const avgPerExpense = dept.count > 0 ? dept.total / dept.count : 0;
                        
                        return (
                          <tr key={dept.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                />
                                <span className="font-medium">{dept.name}</span>
                              </div>
                            </td>
                            <td className="text-right p-2 font-medium">{formatAmount(dept.total)}</td>
                            <td className="text-right p-2">{dept.count}</td>
                            <td className="text-right p-2 text-green-600">{formatAmount(dept.approved)}</td>
                            <td className="text-right p-2 text-yellow-600">{formatAmount(dept.pending)}</td>
                            <td className="text-right p-2">{formatAmount(avgPerExpense)}</td>
                            <td className="text-right p-2">{percentage.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Spending Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Monthly Spending Trends</CardTitle>
                <CardDescription>
                  Track expense patterns over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(value) => formatChartDate(value, 'short')}
                      />
                      <YAxis tickFormatter={(value) => `${getCurrencySymbol()}${value.toLocaleString()}`} />
                      <Tooltip 
                        formatter={(value, name) => [`${formatAmount(Number(value))}`, name]}
                        labelFormatter={(label) => formatChartDate(label, 'long')}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                        name="Total Amount"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Count Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Volume Trends</CardTitle>
                <CardDescription>Number of expenses by status over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(value) => formatChartDate(value, 'short')}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(label) => formatChartDate(label, 'long')}
                      />
                      <Legend />
                      <Bar dataKey="approved" stackId="a" fill="#10b981" name="Approved" />
                      <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
                      <Bar dataKey="rejected" stackId="a" fill="#ef4444" name="Rejected" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Trend Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>Key insights and patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-blue-800">Spending Trend</h4>
                    </div>
                    <p className="text-sm text-blue-700">
                      {totalTrend > 0 ? 'Expenses have increased' : 'Expenses have decreased'} by{' '}
                      <span className="font-medium">{Math.abs(totalTrend)}%</span> compared to the previous period.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <h4 className="font-medium text-green-800">Approval Rate</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      Current approval rate is{' '}
                      <span className="font-medium">{approvalRate.toFixed(1)}%</span> with{' '}
                      <span className="font-medium">{pendingExpenses}</span> expenses pending review.
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <h4 className="font-medium text-yellow-800">Top Category</h4>
                    </div>
                    <p className="text-sm text-yellow-700">
                      {sortedCategories[0] ? (
                        <>
                          <span className="font-medium">{sortedCategories[0][0]}</span> accounts for{' '}
                          <span className="font-medium">
                            {totalAmount > 0 ? ((sortedCategories[0][1] / totalAmount) * 100).toFixed(1) : 0}%
                          </span> of total expenses.
                        </>
                      ) : (
                        'No expense data available'
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Reports</CardTitle>
                <CardDescription>
                  Download detailed expense reports in various formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className={`h-20 flex-col gap-2 ${exporting || !allExpenses.length ? 'opacity-50' : ''}`}
                    onClick={() => handleExport('pdf', 'summary')}
                    disabled={exporting || !allExpenses.length}
                  >
                    <Download className="w-5 h-5" />
                    <div className="text-center">
                      <div className="font-medium">Expense Summary</div>
                      <div className="text-xs text-muted-foreground">PDF Report</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className={`h-20 flex-col gap-2 ${exporting || !allExpenses.length ? 'opacity-50' : ''}`}
                    onClick={() => handleExport('excel', 'detailed')}
                    disabled={exporting || !allExpenses.length}
                  >
                    <Download className="w-5 h-5" />
                    <div className="text-center">
                      <div className="font-medium">Detailed Expenses</div>
                      <div className="text-xs text-muted-foreground">Excel Export</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className={`h-20 flex-col gap-2 ${exporting || !allExpenses.length ? 'opacity-50' : ''}`}
                    onClick={() => handleExport('csv', 'tax')}
                    disabled={exporting || !allExpenses.length}
                  >
                    <Download className="w-5 h-5" />
                    <div className="text-center">
                      <div className="font-medium">Tax Report</div>
                      <div className="text-xs text-muted-foreground">CSV Format</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className={`h-20 flex-col gap-2 ${exporting ? 'opacity-50' : ''}`}
                    onClick={() => {
                      toast({
                        title: 'Coming Soon',
                        description: 'Custom report builder will be available in a future update.'
                      });
                    }}
                    disabled={exporting}
                  >
                    <Download className="w-5 h-5" />
                    <div className="text-center">
                      <div className="font-medium">Custom Report</div>
                      <div className="text-xs text-muted-foreground">Multiple Formats</div>
                    </div>
                  </Button>
                </div>

                {/* Quick Export Options */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-medium mb-3">Quick Export Options</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleExport('csv', 'detailed')}
                      disabled={exporting || !allExpenses.length}
                      className="justify-start"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      CSV Export
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleExport('excel', 'detailed')}
                      disabled={exporting || !allExpenses.length}
                      className="justify-start"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Excel Export
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleExport('pdf', 'summary')}
                      disabled={exporting || !allExpenses.length}
                      className="justify-start"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF Summary
                    </Button>
                  </div>
                </div>

                {exporting && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-700">Generating export...</span>
                    </div>
                  </div>
                )}

                {!allExpenses.length && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">No expense data available to export</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Report Summary</CardTitle>
                <CardDescription>Current data available for export</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Total Expenses</span>
                    </div>
                    <Badge variant="secondary">{totalExpenses}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Total Amount</span>
                    </div>
                    <Badge variant="secondary">{formatAmount(totalAmount)}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Categories</span>
                    </div>
                    <Badge variant="secondary">{sortedCategories.length}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Date Range</span>
                    </div>
                    <Badge variant="secondary">
                      {timeframe === 'week' ? '7 days' :
                       timeframe === 'month' ? '30 days' :
                       timeframe === 'quarter' ? '90 days' : '365 days'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Export Statistics</CardTitle>
                <CardDescription>Breakdown of data available for different report types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{approvedExpenses}</div>
                    <div className="text-sm text-muted-foreground">Approved Expenses</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Ready for accounting export
                    </div>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{pendingExpenses}</div>
                    <div className="text-sm text-muted-foreground">Pending Review</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Awaiting approval
                    </div>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{rejectedExpenses}</div>
                    <div className="text-sm text-muted-foreground">Rejected</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Excluded from reports
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
