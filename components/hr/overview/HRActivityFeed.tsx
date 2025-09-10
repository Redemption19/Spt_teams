'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Clock, 
  UserPlus, 
  Wallet, 
  Calendar, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import { ActivityService, EnhancedActivityLog } from '@/lib/activity-service';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function HRActivityFeed() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<EnhancedActivityLog[]>([]);

  useEffect(() => {
    const fetchHRActivities = async () => {
      if (!currentWorkspace?.id) return;

      try {
        setLoading(true);
        
        // Fetch recent activities
        const allActivities = await ActivityService.getWorkspaceActivities(currentWorkspace.id, 50);
        
        // Filter for HR-related activities
        const hrActivities = allActivities.filter(activity => {
          const hrKeywords = [
            'user_created', 'user_updated', 'user_deleted',
            'employee', 'attendance', 'leave', 'payroll',
            'recruitment', 'interview', 'hiring',
            'user_transferred', 'invitation'
          ];
          
          return hrKeywords.some(keyword => 
            activity.type.includes(keyword) || 
            activity.entity.toLowerCase().includes(keyword) ||
            activity.description.toLowerCase().includes(keyword)
          );
        }).slice(0, 10); // Show latest 10 HR activities

        setActivities(hrActivities);
      } catch (error) {
        console.error('Error fetching HR activities:', error);
        toast({
          title: 'Error',
          description: 'Failed to load recent activities',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHRActivities();
  }, [currentWorkspace?.id, toast]);

  const getActivityIcon = (activity: EnhancedActivityLog) => {
    switch (activity.type) {
      case 'user_created':
      case 'user_updated':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'user_deleted':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'user_login':
        return <Clock className="w-4 h-4 text-green-500" />;
      case 'invitation_sent':
      case 'invitation_accepted':
        return <User className="w-4 h-4 text-indigo-500" />;
      default:
        if (activity.entity.toLowerCase().includes('payroll')) {
          return <Wallet className="w-4 h-4 text-green-500" />;
        }
        if (activity.entity.toLowerCase().includes('leave')) {
          return <Calendar className="w-4 h-4 text-orange-500" />;
        }
        if (activity.entity.toLowerCase().includes('attendance')) {
          return <Clock className="w-4 h-4 text-blue-500" />;
        }
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (activity: EnhancedActivityLog) => {
    switch (activity.severity) {
      case 'high':
      case 'critical':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
      default:
        switch (activity.type) {
          case 'user_created':
          case 'invitation_accepted':
            return 'bg-green-500';
          case 'user_login':
            return 'bg-blue-500';
          case 'user_deleted':
            return 'bg-red-500';
          default:
            return 'bg-primary';
        }
    }
  };

  const formatActivityDescription = (activity: EnhancedActivityLog) => {
    // Create more user-friendly descriptions for HR activities
    switch (activity.type) {
      case 'user_created':
        return `New employee ${activity.userName} was added to the system`;
      case 'user_updated':
        return `Employee profile updated for ${activity.userName}`;
      case 'user_login':
        return `${activity.userName} clocked in`;
      case 'invitation_sent':
        return `Invitation sent to ${activity.targetName || 'new employee'}`;
      case 'invitation_accepted':
        return `${activity.userName} accepted invitation and joined`;
      default:
        return activity.description || `${activity.type.replace(/_/g, ' ')} - ${activity.entity}`;
    }
  };

  if (loading) {
    return (
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest HR activities across all modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest HR activities across all modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recent HR activities</p>
            <p className="text-sm text-muted-foreground mt-2">
              Activities will appear here as users interact with HR modules
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest HR activities across all modules</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 hover-muted-enhanced p-2 rounded-lg transition-colors">
              <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity)}`}></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getActivityIcon(activity)}
                  <p className="text-sm font-medium leading-none truncate">
                    {formatActivityDescription(activity)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                  {activity.severity !== 'low' && (
                    <Badge 
                      variant={activity.severity === 'critical' ? 'destructive' : 'secondary'} 
                      className="text-xs px-1 py-0"
                    >
                      {activity.severity}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}