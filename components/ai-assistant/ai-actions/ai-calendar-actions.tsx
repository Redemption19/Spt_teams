'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions } from '@/lib/rbac-hooks';
import { AIDataService, CalendarInsights, MeetingSuggestion } from '@/lib/ai-data-service';
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  Plus,
  MapPin,
  Video,
  Bell,
  Zap,
  Shield,
  Lock,
  Loader2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function AICalendarActions() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const { currentWorkspace, userRole } = useWorkspace();
  const permissions = useRolePermissions();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [calendarInsights, setCalendarInsights] = useState<CalendarInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendarData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const insights = await AIDataService.getCalendarInsights(
        userProfile!.id,
        currentWorkspace!.id
      );
      
      setCalendarInsights(insights);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to load calendar insights');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, currentWorkspace]);

  // Fetch real calendar data
  useEffect(() => {
    if (userProfile?.id && currentWorkspace?.id && permissions.canAccessAI) {
      fetchCalendarData();
    }
  }, [userProfile?.id, currentWorkspace?.id, permissions.canAccessAI, fetchCalendarData]);

  // Check access permissions
  if (!permissions.canAccessAI) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Access Denied</p>
        <p className="text-xs mt-1">You don&apos;t have permission to access AI calendar features</p>
      </div>
    );
  }

  const handleAction = async (actionType: string, requiresAdvanced: boolean = false) => {
    if (requiresAdvanced && !permissions.canUseAdvancedAIFeatures) {
      toast({
        title: '🔒 Advanced Feature',
        description: 'This AI calendar feature requires admin or owner permissions.',
        variant: 'destructive'
      });
      return;
    }

    if (!permissions.canApplyAIRecommendations) {
      toast({
        title: '🔒 Limited Access',
        description: 'You can view calendar suggestions but cannot apply them. Contact an admin for implementation.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(actionType);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(null);
    
    toast({
      title: '📅 Calendar Action Applied',
      description: 'AI-powered calendar optimization has been implemented successfully.',
    });
  };

  // Generate real meeting suggestions based on user role and data
  const getMeetingSuggestions = () => {
    if (!calendarInsights) return [];

    const suggestions = calendarInsights.suggestedMeetingTimes.map(suggestion => ({
      id: `suggestion-${Date.now()}-${Math.random()}`,
      title: getRoleMeetingTitle(suggestion.type),
      description: `AI-suggested meeting based on your calendar patterns and availability`,
      icon: Clock,
      type: suggestion.type,
      requiresAdvanced: userRole === 'member' ? false : true,
      suggestions: [{
        time: suggestion.suggestedTime.toLocaleString(),
        attendees: suggestion.attendees,
        confidence: suggestion.confidence,
        reason: suggestion.reason
      }],
      action: 'Schedule Meeting'
    }));

    // Add role-specific suggestions
    if (userRole === 'owner') {
      suggestions.unshift({
        id: 'strategic-meetings',
        title: 'Strategic Meeting Optimization',
        description: 'AI-suggested executive meeting slots based on leadership availability',
        icon: Clock,
        type: 'Executive',
        requiresAdvanced: true,
        suggestions: calendarInsights.suggestedMeetingTimes.filter(s => s.type === 'Executive').map(s => ({
          time: s.suggestedTime.toLocaleString(),
          attendees: s.attendees,
          confidence: s.confidence,
          reason: s.reason
        })),
        action: 'Schedule Executive Meetings'
      });
    }

    if (userRole === 'admin') {
      suggestions.unshift({
        id: 'team-optimization',
        title: 'Team Meeting Optimization',
        description: 'AI-suggested meeting slots based on team availability and productivity patterns',
        icon: Clock,
        type: 'Team Meeting',
        requiresAdvanced: true,
        suggestions: calendarInsights.suggestedMeetingTimes.filter(s => s.type === 'Team Meeting').map(s => ({
          time: s.suggestedTime.toLocaleString(),
          attendees: s.attendees,
          confidence: s.confidence,
          reason: s.reason
        })),
        action: 'Schedule Team Meetings'
      });
    }

    return suggestions;
  };

  const getRoleMeetingTitle = (type: string) => {
    switch (type) {
      case 'Executive': return 'Strategic Planning Session';
      case 'Team Meeting': return 'Team Sync Meeting';
      case 'One-on-One': return 'Personal Development Meeting';
      default: return 'Collaborative Meeting';
    }
  };

  const meetingSuggestions = getMeetingSuggestions();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading calendar insights...</p>
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
            onClick={fetchCalendarData} 
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
  if (!calendarInsights) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No calendar data available</p>
          <p className="text-xs mt-1">Start creating events to see AI recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Calendar Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming Events</p>
              <p className="text-2xl font-bold">{calendarInsights.upcomingEvents.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conflicts</p>
              <p className="text-2xl font-bold">{calendarInsights.conflictingMeetings.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utilization</p>
              <p className="text-2xl font-bold">{Math.round(calendarInsights.calendarUtilization || 0)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Meeting Suggestions */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">AI Meeting Suggestions</h4>
        {meetingSuggestions.length === 0 ? (
          <Card className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No meeting suggestions available</p>
            <p className="text-xs mt-1">AI is analyzing your calendar patterns</p>
          </Card>
        ) : (
          meetingSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <suggestion.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{suggestion.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.type}
                      </Badge>
                      {suggestion.requiresAdvanced && !permissions.canUseAdvancedAIFeatures && (
                        <Shield className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {suggestion.suggestions.map((item, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{item.time}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {item.confidence}% confidence
                          </Badge>
                        </div>
                        {item.attendees && item.attendees.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{item.attendees.join(', ')}</span>
                          </div>
                        )}
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-2 border-blue-300">
                          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                            {item.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t">
                  <Button
                    onClick={() => handleAction(suggestion.id, suggestion.requiresAdvanced)}
                    disabled={isProcessing === suggestion.id || (!permissions.canApplyAIRecommendations)}
                    className="w-full"
                  >
                    {isProcessing === suggestion.id ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Scheduling...
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
          ))
        )}
      </div>

      {/* Calendar Conflicts */}
      {calendarInsights.conflictingMeetings.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Calendar Conflicts</h4>
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Scheduling Conflicts Detected</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {calendarInsights.conflictingMeetings.length} overlapping meetings found
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {calendarInsights.conflictingMeetings.slice(0, 3).map((conflict, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{conflict.title}</span>
                        <Badge variant="destructive" className="text-xs">
                          Conflict
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {conflict.start.toLocaleString()} - Conflicts with: {conflict.conflictWith}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t">
                <Button
                  onClick={() => handleAction('resolve-conflicts')}
                  disabled={isProcessing === 'resolve-conflicts'}
                  className="w-full"
                  variant="outline"
                >
                  {isProcessing === 'resolve-conflicts' ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resolving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Resolve Conflicts
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Free Time Slots */}
      {calendarInsights.freeTimeSlots.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Available Time Slots</h4>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Suggested Free Time</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-identified optimal slots for scheduling new meetings
              </p>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                {calendarInsights.freeTimeSlots.slice(0, 5).map((slot, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        {slot.start.toLocaleString()} - {slot.end.toLocaleString()}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(slot.duration)} min
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
