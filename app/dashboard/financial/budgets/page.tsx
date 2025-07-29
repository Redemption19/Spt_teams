'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Calendar, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { BudgetTrackingService } from '@/lib/budget-tracking-service';
import { CurrencyService } from '@/lib/currency-service';
import type { Budget } from '@/lib/types/financial-types';
import type { Currency } from '@/lib/types/financial-types';
import { Skeleton } from '@/components/ui/skeleton';
import { BudgetsLoadingSkeleton } from '@/components/financial/BudgetsLoadingSkeleton';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/data-table';
import { createBudgetColumns, BudgetTableData } from '@/components/financial/BudgetColumns';
import { useWorkspace } from '@/lib/workspace-context';
import { useIsOwner } from '@/lib/rbac-hooks';
import { DepartmentService, Department } from '@/lib/department-service';
import { useToast } from '../../../../hooks/use-toast';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserService } from '@/lib/user-service';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { ExpenseManagementService } from '@/lib/expense-management-service';
import { DeleteDialog, useDeleteDialog } from '@/components/ui/delete-dialog';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { default as BudgetAnalyticsTab } from './analytics/page';
import { PermissionsService } from '@/lib/permissions-service';

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

// Helper for budget status (use a default threshold, e.g., 80)
const getBudgetStatus = (spent: number, total: number, threshold: number = 80) => {
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
  const { userProfile } = useAuth();
  const workspaceId = userProfile?.workspaceId;
  const router = useRouter();
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  const isOwner = useIsOwner();
  const { toast } = useToast();

  // Cross-workspace management state for owners - persisted
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('budgets-showAllWorkspaces') === 'true';
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState('budgets');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  // Advanced filter state
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterAmountMin, setFilterAmountMin] = useState<string>('');
  const [filterAmountMax, setFilterAmountMax] = useState<string>('');
  const [filterCreator, setFilterCreator] = useState<string>('all');
  const [filterUsers, setFilterUsers] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCategories, setFilterCategories] = useState<any[]>([]);
  const [filterCurrencies, setFilterCurrencies] = useState<any[]>([]);
  const [filterWorkspace, setFilterWorkspace] = useState<string>('all');
  const [filterAlert, setFilterAlert] = useState(false);

  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canView, setCanView] = useState(false);

  // Delete dialog state
  const {
    isOpen: isDeleteDialogOpen,
    item: itemToDelete,
    openDialog: openDeleteDialog,
    closeDialog: closeDeleteDialog,
    handleConfirm: confirmDelete
  } = useDeleteDialog();

  useEffect(() => {
    async function checkPermissions() {
      if (userProfile && currentWorkspace) {
        if (userProfile.role === 'owner') {
          setCanCreate(true);
          setCanEdit(true);
          setCanDelete(true);
          setCanView(true);
        } else if (userProfile.id && currentWorkspace.id) {
          setCanCreate(await PermissionsService.hasPermission(userProfile.id, currentWorkspace.id, 'budgets.create'));
          setCanEdit(await PermissionsService.hasPermission(userProfile.id, currentWorkspace.id, 'budgets.edit'));
          setCanDelete(await PermissionsService.hasPermission(userProfile.id, currentWorkspace.id, 'budgets.delete'));
          setCanView(await PermissionsService.hasPermission(userProfile.id, currentWorkspace.id, 'budgets.view'));
        }
      }
    }
    checkPermissions();
  }, [userProfile, currentWorkspace]);

  // Fetch users, categories, currencies for advanced filters
  useEffect(() => {
    async function fetchData() {
      try {
        // Users
        let users: any[] = [];
        if (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) {
          const all = await Promise.all(
            accessibleWorkspaces.map(ws => UserService.getUsersByWorkspace(ws.id))
          );
          users = all.flat();
        } else if (currentWorkspace?.id) {
          users = await UserService.getUsersByWorkspace(currentWorkspace.id);
        }
        setFilterUsers(users);
        // Categories
        let cats: any[] = [];
        if (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) {
          const all = await Promise.all(
            accessibleWorkspaces.map(ws => ExpenseManagementService.getWorkspaceExpenseCategories(ws.id))
          );
          cats = all.flat();
        } else if (currentWorkspace?.id) {
          cats = await ExpenseManagementService.getWorkspaceExpenseCategories(currentWorkspace.id);
        }
        setFilterCategories(cats);
        // Currencies (always use mock array)
        const currs = [
          { code: 'GHS', name: 'Ghana Cedi', symbol: '₵' },
          { code: 'USD', name: 'US Dollar', symbol: '$' },
          { code: 'EUR', name: 'Euro', symbol: '€' },
          { code: 'GBP', name: 'British Pound', symbol: '£' },
          { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
          { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
          { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
          { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
          { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
          { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
        ];
        setFilterCurrencies(currs);
      } catch (err) {
        setFilterUsers([]);
        setFilterCategories([]);
        setFilterCurrencies([]);
      }
    }
    if (advancedFilterOpen) fetchData();
  }, [advancedFilterOpen, isOwner, showAllWorkspaces, accessibleWorkspaces, currentWorkspace]);

  // Advanced filter apply/reset handlers
  const handleApplyAdvancedFilters = () => {
    setAdvancedFilterOpen(false);
  };
  const handleResetAdvancedFilters = () => {
    setFilterDepartment('all');
    setFilterAmountMin('');
    setFilterAmountMax('');
    setFilterCreator('all');
    setFilterType('all');
    setFilterStatus('all');
    setFilterStartDate(null);
    setFilterEndDate(null);
    setFilterCurrency('all');
    setFilterCategory('all');
    setFilterWorkspace('all');
    setFilterAlert(false);
  };

  // Department map and lookup (must be before any early return)
  const departmentMap = useMemo(() => {
    const map: { [id: string]: string } = {};
    departments.forEach(d => { map[d.id] = d.name; });
    return map;
  }, [departments]);
  const getDepartmentName = (id: string) => departmentMap[id] || 'Unknown';

  const fetchBudgets = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      let allBudgets: Budget[] = [];
      if (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) {
        // Fetch budgets from all accessible workspaces
        const all = await Promise.all(
          accessibleWorkspaces.map(ws => BudgetTrackingService.getWorkspaceBudgets(ws.id))
        );
        allBudgets = all.flat();
      } else {
        allBudgets = await BudgetTrackingService.getWorkspaceBudgets(workspaceId);
      }
      setBudgets(allBudgets);
    } catch (err) {
      setError('Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, isOwner, showAllWorkspaces, accessibleWorkspaces]);

  // Fetch default currency
  useEffect(() => {
    if (!workspaceId) return;
    CurrencyService.getDefaultCurrency(workspaceId).then(setCurrency);
  }, [workspaceId]);

  // Fetch departments (cross-workspace aware)
  const fetchDepartments = useCallback(async () => {
    if (!workspaceId) return;
    try {
      let allDepartments: Department[] = [];
      if (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) {
        const all = await Promise.all(
          accessibleWorkspaces.map(ws => DepartmentService.getWorkspaceDepartments(ws.id))
        );
        allDepartments = all.flat();
      } else {
        allDepartments = await DepartmentService.getWorkspaceDepartments(workspaceId);
      }
      setDepartments(allDepartments);
    } catch (err) {
      setDepartments([]);
    }
  }, [workspaceId, isOwner, showAllWorkspaces, accessibleWorkspaces]);

  useEffect(() => {
    fetchBudgets();
    fetchDepartments();
  }, [fetchBudgets, fetchDepartments]);

  // Cross-workspace toggle handler
  const handleWorkspaceViewToggle = (showAll: boolean) => {
    setShowAllWorkspaces(showAll);
    if (typeof window !== 'undefined') {
      localStorage.setItem('budgets-showAllWorkspaces', showAll.toString());
    }
  };

  // Filtering logic
  const filteredBudgets = budgets.filter(budget => {
    const matchesPeriod = selectedPeriod === 'all' || budget.period === selectedPeriod;
    const status = budget.isActive ? (budget.endDate && new Date(budget.endDate) < new Date() ? 'completed' : 'active') : 'draft';
    const spentPercent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
    let computedStatus = 'on-track';
    if (spentPercent >= 100) computedStatus = 'overbudget';
    else if (spentPercent >= 80) computedStatus = 'warning';
    else if (!budget.isActive) computedStatus = 'draft';
    else if (budget.endDate && new Date(budget.endDate) < new Date()) computedStatus = 'completed';
    // Advanced filters
    const matchesDepartment = filterDepartment === 'all' || (budget.type === 'department' && budget.entityId === filterDepartment);
    const matchesAmountMin = !filterAmountMin || budget.amount >= parseFloat(filterAmountMin);
    const matchesAmountMax = !filterAmountMax || budget.amount <= parseFloat(filterAmountMax);
    const matchesCreator = filterCreator === 'all' || budget.createdBy === filterCreator;
    const matchesType = filterType === 'all' || budget.type === filterType;
    const matchesStatus = filterStatus === 'all' || computedStatus === filterStatus;
    const matchesStartDate = !filterStartDate || (budget.startDate && new Date(budget.startDate) >= filterStartDate);
    const matchesEndDate = !filterEndDate || (budget.endDate && new Date(budget.endDate) <= filterEndDate);
    const matchesCurrency = filterCurrency === 'all' || budget.currency === filterCurrency;
    const matchesCategory = filterCategory === 'all' || (budget.categories && budget.categories.includes(filterCategory));
    const matchesWorkspace = filterWorkspace === 'all' || budget.workspaceId === filterWorkspace;
    const matchesAlert = !filterAlert || (budget.alerts && budget.alerts.some(a => a.triggered));
    return matchesPeriod && matchesStatus && matchesDepartment && matchesAmountMin && matchesAmountMax && matchesCreator && matchesType && matchesStatus && matchesStartDate && matchesEndDate && matchesCurrency && matchesCategory && matchesWorkspace && matchesAlert;
  });

  const totalBudgetAmount = filteredBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpentAmount = filteredBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudgetAmount - totalSpentAmount;

  // Handler for batch recalculation
  const handleRecalculateBudgets = async () => {
    if (!workspaceId) return;
    try {
      await BudgetTrackingService.recalculateAllBudgetsSpent(workspaceId);
      toast({ title: 'Budgets Recalculated', description: 'All budgets have been recalculated from expenses.', variant: 'default' });
      // Optionally, refetch budgets
      fetchBudgets();
    } catch (err) {
      toast({ title: 'Recalculation Failed', description: 'Could not recalculate budgets. See console for details.', variant: 'destructive' });
      console.error('Batch recalculation error:', err);
    }
  };

  if (!canView) {
    return <div className="p-8 text-center text-muted-foreground">You do not have permission to view budgets.</div>;
  }
  if (loading) {
    return <BudgetsLoadingSkeleton />;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  // DataTable handlers
  const handleViewBudget = (budget: BudgetTableData) => {
    router.push(`/dashboard/financial/budgets/${budget.id}`);
  };
  const handleEditBudget = (budget: BudgetTableData) => {
    router.push(`/dashboard/financial/budgets/edit/${budget.id}`);
  };
  const handleDeleteBudget = (budget: BudgetTableData) => {
    // Compute status
    const spentPercent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
    let status = 'on-track';
    if (spentPercent >= 100) status = 'overbudget';
    else if (spentPercent >= 80) status = 'warning';
    else if (!budget.isActive) status = 'draft';
    else if (budget.endDate && new Date(budget.endDate) < new Date()) status = 'completed';
    
    // Get department name
    const departmentName = budget.type === 'department' ? getDepartmentName(budget.entityId) : 'N/A';
    
    openDeleteDialog({
      id: budget.id,
      name: budget.name,
      type: budget.type,
      department: departmentName,
      totalAmount: budget.amount,
      status: status
    });
  };

  const handleConfirmDelete = async (budget: BudgetTableData) => {
    try {
      await BudgetTrackingService.deleteBudget(budget.id);
      toast({ 
        title: 'Budget Deleted', 
        description: `Budget "${budget.name}" has been successfully deleted.`, 
        variant: 'default' 
      });
      fetchBudgets(); // Refresh the list
    } catch (err) {
      toast({ 
        title: 'Delete Failed', 
        description: `Failed to delete budget "${budget.name}". Please try again.`, 
        variant: 'destructive' 
      });
      console.error('Delete budget error:', err);
    }
  };

  // Add canEdit/canDelete to each row if needed (for now, allow all for owners)
  const isAdmin = userProfile?.role === 'admin';
  const tableData: BudgetTableData[] = filteredBudgets.map(b => ({
    ...b,
    canEdit: canEdit,
    canDelete: canDelete
  }));

  const columns = createBudgetColumns({
    onView: handleViewBudget,
    onEdit: handleEditBudget,
    onDelete: handleDeleteBudget,
    getDepartmentName,
  });

  // Lazy load the CostCentersPage for modularity
  const CostCentersPage = dynamic(() => import('./cost-centers/page'), { ssr: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budget Management</h1>
          <p className="text-muted-foreground">
            Monitor and control your department and project budgets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Cross-workspace toggle for owners */}
          {isOwner && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
              <button
                onClick={() => handleWorkspaceViewToggle(!showAllWorkspaces)}
                className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                  showAllWorkspaces 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400'
                }`}
              >
                <span className="text-base">{showAllWorkspaces ? '🌐' : '🏢'}</span>
                <span>
                  {showAllWorkspaces 
                    ? `All Workspaces (${accessibleWorkspaces.length})` 
                    : 'Current Workspace'
                  }
                </span>
              </button>
            </div>
          )}
          <Link href="/dashboard/financial/budgets/advanced-analytics">
            <Button variant="secondary" className="shrink-0">
              📊 Advanced Analytics
            </Button>
          </Link>
          {canCreate && (
            <Button className="shrink-0" onClick={() => router.push('/dashboard/financial/budgets/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          )}
        </div>
      </div>
      {/* Cross-workspace scope banner for owners */}
      {isOwner && showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
          <p className="text-sm text-green-700 dark:text-green-400">
            🌐 <strong>Cross-Workspace Budgets:</strong> Displaying budgets across all {accessibleWorkspaces.length} accessible workspaces. Budgets, analytics, and management features from all workspaces are aggregated for centralized oversight.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <span className="h-4 w-4 text-muted-foreground text-lg">{currency?.symbol || '$'}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency?.symbol || '$'}{totalBudgetAmount.toLocaleString()}</div>
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
            <div className="text-2xl font-bold text-red-600">{currency?.symbol || '$'}{totalSpentAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalBudgetAmount > 0 ? ((totalSpentAmount / totalBudgetAmount) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{currency?.symbol || '$'}{totalRemaining.toLocaleString()}</div>
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
              {filteredBudgets.filter(b => b.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently tracking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workspace Breakdown Section */}
      {isOwner && showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
        <Card className="border-green-200 dark:border-green-800/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <span className="text-base mr-2">🏢</span>
              Workspace Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accessibleWorkspaces.map((ws) => {
                const wsBudgets = budgets.filter(b => b.workspaceId === ws.id);
                const wsTotal = wsBudgets.reduce((sum, b) => sum + b.amount, 0);
                const wsSpent = wsBudgets.reduce((sum, b) => sum + b.spent, 0);
                const wsRemaining = wsTotal - wsSpent;
                return (
                  <div key={ws.id} className={`flex justify-between items-center p-4 rounded-lg border transition-colors ${
                    ws.id === currentWorkspace?.id
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/50'
                      : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800/50'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{ws.id === currentWorkspace?.id ? '🏛️' : '🏢'}</span>
                      <span className={`font-medium ${
                        ws.id === currentWorkspace?.id
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-green-700 dark:text-green-300'
                      }`}>
                        {ws.name}
                      </span>
                      {ws.id === currentWorkspace?.id && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                          Main
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        ws.id === currentWorkspace?.id
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-green-700 dark:text-green-300'
                      }`}>
                        {currency?.symbol || '$'}{wsTotal.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {wsBudgets.length} budget{wsBudgets.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Spent: <span className="font-semibold text-red-600">{currency?.symbol || '$'}{wsSpent.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Remaining: <span className="font-semibold text-green-600">{currency?.symbol || '$'}{wsRemaining.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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

                <Dialog open={advancedFilterOpen} onOpenChange={setAdvancedFilterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setAdvancedFilterOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced Filters
                </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl w-full">
                    <DialogHeader>
                      <DialogTitle>Advanced Filters</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Budget Type */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Budget Type</label>
                          <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="workspace">Workspace</SelectItem>
                              <SelectItem value="department">Department</SelectItem>
                              <SelectItem value="project">Project</SelectItem>
                              <SelectItem value="costCenter">Cost Center</SelectItem>
                              <SelectItem value="team">Team</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Status */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Status</label>
                          <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="on-track">On Track</SelectItem>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="overbudget">Overbudget</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Workspace (owners/admins) */}
                        {((isOwner && accessibleWorkspaces.length > 1) || (userProfile?.role === 'admin' && accessibleWorkspaces.length > 1)) && (
                          <div>
                            <label className="block text-sm font-medium mb-1">Workspace</label>
                            <Select value={filterWorkspace} onValueChange={setFilterWorkspace}>
                              <SelectTrigger>
                                <SelectValue placeholder="All Workspaces" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Workspaces</SelectItem>
                                {accessibleWorkspaces.map(ws => (
                                  <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                        </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Department */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Department</label>
                          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Departments</SelectItem>
                              {departments.map(dept => (
                                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Category */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Category</label>
                          <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {filterCategories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Currency */}
                      <div>
                          <label className="block text-sm font-medium mb-1">Currency</label>
                          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Currencies" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Currencies</SelectItem>
                              {filterCurrencies.map(curr => (
                                <SelectItem key={curr.code} value={curr.code}>{curr.symbol} {curr.code}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Creator */}
                      <div>
                          <label className="block text-sm font-medium mb-1">Created By</label>
                          <Select value={filterCreator} onValueChange={setFilterCreator}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Creators" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Creators</SelectItem>
                              {filterUsers.map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.name || user.email || user.id}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Date Range */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Start Date</label>
                          <DatePicker value={filterStartDate ?? undefined} onChange={date => setFilterStartDate(date ?? null)} placeholder="Start Date" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">End Date</label>
                          <DatePicker value={filterEndDate ?? undefined} onChange={date => setFilterEndDate(date ?? null)} placeholder="End Date" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Amount range filter */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Min Amount</label>
                          <Input type="number" value={filterAmountMin} onChange={e => setFilterAmountMin(e.target.value)} placeholder="Min" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Max Amount</label>
                          <Input type="number" value={filterAmountMax} onChange={e => setFilterAmountMax(e.target.value)} placeholder="Max" />
                      </div>
                        {/* Alerts */}
                        <div className="flex items-center gap-2 mt-6">
                          <input type="checkbox" id="filter-alert" checked={filterAlert} onChange={e => setFilterAlert(e.target.checked)} className="form-checkbox h-5 w-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary" />
                          <label htmlFor="filter-alert" className="text-sm font-medium">Only show budgets with triggered alerts</label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={handleResetAdvancedFilters}>Reset</Button>
                      <Button onClick={handleApplyAdvancedFilters}>Apply Filters</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Budget DataTable */}
          <Card>
            <CardHeader>
              <CardTitle>Budgets</CardTitle>
              <CardDescription>
                {loading ? 'Loading...' : `${filteredBudgets.length} budgets found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading budgets...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={fetchBudgets} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : filteredBudgets.length === 0 ? (
              <div className="text-center py-8">
                  <p className="text-muted-foreground">No budgets found matching your filters.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => router.push('/dashboard/financial/budgets/new')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Budget
                  </Button>
              </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={tableData}
                  searchKey="name"
                  searchPlaceholder="Search budgets by name..."
                  showColumnToggle={true}
                  showPagination={true}
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost-centers" className="space-y-4">
          <CostCentersPage />
        </TabsContent>

        <TabsContent value="analytics">
          <BudgetAnalyticsTab />
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
       <DeleteDialog
         isOpen={isDeleteDialogOpen}
         onClose={closeDeleteDialog}
         onConfirm={() => confirmDelete(async (item) => {
           const budget = filteredBudgets.find(b => b.id === item.id);
           if (budget) {
             await handleConfirmDelete(budget);
           }
         })}
         title="Delete Budget"
         description="This action will permanently remove the budget and all associated data from the system."
         item={itemToDelete}
         itemDetails={itemToDelete ? [
           { label: 'Budget Name', value: itemToDelete.name },
           { label: 'Department', value: itemToDelete.department },
           { label: 'Total Amount', value: `${currency?.symbol || 'GH₵'}${itemToDelete.totalAmount?.toLocaleString() || '0'}` },
           { label: 'Status', value: itemToDelete.status }
         ] : []}
         consequences={[
           'All budget allocations will be removed',
           'Historical spending data will be lost',
           'Associated reports will no longer be available',
           'This action cannot be undone'
         ]}
         confirmText="DELETE BUDGET"
         isLoading={false}
         warningLevel="high"
       />
    </div>
  );
}

