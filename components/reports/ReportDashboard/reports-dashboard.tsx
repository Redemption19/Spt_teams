'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions, useIsOwner } from '@/lib/rbac-hooks';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Import dashboard components
import { DashboardFilters } from './DashboardFilters';
import { SummaryCards } from './SummaryCards';
import { ReportsOverTimeChart } from './ReportsOverTimeChart';
import { StatusBreakdownChart } from './StatusBreakdownChart';
import { DepartmentReportsChart } from './DepartmentReportsChart';
import { TopTemplatesChart } from './TopTemplatesChart';
import { SubmissionsByDayChart } from './SubmissionsByDayChart';
import { MonthlyApprovalTrendChart } from './MonthlyApprovalTrendChart';
import { UserSubmissionChart } from './UserSubmissionChart';

// Import data hook and types
import { useDashboardData } from './useDashboardData';
import { DashboardFilters as DashboardFiltersType } from '@/lib/types';

// Cross-workspace props interface
interface CrossWorkspaceProps {
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
  setShowAllWorkspaces?: (show: boolean) => void;
}

export function ReportsDashboard({ showAllWorkspaces, accessibleWorkspaces }: CrossWorkspaceProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const permissions = useRolePermissions();
  const isOwner = useIsOwner();

  // Filter state
  const [filters, setFilters] = useState<DashboardFiltersType>({
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      to: new Date(),
      preset: 'month',
    },
    department: 'all',
    status: 'all',
    template: 'all',
    user: 'all',
  });

  // Load dashboard data based on filters with cross-workspace support
  const { data, loading, error, refetch } = useDashboardData(filters, showAllWorkspaces, accessibleWorkspaces);

  // Check permissions - only admin and owner can view dashboard
  const canViewDashboard = permissions.canManageReports || permissions.canViewReports;

  if (!canViewDashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You don&apos;t have permission to view the reports dashboard. Only administrators and owners can access this page.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cross-workspace indicator header */}
      {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <Badge variant="outline" className="text-sm">
              🌐 Analytics across {accessibleWorkspaces.length} workspaces
            </Badge>
          </div>
        </div>
      )}

      {/* Global Filters */}
      <DashboardFilters
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={refetch}
        loading={loading}
        showAllWorkspaces={showAllWorkspaces}
        accessibleWorkspaces={accessibleWorkspaces}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">
              Loading dashboard data
              {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 
                ? ` from ${accessibleWorkspaces.length} workspaces` 
                : ''
              }...
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards - Mobile optimized with cross-workspace context */}
          <SummaryCards 
            data={data?.summary} 
            showAllWorkspaces={showAllWorkspaces}
            workspaceCount={accessibleWorkspaces?.length}
          />

          {/* Charts Grid - Mixed layout */}
          <div className="grid gap-4 sm:gap-6">
            {/* Full width time-based charts */}
            <ReportsOverTimeChart 
              data={data?.reportsOverTime || []} 
              showAllWorkspaces={showAllWorkspaces}
              workspaceCount={accessibleWorkspaces?.length}
            />
            <MonthlyApprovalTrendChart 
              data={data?.approvalTrend || []} 
              showAllWorkspaces={showAllWorkspaces}
              workspaceCount={accessibleWorkspaces?.length}
            />
            
            {/* Full width submissions by day chart */}
            <SubmissionsByDayChart 
              data={data?.submissionsByDay || []} 
              showAllWorkspaces={showAllWorkspaces}
              workspaceCount={accessibleWorkspaces?.length}
            />

            {/* Row: Status and Department breakdown - 2-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <StatusBreakdownChart 
                data={data?.statusBreakdown || []} 
                showAllWorkspaces={showAllWorkspaces}
                workspaceCount={accessibleWorkspaces?.length}
              />
              <DepartmentReportsChart 
                data={data?.departmentReports || []} 
                showAllWorkspaces={showAllWorkspaces}
                workspaceCount={accessibleWorkspaces?.length}
              />
            </div>

            {/* Row: Templates and User activity - 2-column layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <TopTemplatesChart 
                data={data?.topTemplates || []} 
                showAllWorkspaces={showAllWorkspaces}
                workspaceCount={accessibleWorkspaces?.length}
              />
              <UserSubmissionChart 
                data={data?.userSubmissions || []} 
                showAllWorkspaces={showAllWorkspaces}
                workspaceCount={accessibleWorkspaces?.length}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}