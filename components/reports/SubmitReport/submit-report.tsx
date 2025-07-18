'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  FileText, 
  Search, 
  Calendar, 
  User, 
  Building, 
  ArrowLeft, 
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { ReportTemplate, EnhancedReport } from '@/lib/types';
import { ReportTemplateService } from '@/lib/report-template-service';
import { ReportService } from '@/lib/report-service';
import { DynamicReportForm } from './DynamicReportForm';
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

// Cross-workspace props interface
interface CrossWorkspaceProps {
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
  setShowAllWorkspaces?: (show: boolean) => void;
}

type ViewMode = 'templates' | 'form' | 'view';

export function SubmitReport({ showAllWorkspaces, accessibleWorkspaces }: CrossWorkspaceProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('templates');
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [userReports, setUserReports] = useState<EnhancedReport[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [selectedReport, setSelectedReport] = useState<EnhancedReport | null>(null);
  const [viewingReport, setViewingReport] = useState<EnhancedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('templates');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default' as 'default' | 'destructive' | 'warning',
    onConfirm: () => {},
  });

  // Load templates and user reports
  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id || !user?.uid || !userProfile) return;
    
    try {
      setLoading(true);
      
      // Get templates available to this user based on department access
      const availableTemplates = await ReportTemplateService.getTemplatesForUser(
        currentWorkspace.id,
        userProfile.departmentId,
        userProfile.role,
        {
          status: 'active',
          orderBy: 'updatedAt',
          orderDirection: 'desc'
        }
      );
      
      // Get user's existing reports (drafts and submitted)
      const reports = await ReportService.getUserReports(
        currentWorkspace.id,
        user.uid,
        {
          orderBy: 'updatedAt',
          orderDirection: 'desc',
          limit: 20
        }
      );
      
      setTemplates(availableTemplates);
      setUserReports(reports);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report templates. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, user?.uid, userProfile, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter templates based on search
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get drafts and submitted reports
  const draftReports = userReports.filter(report => report.status === 'draft');
  const submittedReports = userReports.filter(report => report.status !== 'draft');

  // Handle template selection
  const handleSelectTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setSelectedReport(null);
    setViewMode('form');
  };

  // Handle edit draft
  const handleEditDraft = (report: EnhancedReport) => {
    const template = templates.find(t => t.id === report.templateId);
    if (!template) {
      toast({
        title: 'Error',
        description: 'Template not found for this report',
        variant: 'destructive',
      });
      return;
    }
    setSelectedTemplate(template);
    setSelectedReport(report);
    setViewMode('form');
  };

  // Handle view report (always allowed)
  const handleViewReport = (report: EnhancedReport) => {
    setViewingReport(report);
    setViewMode('view');
  };

  // Handle edit submitted report (with restrictions)
  const handleEditSubmittedReport = (report: EnhancedReport) => {
    // Define which statuses allow editing
    const editableStatuses = ['submitted', 'under_review', 'rejected'];
    
    if (!editableStatuses.includes(report.status)) {
      toast({
        title: 'Cannot Edit Report',
        description: `Reports with status "${report.status}" cannot be edited. Only submitted, under review, or rejected reports can be modified.`,
        variant: 'destructive',
      });
      return;
    }

    const template = templates.find(t => t.id === report.templateId);
    if (!template) {
      toast({
        title: 'Error',
        description: 'Template not found for this report',
        variant: 'destructive',
      });
      return;
    }

    // Show confirmation for editing submitted reports
    setConfirmDialog({
      isOpen: true,
      title: 'Edit Submitted Report?',
      description: `Are you sure you want to edit this ${report.status} report? This may reset its approval status.`,
      confirmText: 'Yes, Edit Report',
      cancelText: 'Cancel',
      variant: 'warning',
      onConfirm: () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        // Continue with the edit logic
        setSelectedTemplate(template);
        setSelectedReport(report);
        setViewMode('form');
      }
    });
  };

  // Handle delete report (only drafts)
  const handleDeleteReport = async (report: EnhancedReport) => {
    if (report.status !== 'draft') {
      toast({
        title: 'Cannot Delete Report',
        description: 'Only draft reports can be deleted. Submitted and approved reports are protected for audit trail purposes.',
        variant: 'destructive',
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Draft Report?',
      description: `Are you sure you want to delete "${report.title}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        // Continue with delete logic
        try {
          setIsDeleting(report.id);
          await ReportService.deleteReport(
            currentWorkspace?.id || '',
            report.id,
            user?.uid || ''
          );
          toast({
            title: 'Report Deleted',
            description: 'The draft report has been deleted successfully.',
            className: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
          });
          loadData();
        } catch (error) {
          console.error('Error deleting report:', error);
          toast({
            title: 'Error',
            description: 'Failed to delete report. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsDeleting(null);
        }
      }
    });
  };

  // Handle form submission
  const handleReportSubmit = (report: EnhancedReport) => {
    toast({
      title: '🎉 Report Submitted',
      description: 'Your report has been submitted successfully',
      className: 'bg-gradient-to-r from-primary to-accent text-white',
    });
    setViewMode('templates');
    loadData(); // Refresh data
  };

  // Handle draft save
  const handleDraftSave = (report: EnhancedReport) => {
    toast({
      title: 'Draft Saved',
      description: 'Your report has been saved as a draft',
    });
    loadData(); // Refresh data
  };

  // Handle back navigation
  const handleBack = () => {
    setViewMode('templates');
    setSelectedTemplate(null);
    setSelectedReport(null);
    setViewingReport(null);
  };

  // Check if report can be edited
  const canEditReport = (report: EnhancedReport) => {
    const editableStatuses = ['draft', 'submitted', 'under_review', 'rejected'];
    return editableStatuses.includes(report.status);
  };

  // Check if report can be deleted
  const canDeleteReport = (report: EnhancedReport) => {
    return report.status === 'draft';
  };

  // Show report view (read-only)
  if (viewMode === 'view' && viewingReport) {
    const template = templates.find(t => t.id === viewingReport.templateId);
    
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{viewingReport.title}</h1>
              <Badge 
                variant={
                  viewingReport.status === 'submitted' ? 'default' :
                  viewingReport.status === 'approved' ? 'default' :
                  viewingReport.status === 'rejected' ? 'destructive' :
                  'secondary'
                }
                className={
                  viewingReport.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''
                }
              >
                {viewingReport.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Template: {template?.name || 'Unknown'} • 
              Submitted: {viewingReport.submittedAt?.toLocaleDateString() || 'Not submitted'}
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            {canEditReport(viewingReport) && (
              <Button
                variant="outline"
                onClick={() => handleEditSubmittedReport(viewingReport)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Report
              </Button>
            )}
          </div>
        </div>

        {/* Read-only form view */}
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {template && template.fields.map((field) => {
              const value = viewingReport.fieldData[field.id];
              
              return (
                <div key={field.id} className="space-y-2">
                  <label className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  <div className="p-3 bg-muted/50 rounded-md border">
                    {field.type === 'file' ? (
                      <div className="space-y-2">
                        {Array.isArray(value) && value.length > 0 ? (
                          value.map((fileUrl, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <a 
                                href={fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                File {index + 1}
                              </a>
                            </div>
                          ))
                        ) : (
                          <span className="text-muted-foreground italic">No files attached</span>
                        )}
                      </div>
                    ) : field.type === 'checkbox' ? (
                      <span>{value ? 'Yes' : 'No'}</span>
                    ) : field.type === 'date' ? (
                      <span>{value ? new Date(value).toLocaleDateString() : 'Not set'}</span>
                    ) : (
                      <span className="whitespace-pre-wrap">{value || 'Not provided'}</span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Comments/Feedback Section */}
            {viewingReport.comments && viewingReport.comments.length > 0 && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium">Comments & Feedback</h3>
                <div className="space-y-3">
                  {viewingReport.comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-blue-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{comment.authorName}</span>
                        <span className="text-sm text-muted-foreground">
                          {comment.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{comment.content}</p>
                      {comment.type === 'approval' && (
                        <Badge variant="outline" className="mt-2">
                          Approval Comment
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show form view
  if (viewMode === 'form' && selectedTemplate) {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {selectedReport ? 'Edit Report' : 'Create New Report'}
            </h1>
            <p className="text-muted-foreground">
              {selectedReport ? 'Continue editing your report' : `Using template: ${selectedTemplate.name}`}
            </p>
          </div>
        </div>

        {/* Dynamic Form */}
        <DynamicReportForm
          template={selectedTemplate}
          existingReport={selectedReport || undefined}
          onSaveDraft={handleDraftSave}
          onSubmit={handleReportSubmit}
          onCancel={handleBack}
          workspaceId={currentWorkspace?.id || ''}
          userId={user?.uid || ''}
          autoSave={true}
          autoSaveInterval={2}
        />
      </div>
    );
  }

  // Show templates and drafts view
  return (
    <div className="space-y-6">
      {/* Department Access Info */}
      {userProfile?.departmentId && (
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary">
              {userProfile.department || 'Department Member'}
            </Badge>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Available Templates</span>
              <span className="sm:hidden">Templates</span>
              <Badge variant="secondary" className="ml-1">
                {filteredTemplates.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">My Reports</span>
              <span className="sm:hidden">Reports</span>
              <Badge variant="secondary" className="ml-1">
                {userReports.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates by name, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Templates */}
            {filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchTerm ? 'No templates found' : 'No templates available'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search terms.'
                      : userProfile?.departmentId 
                        ? 'No report templates are available for your department yet.'
                        : 'You need to be assigned to a department to access report templates.'
                    }
                  </p>
                  {!userProfile?.departmentId && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please contact your administrator to be assigned to a department.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="card-interactive hover:shadow-lg transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2">{template.name}</CardTitle>
                        {template.category && (
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {template.description}
                        </p>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Template Stats */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{template.fields.length} fields</span>
                        <span>v{template.version}</span>
                      </div>

                      {/* Department Access */}
                      {template.departmentAccess && (
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {template.departmentAccess.type === 'global' ? 'All Departments' :
                             template.departmentAccess.type === 'department_specific' ? 'Department Specific' :
                             template.departmentAccess.type === 'multi_department' ? 'Selected Departments' :
                             'Custom Access'}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleSelectTemplate(template)}
                          className="flex-1"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Start Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4">
            <div className="grid gap-4">
              {/* Draft Reports */}
              {draftReports.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Draft Reports ({draftReports.length})
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {draftReports.map((report) => (
                      <Card key={report.id} className="card-interactive">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base line-clamp-2">{report.title}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Draft</Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditDraft(report)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Continue Editing
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleViewReport(report)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Report
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteReport(report)}
                                    className="text-red-600"
                                    disabled={isDeleting === report.id}
                                  >
                                    {isDeleting === report.id ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    Delete Draft
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            Template: {templates.find(t => t.id === report.templateId)?.name || 'Unknown'}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Created: {report.createdAt.toLocaleDateString()}</span>
                            <span>Updated: {report.updatedAt.toLocaleDateString()}</span>
                          </div>
                          
                          <Button 
                            onClick={() => handleEditDraft(report)}
                            className="w-full"
                            variant="outline"
                          >
                            Continue Editing
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Submitted Reports */}
              {submittedReports.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Submitted Reports ({submittedReports.length})
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {submittedReports.map((report) => (
                      <Card key={report.id} className="card-interactive">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base line-clamp-2">{report.title}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  report.status === 'submitted' ? 'default' :
                                  report.status === 'approved' ? 'default' :
                                  report.status === 'rejected' ? 'destructive' :
                                  'secondary'
                                }
                                className={
                                  report.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''
                                }
                              >
                                {report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewReport(report)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Report
                                  </DropdownMenuItem>
                                  {canEditReport(report) && (
                                    <DropdownMenuItem onClick={() => handleEditSubmittedReport(report)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Report
                                    </DropdownMenuItem>
                                  )}
                                  {!canDeleteReport(report) && (
                                    <DropdownMenuItem disabled className="text-muted-foreground">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Cannot Delete (Submitted)
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            Template: {templates.find(t => t.id === report.templateId)?.name || 'Unknown'}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Submitted: {report.submittedAt?.toLocaleDateString()}</span>
                            {report.attachments && report.attachments.length > 0 && (
                              <span>{report.attachments.length} attachment(s)</span>
                            )}
                          </div>
                          
                          <Button 
                            onClick={() => handleViewReport(report)}
                            variant="outline" 
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Report
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* No Reports */}
              {userReports.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No reports yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by creating your first report using an available template.
                    </p>
                    <Button onClick={() => setActiveTab('templates')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Browse Templates
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
      )}

      {/* Branded Responsive Confirmation Dialog */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => 
        setConfirmDialog({ ...confirmDialog, isOpen: open })
      }>
        <AlertDialogContent className="sm:max-w-md w-[95vw] max-w-[420px] rounded-lg border border-border/50 bg-background shadow-2xl">
          <AlertDialogHeader className="space-y-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-3">
              {confirmDialog.variant === 'destructive' && (
                <div className="h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-red-500/10 to-rose-500/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="h-6 w-6 sm:h-5 sm:w-5 text-red-500" />
                </div>
              )}
              {confirmDialog.variant === 'warning' && (
                <div className="h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6 sm:h-5 sm:w-5 text-primary" />
                </div>
              )}
              
              <div className="text-center sm:text-left">
                <AlertDialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {confirmDialog.title}
                </AlertDialogTitle>
              </div>
            </div>
            
            <AlertDialogDescription className="text-base sm:text-sm text-muted-foreground text-center sm:text-left leading-relaxed px-2 sm:px-0">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-6">
            <AlertDialogCancel asChild>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto min-h-[44px] border-border/50 hover:bg-muted/50"
              >
                {confirmDialog.cancelText}
              </Button>
            </AlertDialogCancel>
            
            <AlertDialogAction asChild>
              <Button
                variant={confirmDialog.variant === 'destructive' ? 'destructive' : 'default'}
                onClick={confirmDialog.onConfirm}
                className={`w-full sm:w-auto min-h-[44px] font-medium ${
                  confirmDialog.variant === 'warning' 
                    ? 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg'
                    : ''
                }`}
              >
                {confirmDialog.confirmText}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 