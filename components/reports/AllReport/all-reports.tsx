'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, Users, Building, AlertCircle, LayoutGrid, List, ArrowUpDown, MoreVertical, Eye, Calendar, FileText, Download, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions, useIsOwner } from '@/lib/rbac-hooks';
import { ReportTemplate, EnhancedReport, User } from '@/lib/types';
import { ReportTemplateService } from '@/lib/report-template-service';
import { ReportService } from '@/lib/report-service';
import { UserService } from '@/lib/user-service';
import { DepartmentService } from '@/lib/department-service';

import { ReportList } from '@/components/reports/AllReport/ReportList';
import { ReportReview } from '@/components/reports/AllReport/ReportReview';
import { FilterPanel } from '@/components/reports/AllReport/FilterPanel';
import { ConfirmationDialog } from '@/components/reports/AllReport/ConfirmationDialog';

export type StatusFilter = 'all' | 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'archived';
export type ViewMode = 'list' | 'review';
export type DisplayMode = 'grid' | 'table';

export interface FilterState {
  search: string;
  status: StatusFilter;
  department: string;
  template: string;
  submittedBy: string;
  dateFrom: string;
  dateTo: string;
}

// Cross-workspace props interface
interface CrossWorkspaceProps {
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
  setShowAllWorkspaces?: (show: boolean) => void;
}

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' };
    case 'submitted':
      return { variant: 'default' as const, className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' };
    case 'under_review':
      return { variant: 'default' as const, className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' };
    case 'approved':
      return { variant: 'default' as const, className: 'bg-green-100 text-green-700 hover:bg-green-100' };
    case 'rejected':
      return { variant: 'destructive' as const, className: '' };
    case 'archived':
      return { variant: 'outline' as const, className: 'text-muted-foreground' };
    default:
      return { variant: 'secondary' as const, className: '' };
  }
};

