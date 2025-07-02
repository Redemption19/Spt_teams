// src/components/analytics/stats-cards.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, Users, Calendar, Loader2 } from 'lucide-react';
import { TaskService } from '@/lib/task-service';
import { ProjectService } from '@/lib/project-service';
import { UserService } from '@/lib/user-service';
import { Task, Project } from '@/lib/types';

interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
    preset: 'last-7-days' | 'last-30-days' | 'last-3-months' | 'last-year';
  };
}

interface StatsCardsProps {
  workspaceId: string;
  userId: string;
  userRole: 'member' | 'admin' | 'owner';
  filters: AnalyticsFilters;
  refreshTrigger?: boolean;
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
}

interface StatsData {
  avgProductivity: number;
  productivityChange: number;
  taskCompletion: number;
  taskCompletionChange: number;
  activeUsers: number;
  activeUsersChange: number;
  projectsActive: number;
  projectsDueThisWeek: number;
}

export default function StatsCards({ 
  workspaceId, 
  userId, 
  userRole, 
  filters,
  refreshTrigger,
  showAllWorkspaces = false,
  accessibleWorkspaces = []
}: StatsCardsProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    avgProductivity: 0,
    productivityChange: 0,
    taskCompletion: 0,
    taskCompletionChange: 0,
    activeUsers: 0,
    activeUsersChange: 0,
    projectsActive: 0,
    projectsDueThisWeek: 0
  });

  const fetchStats = useCallback(async () => {
    if (!workspaceId || !userId) {
      console.log('StatsCards: Missing required data:', { workspaceId, userId });
      return;
    }
    
    console.log('📊 StatsCards: Starting data fetch...', { workspaceId, userId, userRole, showAllWorkspaces });
    
    try {
      setLoading(true);
      
      const { from, to } = filters.dateRange;
      const previousPeriodFrom = new Date(from);
      previousPeriodFrom.setDate(previousPeriodFrom.getDate() - (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

      // Determine workspace IDs to load from
      const workspaceIds = showAllWorkspaces && accessibleWorkspaces?.length 
        ? accessibleWorkspaces.map(w => w.id)
        : [workspaceId];

      // Fetch data based on user role and workspace scope
      let currentTasks: Task[], previousTasks: Task[], currentProjects: Project[], currentUsers: any[], previousUsers: any[];

      if (userRole === 'member') {
        // Members see only their own data from current workspace
        const [assignedTasks, createdTasks, allProjects] = await Promise.all([
          TaskService.getUserAssignedTasks(userId, workspaceId),
          TaskService.getUserCreatedTasks(userId, workspaceId),
          ProjectService.getWorkspaceProjects(workspaceId)
        ]);
        
        // Combine and deduplicate user tasks
        const allUserTasks = [...assignedTasks];
        createdTasks.forEach((task: Task) => {
          if (!allUserTasks.some((t: Task) => t.id === task.id)) {
            allUserTasks.push(task);
          }
        });
        
        // For members, previous data is also their own
        previousTasks = allUserTasks.filter((task: Task) => {
          const taskDate = new Date(task.createdAt);
          return taskDate >= previousPeriodFrom && taskDate < from;
        });
        
        currentTasks = allUserTasks.filter((task: Task) => {
          const taskDate = new Date(task.createdAt);
          return taskDate >= from && taskDate <= to;
        });
        
        currentProjects = allProjects.filter((project: Project) => {
          const projectDate = new Date(project.createdAt);
          return projectDate >= from && projectDate <= to;
        });
        
        // Members see minimal user data
        currentUsers = [{ id: userId }];
        previousUsers = [{ id: userId }];
        
      } else {
        // Admins and owners see workspace data - potentially from multiple workspaces
        let allWorkspaceTasks: Task[] = [];
        let allWorkspaceProjects: Project[] = [];
        let allWorkspaceUsers: any[] = [];

        // Load data from all specified workspaces
        for (const wsId of workspaceIds) {
          const [wsTasks, wsProjects, wsUsers] = await Promise.all([
            TaskService.getWorkspaceTasks(wsId),
            ProjectService.getWorkspaceProjects(wsId),
            UserService.getUsersByWorkspace(wsId)
          ]);

          // Aggregate data (avoiding duplicates by ID)
          wsTasks.forEach(task => {
            if (!allWorkspaceTasks.some(t => t.id === task.id)) {
              allWorkspaceTasks.push(task);
            }
          });

          wsProjects.forEach(project => {
            if (!allWorkspaceProjects.some(p => p.id === project.id)) {
              allWorkspaceProjects.push(project);
            }
          });

          wsUsers.forEach(user => {
            if (!allWorkspaceUsers.some(u => u.id === user.id)) {
              allWorkspaceUsers.push(user);
            }
          });
        }

        // Filter by date range
        previousTasks = allWorkspaceTasks.filter((task: Task) => {
          const taskDate = new Date(task.createdAt);
          return taskDate >= previousPeriodFrom && taskDate < from;
        });
        
        currentTasks = allWorkspaceTasks.filter((task: Task) => {
          const taskDate = new Date(task.createdAt);
          return taskDate >= from && taskDate <= to;
        });
        
        currentProjects = allWorkspaceProjects.filter((project: Project) => {
          const projectDate = new Date(project.createdAt);
          return projectDate >= from && projectDate <= to;
        });
        
        // For users, use aggregated count
        currentUsers = allWorkspaceUsers;
        previousUsers = allWorkspaceUsers;
      }

      // Calculate metrics
      const completedTasks = currentTasks.filter((t: Task) => t.status === 'completed').length;
      const totalTasks = currentTasks.length;
      const taskCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const previousCompletedTasks = previousTasks.filter((t: Task) => t.status === 'completed').length;
      const previousTotalTasks = previousTasks.length;
      const previousTaskCompletion = previousTotalTasks > 0 ? (previousCompletedTasks / previousTotalTasks) * 100 : 0;

      // Calculate productivity score (completion rate + on-time rate)
      const onTimeTasks = currentTasks.filter((t: Task) => 
        t.status === 'completed' && 
        t.dueDate && 
        new Date(t.updatedAt) <= new Date(t.dueDate)
      ).length;
      
      const onTimeRate = completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0;
      const avgProductivity = Math.round((taskCompletion * 0.7) + (onTimeRate * 0.3));

      const previousOnTimeTasks = previousTasks.filter((t: Task) => 
        t.status === 'completed' && 
        t.dueDate && 
        new Date(t.updatedAt) <= new Date(t.dueDate)
      ).length;
      
      const previousOnTimeRate = previousCompletedTasks > 0 ? (previousOnTimeTasks / previousCompletedTasks) * 100 : 0;
      const previousProductivity = Math.round((previousTaskCompletion * 0.7) + (previousOnTimeRate * 0.3));

      // Calculate active projects
      const activeProjects = currentProjects.filter((p: Project) => p.status === 'active').length;

      // Calculate projects due this week
      const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(now.getDate() + 7);
      const projectsDueThisWeek = currentProjects.filter((p: Project) => 
        p.dueDate && 
        new Date(p.dueDate) >= now && 
        new Date(p.dueDate) <= weekFromNow
      ).length;

      setStats({
        avgProductivity,
        productivityChange: previousProductivity > 0 ? ((avgProductivity - previousProductivity) / previousProductivity) * 100 : 0,
        taskCompletion,
        taskCompletionChange: previousTaskCompletion > 0 ? ((taskCompletion - previousTaskCompletion) / previousTaskCompletion) * 100 : 0,
        activeUsers: currentUsers.length,
        activeUsersChange: currentUsers.length - previousUsers.length,
        projectsActive: activeProjects,
        projectsDueThisWeek
      });

      console.log('✅ StatsCards: Data loaded successfully:', {
        avgProductivity,
        taskCompletion,
        activeUsers: currentUsers.length,
        projectsActive: activeProjects,
        projectsDueThisWeek
      });

    } catch (error) {
      console.error('❌ StatsCards: Error loading data:', error);
      // Keep existing stats on error
    } finally {
      setLoading(false);
    }
  }, [
    workspaceId, 
    userId, 
    userRole, 
    filters.dateRange.from.getTime(), 
    filters.dateRange.to.getTime(), 
    filters.dateRange.preset,
    showAllWorkspaces, 
    accessibleWorkspaces?.map(w => w.id).join(',') || ''
  ]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshTrigger]);

  const formatChange = (change: number): { text: string; color: string } => {
    if (change > 0) {
      return {
        text: `+${change.toFixed(1)}% from last period`,
        color: 'text-green-600 dark:text-green-400'
      };
    } else if (change < 0) {
      return {
        text: `${change.toFixed(1)}% from last period`,
        color: 'text-red-600 dark:text-red-400'
      };
    } else {
      return {
        text: 'No change from last period',
        color: 'text-muted-foreground'
      };
    }
  };

  const formatUsersChange = (change: number): { text: string; color: string } => {
    if (change > 0) {
      return {
        text: `+${change} this period`,
        color: 'text-blue-600 dark:text-blue-400'
      };
    } else if (change < 0) {
      return {
        text: `${change} this period`,
        color: 'text-red-600 dark:text-red-400'
      };
    } else {
      return {
        text: 'No change this period',
        color: 'text-muted-foreground'
      };
    }
  };

  const productivityChange = formatChange(stats.productivityChange);
  const completionChange = formatChange(stats.taskCompletionChange);
  const usersChange = formatUsersChange(stats.activeUsersChange);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="stats-card border border-border/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-6 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="stats-card border border-border/30 hover:border-primary/20 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Avg Productivity</p>
              <p className="text-2xl font-bold text-foreground">{stats.avgProductivity}%</p>
              <p className={`text-xs ${productivityChange.color}`}>
                {productivityChange.text}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stats-card border border-border/30 hover:border-primary/20 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Task Completion</p>
              <p className="text-2xl font-bold text-foreground">{Math.round(stats.taskCompletion)}%</p>
              <p className={`text-xs ${completionChange.color}`}>
                {completionChange.text}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stats-card border border-border/30 hover:border-primary/20 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                {userRole === 'member' ? 'My Activity' : 'Active Users'}
              </p>
              <p className="text-2xl font-bold text-foreground">{stats.activeUsers}</p>
              <p className={`text-xs ${usersChange.color}`}>
                {usersChange.text}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stats-card border border-border/30 hover:border-primary/20 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Projects Active</p>
              <p className="text-2xl font-bold text-foreground">{stats.projectsActive}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                {stats.projectsDueThisWeek} due this week
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}