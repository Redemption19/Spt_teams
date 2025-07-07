import type {
  DepartmentInsights,
  OrganizationRecommendation,
  TeamFormationSuggestion,
  MentorshipMatch,
  CollaborationMetrics,
  PersonalMetrics,
  ReportInsights,
  TeamInsights,
  WorkspaceAnalytics
} from '../ai-types/ai-interfaces';

// =============================================================================
// MOCK DATA SERVICE (Fallbacks when Firestore is unavailable)
// =============================================================================

export class MockDataService {
  static getMockDepartmentInsights(): DepartmentInsights[] {
    console.log('📝 Using mock department insights');
    return [
      {
        id: 'dept-1',
        name: 'Engineering',
        memberCount: 12,
        headId: 'user-1',
        headName: 'John Smith',
        efficiency: 87,
        collaborationScore: 78,
        activeProjects: 5,
        completedTasks: 145,
        status: 'active',
        recentActivity: [],
        skillsCoverage: [
          { skill: 'Frontend Development', coverage: 'excellent', departmentCount: 3 },
          { skill: 'Backend Development', coverage: 'good', departmentCount: 2 }
        ],
        recommendations: [
          'Consider hiring a mobile developer',
          'Increase cross-team collaboration sessions'
        ]
      },
      {
        id: 'dept-2',
        name: 'Design',
        memberCount: 8,
        headId: 'user-2',
        headName: 'Jane Doe',
        efficiency: 92,
        collaborationScore: 95,
        activeProjects: 3,
        completedTasks: 98,
        status: 'active',
        recentActivity: [],
        skillsCoverage: [
          { skill: 'UI/UX Design', coverage: 'excellent', departmentCount: 2 }
        ],
        recommendations: [
          'Excellent collaboration - consider mentoring other departments'
        ]
      }
    ];
  }

  static getMockOrganizationRecommendations(): OrganizationRecommendation[] {
    console.log('📝 Using mock organization recommendations');
    return [
      {
        id: 'rec-1',
        title: 'Cross-Department Integration',
        description: 'Implement regular cross-department meetings to improve communication',
        type: 'optimization',
        priority: 'high',
        currentIssues: ['Limited communication between departments'],
        recommendations: ['Schedule weekly cross-department sync meetings'],
        suggestedChanges: [
          {
            change: 'Implement weekly cross-department standup meetings',
            reason: 'Current communication gaps are causing project delays and duplicate work',
            impact: 'Improved project coordination and 20% reduction in delivery timeline'
          },
          {
            change: 'Create shared project documentation system',
            reason: 'Teams are working with outdated or inconsistent information',
            impact: 'Better knowledge sharing and reduced miscommunication'
          },
          {
            change: 'Establish cross-functional project teams',
            reason: 'Siloed work approach is limiting innovation and efficiency',
            impact: 'Enhanced collaboration and faster problem-solving'
          }
        ],
        complexity: 'medium',
        expectedBenefit: 'Reduced project timeline by 15-20%',
        timeline: '2-3 months',
        affectedDepartments: ['Engineering', 'Design']
      }
    ];
  }

  static getMockTeamFormationSuggestions(): TeamFormationSuggestion[] {
    console.log('📝 Using mock team formation suggestions');
    return [
      {
        id: 'suggestion-1',
        title: 'Cross-Functional Product Team',
        description: 'Form a dedicated product team with members from Engineering, Design, and Marketing',
        suggestedMembers: ['john.smith', 'jane.doe', 'mike.johnson'],
        expectedOutcome: 'Faster product development and improved feature quality',
        confidence: 85,
        implementation: 'medium',
        expectedImpact: '30% faster feature delivery and improved product quality',
        timeline: '2-4 weeks',
        risk: 'Medium - requires coordination across departments',
        suggestedChanges: [
          {
            change: 'Create dedicated workspace for cross-functional team',
            reason: 'Co-location improves communication and collaboration',
            impact: 'Reduced meeting overhead and faster decision making'
          },
          {
            change: 'Implement daily standups with all team members',
            reason: 'Regular sync ensures alignment and identifies blockers early',
            impact: 'Better coordination and 20% faster issue resolution'
          }
        ]
      },
      {
        id: 'suggestion-2',
        title: 'Mobile Development Specialist Team',
        description: 'Form a specialized mobile team to focus on iOS and Android development',
        suggestedMembers: ['sarah.wilson', 'alex.brown', 'lisa.chen'],
        expectedOutcome: 'Dedicated mobile expertise and faster mobile feature development',
        confidence: 78,
        implementation: 'high',
        expectedImpact: '40% improvement in mobile release cycle',
        timeline: '3-6 weeks',
        risk: 'Low - leverages existing mobile expertise',
        suggestedChanges: [
          {
            change: 'Establish mobile-first development practices',
            reason: 'Mobile traffic now represents 60% of user engagement',
            impact: 'Better mobile user experience and retention'
          }
        ]
      }
    ];
  }

