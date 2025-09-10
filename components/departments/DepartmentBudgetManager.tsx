'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Calendar,
  PieChart,
  BarChart3,
  Plus,
  Download,
  Settings,
  Loader2
} from 'lucide-react';
import { BudgetTrackingService } from '@/lib/budget-tracking-service';
import { Budget, BudgetAlert } from '@/lib/types/financial-types';
import { Department } from '@/lib/department-service';
import { useWorkspace } from '@/lib/workspace-context';
import { useCurrency } from '@/hooks/use-currency';
import { formatDate } from '@/lib/utils';

interface DepartmentBudgetManagerProps {
  department: Department;
  onBudgetUpdated?: () => void;
}

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  utilizationPercentage: number;
  activeBudgets: number;
  alertsCount: number;
}

export default function DepartmentBudgetManager({ 
  department, 
  onBudgetUpdated 
}: DepartmentBudgetManagerProps) {
  const { currentWorkspace } = useWorkspace();
  const { getCurrencySymbol, formatAmount } = useCurrency();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartmentBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentWorkspace?.id) {
        throw new Error('Workspace not found');
      }

      // Fetch department budgets
      const departmentBudgets = await BudgetTrackingService.getWorkspaceBudgets(
        currentWorkspace.id,
        {
          type: 'department',
          entityId: department.id,
          isActive: true
        }
      );

      setBudgets(departmentBudgets);
      
      // Calculate budget summary
      const summary = calculateBudgetSummary(departmentBudgets);
      setBudgetSummary(summary);
    } catch (err) {
      console.error('Error fetching department budgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, department.id]);

  useEffect(() => {
    if (currentWorkspace?.id && department.id) {
      fetchDepartmentBudgets();
    }
  }, [currentWorkspace?.id, department.id, fetchDepartmentBudgets]);

  const calculateBudgetSummary = (budgets: Budget[]): BudgetSummary => {
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
    const totalRemaining = budgets.reduce((sum, budget) => sum + budget.remaining, 0);
    const utilizationPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const activeBudgets = budgets.filter(budget => budget.isActive).length;
    const alertsCount = budgets.reduce((sum, budget) => 
      sum + budget.alerts.filter(alert => alert.triggered).length, 0
    );

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      utilizationPercentage,
      activeBudgets,
      alertsCount
    };
  };

  const getBudgetStatus = (budget: Budget) => {
    const utilization = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
    
    if (utilization >= 100) return { status: 'over-budget', color: 'bg-red-500', label: 'Over Budget' };
    if (utilization >= 90) return { status: 'critical', color: 'bg-red-400', label: 'Critical' };
    if (utilization >= 75) return { status: 'warning', color: 'bg-yellow-500', label: 'Warning' };
    return { status: 'on-track', color: 'bg-green-500', label: 'On Track' };
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleCreateBudget = () => {
    // Navigate to budget creation page
    window.location.href = `/dashboard/financial/budgets/create?type=department&entityId=${department.id}`;
  };

  const handleExportBudgets = () => {
    // Implement budget export functionality
    console.log('Exporting department budgets...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading budget data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Error Loading Budget Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchDepartmentBudgets} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!budgetSummary || budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Department Budget</CardTitle>
          <CardDescription>
            No budgets have been created for this department yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Budget Allocated</h3>
            <p className="text-muted-foreground mb-4">
              Create a budget to start tracking department expenses and spending.
            </p>
            <Button onClick={handleCreateBudget}>
              <Plus className="h-4 w-4 mr-2" />
              Create Budget
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(budgetSummary.totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">
              {budgetSummary.activeBudgets} active budget{budgetSummary.activeBudgets !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(budgetSummary.totalSpent)}
            </div>
            <p className={`text-xs ${getUtilizationColor(budgetSummary.utilizationPercentage)}`}>
              {budgetSummary.utilizationPercentage.toFixed(1)}% utilized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(budgetSummary.totalRemaining)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available to spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {budgetSummary.alertsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Active alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Details */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="budgets">Budget Details</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportBudgets}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={handleCreateBudget}>
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Utilization</CardTitle>
              <CardDescription>
                Overall spending progress across all department budgets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Progress</span>
                  <span className={getUtilizationColor(budgetSummary.utilizationPercentage)}>
                    {budgetSummary.utilizationPercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(budgetSummary.utilizationPercentage, 100)} 
                  className="h-2"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Allocated</p>
                  <p className="text-lg font-semibold">{formatAmount(budgetSummary.totalBudget)}</p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className="text-lg font-semibold">{formatAmount(budgetSummary.totalSpent)}</p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-lg font-semibold">{formatAmount(budgetSummary.totalRemaining)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <div className="grid gap-4">
            {budgets.map((budget) => {
              const status = getBudgetStatus(budget);
              const utilization = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
              
              return (
                <Card key={budget.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{budget.name}</CardTitle>
                        <CardDescription>
                          {budget.period} • {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                        </CardDescription>
                      </div>
                      <Badge variant={status.status === 'on-track' ? 'default' : 'destructive'}>
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Utilization</span>
                        <span className={getUtilizationColor(utilization)}>
                          {utilization.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={Math.min(utilization, 100)} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-semibold">{formatAmount(budget.amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Spent</p>
                        <p className="font-semibold">{formatAmount(budget.spent)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className="font-semibold">{formatAmount(budget.remaining)}</p>
                      </div>
                    </div>
                    
                    {budget.description && (
                      <p className="text-sm text-muted-foreground">{budget.description}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {budgets.some(budget => budget.alerts.some(alert => alert.triggered)) ? (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const triggeredAlerts = budget.alerts.filter(alert => alert.triggered);
                if (triggeredAlerts.length === 0) return null;
                
                return (
                  <Card key={budget.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        {budget.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {triggeredAlerts.map((alert) => (
                          <div key={alert.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-800">{alert.message}</p>
                              <p className="text-xs text-red-600 mt-1">
                                Threshold: {alert.threshold}% • Type: {alert.type}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">No Active Alerts</h3>
                  <p className="text-muted-foreground">
                    All department budgets are within their allocated thresholds.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}