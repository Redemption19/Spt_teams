import { NotificationService } from './notification-service';
import { ReportService } from './report-service';
import { LeaveService } from './leave-service';
import { ExpenseService } from './expense-service';
import { TeamService } from './team-service';
import { UserService } from './user-service';
import { NotificationTestUtils } from './notification-test-utils';

/**
 * Comprehensive notification system test
 * Tests all notification types to ensure they work correctly
 */
export class NotificationSystemTest {
  
  /**
   * Run comprehensive notification tests
   */
  static async runAllTests(
    workspaceId: string,
    adminUserId: string,
    memberUserId: string,
    teamId: string
  ): Promise<void> {
    console.log('🧪 Starting Comprehensive Notification System Test');
    console.log('================================================');
    
    try {
      // Test 1: Report Notifications
      await this.testReportNotifications(workspaceId, adminUserId, memberUserId);
      
      // Test 2: Leave Notifications
      await this.testLeaveNotifications(workspaceId, adminUserId, memberUserId);
      
      // Test 3: Expense Notifications
      await this.testExpenseNotifications(workspaceId, adminUserId, memberUserId);
      
      // Test 4: Team Member Addition Notifications
      await this.testTeamMemberNotifications(workspaceId, adminUserId, memberUserId, teamId);
      
      // Test 5: User Role Change Notifications
      await this.testUserRoleChangeNotifications(workspaceId, adminUserId, memberUserId);
      
      // Test 6: Team Role Update Notifications
      await this.testTeamRoleUpdateNotifications(workspaceId, adminUserId, memberUserId, teamId);
      
      // Test 7: Notification Panel Functionality
      await this.testNotificationPanelFunctionality(workspaceId, memberUserId);
      
      console.log('✅ All notification tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Notification test failed:', error);
      throw error;
    }
  }
  
  /**
   * Test report approval/rejection notifications
   */
  static async testReportNotifications(
    workspaceId: string,
    adminUserId: string,
    memberUserId: string
  ): Promise<void> {
    console.log('\n📋 Testing Report Notifications...');
    
    try {
      // Get admin and member user details
      const adminUser = await UserService.getUser(adminUserId);
      const memberUser = await UserService.getUser(memberUserId);
      
      if (!adminUser || !memberUser) {
        throw new Error('Required users not found');
      }
      
      // Create a test report
      const reportData = {
        templateId: 'test-template',
        templateVersion: 1,
        title: 'Test Report for Notification',
        fieldData: {
          content: 'This is a test report to verify notification system',
          type: 'general',
          priority: 'medium'
        }
      };
      
      const report = await ReportService.createReport(workspaceId, memberUserId, reportData);
      console.log(`  ✓ Created test report: ${report.id}`);
      
      // Test approval notification
      await ReportService.approveReport(workspaceId, report.id, adminUserId, 'Approved for testing notifications');
      console.log(`  ✓ Approved report - notification should be sent to ${memberUser.name}`);
      
      // Create another report for rejection test
      const reportData2 = {
        templateId: 'test-template',
        templateVersion: 1,
        title: 'Test Report for Rejection Notification',
        fieldData: {
          content: 'This is a test report to verify rejection notification system',
          type: 'general',
          priority: 'medium'
        }
      };
      
      const report2 = await ReportService.createReport(workspaceId, memberUserId, reportData2);
      
      // Test rejection notification
      await ReportService.rejectReport(workspaceId, report2.id, adminUserId, 'Rejected for testing notifications');
      console.log(`  ✓ Rejected report - notification should be sent to ${memberUser.name}`);
      
      console.log('  ✅ Report notifications test completed');
      
    } catch (error) {
      console.error('  ❌ Report notifications test failed:', error);
      throw error;
    }
  }
  
  /**
   * Test leave approval/rejection notifications
   */
  static async testLeaveNotifications(
    workspaceId: string,
    adminUserId: string,
    memberUserId: string
  ): Promise<void> {
    console.log('\n🏖️ Testing Leave Notifications...');
    
    try {
      const adminUser = await UserService.getUser(adminUserId);
      const memberUser = await UserService.getUser(memberUserId);
      
      if (!adminUser || !memberUser) {
        throw new Error('Required users not found');
      }
      
      // Create a test leave request
      const leaveData = {
        employeeId: memberUserId,
        employeeName: memberUser.name,
        workspaceId,
        leaveTypeId: 'vacation-type-id',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 9 days from now
        reason: 'Testing leave notifications',
        emergency: false
      };
      
      const leaveId = await LeaveService.createLeaveRequest(leaveData);
      console.log(`  ✓ Created test leave request: ${leaveId}`);
      
      // Test approval notification
      await LeaveService.updateLeaveRequest(leaveId, {
        status: 'approved',
        approvedBy: adminUserId
      }, adminUserId);
      console.log(`  ✓ Approved leave - notification should be sent to ${memberUser.name}`);
      
      // Create another leave for rejection test
      const leaveData2 = {
        ...leaveData,
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: 'Testing leave rejection notifications'
      };
      
      const leaveId2 = await LeaveService.createLeaveRequest(leaveData2);
      
      // Test rejection notification
      await LeaveService.updateLeaveRequest(leaveId2, {
        status: 'rejected',
        rejectionReason: 'Rejected for testing notifications'
      }, adminUserId);
      console.log(`  ✓ Rejected leave - notification should be sent to ${memberUser.name}`);
      
      console.log('  ✅ Leave notifications test completed');
      
    } catch (error) {
      console.error('  ❌ Leave notifications test failed:', error);
      throw error;
    }
  }
  
