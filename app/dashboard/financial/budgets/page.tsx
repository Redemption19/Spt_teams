'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Calendar, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock budget data for demonstration
const mockBudgets = [
  {
    id: '1',
    name: 'Marketing Department Q1 2024',
    description: 'Marketing budget for first quarter',
    totalAmount: 50000,
    spentAmount: 32500,
    currency: 'USD',
    period: 'quarterly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    status: 'active' as const,
    alertThreshold: 80,
    categories: [
      { name: 'Digital Advertising', allocated: 25000, spent: 18500 },
      { name: 'Content Creation', allocated: 15000, spent: 8000 },
      { name: 'Events & Conferences', allocated: 10000, spent: 6000 }
    ],
    costCenters: ['marketing', 'digital-team']
  },
  {
    id: '2',
    name: 'IT Infrastructure 2024',
    description: 'Annual IT infrastructure and software budget',
    totalAmount: 120000,
    spentAmount: 45000,
    currency: 'USD',
    period: 'annual',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    status: 'active' as const,
    alertThreshold: 75,
    categories: [
      { name: 'Software Licenses', allocated: 60000, spent: 25000 },
      { name: 'Hardware', allocated: 40000, spent: 15000 },
      { name: 'Cloud Services', allocated: 20000, spent: 5000 }
    ],
    costCenters: ['it-department']
  },
  {
    id: '3',
    name: 'Travel & Expenses Q4 2023',
    description: 'Employee travel and business expenses',
    totalAmount: 30000,
    spentAmount: 28500,
    currency: 'USD',
    period: 'quarterly',
    startDate: new Date('2023-10-01'),
    endDate: new Date('2023-12-31'),
    status: 'completed' as const,
    alertThreshold: 90,
    categories: [
      { name: 'Employee Travel', allocated: 20000, spent: 19000 },
      { name: 'Client Entertainment', allocated: 10000, spent: 9500 }
    ],
    costCenters: ['sales', 'business-development']
  }
];

const mockCostCenters = [
  { id: 'marketing', name: 'Marketing Department', manager: 'Sarah Johnson' },
  { id: 'digital-team', name: 'Digital Marketing Team', manager: 'Mike Chen' },
  { id: 'it-department', name: 'IT Department', manager: 'David Wilson' },
  { id: 'sales', name: 'Sales Department', manager: 'Emily Davis' },
  { id: 'business-development', name: 'Business Development', manager: 'Alex Thompson' }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'overbudget':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getBudgetStatus = (spent: number, total: number, threshold: number) => {
  const percentage = (spent / total) * 100;
  if (percentage >= 100) return 'overbudget';
  if (percentage >= threshold) return 'warning';
  return 'on-track';
};

const getBudgetStatusColor = (status: string) => {
  switch (status) {
    case 'on-track':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'overbudget':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

const getBudgetStatusIcon = (status: string) => {
  switch (status) {
    case 'on-track':
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    case 'overbudget':
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    default:
      return <Target className="w-4 h-4 text-gray-600" />;
  }
};

export default function BudgetPage() {
  const [activeTab, setActiveTab] = useState('budgets');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredBudgets = mockBudgets.filter(budget => {
    const matchesPeriod = selectedPeriod === 'all' || budget.period === selectedPeriod;
    const matchesStatus = selectedStatus === 'all' || budget.status === selectedStatus;
    return matchesPeriod && matchesStatus;
  });

  const totalBudgetAmount = filteredBudgets.reduce((sum, budget) => sum + budget.totalAmount, 0);
  const totalSpentAmount = filteredBudgets.reduce((sum, budget) => sum + budget.spentAmount, 0);
  const totalRemaining = totalBudgetAmount - totalSpentAmount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budget Management</h1>
          <p className="text-muted-foreground">
            Monitor and control your department and project budgets
          </p>
        </div>
        <Button className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Create Budget
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudgetAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {filteredBudgets.length} budgets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalSpentAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((totalSpentAmount / totalBudgetAmount) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalRemaining.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Available to spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredBudgets.filter(b => b.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently tracking
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="budgets">Budget Overview</TabsTrigger>
          <TabsTrigger value="cost-centers">Cost Centers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Periods</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Budget List */}
          <div className="space-y-4">
            {filteredBudgets.map((budget) => {
              const percentage = (budget.spentAmount / budget.totalAmount) * 100;
              const budgetStatus = getBudgetStatus(budget.spentAmount, budget.totalAmount, budget.alertThreshold);
              
              return (
                <Card key={budget.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{budget.name}</CardTitle>
                        <CardDescription>{budget.description}</CardDescription>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(budget.status)}>
                            {budget.status}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {budget.period}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-1">
                          {getBudgetStatusIcon(budgetStatus)}
                          <span className={`text-sm font-medium ${getBudgetStatusColor(budgetStatus)}`}>
                            {budgetStatus === 'on-track' && 'On Track'}
                            {budgetStatus === 'warning' && 'Near Limit'}
                            {budgetStatus === 'overbudget' && 'Over Budget'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {budget.startDate.toLocaleDateString()} - {budget.endDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Budget Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Budget Progress</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Spent: ${budget.spentAmount.toLocaleString()}</span>
                          <span>Total: ${budget.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Category Breakdown */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Category Breakdown</h4>
                        <div className="space-y-2">
                          {budget.categories.map((category, index) => {
                            const categoryPercentage = (category.spent / category.allocated) * 100;
                            return (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>{category.name}</span>
                                  <span>{categoryPercentage.toFixed(1)}%</span>
                                </div>
                                <Progress value={categoryPercentage} className="h-1" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>${category.spent.toLocaleString()} spent</span>
                                  <span>${category.allocated.toLocaleString()} allocated</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cost Centers */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Associated Cost Centers</h4>
                        <div className="flex flex-wrap gap-1">
                          {budget.costCenters.map((costCenterId) => {
                            const costCenter = mockCostCenters.find(cc => cc.id === costCenterId);
                            return (
                              <Badge key={costCenterId} variant="secondary" className="text-xs">
                                {costCenter?.name || costCenterId}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between pt-2 border-t">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit Budget
                          </Button>
                        </div>
                        <Button variant="outline" size="sm">
                          Export Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="cost-centers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Centers</CardTitle>
              <CardDescription>
                Manage organizational cost centers and their budget allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCostCenters.map((costCenter) => {
                  const relatedBudgets = mockBudgets.filter(budget => 
                    budget.costCenters.includes(costCenter.id)
                  );
                  const totalAllocated = relatedBudgets.reduce((sum, budget) => sum + budget.totalAmount, 0);
                  const totalSpent = relatedBudgets.reduce((sum, budget) => sum + budget.spentAmount, 0);
                  
                  return (
                    <div key={costCenter.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{costCenter.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Manager: {costCenter.manager}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            ${totalAllocated.toLocaleString()} allocated
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${totalSpent.toLocaleString()} spent
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Budget Utilization</span>
                          <span>{totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) : 0}%</span>
                        </div>
                        <Progress value={totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0} className="h-2" />
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <div className="text-sm text-muted-foreground">
                          {relatedBudgets.length} active budgets
                        </div>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Budget Analytics</CardTitle>
              <CardDescription>
                Comprehensive budget performance and trend analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Budget analytics dashboard coming soon...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This will include spending trends, variance analysis, and forecasting
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
