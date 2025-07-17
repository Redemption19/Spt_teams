import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { EnhancedReport, ReportTemplate } from '@/lib/types';
import { 
  Calendar, 
  User, 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Loader2,
  Building
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ReportCardProps {
  report: EnhancedReport;
  template?: ReportTemplate;
  users: any[];
  departments: any[];
  urgency: 'normal' | 'warning' | 'urgent';
  onReview: () => void;
  onApprove: () => void;
  onReject: (comment: string) => void;
  isProcessing: boolean;
}

export function ReportCard({
  report,
  template,
  users,
  departments,
  urgency,
  onReview,
  onApprove,
  onReject,
  isProcessing,
}: ReportCardProps) {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Calculate days since submission
  const daysSinceSubmission = report.submittedAt 
    ? Math.floor((Date.now() - report.submittedAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Look up author information
  const author = users.find(u => u.id === report.authorId);
  const authorName = author?.name || author?.displayName || 
                     (author?.firstName && author?.lastName ? `${author.firstName} ${author.lastName}` : null) ||
                     author?.email || report.authorEmail || 'Unknown User';
  
  // Look up department information
  const authorDepartment = author?.department ? 
    departments.find(d => d.id === author.department)?.name || author.department 
    : report.authorDepartment || null;

  // Get urgency styling
  const getUrgencyStyle = () => {
    switch (urgency) {
      case 'urgent':
        return 'border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20';
      default:
        return 'border-border/50 bg-gradient-to-br from-background to-background/80';
    }
  };

  const getUrgencyBadge = () => {
    switch (urgency) {
      case 'urgent':
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Urgent ({daysSinceSubmission}d)
          </Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {daysSinceSubmission} days ago
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {daysSinceSubmission} day{daysSinceSubmission !== 1 ? 's' : ''} ago
          </Badge>
        );
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) return;
    
    setIsSubmittingReject(true);
    try {
      await onReject(rejectComment.trim());
      setIsRejectDialogOpen(false);
      setRejectComment('');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  return (
    <Card className={`card-interactive transition-all duration-300 hover:shadow-lg ${getUrgencyStyle()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground line-clamp-2 leading-tight">
              {report.title}
            </h3>
          </div>
          {getUrgencyBadge()}
        </div>
        
        <div className="space-y-2 text-sm">
          {/* Template Info */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {template?.name || 'Unknown Template'}
            </span>
          </div>
          
          {/* Author Info */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              Submitted by {authorName}
            </span>
          </div>
          
          {/* Department Info */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {authorDepartment || 'Not specified'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-3">
        <div className="space-y-3">
          {/* Submission Date */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Submitted:</span>
            <span className="font-medium text-foreground">
              {report.submittedAt?.toLocaleDateString() || 'Unknown'}
            </span>
          </div>
          
          {/* Template Category */}
          {template?.category && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Category:</span>
              <Badge variant="outline" className="text-xs">
                {template.category}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 flex flex-col gap-3">
        {/* Primary Action - Review */}
        <Button
          onClick={onReview}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 touch-manipulation"
          disabled={isProcessing}
        >
          <Eye className="h-4 w-4 mr-2" />
          Review Report
        </Button>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            onClick={onApprove}
            variant="outline"
            size="sm"
            disabled={isProcessing}
            className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 touch-manipulation"
          >
            {isProcessing ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="h-3 w-3 mr-1" />
            )}
            <span className="text-xs">Approve</span>
          </Button>
          
          <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessing}
                className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 touch-manipulation"
              >
                <XCircle className="h-3 w-3 mr-1" />
                <span className="text-xs">Reject</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Reject Report
                </DialogTitle>
                <DialogDescription>
                  Provide feedback for &quot;{report.title}&quot;. This will be sent to the author.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <Textarea
                  placeholder="Please explain why this report is being rejected..."
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  className="min-h-[100px] resize-none"
                  maxLength={500}
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
                  disabled={isSubmittingReject}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={!rejectComment.trim() || isSubmittingReject}
                  className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white"
                >
                  {isSubmittingReject ? (
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
      </CardFooter>
    </Card>
  );
} 