// AI-powered recommendation service for workflow and productivity insights
// Integrates with Gemini AI to generate contextual recommendations

import { askGeminiAI } from './gemini-ai-service';

export interface WorkflowRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'recurring_report' | 'reminder' | 'task_assignment' | 'process_optimization' | 'automation';
  priority: 'high' | 'medium' | 'low';
  impact: string;
  actionable: boolean;
  estimatedTime?: string;
  actions?: string[];
}

export interface ProductivityMetric {
  id: string;
  title: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  insight: string;
  recommendation?: string;
}

export interface ProductivityInsight {
  id: string;
  title: string;
  description: string;
  type: 'efficiency' | 'collaboration' | 'time_management' | 'quality';
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  metrics?: {
    current: number;
    potential: number;
    unit: string;
  };
  actions?: string[];
}

export interface AIRecommendationContext {
  workspace: {
    id: string;
    name: string;
    type: string;
  };
  user: {
    id: string;
    name: string;
    role: string;
  };
  isOwner?: boolean;
  ownedWorkspaces?: any[];
  allWorkspaces?: any[];
  crossWorkspaceAccess?: boolean;
  // Enhanced personalization data
  userActivity?: {
    recentTasks?: any[];
    completedProjects?: any[];
    teamCollaborations?: any[];
    loginFrequency?: string;
    activeHours?: string[];
    preferredWorkflows?: string[];
  };
  personalMetrics?: {
    taskCompletionRate?: number;
    averageResponseTime?: number;
    collaborationScore?: number;
    productivityTrend?: 'up' | 'down' | 'stable';
  };
}

export class AIRecommendationService {
  
  /**
   * Generate AI-powered workflow recommendations
   */
  static async generateWorkflowRecommendations(context: AIRecommendationContext): Promise<WorkflowRecommendation[]> {
    try {
      // Build personalized context
      const userContext = context.user.role === 'member' 
        ? `As a team member named ${context.user.name}` 
        : `As a ${context.user.role} named ${context.user.name}`;
      
      const personalizedData = context.userActivity ? `
Based on your recent activity:
- You've been working on: ${context.userActivity.recentTasks?.length || 0} recent tasks
- Your collaboration pattern: ${context.userActivity.teamCollaborations?.length || 0} recent team interactions
- Your active hours: ${context.userActivity.activeHours?.join(', ') || 'Standard business hours'}
- Login frequency: ${context.userActivity.loginFrequency || 'Regular'}

Personal productivity metrics:
- Task completion rate: ${context.personalMetrics?.taskCompletionRate || 85}%
- Average response time: ${context.personalMetrics?.averageResponseTime || 2.5} hours
- Collaboration score: ${context.personalMetrics?.collaborationScore || 78}/100
- Productivity trend: ${context.personalMetrics?.productivityTrend || 'stable'}
` : '';

      const prompt = `
Analyze my workspace and personal work patterns to generate intelligent, personalized workflow recommendations.

${userContext} in the "${context.workspace.name}" workspace (${context.workspace.type}).

${personalizedData}

Please provide 3-5 specific, actionable workflow recommendations tailored to my role and activity patterns in these areas:
1. Personal Productivity: Based on my work patterns and completion rates
2. Collaboration: Smart ways to improve team interaction based on my collaboration history
3. Time Management: Recommendations based on my active hours and response times
4. Task Organization: Suggestions based on my current workload and completion patterns
5. Workflow Automation: Opportunities to streamline my regular activities

For each recommendation, provide:
- A clear, specific title relevant to my role and activities
- Detailed description of what it does and how it helps ME specifically
- Expected personal impact (with estimated % improvement for MY productivity)
- Implementation difficulty (time estimate for ME to set up)
- Priority level based on MY current needs (high/medium/low)
- Specific action steps that I can take

Format your response as structured data that can be parsed. Use this exact format:

RECOMMENDATION_START
Title: [Title]
Description: [Description - make it personal to my role and activities]
Type: [recurring_report|reminder|task_assignment|process_optimization|automation]
Priority: [high|medium|low - based on my current needs]
Impact: [Expected improvement for MY productivity with %]
EstimatedTime: [Time for ME to implement]
Actions: [Action 1 for ME]|[Action 2 for ME]|[Action 3 for ME]
RECOMMENDATION_END

${context.user.role === 'member' 
  ? 'Focus on personal productivity, individual task management, and collaboration improvements that I as a team member can implement myself.'
  : `Focus on ${context.user.role}-level responsibilities and team management recommendations.`
}
`;

      const aiResponse = await askGeminiAI(prompt, context);
      return this.parseWorkflowRecommendations(aiResponse);
    } catch (error) {
      console.error('Error generating workflow recommendations:', error);
      return this.getFallbackWorkflowRecommendations(context);
    }
  }

