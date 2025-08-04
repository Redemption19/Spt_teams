'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Archive,
  RefreshCw,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { EnhancedReport, ReportTemplate, ReportStatus } from '@/lib/types';
import { ReportService } from '@/lib/report-service';
import { ReportTemplateService } from '@/lib/report-template-service';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { MemberAnalyticsTab } from './MemberAnalyticsTab';
import { RecentReportsTab } from './RecentReportsTab';

// Skeleton loading components
const StatsCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </CardContent>
  </Card>
);

const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
);

const ReportCardSkeleton = () => (
  <Card className="card-interactive">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-40" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </CardContent>
  </Card>
);

const MemberDashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Stats Cards Skeleton */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <StatsCardSkeleton key={index} />
      ))}
    </div>

    {/* Tabs Skeleton */}
    <Tabs defaultValue="analytics" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="recent" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Recent Reports
        </TabsTrigger>
      </TabsList>

      <TabsContent value="analytics" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </TabsContent>

      <TabsContent value="recent" className="space-y-4">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <ReportCardSkeleton key={index} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  </div>
);

// Cross-workspace props interface
interface CrossWorkspaceProps {
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
  setShowAllWorkspaces?: (show: boolean) => void;
}

// Member stats interface
interface MemberStats {
  totalReports: number;
  submittedReports: number;
  approvedReports: number;
  rejectedReports: number;
  pendingReports: number;
  draftReports: number;
  completionRate: number;
  averageApprovalTime: number;
  thisMonthSubmissions: number;
  lastMonthSubmissions: number;
  submissionTrend: 'increasing' | 'decreasing' | 'stable';
  recentActivity: {
    date: string;
    count: number;
  }[];
  topTemplates: {
    templateId: string;
    templateName: string;
    usageCount: number;
  }[];
  statusBreakdown: {
    status: ReportStatus;
    count: number;
    percentage: number;
  }[];
}

