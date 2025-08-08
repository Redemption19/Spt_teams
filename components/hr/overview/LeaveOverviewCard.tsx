'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp } from 'lucide-react';
import { LeaveService } from '@/lib/leave-service';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  totalDays: number;
  changePercentage: number;
}

interface LeaveOverviewCardProps {
  shouldShowCrossWorkspace?: boolean;
  allWorkspaces?: any[];
  loading?: boolean;
}

export default function LeaveOverviewCard({ 
  shouldShowCrossWorkspace = false, 
  allWorkspaces = [], 
  loading: externalLoading = false 
}: LeaveOverviewCardProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LeaveStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalDays: 0,
    changePercentage: 0
  });

  useEffect(() => {
    const fetchLeaveStats = async () => {
      if (shouldShowCrossWorkspace) {
        if (!allWorkspaces.length) return;
      } else {
        if (!currentWorkspace?.id) return;
      }

      try {
        setLoading(true);
        
        // Get current month date range
        const now = new Date();
        const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(now), 'yyyy-MM-dd');
        
        let allLeaveRequests: any[] = [];
        let allLastMonthRequests: any[] = [];
        
        if (shouldShowCrossWorkspace) {
          // Fetch leave requests from all workspaces
          for (const workspace of allWorkspaces) {
            try {
              const leaveRequests = await LeaveService.getLeaveRequests({
                workspaceId: workspace.id,
                startDate: startOfMonth(now),
                endDate: endOfMonth(now)
              });
              allLeaveRequests.push(...leaveRequests);
              
              // Get last month data for comparison
              const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              const lastMonthRequests = await LeaveService.getLeaveRequests({
                workspaceId: workspace.id,
                startDate: startOfMonth(lastMonth),
                endDate: endOfMonth(lastMonth)
              });
              allLastMonthRequests.push(...lastMonthRequests);
            } catch (error) {
              console.error(`Error fetching leave data for workspace ${workspace.id}:`, error);
            }
          }
        } else {
          // Fetch leave requests for current workspace only
          if (!currentWorkspace?.id) return;
          
          const leaveRequests = await LeaveService.getLeaveRequests({
            workspaceId: currentWorkspace.id,
            startDate: startOfMonth(now),
            endDate: endOfMonth(now)
          });
          allLeaveRequests = leaveRequests;
          
          // Calculate change percentage (comparing with last month)
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthRequests = await LeaveService.getLeaveRequests({
            workspaceId: currentWorkspace.id,
            startDate: startOfMonth(lastMonth),
            endDate: endOfMonth(lastMonth)
          });
          allLastMonthRequests = lastMonthRequests;
        }
        
        // Calculate stats
        const pending = allLeaveRequests.filter(leave => leave.status === 'pending').length;
        const approved = allLeaveRequests.filter(leave => leave.status === 'approved').length;
        const rejected = allLeaveRequests.filter(leave => leave.status === 'rejected').length;
        
        // Calculate total days for approved leaves
        const totalDays = allLeaveRequests
          .filter(leave => leave.status === 'approved')
          .reduce((sum, leave) => sum + leave.days, 0);
        
        const lastMonthTotal = allLastMonthRequests.length;
        const currentMonthTotal = allLeaveRequests.length;
        
        const changePercentage = lastMonthTotal > 0 ? 
          ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

        setStats({
          pending,
          approved,
          rejected,
          totalDays,
          changePercentage
        });
      } catch (error) {
        console.error('Error fetching leave stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load leave statistics',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveStats();
  }, [currentWorkspace?.id, shouldShowCrossWorkspace, allWorkspaces, toast]);

  const formatTrend = (percentage: number): string => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage > 0) {
      return <TrendingUp className="w-4 h-4 text-red-500" />; // More leaves = red trend
    } else if (percentage < 0) {
      return <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />; // Fewer leaves = green trend
    }
    return <TrendingUp className="w-4 h-4 text-gray-500" />;
  };

  if (loading || externalLoading) {
    return (
      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate">
          {shouldShowCrossWorkspace ? 'Leave Requests (All Workspaces)' : 'Leave Requests'}
        </CardTitle>
          <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="h-6 sm:h-8 w-16 sm:w-20 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-6 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-enhanced">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
        <CardTitle className="text-sm font-medium text-muted-foreground truncate">
          {shouldShowCrossWorkspace ? 'Leave Requests (All Workspaces)' : 'Leave Requests'}
        </CardTitle>
        <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4">
        <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.pending + stats.approved + stats.rejected}</div>
        <div className="flex items-center text-xs text-muted-foreground mb-4">
          {getTrendIcon(stats.changePercentage)}
          <span className="ml-1 truncate">{formatTrend(stats.changePercentage)} from last month</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 justify-center py-1 px-2">
            <span className="truncate">{stats.pending} Pending</span>
          </Badge>
          <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-200 justify-center py-1 px-2">
            <span className="truncate">{stats.approved} Approved</span>
          </Badge>
          {stats.rejected > 0 && (
            <Badge variant="destructive" className="text-xs justify-center py-1 px-2">
              <span className="truncate">{stats.rejected} Rejected</span>
            </Badge>
          )}
        </div>
        {stats.totalDays > 0 && (
          <div className="mt-2 text-xs text-muted-foreground truncate">
            {stats.totalDays} total days approved
          </div>
        )}
      </CardContent>
    </Card>
  );
}