import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import type {
  UserActivity,
  TeamInsights,
  WorkspaceAnalytics,
  DepartmentInsights
} from '../ai-types/ai-interfaces';
import { MockDataService } from './mock-data-service';
import { WorkspaceService } from '../workspace-service';
import { ProjectService } from '../project-service';
import { TaskService } from '../task-service';
import { DepartmentService } from '../department-service';

// =============================================================================
// ANALYTICS SERVICE (Methods specifically for analytics dashboard)
// =============================================================================

export class AnalyticsService {
  // User activity data for analytics - fetch from actual tasks
  static async getUserActivityData(userId: string, workspaceId: string): Promise<UserActivity[]> {
    try {
      // Check if user is owner to determine if we need cross-workspace data
      const userRole = await WorkspaceService.getUserRole(userId, workspaceId);
      
      let allTasks = [];
      
      if (userRole === 'owner') {
        // Get all workspaces in hierarchy for owners
        const allWorkspacesInHierarchy = await this.getAllWorkspacesInHierarchy(workspaceId);
        
        // Aggregate tasks from all workspaces
        for (const workspace of allWorkspacesInHierarchy) {
          try {
            const workspaceTasks = await TaskService.getWorkspaceTasks(workspace.id);
            
            // Filter tasks related to the user and add workspace context
            const userTasks = workspaceTasks
              .filter(task => 
                task.assigneeId === userId || 
                task.createdBy === userId ||
                (task.assigneeId && Array.isArray(task.assigneeId) && task.assigneeId.includes(userId))
              )
              .map(task => ({ ...task, workspaceName: workspace.name }));
            
            allTasks.push(...userTasks);
          } catch (error) {
            console.warn(`Could not fetch tasks from workspace ${workspace.id}:`, error);
          }
        }
      } else {
        // For non-owners, use single workspace data
        allTasks = await TaskService.getWorkspaceTasks(workspaceId);
        
        // Filter tasks assigned to or created by the user
        allTasks = allTasks.filter(task => 
          task.assigneeId === userId || 
          task.createdBy === userId ||
          (task.assigneeId && Array.isArray(task.assigneeId) && task.assigneeId.includes(userId))
        );
      }
      
      // Convert tasks to activity format
      const activities: UserActivity[] = allTasks.map(task => {
        const taskWithWorkspace = task as any;
        const description = taskWithWorkspace.workspaceName 
          ? `${task.title || 'Task activity'} (${taskWithWorkspace.workspaceName})`
          : task.title || 'Task activity';
          
        return {
          id: task.id,
          userId: userId,
          workspaceId: taskWithWorkspace.workspaceId || workspaceId,
          type: 'task',
          action: task.status === 'completed' ? 'completed' : 'worked_on',
          entity: 'task',
          entityId: task.id,
          description,
          details: {
            title: task.title || 'Untitled',
            status: task.status,
            priority: task.priority,
            projectId: task.projectId,
            workspaceName: taskWithWorkspace.workspaceName
          },
          timestamp: task.updatedAt || task.createdAt || new Date(),
          metadata: {
            taskId: task.id,
            projectId: task.projectId,
            status: task.status,
            priority: task.priority,
            workspaceId: taskWithWorkspace.workspaceId,
            workspaceName: taskWithWorkspace.workspaceName
          }
        };
      });
      
      // Sort by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return activities.slice(0, 50); // Limit to 50 most recent
      
    } catch (error) {
      console.error('❌ Error fetching user activity data:', error);
      
      // Fallback: try original activities collection approach
      try {
        const activitiesRef = collection(db, 'activities');
        const q = query(
          activitiesRef, 
          where('userId', '==', userId),
          where('workspaceId', '==', workspaceId),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        const activities = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        } as UserActivity));
        
        return activities;
      } catch (fallbackError) {
        console.error('❌ Fallback activity fetch also failed:', fallbackError);
        return [];
      }
    }
  }

  // Calculate team insights from department data
  static async getTeamInsights(userId: string, workspaceId: string, departments?: DepartmentInsights[]): Promise<TeamInsights> {
    try {
      // Check if user is owner to determine if we need cross-workspace data
      const userRole = await WorkspaceService.getUserRole(userId, workspaceId);
      
      // Use provided departments or default to empty array
      const deptData = departments || [];
      
      // Try to get actual workspace data (for owners, aggregate from all workspaces)
      let totalMembers = 0;
      let actualDepartmentCount = 0;
      let activeProjects = 0;
      
      try {
        if (userRole === 'owner') {
          // Get all workspaces in hierarchy for owners
          const allWorkspacesInHierarchy = await this.getAllWorkspacesInHierarchy(workspaceId);
          
          // Aggregate data from all workspaces
          for (const workspace of allWorkspacesInHierarchy) {
            try {
              // Users
              const workspaceUsers = await WorkspaceService.getWorkspaceUsers(workspace.id);
              totalMembers += workspaceUsers.length;
              
              // Departments
              const workspaceDepartments = await DepartmentService.getWorkspaceDepartments(workspace.id);
              actualDepartmentCount += workspaceDepartments.length;
              
              // Projects
              const workspaceProjects = await ProjectService.getWorkspaceProjects(workspace.id);
              activeProjects += workspaceProjects.length;
              
            } catch (error) {
              console.warn(`Could not fetch data from workspace ${workspace.id}:`, error);
            }
          }
          
        } else {
          // For non-owners, use single workspace data
          const workspaceUsers = await WorkspaceService.getWorkspaceUsers(workspaceId);
          totalMembers = workspaceUsers.length;
          
          const actualDepartments = await DepartmentService.getWorkspaceDepartments(workspaceId);
          actualDepartmentCount = actualDepartments.length;
          
          const projects = await ProjectService.getWorkspaceProjects(workspaceId);
          activeProjects = projects.length;
        }
        
      } catch (error) {
        console.warn('Could not fetch actual workspace data:', error);
        // Fallback to department data if available
        totalMembers = deptData.reduce((sum, dept) => sum + dept.memberCount, 0);
        activeProjects = deptData.reduce((sum, dept) => sum + (dept.activeProjects || 0), 0);
      }
      
      // If we have no real data at all, use mock
      if (totalMembers === 0 && deptData.length === 0) {
        return MockDataService.getMockTeamInsights();
      }
      
      // More realistic active member calculation
      let activeMembers = Math.floor(totalMembers * 0.8); // Assume 80% active by default
      
      // If we have recent activity data, use that for more accurate counts
      if (deptData.length > 0) {
        const recentlyActive = deptData.reduce((sum, dept) => {
          // Count departments with recent activity as having active members
          return sum + (dept.recentActivity && dept.recentActivity.length > 0 ? dept.memberCount : Math.floor(dept.memberCount * 0.5));
        }, 0);
        
        if (recentlyActive > 0) {
          activeMembers = Math.min(recentlyActive, totalMembers);
        }
      }
      
      // Calculate performance metrics from department data if available
      const avgPerformance = deptData.length > 0 ? 
        deptData.reduce((sum, dept) => sum + dept.efficiency, 0) / deptData.length : 75; // Default 75%
      const avgCollaboration = deptData.length > 0 ? 
        deptData.reduce((sum, dept) => sum + dept.collaborationScore, 0) / deptData.length : 70; // Default 70%
      
      const totalCompletedTasks = deptData.reduce((sum, dept) => sum + dept.completedTasks, 0);
      const totalActiveTasks = activeProjects * 5; // Estimate 5 tasks per project
      const completionRate = totalActiveTasks > 0 ? (totalCompletedTasks / (totalCompletedTasks + totalActiveTasks)) * 100 : 65; // Default 65%

      const insights = {
        memberCount: totalMembers,
        activeMembers,
        activeProjects, // Use actual project count (aggregated for owners)
        teamPerformance: Math.round(avgPerformance),
        teamCollaborationScore: Math.round(avgCollaboration),
        bottlenecks: deptData.filter(d => d.efficiency < 70).map(d => `${d.name} efficiency below target`),
        completionRate: Math.round(completionRate)
      };
      
      return insights;
    } catch (error) {
      console.error('❌ Error getting team insights:', error);
      return MockDataService.getMockTeamInsights();
    }
  }

  // Calculate workspace analytics from department data
  static async getWorkspaceAnalytics(userId: string, workspaceId: string, departments?: DepartmentInsights[]): Promise<WorkspaceAnalytics> {
    try {
      // Use provided departments or default to empty array
      const deptData = departments || [];
      
      if (deptData.length === 0) {
        // Try to get basic workspace data without departments
        try {
          const workspaceUsers = await WorkspaceService.getWorkspaceUsers(workspaceId);
          
          if (workspaceUsers.length > 0) {
            // Create basic analytics from workspace user data
            const totalUsers = workspaceUsers.length;
            const activeUsers = Math.floor(totalUsers * 0.8); // Assume 80% are active
            
            // Try to get project data from the workspace
            let totalProjects = 0;
            try {
              const projects = await ProjectService.getWorkspaceProjects(workspaceId);
              totalProjects = projects.length;
            } catch (projectError) {
              console.warn('Could not fetch project data:', projectError);
              totalProjects = Math.max(1, Math.floor(totalUsers / 3)); // Rough estimate
            }
            
            return {
              totalUsers,
              activeUsers,
              totalProjects,
              completionRate: 75, // Default reasonable completion rate
              growthRate: 15, // Default growth rate
              resourceUtilization: 70 // Default utilization
            };
          }
        } catch (workspaceError) {
          console.warn('Could not fetch workspace users:', workspaceError);
        }
        
        return MockDataService.getMockWorkspaceAnalytics();
      }
      
      // Get ACTUAL workspace user count instead of just team member count
      let totalUsers = 0;
      let activeUsers = 0;
      
      try {
        const workspaceUsers = await WorkspaceService.getWorkspaceUsers(workspaceId);
        totalUsers = workspaceUsers.length;
        
        // Calculate active users more realistically
        const teamMemberCount = deptData.reduce((sum, dept) => sum + dept.memberCount, 0);
        
        // Active users = team members + estimated active non-team members
        // Use team members as baseline since they're definitely active
        const estimatedActiveNonTeamMembers = Math.floor((totalUsers - teamMemberCount) * 0.4); // 40% of non-team members are active
        activeUsers = teamMemberCount + estimatedActiveNonTeamMembers;
        
      } catch (error) {
        console.warn('Could not fetch workspace users, falling back to team member count:', error);
        // Fallback to team member count if workspace users can't be fetched
        totalUsers = deptData.reduce((sum, dept) => sum + dept.memberCount, 0);
        activeUsers = Math.floor(totalUsers * 0.75);
      }
      
      // Get actual project count from ProjectService instead of department estimates
      let totalProjects = 0;
      try {
        const projects = await ProjectService.getWorkspaceProjects(workspaceId);
        totalProjects = projects.length;
      } catch (error) {
        console.warn('Could not fetch workspace projects, falling back to department estimates:', error);
        totalProjects = deptData.reduce((sum, dept) => sum + dept.activeProjects, 0);
      }
      
      const avgEfficiency = deptData.reduce((sum, dept) => sum + dept.efficiency, 0) / deptData.length || 0;
      
      const analytics = {
        totalUsers,
        activeUsers,
        totalProjects,
        completionRate: Math.round(avgEfficiency),
        growthRate: Math.max(10, Math.min(30, 22 + Math.floor(Math.random() * 8))), // Simulated growth
        resourceUtilization: Math.round(avgEfficiency * 0.9) // Slightly lower than efficiency
      };
      
      return analytics;
    } catch (error) {
      console.error('❌ Error getting workspace analytics:', error);
      return MockDataService.getMockWorkspaceAnalytics();
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

  // Enhanced cross-workspace analytics for owners
  static async getCrossWorkspaceAnalytics(userId: string, workspaceId: string, departments?: DepartmentInsights[]): Promise<WorkspaceAnalytics> {
    try {
      // Check if user is owner and get cross-workspace data
      const userRole = await WorkspaceService.getUserRole(userId, workspaceId);
      
      if (userRole === 'owner') {
        try {
          // Get all workspaces in the hierarchy (main + all sub-workspaces)
          const allWorkspacesInHierarchy = await this.getAllWorkspacesInHierarchy(workspaceId);
          
          let totalUsers = 0;
          let totalActiveUsers = 0;
          let totalProjects = 0;
          let totalTasks = 0;
          let totalDepartments = 0;
          
          // Aggregate data from all workspaces in the hierarchy
          for (const workspace of allWorkspacesInHierarchy) {
            try {
              // Get users from this workspace
              const workspaceUsers = await WorkspaceService.getWorkspaceUsers(workspace.id);
              totalUsers += workspaceUsers.length;
              
              // Get projects from this workspace
              const workspaceProjects = await ProjectService.getWorkspaceProjects(workspace.id);
              totalProjects += workspaceProjects.length;
              
              // Get tasks from this workspace
              const workspaceTasks = await TaskService.getWorkspaceTasks(workspace.id);
              totalTasks += workspaceTasks.length;
              
              // Get departments from this workspace
              const workspaceDepartments = await DepartmentService.getWorkspaceDepartments(workspace.id);
              totalDepartments += workspaceDepartments.length;
              
              // Calculate active users (users with recent activity)
              const activeInWorkspace = Math.max(
                Math.floor(workspaceUsers.length * 0.6), // 60% assumed active
                Math.min(workspaceUsers.length, 1) // At least 1 if there are users
              );
              totalActiveUsers += activeInWorkspace;
              
            } catch (error) {
              console.warn(`Could not fetch data from workspace ${workspace.id}:`, error);
            }
          }
          
          // Calculate completion rate from tasks
          let completionRate = 75; // Default
          if (totalTasks > 0) {
            // Get completed tasks across all workspaces
            let completedTasks = 0;
            for (const workspace of allWorkspacesInHierarchy) {
              try {
                const workspaceTasks = await TaskService.getWorkspaceTasks(workspace.id);
                completedTasks += workspaceTasks.filter(task => task.status === 'completed').length;
              } catch (error) {
                console.warn(`Could not fetch tasks from workspace ${workspace.id} for completion rate:`, error);
              }
            }
            completionRate = Math.round((completedTasks / totalTasks) * 100);
          }
          
          // Calculate efficiency from departments if available
          const deptData = departments || [];
          const avgEfficiency = deptData.length > 0 ? 
            deptData.reduce((sum, dept) => sum + dept.efficiency, 0) / deptData.length : completionRate;
          
          const analytics = {
            totalUsers,
            activeUsers: totalActiveUsers,
            totalProjects,
            completionRate: Math.round(avgEfficiency),
            growthRate: Math.max(15, Math.min(35, 25 + Math.floor(Math.random() * 10))), // Higher growth for multi-workspace
            resourceUtilization: Math.round(avgEfficiency * 0.85) // Slightly lower due to coordination overhead
          };
          
          return analytics;
          
        } catch (error) {
          console.warn('Error calculating cross-workspace analytics, falling back to single workspace:', error);
        }
      }
      
      // Fallback to regular workspace analytics
      return this.getWorkspaceAnalytics(userId, workspaceId, departments);
    } catch (error) {
      console.error('❌ Error getting cross-workspace analytics:', error);
      return this.getWorkspaceAnalytics(userId, workspaceId, departments);
    }
  }

  // Calculate department performance analytics
  static async getDepartmentPerformance(userId: string, workspaceId: string, departments?: DepartmentInsights[]): Promise<{
    departmentMetrics: Array<{
      id: string;
      name: string;
      memberCount: number;
      efficiency: number;
      collaborationScore: number;
      activeProjects: number;
      completedTasks: number;
      performanceGrade: string;
      status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
      recommendations: string[];
      trends: {
        efficiency: 'up' | 'down' | 'stable';
        collaboration: 'up' | 'down' | 'stable';
        productivity: 'up' | 'down' | 'stable';
      };
    }>;
    overallMetrics: {
      averageEfficiency: number;
      averageCollaboration: number;
      totalActiveProjects: number;
      totalCompletedTasks: number;
      bestPerformingDepartment: string;
      departmentsNeedingAttention: string[];
    };
  }> {
    try {
      // Use provided departments or default to empty array
      const deptData = departments || [];
      
      if (deptData.length === 0) {
        return {
          departmentMetrics: [],
          overallMetrics: {
            averageEfficiency: 0,
            averageCollaboration: 0,
            totalActiveProjects: 0,
            totalCompletedTasks: 0,
            bestPerformingDepartment: 'N/A',
            departmentsNeedingAttention: []
          }
        };
      }

      // Calculate individual department metrics
      const departmentMetrics = deptData.map(dept => {
        // Determine performance grade
        let performanceGrade = 'C';
        let status: 'excellent' | 'good' | 'needs_improvement' | 'critical' = 'needs_improvement';
        
        const avgScore = (dept.efficiency + dept.collaborationScore) / 2;
        if (avgScore >= 90) {
          performanceGrade = 'A+';
          status = 'excellent';
        } else if (avgScore >= 85) {
          performanceGrade = 'A';
          status = 'excellent';
        } else if (avgScore >= 80) {
          performanceGrade = 'B+';
          status = 'good';
        } else if (avgScore >= 75) {
          performanceGrade = 'B';
          status = 'good';
        } else if (avgScore >= 70) {
          performanceGrade = 'C+';
          status = 'needs_improvement';
        } else if (avgScore >= 60) {
          performanceGrade = 'C';
          status = 'needs_improvement';
        } else {
          performanceGrade = 'D';
          status = 'critical';
        }

        // Generate recommendations based on performance
        const recommendations: string[] = [];
        if (dept.efficiency < 75) {
          recommendations.push('Implement process optimization and workflow improvements');
        }
        if (dept.collaborationScore < 75) {
          recommendations.push('Enhance team communication and collaboration tools');
        }
        if (dept.memberCount > 10 && dept.efficiency < 80) {
          recommendations.push('Consider team restructuring for better efficiency');
        }
        if (dept.activeProjects > dept.memberCount * 2) {
          recommendations.push('Review project allocation to prevent team overload');
        }
        if (recommendations.length === 0) {
          recommendations.push('Maintain current performance levels and explore growth opportunities');
        }

        // Generate trends (simplified - in real implementation, this would compare with historical data)
        const trends = {
          efficiency: dept.efficiency >= 80 ? 'up' as const : dept.efficiency >= 70 ? 'stable' as const : 'down' as const,
          collaboration: dept.collaborationScore >= 80 ? 'up' as const : dept.collaborationScore >= 70 ? 'stable' as const : 'down' as const,
          productivity: dept.completedTasks >= dept.activeProjects * 0.8 ? 'up' as const : 'stable' as const
        };

        return {
          id: dept.id,
          name: dept.name,
          memberCount: dept.memberCount,
          efficiency: dept.efficiency,
          collaborationScore: dept.collaborationScore,
          activeProjects: dept.activeProjects,
          completedTasks: dept.completedTasks,
          performanceGrade,
          status,
          recommendations,
          trends
        };
      });

      // Calculate overall metrics
      const totalEfficiency = deptData.reduce((sum, dept) => sum + dept.efficiency, 0);
      const totalCollaboration = deptData.reduce((sum, dept) => sum + dept.collaborationScore, 0);
      const totalActiveProjects = deptData.reduce((sum, dept) => sum + dept.activeProjects, 0);
      const totalCompletedTasks = deptData.reduce((sum, dept) => sum + dept.completedTasks, 0);

      const averageEfficiency = Math.round(totalEfficiency / deptData.length);
      const averageCollaboration = Math.round(totalCollaboration / deptData.length);

      // Find best performing department
      const bestDept = deptData.reduce((best, current) => {
        const currentScore = (current.efficiency + current.collaborationScore) / 2;
        const bestScore = (best.efficiency + best.collaborationScore) / 2;
        return currentScore > bestScore ? current : best;
      });

      // Find departments needing attention
      const departmentsNeedingAttention = deptData
        .filter(dept => dept.efficiency < 70 || dept.collaborationScore < 70)
        .map(dept => dept.name);

      const overallMetrics = {
        averageEfficiency,
        averageCollaboration,
        totalActiveProjects,
        totalCompletedTasks,
        bestPerformingDepartment: bestDept.name,
        departmentsNeedingAttention
      };

      return {
        departmentMetrics,
        overallMetrics
      };
    } catch (error) {
      console.error('❌ Error calculating department performance:', error);
      return {
        departmentMetrics: [],
        overallMetrics: {
          averageEfficiency: 0,
          averageCollaboration: 0,
          totalActiveProjects: 0,
          totalCompletedTasks: 0,
          bestPerformingDepartment: 'N/A',
          departmentsNeedingAttention: []
        }
      };
    }
  }
}
