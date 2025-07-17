import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp,
  Timestamp,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

export interface Notification {
  id: string;
  userId: string;
  workspaceId: string;
  type: 'user_created' | 'user_invited' | 'role_changed' | 'workspace_created' | 'team_created' | 'user_deactivated' | 'user_reactivated' | 'password_reset' | 'user_deleted' | 'team_updated' | 'workspace_updated' | 'system_alert';
  title: string;
  message: string;
  icon: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  metadata?: {
    actorId?: string;
    actorName?: string;
    targetId?: string;
    targetName?: string;
    oldValue?: string;
    newValue?: string;
    [key: string]: any;
  };
}

export interface CreateNotificationData {
  userId: string;
  workspaceId: string;
  type: Notification['type'];
  title: string;
  message: string;
  icon?: string;
  priority?: Notification['priority'];
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  metadata?: Notification['metadata'];
}

export class NotificationService {
  private static getNotificationsCollection(workspaceId: string) {
    return collection(db, 'workspaces', workspaceId, 'notifications');
  }

  // Create a new notification
  static async createNotification(data: CreateNotificationData): Promise<string> {
    try {
      const notificationData = {
        userId: data.userId,
        workspaceId: data.workspaceId,
        type: data.type,
        title: data.title,
        message: data.message,
        icon: data.icon || this.getDefaultIcon(data.type),
        read: false,
        priority: data.priority || 'medium',
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        createdAt: serverTimestamp(),
        expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : undefined,
        metadata: data.metadata || {}
      };

      const docRef = await addDoc(
        this.getNotificationsCollection(data.workspaceId),
        notificationData
      );

      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a user with role-based security
  static async getUserNotifications(
    userId: string, 
    workspaceId: string, 
    userRole?: string,
    limitCount: number = 50
  ): Promise<Notification[]> {
    try {
      const q = query(
        this.getNotificationsCollection(workspaceId),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const notifications: Notification[] = [];

      querySnapshot.forEach((doc) => {
        const notificationData = doc.data() as Notification;
        
        // Additional security check: ensure user can see this notification
        if (this.canUserViewNotification(userId, userRole, notificationData)) {
          notifications.push({
            ...notificationData,
            id: doc.id
          });
        }
      });

      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Check if user can view a specific notification
  private static canUserViewNotification(
    userId: string,
    userRole: string | undefined,
    notification: Notification
  ): boolean {
    // User can always see their own notifications
    if (notification.userId === userId) {
      return true;
    }

    // Additional role-based checks
    if (userRole === 'owner') {
      // Owners can see all notifications in their workspace
      return true;
    }

    if (userRole === 'admin') {
      // Admins can see admin-level notifications but not personal notifications of other users
      const isPersonalNotification = notification.metadata?.isPersonalNotification === true;
      if (isPersonalNotification && notification.userId !== userId) {
        return false;
      }
      return true;
    }

    if (userRole === 'member') {
      // Members can only see their own notifications and general system alerts directed to them
      return notification.userId === userId;
    }

    // Default: deny access
    return false;
  }

  // Subscribe to real-time notifications with role-based security
  static subscribeToUserNotifications(
    userId: string,
    workspaceId: string,
    callback: (notifications: Notification[]) => void,
    userRole?: string,
    limitCount: number = 50
  ): () => void {
    try {
      const q = query(
        this.getNotificationsCollection(workspaceId),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      return onSnapshot(q, (querySnapshot) => {
        const notifications: Notification[] = [];
        querySnapshot.forEach((doc) => {
          const notificationData = doc.data() as Notification;
          
          // Additional security check: ensure user can see this notification
          if (this.canUserViewNotification(userId, userRole, notificationData)) {
            notifications.push({
              ...notificationData,
              id: doc.id
            });
          }
        });
        callback(notifications);
      });
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return () => {};
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string, workspaceId: string): Promise<void> {
    try {
      const notificationRef = doc(
        this.getNotificationsCollection(workspaceId),
        notificationId
      );
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string, workspaceId: string): Promise<void> {
    try {
      const q = query(
        this.getNotificationsCollection(workspaceId),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map((doc) =>
        updateDoc(doc.ref, { read: true })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete a notification
  static async deleteNotification(notificationId: string, workspaceId: string): Promise<void> {
    try {
      const notificationRef = doc(
        this.getNotificationsCollection(workspaceId),
        notificationId
      );
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Delete expired notifications
  static async cleanupExpiredNotifications(workspaceId: string): Promise<void> {
    try {
      const now = Timestamp.now();
      const q = query(
        this.getNotificationsCollection(workspaceId),
        where('expiresAt', '<=', now)
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  // Create notifications for multiple users based on their roles
  static async createNotificationForRoles(
    workspaceId: string,
    roles: ('owner' | 'admin')[],
    notificationData: Omit<CreateNotificationData, 'userId' | 'workspaceId'>
  ): Promise<void> {
    try {
      // Get users with specified roles in the workspace
      const { UserService } = await import('./user-service');
      const workspaceUsers = await UserService.getUsersByWorkspace(workspaceId);
      
      const targetUsers = workspaceUsers.filter(user => 
        roles.includes(user.role as 'owner' | 'admin')
      );

      // Create notifications for each target user
      const notificationPromises = targetUsers.map(user =>
        this.createNotification({
          ...notificationData,
          userId: user.id,
          workspaceId
        })
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error creating role-based notifications:', error);
      throw error;
    }
  }

  // Notification creation helpers for common operations
  static async notifyUserCreated(
    actorId: string,
    workspaceId: string,
    newUserName: string,
    newUserEmail: string,
    newUserId: string,
    createdByName: string
  ): Promise<void> {
    // Notify admins and owners about user creation
    await this.createNotificationForRoles(workspaceId, ['owner', 'admin'], {
      type: 'user_created',
      title: 'New User Created',
      message: `${newUserName} (${newUserEmail}) was created by ${createdByName}`,
      priority: 'medium',
      actionUrl: '/dashboard/users',
      actionLabel: 'View Users',
      metadata: {
        targetName: newUserName,
        targetId: newUserEmail,
        newUserId: newUserId,
        actorId: actorId,
        actorName: createdByName
      }
    });

    // Also notify the new user themselves (welcome notification)
    await this.createNotification({
      userId: newUserId,
      workspaceId,
      type: 'user_created',
      title: 'Welcome to the workspace!',
      message: `Your account has been created by ${createdByName}. Welcome to the team!`,
      priority: 'medium',
      actionUrl: '/dashboard/profile',
      actionLabel: 'View Profile',
      metadata: {
        actorId: actorId,
        actorName: createdByName,
        isWelcomeMessage: true
      }
    });
  }

  static async notifyUserInvited(
    actorId: string,
    workspaceId: string,
    invitedEmail: string,
    invitedByName: string
  ): Promise<void> {
    // Only notify admins and owners about invitations
    await this.createNotificationForRoles(workspaceId, ['owner', 'admin'], {
      type: 'user_invited',
      title: 'User Invitation Sent',
      message: `Invitation sent to ${invitedEmail} by ${invitedByName}`,
      priority: 'low',
      actionUrl: '/dashboard/users',
      actionLabel: 'View Invitations',
      metadata: {
        targetId: invitedEmail,
        actorId: actorId,
        actorName: invitedByName
      }
    });
  }

  static async notifyRoleChanged(
    actorId: string,
    workspaceId: string,
    targetUserId: string,
    userName: string,
    oldRole: string,
    newRole: string,
    changedByName: string
  ): Promise<void> {
    // Notify admins and owners about role changes
    await this.createNotificationForRoles(workspaceId, ['owner', 'admin'], {
      type: 'role_changed',
      title: 'User Role Updated',
      message: `${userName}'s role changed from ${oldRole} to ${newRole} by ${changedByName}`,
      priority: 'medium',
      actionUrl: '/dashboard/users',
      actionLabel: 'View Users',
      metadata: {
        targetUserId: targetUserId,
        targetName: userName,
        oldValue: oldRole,
        newValue: newRole,
        actorId: actorId,
        actorName: changedByName
      }
    });

    // Also notify the user whose role was changed
    await this.createNotification({
      userId: targetUserId,
      workspaceId,
      type: 'role_changed',
      title: 'Your Role Has Been Updated',
      message: `Your role has been changed from ${oldRole} to ${newRole} by ${changedByName}`,
      priority: 'high',
      actionUrl: '/dashboard/profile',
      actionLabel: 'View Profile',
      metadata: {
        oldValue: oldRole,
        newValue: newRole,
        actorId: actorId,
        actorName: changedByName,
        isPersonalNotification: true
      }
    });
  }

  static async notifyWorkspaceCreated(
    actorId: string,
    workspaceId: string,
    workspaceName: string,
    createdByName: string
  ): Promise<void> {
    // Only notify owners and admins about workspace creation
    await this.createNotificationForRoles(workspaceId, ['owner', 'admin'], {
      type: 'workspace_created',
      title: 'New Workspace Created',
      message: `Workspace "${workspaceName}" was created by ${createdByName}`,
      priority: 'medium',
      actionUrl: '/dashboard/workspaces',
      actionLabel: 'View Workspaces',
      metadata: {
        targetName: workspaceName,
        actorId: actorId,
        actorName: createdByName
      }
    });
  }

  static async notifyPasswordReset(
    actorId: string,
    workspaceId: string,
    targetUserId: string,
    userEmail: string,
    resetByName: string
  ): Promise<void> {
    // Notify admins and owners about password reset
    await this.createNotificationForRoles(workspaceId, ['owner', 'admin'], {
      type: 'password_reset',
      title: 'Password Reset Sent',
      message: `Password reset email sent to ${userEmail} by ${resetByName}`,
      priority: 'medium',
      metadata: {
        targetUserId: targetUserId,
        targetId: userEmail,
        actorId: actorId,
        actorName: resetByName
      }
    });

    // Also notify the user who received the password reset
    await this.createNotification({
      userId: targetUserId,
      workspaceId,
      type: 'password_reset',
      title: 'Password Reset Email Sent',
      message: `A password reset email has been sent to you by ${resetByName}`,
      priority: 'high',
      actionUrl: '/dashboard/profile',
      actionLabel: 'View Profile',
      metadata: {
        actorId: actorId,
        actorName: resetByName,
        isPersonalNotification: true
      }
    });
  }

  static async notifyUserDeactivated(
    actorId: string,
    workspaceId: string,
    targetUserId: string,
    userName: string,
    deactivatedByName: string
  ): Promise<void> {
    // Notify admins and owners about user deactivation
    await this.createNotificationForRoles(workspaceId, ['owner', 'admin'], {
      type: 'user_deactivated',
      title: 'User Deactivated',
      message: `${userName} was deactivated by ${deactivatedByName}`,
      priority: 'high',
      actionUrl: '/dashboard/users',
      actionLabel: 'View Users',
      metadata: {
        targetUserId: targetUserId,
        targetName: userName,
        actorId: actorId,
        actorName: deactivatedByName
      }
    });

    // Also notify the user who was deactivated
    await this.createNotification({
      userId: targetUserId,
      workspaceId,
      type: 'user_deactivated',
      title: 'Your Account Has Been Deactivated',
      message: `Your account has been deactivated by ${deactivatedByName}. Please contact your administrator if you believe this is an error.`,
      priority: 'urgent',
      actionUrl: '/dashboard/support',
      actionLabel: 'Contact Support',
      metadata: {
        actorId: actorId,
        actorName: deactivatedByName,
        isPersonalNotification: true
      }
    });
  }

  // Additional secure notification helpers
  static async notifyTeamCreated(
    actorId: string,
    workspaceId: string,
    teamName: string,
    teamMembers: string[], // User IDs of team members
    createdByName: string
  ): Promise<void> {
    // Notify admins and owners about team creation
    await this.createNotificationForRoles(workspaceId, ['owner', 'admin'], {
      type: 'team_created',
      title: 'New Team Created',
      message: `Team "${teamName}" was created by ${createdByName} with ${teamMembers.length} member${teamMembers.length > 1 ? 's' : ''}`,
      priority: 'medium',
      actionUrl: '/dashboard/teams',
      actionLabel: 'View Teams',
      metadata: {
        targetName: teamName,
        memberCount: teamMembers.length,
        actorId: actorId,
        actorName: createdByName
      }
    });

    // Notify team members about being added to the team
    const memberNotificationPromises = teamMembers.map(memberId =>
      this.createNotification({
        userId: memberId,
        workspaceId,
        type: 'team_created',
        title: 'Added to New Team',
        message: `You've been added to the team "${teamName}" by ${createdByName}`,
        priority: 'medium',
        actionUrl: '/dashboard/teams',
        actionLabel: 'View Teams',
        metadata: {
          targetName: teamName,
          actorId: actorId,
          actorName: createdByName,
          isPersonalNotification: true
        }
      })
    );

    await Promise.all(memberNotificationPromises);
  }

  static async notifyUserReactivated(
    actorId: string,
    workspaceId: string,
    targetUserId: string,
    userName: string,
    reactivatedByName: string
  ): Promise<void> {
    // Notify admins and owners about user reactivation
    await this.createNotificationForRoles(workspaceId, ['owner', 'admin'], {
      type: 'user_reactivated',
      title: 'User Reactivated',
      message: `${userName} was reactivated by ${reactivatedByName}`,
      priority: 'medium',
      actionUrl: '/dashboard/users',
      actionLabel: 'View Users',
      metadata: {
        targetUserId: targetUserId,
        targetName: userName,
        actorId: actorId,
        actorName: reactivatedByName
      }
    });

    // Notify the user who was reactivated
    await this.createNotification({
      userId: targetUserId,
      workspaceId,
      type: 'user_reactivated',
      title: 'Your Account Has Been Reactivated',
      message: `Your account has been reactivated by ${reactivatedByName}. Welcome back!`,
      priority: 'high',
      actionUrl: '/dashboard/profile',
      actionLabel: 'View Profile',
      metadata: {
        actorId: actorId,
        actorName: reactivatedByName,
        isPersonalNotification: true
      }
    });
  }

  static async notifySystemAlert(
    workspaceId: string,
    title: string,
    message: string,
    priority: Notification['priority'] = 'high',
    targetRoles: ('owner' | 'admin' | 'member')[] = ['owner', 'admin']
  ): Promise<void> {
    // Create system alerts for specified roles only
    await this.createNotificationForRoles(workspaceId, targetRoles.filter(role => role !== 'member') as ('owner' | 'admin')[], {
      type: 'system_alert',
      title: title,
      message: message,
      priority: priority,
      metadata: {
        isSystemAlert: true
      }
    });

    // If members should also receive the alert, handle separately
    if (targetRoles.includes('member')) {
      try {
        const { UserService } = await import('./user-service');
        const workspaceUsers = await UserService.getUsersByWorkspace(workspaceId);
        
        const memberUsers = workspaceUsers.filter(user => user.role === 'member');
        
        const memberNotificationPromises = memberUsers.map(user =>
          this.createNotification({
            userId: user.id,
            workspaceId,
            type: 'system_alert',
            title: title,
            message: message,
            priority: priority,
            metadata: {
              isSystemAlert: true,
              targetRole: 'member'
            }
          })
        );

        await Promise.all(memberNotificationPromises);
      } catch (error) {
        console.error('Error creating member system alerts:', error);
      }
    }
  }

  // Get default icon based on notification type
  private static getDefaultIcon(type: Notification['type']): string {
    const iconMap: Record<Notification['type'], string> = {
      user_created: '👤',
      user_invited: '📧',
      role_changed: '🔄',
      workspace_created: '🏢',
      team_created: '👥',
      user_deactivated: '⏸️',
      user_reactivated: '▶️',
      password_reset: '🔑',
      user_deleted: '🗑️',
      team_updated: '📝',
      workspace_updated: '✏️',
      system_alert: '⚠️'
    };
    return iconMap[type] || '🔔';
  }
} 

export async function sendNotification({
  userId,
  title,
  body,
  type,
  link
}: {
  userId: string;
  title: string;
  body: string;
  type: string;
  link?: string;
}) {
  await addDoc(collection(db, 'notifications'), {
    userId,
    title,
    body,
    type,
    link: link || null,
    createdAt: serverTimestamp(),
    read: false,
  });
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
} 