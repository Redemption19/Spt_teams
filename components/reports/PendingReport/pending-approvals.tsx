'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Search, 
  Calendar, 
  User as UserIcon, 
  Building, 
  CheckCircle, 
  XCircle,
  Clock,
  Filter,
  Eye,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions, useIsOwner } from '@/lib/rbac-hooks';
import { EnhancedReport, ReportTemplate, User } from '@/lib/types';
import { ReportService } from '@/lib/report-service';
import { ReportTemplateService } from '@/lib/report-template-service';
import { UserService } from '@/lib/user-service';
import { DepartmentService } from '@/lib/department-service';
import { ReportReview } from './ReportReview';
import { FilterPanel } from './FilterPanel';
import { ConfirmationDialog } from './ConfirmationDialog';
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
import { ReportList } from './ReportList';

export type ViewMode = 'list' | 'review';

// Skeleton loading components
const PendingReportCardSkeleton = () => (
  <Card className="card-interactive hover:shadow-lg transition-all duration-200">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const PendingReportsSkeleton = () => (
  <div className="space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
    
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <PendingReportCardSkeleton key={index} />
      ))}
    </div>
  </div>
);

export interface FilterState {
  search: string;
  department: string;
  template: string;
  dateFrom: string;
  dateTo: string;
}

// Cross-workspace props interface
interface CrossWorkspaceProps {
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
  setShowAllWorkspaces?: (show: boolean) => void;
}

