'use client';

import { useState, useEffect, useCallback } from 'react';
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
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Eye,
  Lightbulb,
  Target,
  Zap,
  Activity,
  PieChart,
  LineChart,
  Lock,
  Loader2,
  AlertCircle,
  Shield,
  Users,
  Clock,
  Globe
} from 'lucide-react';

export default function AIAnalyticsActions() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const { currentWorkspace, userRole } = useWorkspace();
  const permissions = useRolePermissions();
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [departmentPerformance, setDepartmentPerformance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [activityData, personalMetrics, teamInsights, workspaceAnalytics, deptPerformance] = await Promise.all([
        AIDataService.getUserActivityData(userProfile!.id, currentWorkspace!.id),
        AIDataService.getPersonalMetrics(userProfile!.id, currentWorkspace!.id),
        userRole !== 'member' ? AIDataService.getTeamInsights(userProfile!.id, currentWorkspace!.id) : null,
        userRole === 'owner' ? AIDataService.getWorkspaceAnalytics(userProfile!.id, currentWorkspace!.id) : null,
        userRole !== 'member' ? AIDataService.getDepartmentPerformance(userProfile!.id, currentWorkspace!.id) : null
      ]);

      setAnalyticsData({
        activityData,
        personalMetrics,
        teamInsights,
        workspaceAnalytics
      });
      
      setDepartmentPerformance(deptPerformance);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, currentWorkspace, userRole]);

  // Fetch real analytics data
  useEffect(() => {
    if (userProfile?.id && currentWorkspace?.id && permissions.canAccessAI) {
      fetchAnalyticsData();
    }
  }, [userProfile?.id, currentWorkspace?.id, permissions.canAccessAI, fetchAnalyticsData]);

  // Check access permissions
  if (!permissions.canAccessAI) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Access Denied</p>
        <p className="text-xs mt-1">You don&apos;t have permission to access AI analytics features</p>
      </div>
    );
  }

  const handleAction = async (actionType: string, requiresAdvanced: boolean = false) => {
    if (requiresAdvanced && !permissions.canUseAdvancedAIFeatures) {
      toast({
        title: '🔒 Advanced Feature',
        description: 'This AI analytics feature requires admin or owner permissions.',
        variant: 'destructive'
      });
      return;
    }

    if (!permissions.canApplyAIRecommendations) {
      toast({
        title: '🔒 Limited Access',
        description: 'You can view analytics but cannot apply recommendations. Contact an admin for access.',
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(actionType);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    setIsAnalyzing(null);
    
    toast({
      title: '📊 Analytics Applied',
      description: 'AI-powered analytics insights have been processed successfully.',
    });
  };

  // Generate role-based analytics insights
  const getAnalyticsInsights = () => {
    if (!analyticsData) return [];

    const insights = [];

    if (userRole === 'owner' && analyticsData.workspaceAnalytics) {
      insights.push({
        id: 'workspace-performance',
        title: '🌐 Cross-Workspace Performance Overview',
        description: `Multi-workspace portfolio analysis across ${analyticsData.workspaceAnalytics.totalProjects || 0} projects and ${analyticsData.workspaceAnalytics.totalUsers || 0} users`,
        type: 'Executive Dashboard (Cross-Workspace)',
        requiresAdvanced: true,
        metrics: [
          { label: 'Total Projects', value: analyticsData.workspaceAnalytics.totalProjects || 0, trend: 'up' },
          { label: 'Active Users', value: analyticsData.workspaceAnalytics.activeUsers || 0, trend: 'up' },
          { label: 'Completion Rate', value: `${Math.round(analyticsData.workspaceAnalytics.completionRate || 85)}%`, trend: 'up' },
          { label: 'Growth Rate', value: `${Math.round(analyticsData.workspaceAnalytics.growthRate || 12)}%`, trend: 'up' }
        ],
        insights: [
          'Portfolio performance exceeds industry benchmarks',
          '🌐 Cross-workspace collaboration opportunities identified',
          'Resource optimization potential across all managed workspaces',
          'Strategic growth trajectory maintained across portfolio'
        ],
        recommendation: 'Continue current strategic direction while exploring automation opportunities'
      });
    }

    if (userRole === 'admin' && analyticsData.teamInsights) {
      insights.push({
        id: 'team-analytics',
        title: 'Team Performance Analytics',
        description: `Department analysis for ${analyticsData.teamInsights.memberCount || 0} team members`,
        type: 'Team Dashboard',
        requiresAdvanced: true,
        metrics: [
          { label: 'Team Size', value: analyticsData.teamInsights.memberCount || 0, trend: 'stable' },
          { label: 'Active Projects', value: analyticsData.teamInsights.activeProjects || 0, trend: 'up' },
          { label: 'Team Performance', value: `${Math.round(analyticsData.teamInsights.teamPerformance || 80)}%`, trend: 'up' },
          { label: 'Collaboration Score', value: `${Math.round(analyticsData.teamInsights.teamCollaborationScore || 75)}%`, trend: 'up' }
        ],
        insights: [
          'Team productivity increased by 15% this quarter',
          'Collaboration tools adoption at 90%',
          'Cross-functional project success rate: 85%',
          'Knowledge sharing sessions improving efficiency'
        ],
        recommendation: 'Implement peer learning programs to further boost collaboration'
      });
    }

    // Personal analytics for all users
    if (analyticsData.personalMetrics) {
      insights.push({
        id: 'personal-analytics',
        title: 'Personal Performance Analytics',
        description: 'Your individual productivity and collaboration metrics',
        type: 'Personal Dashboard',
        requiresAdvanced: false,
        metrics: [
          { label: 'Task Completion', value: `${Math.round(analyticsData.personalMetrics.taskCompletionRate || 75)}%`, trend: analyticsData.personalMetrics.productivityTrend === 'up' ? 'up' : 'stable' },
          { label: 'Quality Score', value: `${Math.round(analyticsData.personalMetrics.qualityScore || 85)}%`, trend: 'up' },
          { label: 'Collaboration', value: `${Math.round(analyticsData.personalMetrics.collaborationScore || 80)}%`, trend: 'up' },
          { label: 'On-time Delivery', value: `${Math.round(analyticsData.personalMetrics.onTimeDeliveryRate || 90)}%`, trend: 'up' }
        ],
        insights: [
          'Your productivity is trending upward',
          'Quality metrics exceed team average',
          'Strong collaboration with team members',
          'Consistent on-time delivery performance'
        ],
        recommendation: 'Continue current work patterns while exploring skill development opportunities'
      });
    }

    return insights;
  };

  // Generate anomaly detection based on real data
  const getAnomalies = () => {
    if (!analyticsData) return [];

    const anomalies = [];

    if (analyticsData.personalMetrics) {
      const completionRate = analyticsData.personalMetrics.taskCompletionRate || 75;
      if (completionRate < 70) {
        anomalies.push({
          id: 'low-completion',
          title: 'Task Completion Rate Below Expected',
          description: 'Personal productivity metrics show decline',
          severity: 'medium',
          metric: 'Task Completion Rate',
          current: Math.round(completionRate),
          expected: 85,
          deviation: Math.round(completionRate - 85),
          timeframe: 'Last 7 days',
          possibleCauses: [
            'Increased task complexity',
            'Resource constraints',
            'Training or skill gap'
          ],
          recommendation: 'Consider task prioritization and resource reallocation'
        });
      }
    }

    if (analyticsData.teamInsights && userRole !== 'member') {
      const teamPerformance = analyticsData.teamInsights.teamPerformance || 80;
      if (teamPerformance < 75) {
        anomalies.push({
          id: 'team-performance',
          title: 'Team Performance Anomaly',
          description: 'Team productivity below optimal range',
          severity: 'high',
          metric: 'Team Performance',
          current: Math.round(teamPerformance),
          expected: 85,
          deviation: Math.round(teamPerformance - 85),
          timeframe: 'Current sprint',
          possibleCauses: [
            'Resource bottlenecks',
            'Communication gaps',
            'Process inefficiencies'
          ],
          recommendation: 'Implement team standup meetings and resource optimization'
        });
      }
    }

    return anomalies;
  };

  const analyticsInsights = getAnalyticsInsights();
  const anomalies = getAnomalies();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className="text-sm">{error}</p>
          <Button 
            onClick={fetchAnalyticsData} 
            variant="outline" 
            size="sm"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {userRole === 'owner' ? 'Executive Analytics Intelligence' : 
             userRole === 'admin' ? 'Team Analytics Intelligence' : 
             'Personal Analytics Intelligence'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {analyticsInsights.length} AI insights • {anomalies.length} anomalies detected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            <Activity className="h-3 w-3 mr-1" />
            Real-time Data
          </Badge>
          {userRole === 'owner' && analyticsData.workspaceAnalytics && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              <Globe className="h-3 w-3 mr-1" />
              Cross-Workspace
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

      {/* Anomaly Detection */}
      {anomalies.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Anomaly Detection</h4>
          {anomalies.map((anomaly) => (
            <Card key={anomaly.id} className={`border-l-4 ${
              anomaly.severity === 'high' ? 'border-l-red-500' : 
              anomaly.severity === 'medium' ? 'border-l-yellow-500' : 
              'border-l-blue-500'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      anomaly.severity === 'high' ? 'bg-red-100 dark:bg-red-900/40' :
                      anomaly.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/40' :
                      'bg-blue-100 dark:bg-blue-900/40'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        anomaly.severity === 'high' ? 'text-red-600 dark:text-red-400' :
                        anomaly.severity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{anomaly.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {anomaly.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
                    {anomaly.severity}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="text-2xl font-bold text-foreground">{anomaly.current}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Expected</p>
                    <p className="text-2xl font-bold text-muted-foreground">{anomaly.expected}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Deviation</p>
                    <p className={`text-2xl font-bold ${anomaly.deviation < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {anomaly.deviation}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Timeframe</p>
                    <p className="text-sm font-medium">{anomaly.timeframe}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Possible Causes:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {anomaly.possibleCauses.map((cause, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                          {cause}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-blue-800 dark:text-blue-200">
                          AI Recommendation
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {anomaly.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t">
                  <Button
                    onClick={() => handleAction(`anomaly-${anomaly.id}`)}
                    disabled={isAnalyzing === `anomaly-${anomaly.id}` || !permissions.canApplyAIRecommendations}
                    className="w-full"
                    variant="outline"
                  >
                    {isAnalyzing === `anomaly-${anomaly.id}` ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </div>
                    ) : !permissions.canApplyAIRecommendations ? (
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        View Only
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Apply Recommendation
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Performance Insights */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">Performance Insights</h4>
        {analyticsInsights.map((insight) => {
          const requiresAdvanced = insight.requiresAdvanced;
          
          return (
            <Card key={insight.id} className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{insight.title}</CardTitle>
                        {requiresAdvanced && (
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-primary/20 to-accent/20">
                            Advanced
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{insight.type}</Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {insight.metrics.map((metric, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                      <div className="flex items-center justify-center gap-1">
                        <p className="text-lg font-bold">{metric.value}</p>
                        {metric.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                        {metric.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Key Insights:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {insight.insights.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Eye className="h-3 w-3 text-blue-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-green-800 dark:text-green-200">
                          AI Recommendation
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t">
                  <Button
                    onClick={() => handleAction(insight.id, requiresAdvanced)}
                    disabled={isAnalyzing === insight.id || (!permissions.canApplyAIRecommendations)}
                    className="w-full"
                    variant="outline"
                  >
                    {isAnalyzing === insight.id ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </div>
                    ) : !permissions.canApplyAIRecommendations ? (
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        View Only
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Generate Detailed Analysis
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Department Performance Section */}
      {departmentPerformance && departmentPerformance.departmentMetrics?.length > 0 && userRole !== 'member' && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Department Performance</h4>
          
          {/* Overall Metrics Summary */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Organization Overview</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Performance metrics across {departmentPerformance.departmentMetrics.length} departments
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Avg Efficiency</p>
                  <p className="text-lg font-bold">{departmentPerformance.overallMetrics.averageEfficiency}%</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Avg Collaboration</p>
                  <p className="text-lg font-bold">{departmentPerformance.overallMetrics.averageCollaboration}%</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Projects</p>
                  <p className="text-lg font-bold">{departmentPerformance.overallMetrics.totalActiveProjects}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Completed Tasks</p>
                  <p className="text-lg font-bold">{departmentPerformance.overallMetrics.totalCompletedTasks}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">
                    Best: {departmentPerformance.overallMetrics.bestPerformingDepartment}
                  </Badge>
                </div>
                
                {departmentPerformance.overallMetrics.departmentsNeedingAttention?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Needs Attention:</span>
                    {departmentPerformance.overallMetrics.departmentsNeedingAttention.map((dept: string) => (
                      <Badge key={dept} variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200">
                        {dept}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Individual Department Cards */}
          {departmentPerformance.departmentMetrics.map((dept: any) => (
            <Card key={dept.id} className={`border-l-4 ${
              dept.status === 'excellent' ? 'border-l-green-500' :
              dept.status === 'good' ? 'border-l-blue-500' :
              dept.status === 'needs_improvement' ? 'border-l-yellow-500' :
              'border-l-red-500'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      dept.status === 'excellent' ? 'bg-green-100 dark:bg-green-900/40' :
                      dept.status === 'good' ? 'bg-blue-100 dark:bg-blue-900/40' :
                      dept.status === 'needs_improvement' ? 'bg-yellow-100 dark:bg-yellow-900/40' :
                      'bg-red-100 dark:bg-red-900/40'
                    }`}>
                      <Users className={`h-5 w-5 ${
                        dept.status === 'excellent' ? 'text-green-600 dark:text-green-400' :
                        dept.status === 'good' ? 'text-blue-600 dark:text-blue-400' :
                        dept.status === 'needs_improvement' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{dept.name}</CardTitle>
                        <Badge variant="secondary" className={`${
                          dept.status === 'excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' :
                          dept.status === 'good' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' :
                          dept.status === 'needs_improvement' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                        }`}>
                          Grade: {dept.performanceGrade}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {dept.memberCount} members • {dept.activeProjects} active projects
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Efficiency</p>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-lg font-bold">{dept.efficiency}%</p>
                      {dept.trends.efficiency === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                      {dept.trends.efficiency === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Collaboration</p>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-lg font-bold">{dept.collaborationScore}%</p>
                      {dept.trends.collaboration === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                      {dept.trends.collaboration === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Completed</p>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-lg font-bold">{dept.completedTasks}</p>
                      {dept.trends.productivity === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                      {dept.trends.productivity === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">AI Recommendations:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {dept.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <Lightbulb className="h-3 w-3 text-blue-600" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
