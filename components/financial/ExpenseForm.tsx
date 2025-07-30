'use client';

import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Calendar, Upload, Save, X, Plus, FileText, DollarSign, Settings, Paperclip } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { CurrencySelector } from '@/components/financial/CurrencySelector';
import CreateCategoryDialog from '@/components/financial/CreateCategoryDialog';
import { ExpenseManagementService } from '@/lib/expense-management-service';
import { DepartmentService, Department } from '@/lib/department-service';
import { ExpenseFormData, ExpenseCategory } from '@/lib/types/financial-types';

interface ExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: '',
    description: '',
    amount: 0,
    currency: 'GHS', // Default to Ghana Cedis
    category: '',
    subcategory: '',
    departmentId: '',
    expenseDate: new Date(),
    billable: false,
    reimbursable: true,
    tags: [],
    receiptFile: undefined
  });

  // Check if user is owner
  const isOwner = userProfile?.role === 'owner';

  // Load expense categories and departments when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (!currentWorkspace?.id) return;
      
      try {
        let workspaceDepartments: any[] = [];
        
        // For owners, load from all accessible workspaces
        if (isOwner && accessibleWorkspaces?.length > 0) {
          const departmentPromises = accessibleWorkspaces.map(async (workspace) => {
            try {
              const depts = await DepartmentService.getWorkspaceDepartments(workspace.id);
              return depts.map(dept => ({
                ...dept,
                _workspaceName: workspace.name,
                _workspaceId: workspace.id
              }));
            } catch (error) {
              console.warn(`Failed to load departments for workspace ${workspace.name}:`, error);
              return [];
            }
          });
          
          const departmentResults = await Promise.all(departmentPromises);
          workspaceDepartments = departmentResults.flat();
        } else {
          // For non-owners, load from current workspace only
          workspaceDepartments = await DepartmentService.getWorkspaceDepartments(currentWorkspace.id);
        }
        
        const workspaceCategories = await ExpenseManagementService.getWorkspaceExpenseCategories(currentWorkspace.id);
        
        setCategories(workspaceCategories);
        setDepartments(workspaceDepartments);
      } catch (error) {
        console.error('Error loading data:', error);
        // Use defaults if loading fails
        setCategories([]);
        setDepartments([]);
      }
    };

    loadData();
  }, [currentWorkspace?.id, isOwner, accessibleWorkspaces]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        receiptFile: e.target.files![0]
      }));
    }
  };

  const handleCategoryCreated = (newCategory: any) => {
    // Add the new category to the list
    setCategories(prev => [...prev, newCategory]);
    // Auto-select the new category
    setFormData(prev => ({
      ...prev,
      category: newCategory.id
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !currentWorkspace) {
      toast({
        title: "Error",
        description: "User or workspace not found",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title || !formData.amount || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      
      // Create expense using the management service
      await ExpenseManagementService.createExpense(
        currentWorkspace.id,
        formData,
        user.uid
      );
      
      toast({
        title: "Success",
        description: "Expense submitted successfully",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        amount: 0,
        currency: 'GHS',
        category: '',
        subcategory: '',
        expenseDate: new Date(),
        billable: false,
        reimbursable: true,
        tags: [],
        receiptFile: undefined
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting expense:', error);
      toast({
        title: "Error",
        description: "Failed to submit expense. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl">Submit New Expense</CardTitle>
        <CardDescription>
          Fill out the form below to submit an expense for approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              <TabsTrigger value="receipt" className="flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                <span className="hidden sm:inline">Receipt</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium">Expense Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Business lunch with client"
                    className="mt-1.5"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Additional details about the expense..."
                    rows={3}
                    className="mt-1.5 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="0.00"
                      className="mt-1.5"
                      required
                    />
                  </div>

                  <div>
                    <CurrencySelector
                      value={formData.currency}
                      onChange={(value) => handleInputChange('currency', value)}
                      label="Currency"
                      showConverter={true}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                    <CreateCategoryDialog 
                      onCategoryCreated={handleCategoryCreated}
                      trigger={
                        <Button variant="ghost" size="sm" type="button" className="h-6 px-2 text-xs">
                          <Plus className="w-3 h-3 mr-1" />
                          New
                        </Button>
                      }
                    />
                  </div>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="mt-1.5">
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
                        <>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="meals">Meals & Entertainment</SelectItem>
                          <SelectItem value="software">Software & Subscriptions</SelectItem>
                          <SelectItem value="office-supplies">Office Supplies</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department" className="text-sm font-medium">Department (Optional)</Label>
                  <Select value={formData.departmentId || 'none'} onValueChange={(value) => handleInputChange('departmentId', value === 'none' ? undefined : value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Department</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <DatePicker
                    id="expenseDate"
                    label="Expense Date"
                    placeholder="Select expense date"
                    value={formData.expenseDate}
                    onChange={(date) => handleInputChange('expenseDate', date || new Date())}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="subcategory" className="text-sm font-medium">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    placeholder="e.g., Client meeting"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags" className="text-sm font-medium">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => {
                    const tagString = e.target.value;
                    const tagsArray = tagString.split(',').map(tag => tag.trim()).filter(Boolean);
                    handleInputChange('tags', tagsArray);
                  }}
                  placeholder="e.g., urgent, project-alpha"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate tags with commas
                </p>
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
                    onCheckedChange={(checked) => handleInputChange('billable', checked)}
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
                    onCheckedChange={(checked) => handleInputChange('reimbursable', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Receipt Tab */}
            <TabsContent value="receipt" className="space-y-6 mt-6">
              <div>
                <Label className="text-sm font-medium">Receipt Upload</Label>
                <input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('receipt')?.click()}
                  className="w-full h-32 border-2 border-dashed hover:border-primary transition-colors flex-col gap-3 mt-2"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">{formData.receiptFile ? formData.receiptFile.name : 'Upload Receipt'}</span>
                  <span className="text-xs text-muted-foreground">Click to browse or drag and drop</span>
                </Button>
                {formData.receiptFile && (
                  <div className="mt-3 flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Badge variant="secondary" className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {formData.receiptFile.name}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInputChange('receiptFile', undefined)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Upload receipt image or PDF (optional)
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons - Always visible */}
          <div className="flex gap-4 pt-6 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12">
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading} className="flex-1 h-12">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Submit Expense
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
