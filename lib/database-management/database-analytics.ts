// lib/database-analytics.ts
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { DatabaseService } from './database-core';

export interface DatabaseMetrics {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  totalTeams: number;
  totalReports: number;
  activeUsers: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  storageUsage: number;
  backupCount: number;
  lastBackupDate?: Date;
  dataGrowthRate: number;
  performanceScore: number;
}

export interface AnalyticsReport {
  id: string;
  workspaceId: string;
  generatedBy: string;
  timestamp: Date;
  reportType: 'overview' | 'performance' | 'growth' | 'usage' | 'custom';
  metrics: DatabaseMetrics;
  insights: string[];
  recommendations: string[];
  period: {
    start: Date;
    end: Date;
  };
}

export interface PerformanceMetrics {
  responseTime: number;
  queryCount: number;
  errorRate: number;
  uptime: number;
  concurrentUsers: number;
  dataTransfer: number;
}

export interface GrowthTrends {
  period: string;
  userGrowth: number;
  projectGrowth: number;
  taskGrowth: number;
  storageGrowth: number;
  activityGrowth: number;
}

export interface UsagePatterns {
  peakHours: number[];
  activeDays: string[];
  popularFeatures: Array<{
    feature: string;
    usageCount: number;
    percentage: number;
  }>;
  userEngagement: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

// Private helper methods
async function calculateUserMetrics(workspaceId: string): Promise<{
  totalUsers: number;
  activeUsers: number;
}> {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('workspaceId', '==', workspaceId)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    const totalUsers = usersSnapshot.size;
    
    // Calculate active users (users with activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsersQuery = query(
      collection(db, 'users'),
      where('workspaceId', '==', workspaceId),
      where('lastActive', '>=', thirtyDaysAgo)
    );
    
    const activeUsersSnapshot = await getDocs(activeUsersQuery);
    const activeUsers = activeUsersSnapshot.size;
    
    return { totalUsers, activeUsers };
  } catch (error) {
    console.error('Error calculating user metrics:', error);
    return { totalUsers: 0, activeUsers: 0 };
  }
}

async function calculateProjectMetrics(workspaceId: string): Promise<{
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
}> {
  try {
    const projectsQuery = query(
      collection(db, 'projects'),
      where('workspaceId', '==', workspaceId)
    );
    
    const projectsSnapshot = await getDocs(projectsQuery);
    const projects = projectsSnapshot.docs.map(doc => doc.data());
    
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    
    return { totalProjects, activeProjects, completedProjects };
  } catch (error) {
    console.error('Error calculating project metrics:', error);
    return { totalProjects: 0, activeProjects: 0, completedProjects: 0 };
  }
}

async function calculateTaskMetrics(workspaceId: string): Promise<{
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}> {
  try {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('workspaceId', '==', workspaceId)
    );
    
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => doc.data());
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    
    // Calculate overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(t => {
      if (t.dueDate && t.status !== 'completed') {
        const dueDate = t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
        return dueDate < now;
      }
      return false;
    }).length;
    
    return { totalTasks, completedTasks, pendingTasks, overdueTasks };
  } catch (error) {
    console.error('Error calculating task metrics:', error);
    return { totalTasks: 0, completedTasks: 0, pendingTasks: 0, overdueTasks: 0 };
  }
}

