// src/components/analytics/performance-chart.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
} from 'recharts';
import { TaskService } from '@/lib/task-service';
import { ProjectService } from '@/lib/project-service';
import { UserService } from '@/lib/user-service';
import { Task } from '@/lib/types';

interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
    preset: 'last-7-days' | 'last-30-days' | 'last-3-months' | 'last-year';
  };
}

interface PerformanceChartProps {
  title?: string;
  dataKey1?: string;
  dataKey2?: string;
  name1?: string;
  name2?: string;
  workspaceId: string;
  userId: string;
  userRole: 'member' | 'admin' | 'owner';
  filters: AnalyticsFilters;
  refreshTrigger?: boolean;
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
}

interface PerformanceData {
  month: string;
  productivity: number;
  tasks: number;
  efficiency: number;
  completed: number;
}

// Helper for Recharts Tooltip styling
const CustomTooltip = ({ active, payload, label, itemStyle, labelStyle, contentStyle }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={contentStyle}>
        <p style={labelStyle}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ ...itemStyle, color: entry.stroke || entry.fill }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function PerformanceChart({
  title = "Monthly Performance Overview",
  dataKey1 = "productivity",
  dataKey2 = "efficiency",
  name1 = "Productivity",
  name2 = "Efficiency",
  workspaceId,
  userId,
  userRole,
  filters,
  refreshTrigger,
  showAllWorkspaces = false,
  accessibleWorkspaces = []
}: PerformanceChartProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PerformanceData[]>([]);

  const accessibleWorkspaceIds = accessibleWorkspaces?.map(w => w.id).join(',') || '';
  const filtersDateRangeFrom = filters.dateRange.from.getTime();
  const filtersDateRangeTo = filters.dateRange.to.getTime();
  const filtersDateRangePreset = filters.dateRange.preset;

  const fetchPerformanceData = useCallback(async () => {
    if (!workspaceId || !userId) return;
    
    try {
      setLoading(true);
      
      // Determine workspace IDs to load from
      const workspaceIds = showAllWorkspaces && accessibleWorkspaces?.length 
        ? accessibleWorkspaces.map(w => w.id)
        : [workspaceId];
      
      // Get time intervals based on preset
      const intervals = getTimeIntervals(new Date(filtersDateRangeFrom), new Date(filtersDateRangeTo), filtersDateRangePreset);
      
      const performanceData: PerformanceData[] = [];
      
      for (const interval of intervals) {
        let allTasks: Task[] = [];
        
        if (userRole === 'member') {
          // Members see only their own data from current workspace
          const [assignedTasks, createdTasks] = await Promise.all([
            TaskService.getUserAssignedTasks(userId, workspaceId),
            TaskService.getUserCreatedTasks(userId, workspaceId)
          ]);
          
          // Combine and deduplicate tasks
          const allUserTasks = [...assignedTasks];
          createdTasks.forEach((task: Task) => {
            if (!allUserTasks.some((t: Task) => t.id === task.id)) {
              allUserTasks.push(task);
            }
          });
          
          allTasks = allUserTasks;
        } else {
          // Admins and owners see workspace data - potentially from multiple workspaces
          for (const wsId of workspaceIds) {
            const wsTasks = await TaskService.getWorkspaceTasks(wsId);
            
            // Add tasks avoiding duplicates
            wsTasks.forEach(task => {
              if (!allTasks.some(t => t.id === task.id)) {
                allTasks.push(task);
              }
            });
          }
        }
        
        // Filter by date range for this interval
        const tasks = allTasks.filter((task: Task) => {
          const taskDate = new Date(task.createdAt);
          return taskDate >= interval.start && taskDate <= interval.end;
        });
        
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const totalTasks = tasks.length;
        
        // Calculate productivity score
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const onTimeTasks = tasks.filter(t => 
          t.status === 'completed' && 
          t.dueDate && 
          new Date(t.updatedAt) <= new Date(t.dueDate)
        ).length;
        const onTimeRate = completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0;
        const productivity = Math.round((completionRate * 0.7) + (onTimeRate * 0.3));
        const efficiency = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        performanceData.push({
          month: interval.label,
          productivity,
          tasks: totalTasks,
          efficiency,
          completed: completedTasks
        });
      }
      
      setData(performanceData);
      
    } catch (error) {
      console.error('Error fetching performance data:', error);
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, [
    workspaceId, 
    userId, 
    userRole, 
    filtersDateRangeFrom, 
    filtersDateRangeTo, 
    filtersDateRangePreset,
    showAllWorkspaces, 
    accessibleWorkspaces
  ]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData, refreshTrigger]);

  // Helper function to get time intervals
  const getTimeIntervals = (from: Date, to: Date, preset: string) => {
    const intervals = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (preset === 'last-year') {
      // Monthly intervals for year view
      const current = new Date(from);
      let monthNum = 0;
      
      while (current < to && monthNum < 12) {
        const start = new Date(current);
        const end = new Date(current);
        end.setMonth(end.getMonth() + 1);
        
        intervals.push({
          start,
          end: end > to ? to : end,
          label: months[start.getMonth()]
        });
        
        current.setMonth(current.getMonth() + 1);
        monthNum++;
      }
    } else if (preset === 'last-3-months') {
      // Weekly intervals for 3 months
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
        
        if (weekNum > 12) break; // Max 12 weeks for readability
      }
    } else {
      // Daily/weekly intervals for shorter periods
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
    }
    
    return intervals;
  };

  if (loading) {
    return (
      <Card className="card-enhanced border border-border/30">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading performance data...</p>
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
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                📊
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Data Available</h3>
              <p className="text-sm text-muted-foreground">
                {userRole === 'member' 
                  ? 'No tasks found in the selected period. Create some tasks to see performance data.'
                  : 'No data found for the selected period. Try adjusting the date range.'
                }
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
          {title}
          <div className="text-sm text-muted-foreground">
            {showAllWorkspaces && (
              <span className="mr-2">🌐 All Workspaces ({accessibleWorkspaces?.length || 1})</span>
            )}
            {userRole === 'member' && '👤 Personal View'}
            {userRole === 'admin' && !showAllWorkspaces && '⚙️ Workspace View'}
            {userRole === 'admin' && showAllWorkspaces && '⚙️ All Workspace View'}
            {userRole === 'owner' && !showAllWorkspaces && '🔧 Workspace Access'}
            {userRole === 'owner' && showAllWorkspaces && '🔧 Full Access'}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="month" 
              className="stroke-muted-foreground" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="stroke-muted-foreground" 
              tick={{ fontSize: 12 }}
            />
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
            <Area 
              type="monotone" 
              dataKey={dataKey1} 
              stackId="1" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary))" 
              fillOpacity={0.2} 
              name={name1}
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey={dataKey2} 
              stackId="2" 
              stroke="hsl(var(--accent))" 
              fill="hsl(var(--accent))" 
              fillOpacity={0.2} 
              name={name2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Data summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Avg {name1}</p>
            <p className="text-lg font-semibold">
              {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + (Number(d[dataKey1 as keyof PerformanceData]) || 0), 0) / data.length) : 0}
              {dataKey1.includes('productivity') || dataKey1.includes('efficiency') ? '%' : ''}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Avg {name2}</p>
            <p className="text-lg font-semibold">
              {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + (Number(d[dataKey2 as keyof PerformanceData]) || 0), 0) / data.length) : 0}
              {dataKey2.includes('productivity') || dataKey2.includes('efficiency') ? '%' : ''}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Tasks</p>
            <p className="text-lg font-semibold">
              {data.reduce((sum, d) => sum + d.tasks, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-lg font-semibold">
              {data.reduce((sum, d) => sum + d.completed, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}