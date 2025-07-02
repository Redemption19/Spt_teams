// src/components/analytics/productivity-trends-chart.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from 'recharts';
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

interface ProductivityTrendsProps {
  workspaceId: string;
  userId: string;
  userRole: 'member' | 'admin' | 'owner';
  filters: AnalyticsFilters;
  refreshTrigger?: boolean;
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
}

interface ProductivityTrendData {
  week: string;
  individual: number;
  team: number;
  period: Date;
}

// Helper for Recharts Tooltip styling
const CustomTooltip = ({ active, payload, label, itemStyle, labelStyle, contentStyle }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={contentStyle}>
        <p style={labelStyle}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ ...itemStyle, color: entry.stroke }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProductivityTrendsChart({ 
  workspaceId, 
  userId, 
  userRole, 
  filters, 
  refreshTrigger,
  showAllWorkspaces = false,
  accessibleWorkspaces = []
}: ProductivityTrendsProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProductivityTrendData[]>([]);

  const fetchProductivityTrends = useCallback(async () => {
    if (!workspaceId || !userId) return;
    
    try {
      setLoading(true);
      
      // Determine workspace IDs to load from
      const workspaceIds = showAllWorkspaces && accessibleWorkspaces?.length 
        ? accessibleWorkspaces.map(w => w.id)
        : [workspaceId];
      
      const { from, to } = filters.dateRange;
      
      // Get weekly intervals
      const weeks = getWeeklyIntervals(from, to);
      const trendData: ProductivityTrendData[] = [];
      
      for (const week of weeks) {
        let userTasks: Task[] = [];
        let allTasks: Task[] = [];
        
        if (userRole === 'member') {
          // Get user's own tasks from current workspace only
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
          
          userTasks = allUserTasks.filter((task: Task) => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= week.start && taskDate <= week.end;
          });
          
          allTasks = userTasks; // For members, individual and team are the same
        } else {
          // Get all tasks from relevant workspaces
          allTasks = [];
          for (const wsId of workspaceIds) {
            const wsTasks = await TaskService.getWorkspaceTasks(wsId);
            wsTasks.forEach(task => {
              if (!allTasks.some(t => t.id === task.id)) {
                allTasks.push(task);
              }
            });
          }
          
          allTasks = allTasks.filter((task: Task) => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= week.start && taskDate <= week.end;
          });
          
          // For admins/owners, also get their personal tasks from current workspace
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
          
          userTasks = allUserTasks.filter((task: Task) => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= week.start && taskDate <= week.end;
          });
        }
        
        const individualProductivity = calculateProductivityScore(userTasks);
        const teamProductivity = calculateProductivityScore(allTasks);
        
        trendData.push({
          week: week.label,
          individual: individualProductivity,
          team: teamProductivity,
          period: week.start
        });
      }
      
      setData(trendData);
      
    } catch (error) {
      console.error('Error fetching productivity trends:', error);
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
    fetchProductivityTrends();
  }, [fetchProductivityTrends, refreshTrigger]);

  // Helper functions
  const getWeeklyIntervals = (from: Date, to: Date) => {
    const intervals = [];
    const current = new Date(from);
    let weekNum = 1;
    
    while (current < to) {
      const start = new Date(current);
      const end = new Date(current);
      end.setDate(end.getDate() + 7);
      
      intervals.push({
        start,
        end: end > to ? to : end,
        label: `W${weekNum}`
      });
      
      current.setDate(current.getDate() + 7);
      weekNum++;
      
      if (weekNum > 8) break; // Max 8 weeks for readability
    }
    
    return intervals;
  };

  const calculateProductivityScore = (tasks: Task[]): number => {
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const onTimeTasks = tasks.filter(t => 
      t.status === 'completed' && 
      t.dueDate && 
      new Date(t.updatedAt) <= new Date(t.dueDate)
    ).length;
    
    const completionRate = (completedTasks / tasks.length) * 100;
    const onTimeRate = completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0;
    
    // Weighted score: 70% completion rate + 30% on-time rate
    return Math.round((completionRate * 0.7) + (onTimeRate * 0.3));
  };

  if (loading) {
    return (
      <Card className="card-enhanced border border-border/30">
        <CardHeader>
          <CardTitle>Productivity Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-72">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading trend data...</p>
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
          <CardTitle>Productivity Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-72">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Trend Data</h3>
              <p className="text-sm text-muted-foreground">
                Not enough data to show productivity trends for the selected period.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-enhanced border border-border/30 hover:border-primary/20 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Productivity Trends
          <div className="text-sm text-muted-foreground">
            {showAllWorkspaces && (
              <span className="mr-2">🌐 All Workspaces ({accessibleWorkspaces?.length || 1})</span>
            )}
            {userRole === 'member' && '👤 Personal View'}
            {userRole === 'admin' && !showAllWorkspaces && '⚙️ Team View'}
            {userRole === 'admin' && showAllWorkspaces && '⚙️ All Workspace View'}
            {userRole === 'owner' && !showAllWorkspaces && '🔧 Workspace View'}
            {userRole === 'owner' && showAllWorkspaces && '🔧 Full View'}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="week" className="stroke-muted-foreground" />
            <YAxis className="stroke-muted-foreground" />
            <Tooltip
              content={<CustomTooltip />}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                fontSize: '14px',
                fontWeight: '500',
                padding: '12px 16px',
              }}
              labelStyle={{
                color: 'hsl(var(--foreground))',
                fontWeight: '600',
                marginBottom: '4px',
              }}
              itemStyle={{
                color: 'hsl(var(--foreground))',
              }}
            />
            <Line
              type="monotone"
              dataKey="individual"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              name="Individual"
            />
            <Line
              type="monotone"
              dataKey="team"
              stroke="hsl(var(--accent))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
              name="Team"
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Trends summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Avg Individual</p>
            <p className="text-lg font-semibold">
              {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.individual, 0) / data.length) : 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Avg Team</p>
            <p className="text-lg font-semibold">
              {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.team, 0) / data.length) : 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Best Week</p>
            <p className="text-lg font-semibold">
              {data.length > 0 ? data.reduce((prev, current) => 
                prev.individual > current.individual ? prev : current
              ).week : '-'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Trend</p>
            <p className="text-lg font-semibold">
              {data.length >= 2 ? (
                data[data.length - 1].individual > data[0].individual ? 
                  <span className="text-green-600">↗️ Up</span> : 
                  data[data.length - 1].individual < data[0].individual ?
                    <span className="text-red-600">↘️ Down</span> :
                    <span className="text-muted-foreground">→ Stable</span>
              ) : '-'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}