export function PendingApprovals({ showAllWorkspaces, accessibleWorkspaces }: CrossWorkspaceProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const permissions = useRolePermissions();
  const isOwner = useIsOwner();

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [reports, setReports] = useState<EnhancedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<EnhancedReport | null>(null);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    department: 'all',
    template: 'all',
    dateFrom: '',
    dateTo: '',
  });

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

  // Check permissions
  const canManageReports = permissions.canManageReports;

  const accessibleWorkspaceIds = accessibleWorkspaces?.map(w => w.id).join(',') || '';
  // Load all data with cross-workspace support
  const loadData = useCallback(async () => {
    console.log('🔄 PendingApprovals loadData started', { 
      workspaceId: currentWorkspace?.id, 
      userId: user?.uid,
      showAllWorkspaces,
      accessibleWorkspaces: accessibleWorkspaces?.length || 0
    });

    if (!currentWorkspace?.id || !user?.uid || !canManageReports) return;

    try {
      setLoading(true);

      // Determine workspace IDs to load from
      const workspaceIds = (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) 
        ? accessibleWorkspaces.map(w => w.id)
        : [currentWorkspace.id];
      
      console.log('🏢 Loading pending approvals from workspaces:', workspaceIds);

      // Load data from all relevant workspaces
      let allPendingReports: EnhancedReport[] = [];
      let allTemplates: ReportTemplate[] = [];
      let allUsers: User[] = [];
      let allDepartments: any[] = [];
      
      for (const wsId of workspaceIds) {
        try {
          const [wsPendingReports, wsTemplates, wsUsers, wsDepartments] = await Promise.all([
            ReportService.getPendingReports(wsId, {
              department: filters.department !== 'all' ? filters.department : undefined,
              template: filters.template !== 'all' ? filters.template : undefined,
              dateFrom: filters.dateFrom || undefined,
              dateTo: filters.dateTo || undefined,
              search: filters.search || undefined,
              limit: 100,
              orderBy: 'submittedAt',
              orderDirection: 'desc',
            }),
            ReportTemplateService.getWorkspaceTemplates(wsId, { status: 'active' }),
            UserService.getUsersByWorkspace(wsId),
            DepartmentService.getWorkspaceDepartments(wsId),
          ]);

          // Aggregate pending reports (avoid duplicates)
          wsPendingReports.forEach(report => {
            if (!allPendingReports.some(r => r.id === report.id)) {
              allPendingReports.push(report);
            }
          });

          // Aggregate templates (avoid duplicates)
          wsTemplates.forEach(template => {
            if (!allTemplates.some(t => t.id === template.id)) {
              allTemplates.push(template);
            }
          });

          // Aggregate users (avoid duplicates)
          wsUsers.forEach(user => {
            if (!allUsers.some(u => u.id === user.id)) {
              allUsers.push(user);
            }
          });

          // Aggregate departments (avoid duplicates)
          wsDepartments.forEach(dept => {
            if (!allDepartments.some(d => d.id === dept.id)) {
              allDepartments.push(dept);
            }
          });

        } catch (wsError) {
          console.error(`Error loading pending reports from workspace ${wsId}:`, wsError);
        }
      }

      // Sort pending reports by submitted date (most recent first)
      allPendingReports.sort((a, b) => {
        const aDate = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const bDate = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return bDate - aDate;
      });

      setReports(allPendingReports);
      setTemplates(allTemplates);
      setUsers(allUsers);
      setDepartments(allDepartments);

      console.log('✅ PendingApprovals data loaded successfully', {
        pendingReports: allPendingReports.length,
        templates: allTemplates.length,
        users: allUsers.length,
        departments: allDepartments.length
      });

    } catch (error) {
      console.error('❌ Error loading pending reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending reports. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, user?.uid, canManageReports, filters, isOwner, showAllWorkspaces, accessibleWorkspaces, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      department: 'all',
      template: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  // Handle report selection
  const handleReviewReport = (report: EnhancedReport) => {
    setSelectedReport(report);
    setViewMode('review');
  };

  const handleBackToList = () => {
    setSelectedReport(null);
    setViewMode('list');
    loadData(); // Refresh data when returning to list
  };

  // Handle approve report
  const handleApproveReport = async (report: EnhancedReport, comment?: string) => {
    if (!user?.uid) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Approve Report?',
      description: `Are you sure you want to approve "${report.title}"? This action cannot be undone.`,
      confirmText: 'Yes, Approve',
      cancelText: 'Cancel',
      variant: 'default',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          setIsProcessing(report.id);
          await ReportService.approveReport(
            report.workspaceId || currentWorkspace?.id || '',
            report.id,
            user.uid,
            comment
          );

          toast({
            title: 'Report Approved',
            description: `"${report.title}" has been approved successfully.`,
            className: 'bg-gradient-to-r from-primary to-accent text-white', // Brand/dark color
          });

          if (viewMode === 'review') {
            handleBackToList();
          } else {
            loadData();
          }
        } catch (error) {
          console.error('Error approving report:', error);
          toast({
            title: 'Error',
            description: 'Failed to approve report. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsProcessing(null);
        }
      }
    });
  };

  // Handle reject report
  const handleRejectReport = async (report: EnhancedReport, comment: string) => {
    if (!user?.uid || !comment.trim()) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Reject Report?',
      description: `Are you sure you want to reject "${report.title}"? The author will be notified with your feedback.`,
      confirmText: 'Yes, Reject',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          setIsProcessing(report.id);
          await ReportService.rejectReport(
            report.workspaceId || currentWorkspace?.id || '',
            report.id,
            user.uid,
            comment
          );

          toast({
            title: 'Report Rejected',
            description: `"${report.title}" has been rejected. The author will receive your feedback.`,
            className: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
          });

          if (viewMode === 'review') {
            handleBackToList();
          } else {
            loadData();
          }
        } catch (error) {
          console.error('Error rejecting report:', error);
          toast({
            title: 'Error',
            description: 'Failed to reject report. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsProcessing(null);
        }
      }
    });
  };

  // Permission check
  if (!canManageReports) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You don&apos;t have permission to view pending report approvals. Only administrators and owners can access this page.
        </p>
      </div>
    );
  }

  // Show review view
  if (viewMode === 'review' && selectedReport) {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pending Reports
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Review Report
              {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && ' 🌐'}
            </h1>
            <p className="text-muted-foreground">
              Submitted by {users.find(u => u.id === selectedReport.authorId)?.name || 'Unknown User'} • {selectedReport.submittedAt?.toLocaleDateString()}
            </p>
          </div>
        </div>

        <ReportReview
          report={selectedReport}
          templates={templates}
          users={users}
          departments={departments}
          onApprove={handleApproveReport}
          onReject={handleRejectReport}
          isProcessing={isProcessing === selectedReport.id}
        />

        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
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

  // Show list view
  return (
    <div className="space-y-6">
      {/* Cross-workspace status indicator */}
      {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-800/50">
          <Building className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <Badge variant="outline" className="text-sm">
            🌐 Pending approvals across {accessibleWorkspaces.length} workspaces
          </Badge>
          <span className="text-sm text-orange-700 dark:text-orange-400">
            {reports.length} reports awaiting review
          </span>
        </div>
      )}

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        templates={templates}
        departments={departments}
        resultsCount={reports.length}
        showAllWorkspaces={showAllWorkspaces}
        workspaceCount={accessibleWorkspaces?.length}
      />

      {/* Report List */}
      {loading ? (
        <PendingReportsSkeleton />
      ) : (
        <ReportList
          reports={reports}
          templates={templates}
          users={users}
          departments={departments}
          loading={loading}
          onReviewReport={handleReviewReport}
          onApprove={handleApproveReport}
          onReject={handleRejectReport}
          isProcessing={isProcessing}
          showAllWorkspaces={showAllWorkspaces}
          workspaceCount={accessibleWorkspaces?.length}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
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