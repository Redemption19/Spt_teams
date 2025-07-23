'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { ExpenseManagementService } from '@/lib/expense-management-service';
import { ExpenseCategory } from '@/lib/types/financial-types';

interface CreateCategoryDialogProps {
  onCategoryCreated?: (category: ExpenseCategory) => void;
  trigger?: React.ReactNode;
  editCategory?: ExpenseCategory;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CreateCategoryDialog({ 
  onCategoryCreated, 
  trigger, 
  editCategory,
  open: controlledOpen,
  onOpenChange 
}: CreateCategoryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();

  // Use controlled or internal open state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    requiresApproval: true,
    approvalLimit: 0,
    isActive: true
  });

  // Update form data when editing category changes
  useEffect(() => {
    if (editCategory) {
      setFormData({
        name: editCategory.name || '',
        code: editCategory.code || '',
        description: editCategory.description || '',
        requiresApproval: editCategory.requiresApproval,
        approvalLimit: editCategory.approvalLimit || 0,
        isActive: editCategory.isActive
      });
    } else {
      // Reset form for new category
      setFormData({
        name: '',
        code: '',
        description: '',
        requiresApproval: true,
        approvalLimit: 0,
        isActive: true
      });
    }
  }, [editCategory]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateCode = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 10);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      code: prev.code || generateCode(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentWorkspace?.id) {
      toast({
        title: 'Error',
        description: 'No workspace selected',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      const categoryData = {
        name: formData.name.trim(),
        code: formData.code.trim() || generateCode(formData.name),
        description: formData.description.trim() || undefined,
        requiresApproval: formData.requiresApproval,
        approvalLimit: formData.approvalLimit > 0 ? formData.approvalLimit : undefined,
        isActive: formData.isActive
      };

      let categoryId: string;
      let updatedCategory: ExpenseCategory;

      if (editCategory) {
        // Update existing category
        await ExpenseManagementService.updateExpenseCategory(editCategory.id, categoryData);
        categoryId = editCategory.id;
        updatedCategory = {
          ...editCategory,
          ...categoryData,
          workspaceId: currentWorkspace.id
        };
      } else {
        // Create new category
        categoryId = await ExpenseManagementService.createExpenseCategory(
          currentWorkspace.id,
          categoryData
        );
        updatedCategory = {
          id: categoryId,
          ...categoryData,
          workspaceId: currentWorkspace.id
        };
      }

      toast({
        title: 'Success',
        description: `Category "${formData.name}" ${editCategory ? 'updated' : 'created'} successfully!`
      });

      // Reset form only if creating new category
      if (!editCategory) {
        setFormData({
          name: '',
          code: '',
          description: '',
          requiresApproval: true,
          approvalLimit: 0,
          isActive: true
        });
      }

      // Close dialog and notify parent
      setOpen(false);
      onCategoryCreated?.(updatedCategory);

    } catch (error) {
      console.error(`Error ${editCategory ? 'updating' : 'creating'} category:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${editCategory ? 'update' : 'create'} category. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!editCategory) {
      // Only reset form if creating new category
      setFormData({
        name: '',
        code: '',
        description: '',
        requiresApproval: true,
        approvalLimit: 0,
        isActive: true
      });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      {!trigger && !editCategory && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editCategory ? 'Edit Expense Category' : 'Create New Expense Category'}
          </DialogTitle>
          <DialogDescription>
            {editCategory 
              ? 'Update the category details below.' 
              : 'Add a new category to organize your expenses better.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            {/* Category Name - Full Width */}
            <div>
              <Label htmlFor="categoryName" className="text-sm font-medium">Category Name *</Label>
              <Input
                id="categoryName"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Travel, Meals, Software"
                className="mt-1.5"
                required
              />
            </div>

            {/* Two Column Layout for Code and Approval Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoryCode" className="text-sm font-medium">Category Code</Label>
                <Input
                  id="categoryCode"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="AUTO_GENERATED"
                  className="mt-1.5"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated from name if left empty
                </p>
              </div>

              <div>
                <Label htmlFor="approvalLimit" className="text-sm font-medium">Approval Limit (GHS)</Label>
                <Input
                  id="approvalLimit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.approvalLimit}
                  onChange={(e) => handleInputChange('approvalLimit', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  0 = all amounts require approval
                </p>
              </div>
            </div>

            {/* Description - Full Width */}
            <div>
              <Label htmlFor="categoryDescription" className="text-sm font-medium">Description</Label>
              <Textarea
                id="categoryDescription"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="What this category covers..."
                rows={2}
                className="mt-1.5 resize-none"
              />
            </div>
          </div>

          {/* Approval Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Approval Settings</h4>
            
            {/* Two Column Layout for Toggle Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="requiresApproval" className="text-sm font-medium">Requires Approval</Label>
                  <p className="text-xs text-muted-foreground">
                    Manager approval required?
                  </p>
                </div>
                <Switch
                  id="requiresApproval"
                  checked={formData.requiresApproval}
                  onCheckedChange={(checked) => handleInputChange('requiresApproval', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="isActive" className="text-sm font-medium">Active Category</Label>
                  <p className="text-xs text-muted-foreground">
                    Available for new expenses?
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editCategory ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editCategory ? 'Update Category' : 'Create Category'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