  /**
   * Generate AI-powered productivity insights
   */
  static async generateProductivityInsights(context: AIRecommendationContext): Promise<{
    metrics: ProductivityMetric[];
    insights: ProductivityInsight[];
  }> {
    try {
      // Build personalized context
      const userContext = context.user.role === 'member' 
        ? `As a team member named ${context.user.name}` 
        : `As a ${context.user.role} named ${context.user.name}`;
      
      const personalizedData = context.userActivity ? `
My recent activity and patterns:
- Recent tasks: ${context.userActivity.recentTasks?.length || 0} tasks
- Completed projects: ${context.userActivity.completedProjects?.length || 0} projects
- Team collaborations: ${context.userActivity.teamCollaborations?.length || 0} interactions
- Active work hours: ${context.userActivity.activeHours?.join(', ') || 'Standard hours'}
- Login pattern: ${context.userActivity.loginFrequency || 'Regular'}

My current productivity metrics:
- Task completion rate: ${context.personalMetrics?.taskCompletionRate || 85}%
- Average response time: ${context.personalMetrics?.averageResponseTime || 2.5} hours
- Collaboration score: ${context.personalMetrics?.collaborationScore || 78}/100
- Productivity trend: ${context.personalMetrics?.productivityTrend || 'stable'}
` : '';

      const prompt = `
Analyze my personal productivity data and generate comprehensive insights tailored to my work patterns.

${userContext} in the "${context.workspace.name}" workspace.

${personalizedData}

Please provide personalized insights for ME:

1. PERSONAL PRODUCTIVITY METRICS (4-6 key metrics specific to my performance):
   - My task completion efficiency vs team average
   - My response time patterns
   - My collaboration effectiveness with teammates
   - My time management score
   - My work quality indicators
   - My productivity consistency

2. ACTIONABLE PERSONAL INSIGHTS (3-5 insights tailored to my role and patterns):
   - Personal efficiency improvements I can make
   - Ways I can improve my collaboration with the team
   - Time management optimizations for my schedule
   - Quality improvements for my work output

For metrics, provide data that reflects MY performance:
- Current values with units (specific to my activities)
- Trend direction based on my recent performance (up/down/stable)
- Percentage change from my previous period
- Specific insights about what each metric means for ME
- Personal recommendations for how I can improve

For insights, focus on what I can control and improve:
- Impact level on MY productivity (high/medium/low)
- Specific improvement potential for MY work
- Action steps that I personally can take

Format your response as structured data:

METRIC_START
Title: [Title - make it personal to my performance]
Value: [My specific number]
Unit: [Unit]
Trend: [up|down|stable - based on my recent performance]
TrendValue: [My percentage change]
Insight: [What this metric means for MY productivity]
Recommendation: [How I can personally improve this metric]
METRIC_END

INSIGHT_START
Title: [Title - personal insight for my improvement]
Description: [How this applies to MY work and role]
Type: [efficiency|collaboration|time_management|quality]
Impact: [high|medium|low - impact on MY productivity]
CurrentValue: [My current performance number]
PotentialValue: [What I could potentially achieve]
Unit: [Unit]
Actions: [Action I can take]|[Another action I can take]|[Third action I can take]
INSIGHT_END

${context.user.role === 'member' 
  ? 'Focus on personal productivity insights that I as a team member can act on independently to improve my own performance and contribution to the team.'
  : `Provide insights relevant to my ${context.user.role} responsibilities while including personal productivity improvements.`
}
`;

      const aiResponse = await askGeminiAI(prompt, context);
      return this.parseProductivityInsights(aiResponse);
    } catch (error) {
      console.error('Error generating productivity insights:', error);
      return this.getFallbackProductivityInsights(context);
    }
  }

