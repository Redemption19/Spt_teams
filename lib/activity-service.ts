import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { ActivityLog } from './types';
import { UserService } from './user-service';

export type ActivityType = 
  | 'user_created' | 'user_updated' | 'user_deleted' | 'user_login' | 'user_logout'
  | 'team_created' | 'team_updated' | 'team_deleted' | 'team_member_added' | 'team_member_removed'
  | 'branch_created' | 'branch_updated' | 'branch_deleted' | 'branch_manager_assigned'
  | 'region_created' | 'region_updated' | 'region_deleted'
  | 'workspace_created' | 'workspace_updated' | 'workspace_settings_changed'
  | 'invitation_sent' | 'invitation_accepted' | 'invitation_declined' | 'invitation_expired'
  | 'project_created' | 'project_updated' | 'project_completed' | 'project_archived' | 'project_deleted'
  | 'task_created' | 'task_updated' | 'task_completed' | 'task_assigned'
  | 'report_created' | 'report_submitted' | 'report_approved'
  | 'folder_created' | 'folder_updated' | 'folder_deleted'
  | 'settings_changed' | 'security_event' | 'system_event';

export interface EnhancedActivityLog extends ActivityLog {
  type: ActivityType;
  userName: string;
  userAvatar?: string;
  targetName?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'user' | 'team' | 'system' | 'security' | 'content';
}

export class ActivityService {
  /**
   * Log an activity
   */
  static async logActivity(
    action: ActivityType,
    entity: string,
    entityId: string,
    details: Record<string, any> = {},
    workspaceId?: string,
    userId?: string
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      const actorUserId = userId || currentUser?.uid;
      
      if (!actorUserId) {
        console.warn('Cannot log activity: No user ID provided');
        return;
      }

      // Get workspace ID from context if not provided
      const targetWorkspaceId = workspaceId || details.workspaceId;
      if (!targetWorkspaceId) {
        console.warn('Cannot log activity: No workspace ID provided');
        return;
      }

      const activityRef = doc(collection(db, 'activityLogs'));
      const activityId = activityRef.id;
      
      const activity: ActivityLog = {
        id: activityId,
        workspaceId: targetWorkspaceId,
        userId: actorUserId,
        action,
        entity,
        entityId,
        details: {
          ...details,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
          ip: details.ip || 'Unknown',
        },
        timestamp: new Date(),
      };

      await setDoc(activityRef, activity);
      console.log('Activity logged:', { action, entity, entityId });
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Get activities for a workspace
   */
  static async getWorkspaceActivities(
    workspaceId: string,
    limitCount: number = 50
  ): Promise<EnhancedActivityLog[]> {
    try {
      const activitiesRef = collection(db, 'activityLogs');
      const q = query(
        activitiesRef,
        where('workspaceId', '==', workspaceId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp,
        } as ActivityLog;
      });

      // Enhance activities with user information and formatting
      return await this.enhanceActivities(activities);
    } catch (error) {
      console.error('Error fetching workspace activities:', error);
      throw error;
    }
  }

  /**
   * Get activities by type
   */
  static async getActivitiesByType(
    workspaceId: string,
    types: ActivityType[],
    limitCount: number = 50
  ): Promise<EnhancedActivityLog[]> {
    try {
      const activitiesRef = collection(db, 'activityLogs');
      const q = query(
        activitiesRef,
        where('workspaceId', '==', workspaceId),
        where('action', 'in', types),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp,
        } as ActivityLog;
      });

