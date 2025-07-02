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
    <div className="min-h-screen bg-background">
      {/* Mobile-First Container */}
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 max-w-7xl">
        <div className="space-y-4 sm:space-y-6">
          
          {/* Header - Mobile-First Responsive */}
          <div className="space-y-4 sm:space-y-0">
            {/* Back Button and Breadcrumbs */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                onClick={onBack} 
                className="h-11 sm:h-10 px-3 sm:px-4 flex-shrink-0 touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base">Back to All Reports</span>
              </Button>
              
              {/* Template indicator */}
              <div className="min-w-0 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{template?.name || 'Unknown Template'}</span>
              </div>
            </div>

            {/* Title Section - Mobile Stacked Layout */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                    {report.title}
                  </h1>
                  
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <Badge {...statusBadge} className="text-xs sm:text-sm">
                      {report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons - Stack on Mobile */}
                {canApprove && report.status === 'submitted' && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                      onClick={() => onApprove(report)}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white min-h-[44px] sm:min-h-[40px] touch-manipulation font-medium order-1 sm:order-none"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      )}
                      Approve Report
                    </Button>
                    <Button
                      onClick={() => setShowRejectForm(true)}
                      disabled={isLoading}
                      variant="destructive"
                      className="min-h-[44px] sm:min-h-[40px] touch-manipulation font-medium order-2 sm:order-none"
                    >
                      <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      Reject Report
                    </Button>
                  </div>
                )}
              </div>
            
              {/* Report Metadata - Mobile-Optimized Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm sm:text-base text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">Author:</span>
                  <span className="truncate">{author?.name || author?.email || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">Submitted:</span>
                  <span>{report.submittedAt?.toLocaleDateString() || 'Not submitted'}</span>
                </div>
                {author?.departmentId && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Department:</span>
                    <span className="truncate">Department</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rejection Form - Mobile-First Card */}
          {showRejectForm && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-primary flex items-center gap-2 text-lg sm:text-xl">
                  <XCircle className="h-5 w-5 flex-shrink-0" />
                  Reject Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <Textarea
                  placeholder="Please provide a detailed reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[120px] sm:min-h-[100px] border-primary/20 focus:border-primary/40 resize-none touch-manipulation"
                />
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    onClick={handleReject}
                    disabled={!rejectionReason.trim() || isLoading}
                    variant="destructive"
                    className="min-h-[44px] sm:min-h-[40px] touch-manipulation font-medium order-1 sm:order-none"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    )}
                    Confirm Rejection
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason('');
                    }}
                    variant="outline"
                    className="min-h-[44px] sm:min-h-[40px] touch-manipulation order-2 sm:order-none"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Content - Enhanced Mobile Layout */}
          <Card className="border border-border/50 shadow-lg">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                Report Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 sm:space-y-8">
              {template && template.fields.map((field) => {
                const value = report.fieldData[field.id];

                return (
                  <div key={field.id} className="space-y-3 sm:space-y-4">
                    {/* Field Label - Mobile-Friendly */}
                    <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                      <label className="text-sm sm:text-base font-semibold text-foreground">
                        {field.label}
                      </label>
                      {field.required && (
                        <span className="text-primary text-sm font-medium">*</span>
                      )}
                    </div>

                    {/* Field Content - Responsive Display */}
                    <div className="p-4 sm:p-6 bg-muted/30 rounded-lg border border-border/30">
                      {field.type === 'file' ? (
                        <div className="space-y-3">
                          {Array.isArray(value) && value.length > 0 ? (
                            <div className="grid gap-2 sm:gap-3">
                              {value.map((fileUrl, fileIndex) => (
                                <div key={fileIndex} className="flex items-center gap-3 p-3 sm:p-4 bg-background rounded-lg border border-border/50">
                                  <FileText className="h-5 w-5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80 text-sm sm:text-base font-medium hover:underline flex-1 truncate touch-manipulation"
                                  >
                                    Attachment {fileIndex + 1}
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 sm:py-8">
                              <FileText className="h-8 w-8 sm:h-6 sm:w-6 mx-auto text-muted-foreground mb-2" />
                              <span className="text-muted-foreground italic text-sm sm:text-base">No files attached</span>
                            </div>
                          )}
                        </div>
                      ) : field.type === 'checkbox' ? (
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 sm:w-4 sm:h-4 rounded border-2 flex items-center justify-center ${value ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                            {value && <CheckCircle className="w-3 h-3 sm:w-2.5 sm:h-2.5 text-white" />}
                          </div>
                          <span className="text-sm sm:text-base font-medium">{value ? 'Yes' : 'No'}</span>
                        </div>
                      ) : field.type === 'date' ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm sm:text-base">{value ? new Date(value).toLocaleDateString() : 'Not set'}</span>
                        </div>
                      ) : (
                        <div className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">
                          {value || <span className="text-muted-foreground italic">Not provided</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Comments Section - Mobile-Optimized */}
              {report.comments && report.comments.length > 0 && (
                <div className="space-y-4 sm:space-y-6 border-t pt-6 sm:pt-8">
                  <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    Previous Comments ({report.comments.length})
                  </h3>
                  <div className="space-y-4">
                    {report.comments.map((comment) => (
                      <div key={comment.id} className="p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/20">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm sm:text-base truncate">{comment.authorName}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                {comment.createdAt.toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          {comment.type === 'approval' && (
                            <Badge variant="outline" className="text-xs self-start sm:self-auto">
                              Admin Comment
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">
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
      </div>
    </div>
  );
}