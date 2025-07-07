import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  FileText, 
  User, 
  Building,
  AlertCircle,
  Loader2,
  Calendar
} from 'lucide-react';
import { EnhancedReport, ReportTemplate, User as UserType } from '@/lib/types';
import { getStatusBadge } from './all-reports';

interface ReportReviewProps {
  report: EnhancedReport;
  template: ReportTemplate | null;
  author: UserType | null;
  onBack: () => void;
  onApprove: (report: EnhancedReport) => void;
  onReject: (report: EnhancedReport, reason: string) => void;
  isLoading: boolean;
  canApprove: boolean;
}

export function ReportReview({
  report,
  template,
  author,
  onBack,
  onApprove,
  onReject,
  isLoading,
  canApprove,
}: ReportReviewProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      return;
    }
    onReject(report, rejectionReason);
    setRejectionReason('');
    setShowRejectForm(false);
  };

  const statusBadge = getStatusBadge(report.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Reports
          </Button>
          <div className="min-w-0 flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="truncate">{template?.name || 'Operations Report'}</span>
          </div>
        </div>
        {canApprove && report.status === 'submitted' && (
          <div className="flex items-center gap-3">
            <Button
              onClick={() => onApprove(report)}
              disabled={isLoading}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Report
            </Button>
            <Button
              onClick={() => setShowRejectForm(true)}
              disabled={isLoading}
              variant="destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Report
            </Button>
          </div>
        )}
      </div>

      {/* Title and Status */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {report.title}
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <Badge {...statusBadge} className="text-sm">
            {report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>
      </div>

      {/* Report Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="font-medium">Author:</span>
          <span className="truncate">{author?.name || author?.email || 'Benjamin Kamson'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="font-medium">Submitted:</span>
          <span>{report.submittedAt?.toLocaleDateString() || '6/30/2025'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          <span className="font-medium">Department:</span>
          <span className="truncate">Department</span>
        </div>
      </div>

      {/* Rejection Form */}
      {showRejectForm && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Reject Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Please provide a detailed reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isLoading}
                variant="destructive"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Confirm Rejection
              </Button>
              <Button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Report Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sample field for demonstration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/30">
              <label className="font-semibold text-foreground">
                Work one
              </label>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
              <div className="whitespace-pre-wrap break-words leading-relaxed">
                Here you go, Bismark — a comprehensive AI prompt to build the My Reports Page (/reports/my) in your workspace management system, tailored for Firebase, dynamic templates, and your role-based setup.
              </div>
            </div>
          </div>

          {/* Dynamic fields from template */}
          {template && template.fields.map((field) => {
            const value = report.fieldData[field.id];

            return (
              <div key={field.id} className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                  <label className="font-semibold text-foreground">
                    {field.label}
                  </label>
                  {field.required && (
                    <span className="text-primary text-sm font-medium">*</span>
                  )}
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                  {field.type === 'file' ? (
                    <div className="space-y-3">
                      {Array.isArray(value) && value.length > 0 ? (
                        <div className="grid gap-2">
                          {value.map((fileUrl, fileIndex) => (
                            <div key={fileIndex} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border/50">
                              <FileText className="h-4 w-4 text-primary" />
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 font-medium hover:underline flex-1 truncate"
                              >
                                Attachment {fileIndex + 1}
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <FileText className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                          <span className="text-muted-foreground italic">No files attached</span>
                        </div>
                      )}
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${value ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                        {value && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="font-medium">{value ? 'Yes' : 'No'}</span>
                    </div>
                  ) : field.type === 'date' ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{value ? new Date(value).toLocaleDateString() : 'Not set'}</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words leading-relaxed">
                      {value || <span className="text-muted-foreground italic">Not provided</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Comments Section */}
          {report.comments && report.comments.length > 0 && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Previous Comments ({report.comments.length})
              </h3>
              <div className="space-y-4">
                {report.comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-muted/30 rounded-lg border border-border/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold">{comment.authorName}</div>
                          <div className="text-xs text-muted-foreground">
                            {comment.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {comment.type === 'approval' && (
                        <Badge variant="outline" className="text-xs">
                          Admin Comment
                        </Badge>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {comment.content}
                    </p>
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