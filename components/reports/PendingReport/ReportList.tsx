import React from 'react';
import { EnhancedReport, ReportTemplate, User } from '@/lib/types';
import { ReportCard } from './ReportCard';
import { Loader2, FileText } from 'lucide-react';

interface ReportListProps {
  reports: EnhancedReport[];
  templates: ReportTemplate[];
  users: User[];
  departments: any[];
  loading: boolean;
  onReviewReport: (report: EnhancedReport) => void;
  onApprove: (report: EnhancedReport, comment?: string) => void;
  onReject: (report: EnhancedReport, comment: string) => void;
  isProcessing: string | null;
  showAllWorkspaces?: boolean;
  workspaceCount?: number;
}

export function ReportList({
  reports,
  templates,
  users,
  departments,
  loading,
  onReviewReport,
  onApprove,
  onReject,
  isProcessing,
  showAllWorkspaces,
  workspaceCount,
}: ReportListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading pending reports...</p>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full flex items-center justify-center mx-auto">
            <FileText className="h-8 w-8 text-primary/60" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">No Pending Reports</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              There are no reports waiting for approval at the moment. 
              New submissions will appear here for your review.
            </p>
          </div>
          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              💡 Reports with status &quot;submitted&quot; will show up here for approval
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate urgency for each report (>7 days = urgent)
  const getReportUrgency = (submittedAt: Date | undefined) => {
    if (!submittedAt) return 'normal';
    const daysSinceSubmission = Math.floor((Date.now() - submittedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceSubmission > 7) return 'urgent';
    if (daysSinceSubmission > 3) return 'warning';
    return 'normal';
  };

  // Sort reports by urgency (urgent first) then by submission date
  const sortedReports = [...reports].sort((a, b) => {
    const urgencyA = getReportUrgency(a.submittedAt);
    const urgencyB = getReportUrgency(b.submittedAt);
    
    // Urgent reports first
    if (urgencyA === 'urgent' && urgencyB !== 'urgent') return -1;
    if (urgencyB === 'urgent' && urgencyA !== 'urgent') return 1;
    
    // Then by submission date (oldest first)
    return (a.submittedAt?.getTime() || 0) - (b.submittedAt?.getTime() || 0);
  });

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{reports.length}</p>
              <p className="text-xs text-muted-foreground">Total Pending</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">⚠️</span>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {reports.filter(r => getReportUrgency(r.submittedAt) === 'urgent').length}
              </p>
              <p className="text-xs text-muted-foreground">Urgent (&gt;7 days)</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">📊</span>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {new Set(reports.map(r => r.templateId)).size}
              </p>
              <p className="text-xs text-muted-foreground">Templates Used</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {sortedReports.map((report) => {
          const template = templates.find(t => t.id === report.templateId);
          const urgency = getReportUrgency(report.submittedAt);
          
          return (
            <ReportCard
              key={report.id}
              report={report}
              template={template}
              users={users}
              departments={departments}
              urgency={urgency}
              onReview={() => onReviewReport(report)}
              onApprove={() => onApprove(report)}
              onReject={(comment) => onReject(report, comment)}
              isProcessing={isProcessing === report.id}
            />
          );
        })}
      </div>

      {/* Mobile Optimization Notice */}
      <div className="sm:hidden pt-4 text-center">
        <p className="text-xs text-muted-foreground">
          💡 Tap any report card to review and take action
        </p>
      </div>
    </div>
  );
} 