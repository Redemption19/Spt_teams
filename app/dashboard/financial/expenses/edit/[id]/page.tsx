'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { LoadingSpinner, ExpenseEditSkeleton } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Trash2, AlertTriangle, FileText, DollarSign, Settings, Paperclip, Plus, X } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useCurrency } from '@/hooks/use-currency';
import { CurrencySelector } from '@/components/financial/CurrencySelector';
import { ExpenseEditService } from '@/lib/expense-edit-service';
import { DepartmentService, Department } from '@/lib/department-service';
import { Expense, ExpenseCategory } from '@/lib/types/financial-types';
import { DeleteDialog, useDeleteDialog } from '@/components/ui/delete-dialog';

interface ExpenseEditForm {
  title: string;
  description?: string;
  amount: number;
  currency: string;
  expenseDate: Date;
  category: string;
  departmentId?: string;
  costCenterId?: string;
  projectId?: string;
  vendor?: string;
  paymentMethod: string;
  notes?: string;
  tags: string[];
  billable: boolean;
  reimbursable: boolean;
}

export default function EditExpensePage() {
  const params = useParams();
  const router = useRouter();
  const expenseId = params.id as string;
  
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseLoading, setExpenseLoading] = useState(true);
  const [formDataLoading, setFormDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  
  const {
    isOpen: isDeleteDialogOpen,
    openDialog: openDeleteDialog,
    closeDialog: closeDeleteDialog,
    isLoading: isDeleting
  } = useDeleteDialog();
  
  const { currentWorkspace, subWorkspaces } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const { defaultCurrency, getCurrencySymbol } = useCurrency();

  const [formData, setFormData] = useState<ExpenseEditForm>({
    title: '',
    description: '',
    amount: 0,
    currency: defaultCurrency?.code || 'USD',
    expenseDate: new Date(),
    category: '',
    departmentId: '',
    costCenterId: '',
    projectId: '',
    vendor: '',
    paymentMethod: 'other',
    notes: '',
    tags: [],
    billable: false,
    reimbursable: true,
  });

  // Load expense data
  const loadExpense = useCallback(async () => {
    if (!expenseId || !currentWorkspace?.id || !user?.uid) return;

    try {
      setExpenseLoading(true);
      
      const expenseData = await ExpenseEditService.getExpenseById(expenseId, currentWorkspace.id, user.uid);
      
      if (!expenseData) {
        toast({
          title: 'Error',
          description: 'Expense not found',
          variant: 'destructive'
        });
        router.push('/dashboard/financial/expenses');
        return;
      }

      setExpense(expenseData);

      // Check edit permissions in parallel
      const canEdit = await ExpenseEditService.canUserEditExpense(user.uid, expenseId, currentWorkspace.id);
      if (!canEdit) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to edit this expense',
          variant: 'destructive'
        });
        router.push('/dashboard/financial/expenses');
        return;
      }

      // Populate form with expense data
      const editData = ExpenseEditService.prepareExpenseForEdit(expenseData);
      
      // Convert string date to Date object for our form
      const formDataWithDateObject = {
        ...editData,
        expenseDate: editData.expenseDate ? new Date(editData.expenseDate) : new Date()
      };
      
      setFormData(formDataWithDateObject);
    } catch (error) {
      console.error('Error loading expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to load expense data',
        variant: 'destructive'
      });
      router.push('/dashboard/financial/expenses');
    } finally {
      setExpenseLoading(false);
    }
  }, [expenseId, currentWorkspace?.id, user?.uid, toast, router]);

  // Load departments and categories in parallel for better performance
  const loadFormData = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    try {
      setFormDataLoading(true);
      
      // Get sub-workspace IDs for this workspace
      const subWorkspaceIds = (subWorkspaces[currentWorkspace.id] || []).map(sw => sw.id);
      
      // Load both departments (including sub-workspaces) and categories in parallel
      const [departmentsData, categoriesData] = await Promise.all([
        currentWorkspace.hasSubWorkspaces && subWorkspaceIds.length > 0
          ? DepartmentService.getWorkspaceDepartmentsWithSubs(currentWorkspace.id, subWorkspaceIds)
          : DepartmentService.getWorkspaceDepartments(currentWorkspace.id),
        ExpenseEditService.getWorkspaceExpenseCategories(currentWorkspace.id)
      ]);

      setDepartments(departmentsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading form data:', error);
      // Don't redirect on form data error, just show empty dropdowns
      toast({
        title: 'Warning',
        description: 'Some form data could not be loaded. You may need to refresh the page.',
        variant: 'destructive'
      });
    } finally {
      setFormDataLoading(false);
    }
  }, [currentWorkspace, subWorkspaces, toast]);

  // Update loading state when both operations complete
  useEffect(() => {
    setLoading(expenseLoading || formDataLoading);
  }, [expenseLoading, formDataLoading]);

  useEffect(() => {
    // Start loading both operations in parallel for better performance
    Promise.all([
      loadExpense(),
      loadFormData()
    ]);
  }, [loadExpense, loadFormData, currentWorkspace, expenseId, user?.uid]);

  // Handle form submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense || !currentWorkspace?.id || !user?.uid) return;

    try {
      setSaving(true);

      // Validate form data
      const validation = ExpenseEditService.validateExpenseUpdateData({
        title: formData.title,
        amount: formData.amount,
        currency: formData.currency,
        expenseDate: formData.expenseDate
      });

      if (!validation.isValid) {
        toast({
          title: 'Validation Error',
          description: validation.errors.join(', '),
          variant: 'destructive'
        });
        return;
      }

      const updateData: Partial<Expense> = {
        title: formData.title,
        description: formData.description,
        amount: formData.amount,
        currency: formData.currency,
        expenseDate: formData.expenseDate,
        category: categories.find(c => c.id === formData.category) || expense.category,
        departmentId: formData.departmentId,
        costCenterId: formData.costCenterId,
        projectId: formData.projectId,
        vendor: formData.vendor,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        tags: formData.tags,
        billable: formData.billable,
        reimbursable: formData.reimbursable,
        updatedAt: new Date()
      };

      await ExpenseEditService.updateExpenseSecure(expense.id, updateData, currentWorkspace.id, user.uid);

      toast({
        title: 'Success',
        description: 'Expense updated successfully'
      });

      router.push('/dashboard/financial/expenses');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to update expense',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle expense deletion
  const handleDeleteConfirm = async () => {
    if (!expense || !currentWorkspace?.id || !user?.uid) return;

    try {
      await ExpenseEditService.deleteExpenseSecure(expense.id, currentWorkspace.id, user.uid);

      toast({
        title: 'Success',
        description: 'Expense deleted successfully'
      });

      router.push('/dashboard/financial/expenses');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        variant: 'destructive'
      });
    }
  };

  // Handle adding tags
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  // Handle removing tags
  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  if (loading) {
    return <ExpenseEditSkeleton />;
  }

  if (!expense) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-lg font-semibold">Expense Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The expense you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Button 
            onClick={() => router.push('/dashboard/financial/expenses')}
            className="mt-4"
          >
            Back to Expenses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/financial/expenses/${expense.id}`)}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Expense</h1>
            <p className="text-muted-foreground">
              Update expense details and information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="destructive"
            onClick={() => expense && openDeleteDialog({ id: expense.id, name: expense.title })}
            disabled={isDeleting}
            className="h-9"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>
            Edit the expense information below. All required fields must be filled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formDataLoading && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-muted-foreground">Loading form data...</span>
              </div>
            </div>
          )}
          
          <form onSubmit={onSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Basic Info</span>
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="hidden sm:inline">Details</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
                <TabsTrigger value="additional" className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  <span className="hidden sm:inline">Additional</span>
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter expense title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        required
                      />
                      <CurrencySelector
                        value={formData.currency}
                        onChange={(value: string) => setFormData({ ...formData, currency: value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter expense description"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes"
                      rows={2}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <DatePicker
                      id="expenseDate"
                      label="Expense Date"
                      placeholder="Select expense date"
                      value={formData.expenseDate}
                      onChange={(date) => setFormData({ ...formData, expenseDate: date || new Date() })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length > 0 ? (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-categories" disabled>
                            {formDataLoading ? 'Loading categories...' : 'No categories available'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.departmentId || 'none'}
                      onValueChange={(value) => setFormData({ ...formData, departmentId: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Department</SelectItem>
                        {departments.length > 0 ? (
                          departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-departments" disabled>
                            {formDataLoading ? 'Loading departments...' : 'No departments available'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor</Label>
                    <Input
                      id="vendor"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      placeholder="Enter vendor name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="debit_card">Debit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div>
                      <Label htmlFor="billable" className="text-sm font-medium">Billable to Client</Label>
                      <p className="text-sm text-muted-foreground">
                        Can this expense be billed to a client?
                      </p>
                    </div>
                    <Switch
                      id="billable"
                      checked={formData.billable}
                      onCheckedChange={(checked) => setFormData({ ...formData, billable: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div>
                      <Label htmlFor="reimbursable" className="text-sm font-medium">Reimbursable</Label>
                      <p className="text-sm text-muted-foreground">
                        Should this expense be reimbursed?
                      </p>
                    </div>
                    <Switch
                      id="reimbursable"
                      checked={formData.reimbursable}
                      onCheckedChange={(checked) => setFormData({ ...formData, reimbursable: checked })}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Additional Tab */}
              <TabsContent value="additional" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="costCenter">Cost Center ID</Label>
                    <Input
                      id="costCenter"
                      value={formData.costCenterId}
                      onChange={(e) => setFormData({ ...formData, costCenterId: e.target.value })}
                      placeholder="Enter cost center ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project">Project ID</Label>
                    <Input
                      id="project"
                      value={formData.projectId}
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      placeholder="Enter project ID"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Actions - Always visible */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/financial/expenses')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="min-w-[120px]"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
       <DeleteDialog
         isOpen={isDeleteDialogOpen}
         onClose={closeDeleteDialog}
         onConfirm={handleDeleteConfirm}
         title="Delete Expense"
         description="This action will permanently remove the expense and all associated data from the system."
         item={expense ? { id: expense.id, name: expense.title } : null}
         itemDetails={expense ? [
           { label: 'Title', value: expense.title },
           { label: 'Amount', value: `${expense.currency} ${(expense.amount || 0).toLocaleString()}` },
           { label: 'Category', value: String(expense.category) },
           { label: 'Date', value: new Date(expense.createdAt).toLocaleDateString() },
           { label: 'Status', value: expense.status }
         ] : undefined}
         consequences={[
           'All expense data will be permanently removed',
           'Associated receipts and attachments will be deleted',
           'This expense will no longer appear in reports',
           'This action cannot be undone'
         ]}
         confirmText="DELETE EXPENSE"
         isLoading={isDeleting}
         warningLevel="high"
       />
    </div>
  );
}
