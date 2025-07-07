'use client';

import { TaskService } from '../task-service';
import { TeamService } from '../team-service';
import { ReportService } from '../report-service';
import { WorkspaceService } from '../workspace-service';
import { KnowledgeContext } from '../ai-knowledge-service';

export class AnalyticsKnowledgeService {
  /**
   * Check if query is asking for analytics or insights
   */
  static isAnalyticsRelated(query: string): boolean {
    const analyticsKeywords = [
      'analytics', 'performance', 'trends', 'insights', 'metrics', 'statistics',
      'overview', 'summary', 'dashboard', 'progress', 'completion rate',
      'productivity', 'efficiency', 'workload', 'distribution', 'utilization'
    ];
    return analyticsKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Check if query is asking for predictions or recommendations
   */
  static isPredictiveQuery(query: string): boolean {
    const predictiveKeywords = [
      'predict', 'forecast', 'recommend', 'suggest', 'advice', 'should i',
      'what to do', 'next steps', 'priorities', 'focus on', 'upcoming',
      'deadline', 'risk', 'bottleneck', 'improve'
    ];
    return predictiveKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Get performance analytics and trends
   */
  static async getPerformanceAnalytics(context: KnowledgeContext): Promise<string> {
    const { workspace, user } = context;
    
    try {
      let analyticsData = '\nPERFORMANCE ANALYTICS:\n';
      
      // Task completion trends
      const tasks = await TaskService.getWorkspaceTasks(workspace.id);
      const completedThisWeek = tasks.filter(t => {
        if (!t.updatedAt || t.status !== 'completed') return false;
        const completedDate = new Date(t.updatedAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return completedDate >= weekAgo;
      }).length;
      
      const overdueTasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) < new Date();
      }).length;
      
      // Team productivity metrics
      const teams = await TeamService.getWorkspaceTeams(workspace.id);
      const activeTeams = teams.filter(t => (t as any).lastActivity && 
        new Date((t as any).lastActivity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      
      analyticsData += `- Tasks completed this week: ${completedThisWeek}
- Overdue tasks: ${overdueTasks}
- Active teams (last 7 days): ${activeTeams}
- Task completion rate: ${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
`;
      
      return analyticsData;
    } catch (error) {
      console.error('❌ Error getting performance analytics:', error);
      return '\nPERFORMANCE ANALYTICS: Unable to fetch analytics data.\n';
    }
  }

  /**
   * Get predictive insights and recommendations
   */
  static async getPredictiveInsights(context: KnowledgeContext): Promise<string> {
    const { workspace, user } = context;
    
    try {
      let insights = '\nPREDICTIVE INSIGHTS:\n';
      
      const tasks = await TaskService.getWorkspaceTasks(workspace.id);
      const reports = user.role === 'admin' || user.role === 'owner' 
        ? await ReportService.getWorkspaceReports(workspace.id, { limit: 50 })
        : await ReportService.getUserReports(workspace.id, user.id, { limit: 50 });
      
      // Deadline risk analysis
      const upcomingDeadlines = tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        const dueDate = new Date(t.dueDate);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        return dueDate <= threeDaysFromNow;
      });
      
      // Workload distribution
      const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
      
      insights += `- Tasks due within 3 days: ${upcomingDeadlines.length}
- High priority pending tasks: ${highPriorityTasks.length}
- Reports awaiting review: ${reports.filter(r => r.status === 'submitted').length}
`;
      
      // Recommendations
      if (upcomingDeadlines.length > 0) {
        insights += `\nRECOMMENDATIONS:
- Focus on ${upcomingDeadlines.length} tasks with upcoming deadlines
`;
      }
      
      if (highPriorityTasks.length > 3) {
        insights += `- Consider redistributing high priority tasks (${highPriorityTasks.length} pending)
`;
      }
      
      return insights;
    } catch (error) {
      console.error('❌ Error getting predictive insights:', error);
      return '\nPREDICTIVE INSIGHTS: Unable to generate insights.\n';
    }
  }

  /**
   * Get resource utilization analysis
   */
  static async getResourceUtilization(context: KnowledgeContext): Promise<string> {
    const { workspace, user } = context;
    
    try {
      if (user.role !== 'owner' && user.role !== 'admin') {
        return '\nRESOURCE UTILIZATION: Access restricted to admins and owners.\n';
      }
      
      let utilization = '\nRESOURCE UTILIZATION:\n';
      
      const workspaceUsers = await WorkspaceService.getWorkspaceUsers(workspace.id);
      const tasks = await TaskService.getWorkspaceTasks(workspace.id);
      
      // User workload distribution
      const userTaskCounts = new Map();
      for (const task of tasks) {
        if (task.status !== 'completed' && (task as any).assignedTo) {
          const userId = (task as any).assignedTo;
          userTaskCounts.set(userId, (userTaskCounts.get(userId) || 0) + 1);
        }
      }
      
      const avgTasksPerUser = userTaskCounts.size > 0 
        ? Array.from(userTaskCounts.values()).reduce((a, b) => a + b, 0) / userTaskCounts.size 
        : 0;
      
      const maxTasksPerUser = userTaskCounts.size > 0 
        ? Math.max(...Array.from(userTaskCounts.values())) 
        : 0;
      
      utilization += `- Total active users: ${workspaceUsers.length}
- Users with assigned tasks: ${userTaskCounts.size}
- Average tasks per user: ${Math.round(avgTasksPerUser * 10) / 10}
- Maximum tasks assigned to one user: ${maxTasksPerUser}
- Workload balance: ${maxTasksPerUser > avgTasksPerUser * 2 ? 'Unbalanced' : 'Balanced'}
`;
      
      return utilization;
    } catch (error) {
      console.error('❌ Error getting resource utilization:', error);
      return '\nRESOURCE UTILIZATION: Unable to fetch utilization data.\n';
    }
  }
}
