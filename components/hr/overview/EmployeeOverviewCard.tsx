'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp } from 'lucide-react';
import { EmployeeService } from '@/lib/employee-service';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';

interface EmployeeStats {
  total: number;
  active: number;
  onLeave: number;
  newHires: number;
  changePercentage: number;
}

interface EmployeeOverviewCardProps {
  shouldShowCrossWorkspace?: boolean;
  allWorkspaces?: any[];
}

export default function EmployeeOverviewCard({ 
  shouldShowCrossWorkspace = false, 
  allWorkspaces = [] 
}: EmployeeOverviewCardProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EmployeeStats>({
    total: 0,
    active: 0,
    onLeave: 0,
    newHires: 0,
    changePercentage: 0
  });

  useEffect(() => {
    const fetchEmployeeStats = async () => {
      if (!currentWorkspace?.id) return;

      try {
        setLoading(true);
        
        if (shouldShowCrossWorkspace && allWorkspaces.length > 0) {
          // Cross-workspace: Aggregate data from all workspaces
          const allEmployeesData = await Promise.all(
            allWorkspaces.map(workspace => EmployeeService.getWorkspaceEmployees(workspace.id))
          );
          
          const allEmployees = allEmployeesData.flat();
          
          // Calculate aggregated stats
          const total = allEmployees.length;
          const active = allEmployees.filter(emp => emp.status === 'active').length;
          const onLeave = allEmployees.filter(emp => emp.status === 'on-leave').length;
          
          // Calculate new hires (employees added in the last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const newHires = allEmployees.filter(emp => {
            const createdAt = emp.createdAt instanceof Date ? emp.createdAt : new Date(emp.createdAt);
            return createdAt >= thirtyDaysAgo;
          }).length;

          // Calculate change percentage
          const changePercentage = total > 0 ? ((newHires / total) * 100) : 0;

          setStats({
            total,
            active,
            onLeave,
            newHires,
            changePercentage
          });
        } else {
          // Single workspace: Fetch employees for current workspace only
          const employees = await EmployeeService.getWorkspaceEmployees(currentWorkspace.id);
          
          // Calculate stats
          const total = employees.length;
          const active = employees.filter(emp => emp.status === 'active').length;
          const onLeave = employees.filter(emp => emp.status === 'on-leave').length;
          
          // Calculate new hires (employees added in the last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const newHires = employees.filter(emp => {
            const createdAt = emp.createdAt instanceof Date ? emp.createdAt : new Date(emp.createdAt);
            return createdAt >= thirtyDaysAgo;
          }).length;

          // Calculate change percentage
          const changePercentage = total > 0 ? ((newHires / total) * 100) : 0;

          setStats({
            total,
            active,
            onLeave,
            newHires,
            changePercentage
          });
        }
      } catch (error) {
        console.error('Error fetching employee stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load employee statistics',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeStats();
  }, [currentWorkspace?.id, shouldShowCrossWorkspace, allWorkspaces, toast]);

  const formatTrend = (percentage: number): string => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (percentage < 0) {
      return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    }
    return <TrendingUp className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex gap-2">
            <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-enhanced">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {shouldShowCrossWorkspace ? 'Employees (All Workspaces)' : 'Employees'}
        </CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.total}</div>
        <div className="flex items-center text-xs text-muted-foreground mb-4">
          {getTrendIcon(stats.changePercentage)}
          <span className="ml-1">{formatTrend(stats.changePercentage)} from last month</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {stats.active} Active
          </Badge>
          <Badge variant="outline" className="text-xs">
            {stats.onLeave} On Leave
          </Badge>
          {stats.newHires > 0 && (
            <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
              {stats.newHires} New
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}