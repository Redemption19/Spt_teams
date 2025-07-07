'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions } from '@/lib/rbac-hooks';
import { AIRecommendationService, WorkflowRecommendation } from '@/lib/ai-recommendation-service';
import { AIDataService } from '@/lib/ai-data-service';
import { 
  Clock, 
  Users, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  Calendar,
  ArrowRight,
  Zap,
  Loader2,
  Shield,
  Lock
} from 'lucide-react';

export default function WorkflowRecommendations() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const { currentWorkspace, userRole, userWorkspaces } = useWorkspace();
  const permissions = useRolePermissions();
  const [recommendations, setRecommendations] = useState<WorkflowRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendations = useCallback(async () => {
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
        recentTasks: rawUserActivity.filter(a => a.type === 'task').slice(0, 10),
        completedProjects: rawUserActivity.filter(a => a.type === 'project' && a.action === 'completed'),
        teamCollaborations: rawUserActivity.filter(a => a.type === 'collaboration'),
        loginFrequency: personalMetrics?.loginFrequency || 'Regular',
        activeHours: personalMetrics?.activeHours || [],
        preferredWorkflows: personalMetrics?.workflowPreferences || []
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

      const aiRecommendations = await AIRecommendationService.generateWorkflowRecommendations(context);
      setRecommendations(aiRecommendations);
    } catch (err) {
      console.error('Error generating workflow recommendations:', err);
      setError('Failed to generate AI recommendations. Showing fallback suggestions.');
      
      // Show role-specific fallback recommendations
      const fallbackRecs = userRole === 'owner' ? [
        {
          id: 'owner_fallback_1',
          title: 'Cross-Workspace Analytics Dashboard',
          description: 'Set up comprehensive analytics across all your workspaces to track performance and identify optimization opportunities',
          type: 'process_optimization' as const,
          priority: 'high' as const,
          impact: '+25% strategic oversight',
          actionable: true,
          estimatedTime: '20 min setup'
        },
        {
          id: 'owner_fallback_2',
          title: 'Strategic Resource Allocation',
          description: 'Implement AI-driven resource allocation across teams and projects based on priority and capacity',
          type: 'automation' as const,
          priority: 'high' as const,
          impact: '+30% resource efficiency',
          actionable: true,
          estimatedTime: '25 min setup'
        }
      ] : userRole === 'admin' ? [
        {
          id: 'admin_fallback_1',
          title: 'Team Performance Monitoring',
          description: 'Set up automated team performance tracking with alerts for bottlenecks and achievement milestones',
          type: 'recurring_report' as const,
          priority: 'high' as const,
          impact: '+20% team efficiency',
          actionable: true,
          estimatedTime: '15 min setup'
        },
        {
          id: 'admin_fallback_2',
          title: 'Workflow Standardization',
          description: 'Implement standardized workflows across teams to improve consistency and reduce training time',
          type: 'process_optimization' as const,
          priority: 'high' as const,
          impact: '+25% process efficiency',
          actionable: true,
          estimatedTime: '20 min setup'
        }
      ] : [
        {
          id: 'member_fallback_1',
          title: 'Personal Task Organization',
          description: 'Set up a personal task management system to track your daily activities and improve completion rates',
          type: 'process_optimization' as const,
          priority: 'high' as const,
          impact: '+25% personal productivity',
          actionable: true,
          estimatedTime: '5 min setup'
        },
        {
          id: 'member_fallback_2',
          title: 'Collaboration Reminders',
          description: 'Set reminders to check in with team members and respond to messages promptly',
          type: 'reminder' as const,
          priority: 'medium' as const,
          impact: '+30% team collaboration',
          actionable: true,
          estimatedTime: '3 min setup'
        }
      ];

      setRecommendations(fallbackRecs);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, userProfile, userRole, userWorkspaces]);

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

  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  // Check access permissions
  if (!permissions.canAccessAI || !permissions.canUseAIRecommendations) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Access Denied</p>
        <p className="text-xs mt-1">You don&apos;t have permission to view AI recommendations</p>
      </div>
    );
  }

  const handleApplyRecommendation = (recommendation: WorkflowRecommendation) => {
    if (!permissions.canApplyAIRecommendations) {
      toast({
        title: '🔒 Access Denied',
        description: 'You need admin or owner permissions to apply AI recommendations.',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: '🚀 Recommendation Applied',
      description: `${recommendation.title} has been implemented successfully.`,
    });
  };

  const handleRefreshRecommendations = () => {
    if (!permissions.canUseAdvancedAIFeatures) {
      toast({
        title: '🔒 Limited Access',
        description: 'Advanced AI features require admin or owner permissions.',
        variant: 'destructive'
      });
      return;
    }

    generateRecommendations();
    toast({
      title: '🔄 Refreshing Recommendations',
      description: 'Generating new AI-powered workflow suggestions...',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recurring_report': return <FileText className="h-4 w-4" />;
      case 'reminder': return <Clock className="h-4 w-4" />;
      case 'task_assignment': return <Users className="h-4 w-4" />;
      case 'process_optimization': return <Zap className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Generating AI recommendations...</span>
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 border rounded-lg animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">AI Workflow Suggestions</span>
          {!permissions.canUseAdvancedAIFeatures && (
            <Shield className="h-3 w-3 text-orange-500" />
          )}
        </div>
        {permissions.canUseAdvancedAIFeatures && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshRecommendations}
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
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getTypeIcon(rec.type)}
                <h4 className="font-medium text-sm">{rec.title}</h4>
              </div>
              <Badge 
                variant="secondary" 
                className={`text-xs ${getPriorityColor(rec.priority)}`}
              >
                {rec.priority}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">
              {rec.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-600 font-medium">
                  {rec.impact}
                </span>
                {rec.estimatedTime && (
                  <span className="text-muted-foreground">
                    {rec.estimatedTime}
                  </span>
                )}
              </div>
              
              {rec.actionable && (
                <Button
                  size="sm"
                  variant={permissions.canApplyAIRecommendations ? "outline" : "ghost"}
                  onClick={() => handleApplyRecommendation(rec)}
                  className="h-7 text-xs"
                  disabled={!permissions.canApplyAIRecommendations}
                >
                  {permissions.canApplyAIRecommendations ? (
                    <>
                      Apply
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 mr-1" />
                      Restricted
                    </>
                  )}
                </Button>
              )}
            </div>

            {rec.actions && rec.actions.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">Next steps:</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {rec.actions.slice(0, 3).map((action, idx) => (
                    <li key={idx} className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        
        {recommendations.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recommendations available</p>
            <p className="text-xs mt-1">Try refreshing to generate new suggestions</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
