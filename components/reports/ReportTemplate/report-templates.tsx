'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  FileText,
  TrendingUp,
  Clock,
  Tag,
  AlertCircle,
  Save,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useIsAdminOrOwner } from '@/lib/rbac-hooks';
import { ReportTemplateService } from '@/lib/report-template-service';
import { 
  ReportTemplate, 
  TemplateBuilderState 
} from '@/lib/types';
import { TemplateFormBuilder } from './TemplateFormBuilder';
import { TemplatePreview } from './TemplatePreview';
import { DeleteTemplateDialog } from './DeleteTemplateDialog';

// Cross-workspace props interface
interface CrossWorkspaceProps {
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
  setShowAllWorkspaces?: (show: boolean) => void;
}

// Add view type for navigation
type ViewType = 'list' | 'create' | 'edit' | 'preview';

export function ReportTemplates({ showAllWorkspaces, accessibleWorkspaces }: CrossWorkspaceProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const isAdminOrOwner = useIsAdminOrOwner();

  // All hooks must be called before any conditional returns
  // View state management
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

  // Data states
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [statistics, setStatistics] = useState({
    totalTemplates: 0,
    activeTemplates: 0,
    draftTemplates: 0,
    archivedTemplates: 0,
    totalReports: 0,
    recentlyUsed: [] as ReportTemplate[],
    popularTemplates: [] as ReportTemplate[]
  });
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Dialog states (keeping only delete dialog)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '',
    department: '',
    tags: [] as string[],
    visibility: 'public' as 'public' | 'restricted',
    allowedRoles: ['owner', 'admin', 'member'] as ('owner' | 'admin' | 'member')[],
    departmentAccess: {
      type: 'global' as 'global' | 'department_specific' | 'multi_department' | 'custom',
      allowedDepartments: [] as string[],
      restrictedDepartments: [] as string[],
      ownerDepartment: '',
      inheritFromParent: false
    },
    settings: {
      allowFileAttachments: true,
      maxFileAttachments: 5,
      autoSave: true,
      autoSaveInterval: 5,
      requiresApproval: false,
      notifications: {
        onSubmission: true,
        onApproval: true,
        onRejection: true,
        recipientRoles: ['admin', 'owner'] as ('owner' | 'admin' | 'author')[],
        customRecipients: [] as string[],
        departmentNotifications: [] as {
          department: string;
          roles: ('head' | 'admin' | 'all_members')[];
        }[]
      }
    }
  });

  // Builder state
  const [builderState, setBuilderState] = useState<TemplateBuilderState>({
    template: {},
    fields: [],
    isDirty: false,
    isValid: false,
    errors: { template: {}, fields: {} },
    previewMode: false
  });

  // Load data function
  const loadData = useCallback(async () => {
    if (!userProfile) return;

    // Determine workspace IDs to load from
    const workspaceIds = (showAllWorkspaces && accessibleWorkspaces?.length)
      ? accessibleWorkspaces.map(w => w.id)
      : currentWorkspace?.id ? [currentWorkspace.id] : [];
    if (workspaceIds.length === 0) return;

    let allTemplates: ReportTemplate[] = [];
    let allCategories: string[] = [];
    let aggregatedStats = {
      totalTemplates: 0,
      activeTemplates: 0,
      draftTemplates: 0,
      archivedTemplates: 0,
      totalReports: 0,
      recentlyUsed: [] as ReportTemplate[],
      popularTemplates: [] as ReportTemplate[]
    };
    let allDepartments: string[] = [];

    for (const wsId of workspaceIds) {
      try {
        const [wsTemplates, wsCategories, wsStats, wsDepartments] = await Promise.all([
          ReportTemplateService.getTemplatesForUser(wsId, userProfile.department, userProfile.role || 'member'),
          ReportTemplateService.getTemplateCategories(wsId),
          ReportTemplateService.getTemplateStatistics(wsId),
          ReportTemplateService.getAvailableDepartments(wsId)
        ]);
        
        allTemplates.push(...wsTemplates);
        wsCategories.forEach((cat: string) => {
          if (!allCategories.includes(cat)) {
            allCategories.push(cat);
          }
        });
        
        // Aggregate statistics
        aggregatedStats.totalTemplates += wsStats.totalTemplates;
        aggregatedStats.activeTemplates += wsStats.activeTemplates;
        aggregatedStats.draftTemplates += wsStats.draftTemplates;
        aggregatedStats.archivedTemplates += wsStats.archivedTemplates;
        aggregatedStats.totalReports += wsStats.totalReports;
        aggregatedStats.recentlyUsed.push(...wsStats.recentlyUsed);
        aggregatedStats.popularTemplates.push(...wsStats.popularTemplates);
        
        wsDepartments.forEach((dept: string) => {
          if (!allDepartments.includes(dept)) {
            allDepartments.push(dept);
          }
        });
      } catch (err) {
        console.error('Error loading templates from workspace', wsId, err);
      }
    }

    setTemplates(allTemplates);
    setCategories(allCategories);
    setStatistics(aggregatedStats);
    setAvailableDepartments(allDepartments);
    setLoading(false);
  }, [userProfile, showAllWorkspaces, accessibleWorkspaces, currentWorkspace?.id]);

  // Effect to load data
  useEffect(() => {
    loadData();
  }, [currentWorkspace?.id, loadData]);

  // Handle custom event from parent for Create Template button
  useEffect(() => {
    const handleCreateTemplate = () => {
      if (isAdminOrOwner) {
        initializeForm();
        setCurrentView('create');
      }
    };

    window.addEventListener('createTemplate', handleCreateTemplate);
    return () => window.removeEventListener('createTemplate', handleCreateTemplate);
  }, [isAdminOrOwner]);

  // Early return if user is not available
  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access report templates.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    if (searchTerm && !template.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !template.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && template.status !== statusFilter) {
      return false;
    }
    if (categoryFilter !== 'all' && template.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  // Initialize form for create/edit
  const initializeForm = (template?: ReportTemplate) => {
    if (template) {
      setTemplateForm({
        name: template.name,
        description: template.description || '',
        category: template.category || '',
        department: template.department || '',
        tags: template.tags || [],
        visibility: template.visibility,
        allowedRoles: template.allowedRoles || ['owner', 'admin', 'member'],
        departmentAccess: {
          type: template.departmentAccess.type,
          allowedDepartments: template.departmentAccess.allowedDepartments || [],
          restrictedDepartments: template.departmentAccess.restrictedDepartments || [],
          ownerDepartment: template.departmentAccess.ownerDepartment || '',
          inheritFromParent: template.departmentAccess.inheritFromParent || false
        },
        settings: {
          allowFileAttachments: template.settings.allowFileAttachments,
          maxFileAttachments: template.settings.maxFileAttachments || 5,
          autoSave: template.settings.autoSave,
          autoSaveInterval: template.settings.autoSaveInterval || 5,
          requiresApproval: template.settings.requiresApproval,
          notifications: {
            onSubmission: template.settings.notifications.onSubmission,
            onApproval: template.settings.notifications.onApproval,
            onRejection: template.settings.notifications.onRejection,
            recipientRoles: template.settings.notifications.recipientRoles.filter(role => 
              ['owner', 'admin', 'author'].includes(role)
            ) as ('owner' | 'admin' | 'author')[],
            customRecipients: (template.settings.notifications.customRecipients || []) as string[],
            departmentNotifications: (template.settings.notifications.departmentNotifications || []) as {
              department: string;
              roles: ('head' | 'admin' | 'all_members')[];
            }[]
          }
        }
      });
      setBuilderState({
        template: template,
        fields: template.fields.map((field, index) => ({
          ...field,
          order: index
        })),
        isDirty: false,
        isValid: true,
        errors: { template: {}, fields: {} },
        previewMode: false
      });
    } else {
      setTemplateForm({
        name: '',
        description: '',
        category: '',
        department: '',
        tags: [],
        visibility: 'public',
        allowedRoles: ['owner', 'admin', 'member'],
        departmentAccess: {
          type: 'global',
          allowedDepartments: [],
          restrictedDepartments: [],
          ownerDepartment: '',
          inheritFromParent: false
        },
        settings: {
          allowFileAttachments: true,
          maxFileAttachments: 5,
          autoSave: true,
          autoSaveInterval: 5,
          requiresApproval: false,
          notifications: {
            onSubmission: true,
            onApproval: true,
            onRejection: true,
            recipientRoles: ['owner', 'admin'] as ('owner' | 'admin' | 'author')[],
            customRecipients: [] as string[],
            departmentNotifications: [] as {
              department: string;
              roles: ('head' | 'admin' | 'all_members')[];
            }[]
          }
        }
      });
      setBuilderState({
        template: {},
        fields: [],
        isDirty: false,
        isValid: false,
        errors: { template: {}, fields: {} },
        previewMode: false
      });
    }
  };

  // Navigation handlers
  const handleCreateTemplate = () => {
    initializeForm();
    setCurrentView('create');
  };

  const handleEditTemplate = (template: ReportTemplate) => {
    initializeForm(template);
    setCurrentView('edit');
  };

  const handlePreviewTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    initializeForm(template);
    setCurrentView('preview');
  };

  
  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedTemplate(null);
  };

  // Handle clone template
  const handleCloneTemplate = async (template: ReportTemplate) => {
    if (!currentWorkspace?.id || !user?.uid) return;

    try {
      setSubmitting(true);
      const clonedName = `${template.name} (Copy)`;
      
      await ReportTemplateService.cloneTemplate(
        currentWorkspace.id,
        template.id,
        clonedName,
        user.uid
      );

      toast({
        title: 'Template Cloned',
        description: `${clonedName} has been created successfully.`,
      });

      await loadData();
    } catch (error) {
      console.error('Error cloning template:', error);
      toast({
        title: 'Error',
        description: 'Failed to clone template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete template
  const handleDeleteTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  // Handle save template (create or update)
  const handleSaveTemplate = async () => {
    if (!currentWorkspace?.id || !user?.uid) return;

    try {
      setSubmitting(true);

      const templateData = {
        workspaceId: currentWorkspace.id,
        name: templateForm.name,
        description: templateForm.description,
        category: templateForm.category || undefined,
        department: templateForm.department || undefined,
        tags: templateForm.tags,
        visibility: templateForm.visibility,
        allowedRoles: templateForm.allowedRoles,
        departmentAccess: templateForm.departmentAccess,
        settings: templateForm.settings,
        fields: builderState.fields.map((field, index) => ({
          ...field,
          order: index
        }))
      };

      if (currentView === 'edit' && selectedTemplate) {
        // Update existing template
        await ReportTemplateService.updateTemplate(
          currentWorkspace.id,
          selectedTemplate.id,
          templateData,
          user.uid
        );

        toast({
          title: 'Template Updated',
          description: `${templateForm.name} has been updated successfully.`,
        });
      } else {
        // Create new template
        await ReportTemplateService.createTemplate(
          currentWorkspace.id,
          {
            ...templateData,
            createdBy: user.uid,
            status: 'active'
          },
          user.uid
        );

        toast({
          title: 'Template Created',
          description: `${templateForm.name} has been created successfully.`,
        });
      }

      await loadData();
      setCurrentView('list');
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm delete template
  const confirmDeleteTemplate = async () => {
    if (!selectedTemplate || !currentWorkspace?.id || !user?.uid) return;

    try {
      setSubmitting(true);
      
      await ReportTemplateService.deleteTemplate(
        currentWorkspace.id,
        selectedTemplate.id,
        user.uid
      );

      const wasArchived = selectedTemplate.usage.totalReports > 0;
      
      toast({
        title: wasArchived ? 'Template Archived' : 'Template Deleted',
        description: wasArchived 
          ? `${selectedTemplate.name} has been archived due to existing reports.`
          : `${selectedTemplate.name} has been deleted successfully.`,
      });

      setIsDeleteDialogOpen(false);
      setSelectedTemplate(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Check RBAC access
  if (!isAdminOrOwner) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only workspace owners and administrators can manage report templates.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render based on current view
  if (currentView === 'create') {
    return (
      <div className="space-y-6">
        {/* Header with back navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBackToList}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </Button>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleBackToList}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={submitting}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Template
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Template Form Builder */}
        <TemplateFormBuilder
          templateForm={templateForm}
          setTemplateForm={setTemplateForm}
          builderState={builderState}
          setBuilderState={setBuilderState}
          categories={categories}
          availableDepartments={availableDepartments}
        />
      </div>
    );
  }

  if (currentView === 'edit') {
    return (
      <div className="space-y-6">
        {/* Header with back navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackToList}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Templates
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Edit Template: {selectedTemplate?.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Modify the template structure and settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleBackToList}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={submitting || !builderState.isValid}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Template
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Template Form Builder */}
        <TemplateFormBuilder
          templateForm={templateForm}
          setTemplateForm={setTemplateForm}
          builderState={builderState}
          setBuilderState={setBuilderState}
          categories={categories}
          isEditing={true}
        />
      </div>
    );
  }

  if (currentView === 'preview') {
    return (
      <div className="space-y-6">
        {/* Header with back navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackToList}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Templates
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Preview: {selectedTemplate?.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                See how this template appears to end users
              </p>
            </div>
          </div>
        </div>

        {/* Template Preview */}
        {selectedTemplate && (
          <TemplatePreview template={selectedTemplate} />
        )}
      </div>
    );
  }

  // Default list view
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.activeTemplates} active
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              Generated from templates
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Templates</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.draftTemplates}</div>
            <p className="text-xs text-muted-foreground">
              Pending completion
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Template categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No templates yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first report template to get started.
          </p>
          <Button onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="card-interactive group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">
                      {template.name}
                    </CardTitle>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCloneTemplate(template)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Clone
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteTemplate(template)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Status and Category */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant={template.status === 'active' ? 'default' : 'secondary'}
                    className={
                      template.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : template.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }
                  >
                    {template.status}
                  </Badge>
                  {template.category && (
                    <Badge variant="outline">
                      {template.category}
                    </Badge>
                  )}
                </div>

                {/* Fields count */}
                <div className="text-sm text-muted-foreground">
                  {template.fields.length} field{template.fields.length !== 1 ? 's' : ''}
                </div>

                {/* Usage statistics */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {template.usage.totalReports} report{template.usage.totalReports !== 1 ? 's' : ''}
                  </span>
                  <span className="text-muted-foreground">
                    v{template.version}
                  </span>
                </div>

                {/* Last updated */}
                <div className="text-xs text-muted-foreground">
                  Updated {new Date(template.updatedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Template Dialog */}
      <DeleteTemplateDialog
        template={selectedTemplate}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteTemplate}
        submitting={submitting}
      />
    </div>
  );
}