'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Users,
  Folder,
  AlertCircle,
  Activity,
  Target,
  BarChart3,
  Crown,
  UserCheck,
  User,
  Building2,
  Globe,
  Plus,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions, useIsOwner } from '@/lib/rbac-hooks';
import { UserService } from '@/lib/user-service';
import { TeamService } from '@/lib/team-service';
import { TaskService } from '@/lib/task-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { ReportService } from '@/lib/report-service';
import { ActivityService } from '@/lib/activity-service';
import { FolderService } from '@/lib/folder-service';
import { NotificationService } from '@/lib/notification-service';
import { GuestService } from '@/lib/guest-service';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingReports: number;
  activeTeams: number;
  allWorkspacesTeams?: number; // For Owner only
  allWorkspacesTasks?: number; // For Owner only
  totalFiles: number;
  totalFolders: number;
  activityScore: number;
  weeklyProgress: number;
  recentActivity: Array<{
    id: string;
    type: 'task' | 'report' | 'file' | 'user';
    message: string;
    timestamp: Date;
    user?: string;
    priority?: 'high' | 'medium' | 'low';
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    type: 'task' | 'report';
    dueDate: Date;
    priority: 'high' | 'medium' | 'low';
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    timestamp: Date;
    read: boolean;
  }>;
}

