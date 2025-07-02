import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { FileText, Building, Eye, Edit, Trash2, MoreHorizontal, RefreshCw, Loader2 } from 'lucide-react';
import { EnhancedReport, ReportTemplate } from '@/lib/types';
import { getStatusBadge } from '@/components/reports/MemberReport/my-reports';

interface ReportCardProps {
  report: EnhancedReport;
  templates: ReportTemplate[];
  onView: (report: EnhancedReport) => void;
  onEdit: (report: EnhancedReport) => void;
  onResubmit: (report: EnhancedReport) => void;
  onDelete: (report: EnhancedReport) => void;
  canEditReport: (report: EnhancedReport) => boolean;
  canDeleteReport: (report: EnhancedReport) => boolean;
  canResubmitReport: (report: EnhancedReport) => boolean;
  isDeleting: string | null;
}

export function ReportCard({
  report,
  templates,
  onView,
  onEdit,
  onResubmit,
  onDelete,
  canEditReport,
  canDeleteReport,
  canResubmitReport,
  isDeleting,
}: ReportCardProps) {
  const template = templates.find(t => t.id === report.templateId);
  const statusBadge = getStatusBadge(report.status);

  return (
    <Card className="card-interactive hover:shadow-lg transition-all duration-200 border border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2 flex-1">
            {report.title}
          </CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge {...statusBadge}>
              {report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(report)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Report
                </DropdownMenuItem>
                {canEditReport(report) && (
                  <DropdownMenuItem onClick={() => onEdit(report)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Report
                  </DropdownMenuItem>
                )}
                {canResubmitReport(report) && (
                  <DropdownMenuItem onClick={() => onResubmit(report)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resubmit
                  </DropdownMenuItem>
                )}
                {canDeleteReport(report) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(report)}
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
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-1 mb-1">
            <FileText className="h-3 w-3" />
            Template: {template?.name || 'Unknown'}
          </div>
          {template?.category && (
            <div className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              Category: {template.category}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Created:</span>
            <span>{report.createdAt.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Updated:</span>
            <span>{report.updatedAt.toLocaleDateString()}</span>
          </div>
          {report.submittedAt && (
            <div className="flex items-center justify-between">
              <span>Submitted:</span>
              <span>{report.submittedAt.toLocaleDateString()}</span>
            </div>
          )}
          {report.attachments && report.attachments.length > 0 && (
            <div className="flex items-center justify-between">
              <span>Attachments:</span>
              <span>{report.attachments.length} file(s)</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(report)}
            className="flex-1 min-h-[36px]"
          >
            <Eye className="h-3 w-3 mr-2" />
            View
          </Button>
          {canEditReport(report) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(report)}
              className="flex-1 min-h-[36px]"
            >
              <Edit className="h-3 w-3 mr-2" />
              Edit
            </Button>
          )}
          {canResubmitReport(report) && (
            <Button
              size="sm"
              onClick={() => onResubmit(report)}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white min-h-[36px]"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Resubmit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}