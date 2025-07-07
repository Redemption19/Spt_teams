'use client';

import { TaskService } from '../task-service';
import { KnowledgeContext } from '../ai-knowledge-service';

export class CalendarKnowledgeService {
  /**
   * Check if query is asking for calendar or scheduling information
   */
  static isCalendarRelated(query: string): boolean {
    const calendarKeywords = [
      'calendar', 'schedule', 'deadline', 'due', 'upcoming', 'overdue',
      'this week', 'next week', 'today', 'tomorrow', 'meeting', 'appointment'
    ];
    return calendarKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Check if query is asking for notifications or alerts
   */
  static isNotificationRelated(query: string): boolean {
    const notificationKeywords = [
      'notification', 'alert', 'reminder', 'urgent', 'pending', 'approval',
      'waiting', 'review', 'action required', 'priority'
    ];
    return notificationKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Get calendar and scheduling insights
   */
  static async getCalendarInsights(context: KnowledgeContext): Promise<string> {
    const { workspace, user } = context;
    
    try {
      let calendarData = '\nCALENDAR INSIGHTS:\n';
      
      // Get tasks with due dates
      const tasks = await TaskService.getWorkspaceTasks(workspace.id);
      const tasksWithDueDates = tasks.filter(t => t.dueDate && t.status !== 'completed');
      
      // Upcoming deadlines
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      const upcomingTasks = tasksWithDueDates.filter(t => {
        const dueDate = new Date(t.dueDate!);
        return dueDate >= today && dueDate <= nextWeek;
      });
      
      // Overdue tasks
      const overdueTasks = tasksWithDueDates.filter(t => {
        const dueDate = new Date(t.dueDate!);
        return dueDate < today;
      });
      
      // Schedule distribution
      const scheduleByDay = new Map<string, number>();
      upcomingTasks.forEach(task => {
        const day = new Date(task.dueDate!).toLocaleDateString('en-US', { weekday: 'long' });
        scheduleByDay.set(day, (scheduleByDay.get(day) || 0) + 1);
      });
      
      calendarData += `- Tasks due this week: ${upcomingTasks.length}
- Overdue tasks: ${overdueTasks.length}
- Busiest day this week: ${scheduleByDay.size > 0 ? 
  Array.from(scheduleByDay.entries()).sort((a, b) => b[1] - a[1])[0][0] : 'None'}
`;
      
      if (upcomingTasks.length > 0) {
        calendarData += `\nUPCOMING DEADLINES:
${upcomingTasks.slice(0, 5).map(t => 
  `• ${t.title} - Due: ${new Date(t.dueDate!).toLocaleDateString()}`
).join('\n')}`;
      }
      
      return calendarData;
    } catch (error) {
      console.error('❌ Error getting calendar insights:', error);
      return '\nCALENDAR INSIGHTS: Unable to fetch calendar data.\n';
    }
  }

  /**
   * Get notification and alert summary
   */
  static async getNotificationSummary(context: KnowledgeContext): Promise<string> {
    const { workspace, user } = context;
    
    try {
      let notifications = '\nNOTIFICATION SUMMARY:\n';
      
      // Get pending approvals (admin/owner only)
      if (user.role === 'admin' || user.role === 'owner') {
        const { ReportService } = await import('../report-service');
        const pendingReports = await ReportService.getWorkspaceReports(workspace.id, { limit: 50 });
        const reportsNeedingApproval = pendingReports.filter(r => r.status === 'submitted').length;
        
        if (reportsNeedingApproval > 0) {
          notifications += `• ${reportsNeedingApproval} reports waiting for your approval\n`;
        }
      }
      
      // Get user's overdue tasks
      const userTasks = await TaskService.getUserAssignedTasks(user.id, workspace.id);
      const overdueTasks = userTasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) < new Date();
      });
      
      if (overdueTasks.length > 0) {
        notifications += `• ${overdueTasks.length} of your tasks are overdue\n`;
      }
      
      // Get upcoming deadlines
      const upcomingTasks = userTasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        const dueDate = new Date(t.dueDate);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        return dueDate <= threeDaysFromNow;
      });
      
      if (upcomingTasks.length > 0) {
        notifications += `• ${upcomingTasks.length} tasks due within 3 days\n`;
      }
      
      if (notifications === '\nNOTIFICATION SUMMARY:\n') {
        notifications += '• No urgent notifications at this time\n';
      }
      
      return notifications;
    } catch (error) {
      console.error('❌ Error getting notification summary:', error);
      return '\nNOTIFICATION SUMMARY: Unable to fetch notifications.\n';
    }
  }
}
