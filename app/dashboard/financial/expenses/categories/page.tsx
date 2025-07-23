'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Edit, Trash2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { ExpenseManagementService } from '@/lib/expense-management-service';
import { ExpenseCategory } from '@/lib/types/financial-types';
import CreateCategoryDialog from '@/components/financial/CreateCategoryDialog';

export default function ExpenseCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ExpenseCategory | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    try {
      setLoading(true);
      const workspaceCategories = await ExpenseManagementService.getWorkspaceExpenseCategories(
        currentWorkspace.id
      );
      setCategories(workspaceCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load expense categories.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, toast]);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchCategories();
    }
  }, [currentWorkspace?.id, fetchCategories]);

  const handleCategoryCreated = (newCategory: ExpenseCategory) => {
    setCategories(prev => [...prev, newCategory]);
  };

  const handleCategoryUpdated = (updatedCategory: ExpenseCategory) => {
    setCategories(prev => 
      prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat)
    );
    setEditingCategory(null);
  };

  const toggleCategoryStatus = async (categoryId: string, isActive: boolean) => {
    try {
      setActionLoading(categoryId);
      await ExpenseManagementService.toggleCategoryStatus(categoryId, isActive);
      
      setCategories(prev => 
        prev.map(cat => 
          cat.id === categoryId ? { ...cat, isActive } : cat
        )
      );
      
      toast({
        title: 'Success',
        description: `Category ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category status.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      setActionLoading(categoryId);
      await ExpenseManagementService.deleteExpenseCategory(categoryId);
      
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setDeletingCategory(null);
      
      toast({
        title: 'Success',
        description: 'Category deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCategories = filteredCategories.filter(c => c.isActive).length;
  const inactiveCategories = filteredCategories.filter(c => !c.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/financial/expenses')}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Expense Categories</h1>
            <p className="text-muted-foreground">
              Manage expense categories for better organization
            </p>
          </div>
        </div>
        <CreateCategoryDialog 
          onCategoryCreated={handleCategoryCreated}
          trigger={
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Category
            </Button>
          }
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              All expense categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCategories}</div>
            <p className="text-xs text-muted-foreground">
              Available for use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveCategories}</div>
            <p className="text-xs text-muted-foreground">
              Disabled categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                {loading ? 'Loading...' : `${filteredCategories.length} categories found`}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading categories...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{category.code}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>
                      {category.requiresApproval ? (
                        <div className="flex flex-col">
                          <Badge variant="secondary" className="w-fit">Required</Badge>
                          {category.approvalLimit && (
                            <span className="text-xs text-muted-foreground mt-1">
                              Limit: ${category.approvalLimit}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">Not Required</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={category.isActive ? "default" : "secondary"}
                        className={category.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {actionLoading === category.id ? (
                          <div className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </div>
                        ) : (
                          category.isActive ? 'Active' : 'Inactive'
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            disabled={actionLoading === category.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingCategory(category)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleCategoryStatus(category.id, !category.isActive)}
                            disabled={actionLoading === category.id}
                          >
                            {category.isActive ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setDeletingCategory(category)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredCategories.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No categories found matching your search.' : 'No categories found.'}
              </p>
              <CreateCategoryDialog 
                onCategoryCreated={handleCategoryCreated}
                trigger={
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Category
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      {editingCategory && (
        <CreateCategoryDialog
          onCategoryCreated={handleCategoryUpdated}
          trigger={null}
          editCategory={editingCategory}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingCategory(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!deletingCategory} 
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category <strong>{deletingCategory?.name}</strong>? 
              This action cannot be undone and may affect existing expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCategory && deleteCategory(deletingCategory.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading === deletingCategory?.id}
            >
              {actionLoading === deletingCategory?.id ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
