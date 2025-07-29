'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useCostCenterPermissions } from '@/hooks/use-cost-center-permissions';
import { CostCenterDataService } from '@/lib/cost-center-data-service';
import { CostCenterList } from '@/components/financial/CostCenterList';
import { CostCenterAnalytics } from '@/components/financial/CostCenterAnalytics';
import { CostCenterCreateForm } from '@/components/financial/CostCenterCreateForm';
import { CostCenterLoadingSkeleton } from '@/components/financial/CostCenterLoadingSkeleton';
import {
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Users,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import type { CostCenterWithDetails, Department, User } from '@/components/financial/types';
import type { Expense, Budget } from '@/lib/types/financial-types';

export default function CostCentersPage() {
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { defaultCurrency } = useCurrency();
  
  // Use the custom permissions hook
  const { permissions, loading: permissionsLoading } = useCostCenterPermissions(
    userProfile?.id, 
    currentWorkspace?.id
  );

  // State management
  const [activeTab, setActiveTab] = useState('list');
  const [costCenters, setCostCenters] = useState<CostCenterWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Analytics data
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  // Cache control
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);

  // Optimized data loading with caching
  const loadData = useCallback(async (forceRefresh: boolean = false) => {
    if (!currentWorkspace?.id || !userProfile?.id) return;
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const useCache = !forceRefresh && !isInitialLoad.current;
      
      const { costCenters: enhancedCostCenters, departments: allDepartments, users: allUsers, errors } = 
        await CostCenterDataService.getEnhancedCostCenters(
          userProfile.id,
          currentWorkspace.id,
          { 
            useCache,
            forceRefresh: forceRefresh || isInitialLoad.current
          }
        );

      // Check if component is still mounted and request wasn't aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setCostCenters(enhancedCostCenters);
      setDepartments(allDepartments);
      setUsers(allUsers);
      
      // Log any errors but don't fail completely
      if (errors.length > 0) {
        console.warn('Some workspace data failed to load:', errors);
      }
      
      isInitialLoad.current = false;
      
    } catch (err) {
      // Only show error if request wasn't aborted
      if (!abortControllerRef.current?.signal.aborted) {
        console.error('Error loading cost centers:', err);
        setError('Failed to load cost centers. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load cost centers. Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [currentWorkspace?.id, userProfile?.id, toast]);

  // Refresh function for manual refreshes
  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    loadData(true);
  }, [loadData]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    if (currentWorkspace?.id && userProfile?.id && !permissionsLoading) {
      loadData();
    }
  }, [currentWorkspace?.id, userProfile?.id, permissionsLoading, loadData, refreshKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Preload data for better performance when switching between tabs
  useEffect(() => {
    if (userProfile?.id && currentWorkspace?.id) {
      // Preload workspace data in background for faster navigation
      CostCenterDataService.preloadData([currentWorkspace.id]);
    }
  }, [userProfile?.id, currentWorkspace?.id]);

  // Memoized summary statistics for better performance
  const summaryStats = useMemo(() => {
    const totalBudget = costCenters.reduce((sum, center) => sum + (center.budget || 0), 0);
    const totalSpent = costCenters.reduce((sum, center) => sum + (center.currentSpent || 0), 0);
    const totalEmployees = costCenters.reduce((sum, center) => sum + (center.employees || 0), 0);
    const totalProjects = costCenters.reduce((sum, center) => sum + (center.projects || 0), 0);
    
    return { totalBudget, totalSpent, totalEmployees, totalProjects };
  }, [costCenters]);

  const { totalBudget, totalSpent, totalEmployees, totalProjects } = summaryStats;

  // Show loading state
  if (!userProfile?.id || !currentWorkspace?.id || loading || permissionsLoading) {
    return <CostCenterLoadingSkeleton />;
  }

  // Show access denied
  if (!permissions.canView) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to view cost centers.
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cost Centers</h1>
            <p className="text-muted-foreground">
              Manage organizational cost centers and budget allocations
            </p>
          </div>
        </div>
        
        <Card className="card-enhanced">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Cost Centers</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refreshData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cost Centers</h1>
          <p className="text-muted-foreground">
            Manage organizational cost centers and budget allocations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {permissions.canCreate && (
            <Button 
              className="shrink-0" 
              onClick={() => setActiveTab('create')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Cost Center
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: defaultCurrency?.code || 'USD'
              }).format(totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {costCenters.length} cost centers
            </p>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: defaultCurrency?.code || 'USD'
              }).format(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% of budget
            </p>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Total workforce
            </p>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Ongoing projects
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Cost Centers</TabsTrigger>
          {permissions.canCreate && <TabsTrigger value="create">Create New</TabsTrigger>}
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
                        <CostCenterList
                costCenters={costCenters}
                departments={departments}
                users={users}
                userRole={userProfile.role || 'member'}
                userId={userProfile.id}
                canCreate={permissions.canCreate}
                canEdit={permissions.canEdit}
                canDelete={permissions.canDelete}
                onCreateClick={() => setActiveTab('create')}
                onDataChange={async () => {
                  // Invalidate cache and refresh data
                  CostCenterDataService.invalidateWorkspaceCache(currentWorkspace.id);
                  refreshData();
                }}
              />
        </TabsContent>

        {permissions.canCreate && (
          <TabsContent value="create" className="space-y-4">
            <CostCenterCreateForm
              departments={departments}
              users={users}
              workspaceId={currentWorkspace.id}
              userRole={userProfile.role || 'member'}
              userId={userProfile.id}
              onSuccess={() => {
                setActiveTab('list');
                // Invalidate cache and refresh data
                CostCenterDataService.invalidateWorkspaceCache(currentWorkspace.id);
                refreshData();
              }}
              onCancel={() => setActiveTab('list')}
            />
          </TabsContent>
        )}

        <TabsContent value="analytics" className="space-y-4">
          <CostCenterAnalytics
            costCenters={costCenters.map(center => ({
              id: center.id,
              name: center.name,
              code: center.code || '',
              description: center.description,
              workspaceId: center.workspaceId,
              departmentId: center.departmentId,
              branchId: center.branchId,
              regionId: center.regionId,
              managerId: center.managerId,
              projectId: center.projectId,
              budget: center.budget,
              budgetPeriod: center.budgetPeriod,
              isActive: center.isActive,
              createdAt: center.createdAt,
              updatedAt: center.updatedAt
            }))}
            expenses={expenses}
            budgets={budgets}
            loading={loading}
            onRefresh={refreshData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
