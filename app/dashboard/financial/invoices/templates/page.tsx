'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  FileText, 
  Edit, 
  Trash2, 
  Copy,
  Eye,
  Search,
  Settings,
  Palette,
  Download,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { useIsOwner } from '@/lib/rbac-hooks';
import { PermissionsService } from '@/lib/permissions-service';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { InvoiceTemplateService, InvoiceTemplate } from '@/lib/invoice-template-service';
import { DeleteDialog, useDeleteDialog } from '@/components/ui/delete-dialog';

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'business':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'service':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'retail':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export default function InvoiceTemplatesPage() {
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const isOwner = useIsOwner();
  const router = useRouter();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deleteDialog = useDeleteDialog();

  // Permissions
  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canView, setCanView] = useState(false);

  // Fetch templates and check permissions
  useEffect(() => {
    async function fetchData() {
      if (!userProfile || !currentWorkspace) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Check permissions
        if (userProfile.role === 'owner') {
          setCanCreate(true);
          setCanEdit(true);
          setCanDelete(true);
          setCanView(true);
        } else {
          const [create, edit, deletePermission, view] = await Promise.all([
            PermissionsService.hasPermission(userProfile.id, currentWorkspace.id, 'invoices.create'),
            PermissionsService.hasPermission(userProfile.id, currentWorkspace.id, 'invoices.edit'),
            PermissionsService.hasPermission(userProfile.id, currentWorkspace.id, 'invoices.delete'),
            PermissionsService.hasPermission(userProfile.id, currentWorkspace.id, 'invoices.view')
          ]);
          setCanCreate(create);
          setCanEdit(edit);
          setCanDelete(deletePermission);
          setCanView(view);
        }
        
        // Fetch templates if user has view permission
        if (userProfile.role === 'owner' || await PermissionsService.hasPermission(userProfile.id, currentWorkspace.id, 'invoices.view')) {
          const fetchedTemplates = await InvoiceTemplateService.getWorkspaceTemplates(currentWorkspace.id, {
            isActive: true
          });
          setTemplates(fetchedTemplates);
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError('Failed to load templates');
        toast({
          title: 'Error',
          description: 'Failed to load templates',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [userProfile, currentWorkspace, toast]);

  // Filter templates based on search
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle template actions
  const handleDuplicateTemplate = async (templateId: string) => {
    if (!userProfile || !canCreate) {
      toast({
        title: 'Error',
        description: 'You do not have permission to create templates',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const originalTemplate = templates.find(t => t.id === templateId);
      if (originalTemplate) {
        const newTemplateId = await InvoiceTemplateService.duplicateTemplate(
          templateId,
          `${originalTemplate.name} (Copy)`,
          userProfile.id
        );
        
        // Refresh templates list
        if (currentWorkspace) {
          const updatedTemplates = await InvoiceTemplateService.getWorkspaceTemplates(currentWorkspace.id, {
            isActive: true
          });
          setTemplates(updatedTemplates);
        }
        
        toast({
          title: 'Success',
          description: 'Template duplicated successfully'
        });
      }
    } catch (err) {
      console.error('Error duplicating template:', err);
      toast({
        title: 'Error',
        description: 'Failed to duplicate template',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTemplate = async (template: InvoiceTemplate) => {
    if (!canDelete) {
      toast({
        title: 'Error',
        description: 'You do not have permission to delete templates',
        variant: 'destructive'
      });
      return;
    }

    if (template.isDefault) {
      toast({
        title: 'Error',
        description: 'Cannot delete default template',
        variant: 'destructive'
      });
      return;
    }

    deleteDialog.openDialog({
      id: template.id,
      name: template.name,
      type: template.category.charAt(0).toUpperCase() + template.category.slice(1),
      status: template.isDefault ? 'Default' : 'Active'
    });
  };

  const confirmDeleteTemplate = async () => {
    try {
      await deleteDialog.handleConfirm(async (item) => {
        await InvoiceTemplateService.deleteTemplate(item.id);
        
        // Refresh templates list
        if (currentWorkspace) {
          const updatedTemplates = await InvoiceTemplateService.getWorkspaceTemplates(currentWorkspace.id, {
            isActive: true
          });
          setTemplates(updatedTemplates);
        }
        
        toast({
          title: 'Success',
          description: 'Template deleted successfully'
        });
      });
    } catch (err) {
      console.error('Error deleting template:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive'
      });
    }
  };

  const handleSetDefault = async (templateId: string) => {
    if (!canEdit) {
      toast({
        title: 'Error',
        description: 'You do not have permission to modify templates',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      await InvoiceTemplateService.setDefaultTemplate(templateId);
      
      // Refresh templates list
      if (currentWorkspace) {
        const updatedTemplates = await InvoiceTemplateService.getWorkspaceTemplates(currentWorkspace.id, {
          isActive: true
        });
        setTemplates(updatedTemplates);
      }
      
      toast({
        title: 'Success',
        description: 'Default template updated'
      });
    } catch (err) {
      console.error('Error setting default template:', err);
      toast({
        title: 'Error',
        description: 'Failed to update default template',
        variant: 'destructive'
      });
    }
  };

  const handlePreviewTemplate = (templateId: string) => {
    // Open preview in a new window/tab
    window.open(`/dashboard/financial/invoices/templates/preview/${templateId}`, '_blank');
  };

  // Quick Actions handlers
  const handleCustomizeBranding = () => {
    if (!canEdit) {
      toast({
        title: 'Error',
        description: 'You do not have permission to customize branding',
        variant: 'destructive'
      });
      return;
    }
    
    // Navigate to branding settings or open modal
    router.push('/dashboard/settings?tab=branding');
  };

  const handleTemplateSettings = () => {
    if (!canEdit) {
      toast({
        title: 'Error',
        description: 'You do not have permission to modify template settings',
        variant: 'destructive'
      });
      return;
    }
    
    // Navigate to template settings
    router.push('/dashboard/financial/invoices/templates/settings');
  };

  const handleExportTemplates = async () => {
    if (!canView) {
      toast({
        title: 'Error',
        description: 'You do not have permission to export templates',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Create export data
      const exportData = {
        templates: templates.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          isDefault: template.isDefault,
          createdAt: template.createdAt,
          usageCount: template.usageCount,
          // Include template structure but not sensitive data
          structure: {
            branding: {
              logoUrl: template.logoUrl,
              primaryColor: template.primaryColor,
              secondaryColor: template.secondaryColor,
              fontFamily: template.fontFamily
            },
            layout: {
              headerLayout: template.headerLayout,
              footerLayout: template.footerLayout,
              itemsLayout: template.itemsLayout
            },
            defaults: {
              terms: template.defaultTerms,
              notes: template.defaultNotes,
              dueDays: template.defaultDueDays,
              currency: template.defaultCurrency,
              taxRate: template.defaultTaxRate,
              includeTax: template.includeTax
            }
          }
        })),
        exportedAt: new Date().toISOString(),
        workspaceId: currentWorkspace?.id,
        workspaceName: currentWorkspace?.name
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-templates-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: `Exported ${templates.length} templates successfully`
      });
    } catch (err) {
      console.error('Error exporting templates:', err);
      toast({
        title: 'Error',
        description: 'Failed to export templates',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice Templates</h1>
            <p className="text-muted-foreground">
              Manage and customize your invoice templates
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!canView) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice Templates</h1>
            <p className="text-muted-foreground">
              Manage and customize your invoice templates
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              You don&apos;t have permission to view invoice templates.
            </p>
            <p className="text-sm text-muted-foreground">
              Contact your workspace administrator for access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/financial/invoices')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice Templates</h1>
            <p className="text-muted-foreground">
              Manage and customize your invoice templates
            </p>
          </div>
        </div>
        {canCreate && (
          <Button onClick={() => router.push('/dashboard/financial/invoices/templates/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="relative">
            {template.isDefault && (
              <Badge className="absolute top-2 right-2 bg-green-100 text-green-800 border-green-300">
                Default
              </Badge>
            )}
            
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <div className="font-medium">{formatDate(template.createdAt)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Used:</span>
                  <div className="font-medium">{template.usageCount} times</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handlePreviewTemplate(template.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {canEdit && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/financial/invoices/templates/edit/${template.id}`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDuplicateTemplate(template.id)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-1">
                  {!template.isDefault && canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSetDefault(template.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  {!template.isDefault && canDelete && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteTemplate(template)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {error 
                ? 'Failed to load templates. Please try again.' 
                : templates.length === 0 
                ? 'No templates found. Create your first template to get started.' 
                : 'No templates found matching your search.'}
            </p>
            {canCreate && templates.length === 0 && !error && (
              <Button onClick={() => router.push('/dashboard/financial/invoices/templates/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Template
              </Button>
            )}
            {error && (
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>
            Common template management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={handleCustomizeBranding}
              disabled={!canEdit}
            >
              <Palette className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Customize Branding</div>
                <div className="text-sm text-muted-foreground">Add your logo and colors</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={handleTemplateSettings}
              disabled={!canEdit}
            >
              <Settings className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Template Settings</div>
                <div className="text-sm text-muted-foreground">Configure default values</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={handleExportTemplates}
              disabled={!canView}
            >
              <Download className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Export Templates</div>
                <div className="text-sm text-muted-foreground">Backup your templates</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.closeDialog}
        onConfirm={confirmDeleteTemplate}
        title="Delete Template"
        description="You are about to permanently delete this invoice template. This action cannot be undone."
        item={deleteDialog.item}
        itemDetails={[
          { label: 'Template Name', value: deleteDialog.item?.name || '' },
          { label: 'Category', value: deleteDialog.item?.type || '' },
          { label: 'Status', value: deleteDialog.item?.status || '' },
          { label: 'Usage Count', value: templates.find(t => t.id === deleteDialog.item?.id)?.usageCount?.toString() || '0' }
        ]}
        consequences={[
          'Permanently remove this template from the system',
          'Any invoices created from this template will retain their current design',
          'This template will no longer be available for creating new invoices',
          'Any reports including this template will be affected'
        ]}
        confirmText="Delete Template"
        isLoading={deleteDialog.isLoading}
        warningLevel="high"
      />
    </div>
  );
}