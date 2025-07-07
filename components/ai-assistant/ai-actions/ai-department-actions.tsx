'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Building2, 
  Network,
  UserPlus,
  GitBranch,
  MessageSquare,
  Star,
  TrendingUp,
  AlertCircle,
  Target,
  Lightbulb,
  Zap,
  Shield,
  Lock,
  ChevronRight,
  Briefcase,
  TrendingDown
} from 'lucide-react';

// Import required services and hooks
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions } from '@/lib/rbac-hooks';
import { 
  AIDataService, 
  DepartmentInsights, 
  OrganizationRecommendation, 
  CollaborationMetrics, 
  TeamFormationSuggestion, 
  MentorshipMatch 
} from '@/lib/ai-data-service';

interface AIDepartmentActionsProps {
  className?: string;
}

export default function AIDepartmentActions({ className }: AIDepartmentActionsProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const permissions = useRolePermissions();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Data states
  const [departmentInsights, setDepartmentInsights] = useState<DepartmentInsights[]>([]);
  const [organizationRecommendations, setOrganizationRecommendations] = useState<OrganizationRecommendation[]>([]);
  const [collaborationMetrics, setCollaborationMetrics] = useState<CollaborationMetrics | null>(null);
  const [teamFormationSuggestions, setTeamFormationSuggestions] = useState<TeamFormationSuggestion[]>([]);
  const [mentorshipMatches, setMentorshipMatches] = useState<MentorshipMatch[]>([]);

  // Check if user has access to department intelligence features
  const canViewDepartmentData = permissions?.canViewReports && permissions?.canViewAllTeams;
  const canManageOrganization = permissions?.canEditWorkspace && permissions?.canManageTeamMembers;
  const canImplementChanges = permissions?.canCreateTeams && permissions?.canAssignUserRoles;

  // Load department data
  const loadDepartmentData = useCallback(async () => {
    if (!user || !currentWorkspace) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [insights, recommendations, metrics, suggestions, matches] = await Promise.all([
        AIDataService.getDepartmentInsights(currentWorkspace.id, user.uid),
        AIDataService.getOrganizationRecommendations(currentWorkspace.id, user.uid),
        AIDataService.getCollaborationMetrics(currentWorkspace.id, user.uid),
        AIDataService.getTeamFormationSuggestions(currentWorkspace.id, user.uid),
        AIDataService.getMentorshipMatches(currentWorkspace.id, user.uid)
      ]);

      setDepartmentInsights(insights);
      setOrganizationRecommendations(recommendations);
      setCollaborationMetrics(metrics);
      setTeamFormationSuggestions(suggestions);
      setMentorshipMatches(matches);
    } catch (error) {
      console.error('Error loading department data:', error);
      setError('Failed to load department insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user, currentWorkspace]);

  useEffect(() => {
    if (!user || !currentWorkspace || !canViewDepartmentData) {
      setIsLoading(false);
      return;
    }

    loadDepartmentData();
  }, [user, currentWorkspace, canViewDepartmentData, loadDepartmentData]);

  const handleAction = async (actionType: string, actionId?: string) => {
    if (!canImplementChanges) {
      setError('You do not have permission to implement organizational changes.');
      return;
    }

    try {
      setIsProcessing(actionType);
      setError(null);
      
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would implement the actual action logic
      console.log('Implementing action:', actionType, actionId);
      
      // Refresh data after action
      await loadDepartmentData();
    } catch (error) {
      console.error('Error implementing action:', error);
      setError('Failed to implement changes. Please try again.');
    } finally {
      setIsProcessing(null);
    }
  };

  // Utility functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getEfficiencyIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (score >= 60) return <div className="h-3 w-3 rounded-full bg-yellow-500" />;
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  };

  // Access control fallback
  if (!canViewDepartmentData) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Team & Department Intelligence</h3>
          <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300">
            <Shield className="h-3 w-3 mr-1" />
            Access Restricted
          </Badge>
        </div>
        
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You need additional permissions to access department intelligence features. 
            Contact your workspace administrator for access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-6 w-32" />
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-l-4 border-l-gray-300">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Team & Department Intelligence</h3>
          <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        
        <Button onClick={loadDepartmentData} variant="outline" className="w-full">
          <Lightbulb className="h-4 w-4 mr-2" />
          Retry Loading Data
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Team & Department Intelligence</h3>
        <Badge variant="outline" className="bg-pink-50 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
          <Users className="h-3 w-3 mr-1" />
          {organizationRecommendations.length} Recommendations
        </Badge>
      </div>

      {/* Department Overview */}
      {departmentInsights.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Department Overview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departmentInsights.map((dept) => (
              <Card key={dept.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                        <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{dept.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {dept.memberCount} members • {dept.activeProjects} active projects
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${getScoreColor(dept.efficiency)}`}>
                        {dept.efficiency}%
                      </span>
                      {getEfficiencyIcon(dept.efficiency)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Efficiency</span>
                        <span>{dept.efficiency}%</span>
                      </div>
                      <Progress value={dept.efficiency} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Collaboration</span>
                        <span>{dept.collaborationScore}%</span>
                      </div>
                      <Progress value={dept.collaborationScore} className="h-1.5" />
                    </div>
                    {dept.headName && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>Head: {dept.headName}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Organization Recommendations */}
      {organizationRecommendations.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Organization Structure</h4>
          {organizationRecommendations.map((rec) => (
            <Card key={rec.id} className="border-l-4 border-l-pink-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900/40 rounded-lg">
                      <Building2 className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{rec.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className={getPriorityColor(rec.priority)}
                    >
                      {rec.priority}
                    </Badge>
                    <Badge variant="secondary">{rec.type}</Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4">
                  {rec.currentIssues && rec.currentIssues.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Current Issues:</p>
                      <ul className="space-y-1">
                        {rec.currentIssues.map((issue, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <AlertCircle className="h-3 w-3 text-red-500 mt-1 flex-shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {rec.recommendations && rec.recommendations.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Recommendations:</p>
                      <ul className="space-y-1">
                        {rec.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Target className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rec.affectedDepartments && rec.affectedDepartments.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Affected Departments:</p>
                      <div className="flex flex-wrap gap-1">
                        {rec.affectedDepartments.map((dept, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {dept}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-2 border-blue-300">
                    <div className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-blue-800 dark:text-blue-200">
                          Expected Benefit
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {rec.expectedBenefit}
                        </p>
                        {rec.timeline && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Timeline: {rec.timeline}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <Button
                      onClick={() => handleAction(rec.id)}
                      disabled={isProcessing === rec.id || !canImplementChanges}
                      className="w-full"
                      variant="outline"
                    >
                      {isProcessing === rec.id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Creating Plan...
                        </div>
                      ) : !canImplementChanges ? (
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Access Required
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Create Implementation Plan
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Collaboration Analysis */}
      {collaborationMetrics && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Collaboration Insights</h4>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <Network className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Team Collaboration Analysis</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI-powered insights into team dynamics and collaboration patterns
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-sm mb-3">Collaboration Metrics:</p>
                  <div className="grid gap-3">
                    {Object.entries(collaborationMetrics).map(([key, value]) => {
                      const metricName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      return (
                        <div key={key} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{metricName}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${getScoreColor(value)}`}>
                                {value}%
                              </span>
                              {value >= 75 && <TrendingUp className="h-3 w-3 text-green-500" />}
                            </div>
                          </div>
                          <Progress value={value} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <Button
                    onClick={() => handleAction('collaboration-analysis')}
                    disabled={isProcessing === 'collaboration-analysis' || !canImplementChanges}
                    className="w-full"
                    variant="outline"
                  >
                    {isProcessing === 'collaboration-analysis' ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Analyzing...
                      </div>
                    ) : !canImplementChanges ? (
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Access Required
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        Improve Collaboration
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Formation Suggestions */}
      {teamFormationSuggestions.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Team Optimization</h4>
          {teamFormationSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                    <GitBranch className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{suggestion.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-sm mb-3">Suggested Changes:</p>
                    <div className="space-y-3">
                      {(suggestion.suggestedChanges || []).map((change, index) => (
                        <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm text-blue-800 dark:text-blue-200">
                                {change.change}
                              </p>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                <strong>Reason:</strong> {change.reason}
                              </p>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                <strong>Impact:</strong> {change.impact}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-2 border-green-300">
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-green-800 dark:text-green-200">
                          Expected Impact
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {suggestion.expectedImpact}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-green-600 dark:text-green-400">
                          <span>Timeline: {suggestion.timeline}</span>
                          <span>Risk: {suggestion.risk}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <Button
                      onClick={() => handleAction(suggestion.id)}
                      disabled={isProcessing === suggestion.id || !canImplementChanges}
                      className="w-full"
                      variant="outline"
                    >
                      {isProcessing === suggestion.id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Optimizing Teams...
                        </div>
                      ) : !canImplementChanges ? (
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Access Required
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          Apply Team Changes
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mentorship Program */}
      {mentorshipMatches.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Mentorship & Development</h4>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                  <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-base">AI-Powered Mentorship Matching</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Smart pairing of mentors and mentees based on skills, goals, and compatibility
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-sm mb-3">Suggested Mentor-Mentee Pairs:</p>
                  <div className="space-y-3">
                    {mentorshipMatches.map((match) => (
                      <div key={match.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {match.mentorName} → {match.menteeName}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            {match.compatibility}% match
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{match.mentorRole} → {match.menteeRole}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(match.focusAreas || []).map((area, areaIndex) => (
                              <Badge key={areaIndex} variant="secondary" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            <strong>Expected:</strong> {match.expectedOutcome}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <Button
                    onClick={() => handleAction('mentorship-program')}
                    disabled={isProcessing === 'mentorship-program' || !canImplementChanges}
                    className="w-full"
                    variant="outline"
                  >
                    {isProcessing === 'mentorship-program' ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Setting Up Program...
                      </div>
                    ) : !canImplementChanges ? (
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Access Required
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Launch Mentorship Program
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {departmentInsights.length === 0 && organizationRecommendations.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-muted rounded-full">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">No Department Data Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Department insights will appear here once you have departments and sufficient activity data.
                </p>
                <Button onClick={loadDepartmentData} variant="outline">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
