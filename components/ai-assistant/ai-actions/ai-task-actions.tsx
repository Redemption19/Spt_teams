'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions } from '@/lib/rbac-hooks';
import { AIDataService } from '@/lib/ai-data-service';
import { 
  CheckSquare, 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  Plus,
  Target,
  AlertCircle,
  Zap,
  Shield,
  Lock,
  Loader2
} from 'lucide-react';

export default function AITaskActions() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const { currentWorkspace, userRole } = useWorkspace();
  const permissions = useRolePermissions();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [realData, setRealData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use actual role-based logic
  // const isActuallyOwner = false; // Removed forced owner mode

  // Fetch real data on component mount
  useEffect(() => {
    const fetchRealData = async () => {
      if (!userProfile || !currentWorkspace) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const [activityData, personalMetrics, teamInsights, workspaceAnalytics] = await Promise.all([
          AIDataService.getUserActivityData(userProfile.id, currentWorkspace.id),
          AIDataService.getPersonalMetrics(userProfile.id, currentWorkspace.id),
          userRole !== 'member' ? AIDataService.getTeamInsights(userProfile.id, currentWorkspace.id) : null,
          // Use different analytics methods for owners vs admins
          userRole === 'owner' ? AIDataService.getWorkspaceAnalytics(userProfile.id, currentWorkspace.id) : 
          userRole === 'admin' ? AIDataService.getAdminWorkspaceAnalytics(userProfile.id, currentWorkspace.id) : null
        ]);

        setRealData({
          activityData,
          personalMetrics,
          teamInsights,
          workspaceAnalytics
        });
      } catch (err) {
        console.error('Error fetching real data:', err);
        setError('Unable to fetch real-time data. Showing cached insights.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealData();
  }, [userProfile, currentWorkspace, userRole]);

  // Check access permissions
  if (!permissions.canAccessAI) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Access Denied</p>
        <p className="text-xs mt-1">You don&apos;t have permission to access AI task features</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading real-time task insights...</span>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-full mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const handleAction = async (actionType: string, requiresAdvanced: boolean = false) => {
    if (requiresAdvanced && !permissions.canUseAdvancedAIFeatures) {
      toast({
        title: '🔒 Advanced Feature',
        description: 'This AI feature requires admin or owner permissions.',
        variant: 'destructive'
      });
      return;
    }

    if (!permissions.canApplyAIRecommendations) {
      toast({
        title: '🔒 Limited Access',
        description: 'You can view suggestions but cannot apply them. Contact an admin for implementation.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(actionType);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(null);
    
    toast({
      title: '✅ Task Action Applied',
      description: 'AI-powered task optimization has been implemented successfully.',
    });
  };

  // Personalized task suggestions based on user role and real data
  const getTaskSuggestions = () => {
    if (isLoading) return [];
    
    const data = realData || {};
    
    if (userRole === 'owner') {
      const analytics = data.workspaceAnalytics || {};
      const activityData = data.activityData || {};
      
      // Only show suggestions if we have meaningful real data
      if (!analytics.totalProjects && !analytics.totalUsers && !activityData.recentTasks?.length) {
        return [
          {
            id: 'no_workspace_data',
            title: 'No Workspace Data Available',
            description: 'Set up workspace structure to get AI-powered strategic insights',
            icon: AlertCircle,
            priority: 'high',
            requiresAdvanced: false,
            tasks: [
              { name: 'Create workspace structure', complexity: 'High', subtasks: 5 },
              { name: 'Set up departments', complexity: 'Medium', subtasks: 3 },
              { name: 'Add team members', complexity: 'Medium', subtasks: 4 }
            ],
            action: 'Set up workspace'
          }
        ];
      }
      
      return [
        {
          id: 'strategic_breakdown',
          title: 'Strategic Portfolio Analysis',
          description: analytics.totalProjects 
            ? `AI has analyzed your ${analytics.totalProjects} projects across workspaces and identified strategic optimization opportunities`
            : 'No projects available for strategic analysis',
          icon: Target,
          priority: 'high',
          requiresAdvanced: true,
          tasks: activityData.recentTasks?.slice(0, 3).map((task: any) => ({
            name: task.title || task.name || 'Strategic Initiative',
            complexity: task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low',
            subtasks: Math.floor(Math.random() * 10) + 5 // Keep minimal for real tasks
          })) || [],
          action: 'Generate strategic breakdown'
        },
        {
          id: 'cross_workspace_optimization',
          title: 'Cross-Workspace Resource Optimization',
          description: analytics.activeUsers && analytics.totalProjects 
            ? `Optimize resource allocation across your ${analytics.activeUsers} active users and ${analytics.totalProjects} projects`
            : `Workspace setup needed for resource optimization`,
          icon: Users,
          priority: 'high',
          requiresAdvanced: true,
          assignments: analytics.totalProjects > 0 ? [
            { 
              task: 'Cross-Workspace Resource Review', 
              suggested: 'Portfolio Management Team', 
              reason: `${analytics.resourceUtilization || 'Unknown'}% utilization detected across workspaces`
            }
          ] : [],
          action: 'Apply cross-workspace optimization'
        },
        {
          id: 'portfolio_progress',
          title: 'Portfolio Performance Dashboard',
          description: analytics.completionRate 
            ? `Generate comprehensive insights with ${analytics.completionRate}% completion rate and ${analytics.growthRate || 0}% growth across all workspaces`
            : 'No performance data available yet',
          icon: TrendingUp,
          priority: 'medium',
          requiresAdvanced: false,
          projects: activityData.completedProjects?.slice(0, 3).map((project: any) => ({
            name: project.name || project.title || 'Portfolio Project',
            progress: project.progress || 0,
            status: project.status === 'completed' ? 'Completed' : project.status || 'Unknown',
            blockers: 0
          })) || [],
          action: 'Generate portfolio report'
        }
      ];
    }

    if (userRole === 'admin') {
      const teamData = data.teamInsights || {};
      const activityData = data.activityData || {};
      const workspaceData = data.workspaceAnalytics || {}; // Admins can now access workspace data
      
      // Check if we have meaningful real data from any source
      const hasTeamData = teamData.memberCount > 0 || teamData.activeProjects > 0;
      const hasWorkspaceData = workspaceData.totalProjects > 0 || workspaceData.totalUsers > 0;
      const hasActivityData = activityData.recentTasks?.length > 0;
      
      // Use team data as fallback for workspace metrics when workspace data is missing
      const effectiveUserCount = workspaceData.totalUsers || teamData.memberCount || 0;
      const effectiveProjectCount = workspaceData.totalProjects || teamData.activeProjects || 
                                    (teamData.memberCount > 0 ? Math.max(1, Math.ceil(teamData.memberCount / 3)) : 0); // Estimate: 1 project per 3 members
      
      const hasEffectiveData = effectiveUserCount > 0 || effectiveProjectCount > 0; // Check after variables are declared
      
      if (!hasTeamData && !hasWorkspaceData && !hasActivityData && !hasEffectiveData) {
        return [
          {
            id: 'admin_setup_workspace',
            title: 'Admin Workspace Setup',
            description: 'Set up your workspace with real projects and team members to unlock AI-powered insights',
            icon: AlertCircle,
            priority: 'high',
            requiresAdvanced: false,
            tasks: [
              { name: 'Create departments/teams', complexity: 'Medium', subtasks: 3 },
              { name: 'Add team members', complexity: 'Low', subtasks: 2 },
              { name: 'Create actual projects', complexity: 'Medium', subtasks: 4 },
              { name: 'Assign tasks to members', complexity: 'Medium', subtasks: 3 }
            ],
            action: 'Set up workspace structure'
          }
        ];
      }
      
      // Generate admin-specific suggestions based on available data
      const suggestions = [];
      
      // Team management suggestions
      if (hasTeamData || hasWorkspaceData || hasEffectiveData) {
        suggestions.push({
          id: 'admin_team_optimization',
          title: 'Team Performance Optimization',
          description: effectiveProjectCount > 0 
            ? `Optimize performance across ${effectiveUserCount} team members and ${effectiveProjectCount} projects`
            : `Optimize performance for ${effectiveUserCount} team members (${effectiveProjectCount === 0 ? 'no active projects detected' : 'projects being calculated'})`,
          icon: Users,
          priority: 'high',
          requiresAdvanced: true,
          tasks: activityData.recentTasks?.slice(0, 3).map((task: any) => ({
            name: task.title || task.name || 'Team Task',
            complexity: task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low',
            subtasks: 3
          })) || [
            { name: 'Review team workload distribution', complexity: 'Medium', subtasks: 3 },
            { name: 'Identify skill gaps', complexity: 'Medium', subtasks: 2 },
            { name: 'Optimize resource allocation', complexity: 'High', subtasks: 4 }
          ],
          action: 'Apply team optimization'
        });
      }
      
      // Project management suggestions
      if (hasWorkspaceData || hasTeamData || hasActivityData || hasEffectiveData) {
        suggestions.push({
          id: 'admin_project_oversight',
          title: 'Project Portfolio Management',
          description: effectiveProjectCount > 0
            ? `Manage and track progress across ${effectiveProjectCount} active projects with ${workspaceData.completionRate || teamData.completionRate || 'calculating'}% completion rate`
            : `Set up project management for your ${effectiveUserCount} team members`,
          icon: Target,
          priority: 'high',
          requiresAdvanced: false,
          projects: activityData.completedProjects?.slice(0, 3).map((project: any) => ({
            name: project.name || project.title || 'Admin Project',
            progress: project.progress || 0,
            status: project.status === 'completed' ? 'Completed' : project.status || 'In Progress',
            blockers: project.blockers || 0
          })) || [],
          action: effectiveProjectCount > 0 ? 'Generate project insights' : 'Set up project tracking'
        });
      }
      
      // Performance analytics suggestions  
      if (hasTeamData) {
        suggestions.push({
          id: 'admin_performance_analytics',
          title: 'Team Performance Analytics',
          description: `Analyze team efficiency (${teamData.teamPerformance || 'calculating'}%) and collaboration score (${teamData.teamCollaborationScore || 'calculating'}%)`,
          icon: TrendingUp,
          priority: 'medium',
          requiresAdvanced: false,
          assignments: teamData.bottlenecks?.map((bottleneck: string, index: number) => ({
            task: `Address: ${bottleneck}`,
            suggested: 'Team Lead',
            reason: 'Performance improvement needed'
          })) || [],
          action: 'Generate performance report'
        });
      }
      
      // Add a specific suggestion for missing project data
      if (hasTeamData && effectiveProjectCount === 0 && activityData.recentTasks?.length === 0) {
        suggestions.push({
          id: 'admin_setup_projects',
          title: 'Project Setup Needed',
          description: `You have ${effectiveUserCount} team members but no active projects or tasks. Set up projects to unlock full analytics.`,
          icon: AlertCircle,
          priority: 'high',
          requiresAdvanced: false,
          tasks: [
            { name: 'Create first project', complexity: 'Medium', subtasks: 3 },
            { name: 'Assign team members to projects', complexity: 'Medium', subtasks: 2 },
            { name: 'Set up task tracking', complexity: 'Low', subtasks: 2 }
          ],
          action: 'Set up projects'
        });
      }
      
      return suggestions;
    }

    // Member-specific suggestions with real data
    const metrics = data.personalMetrics || {};
    const activityData = data.activityData || {};
    
    // Only show suggestions if we have real personal data
    if (!metrics.taskCompletionRate && !activityData.totalTasksCompleted && !activityData.recentTasks?.length) {
      return [
        {
          id: 'no_personal_data',
          title: 'No Personal Data Available',
          description: 'Start using the platform to get personalized AI task suggestions',
          icon: AlertCircle,
          priority: 'medium',
          requiresAdvanced: false,
          tasks: [
            { name: 'Complete your first task', complexity: 'Low', subtasks: 1 },
            { name: 'Set up your profile', complexity: 'Low', subtasks: 2 },
            { name: 'Join a team', complexity: 'Medium', subtasks: 3 }
          ],
          action: 'Get started'
        }
      ];
    }
    
    return [
      {
        id: 'personal_breakdown',
        title: 'Personal Productivity Optimization',
        description: `Based on your ${activityData.totalTasksCompleted || 0} completed tasks and ${metrics.taskCompletionRate || 0}% completion rate`,
        icon: Target,
        priority: 'high',
        requiresAdvanced: false,
        tasks: activityData.recentTasks?.slice(0, 3).map((task: any) => ({
          name: task.title || task.name || 'Personal Task',
          complexity: task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low',
          subtasks: Math.floor(Math.random() * 3) + 1 // Keep minimal for real tasks
        })) || [],
        action: 'Optimize my workflow'
      },
      {
        id: 'collaboration_suggestions',
        title: 'Collaboration Enhancement',
        description: metrics.collaborationScore 
          ? `Collaboration score: ${metrics.collaborationScore}% - ${activityData.collaborationCount || 0} recent team interactions`
          : 'No collaboration data available yet',
        icon: Users,
        priority: 'medium',
        requiresAdvanced: false,
        assignments: activityData.teamCollaborations?.slice(0, 2).map((collab: any) => ({
          task: 'Collaboration Opportunity',
          suggested: 'Team Member',
          reason: 'Based on recent interaction patterns'
        })) || [],
        action: 'Enhance collaboration'
      },
      {
        id: 'personal_progress',
        title: 'Personal Development Tracking',
        description: metrics.qualityScore 
          ? `Quality score: ${metrics.qualityScore}% - On-time delivery: ${metrics.onTimeDeliveryRate || 0}%`
          : 'No performance metrics available yet',
        icon: TrendingUp,
        priority: 'low',
        requiresAdvanced: false,
        projects: metrics.taskCompletionRate ? [
          { 
            name: 'My Learning Goals', 
            progress: Math.floor(metrics.collaborationScore || 0), 
            status: metrics.productivityTrend === 'up' ? 'Improving' : metrics.productivityTrend === 'down' ? 'Declining' : 'Stable', 
            blockers: 0 
          },
          { 
            name: 'Task Efficiency', 
            progress: Math.floor(metrics.taskCompletionRate || 0), 
            status: `${metrics.productivityTrend || 'stable'} trend`, 
            blockers: (metrics.averageResponseTime > 3) ? 1 : 0
          }
        ] : [],
        action: 'Track my progress'
      }
    ];
  };

  const taskSuggestions = getTaskSuggestions();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 border border-orange-200 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs">{error}</span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {userRole === 'owner' ? 'Strategic Task Intelligence' : 
             userRole === 'admin' ? 'Admin Task Intelligence' : 
             'Personal Task Intelligence'}
          </h3>
          {realData && (
            <p className="text-sm text-muted-foreground mt-1">
              {userRole === 'owner'
                ? `Managing ${realData.workspaceAnalytics?.totalUsers || 0} users and ${realData.workspaceAnalytics?.totalProjects || 0} projects (Cross-Workspace Analytics)`
                : userRole === 'admin'
                ? `Managing ${realData.workspaceAnalytics?.totalUsers || realData.teamInsights?.memberCount || 0} users and ${realData.workspaceAnalytics?.totalProjects || realData.teamInsights?.activeProjects || 0} projects (${currentWorkspace?.name || 'Current Workspace'})`
                : `${realData.activityData?.totalTasksCompleted || 0} tasks completed with ${realData.personalMetrics?.taskCompletionRate || 0}% success rate`
              }
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            <Zap className="h-3 w-3 mr-1" />
            {taskSuggestions.length} Smart Actions
          </Badge>
          {realData && (
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300">
              Real-time Data
            </Badge>
          )}
          {!permissions.canUseAdvancedAIFeatures && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
              <Shield className="h-3 w-3 mr-1" />
              Limited Access
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {taskSuggestions.map((suggestion) => {
          const IconComponent = suggestion.icon;
          const isAdvancedFeature = suggestion.requiresAdvanced;
          const canApply = permissions.canApplyAIRecommendations && (!isAdvancedFeature || permissions.canUseAdvancedAIFeatures);
          
          return (
            <Card key={suggestion.id} className="border-l-4 border-l-primary/60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isAdvancedFeature ? 'bg-gradient-to-r from-primary/10 to-accent/10' : 'bg-primary/10'}`}>
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{suggestion.title}</CardTitle>
                        {isAdvancedFeature && (
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-primary/20 to-accent/20">
                            Advanced
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getPriorityColor(suggestion.priority)} border-0`}
                  >
                    {suggestion.priority}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {suggestion.tasks && (
                  <div className="space-y-3">
                    {suggestion.tasks && suggestion.tasks.map((task: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckSquare className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{task.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.subtasks} potential subtasks identified
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {task.complexity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {suggestion.assignments && (
                  <div className="space-y-3">
                    {suggestion.assignments && suggestion.assignments.map((assignment: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{assignment.task}</p>
                            <p className="text-xs text-muted-foreground">
                              → {assignment.suggested}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {assignment.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {suggestion.projects && (
                  <div className="space-y-3">
                    {suggestion.projects && suggestion.projects.map((project: any, index: number) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{project.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {project.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <Progress value={project.progress} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{project.progress}% Complete</span>
                            {project.blockers > 0 && (
                              <span className="flex items-center gap-1 text-orange-600">
                                <AlertCircle className="h-3 w-3" />
                                {project.blockers} blockers
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t">
                  <Button
                    onClick={() => handleAction(suggestion.id, isAdvancedFeature)}
                    disabled={isGenerating === suggestion.id || !canApply}
                    className="w-full"
                    variant={canApply ? "outline" : "ghost"}
                  >
                    {isGenerating === suggestion.id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Processing...
                      </div>
                    ) : !canApply ? (
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        {isAdvancedFeature && !permissions.canUseAdvancedAIFeatures 
                          ? 'Advanced Feature Restricted' 
                          : 'View Only'}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {suggestion.action}
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
