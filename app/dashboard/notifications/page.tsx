'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  ExternalLink,
  Loader2,
  BellOff,
  Search,
  Filter
} from 'lucide-react';
import { useNotifications } from '@/lib/notification-context';
import { Notification } from '@/lib/notification-service';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { db } from '@/lib/firebase';

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  // Local loading state (optional, or just remove loading UI)
  // const [loading, setLoading] = useState(false);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleSeedNotification = async () => {
    if (!user || !currentWorkspace?.id) {
      alert('User or workspace not loaded!');
      return;
    }
    try {
      await addDoc(
        collection(db, 'workspaces', currentWorkspace.id, 'notifications'),
        {
          userId: user.uid,
          title: 'Seeded Test Notification',
          message: 'This is a seeded notification for testing.',
          type: 'system_alert',
          read: false,
          createdAt: serverTimestamp(),
          deleted: false,
          priority: 'medium',
          icon: '🔔',
        }
      );
      alert('Seeded a test notification!');
    } catch (err) {
      alert('Error seeding notification: ' + (err as Error).message);
      console.error('Error seeding notification:', err);
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
      case 'high':
        return <Badge variant="destructive" className="text-xs bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  // Filter notifications based on search and tab
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notification.message || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === 'all' || 
      (activeTab === 'unread' && !notification.read) ||
      (activeTab === 'read' && notification.read);

    return matchesSearch && matchesTab;
  });

  // Remove loading check or use a local loading state if needed
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <Loader2 className="h-8 w-8 animate-spin mr-3" />
  //       <span className="text-lg">Loading notifications...</span>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* DEV ONLY: Seed Test Notification Button */}
      <button
        className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80 mb-2"
        onClick={handleSeedNotification}
        type="button"
      >
        Seed Test Notification
      </button>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with important system activities
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} className="bg-gradient-to-r from-primary to-accent">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full sm:w-auto grid-cols-3">
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({notifications.length - unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BellOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No matching notifications' : 
                   activeTab === 'unread' ? 'No unread notifications' :
                   activeTab === 'read' ? 'No read notifications' : 'No notifications yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search terms' : 
                   'Important system updates will appear here'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                    !notification.read ? 'ring-1 ring-blue-200 bg-blue-50/30 dark:bg-blue-900/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start space-x-4">
                      {/* Priority indicator */}
                      {!notification.read && (
                        <div className={`w-1 h-16 rounded-full flex-shrink-0 ${getPriorityColor(notification.priority || 'medium')}`} />
                      )}

                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <span className="text-2xl">{notification.icon || '🔔'}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold text-base line-clamp-1">{notification.title}</span>
                            {getPriorityBadge(notification.priority || 'medium')}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {notification.createdAt?.seconds
                              ? formatDistanceToNow(new Date(notification.createdAt.seconds * 1000), { addSuffix: true })
                              : ''}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {notification.message || ''}
                        </div>
                        {notification.actionUrl && (
                          <a
                            href={notification.actionUrl}
                            className="inline-flex items-center text-xs text-primary hover:text-primary/80 underline mt-2"
                            onClick={e => { e.stopPropagation(); handleNotificationClick(notification); }}
                          >
                            {notification.actionLabel || 'View details'}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                          >
                            <Check className="h-4 w-4 mr-1" /> Mark as read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => { e.stopPropagation(); handleDeleteNotification(notification.id); }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 