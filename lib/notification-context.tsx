'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db } from './firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { useAuth } from './auth-context';
import { useWorkspace } from './workspace-context';
import type { Notification } from './notification-service';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  undoDeleteNotification: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  refreshNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  undoDeleteNotification: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Real-time listener
  useEffect(() => {
    if (!user || !currentWorkspace?.id) return;
    const q = query(
      collection(db, 'workspaces', currentWorkspace.id, 'notifications'),
      where('userId', '==', user.uid),
      where('deleted', '!=', true),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
    return () => unsubscribe();
  }, [user, currentWorkspace?.id]);

  // Manual refresh
  const refreshNotifications = useCallback(async () => {
    if (!user || !currentWorkspace?.id) return;
    const q = query(
      collection(db, 'workspaces', currentWorkspace.id, 'notifications'),
      where('userId', '==', user.uid),
      where('deleted', '!=', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.read).length);
  }, [user, currentWorkspace?.id]);

  // Mark a single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!currentWorkspace?.id) return;
    await updateDoc(doc(db, 'workspaces', currentWorkspace.id, 'notifications', notificationId), { read: true });
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [currentWorkspace?.id]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user || !currentWorkspace?.id) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, 'workspaces', currentWorkspace.id, 'notifications', n.id), { read: true });
    });
    await batch.commit();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [notifications, user, currentWorkspace?.id]);

  // Soft-delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!currentWorkspace?.id) return;
    await updateDoc(doc(db, 'workspaces', currentWorkspace.id, 'notifications', notificationId), { deleted: true });
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, [currentWorkspace?.id]);

  // Undo soft-delete
  const undoDeleteNotification = useCallback(async (notificationId: string) => {
    if (!currentWorkspace?.id) return;
    await updateDoc(doc(db, 'workspaces', currentWorkspace.id, 'notifications', notificationId), { deleted: false });
    await refreshNotifications();
  }, [currentWorkspace?.id, refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        undoDeleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
} 