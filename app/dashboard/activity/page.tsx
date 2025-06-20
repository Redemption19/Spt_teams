'use client';

import { Activity, Clock, User, FileText, Settings, Eye, Edit, Trash2, Filter, Search, Calendar, AlertTriangle, Shield, Users, Database, RefreshCw, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { ActivityService, EnhancedActivityLog, ActivityType } from '@/lib/activity-service';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

export default function ActivityLogPage() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<EnhancedActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<EnhancedActivityLog[]>([]);
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    critical: 0,
    activeUsers: 0,
    byCategory: {} as Record<string, number>,
    byType: {} as Record<ActivityType, number>,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Load data
  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    
    setLoading(true);
    try {
      const [activitiesData, statsData] = await Promise.all([
        ActivityService.getWorkspaceActivities(currentWorkspace.id, 100),
        ActivityService.getActivityStats(currentWorkspace.id),
      ]);
      
      setActivities(activitiesData);
      setStats(statsData);
      
      console.log('Loaded activities:', activitiesData.length);
      console.log('Activity stats:', statsData);
    } catch (error) {
      console.error('Error loading activity data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load activity data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Activity data has been updated',
    });
  };

  // Filter activities
  useEffect(() => {
    let filtered = activities;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.description.toLowerCase().includes(query) ||
        activity.userName.toLowerCase().includes(query) ||
        activity.targetName?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(activity => activity.category === selectedCategory);
    }

    // Severity filter
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(activity => activity.severity === selectedSeverity);
    }

    // User filter
    if (selectedUser !== 'all') {
      filtered = filtered.filter(activity => activity.userId === selectedUser);
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= dateRange.from!;
      });
    }
    if (dateRange.to) {
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate <= dateRange.to!;
      });
    }

    setFilteredActivities(filtered);
  }, [activities, searchQuery, selectedCategory, selectedSeverity, selectedUser, dateRange]);

  // Load data on mount
  useEffect(() => {
    if (currentWorkspace) {
      loadData();
    }
  }, [currentWorkspace, loadData]);

  // Helper functions
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'user_created':
      case 'user_updated':
      case 'user_login':
        return <User className="h-4 w-4" />;
      case 'user_deleted':
        return <Trash2 className="h-4 w-4" />;
      case 'team_created':
      case 'team_updated':
      case 'team_member_added':
        return <Users className="h-4 w-4" />;
      case 'branch_created':
      case 'branch_updated':
      case 'region_created':
      case 'region_updated':
        return <Edit className="h-4 w-4" />;
      case 'workspace_settings_changed':
      case 'settings_changed':
        return <Settings className="h-4 w-4" />;
      case 'security_event':
        return <Shield className="h-4 w-4" />;
      case 'invitation_sent':
      case 'invitation_accepted':
        return <User className="h-4 w-4" />;
      case 'project_created':
      case 'task_created':
      case 'report_created':
        return <FileText className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'user': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
      case 'team': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400';
      case 'system': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
      case 'security': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      case 'content': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Get unique users for filter
  const uniqueUsers = Array.from(new Set(activities.map(a => ({ id: a.userId, name: a.userName }))))
    .filter((user, index, self) => self.findIndex(u => u.id === user.id) === index);

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No workspace selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Activity Log</h1>
          <p className="text-muted-foreground">
            Track all actions and changes in {currentWorkspace.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-5">
        <Card className="card-enhanced border border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.today}</div>
            <p className="text-xs text-muted-foreground">activities recorded</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced border border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">total activities</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced border border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Critical Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">requiring attention</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced border border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">users active today</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced border border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{activities.length}</div>
            <p className="text-xs text-muted-foreground">activities loaded</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-enhanced border border-border/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2 text-primary" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="user">User Management</SelectItem>
                  <SelectItem value="team">Team & Structure</SelectItem>
                  <SelectItem value="system">System Changes</SelectItem>
                  <SelectItem value="security">Security Events</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

                         <div className="space-y-2">
               <label className="text-sm font-medium">From Date</label>
               <Input
                 type="date"
                 value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                 onChange={(e) => setDateRange(prev => ({ 
                   ...prev, 
                   from: e.target.value ? new Date(e.target.value) : undefined 
                 }))}
               />
             </div>

             <div className="space-y-2">
               <label className="text-sm font-medium">To Date</label>
               <Input
                 type="date"
                 value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                 onChange={(e) => setDateRange(prev => ({ 
                   ...prev, 
                   to: e.target.value ? new Date(e.target.value) : undefined 
                 }))}
               />
             </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedCategory !== 'all' || selectedSeverity !== 'all' || selectedUser !== 'all' || dateRange.from) && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Active Filters:</span>
                  <Badge variant="secondary">
                    {filteredActivities.length} of {activities.length} activities
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedSeverity('all');
                    setSelectedUser('all');
                    setDateRange({});
                  }}
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card className="card-enhanced border border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>Recent Activity</span>
            <Badge variant="secondary" className="ml-2">
              {filteredActivities.length}
            </Badge>
          </CardTitle>
          <CardDescription>Latest actions and changes in your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading activities...</p>
              </div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {activities.length === 0 ? 'No activities found' : 'No activities match your filters'}
              </p>
              <p className="text-sm text-muted-foreground">
                {activities.length === 0 
                  ? 'Activity will appear here as users interact with the system'
                  : 'Try adjusting your search criteria'
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      <Avatar className="h-10 w-10 border-2 border-background">
                        {activity.userAvatar ? (
                          <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
                            {activity.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getCategoryColor(activity.category)}>
                          {getActivityIcon(activity.type)}
                          <span className="ml-1 capitalize">{activity.category}</span>
                        </Badge>
                        <Badge variant="outline" className={getSeverityColor(activity.severity)}>
                          {activity.severity}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-foreground">{activity.userName}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{activity.description}</p>
                        {activity.targetName && (
                          <p className="text-sm text-muted-foreground">
                            Target: <span className="font-medium text-foreground">{activity.targetName}</span>
                          </p>
                        )}
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <details className="text-xs text-muted-foreground">
                            <summary className="cursor-pointer hover:text-foreground">View Details</summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(activity.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Activity Breakdown */}
      <Card className="card-enhanced border border-border/30">
        <CardHeader>
          <CardTitle>Activity Breakdown</CardTitle>
          <CardDescription>Activity distribution by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">By Category</h4>
              {Object.entries(stats.byCategory).map(([category, count]) => {
                const percentage = activities.length > 0 ? (count / activities.length) * 100 : 0;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{category}</span>
                      <span className="text-sm text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Top Activity Types</h4>
              {Object.entries(stats.byType)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => {
                  const percentage = activities.length > 0 ? (count / activities.length) * 100 : 0;
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{type.replace('_', ' ')}</span>
                        <span className="text-sm text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