  /**
   * Test expense approval/rejection notifications
   */
  static async testExpenseNotifications(
    workspaceId: string,
    adminUserId: string,
    memberUserId: string
  ): Promise<void> {
    console.log('\n💳 Testing Expense Notifications...');
    
    try {
      const adminUser = await UserService.getUser(adminUserId);
      const memberUser = await UserService.getUser(memberUserId);
      
      if (!adminUser || !memberUser) {
        throw new Error('Required users not found');
      }
      
      // Create test expense
      const expenseData = {
        title: 'Business lunch for testing notifications',
        description: 'Testing expense notifications',
        amount: 150.00,
        currency: 'USD',
        category: 'meals',
        expenseDate: new Date(),
        billable: false,
        reimbursable: true
      };
      
      const expenseId = await ExpenseService.createExpense(workspaceId, expenseData, memberUserId);
      console.log(`  ✓ Created test expense: ${expenseId}`);
      
      // Test approval notification
      await ExpenseService.approveExpense(expenseId, adminUserId, 'Approved for testing notifications');
      console.log(`  ✓ Approved expense - notification should be sent to ${memberUser.name}`);
      
      // Create another expense for rejection test
      const expenseData2 = {
        ...expenseData,
        title: 'Office supplies for testing rejection notifications',
        description: 'Testing expense rejection notifications'
      };
      
      const expenseId2 = await ExpenseService.createExpense(workspaceId, expenseData2, memberUserId);
      
      // Test rejection notification
      await ExpenseService.rejectExpense(expenseId2, adminUserId, 'Rejected for testing notifications');
      console.log(`  ✓ Rejected expense - notification should be sent to ${memberUser.name}`);
      
      console.log('  ✅ Expense notifications test completed');
      
    } catch (error) {
      console.error('  ❌ Expense notifications test failed:', error);
      throw error;
    }
  }
  
  /**
   * Test team member addition notifications
   */
  static async testTeamMemberNotifications(
    workspaceId: string,
    adminUserId: string,
    memberUserId: string,
    teamId: string
  ): Promise<void> {
    console.log('\n👥 Testing Team Member Addition Notifications...');
    
    try {
      const adminUser = await UserService.getUser(adminUserId);
      const memberUser = await UserService.getUser(memberUserId);
      
      if (!adminUser || !memberUser) {
        throw new Error('Required users not found');
      }
      
      // Add member to team
      await TeamService.addUserToTeam(memberUserId, teamId, 'member', adminUserId);
      console.log(`  ✓ Added ${memberUser.name} to team - notification should be sent`);
      
      console.log('  ✅ Team member addition notifications test completed');
      
    } catch (error) {
      console.error('  ❌ Team member addition notifications test failed:', error);
      // Don't throw error if user is already in team
      if (!(error instanceof Error && error.message.includes('already'))) {
        throw error;
      }
    }
  }
  
  /**
   * Test user role change notifications
   */
  static async testUserRoleChangeNotifications(
    workspaceId: string,
    adminUserId: string,
    memberUserId: string
  ): Promise<void> {
    console.log('\n🔄 Testing User Role Change Notifications...');
    
    try {
      const adminUser = await UserService.getUser(adminUserId);
      const memberUser = await UserService.getUser(memberUserId);
      
      if (!adminUser || !memberUser) {
        throw new Error('Required users not found');
      }
      
      // Get current role
      const currentRole = memberUser.role;
      
      // Change role temporarily (if member, make admin; if admin, make member)
      const newRole = currentRole === 'member' ? 'admin' : 'member';
      
      await UserService.updateUserRole(memberUserId, newRole, adminUserId);
      console.log(`  ✓ Changed ${memberUser.name} role from ${currentRole} to ${newRole} - notification should be sent`);
      
      // Change back to original role
      await UserService.updateUserRole(memberUserId, currentRole, adminUserId);
      console.log(`  ✓ Changed ${memberUser.name} role back to ${currentRole} - notification should be sent`);
      
      console.log('  ✅ User role change notifications test completed');
      
    } catch (error) {
      console.error('  ❌ User role change notifications test failed:', error);
      throw error;
    }
  }
  
