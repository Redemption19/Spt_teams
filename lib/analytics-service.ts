import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { UserService } from './user-service';
import { TeamService } from './team-service';
import { TaskService } from './task-service';
import { ProjectService } from './project-service';
import { ActivityService } from './activity-service';
import { BranchService } from './branch-service';
import { RegionService } from './region-service';
import { WorkspaceService } from './workspace-service';
import { Task, Project, Branch } from './types';

export interface AnalyticsStats {
  avgProductivity: number;
  productivityChange: number;
  taskCompletion: number;
  taskCompletionChange: number;
  activeUsers: number;
  activeUsersChange: number;
  projectsActive: number;
  projectsDueThisWeek: number;
}

export interface PerformanceData {
  month: string;
  productivity: number;
  tasks: number;
  efficiency: number;
  completed: number;
}

export interface TeamDistributionData {
  name: string;
  value: number;
  color: string;
  tasks: number;
  completion: number;
}

export interface BranchMetricsData {
  branch: string;
  tasks: number;
  completed: number;
  efficiency: number;
  activeUsers: number;
}

export interface ProductivityTrendData {
  week: string;
  individual: number;
  team: number;
  period: Date;
}

export interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
    preset: 'last-7-days' | 'last-30-days' | 'last-3-months' | 'last-year';
  };
  workspaceId?: string;
  teamIds?: string[];
  branchIds?: string[];
  regionIds?: string[];
}

