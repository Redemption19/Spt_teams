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
}

export default function AttendanceOverviewCard() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0,
    changePercentage: 0
  });

  useEffect(() => {
    const fetchAttendanceStats = async () => {
      if (!currentWorkspace?.id) return;

      try {
        setLoading(true);
        
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Fetch today's attendance records
        const todayAttendance = await AttendanceService.getAttendanceRecords({
          workspaceId: currentWorkspace.id,
          startDate: new Date(),
          endDate: new Date()
        });
        
        // Calculate stats
        const present = todayAttendance.filter(record => 
          record.status === 'present' || record.clockIn
        ).length;
        
        const absent = todayAttendance.filter(record => 
          record.status === 'absent'
        ).length;
        
        const late = todayAttendance.filter(record => 
          record.status === 'late'
        ).length;
        
        const total = present + absent + late;
        const attendanceRate = total > 0 ? (present / total) * 100 : 0;
        
        // Calculate change percentage (comparing with yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = format(yesterday, 'yyyy-MM-dd');
        
        const yesterdayAttendance = await AttendanceService.getAttendanceRecords({
          workspaceId: currentWorkspace.id,
          startDate: yesterday,
          endDate: yesterday
        });
        
        const yesterdayPresent = yesterdayAttendance.filter(record => 
          record.status === 'present' || record.clockIn
        ).length;
        
        const yesterdayTotal = yesterdayAttendance.length;
        const yesterdayRate = yesterdayTotal > 0 ? (yesterdayPresent / yesterdayTotal) * 100 : 0;
        
        const changePercentage = yesterdayRate > 0 ? 
          ((attendanceRate - yesterdayRate) / yesterdayRate) * 100 : 0;

        setStats({
          present,
          absent,
          late,
          attendanceRate,
          changePercentage
        });
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
  }, [currentWorkspace?.id, toast]);

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
          <CardTitle className="text-sm font-medium">Attendance</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
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
        <CardTitle className="text-sm font-medium">Attendance</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</div>
        <div className="flex items-center text-xs text-muted-foreground mb-4">
          {getTrendIcon(stats.changePercentage)}
          <span className="ml-1">{formatTrend(stats.changePercentage)} from yesterday</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
            {stats.present} Present
          </Badge>
          <Badge variant="destructive" className="text-xs">
            {stats.absent} Absent
          </Badge>
          {stats.late > 0 && (
            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
              {stats.late} Late
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}