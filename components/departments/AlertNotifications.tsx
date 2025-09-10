'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, X, Bell, Clock, TrendingDown, Users, Wallet, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { NotificationService, type Notification } from '@/lib/notification-service';
import { toast } from 'sonner';

interface AlertNotification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  department: string;
  timestamp: string;
  actionRequired: boolean;
  category: 'performance' | 'budget' | 'hr' | 'project' | 'system';
}

// Map notification types to alert types
const mapNotificationToAlert = (notification: Notification): AlertNotification => {
  const getAlertType = (notificationType: Notification['type'], priority: Notification['priority']): AlertNotification['type'] => {
    if (priority === 'urgent') return 'critical';
    if (priority === 'high') return 'critical';
    if (priority === 'medium') return 'warning';
    if (notificationType === 'system_alert') return 'warning';
    if (notificationType.includes('approved') || notificationType.includes('created')) return 'success';
    return 'info';
  };

  const getCategory = (notificationType: Notification['type']): AlertNotification['category'] => {
    if (notificationType.includes('leave') || notificationType.includes('payslip')) return 'hr';
    if (notificationType.includes('expense') || notificationType.includes('report')) return 'budget';
    if (notificationType.includes('team') || notificationType.includes('user')) return 'hr';
    if (notificationType === 'system_alert') return 'system';
    return 'system';
  };

  const getDepartment = (notification: Notification): string => {
    if (notification.metadata?.targetName) return notification.metadata.targetName;
    if (notification.type.includes('leave') || notification.type.includes('payslip')) return 'HR';
    if (notification.type.includes('expense')) return 'Finance';
    if (notification.type.includes('team')) return 'Teams';
    return 'System';
  };

  const getTimestamp = (createdAt: any): string => {
    if (!createdAt) return 'Just now';
    
    let date: Date;
    if (createdAt.toDate) {
      date = createdAt.toDate();
    } else if (createdAt instanceof Date) {
      date = createdAt;
    } else {
      date = new Date(createdAt);
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return {
    id: notification.id,
    type: getAlertType(notification.type, notification.priority),
    title: notification.title,
    message: notification.message,
    department: getDepartment(notification),
    timestamp: getTimestamp(notification.createdAt),
    actionRequired: notification.priority === 'urgent' || notification.priority === 'high' || !!notification.actionUrl,
    category: getCategory(notification.type)
  };
};

export function AlertNotifications() {
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();

  // Fetch real notifications from NotificationService
  useEffect(() => {
    if (!currentWorkspace?.id || !user?.uid) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get initial notifications
        const notifications = await NotificationService.getUserNotifications(
          user.uid,
          currentWorkspace.id,
          undefined, // userRole - will be determined by the service
          20 // limit to 20 notifications
        );

        // Convert notifications to alerts
        const alertNotifications = notifications.map(mapNotificationToAlert);
        
        // Sort by priority and timestamp
        const sortedAlerts = alertNotifications
          .sort((a, b) => {
            const priorityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
            const priorityDiff = priorityOrder[a.type] - priorityOrder[b.type];
            if (priorityDiff !== 0) return priorityDiff;
            
            // If same priority, sort by timestamp (newer first)
            return b.timestamp.localeCompare(a.timestamp);
          })
          .slice(0, 8); // Limit to 8 most important alerts

        setAlerts(sortedAlerts);
        
        // Set up real-time subscription
        unsubscribe = NotificationService.subscribeToUserNotifications(
          user.uid,
          currentWorkspace.id,
          (updatedNotifications) => {
            const updatedAlerts = updatedNotifications
              .map(mapNotificationToAlert)
              .sort((a, b) => {
                const priorityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
                const priorityDiff = priorityOrder[a.type] - priorityOrder[b.type];
                if (priorityDiff !== 0) return priorityDiff;
                return b.timestamp.localeCompare(a.timestamp);
              })
              .slice(0, 8);
            
            setAlerts(updatedAlerts);
          },
          undefined, // userRole
          20 // limit
        );
        
      } catch (err) {
        console.error('Error loading notifications:', err);
        setError('Failed to load alerts. Please try again.');
        toast.error('Failed to load alerts');
        
        // Set empty array on error since not using mock data
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentWorkspace?.id, user?.uid]);

  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info' | 'success'>('all');

  const dismissAlert = async (alertId: string) => {
    if (!currentWorkspace?.id) return;
    
    try {
      // Remove from local state immediately for better UX
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      
      // Delete the notification from the database
      await NotificationService.deleteNotification(alertId, currentWorkspace.id);
      
      toast.success('Alert dismissed');
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast.error('Failed to dismiss alert');
      
      // Revert the local state change if deletion failed
      // The real-time subscription will restore the correct state
    }
  };

  const handleTakeAction = async (alertId: string) => {
    if (!currentWorkspace?.id) return;
    
    try {
      // Find the original notification to get the action URL
      const notifications = await NotificationService.getUserNotifications(
        user?.uid || '',
        currentWorkspace.id,
        undefined,
        50
      );
      
      const notification = notifications.find(n => n.id === alertId);
      
      if (notification?.actionUrl) {
        // Mark notification as read when action is taken
        await NotificationService.markAsRead(alertId, currentWorkspace.id);
        
        // Navigate to the action URL
        window.location.href = notification.actionUrl;
      } else {
        toast.info('No action available for this alert');
      }
    } catch (error) {
      console.error('Error taking action:', error);
      toast.error('Failed to take action');
    }
  };

  const getAlertIcon = (type: AlertNotification['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: AlertNotification['category']) => {
    switch (category) {
      case 'performance':
        return <TrendingDown className="h-3 w-3" />;
      case 'budget':
        return <Wallet className="h-3 w-3" />;
      case 'hr':
        return <Users className="h-3 w-3" />;
      case 'project':
        return <Clock className="h-3 w-3" />;
      case 'system':
        return <Bell className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getAlertVariant = (type: AlertNotification['type']) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      case 'success':
        return 'default';
      default:
        return 'default';
    }
  };

  const getAlertColors = (type: AlertNotification['type']) => {
    switch (type) {
      case 'critical':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30';
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/30';
    }
  };

  const getBadgeVariant = (type: AlertNotification['type']) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      case 'success':
        return 'default';
      default:
        return 'outline';
    }
  };

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(alert => alert.type === filter);
  const criticalCount = alerts.filter(alert => alert.type === 'critical').length;
  const warningCount = alerts.filter(alert => alert.type === 'warning').length;
  const actionRequiredCount = alerts.filter(alert => alert.actionRequired).length;

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="card-enhanced">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle className="text-lg">Active Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading alerts...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <Card className="card-enhanced">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle className="text-lg">Active Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Error Loading Alerts</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="card-enhanced">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-medium mb-2">All Clear!</h3>
          <p className="text-muted-foreground">No active alerts or notifications at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Summary */}
      <Card className="card-enhanced border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 dark:border-orange-800 dark:from-orange-950/30 dark:to-red-950/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Active Alerts</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({alerts.length})
              </Button>
              <Button
                variant={filter === 'critical' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setFilter('critical')}
              >
                Critical ({criticalCount})
              </Button>
              <Button
                variant={filter === 'warning' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setFilter('warning')}
              >
                Warning ({warningCount})
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-sm text-muted-foreground">Warning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{actionRequiredCount}</div>
              <div className="text-sm text-muted-foreground">Action Required</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alert List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <Alert key={alert.id} className={`${getAlertColors(alert.type)} relative`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <Badge variant={getBadgeVariant(alert.type)} className="text-xs">
                      {alert.type.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs flex items-center gap-1 dark:border-gray-700 dark:text-gray-300">
                      {getCategoryIcon(alert.category)}
                      {alert.category}
                    </Badge>
                    {alert.actionRequired && (
                      <Badge variant="destructive" className="text-xs">
                        Action Required
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                    className="h-6 w-6 p-0 hover:bg-white/50 dark:hover:bg-gray-800/50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <AlertDescription className="text-sm mb-2">
                  {alert.message}
                </AlertDescription>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">Department: {alert.department}</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {alert.timestamp}
                    </span>
                  </div>
                  
                  {alert.actionRequired && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 text-xs px-2"
                      onClick={() => handleTakeAction(alert.id)}
                    >
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </div>
  );
}