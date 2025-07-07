// =============================================================================
// MAIN AI DATA SERVICE (Orchestrates all AI data operations)
// =============================================================================

// Import all service types
import type {
  DepartmentInsights,
  OrganizationRecommendation,
  CollaborationMetrics,
  TeamFormationSuggestion,
  MentorshipMatch,
  PersonalMetrics,
  ReportInsights,
  UserActivity,
  TeamInsights,
  WorkspaceAnalytics,
  CalendarInsights
} from './ai-types/ai-interfaces';

// Import all services
import { DepartmentService } from './ai-services/department-service';
import { TeamMentorshipService } from './ai-services/team-mentorship-service';
import { PersonalReportService } from './ai-services/personal-report-service';
import { AnalyticsService } from './ai-services/analytics-service';
import { CalendarAIService } from './ai-services/calendar-ai-service';

/**
 * Main AI Data Service that provides a unified interface to all AI functionality
 * This service delegates to specialized services and maintains backward compatibility
 */
export class AIDataService {
  // =============================================================================
  // DEPARTMENT & ORGANIZATION METHODS
  // =============================================================================

  static async getDepartmentInsights(workspaceId: string, userId: string): Promise<DepartmentInsights[]> {
    return DepartmentService.getDepartmentInsights(workspaceId, userId);
  }

  static async getOrganizationRecommendations(workspaceId: string, userId: string): Promise<OrganizationRecommendation[]> {
    return DepartmentService.getOrganizationRecommendations(workspaceId, userId);
  }

  static async getCollaborationMetrics(workspaceId: string, userId: string): Promise<CollaborationMetrics> {
    return DepartmentService.getCollaborationMetrics(workspaceId, userId);
  }

  // =============================================================================
  // TEAM & MENTORSHIP METHODS
  // =============================================================================

  static async getTeamFormationSuggestions(workspaceId: string, userId: string): Promise<TeamFormationSuggestion[]> {
    return TeamMentorshipService.getTeamFormationSuggestions(workspaceId, userId);
  }

  static async getMentorshipMatches(workspaceId: string, userId: string): Promise<MentorshipMatch[]> {
    return TeamMentorshipService.getMentorshipMatches(workspaceId, userId);
  }

  // =============================================================================
  // PERSONAL & REPORT METHODS
  // =============================================================================

  static async getPersonalMetrics(workspaceId: string, userId: string): Promise<PersonalMetrics> {
    return PersonalReportService.getPersonalMetrics(workspaceId, userId);
  }

  static async getReportInsights(workspaceId: string, userId: string): Promise<ReportInsights> {
    return PersonalReportService.getReportInsights(workspaceId, userId);
  }

  // =============================================================================
  // ANALYTICS METHODS (Used by analytics dashboard)
  // =============================================================================

  static async getUserActivityData(userId: string, workspaceId: string): Promise<UserActivity[]> {
    return AnalyticsService.getUserActivityData(userId, workspaceId);
  }

  static async getTeamInsights(userId: string, workspaceId: string): Promise<TeamInsights> {
    // Get departments first, then pass to analytics service
    const departments = await this.getDepartmentInsights(workspaceId, userId);
    return AnalyticsService.getTeamInsights(userId, workspaceId, departments);
  }

  static async getWorkspaceAnalytics(userId: string, workspaceId: string): Promise<WorkspaceAnalytics> {
    // Get departments first, then pass to analytics service
    const departments = await this.getDepartmentInsights(workspaceId, userId);
    
    // For owners, use cross-workspace analytics to get accurate user counts from all managed workspaces
    return AnalyticsService.getCrossWorkspaceAnalytics(userId, workspaceId, departments);
  }

  static async getAdminWorkspaceAnalytics(userId: string, workspaceId: string): Promise<WorkspaceAnalytics> {
    // Get departments first, then pass to analytics service
    const departments = await this.getDepartmentInsights(workspaceId, userId);
    
    // For admins, use single workspace analytics (not cross-workspace like owners)
    return AnalyticsService.getWorkspaceAnalytics(userId, workspaceId, departments);
  }

  static async getDepartmentPerformance(userId: string, workspaceId: string) {
    // Get departments first, then pass to analytics service
    const departments = await this.getDepartmentInsights(workspaceId, userId);
    return AnalyticsService.getDepartmentPerformance(userId, workspaceId, departments);
  }

  // =============================================================================
  // CALENDAR METHODS
  // =============================================================================

  static async getCalendarInsights(userId: string, workspaceId: string): Promise<CalendarInsights> {
    return CalendarAIService.getCalendarInsights(userId, workspaceId);
  }
}

// Export all types for backward compatibility
export type {
  DepartmentInsights,
  OrganizationRecommendation,
  CollaborationMetrics,
  TeamFormationSuggestion,
  MentorshipMatch,
  PersonalMetrics,
  ReportInsights,
  UserActivity,
  TeamInsights,
  WorkspaceAnalytics,
  CalendarInsights
} from './ai-types/ai-interfaces';