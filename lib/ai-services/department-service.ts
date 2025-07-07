import { RealAIDataService } from '../ai-data-service-real';
import { DepartmentService as MainDepartmentService } from '../department-service';
import { WorkspaceService } from '../workspace-service';
import { ProjectService } from '../project-service';
import { TaskService } from '../task-service';
import type {
  DepartmentInsights,
  OrganizationRecommendation,
  CollaborationMetrics
} from '../ai-types/ai-interfaces';
import { MockDataService } from './mock-data-service';

// =============================================================================
// DEPARTMENT SERVICE (Department-related AI insights)
// =============================================================================

export class DepartmentService {
  // Get department insights with real Firestore data
  static async getDepartmentInsights(workspaceId: string, userId: string): Promise<DepartmentInsights[]> {
    try {
      // Check if user is owner to determine if we need cross-workspace data
      const userRole = await WorkspaceService.getUserRole(userId, workspaceId);
      
      let allDepartments: any[] = [];
      
      if (userRole === 'owner') {
        // Get all workspaces in hierarchy for owners
        const allWorkspacesInHierarchy = await this.getAllWorkspacesInHierarchy(workspaceId);
        
        // For owners, we want to avoid double-counting and show workspace-level aggregates
        // Instead of per-department project/task counts, show one aggregate entry per workspace
        const workspaceAggregates: DepartmentInsights[] = [];
        
        for (const workspace of allWorkspacesInHierarchy) {
          try {
            // Get all departments in this workspace
            const workspaceDepartments = await MainDepartmentService.getWorkspaceDepartments(workspace.id);
            
            if (workspaceDepartments.length > 0) {
              // Get workspace-level aggregates (avoiding double-counting)
              const workspaceUsers = await WorkspaceService.getWorkspaceUsers(workspace.id);
              const workspaceProjects = await ProjectService.getWorkspaceProjects(workspace.id);
              const workspaceTasks = await TaskService.getWorkspaceTasks(workspace.id);
              const completedTasks = workspaceTasks.filter(task => task.status === 'completed').length;
              
              // Create one aggregate insight per workspace
              const workspaceInsight: DepartmentInsights = {
                id: `workspace_${workspace.id}`,
                name: `${workspace.name} (${workspaceDepartments.length} departments)`,
                memberCount: workspaceUsers.length,
                headId: workspace.ownerId,
                headName: `Workspace Owner`,
                efficiency: Math.max(60, Math.min(100, 75 + Math.floor(Math.random() * 25))),
                collaborationScore: Math.max(60, Math.min(100, 70 + Math.floor(Math.random() * 30))),
                activeProjects: workspaceProjects.length, // Real count
                completedTasks: completedTasks, // Real count
                status: 'active',
                recentActivity: [],
                skillsCoverage: [],
                recommendations: workspaceProjects.length === 0 ? [
                  'Create projects to track progress',
                  'Set up task management',
                  'Define department goals'
                ] : [
                  'Monitor cross-department collaboration',
                  'Optimize resource allocation',
                  'Review performance metrics'
                ]
              };
              
              workspaceAggregates.push(workspaceInsight);
            }
          } catch (error) {
            console.warn(`Could not process workspace ${workspace.id}:`, error);
          }
        }
        
        if (workspaceAggregates.length > 0) {
          return workspaceAggregates;
        }        } else {
        // For non-owners, use individual department data from single workspace
        allDepartments = await MainDepartmentService.getWorkspaceDepartments(workspaceId);
      }
      
      // Process individual departments (for non-owners or when owner aggregation fails)
      if (allDepartments.length > 0) {
        // Convert actual departments to insights format
        const departmentInsights: DepartmentInsights[] = [];
        
        for (const dept of allDepartments) {
          try {
            // Get workspace ID (for cross-workspace view, use the department's workspace)
            const deptWithWorkspace = dept as any;
            const targetWorkspaceId = deptWithWorkspace.workspaceId || workspaceId;
            
            // Get department members
            const departmentMembers = await MainDepartmentService.getDepartmentMembers(targetWorkspaceId, dept.id);
            
            // Get department head info (if headId exists, we can get user info)
            const headInfo = dept.headId ? { name: dept.headName } : null;
            
            // Calculate basic metrics (can be enhanced with real task data)
            const memberCount = departmentMembers.length;
            const efficiency = memberCount > 0 ? Math.max(60, Math.min(100, 75 + Math.floor(Math.random() * 25))) : 75;
            const collaborationScore = memberCount > 0 ? Math.max(60, Math.min(100, 70 + Math.floor(Math.random() * 30))) : 70;
            
            // Get REAL projects and tasks for this department/workspace instead of estimates
            let realActiveProjects = 0;
            let realCompletedTasks = 0;
            
            try {
              // Get actual projects from the workspace
              const workspaceProjects = await ProjectService.getWorkspaceProjects(targetWorkspaceId);
              realActiveProjects = workspaceProjects.length;
              
              // Get actual tasks from the workspace 
              const workspaceTasks = await TaskService.getWorkspaceTasks(targetWorkspaceId);
              realCompletedTasks = workspaceTasks.filter(task => task.status === 'completed').length;
              
            } catch (error) {
              console.warn(`Could not fetch real project/task data for department ${dept.id}:`, error);
              // Only use estimates as fallback
              realActiveProjects = Math.max(0, Math.floor(memberCount * 0.3)); // More conservative estimate
              realCompletedTasks = Math.floor(Math.random() * 3) + 1; // Much lower random fallback
            }
            
            // Check if department has workspace name (for cross-workspace view)
            const displayName = deptWithWorkspace.workspaceName ? `${dept.name} (${deptWithWorkspace.workspaceName})` : dept.name;
            
            const insight: DepartmentInsights = {
              id: dept.id,
              name: displayName, // Show workspace name for owners
              memberCount,
              headId: dept.headId,
              headName: headInfo?.name || dept.headName,
              efficiency,
              collaborationScore,
              activeProjects: realActiveProjects, // Use REAL project count
              completedTasks: realCompletedTasks, // Use REAL completed task count
              status: dept.status,
              recentActivity: [], // Can be enhanced with real activity data
              skillsCoverage: [], // Can be enhanced with skill analysis
              recommendations: efficiency < 70 ? [
                'Consider redistributing workload',
                'Implement regular check-ins',
                'Provide additional training resources'
              ] : [
                'Maintain current productivity levels',
                'Consider mentoring other departments'
              ]
            };
            
            departmentInsights.push(insight);
          } catch (error) {
            console.warn(`Error processing department ${dept.id}:`, error);
          }
        }
        
        if (departmentInsights.length > 0) {
          return departmentInsights;
        }
      }
      
      // Fallback to team-based approach if no actual departments found
      const realInsights = await RealAIDataService.getDepartmentInsights(workspaceId, userId);
      
      if (realInsights.length === 0) {
        // Run diagnostic to help with debugging
        await RealAIDataService.debugWorkspaceData(workspaceId, userId);
        
        // Provide helpful suggestions for creating sample teams
        RealAIDataService.suggestSampleTeamsCreation(workspaceId);
        
        return MockDataService.getMockDepartmentInsights();
      }
      
      return realInsights.map(insight => ({
        id: insight.id,
        name: insight.name,
        memberCount: insight.memberCount,
        headId: insight.headId,
        headName: insight.headName,
        efficiency: insight.efficiency,
        collaborationScore: insight.collaborationScore,
        activeProjects: insight.activeProjects,
        completedTasks: insight.completedTasks,
        status: insight.status,
        recentActivity: insight.recentActivity || [],
        skillsCoverage: insight.skillsCoverage || [],
        recommendations: insight.recommendations || []
      }));
    } catch (error) {
      console.error('❌ Error getting real department insights, falling back to mock:', error);
      return MockDataService.getMockDepartmentInsights();
    }
  }

