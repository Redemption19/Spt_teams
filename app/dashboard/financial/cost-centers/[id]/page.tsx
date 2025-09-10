'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Building, 
  Wallet, 
  Users, 
  Calendar, 
  MapPin, 
  User, 
  Briefcase, 
  FolderOpen, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Edit,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { BudgetTrackingService } from '@/lib/budget-tracking-service';
import { DepartmentService } from '@/lib/department-service';
import { UserService } from '@/lib/user-service';
import { ProjectService } from '@/lib/project-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { CostCenterLoadingSkeleton } from '@/components/financial/CostCenterLoadingSkeleton';
import type { CostCenterWithDetails, Department, User as UserType, Project } from '@/components/financial/types';

export default function CostCenterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  
  const [costCenter, setCostCenter] = useState<CostCenterWithDetails | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [manager, setManager] = useState<UserType | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const costCenterId = params.id as string;

  useEffect(() => {
    const loadCostCenterDetail = async () => {
      if (!costCenterId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Load cost center details
        const costCenterData = await BudgetTrackingService.getCostCenter(costCenterId);
        if (!costCenterData) {
          setError('Cost center not found');
          return;
        }

        // Load related data in parallel
        const promises = [];
        
        // Load workspace
        promises.push(WorkspaceService.getWorkspace(costCenterData.workspaceId));
        
        // Load department if assigned
        if (costCenterData.departmentId) {
          promises.push(DepartmentService.getDepartment(costCenterData.workspaceId, costCenterData.departmentId));
        } else {
          promises.push(Promise.resolve(null));
        }
        
        // Load manager if assigned
        if (costCenterData.managerId) {
          promises.push(UserService.getUser(costCenterData.managerId));
        } else {
          promises.push(Promise.resolve(null));
        }
        
        // Load project if assigned
        if (costCenterData.projectId) {
          promises.push(ProjectService.getProject(costCenterData.projectId));
        } else {
          promises.push(Promise.resolve(null));
        }

        const [workspaceData, departmentData, managerData, projectData] = await Promise.all(promises);

        // Enhance cost center with related data
        const enhancedCostCenter: CostCenterWithDetails = {
          ...costCenterData,
          departmentName: departmentData?.name,
          managerName: (managerData as UserType)?.name || (managerData as UserType)?.email,
          currentSpent: 0, // TODO: Calculate from expenses
          projects: projectData ? 1 : 0,
          teams: 0, // TODO: Calculate from teams
          employees: 0 // TODO: Calculate from users
        };

        setCostCenter(enhancedCostCenter);
        setWorkspace(workspaceData);
        setDepartment(departmentData as Department);
        setManager(managerData as UserType);
        setProject(projectData as Project);
        
      } catch (err) {
        console.error('Error loading cost center details:', err);
        setError('Failed to load cost center details');
        toast({
          title: 'Error',
          description: 'Failed to load cost center details',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadCostCenterDetail();
  }, [costCenterId, toast]);

  const getBudgetStatus = (spent: number, total: number) => {
    if (!total) return 'no-budget';
    const percentage = (spent / total) * 100;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 80) return 'warning';
    if (percentage >= 60) return 'caution';
    return 'good';
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'text-destructive';
      case 'warning': return 'text-orange-600';
      case 'caution': return 'text-yellow-600';
      case 'good': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const getBudgetStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded': return <TrendingDown className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'caution': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'good': return <TrendingUp className="w-4 h-4 text-green-600" />;
      default: return <BarChart3 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return <CostCenterLoadingSkeleton />;
  }

  if (error || !costCenter) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/financial/cost-centers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cost Centers
          </Button>
        </div>
        <Card className="card-enhanced">
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">
              {error || 'Cost center not found'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const budgetStatus = getBudgetStatus(costCenter.currentSpent || 0, costCenter.budget || 0);
  const budgetPercentage = costCenter.budget ? ((costCenter.currentSpent || 0) / costCenter.budget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/financial/cost-centers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cost Centers
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{costCenter.name}</h1>
            <p className="text-muted-foreground">
              Cost Center Details • {costCenter.code}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={costCenter.isActive ? "default" : "secondary"}>
            {costCenter.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Allocation</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costCenter.budget ? formatAmount(costCenter.budget) : 'No Budget'}
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {costCenter.budgetPeriod} allocation
            </p>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Spending</CardTitle>
            {getBudgetStatusIcon(budgetStatus)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBudgetStatusColor(budgetStatus)}`}>
              {formatAmount(costCenter.currentSpent || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {budgetPercentage.toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {costCenter.budget ? formatAmount(costCenter.budget - (costCenter.currentSpent || 0)) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Available to spend
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      {costCenter.budget && (
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Budget Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className={getBudgetStatusColor(budgetStatus)}>
                  {budgetPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(budgetPercentage, 100)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Spent: {formatAmount(costCenter.currentSpent || 0)}</span>
                <span>Budget: {formatAmount(costCenter.budget)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-sm">{costCenter.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Code</p>
                    <p className="text-sm">{costCenter.code || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={costCenter.isActive ? "default" : "secondary"} className="text-xs">
                      {costCenter.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">
                      {new Date(costCenter.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {costCenter.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{costCenter.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Information */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Budget Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Allocated Budget</p>
                    <p className="text-sm font-semibold">
                      {costCenter.budget ? formatAmount(costCenter.budget) : 'No Budget'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Budget Period</p>
                    <p className="text-sm capitalize">{costCenter.budgetPeriod}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Spent</p>
                    <p className={`text-sm font-semibold ${getBudgetStatusColor(budgetStatus)}`}>
                      {formatAmount(costCenter.currentSpent || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilization</p>
                    <p className={`text-sm font-semibold ${getBudgetStatusColor(budgetStatus)}`}>
                      {budgetPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organizational Assignment */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Organizational Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Workspace</p>
                  <p className="text-sm">{workspace?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="text-sm">{department?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Manager</p>
                  <div className="flex items-center gap-2">
                    {manager ? (
                      <>
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{manager.name || manager.email}</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">No manager assigned</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Assignment */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-primary" />
                  Project Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Project</p>
                      <p className="text-sm font-medium">{project.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {project.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Priority</p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {project.priority}
                        </Badge>
                      </div>
                    </div>
                    {project.description && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Description</p>
                        <p className="text-sm">{project.description}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No project assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>
                Expenses charged to this cost center
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No expenses data available yet.
                {/* TODO: Implement expense tracking */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Cost Center Analytics</CardTitle>
              <CardDescription>
                Performance metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics dashboard coming soon.
                {/* TODO: Implement analytics dashboard */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}