'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Loader2, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useIsOwner } from '@/lib/rbac-hooks';
import { ReportTemplate, EnhancedReport } from '@/lib/types';
import { ReportTemplateService } from '@/lib/report-template-service';
import { ReportService } from '@/lib/report-service';
import Link from 'next/link';

import { ReportList } from '@/components/reports/MemberReport/ReportList';
import { ReportView } from '@/components/reports/MemberReport/ReportView';
import { DynamicReportForm } from '@/components/reports/SubmitReport/DynamicReportForm';
import { ConfirmationDialog } from '@/components/reports/MemberReport/ConfirmationDialog';
import { Badge } from '@/components/ui/badge';

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cross-workspace props interface
interface CrossWorkspaceProps {
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
  setShowAllWorkspaces?: (show: boolean) => void;
}

// Existing getStatusBadge function
export const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' };
      case 'submitted':
        return { variant: 'default' as const, className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' };
      case 'under_review':
        return { variant: 'default' as const, className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' };
      case 'approved':
        return { variant: 'default' as const, className: 'bg-green-100 text-green-700 hover:bg-green-100' };
      case 'rejected':
        return { variant: 'destructive' as const, className: '' };
      case 'archived':
        return { variant: 'outline' as const, className: 'text-muted-foreground' };
      default:
        return { variant: 'secondary' as const, className: '' };
    }
  };

type ViewMode = 'list' | 'view' | 'edit';
export type StatusFilter = 'all' | 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'archived';