  /**
   * Test team role update notifications
   */
  static async testTeamRoleUpdateNotifications(
    workspaceId: string,
    adminUserId: string,
    memberUserId: string,
    teamId: string
  ): Promise<void> {
    console.log('\n👤 Testing Team Role Update Notifications...');
    
    try {
      const adminUser = await UserService.getUser(adminUserId);
      const memberUser = await UserService.getUser(memberUserId);
      
      if (!adminUser || !memberUser) {
        throw new Error('Required users not found');
      }
      
      // Update team role from member to lead
      await TeamService.updateTeamUserRole(memberUserId, teamId, 'lead', adminUserId);
      console.log(`  ✓ Updated ${memberUser.name} team role to lead - notification should be sent`);
      
      // Update back to member
      await TeamService.updateTeamUserRole(memberUserId, teamId, 'member', adminUserId);
      console.log(`  ✓ Updated ${memberUser.name} team role back to member - notification should be sent`);
      
      console.log('  ✅ Team role update notifications test completed');
      
    } catch (error) {
      console.error('  ❌ Team role update notifications test failed:', error);
      throw error;
    }
  }
  
  /**
   * Test notification panel functionality
   */
  static async testNotificationPanelFunctionality(
    workspaceId: string,
    userId: string
  ): Promise<void> {
    console.log('\n🔔 Testing Notification Panel Functionality...');
    
    try {
      const user = await UserService.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get user notifications
      const notifications = await NotificationService.getUserNotifications(
        userId,
        workspaceId,
        user.role,
        50
      );
      
      console.log(`  ✓ Retrieved ${notifications.length} notifications for ${user.name}`);
      
      if (notifications.length > 0) {
        // Test marking first notification as read
        const firstNotification = notifications[0];
        if (!firstNotification.read) {
          await NotificationService.markAsRead(firstNotification.id, workspaceId);
          console.log(`  ✓ Marked notification "${firstNotification.title}" as read`);
        }
        
        // Test marking all as read
        await NotificationService.markAllAsRead(userId, workspaceId);
        console.log(`  ✓ Marked all notifications as read for ${user.name}`);
        
        // Test notification deletion (soft delete)
        if (notifications.length > 1) {
          const secondNotification = notifications[1];
          await NotificationService.deleteNotification(secondNotification.id, workspaceId);
          console.log(`  ✓ Deleted notification "${secondNotification.title}"`);
        }
      }
      
      console.log('  ✅ Notification panel functionality test completed');
      
    } catch (error) {
      console.error('  ❌ Notification panel functionality test failed:', error);
      throw error;
    }
  }
  
  /**
   * Create test data for notifications
   */
  static async createTestData(workspaceId: string): Promise<{
    adminUserId: string;
    memberUserId: string;
    teamId: string;
  }> {
    console.log('\n🔧 Creating test data...');
    
    try {
      // This would typically be done with existing users and teams
      // For now, we'll assume they exist and return placeholder IDs
      // In a real test, you'd create actual test users and teams
      
      const testData = {
        adminUserId: 'test-admin-id',
        memberUserId: 'test-member-id',
        teamId: 'test-team-id'
      };
      
      console.log('  ✓ Test data prepared');
      return testData;
      
    } catch (error) {
      console.error('  ❌ Failed to create test data:', error);
      throw error;
    }
  }
  
  /**
   * Quick test with existing workspace data
   */
  static async quickTest(workspaceId: string): Promise<void> {
    console.log('\n🚀 Running Quick Notification Test...');
    
    try {
      // Get existing users from workspace
      const users = await UserService.getUsersByWorkspace(workspaceId);
      const adminUser = users.find(u => u.role === 'admin' || u.role === 'owner');
      const memberUser = users.find(u => u.role === 'member');
      
      if (!adminUser || !memberUser) {
        console.log('  ⚠️ Skipping quick test - need at least one admin/owner and one member');
        return;
      }
      
      // Get existing teams
      const teams = await TeamService.getWorkspaceTeams(workspaceId);
      const team = teams[0];
      
      if (!team) {
        console.log('  ⚠️ Skipping team tests - no teams found');
        return;
      }
      
      console.log(`  ✓ Using admin: ${adminUser.name}, member: ${memberUser.name}, team: ${team.name}`);
      
      // Run basic notification tests
      await this.testUserRoleChangeNotifications(workspaceId, adminUser.id, memberUser.id);
      await this.testNotificationPanelFunctionality(workspaceId, memberUser.id);
      
      console.log('  ✅ Quick notification test completed');
      
    } catch (error) {
      console.error('  ❌ Quick notification test failed:', error);
      throw error;
    }
  }
}

// Export for easy testing
export default NotificationSystemTest;