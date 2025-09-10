'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, TrendingUp, MoreHorizontal, Edit, Trash2, Eye, Settings, Target, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { useCurrency } from '@/hooks/use-currency';
import { useAuth } from '@/lib/auth-context';
import { DepartmentService } from '@/lib/department-service';
import { BudgetTrackingService } from '@/lib/budget-tracking-service';
import { ProjectService } from '@/lib/project-service';
import { TaskService } from '@/lib/task-service';
import { DeleteDialog, useDeleteDialog } from '@/components/ui/delete-dialog';

interface Department {
  id: string;
  name: string;
  head: string;
  employeeCount: number;
  budget: number;
  budgetUsed: number;
  performance: number;
  efficiency: number;
  satisfaction: number;
  status: 'active' | 'inactive' | 'restructuring';
  lastUpdated: string;
  projects: number;
  completedProjects: number;
}

interface DepartmentListProps {
  selectedDepartment?: string | null;
  onSelectDepartment?: (departmentId: string | null) => void;
}

export function DepartmentList({ selectedDepartment, onSelectDepartment }: DepartmentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deleteDialog = useDeleteDialog();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const { userProfile } = useAuth();
  const router = useRouter();
  const { formatAmount, getCurrencySymbol, loading: currencyLoading } = useCurrency();

  // Fetch departments from the database
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!currentWorkspace?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch all required data in parallel
        const [departmentData, budgets, projects, tasks] = await Promise.all([
          DepartmentService.getWorkspaceDepartments(currentWorkspace.id),
          BudgetTrackingService.getWorkspaceBudgets(currentWorkspace.id, { type: 'department' }),
          ProjectService.getWorkspaceProjects(currentWorkspace.id),
          TaskService.getWorkspaceTasks(currentWorkspace.id)
        ]);
        
        // Transform the data to match our interface
        const transformedDepartments: Department[] = departmentData.map(dept => {
          // Find department budget
          const departmentBudget = budgets.find(b => b.entityId === dept.id);
          
          // Find department projects
          const departmentProjects = projects.filter(p => p.teamId === dept.id);
          const projectIds = departmentProjects.map(p => p.id);
          
          // Find department tasks
          const departmentTasks = tasks.filter(t => projectIds.includes(t.projectId));
          const completedTasks = departmentTasks.filter(t => t.status === 'completed');
          
          // Calculate metrics
          const totalTasks = departmentTasks.length;
          const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
          
          // Calculate performance based on completion rate and project progress
          const avgProjectProgress = departmentProjects.length > 0 
            ? departmentProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / departmentProjects.length
            : 0;
          const performance = Math.round((completionRate + avgProjectProgress) / 2);
          
          // Calculate efficiency (tasks completed vs time)
          const efficiency = Math.min(100, Math.round(completionRate * 1.1)); // Slightly boost efficiency
          
          // Calculate satisfaction (based on performance with some variation)
          const satisfaction = Math.max(60, Math.min(100, performance + Math.round((Math.random() - 0.5) * 20)));
          
          return {
            id: dept.id,
            name: dept.name,
            head: dept.headName || 'Not Assigned',
            employeeCount: dept.memberCount || 0,
            budget: departmentBudget?.amount || 0,
            budgetUsed: departmentBudget?.spent || 0,
            performance,
            efficiency,
            satisfaction,
            status: dept.status || 'active',
            lastUpdated: new Date().toISOString().split('T')[0],
            projects: departmentProjects.length,
            completedProjects: departmentProjects.filter(p => p.status === 'completed').length,
          };
        });
        
        setDepartments(transformedDepartments);
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError('Failed to load departments. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load departments',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, [currentWorkspace?.id, toast]);

  // Mock department data - fallback for when no workspace is selected
  const mockDepartments: Department[] = [
    {
      id: '1',
      name: 'Engineering',
      head: 'Sarah Johnson',
      employeeCount: 45,
      budget: 450000,
      budgetUsed: 380000,
      performance: 92,
      efficiency: 88,
      satisfaction: 85,
      status: 'active',
      lastUpdated: '2024-01-15',
      projects: 12,
      completedProjects: 8
    },
    {
      id: '2',
      name: 'Marketing',
      head: 'Michael Chen',
      employeeCount: 28,
      budget: 320000,
      budgetUsed: 305000,
      performance: 87,
      efficiency: 91,
      satisfaction: 89,
      status: 'active',
      lastUpdated: '2024-01-14',
      projects: 8,
      completedProjects: 6
    },
    {
      id: '3',
      name: 'Sales',
      head: 'Emily Rodriguez',
      employeeCount: 32,
      budget: 280000,
      budgetUsed: 245000,
      performance: 94,
      efficiency: 86,
      satisfaction: 92,
      status: 'active',
      lastUpdated: '2024-01-15',
      projects: 6,
      completedProjects: 5
    },
    {
      id: '4',
      name: 'Human Resources',
      head: 'David Kim',
      employeeCount: 15,
      budget: 180000,
      budgetUsed: 165000,
      performance: 89,
      efficiency: 93,
      satisfaction: 87,
      status: 'active',
      lastUpdated: '2024-01-13',
      projects: 4,
      completedProjects: 3
    },
    {
      id: '5',
      name: 'Finance',
      head: 'Lisa Thompson',
      employeeCount: 22,
      budget: 220000,
      budgetUsed: 198000,
      performance: 91,
      efficiency: 95,
      satisfaction: 84,
      status: 'active',
      lastUpdated: '2024-01-15',
      projects: 5,
      completedProjects: 4
    },
    {
      id: '6',
      name: 'Operations',
      head: 'Robert Wilson',
      employeeCount: 38,
      budget: 380000,
      budgetUsed: 342000,
      performance: 85,
      efficiency: 89,
      satisfaction: 88,
      status: 'restructuring',
      lastUpdated: '2024-01-12',
      projects: 10,
      completedProjects: 7
    }
  ];

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.head.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Department['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400 dark:border-gray-800';
      case 'restructuring':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600 dark:text-green-400';
    if (performance >= 80) return 'text-blue-600 dark:text-blue-400';
    if (performance >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Navigation handlers
  const handleViewDetails = (departmentId: string) => {
    router.push(`/dashboard/departments/${departmentId}`);
  };

  const handleEditDepartment = (departmentId: string) => {
    router.push(`/dashboard/departments/${departmentId}/edit`);
  };

  const handleDepartmentSettings = (departmentId: string) => {
    router.push(`/dashboard/departments/${departmentId}/settings`);
  };

  // Delete handler
  const handleDeleteDepartment = (department: Department) => {
    deleteDialog.openDialog({
      id: department.id,
      name: department.name,
      type: 'Department',
      status: department.status
    });
  };

  const confirmDeleteDepartment = async (item: any) => {
    if (!currentWorkspace?.id || !userProfile?.id) {
      toast({
        title: 'Error',
        description: 'Missing required information for deletion.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await DepartmentService.deleteDepartment(
        currentWorkspace.id,
        item.id,
        userProfile.id
      );

      toast({
        title: 'Success',
        description: `Department "${item.name}" has been deleted successfully.`,
      });

      // Refresh the department list
      const updatedDepartments = departments.filter(d => d.id !== item.id);
      setDepartments(updatedDepartments);
      
      // Clear selection if the deleted department was selected
      if (selectedDepartment === item.id) {
        onSelectDepartment?.(null);
      }
    } catch (error: any) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete department. Please try again.',
        variant: 'destructive',
      });
      throw error; // Re-throw to let the dialog handle the error state
    }
  };

  const handleSelectDepartment = (departmentId: string) => {
    const newSelection = selectedDepartment === departmentId ? null : departmentId;
    onSelectDepartment?.(newSelection);
  };

  const GridView = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredDepartments.map((dept) => (
        <Card 
          key={dept.id} 
          className={`card-interactive hover:shadow-enhanced transition-all cursor-pointer ${
            selectedDepartment === dept.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30' : ''
          }`}
          onClick={() => handleSelectDepartment(dept.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-lg">{dept.name}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleViewDetails(dept.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEditDepartment(dept.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDepartmentSettings(dept.id)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDeleteDepartment(dept)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Head: {dept.head}</span>
                <Badge className={getStatusColor(dept.status)}>
                  {dept.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span>{dept.employeeCount} employees</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-500" />
                <span>{dept.projects} projects</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Performance</span>
                  <span className={`font-medium ${getPerformanceColor(dept.performance)}`}>
                    {dept.performance}%
                  </span>
                </div>
                <Progress value={dept.performance} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Budget Usage</span>
                  <span className="font-medium">
                    {currencyLoading ? '...' : `${formatAmount(dept.budgetUsed / 1000, { precision: 0 })}k / ${formatAmount(dept.budget / 1000, { precision: 0 })}k`}
                  </span>
                </div>
                <Progress value={(dept.budgetUsed / dept.budget) * 100} className="h-2" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="font-medium text-blue-600 dark:text-blue-400">{dept.efficiency}%</div>
                <div className="text-muted-foreground">Efficiency</div>
              </div>
              <div>
                <div className="font-medium text-green-600 dark:text-green-400">{dept.satisfaction}%</div>
                <div className="text-muted-foreground">Satisfaction</div>
              </div>
              <div>
                <div className="font-medium text-purple-600 dark:text-purple-400">{dept.completedProjects}/{dept.projects}</div>
                <div className="text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const TableView = () => (
    <Card className="card-enhanced">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Department</TableHead>
            <TableHead>Head</TableHead>
            <TableHead>Employees</TableHead>
            <TableHead>Performance</TableHead>
            <TableHead>Budget Usage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDepartments.map((dept) => (
            <TableRow 
              key={dept.id}
              className={`cursor-pointer hover:bg-muted/50 ${
                selectedDepartment === dept.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''
              }`}
              onClick={() => handleSelectDepartment(dept.id)}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">{dept.name}</span>
                </div>
              </TableCell>
              <TableCell>{dept.head}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-gray-500" />
                  {dept.employeeCount}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${getPerformanceColor(dept.performance)}`}>
                    {dept.performance}%
                  </span>
                  <Progress value={dept.performance} className="h-1 w-16" />
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">
                    {currencyLoading ? '...' : `${formatAmount(dept.budgetUsed / 1000, { precision: 0 })}k / ${formatAmount(dept.budget / 1000, { precision: 0 })}k`}
                  </div>
                  <Progress value={(dept.budgetUsed / dept.budget) * 100} className="h-1" />
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(dept.status)}>
                  {dept.status}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetails(dept.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditDepartment(dept.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Departments
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Loading departments...
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading departments...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Departments
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Error loading departments
            </p>
          </div>
        </div>
        
        <Card className="card-enhanced">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Error Loading Departments</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Departments ({filteredDepartments.length})
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor all departments in your organization
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
        </div>
      </div>

      {/* Selection Info */}
      {selectedDepartment && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Selected: {departments.find(d => d.id === selectedDepartment)?.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectDepartment?.(null)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Department List */}
      {viewMode === 'grid' ? <GridView /> : <TableView />}

      {/* Empty State */}
      {filteredDepartments.length === 0 && (
        <Card className="card-enhanced">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <h3 className="text-lg font-medium mb-2">No departments found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first department.'}
            </p>
            {!searchTerm && (
              <Button>
                <Building2 className="h-4 w-4 mr-2" />
                Create Department
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.closeDialog}
        onConfirm={() => deleteDialog.handleConfirm(confirmDeleteDepartment)}
        title="Delete Department"
        description="This action will permanently remove the department and all its associated data."
        item={deleteDialog.item}
        itemDetails={[
          { label: 'Department Name', value: deleteDialog.item?.name || '' },
          { label: 'Type', value: deleteDialog.item?.type || '' },
          { label: 'Status', value: deleteDialog.item?.status || '' }
        ]}
        consequences={[
          'All department data will be permanently deleted',
          'Associated projects will be unassigned from this department',
          'Department members will need to be reassigned',
          'Budget allocations will be removed',
          'Performance metrics history will be lost'
        ]}
        confirmText="Delete Department"
        isLoading={deleteDialog.isLoading}
        warningLevel="high"
      />
    </div>
  );
}