'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Loader2, Download, MessageCircle, User, Calendar, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions } from '@/lib/rbac-hooks';
import { ReportService } from '@/lib/report-service';
import { ReportTemplateService } from '@/lib/report-template-service';
import { UserService } from '@/lib/user-service';
import { EnhancedReport, ReportTemplate, User as UserType } from '@/lib/types';

export default function ViewReportPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const permissions = useRolePermissions();
  
  const reportId = params.reportId as string;
  const [report, setReport] = useState<EnhancedReport | null>(null);
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [author, setAuthor] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [reportId, currentWorkspace?.id]);

  const loadReportData = async () => {
    if (!currentWorkspace?.id || !reportId) return;

    try {
      setLoading(true);
      const reportData = await ReportService.getReport(currentWorkspace.id, reportId);
      
      if (!reportData) {
        toast({
          title: 'Error',
          description: 'Report not found.',
          variant: 'destructive',
        });
        router.push('/dashboard/reports');
        return;
      }

      // Check if user can view this report
      const canView = reportData.authorId === user?.uid || 
                     permissions.canViewReports || 
                     permissions.canManageReports;
      
      if (!canView) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to view this report.',
          variant: 'destructive',
        });
        router.push('/dashboard/reports');
        return;
      }

      setReport(reportData);

      // Debug logging to see what data we have
      console.log('Report data loaded:', {
        id: reportData.id,
        title: reportData.title,
        status: reportData.status,
        templateId: reportData.templateId,
        hasFieldData: !!reportData.fieldData,
        fieldDataKeys: reportData.fieldData ? Object.keys(reportData.fieldData) : [],
        fieldData: reportData.fieldData
      });

      // Load template and author info in parallel
      const [templateData, authorData] = await Promise.all([
        reportData.templateId ? 
          ReportTemplateService.getTemplate(currentWorkspace.id, reportData.templateId) : 
          Promise.resolve(null),
        UserService.getUser(reportData.authorId).catch(() => null) // Handle case where user might not exist
      ]);

      console.log('Template data loaded:', {
        templateExists: !!templateData,
        templateName: templateData?.name,
        fieldsCount: templateData?.fields?.length || 0,
        fields: templateData?.fields?.map(f => ({ id: f.id, label: f.label, type: f.type }))
      });

      setTemplate(templateData);
      setAuthor(authorData);

    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
      case 'under_review':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderFieldValue = (fieldId: string, value: any, field: any) => {
    if (!value && value !== 0 && value !== false) {
      return <span className="text-muted-foreground italic">Not provided</span>;
    }

    switch (field?.type) {
      case 'date':
        return <span className="font-mono">{new Date(value).toLocaleDateString()}</span>;
      case 'checkbox':
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          );
        }
        return <Badge variant={value ? "default" : "secondary"}>{value ? "Yes" : "No"}</Badge>;
      case 'dropdown':
        return Array.isArray(value) ? 
          value.map((item, idx) => (
            <Badge key={idx} variant="outline" className="mr-1">
              {item}
            </Badge>
          )) : <Badge variant="outline">{value}</Badge>;
      case 'number':
        return <span className="font-mono">{Number(value).toLocaleString()}</span>;
      case 'file':
        if (Array.isArray(value)) {
          return (
            <div className="space-y-2">
              {value.map((file, idx) => (
                <div key={idx} className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{file.fileName || file}</span>
                  {file.fileSize && (
                    <span className="text-xs text-muted-foreground">
                      ({(file.fileSize / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
              ))}
            </div>
          );
        }
        return (
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>{value}</span>
          </div>
        );
      case 'textarea':
        return (
          <div className="p-3 bg-muted rounded-md border">
            <pre className="whitespace-pre-wrap text-sm font-sans">{value}</pre>
          </div>
        );
      default:
        return <span>{value.toString()}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested report could not be found.</p>
          <Button onClick={() => router.push('/dashboard/calendar')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/calendar')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Report Details</h1>
            <p className="text-muted-foreground">View report content and information</p>
          </div>
        </div>
        <Badge className={getStatusColor(report.status)} variant="outline">
          {report.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Report Header Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center space-x-2 mb-3">
                <FileText className="h-6 w-6" />
                <span>{report.title}</span>
              </CardTitle>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Author:</span>
                    <p className="font-medium">{author?.name || 'Unknown User'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">{formatDate(report.createdAt)}</p>
                  </div>
                </div>

                {report.submittedAt && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <p className="font-medium">{formatDate(report.submittedAt)}</p>
                    </div>
                  </div>
                )}

                {template && (
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Template:</span>
                      <p className="font-medium">{template.name}</p>
                    </div>
                  </div>
                )}

                {report.priority && (
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge variant="outline" className="capitalize">
                        {report.priority}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle>Report Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {template?.fields && report.fieldData ? (
            template.fields
              .sort((a, b) => a.order - b.order)
              .map((field) => (
                <div key={field.id} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-semibold text-foreground">
                      {field.label}
                    </label>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                        Required
                      </Badge>
                    )}
                  </div>
                  
                  <div className="pl-4 border-l-2 border-muted">
                    {renderFieldValue(field.id, report.fieldData[field.id], field)}
                  </div>
                  
                  {field.helpText && (
                    <p className="text-xs text-muted-foreground pl-4 italic">
                      {field.helpText}
                    </p>
                  )}
                </div>
              ))
          ) : report.fieldData && Object.keys(report.fieldData).length > 0 ? (
            // Fallback: Show raw field data if no template
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Template not available. Showing raw field data:
              </p>
              {Object.entries(report.fieldData).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                  </label>
                  <div className="p-3 bg-muted rounded-md">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20">
                <h3 className="font-semibold text-sm mb-2">⚠️ Debug Information</h3>
                <div className="text-xs space-y-1">
                  <p><strong>Report ID:</strong> {report.id}</p>
                  <p><strong>Template ID:</strong> {report.templateId || 'No template'}</p>
                  <p><strong>Has Field Data:</strong> {report.fieldData ? 'Yes' : 'No'}</p>
                  <p><strong>Field Data Keys:</strong> {report.fieldData ? Object.keys(report.fieldData).join(', ') : 'None'}</p>
                  <p><strong>Template Found:</strong> {template ? 'Yes' : 'No'}</p>
                  <p><strong>Template Fields Count:</strong> {template?.fields?.length || 0}</p>
                </div>
              </div>
              
              {report.fieldData && Object.keys(report.fieldData).length > 0 ? (
                <div>
                  <h3 className="font-semibold mb-3">Raw Report Data:</h3>
                  <div className="space-y-3">
                    {Object.entries(report.fieldData).map(([key, value]) => (
                      <div key={key} className="p-3 border rounded-lg">
                        <div className="font-medium text-sm mb-1">{key}:</div>
                        <div className="text-sm bg-muted p-2 rounded">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No content available for this report.</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    This report may not have been created with a template or may be missing field data.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      {report.attachments && report.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Attachments ({report.attachments.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {report.attachments.map((attachment, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{attachment.fileName}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{(attachment.fileSize / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{attachment.fileType}</span>
                        {attachment.uploadedAt && (
                          <>
                            <span>•</span>
                            <span>Uploaded {formatDate(attachment.uploadedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      {report.comments && report.comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Comments ({report.comments.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.comments.map((comment) => (
                <div key={comment.id} className="border-l-4 border-primary/30 pl-4 py-3 bg-muted/30 rounded-r-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm">{comment.authorName}</span>
                      {comment.type && (
                        <Badge variant="outline" className="text-xs">
                          {comment.type.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 