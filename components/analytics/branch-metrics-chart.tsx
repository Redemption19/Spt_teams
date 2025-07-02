// src/components/analytics/branch-metrics-chart.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from 'recharts';
import { BranchService } from '@/lib/branch-service';
import { TaskService } from '@/lib/task-service';
import { ProjectService } from '@/lib/project-service';
import { UserService } from '@/lib/user-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { Task, Branch, Project } from '@/lib/types';

interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
    preset: 'last-7-days' | 'last-30-days' | 'last-3-months' | 'last-year';
  };
}

interface BranchMetricsProps {
  workspaceId: string;
  userId: string;
  userRole: 'member' | 'admin' | 'owner';
  filters: AnalyticsFilters;
  refreshTrigger?: boolean;
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
}

interface BranchMetricsData {
  branch: string;
  tasks: number;
  completed: number;
  efficiency: number;
  activeUsers: number;
}

// Helper for Recharts Tooltip styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.fill }} className="text-sm">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function BranchMetricsChart({ 
  workspaceId, 
  userId, 
  userRole, 
  filters, 
  refreshTrigger,
  showAllWorkspaces = false,
  accessibleWorkspaces = []
}: BranchMetricsProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BranchMetricsData[]>([]);

  const fetchBranchMetrics = useCallback(async () => {
    if (!workspaceId || !userId) {
      console.log('BranchMetrics: Missing required data:', { workspaceId, userId });
      return;
    }
    
    console.log('🏢 BranchMetrics: Starting data fetch...', { workspaceId, userId, userRole, showAllWorkspaces });
    
    try {
      setLoading(true);
      
      // Determine workspace IDs to load from
      const workspaceIds = showAllWorkspaces && accessibleWorkspaces?.length 
        ? accessibleWorkspaces.map(w => w.id)
        : [workspaceId];
      
      // Get workspace information for each workspace
      let allBranches: Branch[] = [];
      let sourceWorkspaceIds: string[] = [];

      for (const wsId of workspaceIds) {
        // Get current workspace to check if it's a sub-workspace
        const currentWorkspace = await WorkspaceService.getWorkspace(wsId);
        
        // Determine which workspace to load branches from
        // For sub-workspaces, load from parent workspace (same logic as other components)
        const sourceWorkspaceId = currentWorkspace?.workspaceType === 'sub' 
          ? currentWorkspace.parentWorkspaceId || wsId
          : wsId;
        
        sourceWorkspaceIds.push(sourceWorkspaceId);
        
        let workspaceBranches: Branch[];
        
        if (userRole === 'member') {
          // Members can only see their own branch
          const userProfile = await UserService.getUser(userId);
          if (userProfile?.branchId) {
            const branch = await BranchService.getBranch(userProfile.branchId);
            workspaceBranches = branch ? [branch] : [];
          } else {
            workspaceBranches = [];
          }
        } else {
          // Admins and owners can see branches from the source workspace
          workspaceBranches = await BranchService.getWorkspaceBranches(sourceWorkspaceId);
        }
        
        // Filter branches based on workspace type and user role
        let filteredBranches = workspaceBranches;
        
        if (currentWorkspace?.workspaceType === 'sub') {
          // For sub-workspaces, only show the bound branch
          filteredBranches = currentWorkspace.branchId 
            ? workspaceBranches.filter(b => b.id === currentWorkspace.branchId)
            : [];
        }
        
        // Add to all branches (avoid duplicates)
        filteredBranches.forEach(branch => {
          if (!allBranches.some(b => b.id === branch.id)) {
            allBranches.push(branch);
          }
        });
      }

      if (allBranches.length === 0) {
        setData([]);
        return;
      }
      
      const branchMetrics: BranchMetricsData[] = [];
      
      for (const branch of allBranches) {
        // Find the source workspace ID for this branch
        const branchSourceWorkspaceId = branch.workspaceId;
        
        // Get branch users from both source workspace and current workspace(s)
        // This handles cases where users are in sub-workspace but assigned to parent workspace branches
        let allWorkspaceUsers: any[] = [];
        
        // Load users from all relevant workspaces
        for (const wsId of workspaceIds) {
          const wsUsers = await UserService.getUsersByWorkspace(wsId);
          wsUsers.forEach(user => {
            if (!allWorkspaceUsers.some(u => u.id === user.id)) {
              allWorkspaceUsers.push(user);
            }
          });
        }
        
        // Also load from branch's source workspace if not already included
        if (!workspaceIds.includes(branchSourceWorkspaceId)) {
          const sourceUsers = await UserService.getUsersByWorkspace(branchSourceWorkspaceId);
          sourceUsers.forEach(user => {
            if (!allWorkspaceUsers.some(u => u.id === user.id)) {
              allWorkspaceUsers.push(user);
            }
          });
        }
        
        const branchUserIds = allWorkspaceUsers.filter(user => user.branchId === branch.id).map(user => user.id);
        
        // Get tasks and projects from ALL workspaces being analyzed
        // This ensures we capture all tasks/projects related to this branch
        let allTasks: Task[] = [];
        let allProjects: Project[] = [];
        
        // Load tasks and projects from all workspace IDs
        for (const wsId of workspaceIds) {
          if (userRole === 'member') {
            // For members, get their own tasks from current workspace
            const [assignedTasks, createdTasks] = await Promise.all([
              TaskService.getUserAssignedTasks(userId, wsId),
              TaskService.getUserCreatedTasks(userId, wsId)
            ]);
            
            const allUserTasks = [...assignedTasks];
            createdTasks.forEach((task: Task) => {
              if (!allUserTasks.some((t: Task) => t.id === task.id)) {
                allUserTasks.push(task);
              }
            });
            
            // Add tasks avoiding duplicates
            allUserTasks.forEach(task => {
              if (!allTasks.some(t => t.id === task.id)) {
                allTasks.push(task);
              }
            });
            
            // For members, also get projects from workspace
            const wsProjects = await ProjectService.getWorkspaceProjects(wsId);
            wsProjects.forEach(project => {
              if (!allProjects.some(p => p.id === project.id)) {
                allProjects.push(project);
              }
            });
          } else {
            // For admins/owners, get all workspace tasks and projects
            const [workspaceTasks, workspaceProjects] = await Promise.all([
              TaskService.getWorkspaceTasks(wsId),
              ProjectService.getWorkspaceProjects(wsId)
            ]);
            
            // Add tasks avoiding duplicates
            workspaceTasks.forEach(task => {
              if (!allTasks.some(t => t.id === task.id)) {
                allTasks.push(task);
              }
            });
            
            // Add projects avoiding duplicates
            workspaceProjects.forEach(project => {
              if (!allProjects.some(p => p.id === project.id)) {
                allProjects.push(project);
              }
            });
          }
        }
        
        // Filter tasks by date range
        const { from, to } = filters.dateRange;
        
        const tasksInPeriod = allTasks.filter((task: Task) => {
          const taskDate = new Date(task.createdAt);
          return taskDate >= from && taskDate <= to;
        });
        
        // Get projects that belong to this branch
        const branchProjects = allProjects.filter(project => project.branchId === branch.id);
        const branchProjectIds = new Set(branchProjects.map(p => p.id));
        
        // Get tasks related to this branch through:
        // 1. Tasks that belong to projects in this branch
        // 2. Tasks assigned to or created by users in this branch
        const branchTasks = tasksInPeriod.filter((task: Task) => {
          // Task belongs to a project in this branch
          const belongsToProjectInBranch = task.projectId && branchProjectIds.has(task.projectId);
          
          // Task is assigned to or created by a user in this branch
          const assignedToOrCreatedByBranchUser = 
            (task.assigneeId && branchUserIds.includes(task.assigneeId)) ||
            (task.createdBy && branchUserIds.includes(task.createdBy));

          return belongsToProjectInBranch || assignedToOrCreatedByBranchUser;
        });
        
        const completedTasks = branchTasks.filter((task: Task) => task.status === 'completed').length;
        const efficiency = branchTasks.length > 0 ? Math.round((completedTasks / branchTasks.length) * 100) : 0;
        
        // Count active users in this branch (users with tasks in the period)
        const activeUsers = new Set([
          ...branchTasks.map(task => task.assigneeId).filter(Boolean),
          ...branchTasks.map(task => task.createdBy).filter(Boolean)
        ]).size;
        
        branchMetrics.push({
          branch: branch.name,
          tasks: branchTasks.length,
          completed: completedTasks,
          efficiency,
          activeUsers
        });
      }
      
      setData(branchMetrics);
      
      console.log('✅ BranchMetrics: Data loaded successfully:', {
        branchCount: branchMetrics.length,
        totalTasks: branchMetrics.reduce((sum, b) => sum + b.tasks, 0),
        totalCompleted: branchMetrics.reduce((sum, b) => sum + b.completed, 0),
        branches: branchMetrics.map(b => ({ name: b.branch, tasks: b.tasks, efficiency: b.efficiency }))
      });
      
    } catch (error) {
      console.error('❌ BranchMetrics: Error loading data:', error);
      setData([]);
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
    fetchBranchMetrics();
  }, [fetchBranchMetrics, refreshTrigger]);

  if (loading) {
    return (
      <Card className="card-enhanced border border-border/30">
        <CardHeader>
          <CardTitle>Branch Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading branch data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="card-enhanced border border-border/30">
        <CardHeader>
          <CardTitle>Branch Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Branch Data</h3>
              <p className="text-sm text-muted-foreground">
                {userRole === 'member' 
                  ? 'No branch data available for your tasks in the selected period.'
                  : showAllWorkspaces
                  ? `No branches with activity found across ${accessibleWorkspaces?.length || 1} workspaces in the selected period.`
                  : 'No branches with activity found in the selected period.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalTasks = data.reduce((sum, branch) => sum + branch.tasks, 0);
  const totalCompleted = data.reduce((sum, branch) => sum + branch.completed, 0);
  const avgEfficiency = data.length > 0 ? Math.round(data.reduce((sum, branch) => sum + branch.efficiency, 0) / data.length) : 0;

  return (
    <Card className="card-enhanced border border-border/30 hover:border-primary/20 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Branch Performance Metrics
          <div className="text-sm text-muted-foreground">
            {showAllWorkspaces && (
              <span className="mr-2">🌐 All Workspaces ({accessibleWorkspaces?.length || 1})</span>
            )}
            {userRole === 'member' && '👤 My Branch'}
            {userRole === 'admin' && !showAllWorkspaces && '⚙️ Workspace Branches'}
            {userRole === 'admin' && showAllWorkspaces && '⚙️ All Workspace Branches'}
            {userRole === 'owner' && !showAllWorkspaces && '🔧 Workspace Branches'}
            {userRole === 'owner' && showAllWorkspaces && '🔧 All Branches'}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="branch" 
              className="stroke-muted-foreground"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis className="stroke-muted-foreground" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="tasks" 
              fill="hsl(var(--chart-3))" 
              radius={[4, 4, 0, 0]} 
              name="Total Tasks" 
            />
            <Bar 
              dataKey="completed" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]} 
              name="Completed Tasks" 
            />
          </BarChart>
        </ResponsiveContainer>
        
        {/* Branch summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Branches</p>
            <p className="text-lg font-semibold">{data.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Tasks</p>
            <p className="text-lg font-semibold">{totalTasks}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Completed</p>
            <p className="text-lg font-semibold">{totalCompleted}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Avg Efficiency</p>
            <p className="text-lg font-semibold">{avgEfficiency}%</p>
          </div>
        </div>
        
        {/* Top performing branch */}
        {data.length > 0 && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Most Efficient Branch</p>
                <p className="text-xs text-muted-foreground">Highest completion rate</p>
              </div>
              <div className="text-right">
                {(() => {
                  const topBranch = data.reduce((prev, current) => 
                    prev.efficiency > current.efficiency ? prev : current
                  );
                  return (
                    <div>
                      <p className="font-semibold">{topBranch.branch}</p>
                      <p className="text-sm text-muted-foreground">
                        {topBranch.efficiency}% efficiency
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}