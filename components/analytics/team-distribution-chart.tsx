// src/components/analytics/team-distribution-chart.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { TeamService } from '@/lib/team-service';
import { TaskService } from '@/lib/task-service';
import { UserService } from '@/lib/user-service';
import { Task } from '@/lib/types';

interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
    preset: 'last-7-days' | 'last-30-days' | 'last-3-months' | 'last-year';
  };
}

interface TeamDistributionProps {
  workspaceId: string;
  userId: string;
  userRole: 'member' | 'admin' | 'owner';
  filters: AnalyticsFilters;
  refreshTrigger?: boolean;
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
}

interface TeamDistributionData {
  name: string;
  value: number;
  color: string;
  tasks: number;
  completion: number;
  members: number;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">Tasks: {data.tasks}</p>
        <p className="text-sm text-muted-foreground">Completion: {data.completion.toFixed(1)}%</p>
        <p className="text-sm text-muted-foreground">Members: {data.members}</p>
      </div>
    );
  }
  return null;
};

export default function TeamDistributionChart({ 
  workspaceId, 
  userId, 
  userRole, 
  filters, 
  refreshTrigger,
  showAllWorkspaces = false,
  accessibleWorkspaces = []
}: TeamDistributionProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeamDistributionData[]>([]);

  const fetchTeamDistribution = useCallback(async () => {
    if (!workspaceId || !userId) return;
    
    try {
      setLoading(true);
      
      // Determine workspace IDs to load from
      const workspaceIds = showAllWorkspaces && accessibleWorkspaces?.length 
        ? accessibleWorkspaces.map(w => w.id)
        : [workspaceId];
      
      let allTeams: any[] = [];
      
      if (userRole === 'member') {
        // Members can only see their own teams from current workspace
        const userTeams = await TeamService.getUserTeams(userId, workspaceId);
        allTeams = userTeams.filter(ut => ut.team.workspaceId === workspaceId).map(ut => ut.team);
      } else {
        // Admins and owners can see teams from multiple workspaces if enabled
        for (const wsId of workspaceIds) {
          const wsTeams = await TeamService.getWorkspaceTeams(wsId);
          wsTeams.forEach(team => {
            if (!allTeams.some(t => t.id === team.id)) {
              allTeams.push(team);
            }
          });
        }
      }
      
      if (allTeams.length === 0) {
        setData([]);
        return;
      }
      
      const teamDistribution: TeamDistributionData[] = [];
      
      for (let i = 0; i < allTeams.length; i++) {
        const team = allTeams[i];
        
        // Get team members
        const teamMembers = await TeamService.getTeamMembers(team.id);
        
        // Get all tasks from relevant workspaces
        let allTasks: Task[] = [];
        if (userRole === 'member') {
          // For members, get their own tasks from current workspace only
          const [assignedTasks, createdTasks] = await Promise.all([
            TaskService.getUserAssignedTasks(userId, workspaceId),
            TaskService.getUserCreatedTasks(userId, workspaceId)
          ]);
          
          const allUserTasks = [...assignedTasks];
          createdTasks.forEach((task: Task) => {
            if (!allUserTasks.some((t: Task) => t.id === task.id)) {
              allUserTasks.push(task);
            }
          });
          
          allTasks = allUserTasks;
        } else {
          // For admins/owners, get tasks from relevant workspaces
          for (const wsId of workspaceIds) {
            const wsTasks = await TaskService.getWorkspaceTasks(wsId);
            wsTasks.forEach(task => {
              if (!allTasks.some(t => t.id === task.id)) {
                allTasks.push(task);
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
        
        // Get tasks assigned to team members
        const teamMemberIds = teamMembers.map(tm => tm.userId);
        const teamTasks = tasksInPeriod.filter((task: Task) => 
          task.assigneeId && teamMemberIds.includes(task.assigneeId) ||
          task.createdBy && teamMemberIds.includes(task.createdBy)
        );
        
        const completedTasks = teamTasks.filter((task: Task) => task.status === 'completed').length;
        const completionRate = teamTasks.length > 0 ? (completedTasks / teamTasks.length) * 100 : 0;
        
        teamDistribution.push({
          name: team.name,
          value: teamTasks.length,
          color: COLORS[i % COLORS.length],
          tasks: teamTasks.length,
          completion: completionRate,
          members: teamMembers.length
        });
      }
      
      setData(teamDistribution);
      
    } catch (error) {
      console.error('Error fetching team distribution:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [
    workspaceId, 
    userId, 
    userRole, 
    filters.dateRange,
    showAllWorkspaces, 
    accessibleWorkspaces,
  ]);

  useEffect(() => {
    fetchTeamDistribution();
  }, [fetchTeamDistribution, refreshTrigger]);

  if (loading) {
    return (
      <Card className="card-enhanced border border-border/30">
        <CardHeader>
          <CardTitle>Team Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading team data...</p>
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
        <CardTitle>Team Distribution</CardTitle>
      </CardHeader>
      <CardContent>
          <div className="flex items-center justify-center h-80">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Team Data</h3>
              <p className="text-sm text-muted-foreground">
                {userRole === 'member' 
                  ? 'You are not assigned to any teams with tasks in the selected period.'
                  : 'No teams with task activity found in the selected period.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalTasks = data.reduce((sum, team) => sum + team.value, 0);

  return (
    <Card className="card-enhanced border border-border/30 hover:border-primary/20 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Team Distribution
          <div className="text-sm text-muted-foreground">
            {showAllWorkspaces && (
              <span className="mr-2">🌐 All Workspaces ({accessibleWorkspaces?.length || 1})</span>
            )}
            {userRole === 'member' && '👤 My Teams'}
            {userRole === 'admin' && !showAllWorkspaces && '⚙️ Workspace Teams'}
            {userRole === 'admin' && showAllWorkspaces && '⚙️ All Workspace Teams'}
            {userRole === 'owner' && !showAllWorkspaces && '🔧 Workspace Teams'}
            {userRole === 'owner' && showAllWorkspaces && '🔧 All Teams'}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
                data={data}
              cx="50%"
              cy="50%"
                labelLine={false}
                label={({ name, percent }) => 
                  percent > 5 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                }
              outerRadius={80}
                fill="#8884d8"
              dataKey="value"
            >
                {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>
                    {value} ({entry.payload.tasks} tasks)
                  </span>
                )}
            />
          </PieChart>
        </ResponsiveContainer>
        </div>
        
        {/* Team summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Teams</p>
            <p className="text-lg font-semibold">{data.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Tasks</p>
            <p className="text-lg font-semibold">{totalTasks}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Avg Completion</p>
            <p className="text-lg font-semibold">
              {data.length > 0 
                ? Math.round(data.reduce((sum, team) => sum + team.completion, 0) / data.length)
                : 0
              }%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Members</p>
            <p className="text-lg font-semibold">
              {data.reduce((sum, team) => sum + team.members, 0)}
            </p>
          </div>
        </div>
        
        {/* Top performing team */}
        {data.length > 0 && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Top Performing Team</p>
                <p className="text-xs text-muted-foreground">Highest completion rate</p>
              </div>
              <div className="text-right">
                {(() => {
                  const topTeam = data.reduce((prev, current) => 
                    prev.completion > current.completion ? prev : current
                  );
                  return (
                    <div>
                      <p className="font-semibold">{topTeam.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {topTeam.completion.toFixed(1)}% completion
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