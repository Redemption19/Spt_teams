import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Building, User, Eye, Calendar } from 'lucide-react';
import { EnhancedReport, ReportTemplate, User as UserType } from '@/lib/types';
import { getStatusBadge } from './all-reports';

interface ReportCardProps {
  report: EnhancedReport;
  templates: ReportTemplate[];
  users: UserType[];
  departments: any[];
  onView: (report: EnhancedReport) => void;
}

export function ReportCard({
  report,
  templates,
  users,
  departments,
  onView,
}: ReportCardProps) {
  const template = templates.find(t => t.id === report.templateId);
  const author = users.find(u => u.id === report.authorId);
  const department = departments.find(d => d.id === author?.departmentId);
  const statusBadge = getStatusBadge(report.status);

  return (
    <Card className="card-interactive hover:shadow-lg transition-all duration-200 border border-border/50 h-full">
      {/* Header - Matching Folder Card Pattern */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2 flex-1 leading-tight">
            {report.title}
          </CardTitle>
          <Badge {...statusBadge} className="flex-shrink-0 text-xs">
            {report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Template Info - Compact Sizing */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Template:</span>
            <span className="truncate">{template?.name || 'Unknown'}</span>
          </div>
          {template?.category && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Category:</span>
              <span className="truncate">{template.category}</span>
            </div>
          )}
        </div>

        {/* Author Info - Compact Sizing */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">By:</span>
            <span className="truncate">
              {author?.name || `${author?.firstName} ${author?.lastName}` || author?.email || 'Unknown'}
            </span>
          </div>
          {department && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Department:</span>
              <span className="truncate">{department.name}</span>
            </div>
          )}
        </div>

        {/* Dates - Matching Folder Card Footer Style */}
        <div className="pt-2 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Created</span>
            </div>
            <span>{report.createdAt.toLocaleDateString()}</span>
          </div>
          {report.submittedAt && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Submitted</span>
              </div>
              <span>{report.submittedAt.toLocaleDateString()}</span>
            </div>
          )}
          {report.attachments && report.attachments.length > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Attachments</span>
              <span>{report.attachments.length} file{report.attachments.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Actions - Matching Folder Card Button Style */}
        <div className="flex space-x-2 pt-2">
          <Button
            onClick={() => onView(report)}
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}