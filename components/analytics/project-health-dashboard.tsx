'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, Users, Target, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProjectService } from '@/lib/project-service';
import { TaskService } from '@/lib/task-service';
import { Project, Task } from '@/lib/types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Sub-components will be added in future iterations

interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
    preset: 'last-7-days' | 'last-30-days' | 'last-3-months' | 'last-year';
  };
  workspaceScope?: 'current' | 'all';
  workspaceIds?: string[];
}

interface ProjectHealthDashboardProps {
  workspaceId: string;
  userId: string;
  userRole: 'member' | 'admin' | 'owner';
  filters: AnalyticsFilters;
  refreshTrigger?: boolean;
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
}

export interface ProjectWithHealth extends Project {
  taskCount: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  teamMembers: number;
  riskScore: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  completionRate: number;
  onTimeDelivery: number;
  daysOverdue: number;
  blockedTasks: number;
}

const HEALTH_COLORS = {
  healthy: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444'
};

const STATUS_COLORS = {
  planning: '#6b7280',
  active: '#3b82f6',
  completed: '#22c55e',
  archived: '#6b7280'
};

export function ProjectHealthDashboard({
  workspaceId,
  userId,
  userRole,
  filters,
  refreshTrigger,
  showAllWorkspaces = false,
  accessibleWorkspaces = []
}: ProjectHealthDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectWithHealth[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadProjectHealthData = useCallback(async () => {
    if (!workspaceId || !userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Determine workspace IDs to load from
      const workspaceIds = showAllWorkspaces && accessibleWorkspaces?.length 
        ? accessibleWorkspaces.map(w => w.id)
        : [workspaceId.split(',')[0]]; // Handle comma-separated IDs from analytics-main
      
      console.log('🏗️ Loading project health data for workspaces:', workspaceIds);
      
      let allProjects: Project[] = [];
      
      // Load projects from all relevant workspaces
      for (const wsId of workspaceIds) {
        try {
          let wsProjects: Project[];
          
          if (userRole === 'member') {
            // Members see accessible projects only
            wsProjects = await ProjectService.getAccessibleProjects(wsId, userId, userRole);
          } else {
            // Admins and owners see all workspace projects
            wsProjects = await ProjectService.getWorkspaceProjects(wsId);
          }
          
          // Add projects avoiding duplicates
          wsProjects.forEach(project => {
            if (!allProjects.some(p => p.id === project.id)) {
              allProjects.push(project);
            }
          });
        } catch (wsError) {
          console.error(`Error loading projects from workspace ${wsId}:`, wsError);
        }
      }
      
      console.log('📊 Loaded projects:', allProjects.length);
      
      // Filter projects by date range if specified
      const { from, to } = filters.dateRange;
      const filteredProjects = allProjects.filter(project => {
        const projectDate = new Date(project.createdAt);
        return projectDate >= from && projectDate <= to;
      });
      
      // Calculate health metrics for each project
      const projectsWithHealth: ProjectWithHealth[] = [];
      
      for (const project of filteredProjects) {
        try {
          // Get project tasks
          const projectTasks = await ProjectService.getProjectTasks(project.id);
          
          // Calculate health metrics
          const healthData = calculateProjectHealth(project, projectTasks);
          
          projectsWithHealth.push({
            ...project,
            ...healthData
          });
        } catch (taskError) {
          console.error(`Error loading tasks for project ${project.id}:`, taskError);
          // Add project with default health data
          projectsWithHealth.push({
            ...project,
            taskCount: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            overdueTasks: 0,
            teamMembers: 0,
            riskScore: 0,
            healthStatus: 'healthy',
            completionRate: 0,
            onTimeDelivery: 0,
            daysOverdue: 0,
            blockedTasks: 0
          });
        }
      }
      
      // Sort by risk score (highest first) and then by name
      projectsWithHealth.sort((a, b) => {
        if (a.riskScore !== b.riskScore) {
          return b.riskScore - a.riskScore;
        }
        return a.name.localeCompare(b.name);
      });
      
      setProjects(projectsWithHealth);
      console.log('✅ Project health dashboard loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading project health data:', error);
      setError('Failed to load project health data. Please try again.');
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
    loadProjectHealthData();
  }, [loadProjectHealthData, refreshTrigger]);

  // Calculate summary statistics
  const summaryStats = {
    totalProjects: projects.length,
    healthyProjects: projects.filter(p => p.healthStatus === 'healthy').length,
    warningProjects: projects.filter(p => p.healthStatus === 'warning').length,
    criticalProjects: projects.filter(p => p.healthStatus === 'critical').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    averageCompletion: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.completionRate, 0) / projects.length) : 0,
    totalTasks: projects.reduce((sum, p) => sum + p.taskCount, 0),
    overdueTasks: projects.reduce((sum, p) => sum + p.overdueTasks, 0)
  };

  // Prepare chart data
  const statusData = [
    { name: 'Planning', value: projects.filter(p => p.status === 'planning').length, color: STATUS_COLORS.planning },
    { name: 'Active', value: projects.filter(p => p.status === 'active').length, color: STATUS_COLORS.active },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length, color: STATUS_COLORS.completed },
    { name: 'Archived', value: projects.filter(p => p.status === 'archived').length, color: STATUS_COLORS.archived }
  ].filter(item => item.value > 0);

  const healthData = [
    { name: 'Healthy', value: summaryStats.healthyProjects, color: HEALTH_COLORS.healthy },
    { name: 'Warning', value: summaryStats.warningProjects, color: HEALTH_COLORS.warning },
    { name: 'Critical', value: summaryStats.criticalProjects, color: HEALTH_COLORS.critical }
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading project health data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center mx-auto mb-4">
            ⚠️
          </div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Data</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
            📊
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Projects Found</h3>
          <p className="text-sm text-muted-foreground">
            {userRole === 'member' 
              ? 'No accessible projects found in the selected period.'
              : 'No projects found in the selected period. Create some projects to see health metrics.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with workspace scope indicator */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Project Health Dashboard</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {showAllWorkspaces 
              ? `Monitoring ${projects.length} projects across ${accessibleWorkspaces?.length || 1} workspaces`
              : `Monitoring ${projects.length} projects in current workspace`
            }
          </p>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground flex flex-wrap gap-1 sm:gap-2">
          {showAllWorkspaces && (
            <span className="mr-2 whitespace-nowrap">🌐 All Workspaces ({accessibleWorkspaces?.length || 1})</span>
          )}
          {userRole === 'member' && '👤 Accessible Projects'}
          {userRole === 'admin' && !showAllWorkspaces && '⚙️ Workspace Projects'}
          {userRole === 'admin' && showAllWorkspaces && '⚙️ All Workspace Projects'}
          {userRole === 'owner' && !showAllWorkspaces && '🔧 Workspace Projects'}
          {userRole === 'owner' && showAllWorkspaces && '🔧 All Projects'}
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.activeProjects} active • {summaryStats.completedProjects} completed
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryStats.healthyProjects}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.warningProjects} warning • {summaryStats.criticalProjects} critical
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.averageCompletion}%</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.overdueTasks} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Project Status Distribution */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, cx, cy }) => {
                    if (statusData.length === 1) {
                      return (
                        <text
                          x={cx}
                          y={cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={statusData[0].color}
                          fontSize="16"
                        >
                          {`${name} ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }
                    // Default label for multiple segments
                    return `${name} ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Health Distribution */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle>Project Health Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={healthData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, cx, cy }) => {
                    if (healthData.length === 1) {
                      return (
                        <text
                          x={cx}
                          y={cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={healthData[0].color}
                          fontSize="16"
                        >
                          {`${name} ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }
                    // Default label for multiple segments
                    return `${name} ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {healthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Project List */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle>Project Health Details</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Detailed health metrics for all projects
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm sm:text-base truncate max-w-[160px]">{project.name}</h4>
                    <Badge variant={
                      project.status === 'completed' ? 'default' :
                      project.status === 'active' ? 'secondary' :
                      project.status === 'planning' ? 'outline' : 'secondary'
                    } className="text-2xs sm:text-xs px-2 py-0.5 whitespace-nowrap">
                      {project.status}
                    </Badge>
                    <Badge variant={
                      project.healthStatus === 'healthy' ? 'default' :
                      project.healthStatus === 'warning' ? 'secondary' : 'destructive'
                    } className="text-2xs sm:text-xs px-2 py-0.5 whitespace-nowrap">
                      {project.healthStatus === 'healthy' ? '✅' : 
                       project.healthStatus === 'warning' ? '⚠️' : '🚨'} {project.healthStatus}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>{project.taskCount} tasks</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>{project.completedTasks} completed</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{project.overdueTasks} overdue</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{project.teamMembers} members</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-4 min-w-[120px] sm:min-w-[160px]">
                  <div className="text-center sm:text-right">
                    <p className="text-xs sm:text-sm font-medium">{project.completionRate.toFixed(1)}%</p>
                    <p className="text-2xs sm:text-xs text-muted-foreground">completion</p>
                  </div>
                  <Progress value={project.completionRate} className="w-20 sm:w-24" />
                  <div className="text-center sm:text-right">
                    <p className="text-xs sm:text-sm font-medium">{project.riskScore}</p>
                    <p className="text-2xs sm:text-xs text-muted-foreground">risk score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate project health metrics
function calculateProjectHealth(project: Project, tasks: Task[]): Omit<ProjectWithHealth, keyof Project> {
  const now = new Date();
  
  // Basic task metrics
  const taskCount = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length;
  const blockedTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  
  // Calculate completion rate
  const completionRate = taskCount > 0 ? (completedTasks / taskCount) * 100 : 0;
  
  // Calculate on-time delivery rate
  const completedOnTime = tasks.filter(t => 
    t.status === 'completed' && 
    t.dueDate && 
    new Date(t.updatedAt) <= new Date(t.dueDate)
  ).length;
  const onTimeDelivery = completedTasks > 0 ? (completedOnTime / completedTasks) * 100 : 0;
  
  // Calculate days overdue (for project due date)
  let daysOverdue = 0;
  if (project.dueDate && new Date(project.dueDate) < now && project.status !== 'completed') {
    daysOverdue = Math.ceil((now.getTime() - new Date(project.dueDate).getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Calculate risk score (0-100, higher is worse)
  let riskScore = 0;
  
  // Project status risk
  if (project.status === 'planning') riskScore += 10;
  if (project.status === 'archived') riskScore += 5;
  
  // Timeline risk
  if (daysOverdue > 30) riskScore += 40;
  else if (daysOverdue > 7) riskScore += 30;
  else if (daysOverdue > 0) riskScore += 20;
  
  // Task completion risk
  if (completionRate < 30) riskScore += 25;
  else if (completionRate < 60) riskScore += 15;
  else if (completionRate < 80) riskScore += 5;
  
  // Overdue tasks risk
  if (overdueTasks > taskCount * 0.5) riskScore += 20;
  else if (overdueTasks > taskCount * 0.25) riskScore += 10;
  
  // Blocked tasks risk
  if (blockedTasks > 0) riskScore += blockedTasks * 5;
  
  // On-time delivery risk
  if (onTimeDelivery < 70) riskScore += 15;
  else if (onTimeDelivery < 85) riskScore += 10;
  
  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);
  
  // Determine health status
  let healthStatus: 'healthy' | 'warning' | 'critical';
  if (riskScore >= 70) healthStatus = 'critical';
  else if (riskScore >= 40) healthStatus = 'warning';
  else healthStatus = 'healthy';
  
  // Estimate team members (simplified)
  const teamMembers = Math.max(1, Math.ceil(taskCount / 5)); // Rough estimate
  
  return {
    taskCount,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    teamMembers,
    riskScore,
    healthStatus,
    completionRate,
    onTimeDelivery,
    daysOverdue,
    blockedTasks
  };
} 