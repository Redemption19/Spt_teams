'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Video, 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  Play,
  Signal,
  Wifi,
  WifiOff
} from 'lucide-react';
import { VideoCallAnalytics } from '@/lib/video-call-data-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface AnalyticsDashboardProps {
  analytics: VideoCallAnalytics | null;
  loading?: boolean;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  onExport?: () => void;
}

export function AnalyticsDashboard({
  analytics,
  loading = false,
  timeRange,
  onTimeRangeChange,
  onExport
}: AnalyticsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<'meetings' | 'participants' | 'duration'>('meetings');

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb < 1 ? `${Math.round(gb * 1024)} MB` : `${gb.toFixed(1)} GB`;
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getQualityColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 4) return 'Good';
    if (score >= 3) return 'Fair';
    if (score >= 2) return 'Poor';
    return 'Very Poor';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
        <p className="text-muted-foreground">Analytics data will appear here once you start having video calls.</p>
      </div>
    );
  }

  const { overview, usage, quality, participants, devices, recordings } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Video Call Analytics</h2>
          <p className="text-muted-foreground">Monitor your video call performance and usage</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalMeetings.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(getPercentageChange(overview.totalMeetings, overview.totalMeetings - 10))}
              <span className={getTrendColor(getPercentageChange(overview.totalMeetings, overview.totalMeetings - 10))}>
                {Math.abs(getPercentageChange(overview.totalMeetings, overview.totalMeetings - 10)).toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalParticipants.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(getPercentageChange(overview.totalParticipants, overview.totalParticipants - 25))}
              <span className={getTrendColor(getPercentageChange(overview.totalParticipants, overview.totalParticipants - 25))}>
                {Math.abs(getPercentageChange(overview.totalParticipants, overview.totalParticipants - 25)).toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(overview.totalDuration)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(getPercentageChange(overview.totalDuration, overview.totalDuration - 120))}
              <span className={getTrendColor(getPercentageChange(overview.totalDuration, overview.totalDuration - 120))}>
                {Math.abs(getPercentageChange(overview.totalDuration, overview.totalDuration - 120)).toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(overview.averageDuration)}</div>
            <div className="text-xs text-muted-foreground">
              Per meeting
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends</CardTitle>
            <CardDescription>Meeting activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={selectedMetric === 'meetings' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('meetings')}
                >
                  Meetings
                </Button>
                <Button
                  variant={selectedMetric === 'participants' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('participants')}
                >
                  Participants
                </Button>
                <Button
                  variant={selectedMetric === 'duration' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('duration')}
                >
                  Duration
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Daily Average</span>
                  <span className="font-medium">
                    {selectedMetric === 'meetings' && `${usage.dailyMeetings} meetings`}
                    {selectedMetric === 'participants' && `${Math.round(overview.totalParticipants / 30)} participants`}
                    {selectedMetric === 'duration' && formatDuration(Math.round(overview.totalDuration / 30))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Weekly Average</span>
                  <span className="font-medium">
                    {selectedMetric === 'meetings' && `${usage.weeklyMeetings} meetings`}
                    {selectedMetric === 'participants' && `${Math.round(overview.totalParticipants / 4)} participants`}
                    {selectedMetric === 'duration' && formatDuration(Math.round(overview.totalDuration / 4))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Monthly Total</span>
                  <span className="font-medium">
                    {selectedMetric === 'meetings' && `${usage.monthlyMeetings} meetings`}
                    {selectedMetric === 'participants' && `${overview.totalParticipants} participants`}
                    {selectedMetric === 'duration' && formatDuration(overview.totalDuration)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Call Quality</CardTitle>
            <CardDescription>Audio and video quality metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Signal className="h-4 w-4" />
                  <span className="text-sm">Overall Quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${getQualityColor(quality?.averageRating || 0)}`}>
                    {(quality?.averageRating || 0).toFixed(1)}/5.0
                  </span>
                  <Badge variant="outline" className={getQualityColor(quality?.averageRating || 0)}>
                    {getQualityLabel(quality?.averageRating || 0)}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Audio Issues</span>
                    <span className="text-red-600">{quality?.audioIssues || 0}</span>
                  </div>
                  <Progress value={Math.max(0, 100 - ((quality?.audioIssues || 0) * 10))} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Video Issues</span>
                    <span className="text-red-600">{quality?.videoIssues || 0}</span>
                  </div>
                  <Progress value={Math.max(0, 100 - ((quality?.videoIssues || 0) * 10))} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Successful Connections</span>
                    <span className="text-green-600">{quality?.successfulConnections || 0}</span>
                  </div>
                  <Progress value={((quality?.successfulConnections || 0) / Math.max(1, (quality?.successfulConnections || 0) + (quality?.failedConnections || 0))) * 100} className="h-2" />
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-green-600" />
                    <span>Connection Issues</span>
                  </div>
                  <span className="text-red-600 font-medium">{quality?.connectionIssues || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participant Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Participant Analytics</CardTitle>
            <CardDescription>Participation patterns and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{participants.averageParticipantsPerMeeting?.toFixed(1) ?? '0'}</div>
                  <div className="text-xs text-muted-foreground">Avg per meeting</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{participants.activeUsers ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Active users</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>New Users</span>
                  <span className="font-medium">{participants.newUsers ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Returning Users</span>
                  <span className="font-medium">{participants.returningUsers ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Top Users</span>
                  <span className="font-medium">{participants.topUsers?.length ?? 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Device Usage</CardTitle>
            <CardDescription>How participants join meetings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span className="text-sm">Desktop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{devices.desktop ?? 0}%</span>
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${devices.desktop ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm">Mobile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{devices.mobile ?? 0}%</span>
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${devices.mobile ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tablet className="h-4 w-4" />
                    <span className="text-sm">Tablet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{devices.tablet ?? 0}%</span>
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${devices.tablet ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recordings Summary */}
      {recordings && (
        <Card>
          <CardHeader>
            <CardTitle>Recordings Summary</CardTitle>
            <CardDescription>Recording usage and storage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{recordings.totalRecordings ?? 0}</div>
                <div className="text-xs text-muted-foreground">Total Recordings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatBytes(recordings.totalStorageUsed ?? 0)}</div>
                <div className="text-xs text-muted-foreground">Storage Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{recordings.downloadCount ?? 0}</div>
                <div className="text-xs text-muted-foreground">Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatBytes(recordings.averageRecordingSize ?? 0)}</div>
                <div className="text-xs text-muted-foreground">Avg Size</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}