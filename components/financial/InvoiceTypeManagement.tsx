'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { InvoiceTypeService, type InvoiceType } from '@/lib/invoice-type-service';
import CreateInvoiceTypeModal from '@/components/financial/CreateInvoiceTypeModal';
import { DeleteDialog, useDeleteDialog } from '@/components/ui/delete-dialog';
import { Search, Plus, Edit, Trash2, Star, FileText, Calendar, Percent } from 'lucide-react';

interface InvoiceTypeManagementProps {
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function InvoiceTypeManagement({ 
  canCreate = true, 
  canEdit = true, 
  canDelete = true 
}: InvoiceTypeManagementProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [invoiceTypes, setInvoiceTypes] = useState<InvoiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState<InvoiceType | null>(null);
  const deleteDialog = useDeleteDialog();

  // Fetch invoice types
  const fetchInvoiceTypes = useCallback(async () => {
    if (!currentWorkspace) return;
    
    try {
      setLoading(true);
      const typesData = await InvoiceTypeService.getWorkspaceInvoiceTypes(currentWorkspace.id);
      setInvoiceTypes(typesData);
    } catch (error) {
      console.error('Error fetching invoice types:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice types",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, toast]);

  useEffect(() => {
    fetchInvoiceTypes();
  }, [currentWorkspace, fetchInvoiceTypes]);

  // Filter invoice types based on search term
  const filteredTypes = invoiceTypes.filter(type => 
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle invoice type creation
  const handleTypeCreated = async (typeId: string) => {
    await fetchInvoiceTypes();
    toast({
      title: "Success",
      description: "Invoice type created successfully"
    });
  };

  // Handle invoice type deletion
  const handleDeleteType = async (type: InvoiceType) => {
    if (!canDelete) {
      toast({
        title: 'Error',
        description: 'You do not have permission to delete invoice types',
        variant: 'destructive'
      });
      return;
    }

    deleteDialog.openDialog({
      id: type.id,
      name: type.name,
      type: type.category.charAt(0).toUpperCase() + type.category.slice(1),
      status: type.isActive ? 'Active' : 'Inactive'
    });
  };

  const confirmDeleteType = async () => {
    try {
      await deleteDialog.handleConfirm(async (item) => {
        await InvoiceTypeService.deleteInvoiceType(item.id);
        toast({
          title: 'Success',
          description: 'Invoice type deleted successfully'
        });
        fetchInvoiceTypes(); // Refresh data
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete invoice type',
        variant: 'destructive'
      });
    }
  };

  // Handle setting default type
  const handleSetDefault = async (typeId: string) => {
    try {
      // Update the invoice type to set it as default
      await InvoiceTypeService.updateInvoiceType(typeId, { isDefault: true });
      await fetchInvoiceTypes();
      toast({
        title: "Success",
        description: "Default invoice type updated"
      });
    } catch (error) {
      console.error('Error setting default type:', error);
      toast({
        title: "Error",
        description: "Failed to set default type",
        variant: "destructive"
      });
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'service': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'subscription': return 'bg-green-100 text-green-800 border-green-300';
      case 'consulting': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'product': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Invoice Type Management</h2>
            <p className="text-muted-foreground">Manage your invoice types and templates</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Invoice Type Management</h2>
          <p className="text-muted-foreground">Manage your invoice types and templates</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Invoice Type
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search invoice types by name, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTypes.map((type) => (
          <Card key={type.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{type.name}</CardTitle>
                    {type.isDefault && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <Badge className={getCategoryColor(type.category)}>
                    {type.category.charAt(0).toUpperCase() + type.category.slice(1)}
                  </Badge>
                </div>
                <Badge variant={type.isActive ? 'default' : 'secondary'}>
                  {type.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {type.description && (
                <CardDescription className="text-sm">
                  {type.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Code */}
              {type.code && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-xs bg-muted text-muted-foreground px-2 py-1 rounded">{type.code}</span>
                </div>
              )}

              {/* Default Settings */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span>Due Days:</span>
                  </div>
                  <span className="font-medium">{type.defaultDueDays}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-3 h-3 text-muted-foreground" />
                    <span>Tax Rate:</span>
                  </div>
                  <span className="font-medium">{type.defaultTaxRate}%</span>
                </div>
              </div>

              {/* Usage Count */}
              <div className="text-xs text-muted-foreground">
                Used {type.usageCount} times
              </div>

              {/* Default Terms Preview */}
              {type.defaultTerms && (
                <div className="text-xs text-muted-foreground border-t pt-2">
                  <div className="font-medium mb-1">Default Terms:</div>
                  <div className="line-clamp-2">{type.defaultTerms}</div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  Created {new Date(type.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  {!type.isDefault && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleSetDefault(type.id)}
                      title="Set as default"
                    >
                      <Star className="w-3 h-3" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingType(type)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteType(type)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTypes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {invoiceTypes.length === 0 
                ? 'No invoice types found. Create your first invoice type to get started.' 
                : 'No invoice types found matching your search.'}
            </p>
            {canCreate && invoiceTypes.length === 0 && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Invoice Type
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <CreateInvoiceTypeModal
        open={showCreateModal || !!editingType}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setEditingType(null);
          }
        }}
        onInvoiceTypeCreated={handleTypeCreated}
        initialData={editingType ? {
          id: editingType.id,
          name: editingType.name,
          description: editingType.description,
          code: editingType.code,
          category: editingType.category,
          defaultTerms: editingType.defaultTerms,
          defaultNotes: editingType.defaultNotes,
          defaultDueDays: editingType.defaultDueDays,
          defaultTaxRate: editingType.defaultTaxRate,
          isDefault: editingType.isDefault
        } : undefined}
        isEdit={!!editingType}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.closeDialog}
        onConfirm={confirmDeleteType}
        title="Delete Invoice Type"
        description="You are about to permanently delete this invoice type. This action cannot be undone."
        item={deleteDialog.item}
        itemDetails={[
          { label: 'Name', value: deleteDialog.item?.name || '' },
          { label: 'Category', value: deleteDialog.item?.type || '' },
          { label: 'Status', value: deleteDialog.item?.status || '' },
          { label: 'Usage Count', value: invoiceTypes.find(t => t.id === deleteDialog.item?.id)?.usageCount?.toString() || '0' }
        ]}
        consequences={[
          'Permanently remove this invoice type from the system',
          'Any invoices using this type will retain their current type but cannot be changed back',
          'This invoice type will no longer be available for new invoices',
          'Any reports including this invoice type will be affected'
        ]}
        confirmText="Delete Invoice Type"
        isLoading={deleteDialog.isLoading}
        warningLevel="high"
      />
    </div>
  );
}