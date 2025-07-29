'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  AlertTriangle,
  Calendar,
  PieChart,
  Activity,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { CostCenterDetailedAnalysis } from './CostCenterDetailedAnalysis';
import { CostCenterComparison } from './CostCenterComparison';
import { CostCenter, Expense, Budget } from '@/lib/types/financial-types';
import { useCurrency } from '@/hooks/use-currency';
import { toast } from 'sonner';

interface CostCenterAnalyticsProps {
  costCenters: CostCenter[];
  expenses: Expense[];
  budgets: Budget[];
  loading?: boolean;
  onRefresh?: () => void;
}

interface CostCenterMetrics {
  id: string;
  name: string;
  code: string;
  budget: number;
  spent: number;
  remaining: number;
  utilizationPercentage: number;
  employeeCount: number;
  projectCount: number;
  expenseCount: number;
  avgExpenseAmount: number;
  monthlyTrend: { month: string; amount: number }[];
  topCategories: { category: string; amount: number; percentage: number }[];
  status: 'healthy' | 'warning' | 'critical';
  efficiency: number;
}

interface AnalyticsSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallUtilization: number;
  activeCostCenters: number;
  overBudgetCenters: number;
  underUtilizedCenters: number;
  avgEfficiency: number;
}

export function CostCenterAnalytics({
  costCenters,
  expenses,
  budgets,
  loading = false,
  onRefresh
}: CostCenterAnalyticsProps) {
  const { formatAmount, defaultCurrency } = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState<'1m' | '3m' | '6m' | '1y'>('3m');
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'comparison'>('overview');

  // Calculate cost center metrics
  const costCenterMetrics = useMemo((): CostCenterMetrics[] => {
    return costCenters.map(center => {
      const centerExpenses = expenses.filter(exp => exp.costCenterId === center.id);
      const centerBudgets = budgets.filter(budget => 
        budget.type === 'costCenter' && budget.entityId === center.id
      );
      
      const totalBudget = centerBudgets.reduce((sum, budget) => sum + budget.amount, 0) || center.budget || 0;
      const totalSpent = centerExpenses.reduce((sum, exp) => sum + exp.amountInBaseCurrency, 0);
      const remaining = totalBudget - totalSpent;
      const utilizationPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
      
      // Calculate monthly trend (last 6 months)
      const monthlyTrend = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthExpenses = centerExpenses.filter(exp => {
          const expDate = new Date(exp.expenseDate);
          return expDate.getMonth() === date.getMonth() && 
                 expDate.getFullYear() === date.getFullYear();
        });
        const monthAmount = monthExpenses.reduce((sum, exp) => sum + exp.amountInBaseCurrency, 0);
        monthlyTrend.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          amount: monthAmount
        });
      }
      
      // Calculate top categories
      const categoryTotals: { [key: string]: number } = {};
      centerExpenses.forEach(exp => {
        const category = exp.category.name;
        categoryTotals[category] = (categoryTotals[category] || 0) + exp.amountInBaseCurrency;
      });
      
      const topCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
        }));
      
      // Determine status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (utilizationPercentage > 100) {
        status = 'critical';
      } else if (utilizationPercentage > 85) {
        status = 'warning';
      }
      
      // Calculate efficiency (expenses per budget unit)
      const efficiency = totalBudget > 0 ? (centerExpenses.length / totalBudget) * 1000 : 0;
      
      return {
        id: center.id,
        name: center.name,
        code: center.code,
        budget: totalBudget,
        spent: totalSpent,
        remaining,
        utilizationPercentage,
        employeeCount: 0, // TODO: Get from actual employee data
        projectCount: 0, // TODO: Get from actual project data
        expenseCount: centerExpenses.length,
        avgExpenseAmount: centerExpenses.length > 0 ? totalSpent / centerExpenses.length : 0,
        monthlyTrend,
        topCategories,
        status,
        efficiency
      };
    });
  }, [costCenters, expenses, budgets]);

  // Calculate summary analytics
  const analyticsSummary = useMemo((): AnalyticsSummary => {
    const totalBudget = costCenterMetrics.reduce((sum, center) => sum + center.budget, 0);
    const totalSpent = costCenterMetrics.reduce((sum, center) => sum + center.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const activeCostCenters = costCenters.filter(center => center.isActive).length;
    const overBudgetCenters = costCenterMetrics.filter(center => center.utilizationPercentage > 100).length;
    const underUtilizedCenters = costCenterMetrics.filter(center => center.utilizationPercentage < 50).length;
    const avgEfficiency = costCenterMetrics.length > 0 ? 
      costCenterMetrics.reduce((sum, center) => sum + center.efficiency, 0) / costCenterMetrics.length : 0;
    
    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallUtilization,
      activeCostCenters,
      overBudgetCenters,
      underUtilizedCenters,
      avgEfficiency
    };
  }, [costCenterMetrics, costCenters]);

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredMetrics = selectedCostCenter === 'all' 
    ? costCenterMetrics 
    : costCenterMetrics.filter(center => center.id === selectedCostCenter);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="card-enhanced">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-8 bg-muted rounded animate-pulse" />
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cost Center Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive overview of cost center performance and budget utilization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(analyticsSummary.totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {analyticsSummary.activeCostCenters} active centers
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatAmount(analyticsSummary.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsSummary.overallUtilization.toFixed(1)}% of total budget
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {analyticsSummary.overBudgetCenters}
            </div>
            <p className="text-xs text-muted-foreground">
              Cost centers over budget
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analyticsSummary.avgEfficiency.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average efficiency rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>
          
          <Select value={selectedCostCenter} onValueChange={setSelectedCostCenter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select cost center" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cost Centers</SelectItem>
              {costCenters.map(center => (
                <SelectItem key={center.id} value={center.id}>
                  {center.name} ({center.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="overview" className="space-y-4">
          {/* Budget Utilization Overview */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Budget Utilization Overview</CardTitle>
              <CardDescription>
                Real-time budget utilization across all cost centers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Utilization</span>
                  <span className="text-sm text-muted-foreground">
                    {analyticsSummary.overallUtilization.toFixed(1)}%
                  </span>
                </div>
                <Progress value={analyticsSummary.overallUtilization} className="h-3" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analyticsSummary.activeCostCenters - analyticsSummary.overBudgetCenters - analyticsSummary.underUtilizedCenters}
                    </div>
                    <p className="text-sm text-muted-foreground">Healthy Centers</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {analyticsSummary.underUtilizedCenters}
                    </div>
                    <p className="text-sm text-muted-foreground">Under-utilized</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {analyticsSummary.overBudgetCenters}
                    </div>
                    <p className="text-sm text-muted-foreground">Over Budget</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Center Performance Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredMetrics.map(center => (
              <Card key={center.id} className="card-enhanced">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{center.name}</CardTitle>
                      <CardDescription>{center.code}</CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(center.status)}>
                      {center.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="text-lg font-semibold">
                        {formatAmount(center.budget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className={`text-lg font-semibold ${getStatusColor(center.status)}`}>
                        {formatAmount(center.spent)}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Utilization</span>
                      <span className="text-sm text-muted-foreground">
                        {center.utilizationPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(center.utilizationPercentage, 100)} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Expenses</p>
                      <p className="text-sm font-medium">{center.expenseCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Amount</p>
                      <p className="text-sm font-medium">
                        {formatAmount(center.avgExpenseAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                      <p className="text-sm font-medium">{center.efficiency.toFixed(1)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <CostCenterDetailedAnalysis
            costCenters={costCenters}
            expenses={expenses}
            budgets={budgets}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <CostCenterComparison
            costCenters={costCenters}
            expenses={expenses}
            budgets={budgets}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}