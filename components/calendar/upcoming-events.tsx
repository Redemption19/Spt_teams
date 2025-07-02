'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { CalendarService, CalendarEvent } from '@/lib/calendar-service';
import { format } from 'date-fns';

interface UpcomingEventsProps {
  workspaceId: string;
  userId: string;
  onEventClick: (event: CalendarEvent) => void;
  showAllWorkspaces?: boolean;
  accessibleWorkspaces?: any[];
}

export function UpcomingEvents({ 
  workspaceId, 
  userId, 
  onEventClick,
  showAllWorkspaces = false,
  accessibleWorkspaces = []
}: UpcomingEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUpcomingEvents = async () => {
      if (!workspaceId || !userId) return;
      
      try {
        setLoading(true);
        
        // Determine workspace IDs to load from
        const workspaceIds = (showAllWorkspaces && accessibleWorkspaces?.length) 
          ? accessibleWorkspaces.map(w => w.id)
          : [workspaceId];
        
        let allUpcomingEvents: CalendarEvent[] = [];
        
        // Load upcoming events from all relevant workspaces
        for (const wsId of workspaceIds) {
          try {
            const wsUpcomingEvents = await CalendarService.getUpcomingEvents(wsId, userId, 7, 10);
            
            // Add events avoiding duplicates
            wsUpcomingEvents.forEach(event => {
              if (!allUpcomingEvents.some(e => e.id === event.id)) {
                allUpcomingEvents.push(event);
              }
            });
          } catch (wsError) {
            console.error(`Error loading upcoming events from workspace ${wsId}:`, wsError);
          }
        }
        
        // Sort events by start date
        allUpcomingEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        
        // Limit to 10 events total
        setEvents(allUpcomingEvents.slice(0, 10));
      } catch (error) {
        console.error('Error loading upcoming events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUpcomingEvents();
  }, [workspaceId, userId, showAllWorkspaces, accessibleWorkspaces?.map(w => w.id).join(',') || '']);

  const getEventColor = (type: string, status: string) => {
    if (status === 'cancelled') return 'bg-red-100 text-red-700 border-red-200';
    if (status === 'completed') return 'bg-green-100 text-green-700 border-green-200';
    
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'deadline':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'training':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'review':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'reminder':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'report':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-3 w-3 text-orange-500" />;
      case 'medium':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return '👥';
      case 'deadline':
        return '⏰';
      case 'training':
        return '📚';
      case 'review':
        return '📋';
      case 'reminder':
        return '🔔';
      case 'report':
        return '📊';
      default:
        return '📅';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const formatEventDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const formatEventTime = (date: Date, allDay?: boolean) => {
    if (allDay) return 'All day';
    return format(date, 'h:mm a');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Upcoming Events
          </div>
          {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
            <span className="text-xs text-muted-foreground">
              🌐 All Workspaces
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming events</p>
            <p className="text-xs text-muted-foreground">Your schedule is clear!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="group cursor-pointer p-3 rounded-lg border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-sm"
                onClick={() => onEventClick(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-base">{getEventIcon(event.type)}</span>
                      <Badge className={getEventColor(event.type, event.status)} variant="outline">
                        {event.type}
                      </Badge>
                      {getPriorityIcon(event.priority)}
                    </div>
                    
                    <h4 className="font-medium text-sm leading-tight mb-1 group-hover:text-primary transition-colors">
                      {event.title}
                    </h4>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span className="font-medium">{formatEventDate(event.start)}</span>
                        <span className="mx-1">•</span>
                        <span>{formatEventTime(event.start, event.allDay)}</span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Users className="h-3 w-3 mr-1" />
                          <span>{event.attendees.length} attendees</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors ml-2 flex-shrink-0" />
                </div>
                
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            ))}
            
            {events.length >= 10 && (
              <div className="pt-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs text-muted-foreground hover:text-primary"
                >
                  View all events
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 