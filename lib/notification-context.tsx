'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { NotificationService, Notification } from './notification-service';
import { useAuth } from './auth-context';
import { useWorkspace } from './workspace-context';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.uid || !currentWorkspace?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Get user's role from auth context
    const userRole = (user as any)?.role || 'member';

    const unsubscribe = NotificationService.subscribeToUserNotifications(
      user.uid,
      currentWorkspace.id,
      (notificationList) => {
        setNotifications(notificationList);
        setLoading(false);
      },
      userRole
    );

    return unsubscribe;
  }, [user?.uid, currentWorkspace?.id]);

  // Cleanup expired notifications periodically
  useEffect(() => {
    if (!currentWorkspace?.id) return;

    const cleanupInterval = setInterval(() => {
      NotificationService.cleanupExpiredNotifications(currentWorkspace.id)
        .catch(error => console.error('Error cleaning up notifications:', error));
    }, 30 * 60 * 1000); // Every 30 minutes

    return () => clearInterval(cleanupInterval);
  }, [currentWorkspace?.id]);

  const markAsRead = async (notificationId: string) => {
    if (!currentWorkspace?.id) return;

    try {
      await NotificationService.markAsRead(notificationId, currentWorkspace.id);
      // Update local state optimistically
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.uid || !currentWorkspace?.id) return;

    try {
      await NotificationService.markAllAsRead(user.uid, currentWorkspace.id);
      // Update local state optimistically
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!currentWorkspace?.id) return;

    try {
      await NotificationService.deleteNotification(notificationId, currentWorkspace.id);
      // Update local state optimistically
      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const refreshNotifications = async () => {
    if (!user?.uid || !currentWorkspace?.id) return;

    try {
      setLoading(true);
      const userRole = (user as any)?.role || 'member';
      const notificationList = await NotificationService.getUserNotifications(
        user.uid,
        currentWorkspace.id,
        userRole
      );
      setNotifications(notificationList);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 