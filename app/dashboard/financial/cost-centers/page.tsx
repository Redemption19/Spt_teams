'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Target,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';

// Mock cost center data for demonstration
const mockCostCenters = [
  {
    id: 'cc-001',
    name: 'Marketing Department',
    code: 'MKT-001',
    description: 'Marketing and advertising activities',
    workspaceId: 'ws-001',
    departmentId: 'dept-001',
    managerId: 'user-001',
    managerName: 'Sarah Johnson',
    budget: 50000,
    budgetPeriod: 'quarterly' as const,
    currentSpent: 32500,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    projects: 8,
    teams: 3,
    employees: 12,
    lastActivity: new Date('2024-01-20')
  },
  {
    id: 'cc-002',
    name: 'IT Infrastructure',
    code: 'IT-001',
    description: 'Technology infrastructure and software licensing',
    workspaceId: 'ws-001',
    departmentId: 'dept-002',
    managerId: 'user-002',
    managerName: 'David Wilson',
    budget: 120000,
    budgetPeriod: 'yearly' as const,
    currentSpent: 45000,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-18'),
    projects: 5,
    teams: 2,
    employees: 8,
    lastActivity: new Date('2024-01-21')
  },
  {
    id: 'cc-003',
    name: 'Sales Operations',
    code: 'SAL-001',
    description: 'Sales team operations and client management',
    workspaceId: 'ws-001',
    departmentId: 'dept-003',
    managerId: 'user-003',
    managerName: 'Emily Davis',
    budget: 75000,
    budgetPeriod: 'quarterly' as const,
    currentSpent: 68200,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-19'),
    projects: 12,
    teams: 4,
    employees: 18,
    lastActivity: new Date('2024-01-22')
  },
  {
    id: 'cc-004',
    name: 'Research & Development',
    code: 'RND-001',
    description: 'Product research and development activities',
    workspaceId: 'ws-001',
    departmentId: 'dept-004',
    managerId: 'user-004',
    managerName: 'Michael Chen',
    budget: 200000,
    budgetPeriod: 'yearly' as const,
    currentSpent: 85000,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-16'),
    projects: 6,
    teams: 2,
    employees: 15,
    lastActivity: new Date('2024-01-19')
  },
  {
    id: 'cc-005',
    name: 'Human Resources',
    code: 'HR-001',
    description: 'Human resources and employee management',
    workspaceId: 'ws-001',
    departmentId: 'dept-005',
    managerId: 'user-005',
    managerName: 'Lisa Rodriguez',
    budget: 25000,
    budgetPeriod: 'quarterly' as const,
    currentSpent: 15800,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-17'),
    projects: 3,
    teams: 1,
    employees: 5,
    lastActivity: new Date('2024-01-21')
  }
];

const getBudgetStatus = (spent: number, budget: number) => {
  const percentage = (spent / budget) * 100;
  if (percentage >= 90) return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-100' };
  if (percentage >= 75) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-100' };
};

const getBudgetStatusIcon = (spent: number, budget: number) => {
  const percentage = (spent / budget) * 100;
  if (percentage >= 90) return <AlertCircle className="w-4 h-4 text-red-600" />;
  if (percentage >= 75) return <TrendingUp className="w-4 h-4 text-yellow-600" />;
  return <Target className="w-4 h-4 text-green-600" />;
};

export default function CostCentersPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  const filteredCostCenters = mockCostCenters.filter(center => {
    const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.managerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && center.isActive) ||
                         (statusFilter === 'inactive' && !center.isActive);
    const matchesPeriod = periodFilter === 'all' || center.budgetPeriod === periodFilter;
    
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const totalBudget = filteredCostCenters.reduce((sum, center) => sum + center.budget, 0);
  const totalSpent = filteredCostCenters.reduce((sum, center) => sum + center.currentSpent, 0);
  const totalEmployees = filteredCostCenters.reduce((sum, center) => sum + center.employees, 0);
  const totalProjects = filteredCostCenters.reduce((sum, center) => sum + center.projects, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cost Centers</h1>
          <p className="text-muted-foreground">
            Manage organizational cost centers and budget allocations
          </p>
        </div>
        <Button className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Create Cost Center
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
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {filteredCostCenters.length} cost centers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((totalSpent / totalBudget) * 100).toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Total workforce
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Ongoing projects
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Cost Centers</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Search cost centers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Periods</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cost Centers List */}
          <div className="space-y-4">
            {filteredCostCenters.map((center) => {
              const budgetPercentage = (center.currentSpent / center.budget) * 100;
              const budgetStatus = getBudgetStatus(center.currentSpent, center.budget);
              
              return (
                <Card key={center.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{center.name}</CardTitle>
                          <Badge variant="outline">{center.code}</Badge>
                          {center.isActive && (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              Active
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{center.description}</CardDescription>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Manager: {center.managerName}</span>
                          <span>•</span>
                          <span>Budget Period: {center.budgetPeriod}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-1">
                          {getBudgetStatusIcon(center.currentSpent, center.budget)}
                          <span className={`text-sm font-medium ${budgetStatus.color}`}>
                            {budgetStatus.status === 'critical' && 'Critical'}
                            {budgetStatus.status === 'warning' && 'Warning'}
                            {budgetStatus.status === 'good' && 'On Track'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Last updated: {center.updatedAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Budget Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Budget Utilization</span>
                          <span>{budgetPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={budgetPercentage} className="h-2" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Spent: ${center.currentSpent.toLocaleString()}</span>
                          <span>Budget: ${center.budget.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-semibold text-blue-600">{center.employees}</div>
                          <div className="text-muted-foreground">Employees</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-semibold text-green-600">{center.projects}</div>
                          <div className="text-muted-foreground">Projects</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-semibold text-purple-600">{center.teams}</div>
                          <div className="text-muted-foreground">Teams</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-semibold text-orange-600">
                            ${(center.budget - center.currentSpent).toLocaleString()}
                          </div>
                          <div className="text-muted-foreground">Remaining</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Last activity: {center.lastActivity.toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Analytics
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredCostCenters.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No cost centers found matching your filters.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Cost Center</CardTitle>
              <CardDescription>
                Set up a new cost center for budget tracking and management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Cost Center Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Marketing Department"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Cost Center Code *</Label>
                    <Input
                      id="code"
                      placeholder="e.g., MKT-001"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the cost center's purpose..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget Amount *</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="50000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="period">Budget Period *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manager">Manager</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user-001">Sarah Johnson</SelectItem>
                        <SelectItem value="user-002">David Wilson</SelectItem>
                        <SelectItem value="user-003">Emily Davis</SelectItem>
                        <SelectItem value="user-004">Michael Chen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dept-001">Marketing</SelectItem>
                        <SelectItem value="dept-002">IT</SelectItem>
                        <SelectItem value="dept-003">Sales</SelectItem>
                        <SelectItem value="dept-004">R&D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch (Optional)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="branch-001">Main Office</SelectItem>
                        <SelectItem value="branch-002">North Branch</SelectItem>
                        <SelectItem value="branch-003">South Branch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Cost Center
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Cost Center Analytics</CardTitle>
              <CardDescription>
                Comprehensive analysis of cost center performance and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Cost center analytics dashboard coming soon...
                </p>
                <p className="text-sm text-muted-foreground">
                  This will include budget performance, spending trends, and comparative analysis across cost centers
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