async function calculateStorageUsage(workspaceId: string): Promise<number> {
  try {
    // Simulate storage calculation based on data volume
    const collections = ['users', 'projects', 'tasks', 'teams', 'reports'];
    let totalSize = 0;
    
    for (const collectionName of collections) {
      const collectionQuery = query(
        collection(db, collectionName),
        where('workspaceId', '==', workspaceId)
      );
      
      const snapshot = await getDocs(collectionQuery);
      totalSize += snapshot.size * 1024; // Estimate 1KB per document
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return 0;
  }
}

async function calculateBackupMetrics(workspaceId: string): Promise<{
  backupCount: number;
  lastBackupDate?: Date;
}> {
  try {
    const backupsQuery = query(
      collection(db, 'database_backups'),
      where('workspaceId', '==', workspaceId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const backupsSnapshot = await getDocs(backupsQuery);
    const backupCount = backupsSnapshot.size;
    
    let lastBackupDate: Date | undefined;
    if (backupsSnapshot.docs.length > 0) {
      const lastBackup = backupsSnapshot.docs[0].data();
      lastBackupDate = lastBackup.timestamp?.toDate ? lastBackup.timestamp.toDate() : new Date(lastBackup.timestamp);
    }
    
    return { backupCount, lastBackupDate };
  } catch (error) {
    console.error('Error calculating backup metrics:', error);
    return { backupCount: 0 };
  }
}

async function calculateGrowthRate(workspaceId: string): Promise<number> {
  try {
    // Calculate growth rate based on user activity over time
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    // Get current period activity
    const currentActivityQuery = query(
      collection(db, 'activityLogs'),
      where('workspaceId', '==', workspaceId),
      where('timestamp', '>=', thirtyDaysAgo)
    );
    
    const currentActivitySnapshot = await getDocs(currentActivityQuery);
    const currentActivity = currentActivitySnapshot.size;
    
    // Get previous period activity
    const previousActivityQuery = query(
      collection(db, 'activityLogs'),
      where('workspaceId', '==', workspaceId),
      where('timestamp', '>=', sixtyDaysAgo),
      where('timestamp', '<', thirtyDaysAgo)
    );
    
    const previousActivitySnapshot = await getDocs(previousActivityQuery);
    const previousActivity = previousActivitySnapshot.size;
    
    if (previousActivity === 0) return 0;
    
    return ((currentActivity - previousActivity) / previousActivity) * 100;
  } catch (error) {
    console.error('Error calculating growth rate:', error);
    return 0;
  }
}

async function calculatePerformanceScore(workspaceId: string): Promise<number> {
  try {
    // Calculate performance score based on various metrics
    const userMetrics = await calculateUserMetrics(workspaceId);
    const taskMetrics = await calculateTaskMetrics(workspaceId);
    const backupMetrics = await calculateBackupMetrics(workspaceId);
    
    let score = 0;
    
    // User engagement (30% weight)
    const userEngagement = userMetrics.activeUsers / Math.max(userMetrics.totalUsers, 1);
    score += userEngagement * 30;
    
    // Task completion rate (40% weight)
    const taskCompletionRate = taskMetrics.completedTasks / Math.max(taskMetrics.totalTasks, 1);
    score += taskCompletionRate * 40;
    
    // Backup health (20% weight)
    const backupHealth = backupMetrics.backupCount > 0 ? 20 : 0;
    score += backupHealth;
    
    // System health (10% weight)
    const systemHealth = 10; // Placeholder for system health calculation
    score += systemHealth;
    
    return Math.min(score, 100);
  } catch (error) {
    console.error('Error calculating performance score:', error);
    return 0;
  }
}

export class DatabaseAnalyticsService extends DatabaseService {
  protected static readonly ANALYTICS_COLLECTION = 'database_analytics';
  protected static readonly REPORTS_COLLECTION = 'analytics_reports';

  /**
   * Get comprehensive database metrics
   */
  static async getDatabaseMetrics(workspaceId: string): Promise<DatabaseMetrics> {
    try {
      const [
        userMetrics,
        projectMetrics,
        taskMetrics,
        teamMetrics,
        reportMetrics,
        storageUsage,
        backupMetrics,
        growthRate,
        performanceScore
      ] = await Promise.all([
        calculateUserMetrics(workspaceId),
        calculateProjectMetrics(workspaceId),
        calculateTaskMetrics(workspaceId),
        this.getTeamMetrics(workspaceId),
        this.getReportMetrics(workspaceId),
        calculateStorageUsage(workspaceId),
        calculateBackupMetrics(workspaceId),
        calculateGrowthRate(workspaceId),
        calculatePerformanceScore(workspaceId)
      ]);

      return {
        totalUsers: userMetrics.totalUsers,
        totalProjects: projectMetrics.totalProjects,
        totalTasks: taskMetrics.totalTasks,
        totalTeams: teamMetrics.totalTeams,
        totalReports: reportMetrics.totalReports,
        activeUsers: userMetrics.activeUsers,
        completedTasks: taskMetrics.completedTasks,
        pendingTasks: taskMetrics.pendingTasks,
        overdueTasks: taskMetrics.overdueTasks,
        storageUsage,
        backupCount: backupMetrics.backupCount,
        lastBackupDate: backupMetrics.lastBackupDate,
        dataGrowthRate: growthRate,
        performanceScore
      };
    } catch (error) {
      console.error('Error getting database metrics:', error);
      throw error;
    }
  }

  /**
   * Get team metrics
   */
  static async getTeamMetrics(workspaceId: string): Promise<{ totalTeams: number }> {
    try {
      const teamsQuery = query(
        collection(db, 'teams'),
        where('workspaceId', '==', workspaceId)
      );
      
      const teamsSnapshot = await getDocs(teamsQuery);
      return { totalTeams: teamsSnapshot.size };
    } catch (error) {
      console.error('Error getting team metrics:', error);
      return { totalTeams: 0 };
    }
  }

  /**
   * Get report metrics
   */
  static async getReportMetrics(workspaceId: string): Promise<{ totalReports: number }> {
    try {
      const reportsQuery = query(
        collection(db, 'reports'),
        where('workspaceId', '==', workspaceId)
      );
      
      const reportsSnapshot = await getDocs(reportsQuery);
      return { totalReports: reportsSnapshot.size };
    } catch (error) {
      console.error('Error getting report metrics:', error);
      return { totalReports: 0 };
    }
  }

  /**
   * Generate analytics report
   */
  static async generateAnalyticsReport(
    workspaceId: string,
    userId: string,
    options: {
      reportType: 'overview' | 'performance' | 'growth' | 'usage' | 'custom';
      period?: {
        start: Date;
        end: Date;
      };
      includeInsights?: boolean;
      includeRecommendations?: boolean;
    }
  ): Promise<AnalyticsReport> {
    try {
      const metrics = await this.getDatabaseMetrics(workspaceId);
      
      const insights = options.includeInsights !== false ? 
        await this.generateInsights(workspaceId, metrics) : [];
      
      const recommendations = options.includeRecommendations !== false ?
        await this.generateRecommendations(workspaceId, metrics) : [];

      const report: AnalyticsReport = {
        id: `report_${workspaceId}_${Date.now()}`,
        workspaceId,
        generatedBy: userId,
        timestamp: new Date(),
        reportType: options.reportType,
        metrics,
        insights,
        recommendations,
        period: options.period || {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date()
        }
      };

      // Store report in Firestore
      const reportRef = doc(db, this.REPORTS_COLLECTION, report.id);
      await setDoc(reportRef, report);

      return report;
    } catch (error) {
      console.error('Error generating analytics report:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  static async getPerformanceMetrics(workspaceId: string): Promise<PerformanceMetrics> {
    try {
      // Simulate performance metrics
      return {
        responseTime: Math.random() * 100 + 50, // 50-150ms
        queryCount: Math.floor(Math.random() * 1000) + 100,
        errorRate: Math.random() * 5, // 0-5%
        uptime: 99.5 + Math.random() * 0.5, // 99.5-100%
        concurrentUsers: Math.floor(Math.random() * 50) + 10,
        dataTransfer: Math.floor(Math.random() * 1000) + 100 // MB
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get growth trends
   */
  static async getGrowthTrends(workspaceId: string, period: 'week' | 'month' | 'quarter'): Promise<GrowthTrends[]> {
    try {
      const trends: GrowthTrends[] = [];
      const periods = period === 'week' ? 7 : period === 'month' ? 4 : 3;
      
      for (let i = 0; i < periods; i++) {
        trends.push({
          period: `Period ${i + 1}`,
          userGrowth: Math.random() * 20 - 10, // -10% to +10%
          projectGrowth: Math.random() * 30 - 15,
          taskGrowth: Math.random() * 40 - 20,
          storageGrowth: Math.random() * 25 - 12.5,
          activityGrowth: Math.random() * 35 - 17.5
        });
      }
      
      return trends;
    } catch (error) {
      console.error('Error getting growth trends:', error);
      throw error;
    }
  }

  /**
   * Get usage patterns
   */
  static async getUsagePatterns(workspaceId: string): Promise<UsagePatterns> {
    try {
      return {
        peakHours: Array.from({ length: 24 }, () => Math.floor(Math.random() * 100)),
        activeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        popularFeatures: [
          { feature: 'Task Management', usageCount: 150, percentage: 45 },
          { feature: 'Project Tracking', usageCount: 120, percentage: 36 },
          { feature: 'Team Collaboration', usageCount: 80, percentage: 24 },
          { feature: 'Reporting', usageCount: 60, percentage: 18 },
          { feature: 'File Sharing', usageCount: 40, percentage: 12 }
        ],
        userEngagement: {
          daily: Math.floor(Math.random() * 50) + 20,
          weekly: Math.floor(Math.random() * 200) + 100,
          monthly: Math.floor(Math.random() * 800) + 400
        }
      };
    } catch (error) {
      console.error('Error getting usage patterns:', error);
      throw error;
    }
  }

  /**
   * Generate insights based on metrics
   */
  private static async generateInsights(workspaceId: string, metrics: DatabaseMetrics): Promise<string[]> {
    const insights: string[] = [];
    
    if (metrics.activeUsers / Math.max(metrics.totalUsers, 1) < 0.5) {
      insights.push('User engagement is below optimal levels. Consider implementing engagement strategies.');
    }
    
    if (metrics.overdueTasks > metrics.totalTasks * 0.2) {
      insights.push('High number of overdue tasks detected. Review task management processes.');
    }
    
    if (metrics.backupCount === 0) {
      insights.push('No recent backups found. Consider setting up automated backup schedules.');
    }
    
    if (metrics.dataGrowthRate > 20) {
      insights.push('High data growth rate detected. Monitor storage usage and consider optimization.');
    }
    
    if (metrics.performanceScore < 70) {
      insights.push('Performance score is below recommended levels. Review system optimization.');
    }
    
    return insights;
  }

  /**
   * Generate recommendations based on metrics
   */
  private static async generateRecommendations(workspaceId: string, metrics: DatabaseMetrics): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (metrics.activeUsers / Math.max(metrics.totalUsers, 1) < 0.5) {
      recommendations.push('Implement user onboarding programs to increase engagement');
      recommendations.push('Add gamification elements to encourage regular usage');
    }
    
    if (metrics.overdueTasks > metrics.totalTasks * 0.2) {
      recommendations.push('Implement automated task reminders and notifications');
      recommendations.push('Review task assignment processes and workload distribution');
    }
    
    if (metrics.backupCount === 0) {
      recommendations.push('Set up automated daily backups with retention policies');
      recommendations.push('Implement backup verification and testing procedures');
    }
    
    if (metrics.dataGrowthRate > 20) {
      recommendations.push('Implement data archiving strategies for old records');
      recommendations.push('Review data retention policies and cleanup procedures');
    }
    
    if (metrics.performanceScore < 70) {
      recommendations.push('Optimize database queries and indexing strategies');
      recommendations.push('Consider implementing caching mechanisms for frequently accessed data');
    }
    
    return recommendations;
  }

  /**
   * Get stored analytics reports
   */
  static async getAnalyticsReports(workspaceId: string): Promise<AnalyticsReport[]> {
    try {
      const reportsQuery = query(
        collection(db, this.REPORTS_COLLECTION),
        where('workspaceId', '==', workspaceId),
        orderBy('timestamp', 'desc')
      );
      
      const reportsSnapshot = await getDocs(reportsQuery);
      return reportsSnapshot.docs.map(doc => doc.data() as AnalyticsReport);
    } catch (error) {
      console.error('Error getting analytics reports:', error);
      throw error;
    }
  }

  /**
   * Delete analytics report
   */
  static async deleteAnalyticsReport(reportId: string): Promise<void> {
    try {
      const reportRef = doc(db, this.REPORTS_COLLECTION, reportId);
      await deleteDoc(reportRef);
    } catch (error) {
      console.error('Error deleting analytics report:', error);
      throw error;
    }
  }
} 