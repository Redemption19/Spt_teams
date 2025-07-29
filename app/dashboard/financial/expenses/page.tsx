'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Filter, Download, Search, Eye, Edit, Trash2, DollarSign, Clock, CheckCircle, XCircle, BarChart3, Settings, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { createExpenseColumns, ExpenseTableData } from '@/components/financial/ExpenseColumns';
import { ExpenseManagementService } from '@/lib/expense-management-service';
import { ExpenseAccessControl } from '@/lib/expense-access-control';
import { DepartmentService, Department } from '@/lib/department-service';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useUserNames } from '@/hooks/use-user-names';
import { useCurrency } from '@/hooks/use-currency';
import { safeNumber, formatNumber, formatDate } from '@/lib/utils';
import { Expense } from '@/lib/types/financial-types';
import { ExpenseAccessInfo } from '@/components/financial/ExpenseAccessInfo';
import { useIsOwner } from '@/lib/rbac-hooks';
import BulkImportModal from '@/components/financial/BulkImportModal';
import { ExpensesLoadingSkeleton } from '@/components/financial/ExpensesLoadingSkeleton';
import { DeleteDialog, useDeleteDialog } from '@/components/ui/delete-dialog';

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<any>(null);
  
  // Cross-workspace management state for owners - persisted
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('expenses-showAllWorkspaces') === 'true';
    }
    return false;
  });
  const [workspaceSummary, setWorkspaceSummary] = useState<any>(null); // For owner dashboard
  
  // Bulk import state
  const [showBulkImport, setShowBulkImport] = useState(false);

  const router = useRouter();
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const { defaultCurrency, getCurrencySymbol, getCurrencyCode } = useCurrency();
  const isOwner = useIsOwner();

  // Extract user IDs from expenses for name resolution (memoized to prevent infinite loops)
  const userIds = useMemo(() => {
    return expenses.map(expense => expense.submittedBy).filter(Boolean);
  }, [expenses]);
  
  const { userNames } = useUserNames(userIds);

  // Delete dialog hook
  const deleteDialog = useDeleteDialog();

  const fetchUserPermissions = useCallback(async () => {
    if (!currentWorkspace?.id || !user?.uid) return;
    
    console.log('🏢 ExpensesPage: Current workspace context:', {
      workspaceId: currentWorkspace?.id,
      workspaceName: currentWorkspace?.name,
      userId: user?.uid
    });
    
    try {
      const permissions = await ExpenseAccessControl.getExpenseAccessLevel(user.uid, currentWorkspace.id);
      setUserPermissions(permissions);
    } catch (err) {
      console.error('Error fetching user permissions:', err);
    }
  }, [currentWorkspace?.id, currentWorkspace?.name, user?.uid]);

  const canEditExpense = useCallback(async (expense: Expense): Promise<boolean> => {
    if (!currentWorkspace?.id || !user?.uid) return false;
    
    try {
      return await ExpenseAccessControl.canUserEditExpense(
        user.uid, 
        currentWorkspace.id, 
        { 
          submittedBy: expense.submittedBy, 
          departmentId: expense.departmentId, 
          status: expense.status 
        }
      );
    } catch (err) {
      console.error('Error checking edit permission:', err);
      return false;
    }
  }, [currentWorkspace?.id, user?.uid]);

  const canDeleteExpense = useCallback(async (expense: Expense): Promise<boolean> => {
    if (!currentWorkspace?.id || !user?.uid) return false;
    
    try {
      return await ExpenseAccessControl.canUserDeleteExpense(
        user.uid, 
        currentWorkspace.id, 
        { 
          submittedBy: expense.submittedBy, 
          departmentId: expense.departmentId, 
          status: expense.status 
        }
      );
    } catch (err) {
      console.error('Error checking delete permission:', err);
      return false;
    }
  }, [currentWorkspace?.id, user?.uid]);

  // Handle workspace view toggle with persistence
  const handleWorkspaceViewToggle = useCallback((showAll: boolean) => {
    setShowAllWorkspaces(showAll);
    if (typeof window !== 'undefined') {
      localStorage.setItem('expenses-showAllWorkspaces', showAll.toString());
    }
  }, []);

  // Component for expense action buttons with permission checks
  const ExpenseActionButtons = ({ expense }: { expense: Expense }) => {
    const [canEdit, setCanEdit] = useState(false);
    const [canDelete, setCanDelete] = useState(false);

    useEffect(() => {
      const checkPermissions = async () => {
        const editPermission = await canEditExpense(expense);
        const deletePermission = await canDeleteExpense(expense);
        setCanEdit(editPermission);
        setCanDelete(deletePermission);
      };
      
      checkPermissions();
    }, [expense]);

    return (
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          title="View Details"
          onClick={() => router.push(`/dashboard/financial/expenses/${expense.id}`)}
        >
          <Eye className="w-4 h-4" />
        </Button>
        {canEdit && (
          <Button 
            variant="ghost" 
            size="sm" 
            title="Edit"
            onClick={() => router.push(`/dashboard/financial/expenses/edit/${expense.id}`)}
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
        {canDelete && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-700"
            title="Delete"
            onClick={() => handleDeleteExpense(expense.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  };

  // Optimized parallel data loading
  const loadAllData = useCallback(async () => {
    if (!currentWorkspace?.id || !user?.uid) {
      setError('No workspace selected or user not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Determine workspace IDs to load from
      const workspaceIds = (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) 
        ? accessibleWorkspaces.map(w => w.id)
        : [currentWorkspace.id];
      
      console.log('🏢 Loading all expense data from workspaces:', workspaceIds);
      
      // Load all data in parallel for better performance
      const [expensesData, departmentsData, permissionsData, summaryData] = await Promise.all([
        // Load expenses
        (async () => {
          if (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) {
            return await ExpenseManagementService.getOwnerCrossWorkspaceExpenses(
              currentWorkspace.id,
              {
                status: statusFilter !== 'all' ? statusFilter as Expense['status'] : undefined,
                limit: 100
              }
            );
          } else {
            return await ExpenseManagementService.getExpensesWithAccessControl(
              currentWorkspace.id,
              user.uid,
              {
                status: statusFilter !== 'all' ? statusFilter as Expense['status'] : undefined,
                limit: 100
              }
            );
          }
        })(),
        
        // Load departments
        (async () => {
          if (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) {
            const allDepartments: Department[] = [];
            const departmentPromises = [currentWorkspace, ...accessibleWorkspaces].map(async (workspace) => {
              try {
                const workspaceDepartments = await DepartmentService.getWorkspaceDepartments(workspace.id);
                return workspaceDepartments.map(dept => ({
                  ...dept,
                  workspaceName: workspace.name
                }));
              } catch (error) {
                console.warn(`Failed to load departments for workspace ${workspace.name}:`, error);
                return [];
              }
            });
            
            const departmentResults = await Promise.all(departmentPromises);
            departmentResults.forEach(depts => allDepartments.push(...depts));
            return allDepartments;
          } else {
            return await DepartmentService.getWorkspaceDepartments(currentWorkspace.id);
          }
        })(),
        
        // Load user permissions
        ExpenseAccessControl.getExpenseAccessLevel(user.uid, currentWorkspace.id),
        
        // Load workspace summary for owners
        (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) 
          ? ExpenseManagementService.getOwnerWorkspaceSummary(currentWorkspace.id)
          : Promise.resolve(null)
      ]);

      // Update all state at once to prevent multiple re-renders
      setExpenses(expensesData);
      setDepartments(departmentsData);
      setUserPermissions(permissionsData);
      setWorkspaceSummary(summaryData);
      
    } catch (err) {
      console.error('Error loading expense data:', err);
      setError('Failed to load expense data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load expense data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, user?.uid, statusFilter, isOwner, showAllWorkspaces, accessibleWorkspaces, toast]);

  // Fetch expenses and departments on component mount and when workspace changes
  useEffect(() => {
    if (currentWorkspace?.id) {
      loadAllData();
    }
  }, [currentWorkspace, statusFilter, loadAllData]);

  // Optimized filtering and calculations with memoization
  const filteredExpenses = useMemo(() => {
    if (!expenses.length) return [];
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return expenses.filter(expense => {
      const matchesSearch = expense.title.toLowerCase().includes(lowerSearchTerm) ||
                           (expense.description?.toLowerCase().includes(lowerSearchTerm) || false);
      const matchesCategory = categoryFilter === 'all' || expense.category.name === categoryFilter;
      const matchesDepartment = departmentFilter === 'all' || expense.departmentId === departmentFilter;
      
      return matchesSearch && matchesCategory && matchesDepartment;
    });
  }, [expenses, searchTerm, categoryFilter, departmentFilter]);


  // Helper: get department name
  const getDepartmentName = useCallback((departmentId?: string) => {
    if (!departmentId) return 'No Department';
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Unknown Department';
  }, [departments]);

  // Helper: get user display name
  const getUserDisplayName = useCallback((userId: string) => {
    return userNames.get(userId) || 'Unknown User';
  }, [userNames]);

  // State for table data with permissions
  const [expenseTableDataWithPermissions, setExpenseTableData] = useState<ExpenseTableData[]>([]);

  // Prepare table data with all necessary information
  const expenseTableData = useMemo(() => {
    if (!filteredExpenses.length) return [];
    
    return filteredExpenses.map((expense) => ({
      ...expense,
      workspaceName: (expense as any).workspaceName,
      departmentName: getDepartmentName(expense.departmentId),
      submittedByName: getUserDisplayName(expense.submittedBy),
      canEdit: false, // Will be updated asynchronously
      canDelete: false, // Will be updated asynchronously
    } as ExpenseTableData));
  }, [filteredExpenses, getDepartmentName, getUserDisplayName]);

  // Update permissions asynchronously
  useEffect(() => {
    const updatePermissions = async () => {
      const updatedData = await Promise.all(
        expenseTableData.map(async (expense) => {
          const [canEdit, canDelete] = await Promise.all([
            canEditExpense(expense),
            canDeleteExpense(expense)
          ]);
          
          return {
            ...expense,
            canEdit,
            canDelete,
          };
        })
      );
      
      setExpenseTableData(updatedData);
    };

    if (expenseTableData.length > 0) {
      updatePermissions();
    }
  }, [expenseTableData, canEditExpense, canDeleteExpense]);


  // Table action handlers
  const handleViewExpense = useCallback((expense: ExpenseTableData) => {
    router.push(`/dashboard/financial/expenses/${expense.id}`);
  }, [router]);

  const handleEditExpense = useCallback((expense: ExpenseTableData) => {
    router.push(`/dashboard/financial/expenses/edit/${expense.id}`);
  }, [router]);

  // ...existing code...

  const handleDeleteExpense = useCallback(async (expenseId: string) => {
    if (!currentWorkspace?.id || !user?.uid) return;

    try {
      await ExpenseManagementService.deleteExpense(expenseId);
      await loadAllData(); // Refresh all data
      toast({
        title: 'Success',
        description: 'Expense deleted successfully!'
      });
    } catch (err) {
      console.error('Error deleting expense:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete expense. Please try again.',
        variant: 'destructive'
      });
    }
  }, [currentWorkspace?.id, user?.uid, loadAllData, toast]);

  const handleDeleteExpenseFromTable = useCallback((expense: ExpenseTableData) => {
    deleteDialog.openDialog({
      id: expense.id,
      name: expense.title || 'Untitled Expense',
      type: 'expense'
    });
  }, [deleteDialog]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteDialog.item) return;
    await deleteDialog.handleConfirm(async (item) => {
      await handleDeleteExpense(item.id);
    });
  }, [deleteDialog, handleDeleteExpense]);

  // Create columns for the table
  const columns = useMemo(() => createExpenseColumns({
    showAllWorkspaces,
    getCurrencyCode,
    onEdit: handleEditExpense,
    onDelete: handleDeleteExpenseFromTable,
    onView: handleViewExpense,
  }), [showAllWorkspaces, getCurrencyCode, handleEditExpense, handleDeleteExpenseFromTable, handleViewExpense]);

  // Optimized amount calculations with memoization
  const expenseStats = useMemo(() => {
    if (!filteredExpenses.length) {
      return {
        totalAmount: 0,
        approvedAmount: 0,
        pendingAmount: 0,
        rejectedAmount: 0
      };
    }

    let totalAmount = 0;
    let approvedAmount = 0;
    let pendingAmount = 0;
    let rejectedAmount = 0;

    filteredExpenses.forEach(expense => {
      const amount = safeNumber(expense?.amountInBaseCurrency);
      totalAmount += amount;

      switch (expense?.status) {
        case 'approved':
          approvedAmount += amount;
          break;
        case 'submitted':
          pendingAmount += amount;
          break;
        case 'rejected':
          rejectedAmount += amount;
          break;
      }
    });

    return {
      totalAmount,
      approvedAmount,
      pendingAmount,
      rejectedAmount
    };
  }, [filteredExpenses]);

  const handleNewExpense = () => {
    // Navigate to dedicated new expense page
    router.push('/dashboard/financial/expenses/new');
  };


  // ...existing code...

  // Helper functions for status display
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'submitted':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'draft':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Pending';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };


  // Show skeleton loading for better UX
  if (loading) {
    return <ExpensesLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground">
            Track and manage your business expenses
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
          
          <Button 
            onClick={() => router.push('/dashboard/financial/expenses/categories')} 
            variant="outline" 
            size="sm"
            className="shrink-0"
          >
            <Settings className="w-4 h-4 mr-2" />
            Categories
          </Button>
          <Button 
            onClick={() => router.push('/dashboard/financial/expenses/analytics')} 
            variant="outline" 
            className="shrink-0"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          {userPermissions && (userPermissions.canEdit || userPermissions.canEditOwn) && (
            <>
              <Button 
                onClick={() => setShowBulkImport(true)} 
                variant="outline" 
                className="shrink-0"
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
              <Button onClick={handleNewExpense} className="shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                New Expense
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Cross-workspace scope banner for owners */}
      {isOwner && showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
          <p className="text-sm text-green-700 dark:text-green-400">
            🌐 <strong>Cross-Workspace Expenses:</strong> Displaying expenses across all {accessibleWorkspaces.length} accessible workspaces. Expenses, analytics, and management features from all workspaces are aggregated for centralized oversight.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      {showAllWorkspaces && workspaceSummary ? (
        /* Cross-workspace summary for owners */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Across All Workspaces</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getCurrencySymbol()}{formatNumber(workspaceSummary.totalAmount || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {workspaceSummary.totalExpenses || 0} expenses from {workspaceSummary.workspaceCount || 0} workspaces
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Total</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{getCurrencySymbol()}{formatNumber(workspaceSummary.approvedAmount || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Approved and paid expenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Total</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{getCurrencySymbol()}{formatNumber(workspaceSummary.pendingAmount || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {workspaceSummary.pendingCount || 0} pending expenses
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Workspace breakdown */}
          <Card className="border-green-200 dark:border-green-800/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <span className="text-base mr-2">🏢</span>
                Workspace Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workspaceSummary.workspaces && workspaceSummary.workspaces.length > 0 ? (
                  workspaceSummary.workspaces.map((ws: any, index: number) => (
                    <div 
                      key={ws.id} 
                      className={`flex justify-between items-center p-4 rounded-lg border transition-colors ${
                        ws.type === 'main' 
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/50' 
                          : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800/50'
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{ws.type === 'main' ? '🏛️' : '🏢'}</span>
                          <span className={`font-medium ${
                            ws.type === 'main' 
                              ? 'text-blue-700 dark:text-blue-300' 
                              : 'text-green-700 dark:text-green-300'
                          }`}>
                            {ws.name}
                          </span>
                          {ws.type === 'main' && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                              Main
                            </Badge>
                          )}
                        </div>
                        {ws.expenseCount > 0 && (
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {ws.pendingCount > 0 && (
                                <span className="text-yellow-600 dark:text-yellow-400">
                                  {ws.pendingCount} pending
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          ws.type === 'main' 
                            ? 'text-blue-700 dark:text-blue-300' 
                            : 'text-green-700 dark:text-green-300'
                        }`}>
                          {getCurrencySymbol()}{formatNumber(ws.totalAmount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ws.expenseCount} expense{ws.expenseCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-sm text-muted-foreground">No workspace data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Regular workspace summary */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getCurrencySymbol()}{formatNumber(expenseStats.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {(filteredExpenses || []).length} expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{getCurrencySymbol()}{formatNumber(expenseStats.approvedAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {(filteredExpenses || []).filter(e => e?.status === 'approved').length} approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{getCurrencySymbol()}{formatNumber(expenseStats.pendingAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {(filteredExpenses || []).filter(e => e?.status === 'submitted').length} pending
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Access Info */}
      <ExpenseAccessInfo />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Expense List</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Meals & Entertainment">Meals & Entertainment</SelectItem>
                    <SelectItem value="Software & Subscriptions">Software & Subscriptions</SelectItem>
                    <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Expense List */}
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>
                {loading ? 'Loading...' : `${(expenseTableDataWithPermissions || []).length} expenses found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading expenses...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={loadAllData} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={expenseTableDataWithPermissions}
                  searchKey="title"
                  searchPlaceholder="Search expenses by title..."
                  showColumnToggle={true}
                  showPagination={true}
                  pageSize={10}
                />
              )}
              
              {(expenseTableDataWithPermissions || []).length === 0 && !loading && !error && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No expenses found matching your filters.</p>
                  {userPermissions && (userPermissions.canEdit || userPermissions.canEditOwn) && (
                    <Button 
                      variant="outline" 
                      className="mt-4" 
                      onClick={() => router.push('/dashboard/financial/expenses/new')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Expense
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          onImportComplete={() => {
            setShowBulkImport(false);
            loadAllData(); // Refresh all expense data
          }}
          onClose={() => setShowBulkImport(false)}
        />
      )}
      
      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.closeDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Expense"
        description="This action cannot be undone. The expense will be permanently removed from your records."
        item={deleteDialog.item}
        warningLevel="high"
      />
    </div>
  );
}
