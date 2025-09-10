'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useCurrency } from '@/hooks/use-currency';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Wallet,
  Users,
  Activity,
  Download,
  Filter
} from 'lucide-react';
import { CostCenter, Expense, Budget } from '@/lib/types/financial-types';

interface CostCenterComparisonProps {
  costCenters: CostCenter[];
  expenses: Expense[];
  budgets: Budget[];
  loading?: boolean;
}

interface ComparisonMetrics {
  id: string;
  name: string;
  code: string;
  budget: number;
  spent: number;
  utilizationPercentage: number;
  efficiency: number;
  expenseCount: number;
  avgExpenseAmount: number;
  monthlyAverage: number;
  rank: number;
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

export function CostCenterComparison({
  costCenters,
  expenses,
  budgets,
  loading = false
}: CostCenterComparisonProps) {
  const { formatAmount } = useCurrency();
  const [selectedCenters, setSelectedCenters] = useState<string[]>(
    costCenters.slice(0, 4).map(c => c.id)
  );
  const [comparisonMetric, setComparisonMetric] = useState<'utilization' | 'efficiency' | 'spending' | 'variance'>('utilization');
  const [sortBy, setSortBy] = useState<'name' | 'budget' | 'spent' | 'utilization' | 'efficiency'>('utilization');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Calculate comparison metrics
  const comparisonData = useMemo((): ComparisonMetrics[] => {
    const metrics = costCenters.map(center => {
      const centerExpenses = expenses.filter(exp => exp.costCenterId === center.id);
      const centerBudgets = budgets.filter(budget => 
        budget.type === 'costCenter' && budget.entityId === center.id
      );

      const totalBudget = centerBudgets.reduce((sum, budget) => sum + budget.amount, 0) || center.budget || 0;
      const totalSpent = centerExpenses.reduce((sum, exp) => sum + exp.amountInBaseCurrency, 0);
      const utilizationPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
      const efficiency = totalBudget > 0 ? (centerExpenses.length / totalBudget) * 1000 : 0;
      const avgExpenseAmount = centerExpenses.length > 0 ? totalSpent / centerExpenses.length : 0;
      
      // Calculate monthly average
      const now = new Date();
      const monthsBack = 6;
      const monthlyTotals = [];
      
      for (let i = monthsBack - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthExpenses = centerExpenses.filter(exp => {
          const expDate = new Date(exp.expenseDate);
          return expDate.getMonth() === date.getMonth() && 
                 expDate.getFullYear() === date.getFullYear();
        });
        const monthTotal = monthExpenses.reduce((sum, exp) => sum + exp.amountInBaseCurrency, 0);
        monthlyTotals.push(monthTotal);
      }
      
      const monthlyAverage = monthlyTotals.reduce((sum, total) => sum + total, 0) / monthsBack;
      
      // Determine performance rating
      let performance: 'excellent' | 'good' | 'average' | 'poor' = 'average';
      if (utilizationPercentage <= 90 && utilizationPercentage >= 70) {
        performance = 'excellent';
      } else if (utilizationPercentage <= 100 && utilizationPercentage > 90) {
        performance = 'good';
      } else if (utilizationPercentage > 100) {
        performance = 'poor';
      }

      return {
        id: center.id,
        name: center.name,
        code: center.code,
        budget: totalBudget,
        spent: totalSpent,
        utilizationPercentage,
        efficiency,
        expenseCount: centerExpenses.length,
        avgExpenseAmount,
        monthlyAverage,
        rank: 0, // Will be calculated after sorting
        performance
      };
    });

    // Sort and assign ranks
    const sorted = [...metrics].sort((a, b) => {
      const aValue = a[sortBy as keyof ComparisonMetrics] as number;
      const bValue = b[sortBy as keyof ComparisonMetrics] as number;
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    sorted.forEach((item, index) => {
      item.rank = index + 1;
    });

    return sorted;
  }, [costCenters, expenses, budgets, sortBy, sortOrder]);

  const filteredData = comparisonData.filter(center => 
    selectedCenters.includes(center.id)
  );

  const handleCenterToggle = (centerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCenters(prev => [...prev, centerId]);
    } else {
      setSelectedCenters(prev => prev.filter(id => id !== centerId));
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'average': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'average': return 'outline';
      case 'poor': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cost Center Comparison</h2>
          <p className="text-muted-foreground">
            Compare performance metrics across multiple cost centers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={comparisonMetric} onValueChange={(value: any) => setComparisonMetric(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="utilization">Utilization</SelectItem>
              <SelectItem value="efficiency">Efficiency</SelectItem>
              <SelectItem value="spending">Spending</SelectItem>
              <SelectItem value="variance">Variance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="spent">Spent</SelectItem>
              <SelectItem value="utilization">Utilization</SelectItem>
              <SelectItem value="efficiency">Efficiency</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Cost Center Selection */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="text-lg">Select Cost Centers</CardTitle>
            <CardDescription>
              Choose centers to compare (max 8)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comparisonData.map(center => (
                <div key={center.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={center.id}
                    checked={selectedCenters.includes(center.id)}
                    onCheckedChange={(checked) => 
                      handleCenterToggle(center.id, checked as boolean)
                    }
                    disabled={!selectedCenters.includes(center.id) && selectedCenters.length >= 8}
                  />
                  <label
                    htmlFor={center.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    <div>
                      <div>{center.name}</div>
                      <div className="text-xs text-muted-foreground">{center.code}</div>
                    </div>
                  </label>
                  <Badge variant={getPerformanceBadge(center.performance)} className="ml-auto">
                    #{center.rank}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparison Results */}
        <div className="lg:col-span-3 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="card-enhanced">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Total Budget</p>
                    <p className="text-2xl font-bold">
                      {formatAmount(filteredData.reduce((sum, center) => sum + center.budget, 0))}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-enhanced">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Total Spent</p>
                    <p className="text-2xl font-bold">
                      {formatAmount(filteredData.reduce((sum, center) => sum + center.spent, 0))}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-enhanced">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Avg Utilization</p>
                    <p className="text-2xl font-bold">
                      {filteredData.length > 0 ? 
                        (filteredData.reduce((sum, center) => sum + center.utilizationPercentage, 0) / filteredData.length).toFixed(1)
                        : '0'
                      }%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-enhanced">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Centers</p>
                    <p className="text-2xl font-bold">{filteredData.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Comparison */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>
                Side-by-side comparison of selected cost centers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredData.map(center => (
                  <div key={center.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{center.name}</h3>
                        <p className="text-sm text-muted-foreground">{center.code}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPerformanceBadge(center.performance)}>
                          {center.performance}
                        </Badge>
                        <Badge variant="outline">Rank #{center.rank}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Budget</p>
                        <p className="text-lg font-bold">{formatAmount(center.budget)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Spent</p>
                        <p className="text-lg font-bold">{formatAmount(center.spent)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Utilization</p>
                        <p className={`text-lg font-bold ${getPerformanceColor(center.performance)}`}>
                          {center.utilizationPercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Efficiency</p>
                        <p className="text-lg font-bold">{center.efficiency.toFixed(1)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Budget Utilization</span>
                        <span className="text-sm text-muted-foreground">
                          {center.utilizationPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(center.utilizationPercentage, 100)} 
                        className="h-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{center.expenseCount}</p>
                        <p className="text-muted-foreground">Total Expenses</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{formatAmount(center.avgExpenseAmount)}</p>
                        <p className="text-muted-foreground">Avg Expense</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{formatAmount(center.monthlyAverage)}</p>
                        <p className="text-muted-foreground">Monthly Avg</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ranking Table */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Performance Rankings</CardTitle>
              <CardDescription>
                All cost centers ranked by {sortBy}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Rank</th>
                      <th className="text-left p-2">Cost Center</th>
                      <th className="text-right p-2">Budget</th>
                      <th className="text-right p-2">Spent</th>
                      <th className="text-right p-2">Utilization</th>
                      <th className="text-right p-2">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.slice(0, 10).map(center => (
                      <tr key={center.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <Badge variant="outline">#{center.rank}</Badge>
                        </td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{center.name}</div>
                            <div className="text-sm text-muted-foreground">{center.code}</div>
                          </div>
                        </td>
                        <td className="p-2 text-right">{formatAmount(center.budget)}</td>
                        <td className="p-2 text-right">{formatAmount(center.spent)}</td>
                        <td className="p-2 text-right">
                          <span className={getPerformanceColor(center.performance)}>
                            {center.utilizationPercentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <Badge variant={getPerformanceBadge(center.performance)}>
                            {center.performance}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}