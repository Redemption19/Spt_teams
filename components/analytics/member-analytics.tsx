'use client';

import { useState, useEffect, useCallback } from 'react';
import { Target, CheckCircle, TrendingUp, Users, BarChart3, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { TaskService } from '@/lib/task-service';
import { ProjectService } from '@/lib/project-service';
import { useRouter } from 'next/navigation';

interface MemberStatsData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  activeProjects: number;
}

export function MemberAnalytics() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MemberStatsData>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    activeProjects: 0
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  const loadMemberStats = useCallback(async () => {
    if (!user?.uid || !currentWorkspace?.id) return;

    try {
      setLoading(true);

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

      setStats({
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate,
        activeProjects
      });

    } catch (error) {
      console.error('Error loading member stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, currentWorkspace?.id]);

  useEffect(() => {
    loadMemberStats();
  }, [loadMemberStats]);

  const handleRefresh = useCallback(() => {
    loadMemberStats();
  }, [loadMemberStats]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">My Dashboard</TabsTrigger>
          <TabsTrigger value="performance">My Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Personal Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="card-enhanced">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    stats.totalTasks
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.inProgressTasks} in progress • {stats.overdueTasks} overdue
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
                  {loading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    `${stats.completionRate}%`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedTasks} completed tasks
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
                  {loading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    stats.activeProjects
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Projects you're involved in
                </p>
              </CardContent>
            </Card>

            <Card className="card-enhanced">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Personal Metrics</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    <Badge variant="outline">Member</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your analytics scope
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
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
                onClick={() => router.push('/dashboard/tasks')}
              >
                <Target className="h-4 w-4 mr-3" />
                Manage My Tasks
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-3" />
                Refresh Data
              </Button>
            </CardContent>
          </Card>

          {/* Work Summary */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Your Work Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium">Task Progress</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Completed</span>
                      <span className="font-medium">{stats.completedTasks}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>In Progress</span>
                      <span className="font-medium">{stats.inProgressTasks}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Overdue</span>
                      <span className="font-medium text-red-600">{stats.overdueTasks}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Performance Insights</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Completion Rate</span>
                      <span className="font-medium">{stats.completionRate}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Active Projects</span>
                      <span className="font-medium">{stats.activeProjects}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Total Tasks</span>
                      <span className="font-medium">{stats.totalTasks}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>My Personal Performance</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your individual productivity metrics and task completion overview
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Performance Overview */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.completionRate}%</div>
                      <p className="text-sm text-muted-foreground">Task Completion Rate</p>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</div>
                      <p className="text-sm text-muted-foreground">Active Tasks</p>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.activeProjects}</div>
                      <p className="text-sm text-muted-foreground">Active Projects</p>
                    </div>
                  </div>
                </div>

                {/* Performance Details */}
                <div className="space-y-4">
                  <h4 className="font-medium">Performance Breakdown</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Task Completion</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: `${stats.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{stats.completionRate}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Project Participation</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(stats.activeProjects * 20, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{stats.activeProjects} projects</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">💡 Performance Tips</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {stats.overdueTasks > 0 && (
                      <p>• Consider prioritizing {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''}</p>
                    )}
                    {stats.completionRate < 80 && (
                      <p>• Focus on completing current tasks to improve your completion rate</p>
                    )}
                    {stats.completionRate >= 90 && (
                      <p>• Excellent completion rate! Keep up the great work 🎉</p>
                    )}
                    <p>• Regular task updates help maintain project momentum</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 