export class AnalyticsService {
  /**
   * Get analytics statistics with RBAC filtering
   */
  static async getAnalyticsStats(
    workspaceId: string,
    userId: string,
    userRole: 'member' | 'admin' | 'owner',
    filters: AnalyticsFilters
  ): Promise<AnalyticsStats> {
    try {
      const { from, to } = filters.dateRange;
      const previousPeriodFrom = new Date(from);
      previousPeriodFrom.setDate(previousPeriodFrom.getDate() - (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

      // Get data based on user role
      const workspaceFilter = this.getWorkspaceFilter(workspaceId, userId, userRole);
      
      const [
        currentTasks,
        previousTasks,
        currentProjects,
        currentUsers,
        previousUsers
      ] = await Promise.all([
        this.getTasksInPeriod(workspaceFilter, from, to, userRole, userId),
        this.getTasksInPeriod(workspaceFilter, previousPeriodFrom, from, userRole, userId),
        this.getProjectsInPeriod(workspaceFilter, from, to, userRole, userId),
        this.getActiveUsersInPeriod(workspaceFilter, from, to, userRole),
        this.getActiveUsersInPeriod(workspaceFilter, previousPeriodFrom, from, userRole)
      ]);

      // Calculate productivity metrics
      const completedTasks = currentTasks.filter((t: Task) => t.status === 'completed').length;
      const totalTasks = currentTasks.length;
      const taskCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const previousCompletedTasks = previousTasks.filter((t: Task) => t.status === 'completed').length;
      const previousTotalTasks = previousTasks.length;
      const previousTaskCompletion = previousTotalTasks > 0 ? (previousCompletedTasks / previousTotalTasks) * 100 : 0;

      // Calculate average task completion time for productivity
      const avgProductivity = this.calculateProductivityScore(currentTasks);
      const previousProductivity = this.calculateProductivityScore(previousTasks);

      // Calculate active projects
      const activeProjects = currentProjects.filter((p: Project) => p.status === 'active').length;
      const projectsDueThisWeek = this.getProjectsDueThisWeek(currentProjects);

      return {
        avgProductivity,
        productivityChange: previousProductivity > 0 ? ((avgProductivity - previousProductivity) / previousProductivity) * 100 : 0,
        taskCompletion,
        taskCompletionChange: previousTaskCompletion > 0 ? ((taskCompletion - previousTaskCompletion) / previousTaskCompletion) * 100 : 0,
        activeUsers: currentUsers.length,
        activeUsersChange: currentUsers.length - previousUsers.length,
        projectsActive: activeProjects,
        projectsDueThisWeek
      };
    } catch (error) {
      console.error('Error fetching analytics stats:', error);
      throw error;
    }
  }

  /**
   * Get performance data over time with RBAC
   */
  static async getPerformanceData(
    workspaceId: string,
    userId: string,
    userRole: 'member' | 'admin' | 'owner',
    filters: AnalyticsFilters
  ): Promise<PerformanceData[]> {
    try {
      const { from, to, preset } = filters.dateRange;
      const workspaceFilter = this.getWorkspaceFilter(workspaceId, userId, userRole);
      
      // Get intervals based on preset
      const intervals = this.getTimeIntervals(from, to, preset);
      
      const performanceData: PerformanceData[] = [];
      
      for (const interval of intervals) {
        const tasks = await this.getTasksInPeriod(
          workspaceFilter, 
          interval.start, 
          interval.end, 
          userRole, 
          userId
        );
        
        const completedTasks = tasks.filter((t: Task) => t.status === 'completed').length;
        const totalTasks = tasks.length;
        const productivity = this.calculateProductivityScore(tasks);
        const efficiency = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        performanceData.push({
          month: interval.label,
          productivity,
          tasks: totalTasks,
          efficiency,
          completed: completedTasks
        });
      }
      
      return performanceData;
    } catch (error) {
      console.error('Error fetching performance data:', error);
      throw error;
    }
  }

  /**
   * Get team distribution analytics with RBAC
   */
  static async getTeamDistribution(
    workspaceId: string,
    userId: string,
    userRole: 'member' | 'admin' | 'owner',
    filters: AnalyticsFilters
  ): Promise<TeamDistributionData[]> {
    try {
      const workspaceFilter = this.getWorkspaceFilter(workspaceId, userId, userRole);
      const { from, to } = filters.dateRange;
      
      // Get teams based on role
      let teams;
      if (userRole === 'member') {
        // Members can only see their own teams
        const userTeams = await TeamService.getUserTeams(userId, workspaceId);
        teams = userTeams.filter(ut => ut.team.workspaceId === workspaceId).map(ut => ut.team);
      } else {
        // Admins and owners can see all workspace teams
        teams = await TeamService.getWorkspaceTeams(workspaceId);
      }
      
      const teamDistribution: TeamDistributionData[] = [];
      const colors = [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))'
      ];
      
      for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        const tasks = await this.getTeamTasksInPeriod(team.id, from, to, userRole, userId);
        const completedTasks = tasks.filter((t: Task) => t.status === 'completed').length;
        
        teamDistribution.push({
          name: team.name,
          value: tasks.length,
          color: colors[i % colors.length],
          tasks: tasks.length,
          completion: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0
        });
      }
      
      return teamDistribution;
    } catch (error) {
      console.error('Error fetching team distribution:', error);
      throw error;
    }
  }

  /**
   * Get branch metrics with RBAC
   */
  static async getBranchMetrics(
    workspaceId: string,
    userId: string,
    userRole: 'member' | 'admin' | 'owner',
    filters: AnalyticsFilters
  ): Promise<BranchMetricsData[]> {
    try {
      const { from, to } = filters.dateRange;
      
      // Get current workspace to check if it's a sub-workspace
      const currentWorkspace = await WorkspaceService.getWorkspace(workspaceId);
      
      // Determine which workspace to load branches from
      // For sub-workspaces, load from parent workspace (same logic as other components)
      const sourceWorkspaceId = currentWorkspace?.workspaceType === 'sub' 
        ? currentWorkspace.parentWorkspaceId || workspaceId
        : workspaceId;
      
      // Get branches based on role
      let branches: Branch[];
      if (userRole === 'member') {
        // Members can only see their own branch
        const userProfile = await UserService.getUser(userId);
        if (userProfile?.branchId) {
          const branch = await BranchService.getBranch(userProfile.branchId);
          branches = branch ? [branch] : [];
        } else {
          branches = [];
        }
      } else {
        // Admins and owners can see branches from the source workspace
        branches = await BranchService.getWorkspaceBranches(sourceWorkspaceId);
      }
      
      // Filter branches based on workspace type
      let filteredBranches = branches;
      if (currentWorkspace?.workspaceType === 'sub') {
        // For sub-workspaces, only show the bound branch
        filteredBranches = currentWorkspace.branchId 
          ? branches.filter(b => b.id === currentWorkspace.branchId)
          : [];
      }
      
      const branchMetrics: BranchMetricsData[] = [];
      
      for (const branch of filteredBranches) {
        const [tasks, users] = await Promise.all([
          this.getBranchTasksInPeriod(branch.id, from, to, userRole, userId),
          this.getBranchActiveUsers(branch.id, from, to)
        ]);
        
        const completedTasks = tasks.filter((t: Task) => t.status === 'completed').length;
        const efficiency = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
        
        branchMetrics.push({
          branch: branch.name,
          tasks: tasks.length,
          completed: completedTasks,
          efficiency,
          activeUsers: users.length
        });
      }
      
      return branchMetrics;
    } catch (error) {
      console.error('Error fetching branch metrics:', error);
      throw error;
    }
  }

  /**
   * Get productivity trends with RBAC
   */
  static async getProductivityTrends(
    workspaceId: string,
    userId: string,
    userRole: 'member' | 'admin' | 'owner',
    filters: AnalyticsFilters
  ): Promise<ProductivityTrendData[]> {
    try {
      const { from, to } = filters.dateRange;
      const workspaceFilter = this.getWorkspaceFilter(workspaceId, userId, userRole);
      
      // Get weekly intervals
      const weeks = this.getWeeklyIntervals(from, to);
      const trendData: ProductivityTrendData[] = [];
      
      for (const week of weeks) {
        const [userTasks, allTasks] = await Promise.all([
          userRole === 'member' 
            ? this.getUserTasksInPeriod(userId, week.start, week.end, workspaceId)
            : this.getTasksInPeriod(workspaceFilter, week.start, week.end, userRole, userId),
          this.getTasksInPeriod(workspaceFilter, week.start, week.end, userRole, userId)
        ]);
        
        const individualProductivity = userRole === 'member' 
          ? this.calculateProductivityScore(userTasks)
          : this.calculateProductivityScore(allTasks);
        const teamProductivity = this.calculateProductivityScore(allTasks);
        
        trendData.push({
          week: week.label,
          individual: individualProductivity,
          team: teamProductivity,
          period: week.start
        });
      }
      
      return trendData;
    } catch (error) {
      console.error('Error fetching productivity trends:', error);
      throw error;
    }
  }

  /**
   * Check if user can access analytics
   */
  static canViewAnalytics(userRole: 'member' | 'admin' | 'owner'): boolean {
    return ['member', 'admin', 'owner'].includes(userRole);
  }

  /**
   * Check if user can view advanced analytics
   */
  static canViewAdvancedAnalytics(userRole: 'member' | 'admin' | 'owner'): boolean {
    return ['admin', 'owner'].includes(userRole);
  }

  /**
   * Check if user can view system-wide analytics
   */
  static canViewSystemWideAnalytics(userRole: 'member' | 'admin' | 'owner'): boolean {
    return userRole === 'owner';
  }

  // Private helper methods

  private static getWorkspaceFilter(workspaceId: string, userId: string, userRole: 'member' | 'admin' | 'owner') {
    if (userRole === 'owner') {
      return { workspaceId }; // Owners can see everything in workspace
    } else if (userRole === 'admin') {
      return { workspaceId }; // Admins can see workspace data
    } else {
      return { workspaceId, userId }; // Members only see their own data
    }
  }

  private static async getTasksInPeriod(
    filter: any, 
    from: Date, 
    to: Date, 
    userRole: 'member' | 'admin' | 'owner',
    userId: string
  ): Promise<Task[]> {
    try {
      if (userRole === 'member') {
        // Get user's assigned and created tasks
        const [assignedTasks, createdTasks] = await Promise.all([
          TaskService.getUserAssignedTasks(userId, filter.workspaceId),
          TaskService.getUserCreatedTasks(userId, filter.workspaceId)
        ]);
        
        // Combine and deduplicate tasks
        const allUserTasks = [...assignedTasks];
        createdTasks.forEach((task: Task) => {
          if (!allUserTasks.some((t: Task) => t.id === task.id)) {
            allUserTasks.push(task);
          }
        });
        
        return allUserTasks;
      } else {
        return await TaskService.getWorkspaceTasks(filter.workspaceId);
      }
    } catch (error) {
      console.error('Error fetching tasks in period:', error);
      return [];
    }
  }

  private static async getProjectsInPeriod(
    filter: any, 
    from: Date, 
    to: Date, 
    userRole: 'member' | 'admin' | 'owner',
    userId: string
  ): Promise<Project[]> {
    try {
      return await ProjectService.getWorkspaceProjects(filter.workspaceId);
    } catch (error) {
      console.error('Error fetching projects in period:', error);
      return [];
    }
  }

  private static async getActiveUsersInPeriod(
    filter: any, 
    from: Date, 
    to: Date, 
    userRole: 'member' | 'admin' | 'owner'
  ) {
    try {
      return await UserService.getUsersByWorkspace(filter.workspaceId);
    } catch (error) {
      console.error('Error fetching active users:', error);
      return [];
    }
  }

  private static async getTeamTasksInPeriod(
    teamId: string, 
    from: Date, 
    to: Date, 
    userRole: 'member' | 'admin' | 'owner',
    userId: string
  ): Promise<Task[]> {
    try {
      // Get the team to find its workspace
      const team = await TeamService.getTeam(teamId);
      if (!team) {
        return [];
      }

      // Get all workspace tasks first
      const allTasks = await TaskService.getWorkspaceTasks(team.workspaceId);

      // Filter tasks within the date range
      const tasksInPeriod = allTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= from && taskDate <= to;
      });

      // Get all projects associated with this team
      const allProjects = await ProjectService.getWorkspaceProjects(team.workspaceId);
      const teamProjects = allProjects.filter(project => project.teamId === teamId);
      const teamProjectIds = new Set(teamProjects.map(p => p.id));

      // Get all team members
      const teamMembers = await TeamService.getTeamMembers(teamId);
      const teamMemberIds = new Set(teamMembers.map(m => m.userId));

      // Find tasks related to this team through:
      // 1. Tasks that belong to projects assigned to this team
      // 2. Tasks assigned to or created by team members
      const teamTasks = tasksInPeriod.filter(task => {
        // Task belongs to a project assigned to this team
        const belongsToTeamProject = task.projectId && teamProjectIds.has(task.projectId);
        
        // Task is assigned to or created by a team member
        const assignedToOrCreatedByTeamMember = 
          (task.assigneeId && teamMemberIds.has(task.assigneeId)) ||
          (task.createdBy && teamMemberIds.has(task.createdBy));

        return belongsToTeamProject || assignedToOrCreatedByTeamMember;
      });

      // Apply role-based filtering
      if (userRole === 'member') {
        // Members can only see their own tasks or public tasks
        return teamTasks.filter(task => 
          task.createdBy === userId || 
          task.assigneeId === userId ||
          task.visibility === 'public'
        );
      } else {
        // Admins and owners can see all team tasks
        return teamTasks;
      }
    } catch (error) {
      console.error('Error getting team tasks in period:', error);
      return [];
    }
  }

  private static async getBranchTasksInPeriod(
    branchId: string, 
    from: Date, 
    to: Date, 
    userRole: 'member' | 'admin' | 'owner',
    userId: string
  ): Promise<Task[]> {
    try {
      // Get the branch to find its workspace
      const branch = await BranchService.getBranch(branchId);
      if (!branch) {
        return [];
      }

      // Get all workspace tasks first
      const allTasks = await TaskService.getWorkspaceTasks(branch.workspaceId);

      // Filter tasks within the date range
      const tasksInPeriod = allTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= from && taskDate <= to;
      });

      // Get all projects in this branch
      const allProjects = await ProjectService.getWorkspaceProjects(branch.workspaceId);
      const branchProjects = allProjects.filter(project => project.branchId === branchId);
      const branchProjectIds = new Set(branchProjects.map(p => p.id));

      // Get all users in this branch
      const branchUsers = await BranchService.getBranchUsers(branchId);
      const branchUserIds = new Set(branchUsers.map(u => u.id));

      // Find tasks related to this branch through:
      // 1. Tasks that belong to projects in this branch
      // 2. Tasks assigned to or created by users in this branch
      const branchTasks = tasksInPeriod.filter(task => {
        // Task belongs to a project in this branch
        const belongsToProjectInBranch = task.projectId && branchProjectIds.has(task.projectId);
        
        // Task is assigned to or created by a user in this branch
        const assignedToOrCreatedByBranchUser = 
          (task.assigneeId && branchUserIds.has(task.assigneeId)) ||
          (task.createdBy && branchUserIds.has(task.createdBy));

        return belongsToProjectInBranch || assignedToOrCreatedByBranchUser;
      });

      // Apply role-based filtering
      if (userRole === 'member') {
        // Members can only see their own tasks or public tasks
        return branchTasks.filter(task => 
          task.createdBy === userId || 
          task.assigneeId === userId ||
          task.visibility === 'public'
        );
      } else {
        // Admins and owners can see all branch tasks
        return branchTasks;
      }
    } catch (error) {
      console.error('Error getting branch tasks in period:', error);
      return [];
    }
  }

  private static async getBranchActiveUsers(branchId: string, from: Date, to: Date) {
    try {
      const branch = await BranchService.getBranch(branchId);
      return branch?.userIds || [];
    } catch (error) {
      return [];
    }
  }

  private static async getUserTasksInPeriod(userId: string, from: Date, to: Date, workspaceId: string): Promise<Task[]> {
    try {
      // Get user's assigned and created tasks
      const [assignedTasks, createdTasks] = await Promise.all([
        TaskService.getUserAssignedTasks(userId, workspaceId),
        TaskService.getUserCreatedTasks(userId, workspaceId)
      ]);
      
      // Combine and deduplicate tasks
      const allUserTasks = [...assignedTasks];
      createdTasks.forEach((task: Task) => {
        if (!allUserTasks.some((t: Task) => t.id === task.id)) {
          allUserTasks.push(task);
        }
      });
      
      return allUserTasks;
    } catch (error) {
      return [];
    }
  }

  private static calculateProductivityScore(tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter((t: Task) => t.status === 'completed').length;
    const onTimeTasks = tasks.filter((t: Task) => 
      t.status === 'completed' && 
      t.dueDate && 
      new Date(t.updatedAt) <= new Date(t.dueDate)
    ).length;
    
    const completionRate = (completedTasks / tasks.length) * 100;
    const onTimeRate = completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0;
    
    // Weighted score: 70% completion rate + 30% on-time rate
    return Math.round((completionRate * 0.7) + (onTimeRate * 0.3));
  }

  private static getProjectsDueThisWeek(projects: Project[]): number {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(now.getDate() + 7);
    
    return projects.filter((p: Project) => 
      p.dueDate && 
      new Date(p.dueDate) >= now && 
      new Date(p.dueDate) <= weekFromNow
    ).length;
  }

  private static getTimeIntervals(from: Date, to: Date, preset: string) {
    const intervals = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (preset === 'last-year') {
      // Monthly intervals for year view
      for (let i = 0; i < 12; i++) {
        const start = new Date(from);
        start.setMonth(start.getMonth() + i);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        
        intervals.push({
          start,
          end,
          label: months[start.getMonth()]
        });
      }
    } else {
      // Weekly intervals for shorter periods
      const current = new Date(from);
      let weekNum = 1;
      
      while (current < to) {
        const start = new Date(current);
        const end = new Date(current);
        end.setDate(end.getDate() + 7);
        
        intervals.push({
          start,
          end: end > to ? to : end,
          label: `W${weekNum}`
        });
        
        current.setDate(current.getDate() + 7);
        weekNum++;
      }
    }
    
    return intervals;
  }

  private static getWeeklyIntervals(from: Date, to: Date) {
    const intervals = [];
    const current = new Date(from);
    let weekNum = 1;
    
    while (current < to) {
      const start = new Date(current);
      const end = new Date(current);
      end.setDate(end.getDate() + 7);
      
      intervals.push({
        start,
        end: end > to ? to : end,
        label: `W${weekNum}`
      });
      
      current.setDate(current.getDate() + 7);
      weekNum++;
    }
    
    return intervals;
  }
} 