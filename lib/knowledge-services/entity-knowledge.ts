'use client';

import { UserService } from '../user-service';
import { TeamService } from '../team-service';
import { TaskService } from '../task-service';
import { ReportService } from '../report-service';
import { WorkspaceService } from '../workspace-service';
import { FolderService } from '../folder-service';
import { ProjectService } from '../project-service';
import { BranchService } from '../branch-service';
import { RegionService } from '../region-service';
import { DepartmentService } from '../department-service';
import { Task } from '../types';
import { KnowledgeContext } from '../ai-knowledge-service';

export class EntityKnowledgeService {
  /**
   * Check if query is task-related
   */
  static isTaskRelated(query: string): boolean {
    const taskKeywords = ['task', 'todo', 'assignment', 'deadline', 'complete', 'progress', 'work'];
    return taskKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Check if query is team-related
   */
  static isTeamRelated(query: string): boolean {
    const teamKeywords = ['team', 'colleague', 'member', 'collaboration', 'group'];
    return teamKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Check if query is report-related
   */
  static isReportRelated(query: string): boolean {
    const reportKeywords = ['report', 'document', 'submission', 'approval', 'review', 'analysis'];
    return reportKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Check if query is user-related
   */
  static isUserRelated(query: string): boolean {
    const userKeywords = ['user', 'people', 'staff', 'employee', 'profile', 'account'];
    return userKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Check if query is workspace-related
   */
  static isWorkspaceRelated(query: string): boolean {
    const workspaceKeywords = ['workspace', 'organization', 'company', 'settings', 'structure'];
    return workspaceKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Check if query is folder-related
   */
  static isFolderRelated(query: string): boolean {
    const folderKeywords = ['folder', 'file', 'document', 'upload', 'storage', 'directory'];
    return folderKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Check if query is project-related
   */
  static isProjectRelated(query: string): boolean {
    const projectKeywords = ['project', 'epic', 'milestone', 'initiative', 'development', 'product'];
    return projectKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Check if query is branch-related
   */
  static isBranchRelated(query: string): boolean {
    const branchKeywords = ['branch', 'location', 'office', 'site', 'facility'];
    return branchKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Check if query is region-related
   */
  static isRegionRelated(query: string): boolean {
    const regionKeywords = [
      'region', 'area', 'territory', 'zone', 'district', 'geographic',
      'regional manager', 'regional admin', 'who are', 'managers'
    ];
    return regionKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Check if query is department-related
   */
  static isDepartmentRelated(query: string): boolean {
    const departmentKeywords = ['department', 'division', 'unit', 'section', 'organizational'];
    return departmentKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Get task-related context
   */
  static async getTaskContext(workspaceId: string, userId: string, userRole: string): Promise<string> {
    try {
      let tasks: Task[] = [];
      let userTasks: Task[] = [];
      let contextData = '';
      let workspaceName = workspaceId; // Default to ID if name not found
      
      // Get workspace name for better context
      try {
        const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
        const currentWorkspace = userWorkspaces.find(uw => uw.workspace.id === workspaceId);
        if (currentWorkspace) {
          workspaceName = currentWorkspace.workspace.name;
        }
      } catch (error) {
        console.error('❌ Error getting workspace name:', error);
      }
      
      // For owners/admins, get data from appropriate workspaces based on user role
      if (userRole === 'owner' || userRole === 'admin') {
        try {
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
          
          let totalTasksAcrossWorkspaces = 0;
          let totalCompletedTasks = 0;
          let totalPendingTasks = 0;
          let totalUserAssignedTasks = 0;
          let totalUserCompletedTasks = 0;
          const workspaceSummaries: string[] = [];
          
          // Get task data from appropriate workspaces based on user role
          for (const uw of userWorkspaces) {
            // Owners see data from ALL workspaces they have access to (any role)
            // Admins see data from workspaces where they are admin or owner
            if ((userRole === 'owner') || 
                (userRole === 'admin' && (uw.role === 'admin' || uw.role === 'owner'))) {
              console.log(`🔍 Processing tasks from workspace "${uw.workspace.name}" where user is ${uw.role}...`);
              try {
                const workspaceTasks = await TaskService.getWorkspaceTasks(uw.workspace.id);
                const workspaceUserTasks = await TaskService.getUserAssignedTasks(userId, uw.workspace.id);
                
                const wsTaskCount = workspaceTasks.length;
                const wsCompletedTasks = workspaceTasks.filter(t => t.status === 'completed').length;
                const wsPendingTasks = workspaceTasks.filter(t => t.status === 'todo' || t.status === 'in-progress').length;
                const wsUserTasks = workspaceUserTasks.length;
                const wsUserCompleted = workspaceUserTasks.filter(t => t.status === 'completed').length;
                
                totalTasksAcrossWorkspaces += wsTaskCount;
                totalCompletedTasks += wsCompletedTasks;
                totalPendingTasks += wsPendingTasks;
                totalUserAssignedTasks += wsUserTasks;
                totalUserCompletedTasks += wsUserCompleted;
                
                if (wsTaskCount > 0 || wsUserTasks > 0) {
                  workspaceSummaries.push(`"${uw.workspace.name}": ${wsTaskCount} total (${wsUserTasks} assigned to you)`);
                }
              } catch (error) {
                console.error(`❌ Error getting tasks from workspace ${uw.workspace.name}:`, error);
              }
            } else {
              console.log(`⚠️  Skipping workspace "${uw.workspace.name}" for tasks - user role is ${uw.role}, but current query role is ${userRole}`);
            }
          }
          
          console.log(`📊 Cross-workspace task aggregation complete: ${totalTasksAcrossWorkspaces} total tasks across ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`);
          
          contextData = `\nTASK DATA (${userRole.toUpperCase()} - CROSS-WORKSPACE):
- Total tasks across all ${userRole === 'owner' ? 'owned' : 'admin'} workspaces: ${totalTasksAcrossWorkspaces}
- Completed tasks: ${totalCompletedTasks}
- Pending tasks: ${totalPendingTasks}
- Your assigned tasks: ${totalUserAssignedTasks}
- Your completed tasks: ${totalUserCompletedTasks}
- Workspace breakdown: ${workspaceSummaries.length > 0 ? workspaceSummaries.join(', ') : `No tasks found in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`}
- Access level: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} (can view/manage tasks in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces only)
`;
          
          return contextData;
        } catch (error) {
          console.error(`❌ Error getting cross-workspace task data for ${userRole}:`, error);
        }
      }
      
      // For non-owners or if owner query fails, use current workspace only
      if (!workspaceId || workspaceId === 'unknown') {
        try {
          userTasks = await TaskService.getUserAssignedTasks(userId);
          
          // Also try to get tasks from all workspaces the user has access to
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
          
          if (userWorkspaces.length > 0) {
            // Get tasks from the first workspace as default
            const firstWorkspace = userWorkspaces[0].workspace;
            tasks = await TaskService.getWorkspaceTasks(firstWorkspace.id);
          }
        } catch (error) {
          console.error('❌ Error getting user data without workspace:', error);
        }
      } else {
        // Normal workspace-specific query
        tasks = await TaskService.getWorkspaceTasks(workspaceId);
        
        userTasks = await TaskService.getUserAssignedTasks(userId, workspaceId);
      }
      
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in-progress').length;
      const userTaskCount = userTasks.length;
      const userCompletedTasks = userTasks.filter(t => t.status === 'completed').length;

      // If no tasks found in current workspace, check other workspaces
      let additionalInfo = '';
      if (totalTasks === 0 && userTaskCount === 0) {
        try {
          // Get all tasks for the user across all workspaces
          const allUserTasks = await TaskService.getUserAssignedTasks(userId);
          
          if (allUserTasks.length > 0) {
            // Group tasks by workspace
            const tasksByWorkspace: { [workspaceId: string]: Task[] } = {};
            allUserTasks.forEach(task => {
              if (!tasksByWorkspace[task.workspaceId]) {
                tasksByWorkspace[task.workspaceId] = [];
              }
              tasksByWorkspace[task.workspaceId].push(task);
            });
            
            const workspaceTaskCounts = Object.entries(tasksByWorkspace)
              .map(([wsId, wsTasks]) => `${wsId}: ${wsTasks.length} tasks`)
              .join(', ');
            
            additionalInfo = `\n- NOTE: You have ${allUserTasks.length} tasks in other workspaces (${workspaceTaskCounts})`;
          }
        } catch (error) {
          console.error('❌ Error checking other workspaces:', error);
        }
      }

      return `\nTASK DATA:
- Current workspace: ${workspaceName || workspaceId}
- Total workspace tasks: ${totalTasks}
- Completed tasks: ${completedTasks}
- Pending tasks: ${pendingTasks}
- User's assigned tasks: ${userTaskCount}
- User's completed tasks: ${userCompletedTasks}
- Recent tasks: ${tasks.slice(0, 3).map(t => `"${t.title}" (${t.status})`).join(', ')}${additionalInfo}
`;
    } catch (error) {
      console.error('❌ Error in getTaskContext:', error);
      return '\nTASK DATA: Unable to fetch task information.\n';
    }
  }

  /**
   * Get team-related context
   */
  static async getTeamContext(workspaceId: string, userId: string): Promise<string> {
    try {
      // Get workspace name for better context
      let workspaceName = workspaceId;
      
      // First check user role to determine scope
      const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
      const currentWorkspace = userWorkspaces.find(uw => uw.workspace.id === workspaceId);
      const currentWorkspaceRole = currentWorkspace?.role;
      
      if (currentWorkspace) {
        workspaceName = currentWorkspace.workspace.name;
      }
      
      // For owners/admins, get data from appropriate workspaces based on user role
      if (currentWorkspaceRole === 'owner' || currentWorkspaceRole === 'admin') {
        try {
          let totalTeamsAcrossWorkspaces = 0;
          let totalUserTeams = 0;
          const workspaceSummaries: string[] = [];
          
          // Get team data from appropriate workspaces based on user role
          for (const uw of userWorkspaces) {
            // Owners see data from ALL workspaces they have access to (any role)
            // Admins see data from workspaces where they are admin or owner
            if ((currentWorkspaceRole === 'owner') || 
                (currentWorkspaceRole === 'admin' && (uw.role === 'admin' || uw.role === 'owner'))) {
              console.log(`🔍 Processing teams from workspace "${uw.workspace.name}" where user is ${uw.role}...`);
              try {
                const workspaceTeams = await TeamService.getWorkspaceTeams(uw.workspace.id);
                const userTeamsInWorkspace = await TeamService.getUserTeams(userId, uw.workspace.id);
                
                totalTeamsAcrossWorkspaces += workspaceTeams.length;
                totalUserTeams += userTeamsInWorkspace.length;
                
                if (workspaceTeams.length > 0 || userTeamsInWorkspace.length > 0) {
                  workspaceSummaries.push(`"${uw.workspace.name}": ${workspaceTeams.length} total (${userTeamsInWorkspace.length} you're in)`);
                }
              } catch (error) {
                console.error(`❌ Error getting teams from workspace ${uw.workspace.name}:`, error);
              }
            } else {
              console.log(`⚠️  Skipping workspace "${uw.workspace.name}" for teams - user role is ${uw.role}, but current query role is ${currentWorkspaceRole}`);
            }
          }
          
          console.log(`📊 Cross-workspace team aggregation complete: ${totalTeamsAcrossWorkspaces} total teams across ${currentWorkspaceRole === 'owner' ? 'owned' : 'admin'} workspaces`);
          
          return `\nTEAM DATA (${currentWorkspaceRole.toUpperCase()} - CROSS-WORKSPACE):
- Total teams across all ${currentWorkspaceRole === 'owner' ? 'owned' : 'admin'} workspaces: ${totalTeamsAcrossWorkspaces}
- Your team memberships: ${totalUserTeams}
- Workspace breakdown: ${workspaceSummaries.length > 0 ? workspaceSummaries.join(', ') : `No teams found in ${currentWorkspaceRole === 'owner' ? 'owned' : 'admin'} workspaces`}
- Access level: ${currentWorkspaceRole.charAt(0).toUpperCase() + currentWorkspaceRole.slice(1)} (can view/manage teams in ${currentWorkspaceRole === 'owner' ? 'owned' : 'admin'} workspaces only)
`;
        } catch (error) {
          console.error(`❌ Error getting cross-workspace team data for ${currentWorkspaceRole}:`, error);
        }
      }
      
      // For non-owners, use current workspace only
      const workspaceTeams = await TeamService.getWorkspaceTeams(workspaceId);
      const userTeams = await TeamService.getUserTeams(userId, workspaceId);
      
      // If no teams found in current workspace, check other workspaces
      let additionalInfo = '';
      if (workspaceTeams.length === 0 && userTeams.length === 0) {
        try {
          // Get user's accessible workspaces to check for teams
          let totalTeamsAcrossWorkspaces = 0;
          
          for (const uw of userWorkspaces) {
            if (uw.workspace.id !== workspaceId) {
              try {
                const workspaceTeams = await TeamService.getUserTeams(userId, uw.workspace.id);
                totalTeamsAcrossWorkspaces += workspaceTeams.length;
              } catch (error) {
                console.error(`❌ Error checking teams in workspace ${uw.workspace.name}:`, error);
              }
            }
          }
          
          if (totalTeamsAcrossWorkspaces > 0) {
            additionalInfo = `\n- NOTE: You have ${totalTeamsAcrossWorkspaces} teams in other workspaces`;
          }
        } catch (error) {
          console.error('❌ Error checking other workspaces for teams:', error);
        }
      }
      
      return `\nTEAM DATA:
- Current workspace: ${workspaceName || workspaceId}
- Total workspace teams: ${workspaceTeams.length}
- User's teams: ${userTeams.length}
- Team names: ${userTeams.map(ut => ut.team.name).join(', ')}
- User roles in teams: ${userTeams.map(ut => `${ut.team.name} (${ut.role})`).join(', ')}${additionalInfo}
`;
    } catch (error) {
      console.error('❌ Error in getTeamContext:', error);
      return '\nTEAM DATA: Unable to fetch team information.\n';
    }
  }

  /**
   * Get report-related context
   */
  static async getReportContext(workspaceId: string, userId: string, userRole: string): Promise<string> {
    try {
      // Get workspace name for better context
      let workspaceName = workspaceId;
      try {
        const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
        const currentWorkspace = userWorkspaces.find(uw => uw.workspace.id === workspaceId);
        if (currentWorkspace) {
          workspaceName = currentWorkspace.workspace.name;
        }
      } catch (error) {
        console.error('❌ Error getting workspace name:', error);
      }
      
      // For owners/admins, get data from workspaces they can manage
      if (userRole === 'owner' || userRole === 'admin') {
        try {
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
          
          let totalReportsAcrossWorkspaces = 0;
          let totalPendingReports = 0;
          let totalApprovedReports = 0;
          const workspaceSummaries: string[] = [];
          
          // Get report data from appropriate workspaces based on user role
          for (const uw of userWorkspaces) {
            // Owners see data from ALL workspaces they have access to (any role)
            // Admins see data from workspaces where they are admin or owner
            if ((userRole === 'owner') || 
                (userRole === 'admin' && (uw.role === 'admin' || uw.role === 'owner'))) {
              console.log(`🔍 Processing reports from workspace "${uw.workspace.name}" where user is ${uw.role}...`);
              try {
                const workspaceReports = await ReportService.getWorkspaceReports(uw.workspace.id, { limit: 100 });
                console.log(`📋 Found ${workspaceReports.length} reports in workspace "${uw.workspace.name}"`);
                
                const wsReportCount = workspaceReports.length;
                const wsPendingReports = workspaceReports.filter(r => r.status === 'submitted' || r.status === 'under_review').length;
                const wsApprovedReports = workspaceReports.filter(r => r.status === 'approved').length;
                
                totalReportsAcrossWorkspaces += wsReportCount;
                totalPendingReports += wsPendingReports;
                totalApprovedReports += wsApprovedReports;
                
                if (wsReportCount > 0) {
                  workspaceSummaries.push(`"${uw.workspace.name}": ${wsReportCount} total (${wsPendingReports} pending, ${wsApprovedReports} approved)`);
                }
              } catch (error) {
                console.error(`❌ Error getting reports from workspace ${uw.workspace.name}:`, error);
              }
            } else {
              console.log(`⚠️  Skipping workspace "${uw.workspace.name}" for reports - user role is ${uw.role}, but current query role is ${userRole}`);
            }
          }
          
          console.log(`📊 Cross-workspace report aggregation complete: ${totalReportsAcrossWorkspaces} total reports across ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`);
          
          return `\nREPORT DATA (${userRole.toUpperCase()} - CROSS-WORKSPACE):
- Total reports across all ${userRole === 'owner' ? 'owned' : 'admin'} workspaces: ${totalReportsAcrossWorkspaces}
- Pending reports: ${totalPendingReports}
- Approved reports: ${totalApprovedReports}
- Workspace breakdown: ${workspaceSummaries.length > 0 ? workspaceSummaries.join(', ') : `No reports found in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`}
- Access level: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} (can view/manage reports in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces only)
`;
        } catch (error) {
          console.error(`❌ Error getting cross-workspace report data for ${userRole}:`, error);
        }
      }
      
      // For non-owners, use current workspace only
      let reports;
      if (userRole === 'admin') {
        reports = await ReportService.getWorkspaceReports(workspaceId, { limit: 50 });
      } else {
        reports = await ReportService.getUserReports(workspaceId, userId, { limit: 50 });
      }

      const totalReports = reports.length;
      const pendingReports = reports.filter(r => r.status === 'submitted' || r.status === 'under_review').length;
      const approvedReports = reports.filter(r => r.status === 'approved').length;

      return `\nREPORT DATA:
- Current workspace: ${workspaceName || workspaceId}
- Total reports: ${totalReports}
- Pending reports: ${pendingReports}
- Approved reports: ${approvedReports}
- Recent reports: ${reports.slice(0, 3).map(r => `"${r.title}" (${r.status})`).join(', ')}
`;
    } catch (error) {
      console.error('❌ Error in getReportContext:', error);
      return '\nREPORT DATA: Unable to fetch report information.\n';
    }
  }

  /**
   * Get user-related context
   */
  static async getUserContext(workspaceId: string, userRole: string, userId?: string): Promise<string> {
    try {
      console.log(`🔍 getUserContext called: workspaceId=${workspaceId}, userRole=${userRole}, userId=${userId}`);
      
      if (userRole !== 'owner' && userRole !== 'admin') {
        return '\nUSER DATA: Access restricted.\n';
      }

      // For owners/admins, get user data from appropriate workspaces
      if ((userRole === 'owner' || userRole === 'admin') && userId) {
        console.log(`✅ ${userRole.toUpperCase()} with userId detected, starting cross-workspace user aggregation...`);
        try {
          // Get all workspaces the user has access to (as owner or admin)
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
          console.log(`📊 Found ${userWorkspaces.length} workspaces for ${userRole}`);
          
          let totalUsersAcrossWorkspaces = 0;
          let totalAdmins = 0;
          let totalMembers = 0;
          let totalOwners = 0;
          const workspaceSummaries: string[] = [];
          const detailedUserList: string[] = [];
          
          // Get user data from appropriate workspaces based on user role
          for (const uw of userWorkspaces) {
            // Owners see data from ALL workspaces they have access to (any role)
            // Admins see data from workspaces where they are admin or owner
            if ((userRole === 'owner') || 
                (userRole === 'admin' && (uw.role === 'admin' || uw.role === 'owner'))) {
              console.log(`🔍 Processing workspace "${uw.workspace.name}" where user is ${uw.role}...`);
              try {
                // Use comprehensive user list method
                const workspaceUsers = await this.getComprehensiveUserList(uw.workspace.id);
                console.log(`📋 Found ${workspaceUsers.length} users in workspace "${uw.workspace.name}"`);
                
                const wsUserCount = workspaceUsers.length;
                const wsOwnerCount = workspaceUsers.filter(wu => wu.role === 'owner').length;
                const wsAdminCount = workspaceUsers.filter(wu => wu.role === 'admin').length;
                const wsMemberCount = workspaceUsers.filter(wu => wu.role === 'member').length;
                
                totalUsersAcrossWorkspaces += wsUserCount;
                totalOwners += wsOwnerCount;
                totalAdmins += wsAdminCount;
                totalMembers += wsMemberCount;
                
                if (wsUserCount > 0) {
                  workspaceSummaries.push(`"${uw.workspace.name}": ${wsUserCount} users (${wsOwnerCount} owners, ${wsAdminCount} admins, ${wsMemberCount} members)`);
                  
                  // Add detailed user list for the primary workspace
                  if (workspaceUsers.length > 0 && detailedUserList.length === 0) {
                    detailedUserList.push(`\n📋 Users in "${uw.workspace.name}":`);
                    workspaceUsers.slice(0, 10).forEach(wu => { // Limit to first 10 users
                      const user = wu.user;
                      detailedUserList.push(`• ${user.name || 'Unknown'} (${user.email || 'No email'}) - ${wu.role}`);
                    });
                    if (workspaceUsers.length > 10) {
                      detailedUserList.push(`... and ${workspaceUsers.length - 10} more users`);
                    }
                  }
                }
              } catch (error) {
                console.error(`❌ Error getting users from workspace ${uw.workspace.name}:`, error);
              }
            } else {
              console.log(`⚠️  Skipping workspace "${uw.workspace.name}" - user role is ${uw.role}, but current query role is ${userRole}`);
            }
          }
          
          const eligibleWorkspaces = userWorkspaces.filter(uw => 
            (userRole === 'owner') || 
            (userRole === 'admin' && (uw.role === 'admin' || uw.role === 'owner'))
          );
          
          console.log(`📊 Cross-workspace aggregation complete: ${totalUsersAcrossWorkspaces} total users across ${eligibleWorkspaces.length} ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`);
          
          return `\nUSER DATA (${userRole.toUpperCase()} - CROSS-WORKSPACE):
- Total users across all ${userRole === 'owner' ? 'owned' : 'admin'} workspaces: ${totalUsersAcrossWorkspaces}
- Total owners: ${totalOwners}
- Total admins: ${totalAdmins}
- Total members: ${totalMembers}
- Workspace breakdown: ${workspaceSummaries.length > 0 ? workspaceSummaries.join(', ') : `No ${userRole === 'owner' ? 'owned' : 'admin'} workspaces found`}
- Access level: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} (can view/manage users in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces only)
${detailedUserList.join('\n')}
`;
        } catch (error) {
          console.error(`❌ Error getting cross-workspace user data for ${userRole}:`, error);
          // Fall back to current workspace only
        }
      } else {
        console.log(`❌ Not using cross-workspace aggregation: userRole=${userRole}, userId=${userId}`);
      }

      // For single workspace or if cross-workspace query fails, use current workspace only
      // Get workspace name for better context
      let workspaceName = workspaceId;
      try {
        if (userId) {
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
          const currentWorkspace = userWorkspaces.find(uw => uw.workspace.id === workspaceId);
          if (currentWorkspace) {
            workspaceName = currentWorkspace.workspace.name;
          }
        }
      } catch (error) {
        console.error('❌ Error getting workspace name:', error);
      }
      
      
      // Use comprehensive user list method for current workspace
      const workspaceUsers = await this.getComprehensiveUserList(workspaceId);
      console.log(`📋 Single workspace mode: Found ${workspaceUsers.length} users in workspace ${workspaceId}`);
      
      const totalUsers = workspaceUsers.length;
      const adminCount = workspaceUsers.filter(wu => wu.role === 'admin').length;
      const memberCount = workspaceUsers.filter(wu => wu.role === 'member').length;
      const ownerCount = workspaceUsers.filter(wu => wu.role === 'owner').length;
      
      // Create detailed user list with data sources
      const userList = workspaceUsers.slice(0, 8).map(wu => {
        const user = wu.user;
        const source = wu.source ? ` (${wu.source})` : '';
        return `• ${user.name || 'Unknown'} (${user.email || 'No email'}) - ${wu.role}${source}`;
      }).join('\n');

      return `\nUSER DATA:
- Current workspace: ${workspaceName || workspaceId}
- Total workspace users: ${totalUsers}
- Owners: ${ownerCount}
- Admins: ${adminCount}
- Members: ${memberCount}
- Access level: ${userRole === 'owner' ? 'Can manage all users' : 'Can view users'}

📋 User List:
${userList}
${totalUsers > 8 ? `... and ${totalUsers - 8} more users` : ''}

🔍 Data Sources: ${workspaceUsers.map(wu => wu.source).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
`;
    } catch (error) {
      return '\nUSER DATA: Unable to fetch user information.\n';
    }
  }

  /**
   * Get workspace-related context
   */
  static async getWorkspaceContext(workspaceId: string, userRole: string, userId?: string): Promise<string> {
    try {
      // Get workspace name instead of just ID
      let workspaceName = workspaceId;
      try {
        if (userId) {
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
          const currentWorkspace = userWorkspaces.find(uw => uw.workspace.id === workspaceId);
          if (currentWorkspace) {
            workspaceName = currentWorkspace.workspace.name;
          }
        }
      } catch (error) {
        console.error('❌ Error getting workspace name:', error);
      }

      let contextData = `\nWORKSPACE DATA:
- Current workspace: ${workspaceName}
`;

      if (userRole === 'owner' && userId) {
        // For owners, show cross-workspace management capabilities
        try {
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
          const ownedWorkspaces = userWorkspaces.filter(uw => uw.role === 'owner');
          const mainWorkspaces = ownedWorkspaces.filter(uw => uw.workspace.workspaceType === 'main');
          const subWorkspaces = ownedWorkspaces.filter(uw => uw.workspace.workspaceType === 'sub');
          
          contextData += `- User role: Owner (full cross-workspace access)
- Can manage: ALL users, teams, tasks, reports, settings across workspaces
- Total owned workspaces: ${ownedWorkspaces.length}
- Main workspaces: ${mainWorkspaces.length}
- Sub workspaces: ${subWorkspaces.length}
- Owned workspace names: ${ownedWorkspaces.map(uw => uw.workspace.name).join(', ')}
`;
        } catch (error) {
          contextData += `- User role: Owner (full access to all features)
- Can manage: users, teams, tasks, reports, settings
`;
        }
      } else if (userRole === 'admin') {
        contextData += `- User role: Admin (limited management access)
- Can manage: tasks, reports, team members
`;
      } else {
        contextData += `- User role: Member (standard access)
- Can manage: own tasks and reports
`;
      }

      return contextData;
    } catch (error) {
      return '\nWORKSPACE DATA: Unable to fetch workspace information.\n';
    }
  }

  /**
   * Get specific entity data by ID or name
   */
  static async getSpecificEntityData(entityType: string, identifier: string, context: KnowledgeContext): Promise<string> {
    const { workspace, user } = context;

    try {
      switch (entityType.toLowerCase()) {
        case 'task':
          const tasks = await TaskService.getWorkspaceTasks(workspace.id);
          const task = tasks.find(t => t.id === identifier || t.title.toLowerCase().includes(identifier.toLowerCase()));
          if (task) {
            return `TASK DETAILS:
- Title: ${task.title}
- Status: ${task.status}
- Priority: ${task.priority || 'Not set'}
- Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
- Description: ${task.description || 'No description'}
- Assignee: ${(task as any).assigneeName || (task as any).assignedTo || 'Not assigned'}
`;
          }
          break;

        case 'team':
          const teams = await TeamService.getWorkspaceTeams(workspace.id);
          const team = teams.find(t => t.id === identifier || t.name.toLowerCase().includes(identifier.toLowerCase()));
          if (team) {
            return `TEAM DETAILS:
- Name: ${team.name}
- Description: ${team.description || 'No description'}
- Members: ${(team as any).memberCount || 'Unknown'} members
- Created: ${team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'Unknown'}
`;
          }
          break;

        case 'report':
          let reports;
          if (user.role === 'owner' || user.role === 'admin') {
            reports = await ReportService.getWorkspaceReports(workspace.id, { limit: 100 });
          } else {
            reports = await ReportService.getUserReports(workspace.id, user.id, { limit: 100 });
          }
          const report = reports.find(r => r.id === identifier || r.title.toLowerCase().includes(identifier.toLowerCase()));
          if (report) {
            return `REPORT DETAILS:
- Title: ${report.title}
- Status: ${report.status}
- Author: ${(report as any).authorName || (report as any).author || 'Unknown'}
- Created: ${report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Unknown'}
- Description: ${(report as any).description || (report as any).summary || 'No description'}
`;
          }
          break;

        default:
          return `Entity type "${entityType}" not supported.`;
      }

      return `No ${entityType} found with identifier: ${identifier}`;
    } catch (error) {
      console.error(`Error fetching ${entityType} data:`, error);
      return `Unable to fetch ${entityType} information.`;
    }
  }

  /**
   * Get comprehensive context for complex queries
   */
  static async getComprehensiveContext(context: KnowledgeContext): Promise<string> {
    const { workspace, user } = context;
    
    try {
      const [
        taskContext, 
        teamContext, 
        reportContext, 
        userContext, 
        workspaceContext,
        folderContext,
        projectContext,
        branchContext,
        regionContext,
        departmentContext
      ] = await Promise.all([
        this.getTaskContext(workspace.id, user.id, user.role),
        this.getTeamContext(workspace.id, user.id),
        this.getReportContext(workspace.id, user.id, user.role),
        this.getUserContext(workspace.id, user.role, user.id),
        this.getWorkspaceContext(workspace.id, user.role, user.id),
        this.getFolderContext(workspace.id, user.id, user.role),
        this.getProjectContext(workspace.id, user.id, user.role),
        this.getBranchContext(workspace.id, user.id, user.role),
        this.getRegionContext(workspace.id, user.id, user.role),
        this.getDepartmentContext(workspace.id, user.id, user.role)
      ]);

      return `COMPREHENSIVE WORKSPACE CONTEXT:
${taskContext}${teamContext}${reportContext}${userContext}${workspaceContext}${folderContext}${projectContext}${branchContext}${regionContext}${departmentContext}

NOTE: This data is current as of the time of query and reflects the user's access level.`;
    } catch (error) {
      console.error('Error fetching comprehensive context:', error);
      return 'Unable to fetch complete workspace context.';
    }
  }

  /**
   * Get detailed regional manager information for owner queries
   */
  static async getRegionalManagerDetails(context: KnowledgeContext): Promise<string> {
    const { workspace, user } = context;
    
    if (user.role !== 'owner') {
      return '\nREGIONAL MANAGERS: Access restricted to workspace owners only.\n';
    }

    try {
      const userWorkspaces = await WorkspaceService.getUserWorkspaces(user.id);
      const regionalManagers: any[] = [];
      
      for (const uw of userWorkspaces) {
        try {
          const workspaceRegions = await RegionService.getWorkspaceRegions(uw.workspace.id);
          
          for (const region of workspaceRegions) {
            if (region.adminIds && region.adminIds.length > 0) {
              // Get admin details for each region
              for (const adminId of region.adminIds) {
                try {
                  const adminUser = await UserService.getUserById(adminId);
                  if (adminUser) {
                    regionalManagers.push({
                      name: adminUser.name,
                      email: adminUser.email,
                      region: region.name,
                      workspace: uw.workspace.name,
                      regionId: region.id
                    });
                  }
                } catch (error) {
                  console.error(`Error getting admin details for ${adminId}:`, error);
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error getting regions from ${uw.workspace.name}:`, error);
        }
      }

      if (regionalManagers.length === 0) {
        return `\nREGIONAL MANAGERS:
📍 No regional managers found across your workspaces.

💡 To assign regional managers:
1. Go to Regions management
2. Select a region
3. Assign admin users as regional managers
`;
      }

      const managerList = regionalManagers.map(rm => 
        `• ${rm.name} (${rm.email}) - Managing "${rm.region}" in workspace "${rm.workspace}"`
      ).join('\n');

      return `\nREGIONAL MANAGERS (${regionalManagers.length} found):
${managerList}

📊 Summary:
- Total regional managers: ${regionalManagers.length}
- Regions covered: ${new Set(regionalManagers.map(rm => rm.region)).size}
- Workspaces with regional management: ${new Set(regionalManagers.map(rm => rm.workspace)).size}
`;
    } catch (error) {
      console.error('Error fetching regional manager details:', error);
      return '\nREGIONAL MANAGERS: Unable to fetch regional manager information.\n';
    }
  }

  /**
   * Get comprehensive user list using multiple data sources
   */
  static async getComprehensiveUserList(workspaceId: string): Promise<any[]> {
    const allUsers = new Map(); // Use Map to deduplicate by userId
    console.log(`🔍 getComprehensiveUserList called for workspace: ${workspaceId}`);
    
    try {
      // Source 1: Direct userWorkspaces query
      try {
        const { db } = await import('../firebase');
        const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore');
        
        const userWorkspacesRef = collection(db, 'userWorkspaces');
        const q = query(userWorkspacesRef, where('workspaceId', '==', workspaceId));
        const querySnapshot = await getDocs(q);
        
        console.log(`📋 userWorkspaces query found ${querySnapshot.docs.length} records`);
        
        for (const docSnap of querySnapshot.docs) {
          const userWorkspace = docSnap.data();
          try {
            const userDoc = await getDoc(doc(db, 'users', userWorkspace.userId));
            if (userDoc.exists()) {
              allUsers.set(userWorkspace.userId, {
                user: { id: userDoc.id, ...userDoc.data() },
                role: userWorkspace.role,
                joinedAt: userWorkspace.joinedAt,
                source: 'userWorkspaces'
              });
            }
          } catch (userError) {
            console.error(`Error getting user ${userWorkspace.userId}:`, userError);
          }
        }
        console.log(`📊 After userWorkspaces: ${allUsers.size} unique users`);
      } catch (error) {
        console.error('Error querying userWorkspaces:', error);
      }
      
      // Source 2: Team members
      try {
        const teams = await TeamService.getWorkspaceTeams(workspaceId);
        console.log(`📋 Found ${teams.length} teams in workspace`);
        for (const team of teams) {
          const teamMembers = await TeamService.getTeamMembersWithDetails(team.id);
          console.log(`📋 Team "${team.name}" has ${teamMembers.length} members`);
          for (const member of teamMembers) {
            if (!allUsers.has(member.userId)) {
              allUsers.set(member.userId, {
                user: member.user,
                role: member.role || 'member',
                joinedAt: member.joinedAt,
                source: 'teams'
              });
            }
          }
        }
        console.log(`📊 After teams: ${allUsers.size} unique users`);
      } catch (error) {
        console.error('Error getting team members:', error);
      }
      
      // Source 3: Workspace service (fallback)
      try {
        const workspaceUsers = await WorkspaceService.getWorkspaceUsers(workspaceId);
        console.log(`📋 WorkspaceService found ${workspaceUsers.length} users`);
        for (const wu of workspaceUsers) {
          if (!allUsers.has(wu.user.id)) {
            allUsers.set(wu.user.id, {
              ...wu,
              source: 'workspace'
            });
          }
        }
        console.log(`📊 After workspace service: ${allUsers.size} unique users`);
      } catch (error) {
        console.error('Error getting workspace users:', error);
      }
      
    } catch (error) {
      console.error('Error in getComprehensiveUserList:', error);
    }
    
    const result = Array.from(allUsers.values());
    console.log(`✅ getComprehensiveUserList returning ${result.length} users for workspace ${workspaceId}`);
    return result;
  }

  /**
   * Get folder-related context
   */
  static async getFolderContext(workspaceId: string, userId: string, userRole: string): Promise<string> {
    try {
      let contextData = '';
      
      // For owners/admins, get data from appropriate workspaces based on user role
      if (userRole === 'owner' || userRole === 'admin') {
        try {
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
          
          let totalFoldersAcrossWorkspaces = 0;
          let totalFilesAcrossWorkspaces = 0;
          let totalSizeAcrossWorkspaces = 0;
          let totalSharedFolders = 0;
          let totalUserFolders = 0;
          const workspaceFolderSummaries: string[] = [];
          
          // Get data from appropriate workspaces based on user role
          for (const uw of userWorkspaces) {
            // Owners see data from ALL workspaces they have access to (any role)
            // Admins see data from workspaces where they are admin or owner
            if ((userRole === 'owner') || 
                (userRole === 'admin' && (uw.role === 'admin' || uw.role === 'owner'))) {
              console.log(`🔍 Processing folders from workspace "${uw.workspace.name}" where user is ${uw.role}...`);
              try {
                const workspaceFolders = await FolderService.getFoldersForUser(userId, uw.workspace.id, userRole);
                
                const wsFolderCount = workspaceFolders.length;
                const wsFileCount = workspaceFolders.reduce((sum: number, f: any) => sum + (f.fileCount || 0), 0);
                const wsTotalSize = workspaceFolders.reduce((sum: number, f: any) => sum + (f.totalSize || 0), 0);
                const wsSharedFolders = workspaceFolders.filter((f: any) => f.isShared).length;
                const wsUserFolders = workspaceFolders.filter((f: any) => f.createdBy === userId).length;
                
                totalFoldersAcrossWorkspaces += wsFolderCount;
                totalFilesAcrossWorkspaces += wsFileCount;
                totalSizeAcrossWorkspaces += wsTotalSize;
                totalSharedFolders += wsSharedFolders;
                totalUserFolders += wsUserFolders;
                
                if (wsFolderCount > 0) {
                  workspaceFolderSummaries.push(`"${uw.workspace.name}": ${wsFolderCount} folders (${wsFileCount} files)`);
                }
              } catch (error) {
                console.error(`❌ Error getting folders from workspace ${uw.workspace.name}:`, error);
              }
            } else {
              console.log(`⚠️  Skipping workspace "${uw.workspace.name}" for folders - user role is ${uw.role}, but current query role is ${userRole}`);
            }
          }
          
          console.log(`📊 Cross-workspace folder aggregation complete: ${totalFoldersAcrossWorkspaces} total folders across ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`);
          
          contextData = `\nFOLDER DATA (${userRole.toUpperCase()} - CROSS-WORKSPACE):
- Total accessible folders across all ${userRole === 'owner' ? 'owned' : 'admin'} workspaces: ${totalFoldersAcrossWorkspaces}
- Total files: ${totalFilesAcrossWorkspaces}
- Total storage: ${(totalSizeAcrossWorkspaces / (1024 * 1024)).toFixed(2)} MB
- Shared folders: ${totalSharedFolders}
- Your folders: ${totalUserFolders}
- Workspace breakdown: ${workspaceFolderSummaries.length > 0 ? workspaceFolderSummaries.join(', ') : `No folders found in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`}
- Access level: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} (can manage folders in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces only)
`;
          
          return contextData;
        } catch (error) {
          console.error(`❌ Error getting cross-workspace folder data for ${userRole}:`, error);
        }
      }
      
      // For non-owners or if owner query fails, use current workspace only
      const folders = await FolderService.getFoldersForUser(userId, workspaceId, userRole);
      const userFolders = folders.filter((f: any) => f.createdBy === userId);
      
      const totalFolders = folders.length;
      const totalFiles = folders.reduce((sum: number, f: any) => sum + (f.fileCount || 0), 0);
      const totalSize = folders.reduce((sum: number, f: any) => sum + (f.totalSize || 0), 0);
      const sharedFolders = folders.filter((f: any) => f.isShared).length;
      
      return `\nFOLDER DATA:
- Total accessible folders: ${totalFolders}
- Total files: ${totalFiles}
- Total storage: ${(totalSize / (1024 * 1024)).toFixed(2)} MB
- Shared folders: ${sharedFolders}
- Your folders: ${userFolders.length}
- Access level: ${userRole === 'owner' ? 'Can manage all folders' : 'Can manage own folders'}
`;
    } catch (error) {
      console.error('Error fetching folder context:', error);
      return '\nFOLDER DATA: Unable to fetch folder information.\n';
    }
  }

  /**
   * Get project-related context
   */
  static async getProjectContext(workspaceId: string, userId: string, userRole: string): Promise<string> {
    try {
      let contextData = '';
      
      // For owners/admins, get data from appropriate workspaces based on user role
      if (userRole === 'owner' || userRole === 'admin') {
        try {
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
          
          let totalProjectsAcrossWorkspaces = 0;
          let totalActiveProjects = 0;
          let totalCompletedProjects = 0;
          let totalPlanningProjects = 0;
          let totalUserProjects = 0;
          const workspaceProjectSummaries: string[] = [];
          
          // Get data from appropriate workspaces based on user role
          for (const uw of userWorkspaces) {
            // Owners see data from ALL workspaces they have access to (any role)
            // Admins see data from workspaces where they are admin or owner
            if ((userRole === 'owner') || 
                (userRole === 'admin' && (uw.role === 'admin' || uw.role === 'owner'))) {
              console.log(`🔍 Processing projects from workspace "${uw.workspace.name}" where user is ${uw.role}...`);
              try {
                const workspaceProjects = await ProjectService.getWorkspaceProjects(uw.workspace.id);
                
                const wsProjectCount = workspaceProjects.length;
                const wsActiveProjects = workspaceProjects.filter((p: any) => p.status === 'active').length;
                const wsCompletedProjects = workspaceProjects.filter((p: any) => p.status === 'completed').length;
                const wsPlanningProjects = workspaceProjects.filter((p: any) => p.status === 'planning').length;
                const wsUserProjects = workspaceProjects.filter((p: any) => p.ownerId === userId).length;
                
                totalProjectsAcrossWorkspaces += wsProjectCount;
                totalActiveProjects += wsActiveProjects;
                totalCompletedProjects += wsCompletedProjects;
                totalPlanningProjects += wsPlanningProjects;
                totalUserProjects += wsUserProjects;
                
                if (wsProjectCount > 0) {
                  workspaceProjectSummaries.push(`"${uw.workspace.name}": ${wsProjectCount} projects (${wsUserProjects} yours)`);
                }
              } catch (error) {
                console.error(`❌ Error getting projects from workspace ${uw.workspace.name}:`, error);
              }
            } else {
              console.log(`⚠️  Skipping workspace "${uw.workspace.name}" for projects - user role is ${uw.role}, but current query role is ${userRole}`);
            }
          }
          
          console.log(`📊 Cross-workspace project aggregation complete: ${totalProjectsAcrossWorkspaces} total projects across ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`);
          
          contextData = `\nPROJECT DATA (${userRole.toUpperCase()} - CROSS-WORKSPACE):
- Total projects across all ${userRole === 'owner' ? 'owned' : 'admin'} workspaces: ${totalProjectsAcrossWorkspaces}
- Active projects: ${totalActiveProjects}
- Completed projects: ${totalCompletedProjects}
- Planning projects: ${totalPlanningProjects}
- Your projects: ${totalUserProjects}
- Workspace breakdown: ${workspaceProjectSummaries.length > 0 ? workspaceProjectSummaries.join(', ') : `No projects found in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`}
- Access level: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} (can manage projects in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces only)
`;
          
          return contextData;
        } catch (error) {
          console.error(`❌ Error getting cross-workspace project data for ${userRole}:`, error);
        }
      }
      
      // For non-owners or if owner query fails, use current workspace only
      const projects = await ProjectService.getWorkspaceProjects(workspaceId);
      const userProjects = projects.filter((p: any) => p.ownerId === userId);
      
      const totalProjects = projects.length;
      const activeProjects = projects.filter((p: any) => p.status === 'active').length;
      const completedProjects = projects.filter((p: any) => p.status === 'completed').length;
      const planningProjects = projects.filter((p: any) => p.status === 'planning').length;
      
      return `\nPROJECT DATA:
- Total projects: ${totalProjects}
- Active projects: ${activeProjects}
- Completed projects: ${completedProjects}
- Planning projects: ${planningProjects}
- Your projects: ${userProjects.length}
- Access level: ${userRole === 'owner' ? 'Can manage all projects' : 'Can manage assigned projects'}
`;
    } catch (error) {
      console.error('Error fetching project context:', error);
      return '\nPROJECT DATA: Unable to fetch project information.\n';
    }
  }

  /**
   * Get branch-related context
   */
  static async getBranchContext(workspaceId: string, userId: string, userRole: string): Promise<string> {
    try {
      let contextData = '';
      
      // For owners/admins, get data from appropriate workspaces based on user role
      if (userRole === 'owner' || userRole === 'admin') {
        try {
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
          
          let totalBranchesAcrossWorkspaces = 0;
          let totalActiveBranches = 0;
          let totalUsersAcrossWorkspaces = 0;
          const workspaceBranchSummaries: string[] = [];
          
          // Get data from appropriate workspaces based on user role
          for (const uw of userWorkspaces) {
            // Owners see data from ALL workspaces they have access to (any role)
            // Admins see data from workspaces where they are admin or owner
            if ((userRole === 'owner') || 
                (userRole === 'admin' && (uw.role === 'admin' || uw.role === 'owner'))) {
              console.log(`🔍 Processing branches from workspace "${uw.workspace.name}" where user is ${uw.role}...`);
              try {
                const workspaceBranches = await BranchService.getWorkspaceBranches(uw.workspace.id);
                
                const wsBranchCount = workspaceBranches.length;
                const wsActiveBranches = workspaceBranches.filter((b: any) => b.status === 'active').length;
                const wsUserCount = workspaceBranches.reduce((sum: number, b: any) => sum + (b.userIds?.length || 0), 0);
                
                totalBranchesAcrossWorkspaces += wsBranchCount;
                totalActiveBranches += wsActiveBranches;
                totalUsersAcrossWorkspaces += wsUserCount;
                
                if (wsBranchCount > 0) {
                  workspaceBranchSummaries.push(`"${uw.workspace.name}": ${wsBranchCount} branches (${wsUserCount} users)`);
                }
              } catch (error) {
                console.error(`❌ Error getting branches from workspace ${uw.workspace.name}:`, error);
              }
            } else {
              console.log(`⚠️  Skipping workspace "${uw.workspace.name}" for branches - user role is ${uw.role}, but current query role is ${userRole}`);
            }
          }
          
          console.log(`📊 Cross-workspace branch aggregation complete: ${totalBranchesAcrossWorkspaces} total branches across ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`);
          
          contextData = `\nBRANCH DATA (${userRole.toUpperCase()} - CROSS-WORKSPACE):
- Total branches across all ${userRole === 'owner' ? 'owned' : 'admin'} workspaces: ${totalBranchesAcrossWorkspaces}
- Active branches: ${totalActiveBranches}
- Total users across all branches: ${totalUsersAcrossWorkspaces}
- Workspace breakdown: ${workspaceBranchSummaries.length > 0 ? workspaceBranchSummaries.join(', ') : `No branches found in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`}
- Access level: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} (can manage branches in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces only)
`;
          
          return contextData;
        } catch (error) {
          console.error(`❌ Error getting cross-workspace branch data for ${userRole}:`, error);
        }
      }
      
      // For non-owners or if owner query fails, use current workspace only
      const branches = await BranchService.getWorkspaceBranches(workspaceId);
      
      const totalBranches = branches.length;
      const activeBranches = branches.filter((b: any) => b.status === 'active').length;
      const totalUsers = branches.reduce((sum: number, b: any) => sum + (b.userIds?.length || 0), 0);
      
      return `\nBRANCH DATA:
- Total branches: ${totalBranches}
- Active branches: ${activeBranches}
- Total users across branches: ${totalUsers}
- Access level: ${userRole === 'owner' ? 'Can manage all branches' : 'Can view branch information'}
`;
    } catch (error) {
      console.error('Error fetching branch context:', error);
      return '\nBRANCH DATA: Unable to fetch branch information.\n';
    }
  }

  /**
   * Get region-related context
   */
  static async getRegionContext(workspaceId: string, userId: string, userRole: string): Promise<string> {
    try {
      let contextData = '';
      
      // For owners/admins, get data from appropriate workspaces based on user role
      if (userRole === 'owner' || userRole === 'admin') {
        try {
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
          
          let totalRegionsAcrossWorkspaces = 0;
          let totalBranchesAcrossWorkspaces = 0;
          let totalRegionalManagers = 0;
          const workspaceRegionSummaries: string[] = [];
          
          // Get data from appropriate workspaces based on user role
          for (const uw of userWorkspaces) {
            // Owners see data from ALL workspaces they have access to (any role)
            // Admins see data from workspaces where they are admin or owner
            if ((userRole === 'owner') || 
                (userRole === 'admin' && (uw.role === 'admin' || uw.role === 'owner'))) {
              console.log(`🔍 Processing regions from workspace "${uw.workspace.name}" where user is ${uw.role}...`);
              try {
                const workspaceRegions = await RegionService.getWorkspaceRegions(uw.workspace.id);
                
                const wsRegionCount = workspaceRegions.length;
                const wsBranchCount = workspaceRegions.reduce((sum: number, r: any) => sum + (r.branches?.length || 0), 0);
                const wsRegionalManagers = workspaceRegions.filter((r: any) => r.adminIds?.length > 0).length;
                
                totalRegionsAcrossWorkspaces += wsRegionCount;
                totalBranchesAcrossWorkspaces += wsBranchCount;
                totalRegionalManagers += wsRegionalManagers;
                
                if (wsRegionCount > 0) {
                  workspaceRegionSummaries.push(`"${uw.workspace.name}": ${wsRegionCount} regions (${wsBranchCount} branches)`);
                }
              } catch (error) {
                console.error(`❌ Error getting regions from workspace ${uw.workspace.name}:`, error);
              }
            } else {
              console.log(`⚠️  Skipping workspace "${uw.workspace.name}" for regions - user role is ${uw.role}, but current query role is ${userRole}`);
            }
          }
          
          console.log(`📊 Cross-workspace region aggregation complete: ${totalRegionsAcrossWorkspaces} total regions across ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`);
          
          contextData = `\nREGION DATA (${userRole.toUpperCase()} - CROSS-WORKSPACE):
- Total regions across all ${userRole === 'owner' ? 'owned' : 'admin'} workspaces: ${totalRegionsAcrossWorkspaces}
- Total branches across all regions: ${totalBranchesAcrossWorkspaces}
- Regional managers assigned: ${totalRegionalManagers}
- Workspace breakdown: ${workspaceRegionSummaries.length > 0 ? workspaceRegionSummaries.join(', ') : `No regions found in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`}
- Access level: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} (can manage regions in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces only)
`;
          
          return contextData;
        } catch (error) {
          console.error(`❌ Error getting cross-workspace region data for ${userRole}:`, error);
        }
      }
      
      // For non-owners or if owner query fails, use current workspace only
      const regions = await RegionService.getWorkspaceRegions(workspaceId);
      
      const totalRegions = regions.length;
      const totalBranches = regions.reduce((sum: number, r: any) => sum + (r.branches?.length || 0), 0);
      const regionalManagers = regions.filter((r: any) => r.adminIds?.length > 0);
      
      return `\nREGION DATA:
- Total regions: ${totalRegions}
- Total branches across regions: ${totalBranches}
- Regional managers: ${regionalManagers.length}
- Access level: ${userRole === 'owner' ? 'Can manage all regions' : 'Can view region information'}
`;
    } catch (error) {
      console.error('Error fetching region context:', error);
      return '\nREGION DATA: Unable to fetch region information.\n';
    }
  }

  /**
   * Get department-related context
   */
  static async getDepartmentContext(workspaceId: string, userId: string, userRole: string): Promise<string> {
    try {
      let contextData = '';
      
      // For owners/admins, get data from appropriate workspaces based on user role
      if (userRole === 'owner' || userRole === 'admin') {
        try {
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
          
          let totalDepartmentsAcrossWorkspaces = 0;
          let totalActiveDepartments = 0;
          let totalMembersAcrossWorkspaces = 0;
          let totalDepartmentHeads = 0;
          const workspaceDepartmentSummaries: string[] = [];
          
          // Get data from appropriate workspaces based on user role
          for (const uw of userWorkspaces) {
            // Owners see data from ALL workspaces they have access to (any role)
            // Admins see data from workspaces where they are admin or owner
            if ((userRole === 'owner') || 
                (userRole === 'admin' && (uw.role === 'admin' || uw.role === 'owner'))) {
              console.log(`🔍 Processing departments from workspace "${uw.workspace.name}" where user is ${uw.role}...`);
              try {
                const workspaceDepartments = await DepartmentService.getWorkspaceDepartments(uw.workspace.id);
                
                const wsDepartmentCount = workspaceDepartments.length;
                const wsActiveDepartments = workspaceDepartments.filter((d: any) => d.status === 'active').length;
                const wsMemberCount = workspaceDepartments.reduce((sum: number, d: any) => sum + (d.memberCount || 0), 0);
                const wsDepartmentHeads = workspaceDepartments.filter((d: any) => d.headId).length;
                
                totalDepartmentsAcrossWorkspaces += wsDepartmentCount;
                totalActiveDepartments += wsActiveDepartments;
                totalMembersAcrossWorkspaces += wsMemberCount;
                totalDepartmentHeads += wsDepartmentHeads;
                
                if (wsDepartmentCount > 0) {
                  workspaceDepartmentSummaries.push(`"${uw.workspace.name}": ${wsDepartmentCount} departments (${wsMemberCount} members)`);
                }
              } catch (error) {
                console.error(`❌ Error getting departments from workspace ${uw.workspace.name}:`, error);
              }
            } else {
              console.log(`⚠️  Skipping workspace "${uw.workspace.name}" for departments - user role is ${uw.role}, but current query role is ${userRole}`);
            }
          }
          
          console.log(`📊 Cross-workspace department aggregation complete: ${totalDepartmentsAcrossWorkspaces} total departments across ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`);
          
          contextData = `\nDEPARTMENT DATA (${userRole.toUpperCase()} - CROSS-WORKSPACE):
- Total departments across all ${userRole === 'owner' ? 'owned' : 'admin'} workspaces: ${totalDepartmentsAcrossWorkspaces}
- Active departments: ${totalActiveDepartments}
- Total members across all departments: ${totalMembersAcrossWorkspaces}
- Department heads assigned: ${totalDepartmentHeads}
- Workspace breakdown: ${workspaceDepartmentSummaries.length > 0 ? workspaceDepartmentSummaries.join(', ') : `No departments found in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces`}
- Access level: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} (can manage departments in ${userRole === 'owner' ? 'owned' : 'admin'} workspaces only)
`;
          
          return contextData;
        } catch (error) {
          console.error(`❌ Error getting cross-workspace department data for ${userRole}:`, error);
        }
      }
      
      // For non-owners or if owner query fails, use current workspace only
      const departments = await DepartmentService.getWorkspaceDepartments(workspaceId);
      
      const totalDepartments = departments.length;
      const activeDepartments = departments.filter((d: any) => d.status === 'active').length;
      const totalMembers = departments.reduce((sum: number, d: any) => sum + (d.memberCount || 0), 0);
      const departmentHeads = departments.filter((d: any) => d.headId).length;
      
      return `\nDEPARTMENT DATA:
- Total departments: ${totalDepartments}
- Active departments: ${activeDepartments}
- Total members across departments: ${totalMembers}
- Department heads: ${departmentHeads}
- Access level: ${userRole === 'owner' ? 'Can manage all departments' : 'Can view department information'}
`;
    } catch (error) {
      console.error('Error fetching department context:', error);
      return '\nDEPARTMENT DATA: Unable to fetch department information.\n';
    }
  }
}