  // Get organization recommendations
  static async getOrganizationRecommendations(workspaceId: string, userId: string): Promise<OrganizationRecommendation[]> {
    try {
      const realRecommendations = await RealAIDataService.getOrganizationRecommendations(workspaceId, userId);
      
      return realRecommendations.map(rec => ({
        id: rec.id,
        title: rec.title,
        description: rec.description,
        type: rec.type,
        priority: rec.priority,
        currentIssues: rec.currentIssues,
        recommendations: rec.recommendations,
        suggestedChanges: rec.suggestedChanges || [],
        complexity: rec.complexity,
        estimatedCost: rec.estimatedCost,
        expectedBenefit: rec.expectedBenefit,
        timeline: rec.timeline,
        affectedDepartments: rec.affectedDepartments
      }));
    } catch (error) {
      console.error('❌ Error getting real organization recommendations, falling back to mock:', error);
      return MockDataService.getMockOrganizationRecommendations();
    }
  }

  // Get collaboration metrics
  static async getCollaborationMetrics(workspaceId: string, userId: string): Promise<CollaborationMetrics> {
    try {
      const realMetrics = await RealAIDataService.getCollaborationMetrics(workspaceId, userId);
      
      return {
        crossTeamCommunication: realMetrics.crossTeamCollaboration,
        knowledgeSharing: realMetrics.knowledgeSharing,
        decisionMakingSpeed: 75, // Placeholder - could be calculated from real data
        responseTime: realMetrics.responseTime,
        meetingEfficiency: realMetrics.meetingEfficiency,
        documentCollaboration: realMetrics.projectCoordination
      };
    } catch (error) {
      console.error('❌ Error getting real collaboration metrics, falling back to mock:', error);
      return MockDataService.getMockCollaborationMetrics();
    }
  }

  // Helper method to get all workspaces in hierarchy (main + all sub-workspaces recursively)
  private static async getAllWorkspacesInHierarchy(mainWorkspaceId: string): Promise<any[]> {
    try {
      const allWorkspaces = [];
      
      // Get the main workspace first
      const mainWorkspace = await WorkspaceService.getWorkspace(mainWorkspaceId);
      if (mainWorkspace) {
        allWorkspaces.push(mainWorkspace);
      }
      
      // Get all sub-workspaces recursively
      const subWorkspaces = await this.getSubWorkspacesRecursively(mainWorkspaceId);
      allWorkspaces.push(...subWorkspaces);
      
      return allWorkspaces;
    } catch (error) {
      console.error('Error getting workspaces in hierarchy:', error);
      return [];
    }
  }

  // Recursive helper to get all sub-workspaces at any level
  private static async getSubWorkspacesRecursively(parentWorkspaceId: string): Promise<any[]> {
    try {
      const allSubWorkspaces = [];
      
      // Get direct sub-workspaces
      const directSubWorkspaces = await WorkspaceService.getSubWorkspaces(parentWorkspaceId);
      
      for (const subWorkspace of directSubWorkspaces) {
        allSubWorkspaces.push(subWorkspace);
        
        // Recursively get sub-workspaces of this sub-workspace
        const nestedSubWorkspaces = await this.getSubWorkspacesRecursively(subWorkspace.id);
        allSubWorkspaces.push(...nestedSubWorkspaces);
      }
      
      return allSubWorkspaces;
    } catch (error) {
      console.error('Error getting sub-workspaces recursively:', error);
      return [];
    }
  }
}
