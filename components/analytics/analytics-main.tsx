// src/components/analytics/analytics-main.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Download, RefreshCw, BarChart3, Users, Shield, Target, TrendingUp, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions, useIsOwner } from '@/lib/rbac-hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

import StatsCards from '@/components/analytics/stats-cards';
import PerformanceChart from '@/components/analytics/performance-chart';
import TeamDistributionChart from '@/components/analytics/team-distribution-chart';
import BranchMetricsChart from '@/components/analytics/branch-metrics-chart';
import ProductivityTrendsChart from '@/components/analytics/productivity-trends-chart';
import { ProjectHealthDashboard } from './project-health-dashboard';

// Analytics interfaces
interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
    preset: 'last-7-days' | 'last-30-days' | 'last-3-months' | 'last-year';
  };
}

export default function AnalyticsMain() {
  const { user, userProfile } = useAuth();
  const { currentWorkspace, userRole, accessibleWorkspaces } = useWorkspace();
  const permissions = useRolePermissions();
  const isOwner = useIsOwner();
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<'last-7-days' | 'last-30-days' | 'last-3-months' | 'last-year'>('last-30-days');
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Enhanced analytics filters with workspace scope
  interface EnhancedAnalyticsFilters extends AnalyticsFilters {
    workspaceScope: 'current' | 'all';
    workspaceIds?: string[];
  }

  // Calculate date ranges based on preset with workspace scope
  const dateFilters = useMemo((): EnhancedAnalyticsFilters => {
    const now = new Date();
    const to = new Date(now);
    let from = new Date(now);

    switch (selectedPreset) {
      case 'last-7-days':
        from.setDate(now.getDate() - 7);
        break;
      case 'last-30-days':
        from.setDate(now.getDate() - 30);
        break;
      case 'last-3-months':
        from.setMonth(now.getMonth() - 3);
        break;
      case 'last-year':
        from.setFullYear(now.getFullYear() - 1);
        break;
    }

    // For owners, determine workspace scope
    const workspaceScope = (isOwner && showAllWorkspaces) ? 'all' : 'current';
    const workspaceIds = (isOwner && showAllWorkspaces) 
      ? accessibleWorkspaces?.map(w => w.id) || [currentWorkspace?.id || '']
      : [currentWorkspace?.id || ''];

    return {
      dateRange: { from, to, preset: selectedPreset },
      workspaceScope,
      workspaceIds: workspaceIds.filter(Boolean)
    };
  }, [selectedPreset, isOwner, showAllWorkspaces, accessibleWorkspaces, currentWorkspace?.id]);

  // Determine effective workspace ID for components
  const getEffectiveWorkspaceId = () => {
    if (isOwner && showAllWorkspaces) {
      // Return comma-separated workspace IDs for cross-workspace queries
      return dateFilters.workspaceIds?.join(',') || currentWorkspace?.id || '';
    }
    return currentWorkspace?.id || '';
  };

  // Check analytics permissions
  const canViewAnalytics = useMemo(() => {
    return userRole && ['member', 'admin', 'owner'].includes(userRole);
  }, [userRole]);

  const canViewAdvancedAnalytics = useMemo(() => {
    return userRole && ['admin', 'owner'].includes(userRole);
  }, [userRole]);

  const canViewSystemWideAnalytics = useMemo(() => {
    return userRole === 'owner';
  }, [userRole]);

  const canExportAnalytics = useMemo(() => {
    return userRole && ['admin', 'owner'].includes(userRole);
  }, [userRole]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Trigger refresh by updating a timestamp or similar
      // Components will pick up the change and reload their data
      toast({
        title: 'Analytics Refreshed',
        description: 'All analytics data has been updated with the latest information.',
      });
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Unable to refresh analytics data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!canExportAnalytics) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to export analytics data.',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Export Started',
        description: 'Your analytics report is being generated. You will be notified when ready.',
      });
      // Implement export functionality here
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast({
        title: 'Export Failed',
        description: 'Unable to export analytics data. Please try again.',
        variant: 'destructive',
      });
    }
  }, [canExportAnalytics, toast]);

  // Member stats state (always declared, regardless of role)
  const [memberStats, setMemberStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    activeProjects: 0,
    loading: true
  });

  // Load member data (only executes for members)
  useEffect(() => {
    const loadMemberData = async () => {
      if (userRole !== 'member' || !user?.uid || !currentWorkspace?.id) return;

      try {
        setMemberStats(prev => ({ ...prev, loading: true }));

        // Import services dynamically to avoid loading issues
        const { TaskService } = await import('@/lib/task-service');
        const { ProjectService } = await import('@/lib/project-service');

        // Get user's tasks
        const [assignedTasks, createdTasks, accessibleProjects] = await Promise.all([
          TaskService.getUserAssignedTasks(user.uid, currentWorkspace.id),
          TaskService.getUserCreatedTasks(user.uid, currentWorkspace.id),
          ProjectService.getAccessibleProjects(currentWorkspace.id, user.uid, 'member')
        ]);

        // Combine and deduplicate tasks
        const allUserTasks = [...assignedTasks];
        createdTasks.forEach(task => {
          if (!allUserTasks.some(t => t.id === task.id)) {
            allUserTasks.push(task);
          }
        });

        // Calculate stats
        const now = new Date();
        const totalTasks = allUserTasks.length;
        const completedTasks = allUserTasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = allUserTasks.filter(t => t.status === 'in-progress').length;
        const overdueTasks = allUserTasks.filter(t => 
          t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
        ).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const activeProjects = accessibleProjects.filter(p => p.status === 'active').length;

        setMemberStats({
          totalTasks,
          completedTasks,
          inProgressTasks,
          overdueTasks,
          completionRate,
          activeProjects,
          loading: false
        });

      } catch (error) {
        console.error('Error loading member data:', error);
        setMemberStats(prev => ({ ...prev, loading: false }));
      }
    };

    loadMemberData();
  }, [userRole, user?.uid, currentWorkspace?.id, refreshing]);

  // Admin/Owner stats state - this is key for admin functionality
  const [adminStats, setAdminStats] = useState({
    totalTasks: 0,
    totalProjects: 0,
    totalUsers: 0,
    totalTeams: 0,
    activeProjects: 0,
    completedTasks: 0,
    completionRate: 0,
    loading: true
  });

  // Load admin/owner data (only executes for admins and owners) 
  useEffect(() => {
    const loadAdminData = async () => {
      if ((userRole !== 'admin' && userRole !== 'owner') || !user?.uid || !currentWorkspace?.id) {
        console.log('Admin data loading skipped:', { userRole, userId: user?.uid, workspaceId: currentWorkspace?.id });
        return;
      }

      console.log('🔄 Starting admin data load...', { userRole, userId: user?.uid, workspaceId: currentWorkspace?.id });

      try {
        setAdminStats(prev => ({ ...prev, loading: true }));

        const { TaskService } = await import('@/lib/task-service');
        const { ProjectService } = await import('@/lib/project-service');
        const { UserService } = await import('@/lib/user-service');
        const { TeamService } = await import('@/lib/team-service');

        const [workspaceTasks, workspaceProjects, workspaceUsers, workspaceTeams] = await Promise.all([
          TaskService.getWorkspaceTasks(currentWorkspace.id),
          ProjectService.getWorkspaceProjects(currentWorkspace.id),
          UserService.getUsersByWorkspace(currentWorkspace.id),
          TeamService.getWorkspaceTeams(currentWorkspace.id)
        ]);

        const totalTasks = workspaceTasks.length;
        const totalProjects = workspaceProjects.length;
        const totalUsers = workspaceUsers.length;
        const totalTeams = workspaceTeams.length;
        const activeProjects = workspaceProjects.filter(p => p.status === 'active').length;
        const completedTasks = workspaceTasks.filter(t => t.status === 'completed').length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        setAdminStats({
          totalTasks,
          totalProjects,
          totalUsers,
          totalTeams,
          activeProjects,
          completedTasks,
          completionRate,
          loading: false
        });

        console.log('✅ Admin data loaded successfully:', {
          totalTasks,
          totalProjects,
          totalUsers,
          totalTeams,
          activeProjects,
          completedTasks,
          completionRate
        });

      } catch (error) {
        console.error('❌ Error loading admin data:', error);
        setAdminStats(prev => ({ ...prev, loading: false }));
        // Also show error in UI
        toast({
          title: 'Analytics Loading Error',
          description: 'Failed to load admin analytics data. Please refresh the page.',
          variant: 'destructive',
        });
      }
    };

    loadAdminData();
  }, [userRole, user?.uid, currentWorkspace?.id, refreshing]);

  // Member-specific simplified analytics
  if (userRole === 'member') {

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              My Analytics
            </h1>
            <p className="text-muted-foreground mt-1">Your personal performance metrics and insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Member banner */}
        <div className="p-3 rounded-lg border bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800/50">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              👤 <strong>Member Analytics:</strong> View your personal performance metrics, task completion rates, and project participation insights.
            </p>
          </div>
        </div>

        {/* Simplified Stats for Members */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-enhanced">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {memberStats.loading ? (
                  <div className="h-8 w-12 bg-muted animate-pulse rounded"></div>
                ) : (
                  memberStats.totalTasks
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {memberStats.loading ? 'Loading...' : (
                  `${memberStats.inProgressTasks} in progress • ${memberStats.overdueTasks} overdue`
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {memberStats.loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                ) : (
                  `${memberStats.completionRate}%`
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {memberStats.loading ? 'Loading...' : (
                  `${memberStats.completedTasks} completed tasks`
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {memberStats.loading ? (
                  <div className="h-8 w-12 bg-muted animate-pulse rounded"></div>
                ) : (
                  memberStats.activeProjects
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {memberStats.loading ? 'Loading...' : 'Projects you\'re involved in'}
              </p>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Role</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                <Badge variant="outline">👤 Member</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Analytics scope
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Member-specific content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Performance */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>My Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Personal Metrics</h3>
                  <p className="text-muted-foreground mb-4">
                    Track your task completion and productivity
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Task Completion</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: `${memberStats.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="font-medium">
                          {memberStats.loading ? '...' : `${memberStats.completionRate}%`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>Project Participation</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(memberStats.activeProjects * 20, 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-medium">
                          {memberStats.loading ? '...' : `${memberStats.activeProjects} projects`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance breakdown */}
                {!memberStats.loading && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-medium text-sm">Task Breakdown</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 border rounded">
                        <div className="text-lg font-bold text-green-600">{memberStats.completedTasks}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                      <div className="p-2 border rounded">
                        <div className="text-lg font-bold text-blue-600">{memberStats.inProgressTasks}</div>
                        <div className="text-xs text-muted-foreground">In Progress</div>
                      </div>
                      <div className="p-2 border rounded">
                        <div className="text-lg font-bold text-red-600">{memberStats.overdueTasks}</div>
                        <div className="text-xs text-muted-foreground">Overdue</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={() => router.push('/dashboard/tasks')}
              >
                <Target className="h-4 w-4 mr-3" />
                Manage My Tasks ({memberStats.loading ? '...' : memberStats.totalTasks})
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={() => router.push('/dashboard/teams')}
              >
                <Users className="h-4 w-4 mr-3" />
                View My Teams
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>

              <div className="pt-4 border-t">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm">💡 Member Analytics</h4>
                  <p className="text-xs text-muted-foreground">
                    As a member, you can view your personal task completion metrics and project participation. 
                    Contact an admin for workspace-wide analytics.
                  </p>
                  {!memberStats.loading && memberStats.overdueTasks > 0 && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800/50">
                      <p className="text-xs text-red-700 dark:text-red-400">
                        ⚠️ You have {memberStats.overdueTasks} overdue task{memberStats.overdueTasks > 1 ? 's' : ''}. Consider prioritizing them.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Comprehensive insights into team performance and productivity</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Cross-workspace toggle for owners */}
          {isOwner && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
              <button
                onClick={() => setShowAllWorkspaces(!showAllWorkspaces)}
                className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                  showAllWorkspaces 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400'
                }`}
              >
                <span className="text-base">{showAllWorkspaces ? '🌐' : '🏢'}</span>
                <span>
                  {showAllWorkspaces 
                    ? `All Workspaces (${accessibleWorkspaces.length})` 
                    : 'Current Workspace'
                  }
                </span>
              </button>
            </div>
          )}
          
          <Select value={selectedPreset} onValueChange={(value) => setSelectedPreset(value as any)}>
            <SelectTrigger className="w-40 border-border">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 days</SelectItem>
              <SelectItem value="last-30-days">Last 30 days</SelectItem>
              <SelectItem value="last-3-months">Last 3 months</SelectItem>
              <SelectItem value="last-year">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {canExportAnalytics && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Role-based access banner */}
      {userRole && (
        <div className={`p-3 rounded-lg border ${
          userRole === 'owner' 
            ? 'bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800/50'
            : userRole === 'admin'
            ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800/50'
            : 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800/50'
        }`}>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <p className={`text-sm ${
              userRole === 'owner' 
                ? 'text-green-700 dark:text-green-400'
                : userRole === 'admin'
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-yellow-700 dark:text-yellow-400'
            }`}>
              {userRole === 'owner' && (
                <>🔧 <strong>Owner Analytics:</strong> Full access to all workspace and system-wide analytics including performance trends, user insights, and administrative data.
                {isOwner && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
                  <> Use the workspace toggle above to view data across all {accessibleWorkspaces.length} accessible workspaces.</>
                )}
                </>
              )}
              {userRole === 'admin' && (
                <>⚙️ <strong>Admin Analytics:</strong> Access to workspace analytics including team performance, project metrics, and user activity within your workspace.</>
              )}
              {userRole === 'member' && (
                <>👤 <strong>Member Analytics:</strong> View your personal performance metrics, task completion rates, and team collaboration insights.</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <StatsCards 
        workspaceId={getEffectiveWorkspaceId()}
        userId={user?.uid || ''}
        userRole={userRole as 'member' | 'admin' | 'owner'}
        filters={dateFilters}
        refreshTrigger={refreshing}
        showAllWorkspaces={isOwner && showAllWorkspaces}
        accessibleWorkspaces={isOwner ? accessibleWorkspaces : undefined}
      />

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Different tab layouts based on user role */}
        {userRole === 'member' ? (
          // Member-specific tabs (limited access)
          <TabsList className="grid w-full grid-cols-2 lg:w-auto">
            <TabsTrigger value="overview">My Dashboard</TabsTrigger>
            <TabsTrigger value="performance">My Performance</TabsTrigger>
          </TabsList>
        ) : userRole === 'admin' ? (
          // Admin tabs (workspace access)
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>
        ) : (
          // Owner tabs (full access)
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="overview" className="space-y-6">
          {userRole === 'member' ? (
            /* Member Overview - Personal Dashboard */
            <div className="space-y-6">
              {/* Personal Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="card-enhanced">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Loading...</div>
                    <p className="text-xs text-muted-foreground">
                      Personal task metrics
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-enhanced">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Loading...</div>
                    <p className="text-xs text-muted-foreground">
                      Your task completion
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-enhanced">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Projects Involved</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Loading...</div>
                    <p className="text-xs text-muted-foreground">
                      Active project participation
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions for Members */}
              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12"
                    onClick={() => setActiveTab('performance')}
                  >
                    <TrendingUp className="h-4 w-4 mr-3" />
                    View My Performance
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12"
                    onClick={() => router?.push('/dashboard/tasks')}
                  >
                    <Target className="h-4 w-4 mr-3" />
                    Manage My Tasks
                  </Button>
                </CardContent>
              </Card>

              {/* Member-specific insights */}
              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle>Your Work Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Your Personal Analytics</h3>
                    <p className="text-muted-foreground mb-4">
                      Track your personal productivity and task completion metrics
                    </p>
                    <Button onClick={() => setActiveTab('performance')}>
                      View My Performance Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Admin/Owner Overview - Full Dashboard */
            <div className="space-y-6">
              {/* Admin Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="card-enhanced">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {adminStats.loading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                      ) : (
                        adminStats.totalTasks
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {adminStats.loading ? 'Loading...' : (
                        `${adminStats.completedTasks} completed (${adminStats.completionRate}%)`
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-enhanced">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {adminStats.loading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                      ) : (
                        adminStats.activeProjects
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {adminStats.loading ? 'Loading...' : (
                        `${adminStats.totalProjects} total projects`
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-enhanced">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {adminStats.loading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                      ) : (
                        adminStats.totalUsers
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {adminStats.loading ? 'Loading...' : (
                        `${adminStats.totalTeams} teams`
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-enhanced">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {adminStats.loading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                      ) : (
                        `${adminStats.completionRate}%`
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {adminStats.loading ? 'Loading...' : 'Workspace completion rate'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Analytics Grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Branch Performance Overview */}
                <div className="lg:col-span-2">
                <BranchMetricsChart 
                  workspaceId={getEffectiveWorkspaceId()}
                  userId={user?.uid || ''}
                  userRole={userRole as 'member' | 'admin' | 'owner'}
                  filters={dateFilters}
                  refreshTrigger={refreshing}
                  showAllWorkspaces={isOwner && showAllWorkspaces}
                  accessibleWorkspaces={isOwner ? accessibleWorkspaces : undefined}
                />
              </div>

              {/* Quick Stats & Actions */}
              <div className="space-y-6">
                {/* Recent Activity Summary */}
                <Card className="card-enhanced">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Team Performance</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {showAllWorkspaces ? 'Cross-workspace view active' : 'Current workspace metrics'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">Analytics Access</p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            {userRole === 'owner' ? 'Full system analytics' : 'Workspace analytics'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Data Range</p>
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            {selectedPreset === 'last-7-days' ? 'Last 7 days' :
                             selectedPreset === 'last-30-days' ? 'Last 30 days' :
                             selectedPreset === 'last-3-months' ? 'Last 3 months' : 'Last year'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation Quick Links */}
                <Card className="card-enhanced">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-10"
                      onClick={() => setActiveTab('projects')}
                    >
                      <Target className="h-4 w-4 mr-3" />
                      View Project Health
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-10"
                      onClick={() => setActiveTab('performance')}
                    >
                      <TrendingUp className="h-4 w-4 mr-3" />
                      Performance Metrics
                    </Button>

                    {canViewAdvancedAnalytics && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-10"
                        onClick={() => setActiveTab('teams')}
                      >
                        <Users className="h-4 w-4 mr-3" />
                        Team Analytics
                      </Button>
                    )}

                    {canViewSystemWideAnalytics && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-10"
                        onClick={() => setActiveTab('trends')}
                      >
                        <BarChart3 className="h-4 w-4 mr-3" />
                        Trend Analysis
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
            </div>
          )}

          {/* Secondary Metrics Row - Only for non-members */}
          {userRole !== 'member' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Performance Quick View */}
              <Card className="card-enhanced">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Performance Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Productivity Trend</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Task Efficiency</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-4/5 bg-blue-500 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">80%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Delivery Rate</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-5/6 bg-purple-500 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setActiveTab('performance')}
                    >
                      View Detailed Performance
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Workspace Summary */}
              <Card className="card-enhanced">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Workspace Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Your Role</span>
                      <Badge variant={
                        userRole === 'owner' ? 'default' : 'secondary'
                      }>
                        {userRole === 'owner' ? '🔧 Owner' : '⚙️ Admin'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Workspace Access</span>
                      <span className="text-sm font-medium">
                        {isOwner && accessibleWorkspaces ? `${accessibleWorkspaces.length} workspaces` : '1 workspace'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Analytics Scope</span>
                      <span className="text-sm font-medium">
                        {showAllWorkspaces ? 'Multi-workspace' : 'Current workspace'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Data Period</span>
                      <span className="text-sm font-medium">
                        {selectedPreset.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={handleRefresh}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          {userRole !== 'member' ? (
            <ProjectHealthDashboard 
              workspaceId={getEffectiveWorkspaceId()}
              userId={user?.uid || ''}
              userRole={userRole as 'member' | 'admin' | 'owner'}
              filters={dateFilters}
              refreshTrigger={refreshing}
              showAllWorkspaces={isOwner && showAllWorkspaces}
              accessibleWorkspaces={isOwner ? accessibleWorkspaces : undefined}
            />
          ) : (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">Limited Access</h3>
                <p className="text-sm text-muted-foreground">
                  Project health analytics are available to administrators and owners only.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {userRole === 'member' ? (
            /* Member-specific performance view */
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>My Personal Performance</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your individual productivity metrics and task completion trends
                </p>
              </CardHeader>
              <CardContent>
                <PerformanceChart 
                  title="My Performance Trends"
                  workspaceId={getEffectiveWorkspaceId()}
                  userId={user?.uid || ''}
                  userRole={userRole as 'member' | 'admin' | 'owner'}
                  filters={dateFilters}
                  refreshTrigger={refreshing}
                  showAllWorkspaces={false}
                  accessibleWorkspaces={undefined}
                />
              </CardContent>
            </Card>
          ) : (
            <PerformanceChart 
              workspaceId={getEffectiveWorkspaceId()}
              userId={user?.uid || ''}
              userRole={userRole as 'member' | 'admin' | 'owner'}
              filters={dateFilters}
              refreshTrigger={refreshing}
              showAllWorkspaces={isOwner && showAllWorkspaces}
              accessibleWorkspaces={isOwner ? accessibleWorkspaces : undefined}
            />
          )}
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          {canViewAdvancedAnalytics ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <TeamDistributionChart 
                workspaceId={getEffectiveWorkspaceId()}
                userId={user?.uid || ''}
                userRole={userRole as 'member' | 'admin' | 'owner'}
                filters={dateFilters}
                refreshTrigger={refreshing}
                showAllWorkspaces={isOwner && showAllWorkspaces}
                accessibleWorkspaces={isOwner ? accessibleWorkspaces : undefined}
              />
              <ProductivityTrendsChart 
                workspaceId={getEffectiveWorkspaceId()}
                userId={user?.uid || ''}
                userRole={userRole as 'member' | 'admin' | 'owner'}
                filters={dateFilters}
                refreshTrigger={refreshing}
                showAllWorkspaces={isOwner && showAllWorkspaces}
                accessibleWorkspaces={isOwner ? accessibleWorkspaces : undefined}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">Admin Access Required</h3>
                <p className="text-sm text-muted-foreground">
                  Team analytics are available to administrators and owners only.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {canViewSystemWideAnalytics ? (
            <PerformanceChart
              title="Task Creation vs Completion Trends"
              dataKey1="tasks"
              dataKey2="productivity"
              name1="Tasks Created"
              name2="Completion Rate %"
              workspaceId={getEffectiveWorkspaceId()}
              userId={user?.uid || ''}
              userRole={userRole as 'member' | 'admin' | 'owner'}
              filters={dateFilters}
              refreshTrigger={refreshing}
              showAllWorkspaces={isOwner && showAllWorkspaces}
              accessibleWorkspaces={isOwner ? accessibleWorkspaces : undefined}
            />
          ) : (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">Owner Access Required</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced trend analytics are available to workspace owners only.
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}