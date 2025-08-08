import { doc, setDoc, serverTimestamp, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ActivityLog {
  id: string;
  type: string;
  action: string;
  userId: string;
  targetId?: string;
  targetType?: string;
  targetName?: string;
  workspaceId: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityService {
  // Log activity
  static async logActivity(
    action: string,
    targetType: string,
    targetId: string,
    metadata: Record<string, any> = {},
    workspaceId: string,
    userId: string
  ): Promise<void> {
    try {
      const activityData = {
        action,
        targetType,
        targetId,
        userId,
        workspaceId,
        metadata,
        timestamp: serverTimestamp(),
        ipAddress: 'mobile-app',
        userAgent: 'SPT-Teams-Mobile',
      };

      // Create a unique ID for the activity
      const activityId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await setDoc(doc(db, 'activities', activityId), activityData);
      
      console.log('Activity logged:', { action, targetType, targetId, userId, workspaceId });
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Get recent activities for a user
  static async getUserActivities(
    userId: string,
    workspaceId: string,
    limitCount: number = 20
  ): Promise<ActivityLog[]> {
    try {
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        where('workspaceId', '==', workspaceId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activities: ActivityLog[] = [];

      activitiesSnapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: data.action,
          action: data.action,
          userId: data.userId,
          targetId: data.targetId,
          targetType: data.targetType,
          targetName: data.targetName,
          workspaceId: data.workspaceId,
          metadata: data.metadata || {},
          timestamp: data.timestamp?.toDate() || new Date(),
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        });
      });

      return activities;
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  }

  // Get recent activities for a workspace
  static async getWorkspaceActivities(
    workspaceId: string,
    limitCount: number = 50
  ): Promise<ActivityLog[]> {
    try {
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('workspaceId', '==', workspaceId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activities: ActivityLog[] = [];

      activitiesSnapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: data.action,
          action: data.action,
          userId: data.userId,
          targetId: data.targetId,
          targetType: data.targetType,
          targetName: data.targetName,
          workspaceId: data.workspaceId,
          metadata: data.metadata || {},
          timestamp: data.timestamp?.toDate() || new Date(),
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        });
      });

      return activities;
    } catch (error) {
      console.error('Error getting workspace activities:', error);
      return [];
    }
  }

  // Get activities by type
  static async getActivitiesByType(
    workspaceId: string,
    actionType: string,
    limitCount: number = 20
  ): Promise<ActivityLog[]> {
    try {
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('workspaceId', '==', workspaceId),
        where('action', '==', actionType),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activities: ActivityLog[] = [];

      activitiesSnapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: data.action,
          action: data.action,
          userId: data.userId,
          targetId: data.targetId,
          targetType: data.targetType,
          targetName: data.targetName,
          workspaceId: data.workspaceId,
          metadata: data.metadata || {},
          timestamp: data.timestamp?.toDate() || new Date(),
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        });
      });

      return activities;
    } catch (error) {
      console.error('Error getting activities by type:', error);
      return [];
    }
  }

  // Log login activity
  static async logLoginActivity(userId: string, workspaceId: string, loginMethod: string = 'email'): Promise<void> {
    await this.logActivity(
      'user_login',
      'user',
      userId,
      { loginMethod },
      workspaceId,
      userId
    );
  }

  // Log logout activity
  static async logLogoutActivity(userId: string, workspaceId: string): Promise<void> {
    await this.logActivity(
      'user_logout',
      'user',
      userId,
      {},
      workspaceId,
      userId
    );
  }

  // Log user creation activity
  static async logUserCreationActivity(userId: string, workspaceId: string, userData: any): Promise<void> {
    await this.logActivity(
      'user_created',
      'user',
      userId,
      { 
        targetName: userData.name || userData.email,
        email: userData.email,
        isNewUser: true
      },
      workspaceId,
      userId
    );
  }

  // Log task creation activity
  static async logTaskCreationActivity(userId: string, workspaceId: string, taskData: any): Promise<void> {
    await this.logActivity(
      'task_created',
      'task',
      taskData.id,
      { 
        targetName: taskData.title,
        priority: taskData.priority,
        status: taskData.status
      },
      workspaceId,
      userId
    );
  }

  // Log task update activity
  static async logTaskUpdateActivity(userId: string, workspaceId: string, taskData: any, changes: any): Promise<void> {
    await this.logActivity(
      'task_updated',
      'task',
      taskData.id,
      { 
        targetName: taskData.title,
        changes,
        previousStatus: changes.previousStatus,
        newStatus: changes.newStatus
      },
      workspaceId,
      userId
    );
  }

  // Log expense creation activity
  static async logExpenseCreationActivity(userId: string, workspaceId: string, expenseData: any): Promise<void> {
    await this.logActivity(
      'expense_created',
      'expense',
      expenseData.id,
      { 
        targetName: expenseData.description || `Expense ${expenseData.amount}`,
        amount: expenseData.amount,
        currency: expenseData.currency,
        category: expenseData.category
      },
      workspaceId,
      userId
    );
  }

  // Log expense approval activity
  static async logExpenseApprovalActivity(userId: string, workspaceId: string, expenseData: any, approvedBy: string): Promise<void> {
    await this.logActivity(
      'expense_approved',
      'expense',
      expenseData.id,
      { 
        targetName: expenseData.description || `Expense ${expenseData.amount}`,
        amount: expenseData.amount,
        approvedBy,
        previousStatus: 'pending',
        newStatus: 'approved'
      },
      workspaceId,
      userId
    );
  }

  // Log document upload activity
  static async logDocumentUploadActivity(userId: string, workspaceId: string, documentData: any): Promise<void> {
    await this.logActivity(
      'document_uploaded',
      'document',
      documentData.id,
      { 
        targetName: documentData.name,
        fileType: documentData.type,
        fileSize: documentData.size
      },
      workspaceId,
      userId
    );
  }

  // Log team creation activity
  static async logTeamCreationActivity(userId: string, workspaceId: string, teamData: any): Promise<void> {
    await this.logActivity(
      'team_created',
      'team',
      teamData.id,
      { 
        targetName: teamData.name,
        description: teamData.description
      },
      workspaceId,
      userId
    );
  }

  // Log member addition activity
  static async logMemberAdditionActivity(userId: string, workspaceId: string, memberData: any, addedBy: string): Promise<void> {
    await this.logActivity(
      'member_added',
      'user',
      memberData.id,
      { 
        targetName: memberData.name || memberData.email,
        addedBy,
        role: memberData.role
      },
      workspaceId,
      userId
    );
  }

  // Log permission change activity
  static async logPermissionChangeActivity(userId: string, workspaceId: string, targetUserId: string, permissionData: any): Promise<void> {
    await this.logActivity(
      'permission_changed',
      'user',
      targetUserId,
      { 
        previousRole: permissionData.previousRole,
        newRole: permissionData.newRole,
        permissions: permissionData.permissions
      },
      workspaceId,
      userId
    );
  }
}
