import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EnhancedReport, ReportTemplate } from '@/lib/types';
import { 
  FileText, 
  User, 
  Calendar, 
  Building, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Download,
  Clock,
  Tag,
  MessageSquare
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SmartRichTextDisplay from '@/components/ui/RichTextDisplay';

interface ReportReviewProps {
  report: EnhancedReport;
  templates: ReportTemplate[];
  users: any[];
  departments: any[];
  onApprove: (report: EnhancedReport, comment?: string) => void;
  onReject: (report: EnhancedReport, comment: string) => void;
  isProcessing: boolean;
}

export function ReportReview({
  report,
  templates,
  users,
  departments,
  onApprove,
  onReject,
  isProcessing,
}: ReportReviewProps) {
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const template = templates.find(t => t.id === report.templateId);
  
  // Look up author information
  const author = users.find(u => u.id === report.authorId);
  const authorName = author?.name || author?.displayName || 
                     (author?.firstName && author?.lastName ? `${author.firstName} ${author.lastName}` : null) ||
                     author?.email || 'Unknown User';
  
  // Look up department information
  const authorDepartment = author?.department ? 
    departments.find(d => d.departmentId === author.department)?.name || author.department 
    : 'Not specified';
  
  // Calculate days since submission
  const daysSinceSubmission = report.submittedAt 
    ? Math.floor((Date.now() - report.submittedAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleApprove = () => {
    onApprove(report, approvalComment.trim() || undefined);
    setIsApproveDialogOpen(false);
    setApprovalComment('');
  };

  const handleReject = () => {
    if (!rejectComment.trim()) return;
    onReject(report, rejectComment.trim());
    setIsRejectDialogOpen(false);
    setRejectComment('');
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {report.title}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                  Submitted
                </Badge>
                {daysSinceSubmission > 7 && (
                  <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white">
                    Urgent ({daysSinceSubmission} days ago)
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setIsApproveDialogOpen(true)}
                disabled={isProcessing}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => setIsRejectDialogOpen(true)}
                disabled={isProcessing}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Submitted by</p>
                <p className="font-medium text-sm">{authorName}</p>
              </div>
            </div>
            
            {/* Template */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Template</p>
                <p className="font-medium text-sm">{template?.name || 'Unknown'}</p>
              </div>
            </div>
            
            {/* Department */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-medium text-sm">{authorDepartment}</p>
              </div>
            </div>
            
            {/* Submission Date */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="font-medium text-sm">
                  {report.submittedAt?.toLocaleDateString() || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Report Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {template && template.fields.map((field) => {
            const value = report.fieldData[field.id];
            
            return (
              <div key={field.id} className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                  <Badge variant="outline" className="text-xs">
                    {field.type}
                  </Badge>
                </Label>
                
                <div className="p-3 bg-muted/50 rounded-md border min-h-[60px] flex items-start">
                  {field.type === 'file' ? (
                    <div className="space-y-2 w-full">
                      {Array.isArray(value) && value.length > 0 ? (
                        value.map((fileUrl, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">File {index + 1}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(fileUrl, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        ))
                      ) : (
                        <span className="text-muted-foreground italic text-sm">No files attached</span>
                      )}
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        value ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}>
                        {value && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm">{value ? 'Yes' : 'No'}</span>
                    </div>
                  ) : field.type === 'date' ? (
                    <span className="text-sm">
                      {value ? new Date(value).toLocaleDateString() : 'Not set'}
                    </span>
                  ) : field.type === 'textarea' ? (
                    <SmartRichTextDisplay value={value || ''} className="prose prose-base max-w-none dark:prose-invert" />
                  ) : (
                    <span className="text-sm whitespace-pre-wrap">
                      {value || 'Not provided'}
                    </span>
                  )}
                </div>
                
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">💡 {field.helpText}</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Approve Report
            </DialogTitle>
            <DialogDescription>
              You&apos;re about to approve &quot;{report.title}&quot;. You can optionally add a comment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Optional: Add approval comments or feedback..."
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={300}
            />
            <div className="text-xs text-muted-foreground text-right">
              {approvalComment.length}/300 characters
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsApproveDialogOpen(false);
                setApprovalComment('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Reject Report
            </DialogTitle>
            <DialogDescription>
              Please provide detailed feedback for &quot;{report.title}&quot;. This will be sent to the author.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Please explain why this report is being rejected..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={500}
              required
            />
            <div className="text-xs text-muted-foreground text-right">
              {rejectComment.length}/500 characters
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectComment('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectComment.trim() || isProcessing}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 