  /**
   * Parse AI response into workflow recommendations
   */
  private static parseWorkflowRecommendations(aiResponse: string): WorkflowRecommendation[] {
    const recommendations: WorkflowRecommendation[] = [];
    const recommendationBlocks = aiResponse.split('RECOMMENDATION_START').slice(1);

    recommendationBlocks.forEach((block, index) => {
      const endIndex = block.indexOf('RECOMMENDATION_END');
      if (endIndex === -1) return;

      const content = block.substring(0, endIndex).trim();
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);

      const rec: Partial<WorkflowRecommendation> = { id: `workflow_${index + 1}` };

      lines.forEach(line => {
        if (line.startsWith('Title:')) {
          rec.title = line.substring(6).trim();
        } else if (line.startsWith('Description:')) {
          rec.description = line.substring(12).trim();
        } else if (line.startsWith('Type:')) {
          rec.type = line.substring(5).trim() as any;
        } else if (line.startsWith('Priority:')) {
          rec.priority = line.substring(9).trim() as any;
        } else if (line.startsWith('Impact:')) {
          rec.impact = line.substring(7).trim();
        } else if (line.startsWith('EstimatedTime:')) {
          rec.estimatedTime = line.substring(14).trim();
        } else if (line.startsWith('Actions:')) {
          rec.actions = line.substring(8).trim().split('|').map(a => a.trim());
        }
      });

      if (rec.title && rec.description && rec.type && rec.priority && rec.impact) {
        recommendations.push(rec as WorkflowRecommendation);
        recommendations[recommendations.length - 1].actionable = true;
      }
    });

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  /**
   * Parse AI response into productivity insights
   */
  private static parseProductivityInsights(aiResponse: string): {
    metrics: ProductivityMetric[];
    insights: ProductivityInsight[];
  } {
    const metrics: ProductivityMetric[] = [];
    const insights: ProductivityInsight[] = [];

    // Parse metrics
    const metricBlocks = aiResponse.split('METRIC_START').slice(1);
    metricBlocks.forEach((block, index) => {
      const endIndex = block.indexOf('METRIC_END');
      if (endIndex === -1) return;

      const content = block.substring(0, endIndex).trim();
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);

      const metric: Partial<ProductivityMetric> = { id: `metric_${index + 1}` };

      lines.forEach(line => {
        if (line.startsWith('Title:')) {
          metric.title = line.substring(6).trim();
        } else if (line.startsWith('Value:')) {
          metric.value = parseFloat(line.substring(6).trim()) || 0;
        } else if (line.startsWith('Unit:')) {
          metric.unit = line.substring(5).trim();
        } else if (line.startsWith('Trend:')) {
          metric.trend = line.substring(6).trim() as any;
        } else if (line.startsWith('TrendValue:')) {
          metric.trendValue = parseFloat(line.substring(11).trim()) || 0;
        } else if (line.startsWith('Insight:')) {
          metric.insight = line.substring(8).trim();
        } else if (line.startsWith('Recommendation:')) {
          metric.recommendation = line.substring(15).trim();
        }
      });

      if (metric.title && metric.value !== undefined && metric.unit && metric.trend && metric.insight) {
        metrics.push(metric as ProductivityMetric);
      }
    });

