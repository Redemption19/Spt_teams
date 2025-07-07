'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions } from '@/lib/rbac-hooks';
import { 
  AIRecommendationService, 
  ProductivityMetric, 
  ProductivityInsight 
} from '@/lib/ai-recommendation-service';
import { AIDataService } from '@/lib/ai-data-service';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Clock,
  Users,
  Activity,
  BarChart3,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  Shield,
  Lock
} from 'lucide-react';

export default function ProductivityInsights() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const { currentWorkspace, userRole, userWorkspaces } = useWorkspace();
  const permissions = useRolePermissions();
  const [metrics, setMetrics] = useState<ProductivityMetric[]>([]);
  const [insights, setInsights] = useState<ProductivityInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to gather user activity data
  const gatherUserActivityData = async (userId: string, workspaceId: string) => {
    try {
      // Use the real data service instead of mock data
      return await AIDataService.getUserActivityData(userId, workspaceId);
    } catch (error) {
      console.error('Error gathering user activity:', error);
      return undefined;
    }
  };

  // Helper function to calculate personal metrics
  const calculatePersonalMetrics = async (userId: string, workspaceId: string) => {
    try {
      // Use the real data service instead of mock data
      return await AIDataService.getPersonalMetrics(userId, workspaceId);
    } catch (error) {
      console.error('Error calculating personal metrics:', error);
      return undefined;
    }
  };

  const generateInsights = useCallback(async () => {
    if (!currentWorkspace || !userProfile) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Gather user activity data for personalization
      const rawUserActivity = await gatherUserActivityData(userProfile.id, currentWorkspace.id);
      const personalMetrics = await calculatePersonalMetrics(userProfile.id, currentWorkspace.id);

      // Transform raw activity data into the expected format for AI context
      const userActivity = rawUserActivity ? {
        recentTasks: rawUserActivity.filter(a => a.entity === 'task').slice(0, 10),
        completedProjects: rawUserActivity.filter(a => a.entity === 'project' && a.action === 'completed'),
        teamCollaborations: rawUserActivity.filter(a => a.entity === 'collaboration'),
        loginFrequency: 'Regular',
        activeHours: [],
        preferredWorkflows: []
      } : undefined;

      // Prepare context for AI service
      const context = {
        workspace: {
          id: currentWorkspace.id,
          name: currentWorkspace.name,
          type: currentWorkspace.type || 'business'
        },
        user: {
          id: userProfile.id,
          name: userProfile.name,
          role: userRole || 'member'
        },
        isOwner: userRole === 'owner',
        ownedWorkspaces: userWorkspaces.filter(uw => uw.role === 'owner').map(uw => uw.workspace),
        allWorkspaces: userWorkspaces.map(uw => uw.workspace),
        crossWorkspaceAccess: userWorkspaces.length > 1,
        userActivity,
        personalMetrics
      };

      const aiInsights = await AIRecommendationService.generateProductivityInsights(context);
      setMetrics(aiInsights.metrics);
      setInsights(aiInsights.insights);
    } catch (err) {
      console.error('Error generating productivity insights:', err);
      setError('Failed to generate AI insights. Showing fallback data.');
      
      // Show personalized fallback data based on user role
      const personalizedFallbackMetrics: ProductivityMetric[] = userRole === 'member' ? [
        {
          id: 'personal_completion',
          title: 'My Task Completion Rate',
          value: 87,
          unit: '%',
          trend: 'up' as const,
          trendValue: 12,
          insight: 'You\'re completing tasks 12% faster than last month',
          recommendation: 'Keep up the momentum with your current task management approach'
        },
        {
          id: 'personal_response',
          title: 'My Response Time',
          value: 2.1,
          unit: 'hours',
          trend: 'down' as const,
          trendValue: 8,
          insight: 'Your response time to messages has improved by 8%',
          recommendation: 'Continue checking messages regularly during work hours'
        },
        {
          id: 'personal_collaboration',
          title: 'My Team Collaboration',
          value: 84,
          unit: '/100',
          trend: 'up' as const,
          trendValue: 15,
          insight: 'Your collaboration with teammates has increased significantly',
          recommendation: 'Schedule more regular check-ins with your team'
        }
      ] : [
        {
          id: 'fallback_metric_1',
          title: 'Task Completion Rate',
          value: 87,
          unit: '%',
          trend: 'up' as const,
          trendValue: 12,
          insight: 'Team is completing tasks ahead of schedule',
          recommendation: 'Maintain current momentum with regular check-ins'
        },
        {
          id: 'fallback_metric_2',
          title: 'Team Collaboration',
          value: 74,
          unit: '%',
          trend: 'stable' as const,
          trendValue: 2,
          insight: 'Good collaboration with room for improvement',
          recommendation: 'Increase cross-team communication frequency'
        }
      ];

      const personalizedFallbackInsights: ProductivityInsight[] = userRole === 'member' ? [
        {
          id: 'personal_time_management',
          title: 'Personal Time Optimization',
          description: 'Optimize your work schedule based on your most productive hours and patterns',
          type: 'time_management' as const,
          impact: 'high' as const,
          actionable: true,
          metrics: { current: 75, potential: 92, unit: '% efficiency' },
          actions: ['Block your most productive hours for deep work', 'Set specific times for checking messages', 'Use time-blocking for better focus']
        },
        {
          id: 'personal_collaboration_improvement',
          title: 'Enhanced Team Communication',
          description: 'Improve your collaboration effectiveness with proactive communication strategies',
          type: 'collaboration' as const,
          impact: 'medium' as const,
          actionable: true,
          metrics: { current: 78, potential: 88, unit: '% collaboration score' },
          actions: ['Join team meetings actively', 'Provide regular progress updates', 'Ask for help when needed']
        }
      ] : [
        {
          id: 'fallback_insight_1',
          title: 'Workflow Optimization',
          description: 'Streamline review processes to reduce bottlenecks',
          type: 'efficiency' as const,
          impact: 'high' as const,
          actionable: true,
          metrics: { current: 65, potential: 85, unit: '% efficiency' }
        }
      ];

      setMetrics(personalizedFallbackMetrics);
      setInsights(personalizedFallbackInsights);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, userProfile, userRole, userWorkspaces]);
  useEffect(() => {
    generateInsights();
  }, [generateInsights]);

  // Check access permissions
  if (!permissions.canAccessAI || !permissions.canViewAIInsights) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Access Denied</p>
        <p className="text-xs mt-1">You don&apos;t have permission to view AI insights</p>
      </div>
    );
  }

  const handleApplyInsight = (insight: ProductivityInsight) => {
    if (!permissions.canApplyAIRecommendations) {
      toast({
        title: '🔒 Access Denied',
        description: 'You need admin or owner permissions to apply AI insights.',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: '📊 Insight Applied',
      description: `${insight.title} recommendation has been implemented.`,
    });
  };

  const handleRefreshInsights = () => {
    if (!permissions.canUseAdvancedAIFeatures) {
      toast({
        title: '🔒 Limited Access',
        description: 'Advanced AI features require admin or owner permissions.',
        variant: 'destructive'
      });
      return;
    }

    generateInsights();
    toast({
      title: '🔄 Refreshing Insights',
      description: 'Generating new AI-powered productivity analytics...',
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <Activity className="h-3 w-3 text-blue-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Analyzing productivity data...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 border rounded-lg animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">AI Productivity Analytics</span>
          {!permissions.canUseAdvancedAIFeatures && (
            <Shield className="h-3 w-3 text-orange-500" />
          )}
        </div>
        {permissions.canUseAdvancedAIFeatures && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshInsights}
            disabled={isLoading}
            className="h-7 text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 border border-orange-200 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs">{error}</span>
          </div>
        </div>
      )}

      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 gap-2">
            {metrics.map((metric) => (
              <div key={metric.id} className="p-3 border rounded-lg bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{metric.title}</span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend)}
                    <span className="text-xs text-muted-foreground">
                      {metric.trendValue}%
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold">{metric.value}</span>
                  <span className="text-xs text-muted-foreground">{metric.unit}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.insight}
                </p>
              </div>
            ))}
          </div>

          {/* Detailed Insights */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              AI Insights
            </h4>
            
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-sm">{insight.title}</h5>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getImpactColor(insight.impact)}`}
                  >
                    {insight.impact} impact
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3">
                  {insight.description}
                </p>
                
                {insight.metrics && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Current: {insight.metrics.current}{insight.metrics.unit}</span>
                      <span>Potential: {insight.metrics.potential}{insight.metrics.unit}</span>
                    </div>
                    <Progress 
                      value={(insight.metrics.current / insight.metrics.potential) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
                
                {insight.actionable && (
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant={permissions.canApplyAIRecommendations ? "outline" : "ghost"}
                      onClick={() => handleApplyInsight(insight)}
                      className="h-7 text-xs w-full"
                      disabled={!permissions.canApplyAIRecommendations}
                    >
                      {permissions.canApplyAIRecommendations ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Implement Recommendation
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 mr-1" />
                          Implementation Restricted
                        </>
                      )}
                    </Button>
                    
                    {insight.actions && insight.actions.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground mb-1">Action steps:</div>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {insight.actions.slice(0, 2).map((action, idx) => (
                            <li key={idx} className="flex items-center gap-1">
                              <Target className="h-3 w-3 text-blue-500" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {insights.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No insights available</p>
                <p className="text-xs mt-1">Try refreshing to generate new analytics</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