  static getMockMentorshipMatches(): MentorshipMatch[] {
    console.log('📝 Using mock mentorship matches');
    return [
      {
        id: 'match-1',
        mentorId: 'user-1',
        mentorName: 'John Smith',
        menteeId: 'user-3',
        menteeName: 'Alice Johnson',
        compatibilityScore: 85,
        compatibility: 85,
        mentorRole: 'Senior Developer',
        menteeRole: 'Junior Developer',
        focusAreas: ['JavaScript', 'React', 'Code Review', 'Career Development'],
        sharedSkills: ['JavaScript', 'React', 'Node.js'],
        mentorshipAreas: ['Frontend Architecture', 'Code Review'],
        suggestedActivities: ['Weekly code reviews', 'Pair programming sessions'],
        expectedOutcome: 'Improved technical skills and career advancement'
      },
      {
        id: 'match-2',
        mentorId: 'user-2',
        mentorName: 'Sarah Wilson',
        menteeId: 'user-4',
        menteeName: 'Bob Chen',
        compatibilityScore: 78,
        compatibility: 78,
        mentorRole: 'Tech Lead',
        menteeRole: 'Mid-level Developer',
        focusAreas: ['System Design', 'Leadership', 'Architecture'],
        sharedSkills: ['Python', 'AWS', 'Docker'],
        mentorshipAreas: ['System Design', 'Leadership Skills'],
        suggestedActivities: ['Architecture reviews', 'Leadership workshops'],
        expectedOutcome: 'Enhanced leadership capabilities and system design skills'
      }
    ];
  }

  static getMockCollaborationMetrics(): CollaborationMetrics {
    console.log('📝 Using mock collaboration metrics');
    return {
      crossTeamCommunication: 73,
      knowledgeSharing: 68,
      decisionMakingSpeed: 82,
      responseTime: 75,
      meetingEfficiency: 71,
      documentCollaboration: 79
    };
  }

  static getMockPersonalMetrics(): PersonalMetrics {
    console.log('📝 Using mock personal metrics');
    return {
      productivity: 85,
      completionRate: 92,
      collaborationScore: 78,
      skillGrowth: 15,
      recentAchievements: [
        { title: 'Project Alpha Completion', date: '2024-01-15', impact: 'high' }
      ],
      upcomingTasks: [
        { title: 'Code Review for Beta Release', dueDate: '2024-01-25', priority: 'high' }
      ],
      recommendations: ['Consider taking on more mentoring responsibilities']
    };
  }

  static getMockReportInsights(): ReportInsights {
    console.log('📝 Using mock report insights');
    return {
      performanceMetrics: [
        { name: 'Team Productivity', value: 85, trend: 'up', change: '+12%' },
        { name: 'Project Completion Rate', value: 92, trend: 'stable', change: '+2%' }
      ],
      generatedReports: [
        { title: 'Weekly Team Performance', date: '2024-01-15', type: 'performance' }
      ],
      draftSuggestions: [
        {
          id: 'draft-1',
          title: 'Weekly Team Performance Report',
          description: 'Comprehensive analysis of team productivity and key achievements',
          priority: 'high',
          sections: ['Executive Summary', 'Performance Metrics', 'Key Achievements', 'Recommendations'],
          estimatedTime: '10 minutes',
          type: 'performance'
        },
        {
          id: 'draft-2', 
          title: 'Project Status Update',
          description: 'Current status of active projects and upcoming milestones',
          priority: 'medium',
          sections: ['Project Overview', 'Progress Status', 'Upcoming Milestones', 'Risk Assessment'],
          estimatedTime: '8 minutes',
          type: 'project'
        },
        {
          id: 'draft-3',
          title: 'Department Collaboration Analysis',
          description: 'Analysis of cross-department collaboration and improvement opportunities',
          priority: 'low',
          sections: ['Collaboration Metrics', 'Communication Patterns', 'Improvement Suggestions'],
          estimatedTime: '12 minutes',
          type: 'analysis'
        }
      ],
      trendAnalysis: [
        {
          metric: 'Productivity Trend',
          direction: 'increasing',
          change: '+12%',
          period: 'Last 30 days',
          confidence: 85,
          prediction: 'Team productivity is expected to continue increasing',
          impact: 'high'
        }
      ],
      recommendedTemplates: ['Weekly Report', 'Monthly Summary'],
      exportOptions: ['PDF', 'Excel'],
      scheduledReports: [],
      dataQuality: 94
    };
  }

  static getMockTeamInsights(): TeamInsights {
    console.log('📝 Using mock team insights');
    return {
      memberCount: 25,
      activeMembers: 22,
      teamPerformance: 87,
      teamCollaborationScore: 82,
      bottlenecks: ['Code review process', 'Resource allocation'],
      completionRate: 89
    };
  }

  static getMockWorkspaceAnalytics(): WorkspaceAnalytics {
    console.log('📝 Using mock workspace analytics');
    return {
      totalUsers: 45,
      activeUsers: 38,
      totalProjects: 12,
      completionRate: 86,
      growthRate: 22,
      resourceUtilization: 78
    };
  }
}
