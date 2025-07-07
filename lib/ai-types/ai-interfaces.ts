// =============================================================================
// AI ASSISTANT TYPE DEFINITIONS
// =============================================================================

export interface UserActivity {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface DepartmentInsights {
  id: string;
  name: string;
  memberCount: number;
  headId?: string;
  headName?: string;
  efficiency: number;
  collaborationScore: number;
  activeProjects: number;
  completedTasks: number;
  status: 'active' | 'inactive';
  recentActivity: UserActivity[];
  skillsCoverage: SkillCoverage[];
  recommendations: string[];
}

export interface SkillCoverage {
  skill: string;
  coverage: 'excellent' | 'good' | 'limited' | 'minimal';
  departmentCount: number;
}

export interface OrganizationRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'structure' | 'expansion' | 'optimization' | 'merger';
  priority: 'high' | 'medium' | 'low';
  currentIssues: string[];
  recommendations: string[];
  suggestedChanges: Array<{
    change: string;
    reason: string;
    impact: string;
  }>;
  expectedBenefit: string;
  complexity: 'low' | 'medium' | 'high';
  estimatedCost?: string;
  timeline?: string;
  affectedDepartments: string[];
}

export interface CollaborationMetrics {
  crossTeamCommunication: number;
  knowledgeSharing: number;
  decisionMakingSpeed: number;
  responseTime: number;
  meetingEfficiency: number;
  documentCollaboration: number;
}

export interface TeamFormationSuggestion {
  id: string;
  title: string;
  description: string;
  suggestedMembers: string[];
  expectedOutcome: string;
  confidence: number;
  implementation: 'low' | 'medium' | 'high';
  expectedImpact?: string;
  timeline?: string;
  risk?: string;
  suggestedChanges?: Array<{
    change: string;
    reason: string;
    impact: string;
  }>;
}

export interface MentorshipMatch {
  id: string;
  mentorId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  compatibilityScore: number;
  compatibility?: number; // Alternative property name used in UI
  mentorRole?: string;
  menteeRole?: string;
  focusAreas?: string[];
  sharedSkills: string[];
  mentorshipAreas: string[];
  suggestedActivities: string[];
  expectedOutcome: string;
}

export interface PersonalMetrics {
  productivity: number;
  completionRate: number;
  collaborationScore: number;
  skillGrowth: number;
  recentAchievements: Array<{
    title: string;
    date: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  upcomingTasks: Array<{
    title: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
}

export interface ReportInsights {
  performanceMetrics: Array<{
    name: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
    change: string;
  }>;
  generatedReports: Array<{
    title: string;
    date: string;
    type: string;
  }>;
  draftSuggestions: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    sections: string[];
    estimatedTime?: string;
    type?: string;
  }>;
  trendAnalysis: Array<{
    metric: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    change: string;
    period: string;
    confidence: number;
    prediction: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  recommendedTemplates: string[];
  exportOptions: string[];
  scheduledReports: any[];
  dataQuality: number;
}

export interface TeamInsights {
  memberCount: number;
  activeMembers: number;
  teamPerformance: number;
  teamCollaborationScore: number;
  bottlenecks: string[];
  completionRate: number;
}

export interface WorkspaceAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  completionRate: number;
  growthRate: number;
  resourceUtilization: number;
}

export interface CalendarInsights {
  upcomingEvents: Array<{
    id: string;
    title: string;
    start: Date;
    type: string;
    priority: string;
  }>;
  conflictingMeetings: Array<{
    id: string;
    title: string;
    conflictWith: string;
    start: Date;
    end: Date;
  }>;
  calendarUtilization: number;
  freeTimeSlots: Array<{
    start: Date;
    end: Date;
    duration: number; // in minutes
  }>;
  suggestedMeetingTimes: MeetingSuggestion[];
  weeklyMeetingCount: number;
  averageMeetingDuration: number;
  mostActiveDay: string;
  leastActiveDay: string;
}

export interface MeetingSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'Executive' | 'Team Meeting' | 'One-on-One' | 'Training' | 'Review' | 'Planning';
  suggestedTime: Date;
  duration: number; // in minutes
  priority: 'high' | 'medium' | 'low';
  attendees: string[];
  location?: string;
  reason: string;
  confidence: number;
}