      return await this.enhanceActivities(activities);
    } catch (error) {
      console.error('Error fetching activities by type:', error);
      throw error;
    }
  }

  /**
   * Get user activities
   */
  static async getUserActivities(
    workspaceId: string,
    userId: string,
    limitCount: number = 50
  ): Promise<EnhancedActivityLog[]> {
    try {
      const activitiesRef = collection(db, 'activityLogs');
      const q = query(
        activitiesRef,
        where('workspaceId', '==', workspaceId),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp,
        } as ActivityLog;
      });

      return await this.enhanceActivities(activities);
    } catch (error) {
      console.error('Error fetching user activities:', error);
      throw error;
    }
  }

  /**
   * Get activity statistics
   */
  static async getActivityStats(workspaceId: string): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    critical: number;
    activeUsers: number;
    byCategory: Record<string, number>;
    byType: Record<ActivityType, number>;
  }> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all activities for the month
      const activitiesRef = collection(db, 'activityLogs');
      const q = query(
        activitiesRef,
        where('workspaceId', '==', workspaceId),
        where('timestamp', '>=', thisMonth),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp,
        } as ActivityLog;
      });

      // Calculate stats
      const todayCount = activities.filter(a => a.timestamp >= today).length;
      const weekCount = activities.filter(a => a.timestamp >= thisWeek).length;
      const monthCount = activities.length;

      // Get unique active users
      const activeUserIds = new Set(
        activities
          .filter(a => a.timestamp >= today)
          .map(a => a.userId)
      );

      // Count by category and type
      const byCategory: Record<string, number> = {};
      const byType: Record<ActivityType, number> = {} as Record<ActivityType, number>;
      let criticalCount = 0;

      activities.forEach(activity => {
        const category = this.getCategoryFromAction(activity.action as ActivityType);
        byCategory[category] = (byCategory[category] || 0) + 1;
        byType[activity.action as ActivityType] = (byType[activity.action as ActivityType] || 0) + 1;
        
        if (this.getSeverityFromAction(activity.action as ActivityType) === 'critical') {
          criticalCount++;
        }
      });

      return {
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
        critical: criticalCount,
        activeUsers: activeUserIds.size,
        byCategory,
        byType,
      };
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      throw error;
    }
  }

  /**
   * Enhance activities with user information and formatting
   */
  private static async enhanceActivities(activities: ActivityLog[]): Promise<EnhancedActivityLog[]> {
    const userIds = Array.from(new Set(activities.map(a => a.userId)));
    const users = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const user = await UserService.getUser(userId);
          return { userId, user };
        } catch {
          return { userId, user: null };
        }
      })
    );

    const userMap = new Map(users.map(({ userId, user }) => [userId, user]));

    return activities.map(activity => {
      const user = userMap.get(activity.userId);
      const type = activity.action as ActivityType;
      
      return {
        ...activity,
        type,
        userName: user?.name || user?.email || 'Unknown User',
        userAvatar: user?.avatar,
        targetName: activity.details?.targetName || activity.details?.name || activity.entityId,
        description: this.getActivityDescription(type, activity),
        severity: this.getSeverityFromAction(type),
        category: this.getCategoryFromAction(type),
      } as EnhancedActivityLog;
    });
  }

  /**
   * Get human-readable description for activity
   */
  private static getActivityDescription(type: ActivityType, activity: ActivityLog): string {
    const target = activity.details?.targetName || activity.details?.name || activity.entityId;
    
    switch (type) {
      case 'user_created': return `Created user account for ${target}`;
      case 'user_updated': return `Updated user profile for ${target}`;
      case 'user_deleted': return `Removed user account: ${target}`;
      case 'user_login': return `Logged into the system`;
      case 'user_logout': return `Logged out of the system`;
      
      case 'team_created': return `Created team: ${target}`;
      case 'team_updated': return `Updated team: ${target}`;
      case 'team_deleted': return `Deleted team: ${target}`;
      case 'team_member_added': return `Added member to team: ${target}`;
      case 'team_member_removed': return `Removed member from team: ${target}`;
      
      case 'branch_created': return `Created branch: ${target}`;
      case 'branch_updated': return `Updated branch: ${target}`;
      case 'branch_deleted': return `Deleted branch: ${target}`;
      case 'branch_manager_assigned': return `Assigned manager to branch: ${target}`;
      
      case 'region_created': return `Created region: ${target}`;
      case 'region_updated': return `Updated region: ${target}`;
      case 'region_deleted': return `Deleted region: ${target}`;
      
      case 'workspace_created': return `Created workspace: ${target}`;
      case 'workspace_updated': return `Updated workspace: ${target}`;
      case 'workspace_settings_changed': return `Changed workspace settings`;
      
      case 'invitation_sent': return `Sent invitation to ${target}`;
      case 'invitation_accepted': return `Accepted invitation`;
      case 'invitation_declined': return `Declined invitation`;
      case 'invitation_expired': return `Invitation expired: ${target}`;
      
      case 'project_created': return `Created project: ${target}`;
      case 'project_updated': return `Updated project: ${target}`;
      case 'project_completed': return `Completed project: ${target}`;
      case 'project_archived': return `Archived project: ${target}`;
      case 'project_deleted': return `Deleted project: ${target}`;
      
      case 'task_created': return `Created task: ${target}`;
      case 'task_updated': return `Updated task: ${target}`;
      case 'task_completed': return `Completed task: ${target}`;
      case 'task_assigned': return `Assigned task: ${target}`;
      
      case 'report_created': return `Created report: ${target}`;
      case 'report_submitted': return `Submitted report: ${target}`;
      case 'report_approved': return `Approved report: ${target}`;
      
      case 'folder_created': return `Created folder: ${target}`;
      case 'folder_updated': return `Updated folder: ${target}`;
      case 'folder_deleted': return `Deleted folder: ${target}`;
      
      case 'settings_changed': return `Changed system settings`;
      case 'security_event': return `Security event: ${activity.details?.event || 'Unknown'}`;
      case 'system_event': return `System event: ${activity.details?.event || 'Unknown'}`;
      
      default: return `Performed action: ${type}`;
    }
  }

  /**
   * Get severity level for activity type
   */
  private static getSeverityFromAction(type: ActivityType): 'low' | 'medium' | 'high' | 'critical' {
    const criticalActions: ActivityType[] = ['user_deleted', 'team_deleted', 'branch_deleted', 'project_deleted', 'workspace_settings_changed', 'security_event'];
    const highActions: ActivityType[] = ['user_created', 'team_created', 'branch_created', 'region_created', 'workspace_created'];
    const mediumActions: ActivityType[] = ['user_updated', 'team_updated', 'branch_updated', 'project_created', 'invitation_sent'];
    
    if (criticalActions.includes(type)) return 'critical';
    if (highActions.includes(type)) return 'high';
    if (mediumActions.includes(type)) return 'medium';
    return 'low';
  }

  /**
   * Get category for activity type
   */
  private static getCategoryFromAction(type: ActivityType): 'user' | 'team' | 'system' | 'security' | 'content' {
    if (type.startsWith('user_')) return 'user';
    if (type.startsWith('team_') || type.startsWith('branch_') || type.startsWith('region_')) return 'team';
    if (type.startsWith('workspace_') || type.startsWith('settings_') || type === 'system_event') return 'system';
    if (type === 'security_event' || type.includes('login') || type.includes('logout')) return 'security';
    return 'content';
  }
} 