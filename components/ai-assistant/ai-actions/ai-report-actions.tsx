'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions } from '@/lib/rbac-hooks';
import { AIDataService, ReportInsights } from '@/lib/ai-data-service';
import { 
  FileText, 
  TrendingUp, 
  Download, 
  Eye,
  Calendar,
  BarChart3,
  FileBarChart,
  Sparkles,
  Clock,
  Users,
  Lock,
  Loader2,
  AlertCircle,
  Target,
  Shield
} from 'lucide-react';

export default function AIReportActions() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const { currentWorkspace, userRole } = useWorkspace();
  const permissions = useRolePermissions();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [reportInsights, setReportInsights] = useState<ReportInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const insights = await AIDataService.getReportInsights(
        userProfile!.id,
        currentWorkspace!.id
      );
      
      setReportInsights(insights);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report insights');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, currentWorkspace]);

  // Fetch real report data
  useEffect(() => {
    if (userProfile?.id && currentWorkspace?.id && permissions.canAccessAI) {
      fetchReportData();
    }
  }, [userProfile?.id, currentWorkspace?.id, permissions.canAccessAI, fetchReportData]);

  // Check access permissions
  if (!permissions.canAccessAI) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Access Denied</p>
        <p className="text-xs mt-1">You don&apos;t have permission to access AI report features</p>
      </div>
    );
  }

  const handleAction = async (actionType: string, requiresAdvanced: boolean = false) => {
    if (requiresAdvanced && !permissions.canUseAdvancedAIFeatures) {
      toast({
        title: '🔒 Advanced Feature',
        description: 'This AI report feature requires admin or owner permissions.',
        variant: 'destructive'
      });
      return;
    }

    if (!permissions.canApplyAIRecommendations) {
      toast({
        title: '🔒 Limited Access',
        description: 'You can view report insights but cannot generate reports. Contact an admin for access.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(actionType);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    setIsGenerating(null);
    
    toast({
      title: '📊 Report Generated',
      description: 'AI-powered report has been generated successfully.',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading report insights...</p>
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
            onClick={fetchReportData} 
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

  // No data state
  if (!reportInsights) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No report data available</p>
          <p className="text-xs mt-1">Start creating reports to see AI insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with metrics */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {userRole === 'owner' ? 'Executive Report Intelligence' : 
             userRole === 'admin' ? 'Department Report Intelligence' : 
             'Personal Report Intelligence'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {reportInsights.generatedReports.length} AI insights • {reportInsights.draftSuggestions.length} draft suggestions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300">
            <Sparkles className="h-3 w-3 mr-1" />
            {reportInsights.generatedReports.length} AI Insights
          </Badge>
          {!permissions.canUseAdvancedAIFeatures && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
              <Shield className="h-3 w-3 mr-1" />
              Limited Access
            </Badge>
          )}
        </div>
      </div>

      {/* Performance Metrics Overview */}
      {reportInsights.performanceMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportInsights.performanceMetrics.slice(0, 3).map((metric, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  metric.trend === 'up' ? 'bg-green-100 dark:bg-green-900/40' :
                  metric.trend === 'down' ? 'bg-red-100 dark:bg-red-900/40' :
                  'bg-blue-100 dark:bg-blue-900/40'
                }`}>
                  <TrendingUp className={`h-5 w-5 ${
                    metric.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                    metric.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{metric.metric}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        metric.trend === 'up' 
                          ? 'text-green-600 border-green-200' 
                          : metric.trend === 'down'
                          ? 'text-red-600 border-red-200'
                          : 'text-blue-600 border-blue-200'
                      }`}
                    >
                      {metric.change}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* AI-Generated Insights */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">AI-Generated Insights</h4>
        {reportInsights.generatedReports.length === 0 ? (
          <Card className="p-6 text-center">
            <FileBarChart className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No AI insights available</p>
            <p className="text-xs mt-1">Generate reports to see AI analysis</p>
          </Card>
        ) : (
          reportInsights.generatedReports.map((insight) => {
            const getIconForType = (type: string) => {
              switch (type) {
                case 'performance': return FileBarChart;
                case 'analytics': return TrendingUp;
                case 'summary': return FileText;
                case 'forecast': return Target;
                default: return FileText;
              }
            };
            
            const IconComponent = getIconForType(insight.type);
            const requiresAdvanced = userRole === 'member' && insight.type === 'forecast';
            
            return (
              <Card key={insight.id} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                        <IconComponent className="h-5 w-5 text-green-600 dark:text-green-400" />
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
                  {insight.insights.length > 0 && (
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {insight.insights.map((metric: any, index: number) => (
                          <div key={index} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium">{metric.metric}</p>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  metric.trend === 'up' 
                                    ? 'text-green-600 border-green-200' 
                                    : metric.trend === 'down'
                                    ? 'text-red-600 border-red-200'
                                    : 'text-blue-600 border-blue-200'
                                }`}
                              >
                                {metric.change}
                              </Badge>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                            {metric.description && (
                              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-blue-800 dark:text-blue-200">
                          Key Finding
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {insight.keyFinding}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <Button
                      onClick={() => handleAction(insight.id, requiresAdvanced)}
                      disabled={isGenerating === insight.id || (!permissions.canApplyAIRecommendations)}
                      className="w-full"
                      variant="outline"
                    >
                      {isGenerating === insight.id ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </div>
                      ) : !permissions.canApplyAIRecommendations ? (
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          View Only
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Generate Full Report
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Draft Suggestions */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">Draft Suggestions</h4>
        <div className="grid gap-4">
          {reportInsights.draftSuggestions.map((draft) => {
            const requiresAdvanced = userRole === 'member' && draft.priority === 'high';
            
            return (
              <Card key={draft.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{draft.title}</CardTitle>
                          {requiresAdvanced && (
                            <Shield className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {draft.description}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        draft.status === 'ready' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : draft.status === 'pending'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }
                    >
                      {draft.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Last generated: {draft.lastGenerated}
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        ~{draft.estimatedTime} min
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          draft.priority === 'high' 
                            ? 'text-red-600 border-red-200'
                            : draft.priority === 'medium'
                            ? 'text-yellow-600 border-yellow-200'
                            : 'text-green-600 border-green-200'
                        }`}
                      >
                        {draft.priority} priority
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {draft.sections.map((section: any, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {typeof section === 'string' ? section : section.title || section.name || 'Section'}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex gap-2">
                    <Button
                      onClick={() => handleAction(`draft-${draft.id}`, requiresAdvanced)}
                      disabled={isGenerating === `draft-${draft.id}` || (!permissions.canApplyAIRecommendations)}
                      className="flex-1"
                      variant="outline"
                    >
                      {isGenerating === `draft-${draft.id}` ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Drafting...
                        </div>
                      ) : !permissions.canApplyAIRecommendations ? (
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          View Only
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Generate Draft
                        </div>
                      )}
                    </Button>
                    
                    <Button variant="ghost" size="sm" disabled={!permissions.canApplyAIRecommendations}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Trend Analysis */}
      {reportInsights.trendAnalysis.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Trend Analysis & Forecasting</h4>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-base">AI Trend Predictions</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Data-driven forecasting and pattern analysis
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {reportInsights.trendAnalysis.map((trend, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{trend.period}</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            trend.confidence > 80 ? 'text-green-600 border-green-200' :
                            trend.confidence > 60 ? 'text-yellow-600 border-yellow-200' :
                            'text-red-600 border-red-200'
                          }`}
                        >
                          {trend.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{trend.prediction}</p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        trend.impact === 'high' ? 'bg-red-100 text-red-700' :
                        trend.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}
                    >
                      {trend.impact} impact
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
