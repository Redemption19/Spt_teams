'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Users,
  Folder,
  AlertCircle,
  Activity,
  Target,
  BarChart3,
  Crown,
  UserCheck,
  User
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { UserService } from '@/lib/user-service';
import { TeamService } from '@/lib/team-service';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingReports: number;
  activeTeams: number;
  recentActivity: Array<{
    id: string;
    type: 'task' | 'report' | 'file' | 'user';
    message: string;
    timestamp: Date;
    user?: string;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    type: 'task' | 'report';
    dueDate: Date;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export function DashboardOverview() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { currentWorkspace, userRole } = useWorkspace();
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingReports: 0,
    activeTeams: 0,
    recentActivity: [],
    upcomingDeadlines: []
  });
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace && user) {
      loadDashboardData();
    }
  }, [currentWorkspace, user]);

  const loadDashboardData = async () => {
    if (!currentWorkspace || !user) return;

    try {
      setLoading(true);

      // Load user's teams with their roles
      const userTeamsData = await TeamService.getUserTeams(user.uid, currentWorkspace.id);
      
      // Transform the data to include member count and other info
      const teamsWithDetails = await Promise.all(
        userTeamsData.map(async ({ team, role }) => {
          try {
            // Get team members count (this would require a method to get team members)
            // For now, we'll use a placeholder
            return {
              id: team.id,
              name: team.name,
              description: team.description,
              memberCount: 0, // TODO: Implement team member count
              role: role,
              branchId: team.branchId,
              regionId: team.regionId,
              leadId: team.leadId,
              createdAt: team.createdAt
            };
          } catch (error) {
            console.warn('Error getting team details:', error);
            return {
              id: team.id,
              name: team.name,
              description: team.description,
              memberCount: 0,
              role: role,
              branchId: team.branchId,
              regionId: team.regionId,
              leadId: team.leadId,
              createdAt: team.createdAt
            };
          }
        })
      );

      setUserTeams(teamsWithDetails);

      // Update stats with actual data
      setStats({
        totalTasks: 12, // TODO: Implement actual task counting
        completedTasks: 8, // TODO: Implement actual completed task counting
        pendingReports: 3, // TODO: Implement actual report counting
        activeTeams: teamsWithDetails.length, // Now using actual team count
        recentActivity: [
          {
            id: '1',
            type: 'task',
            message: 'Task "Weekly Report" was completed',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            user: 'John Doe'
          },
          {
            id: '2',
            type: 'file',
            message: 'New document uploaded to Marketing folder',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            user: 'Sarah Wilson'
          },
          {
            id: '3',
            type: 'user',
            message: 'Mike Chen joined the Development team',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
          },
        ],
        upcomingDeadlines: [
          {
            id: '1',
            title: 'Monthly Sales Report',
            type: 'report',
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
            priority: 'high'
          },
          {
            id: '2',
            title: 'Project Review Meeting Prep',
            type: 'task',
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
            priority: 'medium'
          },
        ]
      });

      console.log('Dashboard data loaded:', {
        userTeams: teamsWithDetails.length,
        currentUser: user.uid,
        currentWorkspace: currentWorkspace.id
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty data on error
      setUserTeams([]);
      setStats(prev => ({
        ...prev,
        activeTeams: 0
      }));
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const completionPercentage = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {getGreeting()}, {userProfile?.name || 'there'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome to {currentWorkspace?.name} • Your role: {' '}
            {userRole === 'owner' ? (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200 dark:from-yellow-900/20 dark:to-amber-900/20 dark:text-yellow-400 dark:border-yellow-800">
                <Crown className="w-3 h-3 mr-1" />
                Owner
              </span>
            ) : userRole === 'admin' ? (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-400 dark:border-blue-800">
                <UserCheck className="w-3 h-3 mr-1" />
                Admin
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200 dark:from-gray-800 dark:to-slate-800 dark:text-gray-300 dark:border-gray-700">
                <User className="w-3 h-3 mr-1" />
                Member
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => router.push('/dashboard/calendar')}>
            <Calendar className="h-4 w-4 mr-2" />
            View Calendar
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}/{stats.totalTasks}</div>
            <Progress value={completionPercentage} className="mt-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(completionPercentage)}% completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingReports > 0 ? 'Reports due soon' : 'All caught up!'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 w-12 bg-muted rounded animate-pulse" />
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              <>
            <div className="text-2xl font-bold">{stats.activeTeams}</div>
            <p className="text-xs text-muted-foreground">
              Teams you&apos;re part of
            </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* My Teams */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>My Teams</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard/teams')}
                className="text-xs"
              >
                View All
              </Button>
            </CardTitle>
            <CardDescription>
              Teams you&apos;re part of
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              // Loading skeleton
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-5 w-12 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </>
            ) : userTeams.length > 0 ? (
              userTeams.map((team) => (
                <div 
                  key={team.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => router.push('/dashboard/teams')}
                >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {team.name?.[0]?.toUpperCase() || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.description ? 
                          (team.description.length > 30 ? 
                            `${team.description.substring(0, 30)}...` : 
                            team.description
                          ) : 
                          `${team.memberCount || 0} members`
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {team.role}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No teams assigned yet
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-xs"
                  onClick={() => router.push('/dashboard/teams')}
                >
                  Browse Teams
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-2 border-l-2 border-accent">
                <div className="p-1 bg-accent/20 rounded">
                  {activity.type === 'task' && <CheckCircle className="h-3 w-3 text-green-600" />}
                  {activity.type === 'file' && <Folder className="h-3 w-3 text-blue-600" />}
                  {activity.type === 'user' && <Users className="h-3 w-3 text-purple-600" />}
                  {activity.type === 'report' && <FileText className="h-3 w-3 text-orange-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.timestamp)}
                    {activity.user && ` • ${activity.user}`}
                  </p>
                </div>
              </div>
            ))}
            {stats.recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Upcoming Deadlines</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-1 bg-orange-100 rounded">
                    {deadline.type === 'task' ? 
                      <Target className="h-3 w-3 text-orange-600" /> : 
                      <FileText className="h-3 w-3 text-orange-600" />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-sm">{deadline.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {deadline.dueDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={getPriorityColor(deadline.priority) as any} className="text-xs">
                  {deadline.priority}
                </Badge>
              </div>
            ))}
            {stats.upcomingDeadlines.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming deadlines
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => router.push('/dashboard/tasks')}
            >
              <Target className="h-6 w-6" />
              <span className="text-sm">View Tasks</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => router.push('/dashboard/reports')}
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">Submit Report</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => router.push('/dashboard/folders')}
            >
              <Folder className="h-6 w-6" />
              <span className="text-sm">Browse Files</span>
            </Button>
            
            {(userRole === 'owner' || userRole === 'admin') && (
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => router.push('/dashboard/analytics')}
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">View Analytics</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
