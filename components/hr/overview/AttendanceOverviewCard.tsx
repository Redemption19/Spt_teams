'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp } from 'lucide-react';
import { AttendanceService } from '@/lib/attendance-service';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
  changePercentage: number;
  displayDate?: string;
  isCurrentDate?: boolean;
}

interface AttendanceOverviewCardProps {
  shouldShowCrossWorkspace?: boolean;
  allWorkspaces?: any[];
}

export default function AttendanceOverviewCard({ 
  shouldShowCrossWorkspace = false, 
  allWorkspaces = [] 
}: AttendanceOverviewCardProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0,
    changePercentage: 0,
    displayDate: '',
    isCurrentDate: true
  });

  useEffect(() => {
    const fetchAttendanceStats = async () => {
      if (!currentWorkspace?.id) {
        return;
      }

      try {
        setLoading(true);
        
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (shouldShowCrossWorkspace && allWorkspaces.length > 0) {
          // Cross-workspace: Use getMultiWorkspaceStats for aggregated data
          const workspaceIds = allWorkspaces.map(workspace => workspace.id);
          
          // Get today's stats across all workspaces
          const todayStats = await AttendanceService.getMultiWorkspaceStats(workspaceIds, today);
          
          let displayStats = todayStats;
          let displayDate = format(today, 'yyyy-MM-dd');
          let isCurrentDate = true;
          
          // If no attendance data for today, try to get the most recent data
          if (todayStats.present === 0 && todayStats.absent === 0 && todayStats.late === 0) {
            // Try the last 30 days to find recent attendance data
            for (let i = 1; i <= 30; i++) {
              const checkDate = new Date();
              checkDate.setDate(checkDate.getDate() - i);
              
              const recentStats = await AttendanceService.getMultiWorkspaceStats(workspaceIds, checkDate);
              
              if (recentStats.present > 0 || recentStats.absent > 0 || recentStats.late > 0) {
                displayStats = recentStats;
                displayDate = format(checkDate, 'yyyy-MM-dd');
                isCurrentDate = false;
                break;
              }
            }
          }
          
          // Get yesterday's stats for comparison (relative to display date)
          const comparisonDate = new Date(displayDate);
          comparisonDate.setDate(comparisonDate.getDate() - 1);
          
          const yesterdayStats = await AttendanceService.getMultiWorkspaceStats(workspaceIds, comparisonDate);
          
          // Calculate change percentage
          const changePercentage = yesterdayStats.attendanceRate > 0 ? 
            ((displayStats.attendanceRate - yesterdayStats.attendanceRate) / yesterdayStats.attendanceRate) * 100 : 0;

          setStats({
            present: displayStats.present,
            absent: displayStats.absent,
            late: displayStats.late,
            attendanceRate: displayStats.attendanceRate,
            changePercentage,
            displayDate,
            isCurrentDate
          });
        } else {
          // Single workspace: Use getAttendanceStats for current workspace
          const todayStats = await AttendanceService.getAttendanceStats(currentWorkspace.id, today);
          
          let displayStats = todayStats;
          let displayDate = format(today, 'yyyy-MM-dd');
          let isCurrentDate = true;
          
          // If no attendance data for today, try to get the most recent data
          if (todayStats.present === 0 && todayStats.absent === 0 && todayStats.late === 0) {
            // Try the last 30 days to find recent attendance data
            for (let i = 1; i <= 30; i++) {
              const checkDate = new Date();
              checkDate.setDate(checkDate.getDate() - i);
              
              const recentStats = await AttendanceService.getAttendanceStats(currentWorkspace.id, checkDate);
              
              if (recentStats.present > 0 || recentStats.absent > 0 || recentStats.late > 0) {
                displayStats = recentStats;
                displayDate = format(checkDate, 'yyyy-MM-dd');
                isCurrentDate = false;
                break;
              }
            }
          }
          
          // Get yesterday's stats for comparison (relative to display date)
          const comparisonDate = new Date(displayDate);
          comparisonDate.setDate(comparisonDate.getDate() - 1);
          
          const yesterdayStats = await AttendanceService.getAttendanceStats(currentWorkspace.id, comparisonDate);
          
          // Calculate change percentage
          const changePercentage = yesterdayStats.attendanceRate > 0 ? 
            ((displayStats.attendanceRate - yesterdayStats.attendanceRate) / yesterdayStats.attendanceRate) * 100 : 0;

          setStats({
            present: displayStats.present,
            absent: displayStats.absent,
            late: displayStats.late,
            attendanceRate: displayStats.attendanceRate,
            changePercentage,
            displayDate,
            isCurrentDate
          });
        }
      } catch (error) {
        console.error('Error fetching attendance stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load attendance statistics',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceStats();
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
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base font-medium">Attendance</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground self-start sm:self-center" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-6 sm:h-8 w-16 sm:w-20 bg-muted rounded animate-pulse mb-2" />
          <div className="h-3 w-12 sm:w-16 bg-muted rounded animate-pulse mb-3 sm:mb-4" />
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <div className="h-5 sm:h-6 w-12 sm:w-14 bg-muted rounded animate-pulse" />
            <div className="h-5 sm:h-6 w-12 sm:w-14 bg-muted rounded animate-pulse" />
            <div className="h-5 sm:h-6 w-10 sm:w-12 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-enhanced hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0 pb-2 sm:pb-3">
        <div className="flex flex-col min-w-0 flex-1">
          <CardTitle className="text-sm sm:text-base font-medium truncate">
            {shouldShowCrossWorkspace ? 'Attendance (All Workspaces)' : 'Attendance'}
          </CardTitle>
          {stats.displayDate && (
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-1">
              <span>{stats.isCurrentDate ? 'Today' : `Data from ${stats.displayDate}`}</span>
              {!stats.isCurrentDate && (
                <span className="text-amber-600 font-medium">(Most recent)</span>
              )}
            </div>
          )}
        </div>
        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 self-start sm:self-center" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xl sm:text-2xl font-bold mb-1">{stats.attendanceRate.toFixed(1)}%</div>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
          <div className="flex items-center flex-shrink-0">
            {getTrendIcon(stats.changePercentage)}
            <span className="ml-1">{formatTrend(stats.changePercentage)}</span>
          </div>
          <span className="ml-1 truncate">from yesterday</span>
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <Badge variant="default" className="text-xs sm:text-sm bg-green-100 text-green-800 hover:bg-green-200 transition-colors px-2 py-1">
            <span className="font-medium">{stats.present}</span>
            <span className="ml-1 hidden sm:inline">Present</span>
            <span className="ml-1 sm:hidden">P</span>
          </Badge>
          <Badge variant="destructive" className="text-xs sm:text-sm px-2 py-1">
            <span className="font-medium">{stats.absent}</span>
            <span className="ml-1 hidden sm:inline">Absent</span>
            <span className="ml-1 sm:hidden">A</span>
          </Badge>
          {stats.late > 0 && (
            <Badge variant="outline" className="text-xs sm:text-sm border-yellow-500 text-yellow-700 hover:bg-yellow-50 transition-colors px-2 py-1">
              <span className="font-medium">{stats.late}</span>
              <span className="ml-1 hidden sm:inline">Late</span>
              <span className="ml-1 sm:hidden">L</span>
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}