// Status badge component
const getStatusBadge = (status: string) => {
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

export function MemberReportsDashboard({ showAllWorkspaces, accessibleWorkspaces }: CrossWorkspaceProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();

  // State management
  const [stats, setStats] = useState<MemberStats>({
    totalReports: 0,
    submittedReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
    pendingReports: 0,
    draftReports: 0,
    completionRate: 0,
    averageApprovalTime: 0,
    thisMonthSubmissions: 0,
    lastMonthSubmissions: 0,
    submissionTrend: 'stable',
    recentActivity: [],
    topTemplates: [],
    statusBreakdown: []
  });
  const [reports, setReports] = useState<EnhancedReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load member dashboard data
  const loadDashboardData = useCallback(async () => {
    const workspaceId = currentWorkspace?.id || (userProfile?.isGuest ? 'guest-workspace' : undefined);
    console.log('🔄 MemberReportsDashboard loadData started', { 
      workspaceId, 
      userId: user?.uid,
      showAllWorkspaces,
      accessibleWorkspaces: accessibleWorkspaces?.length || 0
    });

    if (!workspaceId || !user?.uid) return;

    try {
      setLoading(true);

      // Load reports and templates
      const [reportsData, templatesData] = await Promise.all([
        ReportService.getUserReports(workspaceId, user.uid),
        ReportTemplateService.getWorkspaceTemplates(workspaceId, { status: 'active' })
      ]);

      setReports(reportsData);
      setTemplates(templatesData);

      // Calculate member stats
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subDays(now, 30));
      const lastMonthEnd = endOfMonth(subDays(now, 30));

      // Status counts
      const statusCounts = reportsData.reduce((acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalReports = reportsData.length;
      const submittedReports = statusCounts['submitted'] || 0;
      const approvedReports = statusCounts['approved'] || 0;
      const rejectedReports = statusCounts['rejected'] || 0;
      const pendingReports = (statusCounts['submitted'] || 0) + (statusCounts['under_review'] || 0);
      const draftReports = statusCounts['draft'] || 0;

      // Completion rate (approved / total submitted)
      const completionRate = submittedReports > 0 ? Math.round((approvedReports / submittedReports) * 100) : 0;

      // Monthly submissions
      const thisMonthSubmissions = reportsData.filter(report => {
        const submittedDate = new Date(report.submittedAt || report.createdAt);
        return submittedDate >= thisMonthStart && submittedDate <= thisMonthEnd;
      }).length;

      const lastMonthSubmissions = reportsData.filter(report => {
        const submittedDate = new Date(report.submittedAt || report.createdAt);
        return submittedDate >= lastMonthStart && submittedDate <= lastMonthEnd;
      }).length;

      // Submission trend
      let submissionTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (thisMonthSubmissions > lastMonthSubmissions) submissionTrend = 'increasing';
      else if (thisMonthSubmissions < lastMonthSubmissions) submissionTrend = 'decreasing';

      // Recent activity (last 7 days)
      const recentActivity = eachDayOfInterval({
        start: subDays(now, 6),
        end: now
      }).map(date => {
        const dayReports = reportsData.filter(report => {
          const reportDate = new Date(report.submittedAt || report.createdAt);
          return format(reportDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        });
        return {
          date: format(date, 'MMM dd'),
          count: dayReports.length
        };
      });

      // Top templates used
      const templateUsage = reportsData.reduce((acc, report) => {
        const templateId = report.templateId;
        if (templateId) {
          acc[templateId] = (acc[templateId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topTemplates = Object.entries(templateUsage)
        .map(([templateId, usageCount]) => {
          const template = templatesData.find(t => t.id === templateId);
          return {
            templateId,
            templateName: template?.name || 'Unknown Template',
            usageCount
          };
        })
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5);

      // Status breakdown
      const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
        status: status as ReportStatus,
        count,
        percentage: totalReports > 0 ? Math.round((count / totalReports) * 100) : 0
      }));

      // Average approval time (for approved reports)
      const approvedReportsWithDates = reportsData.filter(report => 
        report.status === 'approved' && report.submittedAt && report.approvalWorkflow?.finalizedAt
      );

      const averageApprovalTime = approvedReportsWithDates.length > 0 
        ? approvedReportsWithDates.reduce((total, report) => {
            const submittedDate = new Date(report.submittedAt!);
            const approvedDate = new Date(report.approvalWorkflow!.finalizedAt!);
            return total + (approvedDate.getTime() - submittedDate.getTime());
          }, 0) / approvedReportsWithDates.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      setStats({
        totalReports,
        submittedReports,
        approvedReports,
        rejectedReports,
        pendingReports,
        draftReports,
        completionRate,
        averageApprovalTime: Math.round(averageApprovalTime * 10) / 10,
        thisMonthSubmissions,
        lastMonthSubmissions,
        submissionTrend,
        recentActivity,
        topTemplates,
        statusBreakdown
      });

    } catch (error) {
      console.error('Error loading member dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, user?.uid, userProfile?.isGuest, showAllWorkspaces, accessibleWorkspaces, toast]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast({
      title: 'Success',
      description: 'Dashboard data refreshed successfully.',
    });
  }, [loadDashboardData, toast]);

  // Listen for refresh events from parent component
  useEffect(() => {
    const handleRefreshEvent = () => {
      handleRefresh();
    };

    window.addEventListener('refreshDashboard', handleRefreshEvent);
    return () => {
      window.removeEventListener('refreshDashboard', handleRefreshEvent);
    };
  }, [handleRefresh]);

  // Get recent reports (last 5)
  const recentReports = reports
    .sort((a, b) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime())
    .slice(0, 5);

  if (loading) {
    return <MemberDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              {stats.thisMonthSubmissions} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedReports} of {stats.submittedReports} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Approval Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageApprovalTime}</div>
            <p className="text-xs text-muted-foreground">
              days on average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recent">Recent Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Report Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.statusBreakdown.map((item) => {
                    const badgeProps = getStatusBadge(item.status);
                    return (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge {...badgeProps}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity (7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentActivity.map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{day.date}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((day.count / Math.max(...stats.recentActivity.map(d => d.count))) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{day.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <MemberAnalyticsTab stats={stats} />
        </TabsContent>

        {/* Recent Reports Tab */}
        <TabsContent value="recent" className="space-y-6">
          <RecentReportsTab reports={reports} templates={templates} />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {/* <Target className="h-5 w-5" /> */}
                Available Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => {
                  const usageCount = stats.topTemplates.find(t => t.templateId === template.id)?.usageCount || 0;
                  
                  return (
                    <div key={template.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant="outline">{usageCount} uses</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2">
                        {/* <Link href={`/dashboard/reports?view=submit-report&template=${template.id}`}> */}
                        <Button size="sm" className="flex-1">
                          {/* <Plus className="h-4 w-4 mr-1" /> */}
                          Use Template
                        </Button>
                        {/* </Link> */}
                        <Button variant="outline" size="sm">
                          {/* <Eye className="h-4 w-4" /> */}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {templates.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    {/* <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" /> */}
                    <p className="text-muted-foreground">No templates available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 