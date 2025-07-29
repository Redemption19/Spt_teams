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
    return <div className="text-center py-8 text-muted-foreground">No workspace selected.</div>;
  }
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>;
  }
  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }
  if (!analytics) {
    return <div className="text-center py-8 text-muted-foreground">No analytics data available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">₵{analytics.totalBudget?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Allocated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">₵{analytics.totalSpent?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{analytics.utilizationPercentage}% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">₵{analytics.totalRemaining?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available to spend</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">{analytics.utilizationPercentage}%</div>
            <p className="text-xs text-muted-foreground">of total budget</p>
          </CardContent>
        </Card>
      </div>
      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Department Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.departmentBreakdown && analytics.departmentBreakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Department</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Budget</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Spent</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Remaining</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Utilization</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {analytics.departmentBreakdown.map((dept: any) => {
                    const utilization = dept.budget > 0 ? Math.round((dept.spent / dept.budget) * 100) : 0;
                    return (
                      <tr key={dept.department}>
                        <td className="px-4 py-2 font-medium">{departmentMap[dept.department] || dept.department}</td>
                        <td className="px-4 py-2">₵{dept.budget?.toLocaleString()}</td>
                        <td className="px-4 py-2 text-red-600">₵{dept.spent?.toLocaleString()}</td>
                        <td className="px-4 py-2 text-green-600">₵{dept.remaining?.toLocaleString()}</td>
                        <td className="px-4 py-2">{utilization}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted-foreground">No department breakdown available.</div>
          )}
        </CardContent>
      </Card>
      {/* Alerts & Projected Overruns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Triggered Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.alerts && analytics.alerts.length > 0 ? (
              <ul className="space-y-2">
                {analytics.alerts.map((alert: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 p-2 rounded border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium">{alert.message}</span>
                    <span className="text-xs text-muted-foreground ml-auto">Threshold: {alert.threshold}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground">No triggered alerts.</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Projected Overruns</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.projectedOverruns && analytics.projectedOverruns.length > 0 ? (
              <ul className="space-y-2">
                {analytics.projectedOverruns.map((over: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 p-2 rounded border border-red-300 bg-red-50 dark:bg-red-900/20">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="font-medium">{over.entity}</span>
                    <span className="text-xs text-muted-foreground ml-auto">Projected Overrun: ₵{(over.projectedAmount || 0).toLocaleString()} ({over.timeline})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground">No projected overruns.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}