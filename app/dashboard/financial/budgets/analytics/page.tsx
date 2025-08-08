'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingDown, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { BudgetTrackingService } from '@/lib/budget-tracking-service';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { DepartmentService } from '@/lib/department-service';

export default function BudgetAnalyticsPage() {
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  const { userProfile } = useAuth();
  // Cross-workspace toggle (persisted like in main page)
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('budgets-showAllWorkspaces') === 'true';
    }
    return false;
  });
  const isOwner = userProfile?.role === 'owner';
  // Pass workspace IDs for analytics
  const workspaceIds = isOwner && showAllWorkspaces && accessibleWorkspaces.length > 0
    ? accessibleWorkspaces.map(ws => ws.id)
    : currentWorkspace?.id
      ? [currentWorkspace.id]
      : [];
  return <BudgetAnalyticsTab workspaceIds={workspaceIds} />;
}

function BudgetAnalyticsTab({ workspaceIds }: { workspaceIds: string[] }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departmentMap, setDepartmentMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchAnalytics() {
      if (!workspaceIds || workspaceIds.length === 0) return;
      setLoading(true);
      setError(null);
      try {
        const data = await BudgetTrackingService.getBudgetAnalyticsForWorkspaces(workspaceIds);
        setAnalytics(data);
        // Fetch all departments for all workspaces
        let allDepartments: any[] = [];
        for (const wsId of workspaceIds) {
          const depts = await DepartmentService.getWorkspaceDepartments(wsId);
          allDepartments.push(...depts);
        }
        const deptMap: Record<string, string> = {};
        allDepartments.forEach(d => { deptMap[d.id] = d.name; });
        setDepartmentMap(deptMap);
      } catch (err) {
        setError('Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [workspaceIds]);

  if (!workspaceIds || workspaceIds.length === 0) {
    return <div className="text-center py-6 px-4 sm:py-8 text-muted-foreground">No workspace selected.</div>;
  }
  if (loading) {
    return <div className="text-center py-6 px-4 sm:py-8 text-muted-foreground">Loading analytics...</div>;
  }
  if (error) {
    return <div className="text-center py-6 px-4 sm:py-8 text-red-500">{error}</div>;
  }
  if (!analytics) {
    return <div className="text-center py-6 px-4 sm:py-8 text-muted-foreground">No analytics data available.</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-xl font-bold">₵{analytics.totalBudget?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Allocated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-xl font-bold text-red-600">₵{analytics.totalSpent?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{analytics.utilizationPercentage}% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Remaining</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-xl font-bold text-green-600">₵{analytics.totalRemaining?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available to spend</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Utilization</CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-xl font-bold text-blue-600">{analytics.utilizationPercentage}%</div>
            <p className="text-xs text-muted-foreground">of total budget</p>
          </CardContent>
        </Card>
      </div>
      {/* Department Breakdown */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Department Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {analytics.departmentBreakdown && analytics.departmentBreakdown.length > 0 ? (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Department</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Budget</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Spent</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Remaining</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Utilization</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {analytics.departmentBreakdown.map((dept: any) => {
                    const utilization = dept.budget > 0 ? Math.round((dept.spent / dept.budget) * 100) : 0;
                    return (
                      <tr key={dept.department}>
                        <td className="px-2 sm:px-4 py-2 font-medium text-xs sm:text-sm">{departmentMap[dept.department] || dept.department}</td>
                        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm">₵{dept.budget?.toLocaleString()}</td>
                        <td className="px-2 sm:px-4 py-2 text-red-600 text-xs sm:text-sm">₵{dept.spent?.toLocaleString()}</td>
                        <td className="px-2 sm:px-4 py-2 text-green-600 text-xs sm:text-sm">₵{dept.remaining?.toLocaleString()}</td>
                        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm">{utilization}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No department breakdown available.</div>
          )}
        </CardContent>
      </Card>
      {/* Alerts & Projected Overruns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Triggered Alerts</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {analytics.alerts && analytics.alerts.length > 0 ? (
              <ul className="space-y-2 sm:space-y-3">
                {analytics.alerts.map((alert: any, idx: number) => (
                  <li key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 sm:p-3 rounded border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{alert.message}</span>
                    </div>
                    <span className="text-xs text-muted-foreground sm:ml-auto">Threshold: {alert.threshold}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground text-sm">No triggered alerts.</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Projected Overruns</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {analytics.projectedOverruns && analytics.projectedOverruns.length > 0 ? (
              <ul className="space-y-2 sm:space-y-3">
                {analytics.projectedOverruns.map((over: any, idx: number) => (
                  <li key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 sm:p-3 rounded border border-red-300 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{over.entity}</span>
                    </div>
                    <span className="text-xs text-muted-foreground break-words">Projected Overrun: ₵{(over.projectedAmount || 0).toLocaleString()} ({over.timeline})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground text-sm">No projected overruns.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}