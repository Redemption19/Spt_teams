"use client"

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Eye, 
  Edit3, 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { EnhancedReport, ReportTemplate, ReportStatus } from '@/lib/types';
import { ReportTemplateService } from '@/lib/report-template-service';
import { ReportService, ReportSubmissionData } from '@/lib/report-service';
import { ReportView } from './ReportView';
import { DynamicReportForm } from '../SubmitReport/DynamicReportForm';

interface RecentReportsTabProps {
  reports: EnhancedReport[];
  templates: ReportTemplate[];
}

type ViewMode = 'list' | 'view' | 'edit';

export function RecentReportsTab({ reports, templates }: RecentReportsTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedReport, setSelectedReport] = useState<EnhancedReport | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
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

  // Check if user can edit a report
  const canEditReport = useCallback((report: EnhancedReport): boolean => {
    // User can only edit their own reports
    if (report.authorId !== user?.uid) return false;
    
    // Can edit draft, submitted, under_review, or rejected reports
    const editableStatuses: ReportStatus[] = ['draft', 'submitted', 'under_review', 'rejected'];
    return editableStatuses.includes(report.status);
  }, [user?.uid]);

  // Check if user can resubmit a report
  const canResubmitReport = useCallback((report: EnhancedReport): boolean => {
    // User can only resubmit their own rejected reports
    if (report.authorId !== user?.uid) return false;
    return report.status === 'rejected';
  }, [user?.uid]);

  // Handle view report
  const handleViewReport = useCallback(async (report: EnhancedReport) => {
    try {
      setLoading(true);
      
      // Find the template for this report
      const template = templates.find(t => t.id === report.templateId);
      if (!template) {
        toast({
          title: 'Error',
          description: 'Template not found for this report',
          variant: 'destructive',
        });
        return;
      }

      setSelectedReport(report);
      setSelectedTemplate(template);
      setViewMode('view');
    } catch (error) {
      console.error('Error loading report for view:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [templates, toast]);

  // Handle edit report
  const handleEditReport = useCallback(async (report: EnhancedReport) => {
    try {
      setLoading(true);
      
      // Check if user can edit this report
      if (!canEditReport(report)) {
        toast({
          title: 'Cannot Edit Report',
          description: 'You can only edit your own reports that are in draft, submitted, under review, or rejected status.',
          variant: 'destructive',
        });
        return;
      }

      // Find the template for this report
      const template = templates.find(t => t.id === report.templateId);
      if (!template) {
        toast({
          title: 'Error',
          description: 'Template not found for this report',
          variant: 'destructive',
        });
        return;
      }

      setSelectedReport(report);
      setSelectedTemplate(template);
      setViewMode('edit');
    } catch (error) {
      console.error('Error loading report for edit:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report for editing',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [templates, canEditReport, toast]);

  // Handle back to list
  const handleBack = useCallback(() => {
    setViewMode('list');
    setSelectedReport(null);
    setSelectedTemplate(null);
  }, []);

  // Handle draft save
  const handleDraftSave = useCallback(async (report: EnhancedReport) => {
    try {
      await ReportService.updateReport(
        report.workspaceId, 
        report.id, 
        user?.uid || '',
        {
          fieldData: report.fieldData,
          title: report.title,
          status: 'draft',
          updatedAt: new Date(),
        }
      );

      toast({
        title: 'Success',
        description: 'Report draft saved successfully',
      });

      // Go back to list and refresh
      handleBack();
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to save draft',
        variant: 'destructive',
      });
    }
  }, [toast, handleBack, user?.uid]);

  // Handle report submission
  const handleReportSubmit = useCallback(async (report: EnhancedReport) => {
    try {
      const submissionData: ReportSubmissionData = {
        title: report.title,
        fieldData: report.fieldData,
        templateId: report.templateId!,
        templateVersion: selectedTemplate?.version || 1,
        attachments: [],
      };

      if (selectedReport?.id) {
        // Update existing report
        await ReportService.updateReport(
          report.workspaceId, 
          selectedReport.id, 
          user?.uid || '',
          {
            title: submissionData.title,
            fieldData: submissionData.fieldData,
            templateId: submissionData.templateId,
            templateVersion: submissionData.templateVersion,
            status: 'submitted',
            submittedAt: new Date(),
          }
        );
        toast({
          title: 'Success',
          description: selectedReport.status === 'rejected' ? 'Report resubmitted successfully' : 'Report updated and submitted successfully',
        });
      } else {
        // Create new report
        await ReportService.createReport(
          report.workspaceId,
          user?.uid || '',
          submissionData,
          'submitted'
        );
        toast({
          title: 'Success',
          description: 'Report submitted successfully',
        });
      }

      // Go back to list
      handleBack();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit report',
        variant: 'destructive',
      });
    }
  }, [selectedReport, selectedTemplate, toast, handleBack, user?.uid]);

  // Show view mode
  if (viewMode === 'view' && selectedReport && selectedTemplate) {
    return (
      <ReportView
        report={selectedReport}
        template={selectedTemplate}
        onBack={handleBack}
        onEdit={handleEditReport}
        onResubmit={handleReportSubmit}
        canEditReport={canEditReport}
        canResubmitReport={canResubmitReport}
      />
    );
  }

  // Show edit mode
  if (viewMode === 'edit' && selectedReport && selectedTemplate) {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Recent Reports
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {selectedReport.status === 'rejected' ? 'Resubmit Report' : 'Edit Report'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {selectedReport.status === 'rejected' ? 'Make changes and resubmit your report' : 'Update your report details'}
              </p>
            </div>
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

  // Show list mode
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recent Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reports.map((report) => {
            const badgeProps = getStatusBadge(report.status);
            const template = templates.find(t => t.id === report.templateId);
            const canEdit = canEditReport(report);
            
            return (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{template?.name || 'Unknown Template'}</h4>
                    <Badge {...badgeProps}>
                      {report.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(report.submittedAt || report.createdAt), 'MMM dd, yyyy')}
                    </div>
                    {report.submittedAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(report.submittedAt), 'HH:mm')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewReport(report)}
                    disabled={loading}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditReport(report)}
                      disabled={loading}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {reports.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reports submitted yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 