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
  | 'user_transferred_out' | 'user_transferred_in'
  | 'team_created' | 'team_updated' | 'team_deleted' | 'team_member_added' | 'team_member_removed'
  | 'team_lead_assigned' | 'team_lead_removed'
  | 'branch_created' | 'branch_updated' | 'branch_deleted' | 'branch_manager_assigned'
  | 'region_created' | 'region_updated' | 'region_deleted'
  | 'workspace_created' | 'workspace_updated' | 'workspace_settings_changed'
  | 'invitation_sent' | 'invitation_accepted' | 'invitation_declined' | 'invitation_expired'
  | 'project_created' | 'project_updated' | 'project_completed' | 'project_archived' | 'project_deleted'
  | 'project_comment_added' | 'project_comment_edited' | 'project_comment_deleted'
  | 'task_created' | 'task_updated' | 'task_completed' | 'task_assigned'
  | 'task_comment_added' | 'task_comment_edited' | 'task_comment_deleted'
  | 'report_created' | 'report_updated' | 'report_submitted' | 'report_approved' | 'report_rejected' | 'report_status_changed' | 'report_deleted'
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
      case 'user_transferred_out': return `Transferred ${target} to ${activity.details?.toWorkspace || 'another workspace'}`;
      case 'user_transferred_in': return `Received ${target} from ${activity.details?.fromWorkspace || 'another workspace'}`;
      case 'user_login': return `Logged into the system`;
      case 'user_logout': return `Logged out of the system`;
      
      case 'team_created': return `Created team: ${target}`;
      case 'team_updated': return `Updated team: ${target}`;
      case 'team_deleted': return `Deleted team: ${target}`;
      case 'team_member_added': return `Added member to team: ${target}`;
      case 'team_member_removed': return `Removed member from team: ${target}`;
      
      case 'team_lead_assigned': return `Assigned lead to team: ${target}`;
      case 'team_lead_removed': return `Removed lead from team: ${target}`;
      
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
      
      case 'project_comment_added': return `Added comment to project: ${target}`;
      case 'project_comment_edited': return `Edited comment in project: ${target}`;
      case 'project_comment_deleted': return `Deleted comment from project: ${target}`;
      
      case 'task_created': return `Created task: ${target}`;
      case 'task_updated': return `Updated task: ${target}`;
      case 'task_completed': return `Completed task: ${target}`;
      case 'task_assigned': return `Assigned task: ${target}`;
      
      case 'task_comment_added': return `Added comment to task: ${target}`;
      case 'task_comment_edited': return `Edited comment in task: ${target}`;
      case 'task_comment_deleted': return `Deleted comment from task: ${target}`;
      
      case 'report_created': return `Created report: ${target}`;
      case 'report_updated': return `Updated report: ${target}`;
      case 'report_submitted': return `Submitted report: ${target}`;
      case 'report_approved': return `Approved report: ${target}`;
      case 'report_rejected': return `Rejected report: ${target}`;
      case 'report_status_changed': return `Changed report status: ${target}`;
      case 'report_deleted': return `Deleted report: ${target}`;
      
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
   * Get category from activity type
   */
  private static getCategoryFromAction(action: ActivityType): 'user' | 'team' | 'system' | 'security' | 'content' {
    switch (action) {
      case 'user_created':
      case 'user_updated':
      case 'user_deleted':
      case 'user_login':
      case 'user_logout':
      case 'user_transferred_out':
      case 'user_transferred_in':
        return 'user';
      
      case 'team_created':
      case 'team_updated':
      case 'team_deleted':
      case 'team_member_added':
      case 'team_member_removed':
      case 'team_lead_assigned':
      case 'team_lead_removed':
        return 'team';
      
      case 'project_created':
      case 'project_updated':
      case 'project_completed':
      case 'project_archived':
      case 'project_deleted':
      case 'project_comment_added':
      case 'project_comment_edited':
      case 'project_comment_deleted':
      case 'task_created':
      case 'task_updated':
      case 'task_completed':
      case 'task_assigned':
      case 'task_comment_added':
      case 'task_comment_edited':
      case 'task_comment_deleted':
      case 'report_created':
      case 'report_updated':
      case 'report_submitted':
      case 'report_approved':
      case 'report_rejected':
      case 'report_status_changed':
      case 'report_deleted':
      case 'folder_created':
      case 'folder_updated':
      case 'folder_deleted':
        return 'content';
      
      case 'security_event':
        return 'security';
      
      case 'branch_created':
      case 'branch_updated':
      case 'branch_deleted':
      case 'branch_manager_assigned':
      case 'region_created':
      case 'region_updated':
      case 'region_deleted':
      case 'workspace_created':
      case 'workspace_updated':
      case 'workspace_settings_changed':
      case 'invitation_sent':
      case 'invitation_accepted':
      case 'invitation_declined':
      case 'invitation_expired':
      case 'settings_changed':
      case 'system_event':
      default:
        return 'system';
    }
  }

  /**
   * Get severity level from activity type
   */
  private static getSeverityFromAction(action: ActivityType): 'low' | 'medium' | 'high' | 'critical' {
    switch (action) {
      case 'user_login':
      case 'user_logout':
      case 'project_comment_added':
      case 'project_comment_edited':
      case 'task_comment_added':
      case 'task_comment_edited':
      case 'task_updated':
      case 'project_updated':
      case 'report_updated':
        return 'low';
      
      case 'user_created':
      case 'user_updated':
      case 'team_created':
      case 'team_updated':
      case 'team_member_added':
      case 'team_member_removed':
      case 'project_created':
      case 'task_created':
      case 'task_assigned':
      case 'task_completed':
      case 'project_completed':
      case 'report_created':
      case 'report_submitted':
      case 'folder_created':
      case 'folder_updated':
      case 'invitation_sent':
      case 'invitation_accepted':
      case 'invitation_declined':
      case 'branch_created':
      case 'branch_updated':
      case 'region_created':
      case 'region_updated':
        return 'medium';
      
      case 'user_deleted':
      case 'team_deleted':
      case 'team_lead_assigned':
      case 'team_lead_removed':
      case 'project_deleted':
      case 'project_archived':
      case 'report_approved':
      case 'report_rejected':
      case 'report_deleted':
      case 'folder_deleted':
      case 'branch_deleted':
      case 'branch_manager_assigned':
      case 'region_deleted':
      case 'workspace_created':
      case 'workspace_updated':
      case 'workspace_settings_changed':
      case 'settings_changed':
      case 'user_transferred_out':
      case 'user_transferred_in':
        return 'high';
      
      case 'security_event':
      case 'system_event':
      case 'invitation_expired':
      case 'project_comment_deleted':
      case 'task_comment_deleted':
      case 'report_status_changed':
      default:
        return 'critical';
    }
  }

  /**
   * Get activities for a workspace with RBAC filtering
   */
  static async getWorkspaceActivitiesWithRBAC(
    workspaceId: string,
    userId: string,
    userRole: 'member' | 'admin' | 'owner',
    limitCount: number = 50
  ): Promise<EnhancedActivityLog[]> {
    try {
      // Get all activities first
      const allActivities = await this.getWorkspaceActivities(workspaceId, limitCount);
      
      // Apply RBAC filtering
      return this.filterActivitiesByRole(allActivities, userId, userRole);
    } catch (error) {
      console.error('Error fetching RBAC workspace activities:', error);
      throw error;
    }
  }

  /**
   * Get activity statistics with RBAC filtering
   */
  static async getActivityStatsWithRBAC(
    workspaceId: string,
    userId: string,
    userRole: 'member' | 'admin' | 'owner'
  ): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    critical: number;
    activeUsers: number;
    byCategory: Record<string, number>;
    byType: Record<ActivityType, number>;
  }> {
    try {
      // Get all activities for stats calculation
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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

      // Enhanced activities
      const enhancedActivities = await this.enhanceActivities(activities);
      
      // Apply RBAC filtering
      const filteredActivities = this.filterActivitiesByRole(enhancedActivities, userId, userRole);

      // Calculate stats from filtered activities
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const todayCount = filteredActivities.filter(a => a.timestamp >= today).length;
      const weekCount = filteredActivities.filter(a => a.timestamp >= thisWeek).length;
      const monthCount = filteredActivities.length;

      // Get unique active users from filtered activities
      const activeUserIds = new Set(
        filteredActivities
          .filter(a => a.timestamp >= today)
          .map(a => a.userId)
      );

      // Count by category and type from filtered activities
      const byCategory: Record<string, number> = {};
      const byType: Record<ActivityType, number> = {} as Record<ActivityType, number>;
      let criticalCount = 0;

      filteredActivities.forEach(activity => {
        byCategory[activity.category] = (byCategory[activity.category] || 0) + 1;
        byType[activity.type] = (byType[activity.type] || 0) + 1;
        
        if (activity.severity === 'critical') {
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
      console.error('Error fetching RBAC activity stats:', error);
      throw error;
    }
  }

  /**
   * Filter activities based on user role and permissions
   */
  private static filterActivitiesByRole(
    activities: EnhancedActivityLog[],
    userId: string,
    userRole: 'member' | 'admin' | 'owner'
  ): EnhancedActivityLog[] {
    return activities.filter(activity => {
      // Owners can see everything
      if (userRole === 'owner') {
        return true;
      }

      // Members can only see:
      // 1. Their own activities
      // 2. Basic content activities they're involved in (projects, tasks, reports)
      // 3. Public team activities (team creation, updates - not sensitive operations)
      if (userRole === 'member') {
        // Always show their own activities
        if (activity.userId === userId) {
          return true;
        }

        // Show basic content activities
        if (activity.category === 'content') {
          // Allow most content activities except deletions and admin-level operations
          const allowedContentTypes: ActivityType[] = [
            'project_created', 'project_updated', 'project_completed',
            'task_created', 'task_updated', 'task_completed', 'task_assigned',
            'project_comment_added', 'project_comment_edited',
            'task_comment_added', 'task_comment_edited',
            'report_created', 'report_updated', 'report_submitted',
            'folder_created', 'folder_updated'
          ];
          return allowedContentTypes.includes(activity.type);
        }

        // Show basic team activities (not sensitive operations)
        if (activity.category === 'team') {
          const allowedTeamTypes: ActivityType[] = [
            'team_created', 'team_updated', 'team_member_added'
          ];
          return allowedTeamTypes.includes(activity.type);
        }

        // Hide all user, system, and security activities by others
        return false;
      }

      // Admins can see:
      // 1. All activities except critical security/system events
      // 2. Cannot see some sensitive user management operations
      if (userRole === 'admin') {
        // Block critical security events
        if (activity.category === 'security' && activity.severity === 'critical') {
          return false;
        }

        // Block critical system events
        if (activity.category === 'system' && activity.severity === 'critical') {
          return false;
        }

        // Block sensitive user management operations
        const restrictedAdminTypes: ActivityType[] = [
          'user_deleted', 
          'user_transferred_out', 
          'user_transferred_in',
          'workspace_created',
          'workspace_settings_changed',
          'settings_changed',
          'security_event',
          'system_event'
        ];
        
        if (restrictedAdminTypes.includes(activity.type)) {
          return false;
        }

        // Allow everything else
        return true;
      }

      // Default: deny access
      return false;
    });
  }

  /**
   * Check if user can view activity details based on role
   */
  static canViewActivityDetails(
    activity: EnhancedActivityLog,
    userId: string,
    userRole: 'member' | 'admin' | 'owner'
  ): boolean {
    // Owners can view all details
    if (userRole === 'owner') {
      return true;
    }

    // Users can always view their own activity details
    if (activity.userId === userId) {
      return true;
    }

    // Admins can view most details except critical security/system events
    if (userRole === 'admin') {
      if (activity.category === 'security' && activity.severity === 'critical') {
        return false;
      }
      if (activity.category === 'system' && activity.severity === 'critical') {
        return false;
      }
      return true;
    }

    // Members can only view basic content and team activities by others
    if (userRole === 'member') {
      return activity.category === 'content' || 
             (activity.category === 'team' && activity.severity !== 'high');
    }

    return false;
  }

  /**
   * Get allowed activity categories for a user role
   */
  static getAllowedCategoriesForRole(userRole: 'member' | 'admin' | 'owner'): string[] {
    switch (userRole) {
      case 'owner':
        return ['user', 'team', 'system', 'security', 'content'];
      case 'admin':
        return ['user', 'team', 'system', 'content']; // Limited system access
      case 'member':
        return ['content', 'team']; // Very limited access
      default:
        return [];
    }
  }

  /**
   * Get allowed severity levels for a user role
   */
  static getAllowedSeveritiesForRole(userRole: 'member' | 'admin' | 'owner'): string[] {
    switch (userRole) {
      case 'owner':
        return ['low', 'medium', 'high', 'critical'];
      case 'admin':
        return ['low', 'medium', 'high']; // No critical system/security events
      case 'member':
        return ['low', 'medium']; // Only basic activities
      default:
        return [];
    }
  }
}