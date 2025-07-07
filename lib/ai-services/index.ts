// =============================================================================
// AI SERVICES INDEX (Convenient exports for all AI services)
// =============================================================================

// Main service (backward compatible)
export { AIDataService } from '../ai-data-service';

// Specialized services (for direct use when needed)
export { DepartmentService } from './department-service';
export { TeamMentorshipService } from './team-mentorship-service';
export { PersonalReportService } from './personal-report-service';
export { AnalyticsService } from './analytics-service';
export { MockDataService } from './mock-data-service';

// All types
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
  SkillCoverage
} from '../ai-types/ai-interfaces';
