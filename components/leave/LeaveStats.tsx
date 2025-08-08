'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar,
  TrendingUp,
  Users
} from 'lucide-react';
import { LeaveStats } from '@/lib/leave-service';

interface LeaveStatsProps {
  stats: LeaveStats | null;
  loading: boolean;
}

export default function LeaveStats({ stats, loading }: LeaveStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">--</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">0</div>
              <p className="text-xs text-muted-foreground">No data available</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate">Pending Requests</CardTitle>
          <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {stats.pendingRequests}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-tight">
            Awaiting approval
          </p>
        </CardContent>
      </Card>

      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate">Approved</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {stats.approvedRequests}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-tight">
            Successfully approved
          </p>
        </CardContent>
      </Card>

      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate">Rejected</CardTitle>
          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {stats.rejectedRequests}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-tight">
            Declined requests
          </p>
        </CardContent>
      </Card>

      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate">Total Days</CardTitle>
          <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {stats.totalDaysRequested}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-tight">
            Days requested
          </p>
        </CardContent>
      </Card>

      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate">Emergency</CardTitle>
          <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {stats.emergencyRequests}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-tight">
            Urgent requests
          </p>
        </CardContent>
      </Card>

      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate">Total Requests</CardTitle>
          <Users className="h-4 w-4 text-purple-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {stats.totalRequests}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-tight">
            All requests
          </p>
        </CardContent>
      </Card>

      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate">Avg Processing</CardTitle>
          <TrendingUp className="h-4 w-4 text-indigo-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {stats.avgProcessingTime}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-tight">
            Days to process
          </p>
        </CardContent>
      </Card>

      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate">Approval Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {stats.totalRequests > 0 
              ? Math.round((stats.approvedRequests / stats.totalRequests) * 100)
              : 0}%
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-tight">
            Success rate
          </p>
        </CardContent>
      </Card>
    </div>
  );
}