import { NotificationService } from './notification-service';

// Test utilities for demonstrating notification security
export class NotificationTestUtils {
  
  // Create sample notifications for testing role-based security
  static async createTestNotifications(workspaceId: string): Promise<void> {
    try {
      // Create a system alert that should be visible to all roles
      await NotificationService.notifySystemAlert(
        workspaceId,
        'System Maintenance',
        'The system will undergo maintenance tonight from 2-4 AM. All users will be affected.',
        'high',
        ['owner', 'admin', 'member']
      );

      // Create an admin-only system alert
      await NotificationService.notifySystemAlert(
        workspaceId,
        'Admin Alert: Security Update',
        'A security update is available. Please review and apply it.',
        'urgent',
        ['owner', 'admin']
      );

      // Create an owner-only alert
      await NotificationService.notifySystemAlert(
        workspaceId,
        'Owner Alert: Billing Issue',
        'There is an issue with the workspace billing. Please check your payment method.',
        'urgent',
        ['owner']
      );

      console.log('Test notifications created successfully');
    } catch (error) {
      console.error('Error creating test notifications:', error);
    }
  }

  // Log notification counts by role for debugging
  static async debugNotificationsByRole(workspaceId: string): Promise<void> {
    try {
      const { UserService } = await import('./user-service');
      const users = await UserService.getUsersByWorkspace(workspaceId);

      console.log('=== Notification Security Debug ===');
      
      for (const user of users) {
        const notifications = await NotificationService.getUserNotifications(
          user.id,
          workspaceId,
          user.role,
          100
        );

        console.log(`${user.role.toUpperCase()} (${user.name}): ${notifications.length} notifications`);
        notifications.forEach(notification => {
          const isPersonal = notification.metadata?.isPersonalNotification ? '(Personal)' : '';
          const isSystem = notification.metadata?.isSystemAlert ? '(System)' : '';
          console.log(`  - ${notification.title} ${isPersonal}${isSystem}`);
        });
        console.log('');
      }
    } catch (error) {
      console.error('Error debugging notifications:', error);
    }
  }

  // Simulate various user operations to generate notifications
  static async simulateUserOperations(
    actorId: string,
    actorName: string,
    workspaceId: string,
    targetUserId: string,
    targetUserName: string,
    targetUserEmail: string
  ): Promise<void> {
    try {
      console.log('Simulating user operations...');

      // Simulate user creation
      await NotificationService.notifyUserCreated(
        actorId,
        workspaceId,
        'Test User',
        'test@example.com',
        'test-user-id',
        actorName
      );

      // Simulate role change
      await NotificationService.notifyRoleChanged(
        actorId,
        workspaceId,
        targetUserId,
        targetUserName,
        'member',
        'admin',
        actorName
      );

      // Simulate password reset
      await NotificationService.notifyPasswordReset(
        actorId,
        workspaceId,
        targetUserId,
        targetUserEmail,
        actorName
      );

      console.log('User operations simulated successfully');
    } catch (error) {
      console.error('Error simulating user operations:', error);
    }
  }
} 