import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Play,
  Square,
  AlertCircle,
  FileText,
  Calendar,
  Users,
  Database
} from 'lucide-react';
import { format as formatDate } from 'date-fns';

interface ExportProgressState {
  id: string;
  status: 'preparing' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalItems: number;
  processedItems: number;
  startedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  fileName?: string;
}

interface ReportExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeComments: boolean;
  includeAttachments: boolean;
  includeFieldLabels: boolean;
  includeTemplateInfo: boolean;
  includeApprovalWorkflow: boolean;
  groupByTemplate: boolean;
  groupByDepartment: boolean;
  sortBy: 'submittedAt' | 'updatedAt' | 'title' | 'status' | 'department';
  sortDirection: 'asc' | 'desc';
  customFields: string[];
  fileName?: string;
}

interface ExportProgressProps {
  progress: ExportProgressState | null;
  onStartExport: () => void;
  onCancel: () => void;
  isExporting: boolean;
  previewData?: any;
  options: ReportExportOptions;
}

export function ExportProgress({
  progress,
  onStartExport,
  onCancel,
  isExporting,
  previewData,
  options,
}: ExportProgressProps) {
  const getStatusIcon = () => {
    if (!progress) return null;
    
    switch (progress.status) {
      case 'preparing':
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <Square className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    if (!progress) return 'bg-gray-200';
    
    switch (progress.status) {
      case 'preparing':
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-orange-500';
      default:
        return 'bg-gray-200';
    }
  };

  const getElapsedTime = () => {
    if (!progress) return '';
    
    const endTime = progress.completedAt || progress.failedAt || new Date();
    const elapsed = Math.floor((endTime.getTime() - progress.startedAt.getTime()) / 1000);
    
    if (elapsed < 60) return `${elapsed}s`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
    return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
  };

  const handleDownload = () => {
    // Simulate download - replace with actual download logic
    const link = document.createElement('a');
    link.href = '#'; // Replace with actual file URL
    link.download = progress?.fileName || 'export.xlsx';
    link.click();
  };

  // If no progress yet, show start export
  if (!progress) {
    return (
      <div className="space-y-6">
        {/* Export Summary */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Database className="h-5 w-5" />
              Ready to Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{previewData.totalRecords}</div>
                  <div className="text-sm text-muted-foreground">Reports</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase">{options.format}</div>
                  <div className="text-sm text-muted-foreground">Format</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{previewData.estimatedFileSize}</div>
                  <div className="text-sm text-muted-foreground">Est. Size</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{previewData.estimatedProcessingTime}</div>
                  <div className="text-sm text-muted-foreground">Est. Time</div>
                </div>
              </div>
            )}
            
            <Separator />
            
            {/* Export Options Summary */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Export Configuration</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <FileText className="h-3 w-3 mr-1" />
                  {options.format.toUpperCase()} Format
                </Badge>
                {options.includeComments && (
                  <Badge variant="outline">+ Comments</Badge>
                )}
                {options.includeAttachments && (
                  <Badge variant="outline">+ Attachments</Badge>
                )}
                {options.includeApprovalWorkflow && (
                  <Badge variant="outline">+ Workflow</Badge>
                )}
                {options.groupByTemplate && (
                  <Badge variant="outline">Grouped by Template</Badge>
                )}
                {options.groupByDepartment && (
                  <Badge variant="outline">Grouped by Department</Badge>
                )}
                <Badge variant="outline">
                  Sort: {options.sortBy} ({options.sortDirection})
                </Badge>
              </div>
            </div>
            
            {/* Start Export */}
            <div className="flex justify-center pt-4">
              <Button 
                onClick={onStartExport}
                disabled={isExporting || !previewData || previewData.totalRecords === 0}
                size="lg"
                className="px-8"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Export Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Processing Time</div>
                  <div className="text-muted-foreground">
                    Large exports may take several minutes. You'll be notified when complete.
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">File Download</div>
                  <div className="text-muted-foreground">
                    Your file will be automatically downloaded when the export completes.
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Browser Requirements</div>
                  <div className="text-muted-foreground">
                    Keep this page open during export. You can use other tabs while waiting.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card className={`border-2 ${
        progress.status === 'completed' ? 'border-green-200 bg-green-50 dark:bg-green-900/10' :
        progress.status === 'failed' ? 'border-red-200 bg-red-50 dark:bg-red-900/10' :
        progress.status === 'cancelled' ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/10' :
        'border-blue-200 bg-blue-50 dark:bg-blue-900/10'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="capitalize">{progress.status.replace('_', ' ')} Export</span>
            {progress.status === 'processing' && (
              <Badge variant="secondary">
                {progress.processedItems} / {progress.totalItems}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          {(progress.status === 'preparing' || progress.status === 'processing') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {progress.status === 'preparing' ? 'Preparing export...' : 
                   `Processing ${progress.processedItems} of ${progress.totalItems} reports`}
                </span>
                <span>Elapsed: {getElapsedTime()}</span>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {progress.status === 'completed' && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Export completed successfully! {progress.totalItems} reports exported in {getElapsedTime()}.
              </AlertDescription>
            </Alert>
          )}

          {progress.status === 'failed' && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20" variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {progress.errorMessage || 'Export failed due to an unexpected error. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {progress.status === 'cancelled' && (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
              <Square className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                Export was cancelled by user.
              </AlertDescription>
            </Alert>
          )}

          {/* Export Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Started</div>
              <div className="text-sm">{formatDate(progress.startedAt, 'HH:mm:ss')}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Records</div>
              <div className="text-sm">{progress.totalItems}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Duration</div>
              <div className="text-sm">{getElapsedTime()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="text-sm capitalize">{progress.status.replace('_', ' ')}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <div>
              {(progress.status === 'preparing' || progress.status === 'processing') && (
                <Button variant="outline" onClick={onCancel} size="sm">
                  Cancel Export
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {progress.status === 'completed' && (
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download {progress.fileName}
                </Button>
              )}
              
              {(progress.status === 'failed' || progress.status === 'cancelled') && (
                <Button onClick={onStartExport} className="gap-2">
                  <Play className="h-4 w-4" />
                  Retry Export
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Log */}
      {progress && ['processing', 'completed', 'failed', 'cancelled'].includes(progress.status) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Export Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex gap-2">
                <span className="text-muted-foreground">{formatDate(progress.startedAt, 'HH:mm:ss')}</span>
                <span>Export started</span>
              </div>
              
              {['processing', 'completed', 'failed', 'cancelled'].includes(progress.status) && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground">{formatDate(progress.startedAt, 'HH:mm:ss')}</span>
                  <span>Processing {progress.totalItems} reports</span>
                </div>
              )}
              
              {progress.status === 'processing' && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground">{formatDate(new Date(), 'HH:mm:ss')}</span>
                  <span>Progress: {progress.processedItems}/{progress.totalItems} ({progress.progress}%)</span>
                </div>
              )}
              
              {progress.completedAt && (
                <div className="flex gap-2 text-green-600">
                  <span className="text-muted-foreground">{formatDate(progress.completedAt, 'HH:mm:ss')}</span>
                  <span>Export completed successfully</span>
                </div>
              )}
              
              {progress.failedAt && (
                <div className="flex gap-2 text-red-600">
                  <span className="text-muted-foreground">{formatDate(progress.failedAt, 'HH:mm:ss')}</span>
                  <span>Export failed: {progress.errorMessage}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 