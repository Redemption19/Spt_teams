'use client';

import { TaskService } from '../task-service';
import { TeamService } from '../team-service';
import { WorkspaceService } from '../workspace-service';
import { KnowledgeContext } from '../ai-knowledge-service';

export class SuggestionKnowledgeService {
  /**
   * Check if query is asking for suggestions or recommendations
   */
  static isSuggestionQuery(query: string): boolean {
    const suggestionKeywords = [
      'suggestion', 'recommend', 'advice', 'tip', 'help me', 'what should',
      'how can i', 'best way', 'optimize', 'improve'
    ];
    return suggestionKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Get smart suggestions based on current context
   */
  static async getSmartSuggestions(context: KnowledgeContext): Promise<string> {
    const { workspace, user, query } = context;
    
    try {
      let suggestions = '\nSMART SUGGESTIONS:\n';
      
      // Get current data to analyze
      const tasks = await TaskService.getWorkspaceTasks(workspace.id);
      const userTasks = await TaskService.getUserAssignedTasks(user.id, workspace.id);
      
      // Suggest based on workload
      const pendingTasks = userTasks.filter(t => t.status !== 'completed');
      if (pendingTasks.length > 5) {
        suggestions += '• Consider prioritizing your tasks - you have many pending items\n';
      }
      
      // Suggest based on overdue items
      const overdueTasks = userTasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) < new Date();
      });
      
      if (overdueTasks.length > 0) {
        suggestions += `• Focus on ${overdueTasks.length} overdue tasks to get back on track\n`;
      }
      
      // Suggest based on team collaboration
      const teams = await TeamService.getUserTeams(user.id, workspace.id);
      if (teams.length > 0) {
        suggestions += '• Check in with your team members on shared projects\n';
      }
      
      // Role-specific suggestions
      if (user.role === 'admin' || user.role === 'owner') {
        const allTasks = await TaskService.getWorkspaceTasks(workspace.id);
        const unassignedTasks = allTasks.filter(t => !(t as any).assignedTo);
        
        if (unassignedTasks.length > 0) {
          suggestions += `• ${unassignedTasks.length} tasks need to be assigned to team members\n`;
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error('❌ Error getting smart suggestions:', error);
      return '\nSMART SUGGESTIONS: Unable to generate suggestions.\n';
    }
  }

  /**
   * Get workspace suggestions when current workspace has no data
   */
  static async getWorkspaceSuggestions(userId: string, currentWorkspaceId: string): Promise<string> {
    try {
      // Get user's accessible workspaces
      const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
      
      if (userWorkspaces.length <= 1) {
        return '\nWorkspace suggestions: You only have access to one workspace.';
      }
      
      // Check which workspaces have data
      const workspaceDataSummary = await Promise.all(
        userWorkspaces.map(async (uw) => {
          const workspace = uw.workspace;
          if (workspace.id === currentWorkspaceId) {
            return null; // Skip current workspace
          }
          
          try {
            const [tasks, teams] = await Promise.all([
              TaskService.getWorkspaceTasks(workspace.id),
              TeamService.getWorkspaceTeams(workspace.id)
            ]);
            
            return {
              name: workspace.name,
              id: workspace.id,
              type: workspace.workspaceType,
              taskCount: tasks.length,
              teamCount: teams.length,
              hasData: tasks.length > 0 || teams.length > 0
            };
          } catch (error) {
            console.error(`❌ Error checking workspace ${workspace.name}:`, error);
            return null;
          }
        })
      );
      
      const validWorkspaces = workspaceDataSummary.filter((w): w is NonNullable<typeof w> => w !== null);
      const workspacesWithData = validWorkspaces.filter(w => w.hasData);
      
      if (workspacesWithData.length === 0) {
        return '\nWorkspace suggestions: No other workspaces have data yet.';
      }
      
      const suggestions = workspacesWithData
        .map(w => `"${w.name}" (${w.taskCount} tasks, ${w.teamCount} teams)`)
        .join(', ');
      
      return `\nWorkspace suggestions: You might want to switch to: ${suggestions}`;
    } catch (error) {
      console.error('❌ Error getting workspace suggestions:', error);
      return '\nWorkspace suggestions: Unable to check other workspaces.';
    }
  }
}
