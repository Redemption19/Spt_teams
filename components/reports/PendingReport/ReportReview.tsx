import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  MessageSquare,
  AlertTriangle,
  UserCheck,
  Award,
  Shield,
  CheckSquare,
  XCircle as XCircleIcon,
  FileIcon
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
import { format } from 'date-fns';
import { UserService } from '@/lib/user-service';
import { WorkspaceService } from '@/lib/workspace-service';

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
  const [authorName, setAuthorName] = useState<string>('');
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const template = templates.find(t => t.id === report.templateId);
  
  // Look up author information
  const author = users.find(u => u.id === report.authorId);
  const authorDepartment = author?.department ? 
    departments.find(d => d.departmentId === author.department)?.name || author.department 
    : 'Not specified';
  
  // Calculate days since submission
  const daysSinceSubmission = report.submittedAt 
    ? Math.floor((Date.now() - report.submittedAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Fetch author and workspace names
  useEffect(() => {
    const fetchNames = async () => {
      try {
        setLoading(true);
        
        // Fetch author name
        if (report.authorId) {
          const user = await UserService.getUserById(report.authorId);
          if (user) {
            const displayName = user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.name || user.email || 'Unknown User';
            setAuthorName(displayName);
          } else {
            setAuthorName('Unknown User');
          }
        }

        // Fetch workspace name
        if (report.workspaceId) {
          const workspace = await WorkspaceService.getWorkspace(report.workspaceId);
          if (workspace) {
            setWorkspaceName(workspace.name || 'Unknown Workspace');
          } else {
            setWorkspaceName('Unknown Workspace');
          }
        }
      } catch (error) {
        console.error('Error fetching names:', error);
        setAuthorName('Unknown User');
        setWorkspaceName('Unknown Workspace');
      } finally {
        setLoading(false);
      }
    };

    fetchNames();
  }, [report.authorId, report.workspaceId]);

  // Helper function to get field type icon
  const getFieldTypeIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'textarea': return <FileText className="h-4 w-4" />;
      case 'number': return <Tag className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'dropdown': return <CheckSquare className="h-4 w-4" />;
      case 'checkbox': return <CheckSquare className="h-4 w-4" />;
      case 'file': return <FileIcon className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Helper function to get field type color
  const getFieldTypeColor = (fieldType: string) => {
    switch (fieldType) {
      case 'text': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'textarea': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'number': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      case 'date': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'dropdown': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20';
      case 'checkbox': return 'text-pink-600 bg-pink-50 dark:bg-pink-900/20';
      case 'file': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

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
      {/* Header Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-background to-muted/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title and Status */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
                  {report.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs px-3 py-1">
                    Pending Review
                  </Badge>
                  {daysSinceSubmission > 7 && (
                    <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs px-3 py-1">
                      Urgent ({daysSinceSubmission} days ago)
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  <span>Template: {template?.name || 'Unknown'}</span>
                </div>
                {report.submittedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Submitted: {format(report.submittedAt, 'MMM dd, yyyy')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Created: {format(report.createdAt, 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={() => setIsApproveDialogOpen(true)}
                disabled={isProcessing}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white min-h-[44px] shadow-lg"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Approve</span>
                <span className="sm:hidden">Approve</span>
              </Button>
              <Button
                onClick={() => setIsRejectDialogOpen(true)}
                disabled={isProcessing}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 min-h-[44px]"
              >
                <XCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Reject</span>
                <span className="sm:hidden">Reject</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Report Fields */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Report Content
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Review all submitted information and data for this report
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {template && template.fields.map((field, index) => {
                const value = report.fieldData[field.id];
                const hasValue = value !== undefined && value !== null && value !== '';
                
                return (
                  <div key={field.id} className="group">
                    {/* Field Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${getFieldTypeColor(field.type)}`}>
                        {getFieldTypeIcon(field.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          {field.label}
                          {field.required && <span className="text-red-500 text-sm">*</span>}
                        </h3>
                        {field.helpText && (
                          <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                        )}
                      </div>
                    </div>

                    {/* Field Value */}
                    <div className={`rounded-xl border-2 transition-all duration-200 ${
                      hasValue 
                        ? 'border-primary/20 bg-primary/5' 
                        : 'border-muted/50 bg-muted/20'
                    }`}>
                      <div className="p-4">
                        {field.type === 'file' ? (
                          <div className="space-y-3">
                            {Array.isArray(value) && value.length > 0 ? (
                              value.map((fileUrl, fileIndex) => (
                                <div key={fileIndex} className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50 hover:bg-background/80 transition-colors">
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <FileIcon className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:text-primary/80 font-medium hover:underline truncate block"
                                    >
                                      Attachment {fileIndex + 1}
                                    </a>
                                    <p className="text-xs text-muted-foreground">Click to view or download</p>
                                  </div>
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <XCircleIcon className="h-4 w-4" />
                                <span className="text-sm">No files attached</span>
                              </div>
                            )}
                          </div>
                        ) : field.type === 'checkbox' ? (
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                              value ? 'bg-primary border-primary' : 'border-muted-foreground bg-muted/50'
                            }`}>
                              {value && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                            <span className="font-medium">{value ? 'Yes' : 'No'}</span>
                          </div>
                        ) : field.type === 'date' ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {value ? format(new Date(value), 'MMMM dd, yyyy') : 'Not set'}
                            </span>
                          </div>
                        ) : field.type === 'textarea' ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <SmartRichTextDisplay value={value || ''} className="prose prose-base max-w-none dark:prose-invert" />
                          </div>
                        ) : (
                          <div className="text-base font-medium text-foreground">
                            {hasValue ? value : (
                              <span className="text-muted-foreground italic">Not provided</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Separator between fields */}
                    {index < template.fields.length - 1 && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Report Metadata */}
        <div className="space-y-6">
          {/* Report Information */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-primary" />
                Report Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Author</p>
                    <p className="font-medium">
                      {loading ? (
                        <span className="text-muted-foreground italic">Loading...</span>
                      ) : (
                        authorName || 'Unknown User'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <Building className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Workspace</p>
                    <p className="font-medium">
                      {loading ? (
                        <span className="text-muted-foreground italic">Loading...</span>
                      ) : (
                        workspaceName || 'Unknown Workspace'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{authorDepartment}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Template Version</p>
                    <p className="font-medium">{report.templateVersion || '1.0'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Days Pending</p>
                    <p className="font-medium">{daysSinceSubmission} days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Guidelines */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
                Review Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Approve</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Report meets all requirements and standards
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg border border-red-200/50 dark:border-red-800/50">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">Reject</p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      Report needs revisions or corrections
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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