export default function AllReports({ showAllWorkspaces, accessibleWorkspaces }: CrossWorkspaceProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const permissions = useRolePermissions();
  const isOwner = useIsOwner();

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [reports, setReports] = useState<EnhancedReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<EnhancedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    department: 'all',
    template: 'all',
    submittedBy: 'all',
    dateFrom: '',
    dateTo: '',
  });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default' as 'default' | 'destructive' | 'warning',
    onConfirm: () => {},
  });

  // Check permissions
  const canViewAllReports = permissions.canViewReports || permissions.canManageReports;

  // Load all data with cross-workspace support
  const loadData = useCallback(async () => {
    console.log('🔄 AllReports loadData started', { 
      workspaceId: currentWorkspace?.id, 
      userId: user?.uid,
      showAllWorkspaces,
      accessibleWorkspaces: accessibleWorkspaces?.length || 0
    });

    if (!currentWorkspace?.id || !user?.uid || !canViewAllReports) return;

    try {
      setLoading(true);

      // Determine workspace IDs to load from
      const workspaceIds = (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) 
        ? accessibleWorkspaces.map(w => w.id)
        : [currentWorkspace.id];
      
      console.log('🏢 Loading reports from workspaces:', workspaceIds);

      // Load data from all relevant workspaces
      let allReports: EnhancedReport[] = [];
      let allTemplates: ReportTemplate[] = [];
      let allUsers: User[] = [];
      let allDepartments: any[] = [];
      
      for (const wsId of workspaceIds) {
        try {
          const [wsReports, wsTemplates, wsUsers, wsDepartments] = await Promise.all([
            // Get all reports in workspace (admin/owner can see all)
            ReportService.getWorkspaceReports?.(wsId, {
              orderBy: 'updatedAt',
              orderDirection: 'desc',
              limit: 100
            }) || [],
            // Get all templates
            ReportTemplateService.getWorkspaceTemplates?.(wsId, {
              status: 'active',
              orderBy: 'name',
              orderDirection: 'asc'
            }) || [],
            // Get all users in workspace
            UserService.getUsersByWorkspace(wsId),
            // Get departments
            DepartmentService.getWorkspaceDepartments(wsId)
          ]);

          // Aggregate reports (avoid duplicates)
          wsReports.forEach(report => {
            if (!allReports.some(r => r.id === report.id)) {
              allReports.push(report);
            }
          });

          // Aggregate templates (avoid duplicates)
          wsTemplates.forEach(template => {
            if (!allTemplates.some(t => t.id === template.id)) {
              allTemplates.push(template);
            }
          });

          // Aggregate users (avoid duplicates)
          wsUsers.forEach(user => {
            if (!allUsers.some(u => u.id === user.id)) {
              allUsers.push(user);
            }
          });

          // Aggregate departments (avoid duplicates)
          wsDepartments.forEach(dept => {
            if (!allDepartments.some(d => d.id === dept.id)) {
              allDepartments.push(dept);
            }
          });

        } catch (wsError) {
          console.error(`Error loading reports from workspace ${wsId}:`, wsError);
        }
      }

      // Sort reports by updated date (most recent first)
      allReports.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      setReports(allReports);
      setTemplates(allTemplates);
      setUsers(allUsers);
      setDepartments(allDepartments);

      console.log('✅ AllReports data loaded successfully', {
        reports: allReports.length,
        templates: allTemplates.length,
        users: allUsers.length,
        departments: allDepartments.length
      });

    } catch (error) {
      console.error('❌ Error loading reports data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, user?.uid, canViewAllReports, isOwner, showAllWorkspaces, accessibleWorkspaces, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter reports based on current filters
  const filteredReports = reports.filter(report => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const template = templates.find(t => t.id === report.templateId);
      const author = users.find(u => u.id === report.authorId);
      const matchesSearch =
        report.title?.toLowerCase().includes(searchLower) ||
        template?.name?.toLowerCase().includes(searchLower) ||
        author?.name?.toLowerCase().includes(searchLower) ||
        author?.firstName?.toLowerCase().includes(searchLower) ||
        author?.lastName?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status !== 'all' && report.status !== filters.status) {
      return false;
    }

    // Department filter
    if (filters.department !== 'all') {
      const author = users.find(u => u.id === report.authorId);
      if (author?.departmentId !== filters.department) {
        return false;
      }
    }

    // Template filter
    if (filters.template !== 'all' && report.templateId !== filters.template) {
      return false;
    }

    // Submitted by filter
    if (filters.submittedBy !== 'all' && report.authorId !== filters.submittedBy) {
      return false;
    }

    // Date range filter
    if (filters.dateFrom && report.submittedAt) {
      const fromDate = new Date(filters.dateFrom);
      if (report.submittedAt < fromDate) {
        return false;
      }
    }

    if (filters.dateTo && report.submittedAt) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      if (report.submittedAt > toDate) {
        return false;
      }
    }

    return true;
  });

  // Handle view report
  const handleViewReport = (report: EnhancedReport) => {
    setSelectedReport(report);
    setViewMode('review');
  };

  // Handle approve report
  const handleApproveReport = async (report: EnhancedReport) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Approve Report?',
      description: `Are you sure you want to approve "${report.title}"? This action will mark the report as approved.`,
      confirmText: 'Yes, Approve',
      cancelText: 'Cancel',
      variant: 'default',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          setActionLoading(report.id);
          
          await ReportService.updateReportStatus?.(
            report.workspaceId || currentWorkspace?.id || '',
            report.id,
            'approved',
            user?.uid || '',
            'Report approved by admin'
          );

          toast({
            title: 'Report Approved',
            description: 'The report has been approved successfully.',
            className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
          });

          loadData();
        } catch (error) {
          console.error('Error approving report:', error);
          toast({
            title: 'Error',
            description: 'Failed to approve report. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  // Handle reject report
  const handleRejectReport = async (report: EnhancedReport, reason: string) => {
    try {
      setActionLoading(report.id);
      
      await ReportService.updateReportStatus?.(
        report.workspaceId || currentWorkspace?.id || '',
        report.id,
        'rejected',
        user?.uid || '',
        reason
      );

      toast({
        title: 'Report Rejected',
        description: 'The report has been rejected and feedback sent to the author.',
        className: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
      });

      loadData();
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    setViewMode('list');
    setSelectedReport(null);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      department: 'all',
      template: 'all',
      submittedBy: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  // Check access permissions
  if (!canViewAllReports) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium">Access Restricted</h3>
          <p className="text-muted-foreground">
            You don&apos;t have permission to view all reports. Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredReports.length} filtered
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.status === 'submitted' || r.status === 'under_review').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully approved
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">
              Active templates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Show report review view */}
      {viewMode === 'review' && selectedReport ? (
        <>
          {(() => {
            const template = templates.find(t => t.id === selectedReport.templateId);
            const author = users.find(u => u.id === selectedReport.authorId);
            
            return (
              <ReportReview
                report={selectedReport}
                template={template || null}
                author={author || null}
                onBack={handleBack}
                onApprove={handleApproveReport}
                onReject={handleRejectReport}
                isLoading={actionLoading === selectedReport.id}
                canApprove={permissions.canManageReports}
              />
            );
          })()}
        </>
      ) : (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by report title or author name..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange({ search: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filters.status} onValueChange={(value) => handleFilterChange({ status: value as StatusFilter })}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.department} onValueChange={(value) => handleFilterChange({ department: value })}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.template} onValueChange={(value) => handleFilterChange({ template: value })}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Templates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Templates</SelectItem>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{filteredReports.length} results</span>
                  {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
                    <Badge variant="outline" className="text-xs">
                      🌐 Cross-workspace
                    </Badge>
                  )}
                </div>
                <Tabs value={displayMode} onValueChange={(value) => setDisplayMode(value as DisplayMode)}>
                  <TabsList className="grid w-full max-w-[180px] grid-cols-2">
                    <TabsTrigger value="grid" className="flex items-center gap-2 text-xs">
                      <LayoutGrid className="h-3 w-3" />
                      Grid
                    </TabsTrigger>
                    <TabsTrigger value="table" className="flex items-center gap-2 text-xs">
                      <List className="h-3 w-3" />
                      Table
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Content */}
              {displayMode === 'grid' ? (
                <ReportList
                  reports={filteredReports}
                  templates={templates}
                  users={users}
                  departments={departments}
                  onViewReport={handleViewReport}
                  loading={false}
                />
              ) : (
                /* Table View */
                <div className="space-y-4">
                  {filteredReports.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No reports found
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your filters to see more results.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block">
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="cursor-pointer hover:bg-muted/80">
                                  <div className="flex items-center space-x-1">
                                    <span>Report</span>
                                    <ArrowUpDown className="h-3 w-3" />
                                  </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/80">
                                  <div className="flex items-center space-x-1">
                                    <span>Template</span>
                                    <ArrowUpDown className="h-3 w-3" />
                                  </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/80">
                                  <div className="flex items-center space-x-1">
                                    <span>Author</span>
                                    <ArrowUpDown className="h-3 w-3" />
                                  </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/80">
                                  <div className="flex items-center space-x-1">
                                    <span>Status</span>
                                    <ArrowUpDown className="h-3 w-3" />
                                  </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/80">
                                  <div className="flex items-center space-x-1">
                                    <span>Submitted</span>
                                    <ArrowUpDown className="h-3 w-3" />
                                  </div>
                                </TableHead>
                                <TableHead>Files</TableHead>
                                <TableHead className="w-16">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredReports.map((report) => {
                                const template = templates.find(t => t.id === report.templateId);
                                const author = users.find(u => u.id === report.authorId);
                                const department = departments.find(d => d.id === author?.departmentId);
                                const statusBadge = getStatusBadge(report.status);

                                return (
                                  <TableRow key={report.id} className="hover:bg-muted/50">
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div
                                          className="font-medium cursor-pointer hover:text-primary line-clamp-1 text-sm"
                                          onClick={() => handleViewReport(report)}
                                        >
                                          {report.title}
                                        </div>
                                        {template?.category && (
                                          <div className="text-xs text-muted-foreground line-clamp-1">
                                            Category: {template.category}
                                          </div>
                                        )}
                                        <div className="text-xs text-muted-foreground">
                                          Created: {report.createdAt.toLocaleDateString()}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div className="text-sm font-medium">{template?.name || 'Unknown'}</div>
                                        {department && (
                                          <div className="text-xs text-muted-foreground">{department.name}</div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback className="text-xs">
                                            {(author?.name || author?.firstName || author?.email || 'U').charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                          <div className="text-sm">
                                            {author?.name || `${author?.firstName} ${author?.lastName}` || author?.email || 'Unknown'}
                                          </div>
                                          {author?.jobTitle && (
                                            <div className="text-xs text-muted-foreground">{author.jobTitle}</div>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge {...statusBadge} className="text-xs">
                                        {report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {report.submittedAt ? (
                                        <div className="text-sm text-muted-foreground">
                                          {report.submittedAt.toLocaleDateString()}
                                        </div>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">Not submitted</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <FileText className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm">
                                          {report.attachments?.length || 0}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <MoreVertical className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleViewReport(report)}>
                                            <Eye className="h-3 w-3 mr-2" />
                                            View Report
                                          </DropdownMenuItem>
                                          {report.attachments && report.attachments.length > 0 && (
                                            <DropdownMenuItem>
                                              <Download className="h-3 w-3 mr-2" />
                                              Download Files
                                            </DropdownMenuItem>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-4">
                        {filteredReports.map((report) => {
                          const template = templates.find(t => t.id === report.templateId);
                          const author = users.find(u => u.id === report.authorId);
                          const department = departments.find(d => d.id === author?.departmentId);
                          const statusBadge = getStatusBadge(report.status);

                          return (
                            <Card key={report.id} className="hover:shadow-sm transition-shadow">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  {/* Header */}
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <h4
                                        className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-primary"
                                        onClick={() => handleViewReport(report)}
                                      >
                                        {report.title}
                                      </h4>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {template?.name || 'Unknown Template'}
                                      </p>
                                    </div>
                                    <Badge {...statusBadge} className="text-xs ml-2 flex-shrink-0">
                                      {report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Badge>
                                  </div>

                                  {/* Author Info */}
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {(author?.name || author?.firstName || author?.email || 'U').charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm">
                                        {author?.name || `${author?.firstName} ${author?.lastName}` || author?.email || 'Unknown'}
                                      </div>
                                      {department && (
                                        <div className="text-xs text-muted-foreground">{department.name}</div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Footer */}
                                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>
                                          {report.submittedAt ? report.submittedAt.toLocaleDateString() : report.createdAt.toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        <span>{report.attachments?.length || 0} files</span>
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => handleViewReport(report)}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Confirmation Dialog - Always render so it works in both views */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, isOpen: open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}