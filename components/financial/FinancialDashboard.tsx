'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
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
  Coins
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';

// Mock data - replace with actual service calls
const mockFinancialData = {
  overview: {
    totalBudget: 150000,
    totalSpent: 87500,
    totalRemaining: 62500,
    monthlyBurn: 12500,
    projectedOverrun: 0,
    utilizationRate: 58
  },
  expenses: {
    pending: 12,
    approved: 145,
    rejected: 3,
    totalAmount: 47500,
    topCategories: [
      { name: 'Travel', amount: 15000, percentage: 31.6 },
      { name: 'Software', amount: 12000, percentage: 25.3 },
      { name: 'Marketing', amount: 8500, percentage: 17.9 },
      { name: 'Office Supplies', amount: 7000, percentage: 14.7 },
      { name: 'Training', amount: 5000, percentage: 10.5 }
    ]
  },
  invoices: {
    draft: 3,
    sent: 8,
    paid: 23,
    overdue: 2,
    totalAmount: 125000,
    avgPaymentTime: 18
  },
  budgets: [
    {
      id: '1',
      name: 'Marketing Budget Q1',
      type: 'department',
      amount: 50000,
      spent: 28000,
      remaining: 22000,
      utilizationRate: 56,
      status: 'on-track'
    },
    {
      id: '2',
      name: 'Development Team Budget',
      type: 'team',
      amount: 75000,
      spent: 45000,
      remaining: 30000,
      utilizationRate: 60,
      status: 'warning'
    },
    {
      id: '3',
      name: 'Office Operations',
      type: 'costCenter',
      amount: 25000,
      spent: 14500,
      remaining: 10500,
      utilizationRate: 58,
      status: 'on-track'
    }
  ],
  alerts: [
    {
      id: '1',
      type: 'budget_warning',
      message: 'Development Team Budget is 60% utilized',
      severity: 'warning',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'invoice_overdue',
      message: '2 invoices are overdue for payment',
      severity: 'critical',
      timestamp: new Date()
    }
  ]
};

export default function FinancialDashboard() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState(mockFinancialData);

  const loadFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual service calls
      // const data = await FinancialService.getDashboardData(currentWorkspace?.id);
      // setFinancialData(data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFinancialData(mockFinancialData);
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Financial Management</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
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
          </p>
        </div>
        <div className="flex gap-3">
          {/* Quick Access Navigation */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/financial/expenses">
                <Receipt className="w-4 h-4 mr-2" />
                Expenses
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/financial/invoices">
                <FileText className="w-4 h-4 mr-2" />
                Invoices
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/financial/budgets">
                <Target className="w-4 h-4 mr-2" />
                Budgets
              </Link>
            </Button>
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
              <DropdownMenuItem asChild>
                <Link href="/dashboard/financial/currency">
                  <Coins className="w-4 h-4 mr-2" />
                  Currency Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/financial/cost-centers">
                  <Building className="w-4 h-4 mr-2" />
                  Cost Centers
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/financial/billing">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing Management
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/financial/reports">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Financial Reports
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialData.overview.totalBudget.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialData.overview.utilizationRate}% utilized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialData.overview.totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly burn: ${financialData.overview.monthlyBurn.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialData.overview.totalRemaining.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(financialData.overview.totalRemaining / financialData.overview.monthlyBurn)} months remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.expenses.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Budget Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Utilization</CardTitle>
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
                  <Progress value={financialData.overview.utilizationRate} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${financialData.overview.totalSpent.toLocaleString()} spent</span>
                    <span>${financialData.overview.totalRemaining.toLocaleString()} remaining</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Expense Categories</CardTitle>
                <CardDescription>Spending breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {financialData.expenses.topCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full bg-primary`} style={{
                          backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                        }} />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          ${category.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {category.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {financialData.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Financial Alerts</CardTitle>
                <CardDescription>Important notifications requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {financialData.alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.timestamp.toLocaleDateString()}
                        </p>
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

        <TabsContent value="budgets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Budget Management</h2>
            <Button>
              <DollarSign className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          </div>

          <div className="grid gap-4">
            {financialData.budgets.map((budget) => (
              <Card key={budget.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{budget.name}</CardTitle>
                    <Badge variant="outline">{budget.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Budget Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {budget.utilizationRate}%
                      </span>
                    </div>
                    <Progress value={budget.utilizationRate} className="h-2" />
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="text-sm font-medium">${budget.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Spent</p>
                        <p className="text-sm font-medium">${budget.spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className="text-sm font-medium">${budget.remaining.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Expense Management</h2>
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData.expenses.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData.expenses.approved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData.expenses.rejected}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${financialData.expenses.totalAmount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Invoice Management</h2>
            <Button>
              <CreditCard className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Draft</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData.invoices.draft}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData.invoices.sent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData.invoices.paid}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {financialData.invoices.overdue}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Financial Analytics</h2>
            <div className="flex gap-2">
              <Button variant="outline">
                <PieChart className="w-4 h-4 mr-2" />
                Chart View
              </Button>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending Trend</CardTitle>
                <CardDescription>Expense trends over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  📊 Chart would be rendered here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actual</CardTitle>
                <CardDescription>Comparison of budgeted vs actual spending</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  📈 Chart would be rendered here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
