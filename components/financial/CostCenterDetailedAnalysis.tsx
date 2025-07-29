'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrency } from '@/hooks/use-currency';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Calendar,
  DollarSign,
  Activity,
  Filter,
  Download
} from 'lucide-react';
import { CostCenter, Expense, Budget } from '@/lib/types/financial-types';

interface CostCenterDetailedAnalysisProps {
  costCenters: CostCenter[];
  expenses: Expense[];
  budgets: Budget[];
  loading?: boolean;
}

interface DetailedMetrics {
  id: string;
  name: string;
  code: string;
  budget: number;
  spent: number;
  remaining: number;
  utilizationPercentage: number;
  monthlyTrend: { month: string; budget: number; spent: number; variance: number }[];
  categoryBreakdown: { category: string; amount: number; percentage: number; trend: 'up' | 'down' | 'stable' }[];
  expenseFrequency: { period: string; count: number; avgAmount: number }[];
  budgetVariance: number;
  forecastedSpend: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  kpis: {
    costPerEmployee: number;
    budgetAccuracy: number;
    spendVelocity: number;
    seasonalVariance: number;
  };
}

export function CostCenterDetailedAnalysis({
  costCenters,
  expenses,
  budgets,
  loading = false
}: CostCenterDetailedAnalysisProps) {
  const { formatAmount } = useCurrency();
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [analysisView, setAnalysisView] = useState<'trends' | 'categories' | 'forecasting' | 'kpis'>('trends');
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y' | '2y'>('6m');

  // Set initial selected center when costCenters are loaded
  React.useEffect(() => {
    if (costCenters.length > 0 && !selectedCenter) {
      setSelectedCenter(costCenters[0].id);
    }
  }, [costCenters, selectedCenter]);

  // Calculate detailed metrics for selected cost center
  const detailedMetrics = useMemo((): DetailedMetrics | null => {
    if (!selectedCenter || costCenters.length === 0) return null;
    const center = costCenters.find(c => c.id === selectedCenter);
    if (!center) return null;

    const centerExpenses = expenses.filter(exp => exp.costCenterId === center.id);
    const centerBudgets = budgets.filter(budget => 
      budget.type === 'costCenter' && budget.entityId === center.id
    );

    const totalBudget = centerBudgets.reduce((sum, budget) => sum + budget.amount, 0) || center.budget || 0;
    const totalSpent = centerExpenses.reduce((sum, exp) => sum + exp.amountInBaseCurrency, 0);
    const remaining = totalBudget - totalSpent;
    const utilizationPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Calculate monthly trend with budget vs actual
    const monthlyTrend = [];
    const now = new Date();
    const monthsToShow = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : timeRange === '1y' ? 12 : 24;
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthExpenses = centerExpenses.filter(exp => {
        const expDate = new Date(exp.expenseDate);
        return expDate.getMonth() === date.getMonth() && 
               expDate.getFullYear() === date.getFullYear();
      });
      const monthSpent = monthExpenses.reduce((sum, exp) => sum + exp.amountInBaseCurrency, 0);
      const monthBudget = totalBudget / 12; // Assuming even distribution
      const variance = monthSpent - monthBudget;
      
      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        budget: monthBudget,
        spent: monthSpent,
        variance
      });
    }

    // Calculate category breakdown with trends
    const categoryTotals: { [key: string]: { current: number; previous: number } } = {};
    const currentDate = new Date();
    const previousPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
    const currentPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    centerExpenses.forEach(exp => {
      const category = exp.category.name;
      const expDate = new Date(exp.expenseDate);
      
      if (!categoryTotals[category]) {
        categoryTotals[category] = { current: 0, previous: 0 };
      }
      
      if (expDate >= currentPeriodStart) {
        categoryTotals[category].current += exp.amountInBaseCurrency;
      } else if (expDate >= previousPeriodStart && expDate < currentPeriodStart) {
        categoryTotals[category].previous += exp.amountInBaseCurrency;
      }
    });

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([category, amounts]) => {
        const total = amounts.current + amounts.previous;
        const percentage = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
        let trend: 'up' | 'down' | 'stable' = 'stable';
        
        if (amounts.previous > 0) {
          const change = (amounts.current - amounts.previous) / amounts.previous;
          if (change > 0.1) trend = 'up';
          else if (change < -0.1) trend = 'down';
        }
        
        return {
          category,
          amount: total,
          percentage,
          trend
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    // Calculate expense frequency
    const expenseFrequency = monthlyTrend.map(month => ({
      period: month.month,
      count: centerExpenses.filter(exp => {
        const expDate = new Date(exp.expenseDate);
        const monthDate = new Date(month.month + ' 01');
        return expDate.getMonth() === monthDate.getMonth() && 
               expDate.getFullYear() === monthDate.getFullYear();
      }).length,
      avgAmount: month.spent / Math.max(1, centerExpenses.filter(exp => {
        const expDate = new Date(exp.expenseDate);
        const monthDate = new Date(month.month + ' 01');
        return expDate.getMonth() === monthDate.getMonth() && 
               expDate.getFullYear() === monthDate.getFullYear();
      }).length)
    }));

    // Calculate budget variance
    const budgetVariance = totalBudget > 0 ? ((totalSpent - totalBudget) / totalBudget) * 100 : 0;

    // Simple forecasting based on trend
    const recentMonths = monthlyTrend.slice(-3);
    const avgMonthlySpend = recentMonths.reduce((sum, month) => sum + month.spent, 0) / recentMonths.length;
    const forecastedSpend = totalSpent + (avgMonthlySpend * 3); // Next 3 months

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (utilizationPercentage > 100 || budgetVariance > 20) {
      riskLevel = 'high';
    } else if (utilizationPercentage > 85 || budgetVariance > 10) {
      riskLevel = 'medium';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (utilizationPercentage > 100) {
      recommendations.push('Budget exceeded - immediate cost control measures needed');
    }
    if (budgetVariance > 15) {
      recommendations.push('High budget variance - review forecasting accuracy');
    }
    if (categoryBreakdown.some(cat => cat.trend === 'up' && cat.percentage > 30)) {
      recommendations.push('Monitor high-growth expense categories');
    }
    if (avgMonthlySpend > totalBudget / 12 * 1.2) {
      recommendations.push('Monthly spend rate exceeds budget allocation');
    }
    if (recommendations.length === 0) {
      recommendations.push('Cost center performance is within acceptable parameters');
    }

    // Calculate KPIs
    const kpis = {
      costPerEmployee: 0, // TODO: Get actual employee count
      budgetAccuracy: Math.max(0, 100 - Math.abs(budgetVariance)),
      spendVelocity: avgMonthlySpend,
      seasonalVariance: monthlyTrend.length > 0 ? 
        (Math.max(...monthlyTrend.map(m => m.spent)) - Math.min(...monthlyTrend.map(m => m.spent))) / avgMonthlySpend * 100 : 0
    };

    return {
      id: center.id,
      name: center.name,
      code: center.code,
      budget: totalBudget,
      spent: totalSpent,
      remaining,
      utilizationPercentage,
      monthlyTrend,
      categoryBreakdown,
      expenseFrequency,
      budgetVariance,
      forecastedSpend,
      riskLevel,
      recommendations,
      kpis
    };
  }, [selectedCenter, costCenters, expenses, budgets, timeRange]);

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBadgeVariant = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="card-enhanced">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-32 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Show empty state if no cost centers
  if (costCenters.length === 0) {
    return (
      <Card className="card-enhanced">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No Cost Centers Found</h3>
              <p className="text-muted-foreground">
                Create cost centers to view detailed analysis and insights.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message if no detailed metrics available
  if (!detailedMetrics) {
    return (
      <Card className="card-enhanced">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No Data Available</h3>
              <p className="text-muted-foreground">
                Select a cost center to view detailed analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Detailed Cost Center Analysis</h2>
          <p className="text-muted-foreground">
            In-depth performance analysis and insights for {detailedMetrics.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCenter} onValueChange={setSelectedCenter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select cost center" />
            </SelectTrigger>
            <SelectContent>
              {costCenters.map(center => (
                <SelectItem key={center.id} value={center.id}>
                  {center.name} ({center.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="2y">2 Years</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {detailedMetrics.utilizationPercentage.toFixed(1)}%
            </div>
            <Progress value={Math.min(detailedMetrics.utilizationPercentage, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
            {detailedMetrics.budgetVariance > 0 ? 
              <TrendingUp className="h-4 w-4 text-red-500" /> : 
              <TrendingDown className="h-4 w-4 text-green-500" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              detailedMetrics.budgetVariance > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {detailedMetrics.budgetVariance > 0 ? '+' : ''}{detailedMetrics.budgetVariance.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs. planned budget
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${getRiskColor(detailedMetrics.riskLevel)}`} />
          </CardHeader>
          <CardContent>
            <Badge variant={getRiskBadgeVariant(detailedMetrics.riskLevel)} className="text-sm">
              {detailedMetrics.riskLevel.toUpperCase()}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Based on current trends
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecasted Spend</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(detailedMetrics.forecastedSpend)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Next 3 months projection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Tabs */}
      <Tabs value={analysisView} onValueChange={(value: any) => setAnalysisView(value)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends & Patterns</TabsTrigger>
          <TabsTrigger value="categories">Category Analysis</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="kpis">KPIs & Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Monthly Spending Trends</CardTitle>
              <CardDescription>
                Budget vs actual spending over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detailedMetrics.monthlyTrend.map((month, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Budget: {formatAmount(month.budget)}
                        </span>
                        <span className={month.variance > 0 ? 'text-red-600' : 'text-green-600'}>
                          Actual: {formatAmount(month.spent)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Progress 
                          value={month.budget > 0 ? (month.spent / month.budget) * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                      <span className={`text-xs ${
                        month.variance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {month.variance > 0 ? '+' : ''}{formatAmount(month.variance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Expense Category Breakdown</CardTitle>
              <CardDescription>
                Spending distribution and trends by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detailedMetrics.categoryBreakdown.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{category.category}</span>
                        {category.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                        {category.trend === 'down' && <TrendingDown className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span>{formatAmount(category.amount)}</span>
                        <span className="text-muted-foreground">
                          ({category.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Spending Forecast</CardTitle>
              <CardDescription>
                Projected spending based on current trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatAmount(detailedMetrics.forecastedSpend)}
                    </div>
                    <p className="text-sm text-muted-foreground">3-Month Forecast</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatAmount(detailedMetrics.kpis.spendVelocity)}
                    </div>
                    <p className="text-sm text-muted-foreground">Monthly Velocity</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {detailedMetrics.kpis.budgetAccuracy.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Budget Accuracy</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Recommendations</h4>
                  <div className="space-y-2">
                    {detailedMetrics.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Performance KPIs</CardTitle>
                <CardDescription>
                  Key performance indicators for cost center efficiency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Budget Accuracy</span>
                    <span className="text-sm font-bold">
                      {detailedMetrics.kpis.budgetAccuracy.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={detailedMetrics.kpis.budgetAccuracy} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Spend Velocity</span>
                    <span className="text-sm font-bold">
                      {formatAmount(detailedMetrics.kpis.spendVelocity)}/month
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Seasonal Variance</span>
                    <span className="text-sm font-bold">
                      {detailedMetrics.kpis.seasonalVariance.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Expense Frequency</CardTitle>
                <CardDescription>
                  Transaction patterns and average amounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {detailedMetrics.expenseFrequency.slice(-6).map((freq, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{freq.period}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold">{freq.count} expenses</div>
                        <div className="text-xs text-muted-foreground">
                          Avg: {formatAmount(freq.avgAmount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}