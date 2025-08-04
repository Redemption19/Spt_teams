'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  File,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useRolePermissions } from '@/lib/rbac-hooks';
import { ReportService } from '@/lib/report-service';
import { DepartmentService } from '@/lib/department-service';
import { UserService } from '@/lib/user-service';
import { ReportExportService } from '@/lib/report-export-service';

// Import modular components
import { ExportFilters } from './ExportFilters';
import { ExportOptions } from './ExportOptions';
import { ExportProgress } from './ExportProgress';

// Skeleton loading components
const FilterCardSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </CardContent>
  </Card>
);

const PreviewCardSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-40" />
      </div>
    </CardContent>
  </Card>
);

const OptionsCardSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-40" />
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ExportReportsSkeleton = () => (
  <div className="space-y-6">
    {/* Tabs Skeleton */}
    <Tabs defaultValue="filters" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="filters" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </TabsTrigger>
        <TabsTrigger value="options" className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Options
        </TabsTrigger>
        <TabsTrigger value="progress" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </TabsTrigger>
      </TabsList>

      <TabsContent value="filters" className="space-y-6">
        <FilterCardSkeleton />
        <PreviewCardSkeleton />
      </TabsContent>

      <TabsContent value="options" className="space-y-6">
        <OptionsCardSkeleton />
        <div className="flex justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </TabsContent>

      <TabsContent value="progress" className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
);

// Types (inline for now)
interface ReportExportFilters {
  status: 'all' | 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'archived';
  department: string;
  template: string;
  user: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
    preset: 'week' | 'month' | 'quarter' | 'year' | 'custom' | null;
  };
  search: string;
  includeComments: boolean;
  includeAttachments: boolean;
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

// Cross-workspace props interface
interface CrossWorkspaceProps {
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
  setShowAllWorkspaces?: (show: boolean) => void;
}

