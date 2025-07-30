'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useIsOwner } from '@/lib/rbac-hooks';
import { ReportService } from '@/lib/report-service';
import { UserService } from '@/lib/user-service';
import { DepartmentService } from '@/lib/department-service';
import { ReportTemplateService } from '@/lib/report-template-service';
import { 
  DashboardFilters, 
  DashboardData, 
  DashboardSummaryData,
  ReportsOverTimeData,
  StatusBreakdownData,
  DepartmentReportsData,
  TopTemplatesData,
  SubmissionsByDayData,
  ApprovalTrendData,
  UserSubmissionData,
  EnhancedReport 
} from '@/lib/types';

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardData(
  filters: DashboardFilters, 
  showAllWorkspaces?: boolean, 
  accessibleWorkspaces?: any[]
): UseDashboardDataReturn {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const isOwner = useIsOwner();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processReportsData = useCallback(async (
    reports: EnhancedReport[], 
    allDepartments: any[], 
    allUsers: any[], 
    allTemplates: any[]
  ): Promise<DashboardData> => {
    const now = new Date();
    const { from, to } = filters.dateRange;
    
    // Filter reports by date range and department
    let filteredReports = reports.filter(report => {
      const createdAt = new Date(report.createdAt);
      const dateInRange = createdAt >= from && createdAt <= to;
      
      // Apply department filter if specified
      if (filters.department !== 'all') {
        const reportAuthor = allUsers.find(u => u.id === report.authorId);
        const authorDepartment = reportAuthor?.department;
        const selectedDepartment = allDepartments.find(d => d.id === filters.department)?.name;
        
        if (authorDepartment !== selectedDepartment) {
          return false;
        }
      }
      
      return dateInRange;
    });

    // Summary Data
    const totalReports = filteredReports.length;
    const approvedReports = filteredReports.filter(r => r.status === 'approved').length;
    const rejectedReports = filteredReports.filter(r => r.status === 'rejected').length;
    const pendingReports = filteredReports.filter(r => r.status === 'submitted' || r.status === 'under_review').length;
    const draftReports = filteredReports.filter(r => r.status === 'draft').length;

    // Monthly submissions (last 30 days) - use filtered reports
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthlySubmissions = filteredReports.filter(r => 
      new Date(r.createdAt) >= thirtyDaysAgo && r.status !== 'draft'
    ).length;

    // Average approval time calculation
    const approvedWithTiming = filteredReports.filter(r => 
      r.status === 'approved' && r.submittedAt && r.approvalWorkflow?.finalizedAt
    );
    const avgApprovalTime = approvedWithTiming.length > 0 
      ? approvedWithTiming.reduce((sum, r) => {
          const submitted = new Date(r.submittedAt!);
          const approved = new Date(r.approvalWorkflow!.finalizedAt!);
          return sum + (approved.getTime() - submitted.getTime()) / (1000 * 60 * 60); // hours
        }, 0) / approvedWithTiming.length 
      : 0;

    // Department reports data (use aggregated departments from all workspaces)
    const departmentReports: DepartmentReportsData[] = allDepartments.map(dept => {
      const deptUsers = allUsers.filter(u => u.department === dept.name);
      const deptReports = reports.filter(r => 
        deptUsers.some(u => u.id === r.authorId) &&
        new Date(r.createdAt) >= from && new Date(r.createdAt) <= to
      );
      const deptApproved = deptReports.filter(r => r.status === 'approved').length;
      const deptPending = deptReports.filter(r => r.status === 'submitted' || r.status === 'under_review').length;
      const deptRejected = deptReports.filter(r => r.status === 'rejected').length;
      
      return {
        department: dept.name,
        total: deptReports.length,
        approved: deptApproved,
        pending: deptPending,
        rejected: deptRejected,
        approvalRate: deptReports.length > 0 ? (deptApproved / deptReports.length) * 100 : 0
      };
    });

    const topPerformingDepartment = departmentReports.reduce((prev, current) => 
      (prev.approvalRate > current.approvalRate) ? prev : current, 
      departmentReports[0] || { department: 'N/A', approvalRate: 0 }
    ).department;

    const summary: DashboardSummaryData = {
      totalReports,
      approvedReports,
      rejectedReports,
      pendingReports,
      draftReports,
      monthlySubmissions,
      avgApprovalTime,
      topPerformingDepartment
    };

    // Reports over time (daily for the selected range)
    const reportsOverTime: ReportsOverTimeData[] = [];
    const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayReports = filteredReports.filter(r => 
        new Date(r.createdAt).toISOString().split('T')[0] === dateStr
      );
      
      reportsOverTime.push({
        date: dateStr,
        submitted: dayReports.filter(r => r.status === 'submitted' || r.status === 'under_review').length,
        approved: dayReports.filter(r => r.status === 'approved').length,
        rejected: dayReports.filter(r => r.status === 'rejected').length,
        drafts: dayReports.filter(r => r.status === 'draft').length
      });
    }

    // Status breakdown
    const statusBreakdown: StatusBreakdownData[] = [
      { name: 'Approved', value: approvedReports, percentage: totalReports > 0 ? (approvedReports / totalReports) * 100 : 0, color: 'hsl(var(--chart-1))' },
      { name: 'Pending', value: pendingReports, percentage: totalReports > 0 ? (pendingReports / totalReports) * 100 : 0, color: 'hsl(var(--chart-2))' },
      { name: 'Rejected', value: rejectedReports, percentage: totalReports > 0 ? (rejectedReports / totalReports) * 100 : 0, color: 'hsl(var(--chart-3))' },
      { name: 'Draft', value: draftReports, percentage: totalReports > 0 ? (draftReports / totalReports) * 100 : 0, color: 'hsl(var(--chart-4))' }
    ].filter(item => item.value > 0);

    // Top templates (use aggregated templates from all workspaces)
    const templateUsage = new Map<string, number>();
    filteredReports.forEach(report => {
      if (report.templateId) {
        templateUsage.set(report.templateId, (templateUsage.get(report.templateId) || 0) + 1);
      }
    });

    const topTemplates: TopTemplatesData[] = Array.from(templateUsage.entries())
      .map(([templateId, count]) => {
        const template = allTemplates.find(t => t.id === templateId);
        const templateReports = filteredReports.filter(r => r.templateId === templateId);
        const lastUsedReport = templateReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        
        return {
          templateId,
          templateName: template?.name || 'Unknown Template',
          usageCount: count,
          category: template?.category || 'Uncategorized',
          department: template?.department || 'General',
          lastUsed: lastUsedReport ? new Date(lastUsedReport.createdAt) : new Date()
        };
      })
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    // Submissions by day (heatmap data)
    const submissionsByDay: SubmissionsByDayData[] = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ].map(day => {
      const daySubmissions = filteredReports.filter(r => {
        const dayOfWeek = new Date(r.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
        return dayOfWeek === day && r.status !== 'draft';
      }).length;
      
      const maxSubmissions = Math.max(1, ...['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => 
        filteredReports.filter(r => {
          const dayOfWeek = new Date(r.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
          return dayOfWeek === d && r.status !== 'draft';
        }).length
      ));
      
      return {
        day,
        submissions: daySubmissions,
        intensity: daySubmissions / maxSubmissions
      };
    });

    // Monthly approval trend (last 6 months)
    const approvalTrend: ApprovalTrendData[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthReports = reports.filter(r => {
        const createdAt = new Date(r.createdAt);
        return createdAt >= monthDate && createdAt < nextMonth;
      });
      
      const monthApproved = monthReports.filter(r => r.status === 'approved').length;
      const monthRejected = monthReports.filter(r => r.status === 'rejected').length;
      const monthSubmitted = monthReports.filter(r => r.status !== 'draft').length;
      
      // Calculate average processing time for this month
      const monthApprovedWithTiming = monthReports.filter(r => 
        r.status === 'approved' && r.submittedAt && r.approvalWorkflow?.finalizedAt
      );
      const avgProcessingTime = monthApprovedWithTiming.length > 0 
        ? monthApprovedWithTiming.reduce((sum, r) => {
            const submitted = new Date(r.submittedAt!);
            const approved = new Date(r.approvalWorkflow!.finalizedAt!);
            return sum + (approved.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24); // days
          }, 0) / monthApprovedWithTiming.length 
        : 0;
      
      approvalTrend.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalSubmissions: monthSubmitted,
        approvedCount: monthApproved,
        rejectedCount: monthRejected,
        approvalRate: monthSubmitted > 0 ? (monthApproved / monthSubmitted) * 100 : 0,
        avgProcessingTime
      });
    }

    // User submissions (top 10 users from aggregated data)
    const userSubmissionMap = new Map<string, {
      total: number;
      approved: number;
      rejected: number;
      timeSpent: number[];
    }>();

    filteredReports.forEach(report => {
      const existing = userSubmissionMap.get(report.authorId) || {
        total: 0,
        approved: 0,
        rejected: 0,
        timeSpent: []
      };
      
      existing.total++;
      if (report.status === 'approved') existing.approved++;
      if (report.status === 'rejected') existing.rejected++;
      
      // Estimate time spent based on submission metadata
      if (report.submissionMetadata?.timeSpent) {
        existing.timeSpent.push(report.submissionMetadata.timeSpent);
      }
      
      userSubmissionMap.set(report.authorId, existing);
    });

    const userSubmissions: UserSubmissionData[] = Array.from(userSubmissionMap.entries())
      .map(([userId, stats]) => {
        const userData = allUsers.find(u => u.id === userId);
        const avgSubmissionTime = stats.timeSpent.length > 0 
          ? stats.timeSpent.reduce((sum, time) => sum + time, 0) / stats.timeSpent.length 
          : 0;
        
        return {
          userId,
          userName: userData?.name || userData?.email || 'Unknown User',
          department: userData?.department || 'Unassigned',
          totalSubmissions: stats.total,
          approvedSubmissions: stats.approved,
          rejectedSubmissions: stats.rejected,
          approvalRate: stats.total > 0 ? (stats.approved / stats.total) * 100 : 0,
          avgSubmissionTime
        };
      })
      .sort((a, b) => b.totalSubmissions - a.totalSubmissions)
      .slice(0, 10);

    return {
      summary,
      reportsOverTime,
      statusBreakdown,
      departmentReports,
      topTemplates,
      submissionsByDay,
      approvalTrend,
      userSubmissions,
      lastUpdated: new Date()
    };
  }, [filters]);

  // Memoize workspaceIds to prevent infinite loop
  const workspaceIds = useMemo(() => (
    isOwner && showAllWorkspaces && accessibleWorkspaces?.length
      ? accessibleWorkspaces.map(w => w.id)
      : currentWorkspace?.id ? [currentWorkspace.id] : []
  ), [isOwner, showAllWorkspaces, accessibleWorkspaces, currentWorkspace?.id]);

  const fetchData = useCallback(async () => {
    console.log('🔄 Dashboard fetchData started', { 
      workspaceId: currentWorkspace?.id, 
      userId: user?.uid,
      showAllWorkspaces,
      accessibleWorkspaces: accessibleWorkspaces?.length || 0
    });

    if (!currentWorkspace?.id || !user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      // Use the fixed workspaceIds array
      console.log('🏢 Loading dashboard data from workspaces:', workspaceIds);

      // Load data from all relevant workspaces
      let allReports: EnhancedReport[] = [];
      let allDepartments: any[] = [];
      let allUsers: any[] = [];
      let allTemplates: any[] = [];
      
      for (const wsId of workspaceIds) {
        try {
          const [wsReports, wsDepartments, wsUsers, wsTemplates] = await Promise.all([
            ReportService.getWorkspaceReports(wsId, {
              status: filters.status === 'all' ? undefined : filters.status as any,
              templateId: filters.template === 'all' ? undefined : filters.template,
              authorId: filters.user === 'all' ? undefined : filters.user,
              startDate: filters.dateRange.from,
              endDate: filters.dateRange.to
            }),
            DepartmentService.getWorkspaceDepartments(wsId),
            UserService.getUsersByWorkspace(wsId),
            ReportTemplateService.getWorkspaceTemplates(wsId)
          ]);

          // Aggregate reports (avoid duplicates)
          wsReports.forEach(report => {
            if (!allReports.some(r => r.id === report.id)) {
              allReports.push(report);
            }
          });

          // Aggregate departments (avoid duplicates)
          wsDepartments.forEach(dept => {
            if (!allDepartments.some(d => d.id === dept.id)) {
              allDepartments.push(dept);
            }
          });

          // Aggregate users (avoid duplicates)
          wsUsers.forEach(user => {
            if (!allUsers.some(u => u.id === user.id)) {
              allUsers.push(user);
            }
          });

          // Aggregate templates (avoid duplicates)
          wsTemplates.forEach(template => {
            if (!allTemplates.some(t => t.id === template.id)) {
              allTemplates.push(template);
            }
          });

        } catch (wsError) {
          console.error(`Error loading dashboard data from workspace ${wsId}:`, wsError);
        }
      }

      console.log('✅ Dashboard data aggregated successfully', {
        reports: allReports.length,
        departments: allDepartments.length,
        users: allUsers.length,
        templates: allTemplates.length
      });

      const dashboardData = await processReportsData(allReports, allDepartments, allUsers, allTemplates);
      setData(dashboardData);
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, user?.uid, filters, processReportsData, showAllWorkspaces, accessibleWorkspaces, workspaceIds]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}