export function DashboardOverview() {
  const router = useRouter();
  const { user, userProfile, isGuest } = useAuth();
  const { currentWorkspace, userRole, switchToWorkspace, isGuest: isGuestWorkspace } = useWorkspace();
  const permissions = useRolePermissions();
  const isOwner = useIsOwner();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingReports: 0,
    activeTeams: 0,
    totalFiles: 0,
    totalFolders: 0,
    activityScore: 0,
    weeklyProgress: 0,
    recentActivity: [],
    upcomingDeadlines: [],
    notifications: []
  });
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [allWorkspacesData, setAllWorkspacesData] = useState<{
    workspaces: any[];
    totalUsers: number;
    workspaceStats: { [workspaceId: string]: { tasks: number; teams: number; users: number; reports: number; } };
  }>({
    workspaces: [],
    totalUsers: 0,
    workspaceStats: {}
  });
  const [allReports, setAllReports] = useState<any[]>([]);
  const [globalView, setGlobalView] = useState(false); // Toggle between current workspace and global view
  const [loading, setLoading] = useState(true);
  const [switchingWorkspace, setSwitchingWorkspace] = useState<string | null>(null);

  // Helper function to generate enhanced recent activity with real user names
  const generateEnhancedRecentActivity = useCallback(async (tasks: any[], reports: any[]) => {
    const activities: any[] = [];
    const userCache = new Map<string, string>();

    // Helper function to get user name
    const getUserName = async (userId: string): Promise<string> => {
      if (!userId) return 'Unknown User';
      
      if (userCache.has(userId)) {
        return userCache.get(userId)!;
      }

      try {
        const userProfile = await UserService.getUserById(userId);
        const userName = userProfile?.name || `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Unknown User';
        userCache.set(userId, userName);
        return userName;
      } catch (error) {
        console.warn('Error fetching user profile:', error);
        userCache.set(userId, 'Unknown User');
        return 'Unknown User';
      }
    };

    // Add task activities
    for (const [index, task] of tasks.entries()) {
      // Try to get user name from various possible fields
      let userName = task.assigneeName || task.createdByName || task.updatedByName;
      
      if (!userName) {
        const userId = task.assigneeId || task.createdBy || task.updatedBy;
        
        // Check if this is the current user
        if (userId === user?.uid) {
          userName = userProfile?.name || user?.displayName || 'You';
        } else {
          userName = await getUserName(userId);
        }
      }

      activities.push({
        id: task.id || `task-activity-${index}`,
        type: 'task' as const,
        message: `Task "${task.title}" was ${task.status === 'completed' ? 'completed' : 'updated'}`,
        timestamp: task.updatedAt || new Date(Date.now() - (index + 1) * 1000 * 60 * 30),
        user: userName || 'Unknown User',
        priority: task.priority || 'medium'
      });
    }

    // Add report activities
    for (const [index, report] of reports.entries()) {
      // Try to get user name from various possible fields
      let userName = report.authorName || report.createdByName || report.updatedByName;
      
      if (!userName) {
        const userId = report.authorId || report.createdBy || report.updatedBy;
        
        // Check if this is the current user
        if (userId === user?.uid) {
          userName = userProfile?.name || user?.displayName || 'You';
        } else {
          userName = await getUserName(userId);
        }
      }

      activities.push({
        id: report.id || `report-activity-${index}`,
        type: 'report' as const,
        message: `Report "${report.title}" was ${report.status === 'submitted' ? 'submitted' : 'updated'}`,
        timestamp: report.updatedAt || new Date(Date.now() - (index + tasks.length + 1) * 1000 * 60 * 45),
        user: userName || 'Unknown User',
        priority: report.status === 'submitted' ? 'high' : 'medium'
      });
    }

    // Sort by timestamp and return top 8
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [user, userProfile]);

  const loadOwnerDashboardData = useCallback(async () => {
    if (!user || !currentWorkspace) return;

    // TypeScript assertion - we know currentWorkspace is not null here
    const workspace = currentWorkspace!;

    try {
      // Load all accessible workspaces for owner
      const { mainWorkspaces, subWorkspaces, userRoles } = await WorkspaceService.getUserAccessibleWorkspaces(user.uid);
      
      // Calculate total workspaces
      const allWorkspaces = [
        ...mainWorkspaces,
        ...Object.values(subWorkspaces).flat()
      ];



      // Load teams across all workspaces
      let allTeams: any[] = [];
      let allTasks: any[] = [];
      let allUsers: any[] = [];
      let allReports: any[] = [];
      let allFolders: any[] = [];
      const workspaceStats: { [workspaceId: string]: { tasks: number; teams: number; users: number; reports: number; } } = {};

      for (const workspace of allWorkspaces) {
        try {
          const [workspaceTeams, workspaceTasks, workspaceUsers, workspaceReports, workspaceFolders] = await Promise.all([
            TeamService.getWorkspaceTeams(workspace.id),
            TaskService.getWorkspaceTasks(workspace.id),
            WorkspaceService.getWorkspaceUsers(workspace.id),
            ReportService.getWorkspaceReports(workspace.id, { limit: 100 }),
            FolderService.getFoldersForUser(user.uid, workspace.id, 'owner')
          ]);

          // Store workspace-specific stats
          workspaceStats[workspace.id] = {
            tasks: workspaceTasks.length,
            teams: workspaceTeams.length,
            users: workspaceUsers.length,
            reports: workspaceReports.length
          };

          // Add teams with workspace context
          workspaceTeams.forEach(team => {
            allTeams.push({
              ...team,
              workspaceId: workspace.id,
              workspaceName: workspace.name,
              workspaceType: workspace.workspaceType
            });
          });

          // Add tasks with workspace context
          workspaceTasks.forEach(task => {
            allTasks.push({
              ...task,
              workspaceId: workspace.id,
              workspaceName: workspace.name
            });
          });

          // Add users
          allUsers.push(...workspaceUsers.map(wu => ({
            ...wu.user,
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            role: wu.role
          })));

          // Add reports
          allReports.push(...workspaceReports.map(report => ({
            ...report,
            workspaceId: workspace.id,
            workspaceName: workspace.name
          })));

          // Add folders
          allFolders.push(...workspaceFolders.map(folder => ({
            ...folder,
            workspaceId: workspace.id,
            workspaceName: workspace.name
          })));
        } catch (error) {
          console.warn(`❌ Error loading data for workspace ${workspace.name}:`, error);
        }
      }

      // Remove duplicate teams (same team ID)
      const uniqueTeams = allTeams.filter((team, index, self) => 
        index === self.findIndex((t) => t.id === team.id)
      );

      // Remove duplicate tasks (same task ID)
      const uniqueTasks = allTasks.filter((task, index, self) => 
        index === self.findIndex((t) => t.id === task.id)
      );

      // Remove duplicate users (same user ID)
      const uniqueUsers = allUsers.filter((user, index, self) => 
        index === self.findIndex((u) => u.id === user.id)
      );

      // Load current workspace teams for "My Teams" section
      const currentWorkspaceTeams = await TeamService.getUserTeams(user.uid, currentWorkspace!.id);
      const teamsWithDetails = currentWorkspaceTeams.map(({ team, role }) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        memberCount: 0,
        role: role,
        branchId: team.branchId,
        regionId: team.regionId,
        leadId: team.leadId,
        createdAt: team.createdAt
      }));

      // Get pending reports count
      const pendingReports = await ReportService.getPendingReports(currentWorkspace.id, { limit: 100 });
      
      // Get activity statistics
      const activityStats = await ActivityService.getActivityStats(currentWorkspace.id);
      
      // Load recent activity
      const recentActivity = await generateEnhancedRecentActivity(uniqueTasks.slice(0, 5), allReports.slice(0, 3));
      
      // Calculate activity score based on various metrics
      const activityScore = calculateActivityScore(uniqueTasks, allReports, activityStats);

      setUserTeams(teamsWithDetails);
      setAllWorkspacesData({
        workspaces: allWorkspaces,
        totalUsers: uniqueUsers.length,
        workspaceStats: workspaceStats
      });
      setAllReports(allReports);

      // Calculate completed tasks
      const completedTasks = uniqueTasks.filter(task => task.status === 'completed').length;
      const totalFiles = allFolders.reduce((sum, folder) => sum + (folder.fileCount || 0), 0);

      setStats({
        totalTasks: uniqueTasks.length,
        completedTasks: completedTasks,
        allWorkspacesTasks: uniqueTasks.length,
        allWorkspacesTeams: uniqueTeams.length,
        activeTeams: teamsWithDetails.length,
        pendingReports: pendingReports.length,
        totalFiles: totalFiles,
        totalFolders: allFolders.length,
        activityScore: activityScore,
        weeklyProgress: calculateWeeklyProgress(uniqueTasks),
        recentActivity: recentActivity,
        upcomingDeadlines: generateUpcomingDeadlines(uniqueTasks.filter(t => t.dueDate)),
        notifications: []
      });

    } catch (error) {
      console.error('❌ Error loading owner dashboard data:', error);
    }
  }, [user, currentWorkspace, generateEnhancedRecentActivity]);

  const loadAdminDashboardData = useCallback(async () => {
    if (!user || !currentWorkspace) return;

    try {
      // First get all workspaces where user has access
      const userWorkspaces = await WorkspaceService.getUserWorkspaces(user.uid);
      // Filter to only workspaces where user is specifically an admin (not owner or member)
      const adminWorkspaces = userWorkspaces.filter(uw => uw.role === 'admin');
      
      // Load cross-workspace reports ONLY from admin workspaces
      let allPendingReports: any[] = [];
      let allReports: any[] = [];
      
      for (const uw of adminWorkspaces) {
        try {
          const workspacePendingReports = await ReportService.getPendingReports(uw.workspace.id, { limit: 100 });
          const workspaceAllReports = await ReportService.getWorkspaceReports(uw.workspace.id, { limit: 100 });
          
          // Add workspace name to reports for better tracking
          const pendingWithWorkspace = workspacePendingReports.map(r => ({
            ...r,
            workspaceName: uw.workspace.name,
            workspaceId: uw.workspace.id
          }));
          const allWithWorkspace = workspaceAllReports.map(r => ({
            ...r,
            workspaceName: uw.workspace.name,
            workspaceId: uw.workspace.id
          }));
          
          allPendingReports = [...allPendingReports, ...pendingWithWorkspace];
          allReports = [...allReports, ...allWithWorkspace];
        } catch (error) {
          console.error(`❌ Error loading reports from admin workspace ${uw.workspace.name}:`, error);
        }
      }
      


      // Load current workspace data for other metrics
      const [workspaceTeams, workspaceTasks, workspaceUsers, workspaceFolders] = await Promise.all([
        TeamService.getWorkspaceTeams(currentWorkspace.id),
        TaskService.getWorkspaceTasks(currentWorkspace.id),
        WorkspaceService.getWorkspaceUsers(currentWorkspace.id),
        FolderService.getFoldersForUser(user.uid, currentWorkspace.id, 'admin')
      ]);

      // Load user's teams
      const userTeamsData = await TeamService.getUserTeams(user.uid, currentWorkspace!.id);
      const teamsWithDetails = userTeamsData.map(({ team, role }) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        memberCount: 0,
        role: role,
        branchId: team.branchId,
        regionId: team.regionId,
        leadId: team.leadId,
        createdAt: team.createdAt
      }));

      setUserTeams(teamsWithDetails);
      setAllReports(allReports); // Admin now sees cross-workspace reports

      // Filter tasks that members are doing (exclude admin's own tasks for this specific view)
      const memberTasks = workspaceTasks.filter(task => {
        const taskOwner = workspaceUsers.find(wu => wu.user.id === task.assigneeId || wu.user.id === task.createdBy);
        return taskOwner && taskOwner.role === 'member';
      });

      const completedMemberTasks = memberTasks.filter(task => task.status === 'completed').length;
      
      // Get activity statistics
      const activityStats = await ActivityService.getActivityStats(currentWorkspace.id);
      
      // Load recent activity
      const recentActivity = await generateEnhancedRecentActivity(workspaceTasks.slice(0, 5), allReports.slice(0, 3));
      
      // Calculate activity score
      const activityScore = calculateActivityScore(workspaceTasks, allReports, activityStats);
      
      const totalFiles = workspaceFolders.reduce((sum, folder) => sum + (folder.fileCount || 0), 0);

      setStats({
        totalTasks: memberTasks.length,
        completedTasks: completedMemberTasks,
        activeTeams: teamsWithDetails.length,
        pendingReports: allPendingReports.length, // Now shows cross-workspace pending reports
        totalFiles: totalFiles,
        totalFolders: workspaceFolders.length,
        activityScore: activityScore,
        weeklyProgress: calculateWeeklyProgress(workspaceTasks),
        recentActivity: recentActivity,
        upcomingDeadlines: generateUpcomingDeadlines(workspaceTasks.filter(t => t.dueDate)),
        notifications: []
      });

    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
    }
  }, [user, currentWorkspace, generateEnhancedRecentActivity]);

  const loadMemberDashboardData = useCallback(async () => {
    if (!user || !currentWorkspace) return;

    try {
      // Load user's assigned tasks and created tasks
      const [userAssignedTasks, userCreatedTasks, userTeamsData, userReports, userFolders] = await Promise.all([
        TaskService.getUserAssignedTasks(user.uid, currentWorkspace.id),
        TaskService.getUserCreatedTasks(user.uid, currentWorkspace.id),
        TeamService.getUserTeams(user.uid, currentWorkspace.id),
        ReportService.getUserReports(currentWorkspace.id, user.uid, { limit: 50 }),
        FolderService.getFoldersForUser(user.uid, currentWorkspace.id, 'member')
      ]);

      // Combine assigned and created tasks (remove duplicates)
      const allUserTasks = [...userAssignedTasks];
      userCreatedTasks.forEach(task => {
        if (!allUserTasks.find(t => t.id === task.id)) {
          allUserTasks.push(task);
        }
      });

      // Load team tasks for teams user belongs to
      let teamTasks: any[] = [];
      for (const { team } of userTeamsData) {
        try {
          const allWorkspaceTasks = await TaskService.getWorkspaceTasks(currentWorkspace.id);
          const currentTeamTasks = allWorkspaceTasks.filter(task => {
            // Tasks where team members are involved or tasks in projects related to this team
            return task.assigneeId && userTeamsData.some(ut => 
              ut.team.id === team.id
            );
          });
          teamTasks.push(...currentTeamTasks);
        } catch (error) {
          console.warn(`Error loading tasks for team ${team.name}:`, error);
        }
      }

      // Remove duplicate team tasks
      teamTasks = teamTasks.filter((task, index, self) => 
        index === self.findIndex((t) => t.id === task.id)
      );

      const teamsWithDetails = userTeamsData.map(({ team, role }) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        memberCount: 0,
        role: role,
        branchId: team.branchId,
        regionId: team.regionId,
        leadId: team.leadId,
        createdAt: team.createdAt
      }));

      setUserTeams(teamsWithDetails);
      setAllReports(userReports);

      const completedTasks = allUserTasks.filter(task => task.status === 'completed').length;
      
      // Get activity statistics for member
      const activityStats = await ActivityService.getActivityStats(currentWorkspace.id);
      
      // Load recent activity
      const recentActivity = await generateEnhancedRecentActivity(allUserTasks.slice(0, 5), userReports.slice(0, 3));
      
      // Calculate activity score
      const activityScore = calculateActivityScore(allUserTasks, userReports, activityStats);
      
      const totalFiles = userFolders.reduce((sum, folder) => sum + (folder.fileCount || 0), 0);
      const pendingUserReports = userReports.filter(report => report.status === 'submitted').length;

      setStats({
        totalTasks: allUserTasks.length,
        completedTasks: completedTasks,
        activeTeams: teamsWithDetails.length,
        pendingReports: pendingUserReports,
        totalFiles: totalFiles,
        totalFolders: userFolders.length,
        activityScore: activityScore,
        weeklyProgress: calculateWeeklyProgress(allUserTasks),
        recentActivity: recentActivity,
        upcomingDeadlines: generateUpcomingDeadlines(allUserTasks.filter(t => t.dueDate)),
        notifications: []
      });

    } catch (error) {
      console.error('Error loading member dashboard data:', error);
    }
  }, [user, currentWorkspace, generateEnhancedRecentActivity]);

  const loadGuestDashboardData = useCallback(async () => {
    if (!user || !currentWorkspace) return;

    try {
      // Get guest data
      const guestData = await GuestService.getGuestData(user.uid);
      if (!guestData) {
        // Create sample data for guest
        await GuestService.createSampleGuestData(user.uid);
      }

      // Get sample workspace data for guest
      const sampleData = GuestService.getSampleWorkspaceData();
      
      setUserTeams(sampleData.teams);
      setAllReports(sampleData.reports);

      const completedTasks = sampleData.tasks.filter(task => task.status === 'completed').length;
      const totalFiles = 0; // Guest users don't have files
      const pendingReports = sampleData.reports.filter(report => report.status === 'draft').length;

      setStats({
        totalTasks: sampleData.tasks.length,
        completedTasks: completedTasks,
        activeTeams: sampleData.teams.length,
        pendingReports: pendingReports,
        totalFiles: totalFiles,
        totalFolders: 0,
        activityScore: 75, // Sample activity score for guest
        weeklyProgress: 25, // Sample progress for guest
        recentActivity: [
          {
            id: 'guest-activity-1',
            type: 'task' as const,
            message: 'Welcome Task was created',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            user: 'Guest User',
            priority: 'medium'
          },
          {
            id: 'guest-activity-2',
            type: 'report' as const,
            message: 'Sample Report was created',
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            user: 'Guest User',
            priority: 'medium'
          }
        ],
        upcomingDeadlines: sampleData.tasks
          .filter(task => task.dueDate && new Date(task.dueDate) > new Date())
          .slice(0, 3)
          .map(task => ({
            id: task.id,
            title: task.title,
            type: 'task' as const,
            dueDate: new Date(task.dueDate),
            priority: (task.priority === 'urgent' ? 'high' : task.priority as 'high' | 'medium' | 'low') || 'medium'
          })),
        notifications: []
      });

    } catch (error) {
      console.error('Error loading guest dashboard data:', error);
    }
  }, [user, currentWorkspace]);

  // Helper function to calculate average response time from recent activities
  const calculateAvgResponseTime = (activities: any[]): string => {
    if (activities.length === 0) return "0h";
    
    // For now, we'll estimate based on activity frequency
    // In a real implementation, you'd track actual response times
    const recentActivities = activities.slice(0, 20);
    const hoursPerActivity = recentActivities.length > 10 ? 1.5 : 3.0;
    const avgHours = Math.max(0.1, Math.random() * hoursPerActivity + 0.5);
    return avgHours < 1 ? `${Math.round(avgHours * 60)}m` : `${avgHours.toFixed(1)}h`;
  };

  // Helper function to calculate reports submitted this week
  const getReportsThisWeek = (reports: any[]): number => {
    const now = new Date();
    const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
    
    const thisWeekReports = reports.filter(report => {
      const submittedAt = report.submittedAt?.toDate ? report.submittedAt.toDate() : new Date(report.submittedAt);
      return submittedAt && submittedAt >= weekStart;
    });
    
    return thisWeekReports.length;
  };

  // Helper function to calculate approval rate
  const calculateApprovalRate = (reports: any[]): number => {
    const submittedReports = reports.filter(report => report.status && report.status !== 'draft');
    if (submittedReports.length === 0) {
      return 0;
    }
    
    const approvedReports = submittedReports.filter(report => 
      report.status === 'approved' || report.status === 'completed'
    ).length;
    
    const approvalRate = Math.round((approvedReports / submittedReports.length) * 100);
    return approvalRate;
  };

  // Helper function to estimate active users from recent activity
  const getActiveUsersToday = (activities: any[]): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const uniqueUsers = new Set();
    activities.forEach(activity => {
      const activityDate = activity.timestamp?.toDate ? activity.timestamp.toDate() : new Date(activity.timestamp);
      if (activityDate >= today && activity.userId) {
        uniqueUsers.add(activity.userId);
      }
    });
    
    return uniqueUsers.size;
  };

  // Helper function to calculate file storage used (estimated)
  const calculateStorageUsed = (files: number): string => {
    if (files === 0) return "0 MB";
    
    // Estimate average file size and calculate total
    const avgFileSizeMB = 2.5; // Estimated average file size
    const totalMB = files * avgFileSizeMB;
    
    if (totalMB < 1024) {
      return `${Math.round(totalMB)} MB`;
    } else {
      return `${(totalMB / 1024).toFixed(1)} GB`;
    }
  };

  // Helper function to calculate recent uploads (last 7 days)
  const getRecentUploads = (activities: any[]): number => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return activities.filter(activity => {
      const activityDate = activity.timestamp?.toDate ? activity.timestamp.toDate() : new Date(activity.timestamp);
      return activityDate >= weekAgo && 
             (activity.type === 'folder_created' || activity.type === 'report_created' || activity.type === 'task_created');
    }).length;
  };

  // Helper function to calculate system uptime (simulated)
  const calculateSystemUptime = (): string => {
    // In a real implementation, this would come from monitoring services
    // For now, we'll simulate based on recent activity
    const uptimePercentage = Math.random() * 2 + 98; // 98-100%
    return `${uptimePercentage.toFixed(1)}%`;
  };

  // Helper function to calculate team efficiency
  const calculateTeamEfficiency = (teamIndex: number, tasks: any[]): number => {
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const baseEfficiency = (completedTasks / tasks.length) * 100;
    
    // Add some variation based on team index
    const variation = (teamIndex % 3) * 5;
    return Math.min(100, Math.max(0, Math.round(baseEfficiency + variation)));
  };

  const calculateActivityScore = (tasks: any[], reports: any[], activityStats: any) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Tasks completed this week
    const recentCompletedTasks = tasks.filter(task => 
      task.status === 'completed' && 
      new Date(task.updatedAt) > weekAgo
    ).length;
    
    // Reports submitted this week
    const recentReports = reports.filter(report => 
      new Date(report.createdAt) > weekAgo
    ).length;
    
    // Base score calculation
    let score = Math.min(100, (recentCompletedTasks * 15) + (recentReports * 10) + (activityStats?.thisWeek || 0));
    
    // Add bonus for consistency
    if (recentCompletedTasks > 0 && recentReports > 0) {
      score += 10;
    }
    
    return Math.round(score);
  };

  const calculateWeeklyProgress = (tasks: any[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const thisWeekCompleted = tasks.filter(task => 
      task.status === 'completed' && 
      new Date(task.updatedAt) > weekAgo
    ).length;
    
    const lastWeekCompleted = tasks.filter(task => 
      task.status === 'completed' && 
      new Date(task.updatedAt) > twoWeeksAgo && 
      new Date(task.updatedAt) <= weekAgo
    ).length;
    
    if (lastWeekCompleted === 0) return thisWeekCompleted > 0 ? 100 : 0;
    
    const percentageChange = ((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100;
    return Math.max(-100, Math.min(100, Math.round(percentageChange)));
  };

  const generateUpcomingDeadlines = (tasksWithDueDate: any[]) => {
    return tasksWithDueDate
      .filter(task => task.dueDate > new Date())
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 3)
      .map(task => ({
        id: task.id,
        title: task.title,
        type: 'task' as const,
        dueDate: task.dueDate,
        priority: task.priority || 'medium'
      }));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const completionPercentage = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  // Get display stats based on view mode
  const getDisplayStats = () => {
    // Owners with global view show cross-workspace stats from owned workspaces
    if (userRole === 'owner' && globalView) {
      return {
        totalTasks: stats.allWorkspacesTasks || 0,
        completedTasks: stats.completedTasks,
        activeTeams: stats.allWorkspacesTeams || 0,
        viewLabel: 'Global View'
      };
    }
    // Admins show current workspace stats (tasks are workspace-specific for admins)
    // but reports are cross-workspace from admin workspaces only
    return {
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      activeTeams: stats.activeTeams,
      viewLabel: userRole === 'admin' ? 'Admin Workspaces View' : 'Current Workspace'
    };
  };

  const getDisplayReports = () => {
    // Owners with global view get cross-workspace reports from ALL owned workspaces
    if (userRole === 'owner' && globalView) {
      return allReports; // Show all reports from all owned workspaces
    }
    // Admins get cross-workspace reports ONLY from workspaces where they are admin
    if (userRole === 'admin') {
      return allReports; // Show reports from admin workspaces only
    }
    // Default: current workspace only
    const currentReports = allReports.filter(r => r.workspaceId === currentWorkspace?.id || !r.workspaceId);
    return currentReports;
  };

  const getDisplayPendingReports = () => {
    const reports = getDisplayReports();
    const pendingReports = reports.filter(report => 
      report.status === 'submitted' || report.status === 'under_review' || report.status === 'pending'
    );
    return pendingReports.length;
  };

  const displayStats = getDisplayStats();
  const displayCompletionPercentage = displayStats.totalTasks > 0 ? (displayStats.completedTasks / displayStats.totalTasks) * 100 : 0;
  const displayReports = getDisplayReports();

  const getTaskProgressLabel = () => {
    if (userRole === 'owner') {
      if (globalView) return 'Global Tasks Progress';
      return 'Tasks Progress (Current Workspace)';
    }
    if (userRole === 'admin') return 'Tasks Progress (Member Tasks)';
    return 'Tasks Progress (My Tasks)';
  };

  const getTeamsLabel = () => {
    if (userRole === 'owner') return 'Teams you\'re part of';
    return 'Teams you\'re part of';
  };

  const loadDashboardData = useCallback(async () => {
    if (!currentWorkspace || !user) return;

    try {
      setLoading(true);

      // Load role-specific data
      if (isGuest || isGuestWorkspace) {
        await loadGuestDashboardData();
      } else if (userRole === 'owner') {
        await loadOwnerDashboardData();
      } else if (userRole === 'admin') {
        await loadAdminDashboardData();
      } else {
        await loadMemberDashboardData();
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty data on error
      setUserTeams([]);
      setStats(prev => ({
        ...prev,
        activeTeams: 0
      }));
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, user, userRole, isGuest, isGuestWorkspace, loadOwnerDashboardData, loadAdminDashboardData, loadMemberDashboardData, loadGuestDashboardData]);

  useEffect(() => {
    if (currentWorkspace && user) {
      loadDashboardData();
    }
  }, [currentWorkspace, user, userRole, loadDashboardData]);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {getGreeting()}, {userProfile?.isGuest ? 'Guest User' : userProfile?.name || 'there'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome to {currentWorkspace?.name} • Your role: {' '}
            {isGuest ? (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-400 dark:border-blue-800">
                <User className="w-3 h-3 mr-1" />
                Guest
              </span>
            ) : userRole === 'owner' ? (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200 dark:from-yellow-900/20 dark:to-amber-900/20 dark:text-yellow-400 dark:border-yellow-800">
                <Crown className="w-3 h-3 mr-1" />
                Owner
              </span>
            ) : userRole === 'admin' ? (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-400 dark:border-blue-800">
                <UserCheck className="w-3 h-3 mr-1" />
                Admin
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200 dark:from-gray-800 dark:to-slate-800 dark:text-gray-300 dark:border-gray-700">
                <User className="w-3 h-3 mr-1" />
                Member
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => router.push('/dashboard/calendar')} className="w-full sm:w-auto">
            <Calendar className="h-4 w-4 mr-2" />
            View Calendar
          </Button>
        </div>
      </div>

      {/* Guest-specific notice */}
      {isGuest && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground mb-1 text-sm sm:text-base">Guest Mode</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                You&apos;re exploring the application as a guest. This is a demo environment with sample data. 
                Create an account to save your work and access all features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">{getTaskProgressLabel()}</CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl sm:text-2xl font-bold">{displayStats.completedTasks}/{displayStats.totalTasks}</div>
            <Progress value={displayCompletionPercentage} className="mt-2 sm:mt-3" />
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
              {Math.round(displayCompletionPercentage)}% completed
              {userRole === 'owner' && (
                <span className="ml-1 hidden sm:inline">({displayStats.viewLabel})</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Reports</CardTitle>
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl sm:text-2xl font-bold">{getDisplayPendingReports()}</div>
            <p className="text-xs text-muted-foreground">
              {getDisplayPendingReports() > 0 ? 'Reports due soon' : 'All caught up!'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Teams</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="space-y-2">
                <div className="h-6 sm:h-8 w-10 sm:w-12 bg-muted rounded animate-pulse" />
                <div className="h-3 w-20 sm:w-24 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold">{displayStats.activeTeams}</div>
                <p className="text-xs text-muted-foreground">
                  {userRole === 'owner' && globalView ? 'Global teams' : getTeamsLabel()}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Activity Score</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl sm:text-2xl font-bold">{stats.activityScore}</div>
            <p className="text-xs text-muted-foreground">
              {stats.weeklyProgress >= 0 ? '+' : ''}{stats.weeklyProgress}% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Files</CardTitle>
            <Folder className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl sm:text-2xl font-bold">{stats.totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.totalFolders} folders
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Weekly Progress</CardTitle>
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl sm:text-2xl font-bold flex items-center">
              {stats.weeklyProgress >= 0 ? '+' : ''}{stats.weeklyProgress}%
              {stats.weeklyProgress >= 0 ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 text-green-500 flex-shrink-0" />
              ) : (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 text-red-500 rotate-180 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              vs last week
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Upcoming Deadlines</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl sm:text-2xl font-bold">{stats.upcomingDeadlines.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingDeadlines.length > 0 ? 'Tasks due soon' : 'No urgent deadlines'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl sm:text-2xl font-bold">{stats.recentActivity.length}</div>
            <p className="text-xs text-muted-foreground">
              Actions this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Owner-specific stats */}
      {userRole === 'owner' && (
        <>
          {/* Global/Current Workspace Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold">Workspace Management</h2>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {globalView ? 'Viewing all workspaces' : `Viewing ${currentWorkspace?.name}`}
              </p>
            </div>
            <div className="flex items-center w-full sm:w-auto">
              <div className="flex items-center space-x-1 sm:space-x-2 bg-background border rounded-lg p-1 w-full sm:w-auto">
                <Button
                  variant={!globalView ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setGlobalView(false)}
                  className="text-xs flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">Current Workspace</span>
                  <span className="sm:hidden">Current</span>
                </Button>
                <Button
                  variant={globalView ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setGlobalView(true)}
                  className="text-xs flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">All Workspaces</span>
                  <span className="sm:hidden">All</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Cross-workspace Overview Cards */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="card-interactive border-l-4 border-l-yellow-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
                  <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-yellow-600 flex-shrink-0" />
                  <span className="truncate">Total Workspaces</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-xl sm:text-2xl font-bold">{allWorkspacesData.workspaces.length}</div>
                <p className="text-xs text-muted-foreground">
                  {allWorkspacesData.workspaces.filter(w => w.workspaceType === 'main').length} main, {' '}
                  {allWorkspacesData.workspaces.filter(w => w.workspaceType === 'sub').length} sub-workspaces
                </p>
              </CardContent>
            </Card>

            <Card className="card-interactive border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-600" />
                  Global Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.allWorkspacesTeams || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across all workspaces
                </p>
              </CardContent>
            </Card>

            <Card className="card-interactive border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Target className="h-4 w-4 mr-2 text-green-600" />
                  Global Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.allWorkspacesTasks || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedTasks} completed
                </p>
              </CardContent>
            </Card>

            <Card className="card-interactive border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <UserCheck className="h-4 w-4 mr-2 text-purple-600" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allWorkspacesData.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  System-wide users
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Workspace Details Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Workspace Overview</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard/workspaces')}
                  className="text-xs"
                >
                  Manage All
                </Button>
              </CardTitle>
              <CardDescription>
                Detailed breakdown of all your workspaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allWorkspacesData.workspaces.map((workspace) => {
                  const stats = allWorkspacesData.workspaceStats[workspace.id] || { tasks: 0, teams: 0, users: 0, reports: 0 };
                  const isCurrentWorkspace = workspace.id === currentWorkspace?.id;
                  const isSwitching = switchingWorkspace === workspace.id;
                  
                  return (
                    <div 
                      key={workspace.id} 
                      className={`p-4 rounded-lg border transition-colors ${
                        isSwitching 
                          ? 'border-primary bg-primary/10 opacity-70 cursor-wait' 
                          : isCurrentWorkspace 
                            ? 'border-primary bg-primary/5 cursor-default' 
                            : 'border-border hover:bg-accent/50 cursor-pointer'
                      }`}
                      onClick={async () => {
                        if (switchingWorkspace || isCurrentWorkspace) return; // Prevent multiple clicks or clicking current workspace
                        
                        try {
                          setSwitchingWorkspace(workspace.id);
                          toast({
                            title: "Switching workspace",
                            description: `Loading ${workspace.name}...`,
                          });
                          await switchToWorkspace(workspace.id);
                          // Refresh the dashboard data after switching
                          await loadDashboardData();
                          toast({
                            title: "Workspace switched",
                            description: `Successfully switched to ${workspace.name}`,
                          });
                        } catch (error) {
                          console.error('Error switching workspace:', error);
                          toast({
                            title: "Error",
                            description: "Failed to switch workspace. Please try again.",
                            variant: "destructive",
                          });
                        } finally {
                          setSwitchingWorkspace(null);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={`text-sm font-semibold ${
                              workspace.workspaceType === 'main' 
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}>
                              {workspace.name?.[0]?.toUpperCase() || 'W'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-sm">{workspace.name}</h3>
                              {isSwitching && (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              )}
                              {isCurrentWorkspace && (
                                <Badge variant="outline" className="text-xs">Current</Badge>
                              )}
                              <Badge 
                                variant={workspace.workspaceType === 'main' ? 'default' : 'secondary'} 
                                className="text-xs"
                              >
                                {workspace.workspaceType}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {workspace.description || `${workspace.workspaceType} workspace`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">{stats.tasks}</div>
                            <div className="text-xs text-muted-foreground">Tasks</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-600">{stats.teams}</div>
                            <div className="text-xs text-muted-foreground">Teams</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-purple-600">{stats.users}</div>
                            <div className="text-xs text-muted-foreground">Users</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-orange-600">{stats.reports}</div>
                            <div className="text-xs text-muted-foreground">Reports</div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {allWorkspacesData.workspaces.length === 0 && (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No workspaces found
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cross-workspace Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Cross-Workspace Actions</CardTitle>
              <CardDescription>
                Manage multiple workspaces efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-primary/5 transition-colors"
                  onClick={() => router.push('/dashboard/workspaces')} // Create workspace functionality should be in workspaces page
                >
                  <Plus className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Create Workspace</span>
                  <span className="text-xs text-muted-foreground">Add new workspace</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-primary/5 transition-colors"
                  onClick={() => router.push('/dashboard/teams')} // Global teams view via teams page
                >
                  <Users className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Global Teams</span>
                  <span className="text-xs text-muted-foreground">View all teams</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-primary/5 transition-colors"
                  onClick={() => router.push('/dashboard/tasks')} // Global tasks view via tasks page
                >
                  <Target className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Global Tasks</span>
                  <span className="text-xs text-muted-foreground">View all tasks</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-primary/5 transition-colors"
                  onClick={() => router.push('/dashboard/analytics')} // System analytics via analytics page
                >
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">System Analytics</span>
                  <span className="text-xs text-muted-foreground">Global insights</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* My Teams, Recent Activity, Upcoming Deadlines */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* My Teams */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>My Teams</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard/teams')}
                className="text-xs"
              >
                View All
              </Button>
            </CardTitle>
            <CardDescription>
              Teams you&apos;re part of
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              // Loading skeleton
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-5 w-12 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </>
            ) : userTeams.length > 0 ? (
              userTeams.map((team) => (
                <div 
                  key={team.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => router.push('/dashboard/teams')}
                >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {team.name?.[0]?.toUpperCase() || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.description ? 
                          (team.description.length > 30 ? 
                            `${team.description.substring(0, 30)}...` : 
                            team.description
                          ) : 
                          `${team.memberCount || 0} members`
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {team.role}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No teams assigned yet
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-xs"
                  onClick={() => router.push('/dashboard/teams')}
                >
                  Browse Teams
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard/activity')}
                className="text-xs"
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className={`flex items-start space-x-3 p-3 rounded-lg border-l-4 ${
                activity.priority === 'high' ? 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10' :
                activity.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' :
                'border-l-green-500 bg-green-50/50 dark:bg-green-900/10'
              }`}>
                <div className={`p-2 rounded-full ${
                  activity.type === 'task' ? 'bg-green-100 dark:bg-green-900/20' :
                  activity.type === 'report' ? 'bg-orange-100 dark:bg-orange-900/20' :
                  activity.type === 'file' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  'bg-purple-100 dark:bg-purple-900/20'
                }`}>
                  {activity.type === 'task' && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
                  {activity.type === 'file' && <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  {activity.type === 'user' && <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                  {activity.type === 'report' && <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                      {activity.user && ` • ${activity.user}`}
                    </p>
                    {activity.priority && (
                      <Badge 
                        variant={activity.priority === 'high' ? 'destructive' : activity.priority === 'medium' ? 'default' : 'secondary'} 
                        className="text-xs"
                      >
                        {activity.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {stats.recentActivity.length === 0 && (
              <div className="text-center py-6">
                <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No recent activity
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete tasks or submit reports to see activity here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Upcoming Deadlines</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-1 bg-orange-100 rounded">
                    {deadline.type === 'task' ? 
                      <Target className="h-3 w-3 text-orange-600" /> : 
                      <FileText className="h-3 w-3 text-orange-600" />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-sm">{deadline.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {deadline.dueDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={getPriorityColor(deadline.priority) as any} className="text-xs">
                  {deadline.priority}
                </Badge>
              </div>
            ))}
            {stats.upcomingDeadlines.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming deadlines
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <Button 
          variant="outline" 
          className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:bg-primary/5 transition-colors min-h-[80px] sm:min-h-[100px]"
          onClick={() => router.push('/dashboard/tasks')}
        >
          <Target className="h-4 w-4 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-center">View Tasks</span>
          <span className="text-xs text-muted-foreground text-center hidden sm:block">Manage your tasks</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:bg-primary/5 transition-colors min-h-[80px] sm:min-h-[100px]"
          onClick={() => router.push('/dashboard/reports')}
        >
          <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-center">Reports</span>
          <span className="text-xs text-muted-foreground text-center hidden sm:block">View & submit reports</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:bg-primary/5 transition-colors min-h-[80px] sm:min-h-[100px]"
          onClick={() => router.push('/dashboard/folders')}
        >
          <Folder className="h-4 w-4 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-center">Files</span>
          <span className="text-xs text-muted-foreground text-center hidden sm:block">Access documents</span>
        </Button>
        
        {(userRole === 'owner' || userRole === 'admin') && (
          <Button 
            variant="outline" 
            className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:bg-primary/5 transition-colors min-h-[80px] sm:min-h-[100px]"
            onClick={() => router.push('/dashboard/analytics')}
          >
            <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-center">Analytics</span>
            <span className="text-xs text-muted-foreground text-center hidden sm:block">Insights & metrics</span>
          </Button>
        )}

        {/* Add Calendar action for all users */}
        <Button 
          variant="outline" 
          className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:bg-primary/5 transition-colors min-h-[80px] sm:min-h-[100px]"
          onClick={() => router.push('/dashboard/calendar')}
        >
          <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-center">Calendar</span>
          <span className="text-xs text-muted-foreground text-center hidden sm:block">View schedule</span>
        </Button>
      </div>

      {/* Analytics Section */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold">Analytics & Insights</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Performance metrics and data trends</p>
          </div>
          {(userRole === 'owner' || userRole === 'admin') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard/analytics')}
              className="w-full sm:w-auto"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="hidden sm:inline">Full Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </Button>
          )}
        </div>

        {/* Performance Metrics Row */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="card-interactive">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-600 flex-shrink-0" />
                <span className="truncate">Completion Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {Math.round(completionPercentage)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.completedTasks} of {stats.totalTasks} tasks completed
              </p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{Math.round(completionPercentage)}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-interactive">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-600 flex-shrink-0" />
                <span className="truncate">Avg Response Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{calculateAvgResponseTime(stats.recentActivity)}</div>
              <p className="text-xs text-muted-foreground">
                Average task response time
              </p>
              <p className="text-xs text-green-600 mt-1">
                ↓ 15% from last week
              </p>
            </CardContent>
          </Card>

          <Card className="card-interactive">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-purple-600 flex-shrink-0" />
                <span className="truncate">Team Engagement</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">
                {stats.activityScore}%
              </div>
              <p className="text-xs text-muted-foreground">
                Based on recent activity
              </p>
              <p className="text-xs text-green-600 mt-1">
                ↑ {Math.abs(stats.weeklyProgress)}% from last week
              </p>
            </CardContent>
          </Card>

          <Card className="card-interactive">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-600 flex-shrink-0" />
                <span className="truncate">Goal Achievement</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{Math.round(completionPercentage)}%</div>
              <p className="text-xs text-muted-foreground">
                Task completion rate
              </p>
              <p className="text-xs text-green-600 mt-1">
                {stats.weeklyProgress >= 0 ? '↑' : '↓'} {Math.abs(stats.weeklyProgress)}% from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Task Completion Trend */}
          <Card className="card-interactive">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Task Completion Trend
              </CardTitle>
              <CardDescription>
                Weekly task completion over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 w-full bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-3">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  {stats.totalTasks === 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        No tasks available yet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Create tasks to see completion trends
                      </p>
                    </>
                  ) : stats.completedTasks === 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Chart visualization
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalTasks} total tasks, none completed yet
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Chart visualization would go here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.completedTasks} of {stats.totalTasks} tasks completed ({Math.round(completionPercentage)}%)
                      </p>
                      <div className="w-32 mx-auto">
                        <Progress value={completionPercentage} className="h-2" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Performance */}
          <Card className="card-interactive">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Team Performance
              </CardTitle>
              <CardDescription>
                {userRole === 'owner' ? 'All teams' : 'Your teams'} productivity breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userTeams.slice(0, 4).map((team, index) => (
                  <div key={team.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {team.name?.[0]?.toUpperCase() || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.role} role
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        {calculateTeamEfficiency(index, stats.recentActivity)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        efficiency
                      </p>
                    </div>
                  </div>
                ))}
                {userTeams.length === 0 && (
                  <div className="text-center py-6">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No team data available
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {userRole === 'owner' ? 'Create teams or join existing ones' : 'Ask admin to add you to a team'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* File Activity */}
          <Card className="card-interactive">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <Folder className="h-5 w-5 mr-2" />
                File Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Files</span>
                <span className="font-medium">{stats.totalFiles}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Folders</span>
                <span className="font-medium">{stats.totalFolders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Recent Uploads</span>
                <span className="font-medium text-green-600">+{getRecentUploads(stats.recentActivity)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Storage Used</span>
                <span className="font-medium">{calculateStorageUsed(stats.totalFiles)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Report Analytics */}
          <Card className="card-interactive">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Report Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending Reports</span>
                <span className="font-medium text-orange-600">{getDisplayPendingReports()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Submitted This Week</span>
                <span className="font-medium text-green-600">{getReportsThisWeek(displayReports)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg. Response Time</span>
                <span className="font-medium">{calculateAvgResponseTime(displayReports)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Approval Rate</span>
                <span className="font-medium text-green-600">{calculateApprovalRate(displayReports)}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="card-interactive">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.upcomingDeadlines.length > 0 ? (
                stats.upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="flex items-center justify-between p-2 bg-accent/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{deadline.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {deadline.dueDate.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={getPriorityColor(deadline.priority) as any} className="text-xs">
                      {deadline.priority}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No upcoming deadlines
                  </p>
                </div>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => router.push('/dashboard/calendar')}
              >
                View Full Calendar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Owner-specific Advanced Analytics */}
        {userRole === 'owner' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="card-interactive">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Workspace Overview
                </CardTitle>
                <CardDescription>
                  System-wide performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                      {allWorkspacesData.workspaces.length}
                    </div>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      Total Workspaces
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      {stats.allWorkspacesTeams || 0}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-500">
                      Total Teams
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-lg font-bold text-green-700 dark:text-green-400">
                      {allWorkspacesData.totalUsers}
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-500">
                      Total Users
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-lg font-bold text-purple-700 dark:text-purple-400">
                      {stats.allWorkspacesTasks || 0}
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-500">
                      Total Tasks
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-interactive">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  System Health
                </CardTitle>
                <CardDescription>
                  Overall system performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Overall Activity Score</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={stats.activityScore} className="w-16 h-2" />
                    <span className="font-medium text-green-600">{stats.activityScore}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">System Uptime</span>
                  <span className="font-medium text-green-600">{calculateSystemUptime()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Users (24h)</span>
                  <span className="font-medium">{Math.floor(allWorkspacesData.totalUsers * 0.7)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Data Sync Status</span>
                  <span className="font-medium text-green-600">Synchronized</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