export function ExportReports({ showAllWorkspaces, accessibleWorkspaces }: CrossWorkspaceProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const permissions = useRolePermissions();
  
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('filters');
  
  // Data state
  const [reports, setReports] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Filter and options state
  const [filters, setFilters] = useState<ReportExportFilters>({
    status: 'all',
    department: 'all',
    template: 'all',
    user: 'all',
    dateRange: {
      from: null,
      to: null,
      preset: 'month'
    },
    search: '',
    includeComments: false,
    includeAttachments: false
  });
  
  const [options, setOptions] = useState<ReportExportOptions>({
    format: 'excel',
    includeComments: false,
    includeAttachments: false,
    includeFieldLabels: true,
    includeTemplateInfo: true,
    includeApprovalWorkflow: true,
    groupByTemplate: false,
    groupByDepartment: false,
    sortBy: 'submittedAt',
    sortDirection: 'desc',
    customFields: []
  });
  
  const [exportProgress, setExportProgress] = useState<ExportProgressState | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  // Check permissions
  const canExport = permissions.canViewReports;

  // Handler functions for component props
  const handleFiltersChange = (newFilters: Partial<ReportExportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleOptionsChange = (newOptions: Partial<ReportExportOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  };

  // Load initial data
  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id || !canExport) return;
    
    try {
      setLoading(true);
      
      const [templatesData, departmentsData, usersData] = await Promise.all([
        // Get templates (placeholder - replace with actual service call)
        Promise.resolve([]),
        DepartmentService.getWorkspaceDepartments(currentWorkspace.id),
        UserService.getUsersByWorkspace(currentWorkspace.id)
      ]);
      
      setTemplates(templatesData);
      setDepartments(departmentsData);
      setUsers(usersData);
      
    } catch (error) {
      console.error('Error loading export data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, canExport, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Generate export preview
  const generatePreview = async () => {
    if (!currentWorkspace?.id) return;
    
    try {
      setLoading(true);
      
      // Get filtered reports based on current filters
      const filterOptions: any = {};
      
      if (filters.status !== 'all') {
        filterOptions.status = filters.status;
      }
      
      if (filters.user !== 'all') {
        filterOptions.authorId = filters.user;
      }
      
      if (filters.dateRange.from) {
        filterOptions.startDate = filters.dateRange.from;
      }
      
      if (filters.dateRange.to) {
        filterOptions.endDate = filters.dateRange.to;
      }
      
      let filteredReports = await ReportService.getWorkspaceReports(
        currentWorkspace.id,
        {
          ...filterOptions,
          limit: 1000,
          orderBy: 'submittedAt',
          orderDirection: 'desc'
        }
      );
      
      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredReports = filteredReports.filter(report => 
          report.title.toLowerCase().includes(searchLower)
        );
      }
      
      // Generate preview data
      const preview = {
        totalRecords: filteredReports.length,
        estimatedFileSize: `${Math.ceil(filteredReports.length * 0.5)}KB`,
        estimatedProcessingTime: `${Math.max(1, Math.ceil(filteredReports.length / 100))} seconds`,
        sampleData: filteredReports.slice(0, 3).map(report => ({
          title: report.title,
          status: report.status,
          submittedAt: report.submittedAt,
          author: users.find(u => u.id === report.authorId)?.name || 'Unknown'
        })),
        warnings: filteredReports.length > 500 ? ['Large export - may take several minutes'] : []
      };
      
      setReports(filteredReports);
      setPreviewData(preview);
      
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate export preview.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    if (!currentWorkspace?.id || !reports.length) return;
    
    try {
      setExporting(true);
      setActiveTab('progress');
      
      // Use the actual ReportExportService to export reports
      await ReportExportService.exportReports(
        currentWorkspace.id,
        filters,
        options,
        users,
        templates,
        departments,
        (progress) => {
          setExportProgress(progress);
        }
      );
      
      toast({
        title: 'Export Complete',
        description: `Successfully exported ${reports.length} reports to ${options.format === 'excel' ? 'XLSX' : options.format.toUpperCase()}`,
      });
      
    } catch (error) {
      console.error('Error exporting reports:', error);
      setExportProgress(prev => prev ? {
        ...prev,
        status: 'failed',
        failedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Export failed. Please try again.'
      } : null);
      
      toast({
        title: 'Export Failed',
        description: 'Failed to export reports. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  // Check permissions
  if (!canExport) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Shield className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Access Restricted</h3>
                <p className="text-sm text-muted-foreground">
                  You need admin or owner permissions to export reports.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show skeleton loading while data is being loaded
  if (loading && !templates.length && !departments.length && !users.length) {
    return <ExportReportsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Export Process Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="filters" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Filter & Preview
          </TabsTrigger>
          <TabsTrigger value="options" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export Options
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export & Download
          </TabsTrigger>
        </TabsList>

        {/* Step 1: Filters & Preview */}
        <TabsContent value="filters" className="space-y-6">
          <ExportFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            templates={templates}
            departments={departments}
            users={users}
            loading={loading}
          />
          
          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Export Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Button 
                  onClick={generatePreview}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Generating...' : 'Generate Preview'}
                </Button>
                
                {previewData && (
                  <div className="text-sm text-muted-foreground">
                    {previewData.totalRecords} reports found
                  </div>
                )}
              </div>
              
              {previewData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Total Records</div>
                      <div className="text-2xl font-bold">{previewData.totalRecords}</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Est. File Size</div>
                      <div className="text-2xl font-bold">{previewData.estimatedFileSize}</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Est. Time</div>
                      <div className="text-2xl font-bold">{previewData.estimatedProcessingTime}</div>
                    </div>
                  </div>
                  
                  {previewData.warnings.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {previewData.warnings.join('. ')}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => setActiveTab('options')}
                      disabled={previewData.totalRecords === 0}
                    >
                      Configure Export Options
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Export Options */}
        <TabsContent value="options" className="space-y-6">
          <ExportOptions
            options={options}
            onOptionsChange={handleOptionsChange}
            previewData={previewData}
          />
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab('filters')}>
              Back to Filters
            </Button>
            <Button 
              onClick={() => setActiveTab('progress')}
              disabled={!previewData || previewData.totalRecords === 0}
            >
              Start Export
            </Button>
          </div>
        </TabsContent>

        {/* Step 3: Export Progress */}
        <TabsContent value="progress" className="space-y-6">
          <ExportProgress
            progress={exportProgress}
            onStartExport={handleExport}
            onCancel={() => setExportProgress(null)}
            isExporting={exporting}
            previewData={previewData}
            options={options}
          />
          
          {!exportProgress && (
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('options')}>
                Back to Options
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 