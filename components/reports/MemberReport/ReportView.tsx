import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle, CheckCircle, ArrowLeft, Edit, RefreshCw, User } from 'lucide-react';
import { EnhancedReport, ReportTemplate } from '@/lib/types';
import { getStatusBadge } from '@/components/reports/MemberReport/my-reports';
import SmartRichTextDisplay from '@/components/ui/RichTextDisplay';

interface ReportViewProps {
  report: EnhancedReport;
  template: ReportTemplate | null;
  onBack: () => void;
  onEdit: (report: EnhancedReport) => void;
  onResubmit: (report: EnhancedReport) => void;
  canEditReport: (report: EnhancedReport) => boolean;
  canResubmitReport: (report: EnhancedReport) => boolean;
}

export function ReportView({
  report,
  template,
  onBack,
  onEdit,
  onResubmit,
  canEditReport,
  canResubmitReport,
}: ReportViewProps) {
  // Debug log
  console.log('ReportView debug:', { template, report });

  // Fallback if template is missing or has no fields
  if (!template || !template.fields || template.fields.length === 0) {
    return (
      <Card className="my-8">
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground italic">
            This report's template is missing or has no fields. Please contact an administrator.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header with back button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button variant="outline" onClick={onBack} className="self-start">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Reports
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
              {report.title}
            </h1>
            <Badge
              {...getStatusBadge(report.status)}
              className={`${getStatusBadge(report.status).className} flex-shrink-0`}
            >
              {report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Template: {template?.name || 'Unknown'} •
            {report.submittedAt ? `Submitted: ${report.submittedAt.toLocaleDateString()}` : 'Not submitted'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 self-start sm:self-center">
          {canEditReport(report) && (
            <Button
              variant="outline"
              onClick={() => onEdit(report)}
              className="min-h-[44px]"
            >
              <Edit className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Edit Report</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          )}
          {canResubmitReport(report) && (
            <Button
              onClick={() => onResubmit(report)}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white min-h-[44px]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Resubmit</span>
              <span className="sm:hidden">Resubmit</span>
            </Button>
          )}
        </div>
      </div>

      {/* Report Details */}
      <Card className="border border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Report Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {template && template.fields.map((field) => {
            const value = report.fieldData[field.id];
            return (
              <div key={field.id} className="mb-6">
                <label className="text-sm font-medium flex items-center gap-2 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                <div className="rounded-lg border border-border/30 bg-muted/40 px-4 py-3">
                  {field.type === 'file' ? (
                    <div className="space-y-2">
                      {Array.isArray(value) && value.length > 0 ? (
                        value.map((fileUrl, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-background rounded border">
                            <FileText className="h-4 w-4 text-primary" />
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 text-sm font-medium hover:underline flex-1 truncate"
                            >
                              Attachment {index + 1}
                            </a>
                          </div>
                        ))
                      ) : (
                        <span className="text-muted-foreground italic text-sm">No files attached</span>
                      )}
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${value ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                        {value && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm">{value ? 'Yes' : 'No'}</span>
                    </div>
                  ) : field.type === 'date' ? (
                    <span className="text-sm">{value ? new Date(value).toLocaleDateString() : 'Not set'}</span>
                  ) : field.type === 'textarea' ? (
                    <SmartRichTextDisplay value={value || ''} className="prose prose-base max-w-none dark:prose-invert" />
                  ) : (
                    <div className="text-base text-foreground">{value || <span className="text-muted-foreground italic">Not provided</span>}</div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Comments/Feedback Section */}
          {report.comments && report.comments.length > 0 && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Comments & Feedback
              </h3>
              <div className="space-y-3">
                {report.comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-200/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-sm">{comment.authorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {comment.createdAt.toLocaleDateString()}
                        </span>
                        {comment.type === 'approval' && (
                          <Badge variant="outline" className="text-xs">
                            Approval Comment
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{comment.content}</p>
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