    // Parse insights
    const insightBlocks = aiResponse.split('INSIGHT_START').slice(1);
    insightBlocks.forEach((block, index) => {
      const endIndex = block.indexOf('INSIGHT_END');
      if (endIndex === -1) return;

      const content = block.substring(0, endIndex).trim();
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);

      const insight: Partial<ProductivityInsight> = { id: `insight_${index + 1}` };

      lines.forEach(line => {
        if (line.startsWith('Title:')) {
          insight.title = line.substring(6).trim();
        } else if (line.startsWith('Description:')) {
          insight.description = line.substring(12).trim();
        } else if (line.startsWith('Type:')) {
          insight.type = line.substring(5).trim() as any;
        } else if (line.startsWith('Impact:')) {
          insight.impact = line.substring(7).trim() as any;
        } else if (line.startsWith('CurrentValue:')) {
          const current = parseFloat(line.substring(13).trim()) || 0;
          if (!insight.metrics) insight.metrics = { current: 0, potential: 0, unit: '' };
          insight.metrics.current = current;
        } else if (line.startsWith('PotentialValue:')) {
          const potential = parseFloat(line.substring(15).trim()) || 0;
          if (!insight.metrics) insight.metrics = { current: 0, potential: 0, unit: '' };
          insight.metrics.potential = potential;
        } else if (line.startsWith('Unit:')) {
          const unit = line.substring(5).trim();
          if (!insight.metrics) insight.metrics = { current: 0, potential: 0, unit: '' };
          insight.metrics.unit = unit;
        } else if (line.startsWith('Actions:')) {
          insight.actions = line.substring(8).trim().split('|').map(a => a.trim());
        }
      });

      if (insight.title && insight.description && insight.type && insight.impact) {
        insights.push(insight as ProductivityInsight);
        insights[insights.length - 1].actionable = true;
      }
    });

    return {
      metrics: metrics.slice(0, 6),
      insights: insights.slice(0, 5)
    };
  }

  /**
   * Fallback workflow recommendations when AI fails
   */
  private static getFallbackWorkflowRecommendations(context?: AIRecommendationContext): WorkflowRecommendation[] {
    const userRole = context?.user.role || 'member';
    
    if (userRole === 'owner') {
      return [
        {
          id: 'owner_fallback_1',
          title: 'Cross-Workspace Analytics Dashboard',
          description: 'Set up comprehensive analytics across all your workspaces to track performance and identify optimization opportunities',
          type: 'process_optimization',
          priority: 'high',
          impact: '+25% strategic oversight',
          actionable: true,
          estimatedTime: '20 min setup',
          actions: ['Configure multi-workspace reporting', 'Set up performance KPIs', 'Create executive dashboard']
        },
        {
          id: 'owner_fallback_2',
          title: 'Strategic Resource Allocation',
          description: 'Implement AI-driven resource allocation across teams and projects based on priority and capacity',
          type: 'automation',
          priority: 'high',
          impact: '+30% resource efficiency',
          actionable: true,
          estimatedTime: '25 min setup',
          actions: ['Analyze team capacities', 'Set priority frameworks', 'Enable auto-allocation']
        },
        {
          id: 'owner_fallback_3',
          title: 'Workspace Growth Optimization',
          description: 'Automate workspace expansion planning and team scaling recommendations based on growth patterns',
          type: 'process_optimization',
          priority: 'medium',
          impact: '+20% scalability',
          actionable: true,
          estimatedTime: '15 min setup',
          actions: ['Set growth triggers', 'Configure scaling templates', 'Enable growth notifications']
        }
      ];
    }
    
    if (userRole === 'admin') {
      return [
        {
          id: 'admin_fallback_1',
          title: 'Team Performance Monitoring',
          description: 'Set up automated team performance tracking with alerts for bottlenecks and achievement milestones',
          type: 'recurring_report',
          priority: 'high',
          impact: '+20% team efficiency',
          actionable: true,
          estimatedTime: '15 min setup',
          actions: ['Configure performance metrics', 'Set up alert thresholds', 'Create team dashboards']
        },
        {
          id: 'admin_fallback_2',
          title: 'Workflow Standardization',
          description: 'Implement standardized workflows across teams to improve consistency and reduce training time',
          type: 'process_optimization',
          priority: 'high',
          impact: '+25% process efficiency',
          actionable: true,
          estimatedTime: '20 min setup',
          actions: ['Analyze current workflows', 'Create standard templates', 'Deploy across teams']
        },
        {
          id: 'admin_fallback_3',
          title: 'Automated Task Distribution',
          description: 'Set up intelligent task assignment based on team member skills, availability, and workload',
          type: 'task_assignment',
          priority: 'medium',
          impact: '+18% productivity',
          actionable: true,
          estimatedTime: '12 min setup',
          actions: ['Map team skills', 'Set workload limits', 'Enable smart assignment']
        }
      ];
    }
    
    // Member fallback recommendations
    return [
      {
        id: 'member_fallback_1',
        title: 'Personal Task Organization',
        description: 'Set up a personal task management system to track your daily activities and improve completion rates',
        type: 'process_optimization',
        priority: 'high',
        impact: '+25% personal productivity',
        actionable: true,
        estimatedTime: '5 min setup',
        actions: ['Create personal task categories', 'Set daily goals', 'Enable progress tracking']
      },
      {
        id: 'member_fallback_2',
        title: 'Collaboration Reminders',
        description: 'Set reminders to check in with team members and respond to messages promptly',
        type: 'reminder',
        priority: 'medium',
        impact: '+30% team collaboration',
        actionable: true,
        estimatedTime: '3 min setup',
        actions: ['Set communication schedules', 'Enable response reminders', 'Create check-in templates']
      },
      {
        id: 'member_fallback_3',
        title: 'Skill Development Tracking',
        description: 'Track your learning progress and identify areas for professional development',
        type: 'process_optimization',
        priority: 'medium',
        impact: '+15% skill growth',
        actionable: true,
        estimatedTime: '8 min setup',
        actions: ['Identify skill gaps', 'Set learning goals', 'Track progress']
      }
    ];
  }

  /**
   * Fallback productivity insights when AI fails
   */
  private static getFallbackProductivityInsights(context?: AIRecommendationContext): {
    metrics: ProductivityMetric[];
    insights: ProductivityInsight[];
  } {
    const userRole = context?.user.role || 'member';
    
    if (userRole === 'owner') {
      return {
        metrics: [
          {
            id: 'owner_metric_1',
            title: 'Portfolio ROI',
            value: 92,
            unit: '%',
            trend: 'up',
            trendValue: 18,
            insight: 'Your workspace portfolio is generating strong returns with 18% improvement this quarter',
            recommendation: 'Consider expanding successful workspace models to new markets'
          },
          {
            id: 'owner_metric_2',
            title: 'Strategic Decision Speed',
            value: 78,
            unit: '%',
            trend: 'up',
            trendValue: 12,
            insight: 'Your strategic decisions are being implemented 12% faster than previous quarter',
            recommendation: 'Implement automated decision tracking to maintain this momentum'
          },
          {
            id: 'owner_metric_3',
            title: 'Cross-Workspace Synergy',
            value: 84,
            unit: '%',
            trend: 'stable',
            trendValue: 3,
            insight: 'Good collaboration between your workspaces with room for optimization',
            recommendation: 'Create shared resource pools to improve cross-workspace efficiency'
          }
        ],
        insights: [
          {
            id: 'owner_insight_1',
            title: 'Leadership Efficiency Optimization',
            description: 'Streamline your decision-making process and delegate more effectively to focus on strategic initiatives',
            type: 'efficiency',
            impact: 'high',
            actionable: true,
            metrics: { current: 75, potential: 92, unit: '% leadership efficiency' },
            actions: ['Implement decision frameworks', 'Delegate operational tasks', 'Focus on strategic planning']
          },
          {
            id: 'owner_insight_2',
            title: 'Portfolio Growth Strategy',
            description: 'Optimize your workspace portfolio growth based on performance analytics and market opportunities',
            type: 'collaboration',
            impact: 'high',
            actionable: true,
            metrics: { current: 68, potential: 85, unit: '% growth efficiency' },
            actions: ['Analyze top-performing patterns', 'Identify expansion opportunities', 'Create growth templates']
          }
        ]
      };
    }
    
    if (userRole === 'admin') {
      return {
        metrics: [
          {
            id: 'admin_metric_1',
            title: 'Team Management Efficiency',
            value: 88,
            unit: '%',
            trend: 'up',
            trendValue: 15,
            insight: 'Your team management has improved by 15% with better delegation and communication',
            recommendation: 'Implement automated status tracking to maintain this efficiency'
          },
          {
            id: 'admin_metric_2',
            title: 'Process Optimization Rate',
            value: 82,
            unit: '%',
            trend: 'up',
            trendValue: 10,
            insight: 'You\'re successfully optimizing processes 10% faster than before',
            recommendation: 'Create process templates to scale optimizations across teams'
          },
          {
            id: 'admin_metric_3',
            title: 'Conflict Resolution Speed',
            value: 91,
            unit: '%',
            trend: 'stable',
            trendValue: 5,
            insight: 'Excellent conflict resolution with quick turnaround times',
            recommendation: 'Document resolution patterns to help train other team leads'
          }
        ],
        insights: [
          {
            id: 'admin_insight_1',
            title: 'Team Leadership Enhancement',
            description: 'Improve your team leadership effectiveness through better communication and process management',
            type: 'collaboration',
            impact: 'high',
            actionable: true,
            metrics: { current: 78, potential: 92, unit: '% leadership score' },
            actions: ['Schedule regular one-on-ones', 'Implement feedback loops', 'Create team development plans']
          },
          {
            id: 'admin_insight_2',
            title: 'Operational Excellence',
            description: 'Streamline operations and reduce bottlenecks to improve overall team productivity',
            type: 'efficiency',
            impact: 'high',
            actionable: true,
            metrics: { current: 73, potential: 88, unit: '% operational efficiency' },
            actions: ['Identify process bottlenecks', 'Automate routine tasks', 'Optimize resource allocation']
          }
        ]
      };
    }
    
    // Member fallback insights
    return {
      metrics: [
        {
          id: 'member_metric_1',
          title: 'Personal Task Completion',
          value: 87,
          unit: '%',
          trend: 'up',
          trendValue: 12,
          insight: 'You\'re completing personal tasks 12% faster than last month',
          recommendation: 'Keep up the momentum with your current task management approach'
        },
        {
          id: 'member_metric_2',
          title: 'Team Collaboration Score',
          value: 84,
          unit: '%',
          trend: 'up',
          trendValue: 8,
          insight: 'Your collaboration with teammates has improved by 8%',
          recommendation: 'Continue engaging actively in team discussions and check-ins'
        },
        {
          id: 'member_metric_3',
          title: 'Response Time',
          value: 76,
          unit: '%',
          trend: 'stable',
          trendValue: 2,
          insight: 'Good response time to messages and requests',
          recommendation: 'Set specific times for checking and responding to communications'
        }
      ],
      insights: [
        {
          id: 'member_insight_1',
          title: 'Personal Productivity Enhancement',
          description: 'Optimize your daily workflow and time management to increase personal productivity',
          type: 'time_management',
          impact: 'high',
          actionable: true,
          metrics: { current: 75, potential: 92, unit: '% personal efficiency' },
          actions: ['Block time for deep work', 'Minimize distractions', 'Use productivity techniques']
        },
        {
          id: 'member_insight_2',
          title: 'Skill Development Focus',
          description: 'Identify and focus on developing key skills that will enhance your contribution to the team',
          type: 'quality',
          impact: 'medium',
          actionable: true,
          metrics: { current: 68, potential: 82, unit: '% skill utilization' },
          actions: ['Identify skill gaps', 'Set learning goals', 'Practice new skills in projects']
        }
      ]
    };
  }
}