export default function MyReports({ showAllWorkspaces, accessibleWorkspaces }: CrossWorkspaceProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const isOwner = useIsOwner();

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [reports, setReports] = useState<EnhancedReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedReport, setSelectedReport] = useState<EnhancedReport | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default' as 'default' | 'destructive' | 'warning',
    onConfirm: () => {},
  });

  // Load reports and templates with cross-workspace support
  const loadData = useCallback(async () => {
    console.log('🔄 MyReports loadData started', { 
      workspaceId: currentWorkspace?.id, 
      userId: user?.uid,
      showAllWorkspaces,
      accessibleWorkspaces: accessibleWorkspaces?.length || 0
    });

    if (!currentWorkspace?.id || !user?.uid) return;

    try {
      setLoading(true);

      // Determine workspace IDs to load from
      const workspaceIds = (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) 
        ? accessibleWorkspaces.map(w => w.id)
        : [currentWorkspace.id];
      
      console.log('🏢 Loading my reports from workspaces:', workspaceIds);

      // Load user reports and templates from all relevant workspaces
      let allUserReports: EnhancedReport[] = [];
      let allTemplates: ReportTemplate[] = [];
      
      for (const wsId of workspaceIds) {
        try {
          const [wsUserReports, wsAvailableTemplates] = await Promise.all([
            ReportService.getUserReports(wsId, user.uid, {
          orderBy: 'updatedAt',
          orderDirection: 'desc',
          limit: 50
        }),
        userProfile?.departmentId ? ReportTemplateService.getTemplatesForUser(
              wsId,
          userProfile.departmentId,
          userProfile.role,
          { status: 'active' }
        ) : []
      ]);

          // Aggregate user reports (avoid duplicates)
          wsUserReports.forEach(report => {
            if (!allUserReports.some(r => r.id === report.id)) {
              allUserReports.push(report);
            }
          });

          // Aggregate templates (avoid duplicates)
          wsAvailableTemplates.forEach(template => {
            if (!allTemplates.some(t => t.id === template.id)) {
              allTemplates.push(template);
            }
          });

        } catch (wsError) {
          console.error(`Error loading my reports from workspace ${wsId}:`, wsError);
        }
      }

      // Sort reports by updated date (most recent first)
      allUserReports.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      setReports(allUserReports);
      setTemplates(allTemplates);

      console.log('✅ MyReports data loaded successfully', {
        reports: allUserReports.length,
        templates: allTemplates.length
      });

    } catch (error) {
      console.error('❌ Error loading reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, user?.uid, userProfile, isOwner, showAllWorkspaces, accessibleWorkspaces?.map(w => w.id).join(',') || '', toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter reports (logic remains here as it depends on local state `reports` and `templates`)
  const filteredReports = reports.filter(report => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const template = templates.find(t => t.id === report.templateId);
      const matchesSearch =
        report.title?.toLowerCase().includes(searchLower) ||
        template?.name?.toLowerCase().includes(searchLower) ||
        template?.category?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && report.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Handle view report
  const handleViewReport = (report: EnhancedReport) => {
    setSelectedReport(report);
    setViewMode('view');
  };

  // Handle edit report
  const handleEditReport = (report: EnhancedReport) => {
    const template = templates.find(t => t.id === report.templateId);
    if (!template) {
      toast({
        title: 'Error',
        description: 'Template not found for this report',
        variant: 'destructive',
      });
      return;
    }

    // Check if report can be edited
    const editableStatuses = ['draft', 'rejected'];
    if (!editableStatuses.includes(report.status)) {
      toast({
        title: 'Cannot Edit Report',
        description: `Reports with status "${report.status}" cannot be edited. Only draft and rejected reports can be modified.`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedReport(report);
    setSelectedTemplate(template);
    setViewMode('edit');
  };

  // Handle resubmit (for rejected reports)
  const handleResubmitReport = (report: EnhancedReport) => {
    if (report.status !== 'rejected') {
      toast({
        title: 'Cannot Resubmit',
        description: 'Only rejected reports can be resubmitted.',
        variant: 'destructive',
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Resubmit Report?',
      description: 'Are you sure you want to resubmit this rejected report? You can make changes before resubmitting.',
      confirmText: 'Yes, Resubmit',
      cancelText: 'Cancel',
      variant: 'warning',
      onConfirm: () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        handleEditReport(report);
      }
    });
  };

  // Handle delete report
  const handleDeleteReport = (report: EnhancedReport) => {
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
        try {
          setIsDeleting(report.id);

          await ReportService.deleteReport(
            report.workspaceId || currentWorkspace?.id || '',
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
      title: 'Report Submitted',
      description: 'Your report has been submitted successfully',
      className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    });
    setViewMode('list');
    loadData();
  };

  // Handle draft save
  const handleDraftSave = (report: EnhancedReport) => {
    toast({
      title: 'Draft Saved',
      description: 'Your report has been saved as a draft',
    });
    loadData();
  };

  // Handle back navigation
  const handleBack = () => {
    setViewMode('list');
    setSelectedReport(null);
    setSelectedTemplate(null);
  };

  // Check permissions (can be moved to a helper or hook if used elsewhere)
  const canEditReport = (report: EnhancedReport) => {
    return ['draft', 'rejected'].includes(report.status);
  };

  const canDeleteReport = (report: EnhancedReport) => {
    return report.status === 'draft';
  };

  const canResubmitReport = (report: EnhancedReport) => {
    return report.status === 'rejected';
  };


  // Show report view (read-only)
  if (viewMode === 'view' && selectedReport) {
    const template = templates.find(t => t.id === selectedReport.templateId);
    return (
      <ReportView
        report={selectedReport}
        template={template || null}
        onBack={handleBack}
        onEdit={handleEditReport}
        onResubmit={handleResubmitReport}
        canEditReport={canEditReport}
        canResubmitReport={canResubmitReport}
      />
    );
  }

  // Show edit form
  if (viewMode === 'edit' && selectedReport && selectedTemplate) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Reports
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {selectedReport.status === 'rejected' ? 'Resubmit Report' : 'Edit Report'}
            </h1>
            <p className="text-muted-foreground">
              {selectedReport.status === 'rejected' ? 'Make changes and resubmit your report' : 'Update your report details'}
            </p>
          </div>
        </div>

        {/* Dynamic Form */}
        <DynamicReportForm
          template={selectedTemplate}
          existingReport={selectedReport}
          onSaveDraft={handleDraftSave}
          onSubmit={handleReportSubmit}
          onCancel={handleBack}
          workspaceId={selectedReport.workspaceId || currentWorkspace?.id || ''}
          userId={user?.uid || ''}
          autoSave={true}
          autoSaveInterval={2}
        />
      </div>
    );
  }

  // Main reports list view
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Department Badge with cross-workspace indicator */}
        {userProfile?.departmentId && (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {userProfile.department || 'Department Member'}
              {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
                <span className="ml-1 text-green-600 dark:text-green-400">🌐</span>
              )}
            </Badge>
          </div>
        )}

        {/* Cross-workspace stats indicator */}
        {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {filteredReports.length} Reports across {accessibleWorkspaces.length} Workspaces 🌐
            </Badge>
          </div>
        )}

        {/* Create New Report Button */}
        <Link href="/dashboard/reports?view=submit-report">
          <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Report
            {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && ' 🌐'}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ReportList
          reports={filteredReports}
          templates={templates}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onViewReport={handleViewReport}
          onEditReport={handleEditReport}
          onResubmitReport={handleResubmitReport}
          onDeleteReport={handleDeleteReport}
          canEditReport={canEditReport}
          canDeleteReport={canDeleteReport}
          canResubmitReport={canResubmitReport}
          isDeleting={isDeleting}
        />
      )}

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, isOpen: open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
} 