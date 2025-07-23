'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  User,
  Building2
} from 'lucide-react';
import { ExpenseManagementService } from '@/lib/expense-management-service';
import { ExpenseAccessControl } from '@/lib/expense-access-control';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useUserNames } from '@/hooks/use-user-names';
import { Expense } from '@/lib/types/financial-types';
import { safeNumber, formatNumber } from '@/lib/utils';
import { ExpenseDetailSkeleton } from '@/components/financial/ExpenseDetailSkeleton';

interface ExpenseDetailPageProps {
  params: {
    id: string;
  };
}

export default function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();

  // User name resolution (memoized to prevent infinite loops)
  const userIds = useMemo(() => {
    return expense ? [expense.submittedBy] : [];
  }, [expense]);

  const { userNames } = useUserNames(userIds);

  const getUserDisplayName = (userId: string) => {
    return userNames.get(userId) || 'Unknown User';
  };

  const fetchExpense = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setError('No workspace selected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const expenseData = await ExpenseManagementService.getExpense(params.id);

      // Check if user can view this expense
      if (expenseData && user?.uid) {
        const canView = await ExpenseAccessControl.canUserViewExpense(
          user.uid,
          currentWorkspace.id,
          { submittedBy: expenseData.submittedBy, departmentId: expenseData.departmentId }
        );

        if (!canView) {
          setError('You do not have permission to view this expense.');
          setLoading(false);
          return;
        }
      }

      setExpense(expenseData);
    } catch (err) {
      console.error('Error fetching expense:', err);
      setError('Failed to load expense details. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load expense details.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, params.id, user?.uid, toast]);

  const checkPermissions = useCallback(async () => {
    if (!expense || !user?.uid || !currentWorkspace?.id) return;

    try {
      const editPermission = await ExpenseAccessControl.canUserEditExpense(
        user.uid,
        currentWorkspace.id,
        {
          submittedBy: expense.submittedBy,
          departmentId: expense.departmentId,
          status: expense.status
        }
      );

      const deletePermission = await ExpenseAccessControl.canUserDeleteExpense(
        user.uid,
        currentWorkspace.id,
        {
          submittedBy: expense.submittedBy,
          departmentId: expense.departmentId,
          status: expense.status
        }
      );

      setCanEdit(editPermission);
      setCanDelete(deletePermission);
    } catch (err) {
      console.error('Error checking permissions:', err);
    }
  }, [expense, user?.uid, currentWorkspace?.id]);

  useEffect(() => {
    if (currentWorkspace?.id && params.id) {
      fetchExpense();
    }
  }, [currentWorkspace?.id, params.id, fetchExpense]);

  useEffect(() => {
    if (expense) {
      checkPermissions();
    }
  }, [expense, checkPermissions]);

  const handleDelete = async () => {
    if (!expense?.id || !user?.uid) return;

    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }

    try {
      await ExpenseManagementService.deleteExpense(expense.id);
      toast({
        title: 'Success',
        description: 'Expense deleted successfully!'
      });
      router.push('/dashboard/financial/expenses');
    } catch (err) {
      console.error('Error deleting expense:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete expense. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleApprove = async () => {
    if (!expense?.id) return;

    try {
      await ExpenseManagementService.updateExpense(expense.id, {
        status: 'approved'
      });
      await fetchExpense(); // Refresh data
      toast({
        title: 'Success',
        description: 'Expense approved successfully!'
      });
    } catch (err) {
      console.error('Error approving expense:', err);
      toast({
        title: 'Error',
        description: 'Failed to approve expense. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleReject = async () => {
    if (!expense?.id) return;

    try {
      await ExpenseManagementService.updateExpense(expense.id, {
        status: 'rejected'
      });
      await fetchExpense(); // Refresh data
      toast({
        title: 'Success',
        description: 'Expense rejected.'
      });
    } catch (err) {
      console.error('Error rejecting expense:', err);
      toast({
        title: 'Error',
        description: 'Failed to reject expense. Please try again.',
        variant: 'destructive'
      });
    }
  };

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
        return 'Pending Approval';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return <ExpenseDetailSkeleton />;
  }

  if (error || !expense) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || 'Expense not found'}</p>
        <Button onClick={() => router.push('/dashboard/financial/expenses')} variant="outline">
          Back to Expenses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/financial/expenses')}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{expense.title}</h1>
              <Badge className={getStatusColor(expense.status)}>
                {getStatusIcon(expense.status)}
                <span className="ml-1">{getStatusDisplayName(expense.status)}</span>
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Expense #{expense.id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {expense.status === 'submitted' && (
            <>
              <Button onClick={handleApprove} size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button onClick={handleReject} size="sm" variant="destructive">
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          {canEdit && (
            <Button
              onClick={() => router.push(`/dashboard/financial/expenses/edit/${expense.id}`)}
              size="sm"
              variant="outline"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button onClick={handleDelete} size="sm" variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Amount Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Amount Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Original Amount</p>
                  <p className="text-2xl font-bold">
                    {expense.currency} {formatNumber(safeNumber(expense.amount))}
                  </p>
                </div>
                {expense.currency !== 'GHS' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Amount in GHS</p>
                    <p className="text-2xl font-bold text-green-600">
                      GHS {formatNumber(safeNumber(expense.amountInBaseCurrency))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Exchange Rate: {formatNumber(safeNumber(expense.amountInBaseCurrency) / safeNumber(expense.amount), 4)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{expense.category.name}</p>
                  {expense.subcategory && (
                    <p className="text-sm text-muted-foreground">{expense.subcategory}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{expense.description || 'No description provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expense Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(expense.expenseDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted By</p>
                  <p className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {getUserDisplayName(expense.submittedBy)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submission Date</p>
                  <p className="font-medium">
                    {new Date(expense.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Expense Properties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Properties & Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {expense.billable && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">Billable</Badge>
                  )}
                  {expense.reimbursable && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">Reimbursable</Badge>
                  )}
                  {!expense.billable && !expense.reimbursable && (
                    <Badge variant="secondary">Internal</Badge>
                  )}
                </div>

                {expense.tags && expense.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex gap-2 flex-wrap">
                      {expense.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {expense.costCenterId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cost Center</p>
                    <p className="font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {expense.costCenterId}
                    </p>
                  </div>
                )}

                {expense.projectId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Project</p>
                    <p className="font-medium">{expense.projectId}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Receipt */}
          {expense.receiptUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Receipt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    <Download className="w-4 h-4" />
                    View Receipt
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Expense History</CardTitle>
              <CardDescription>
                Track all changes and approvals for this expense.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Expense Created</p>
                    <p className="text-sm text-muted-foreground">
                      Created by {expense.submittedBy} on {new Date(expense.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {expense.status === 'approved' && (
                  <div className="flex items-start gap-3 pb-4 border-b">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Expense Approved</p>
                      <p className="text-sm text-muted-foreground">
                        Approved for payment
                      </p>
                    </div>
                  </div>
                )}

                {expense.status === 'rejected' && (
                  <div className="flex items-start gap-3 pb-4 border-b">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Expense Rejected</p>
                      <p className="text-sm text-muted-foreground">
                        This expense was rejected
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}