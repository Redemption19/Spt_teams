'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon,
  ArrowLeft,
  Save,
  Clock,
  MapPin,
  Users,
  Settings,
  FileText,
  Edit,
  AlertTriangle
} from 'lucide-react';
import { CalendarEvent } from '@/lib/calendar-service';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { 
  useCalendarAccess, 
  useCanEditCalendarEvent,
  useCalendarEventPermissions 
} from '@/lib/rbac-hooks';

interface EditEventPageProps {
  event: CalendarEvent;
  users: any[];
  teams: any[];
  departments: any[];
  onUpdateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  onBack: () => void;
  permissions: any;
}

export function EditEventPage({
  event,
  users,
  teams,
  departments,
  onUpdateEvent,
  onBack,
  permissions
}: EditEventPageProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace, userRole } = useWorkspace();
  const calendarAccess = useCalendarAccess();
  
  // Check if user has permission to edit this specific event
  const canEditEvent = useCanEditCalendarEvent(event, user?.uid);
  const eventPermissions = useCalendarEventPermissions(event, user?.uid);

  // All hooks must be called before any conditional returns
  // Filter users, teams, and departments by current workspace for security
  const workspaceUsers = users.filter(user => 
    user.workspaceId === currentWorkspace?.id || 
    user.workspaces?.includes(currentWorkspace?.id)
  );
  
  const workspaceTeams = teams.filter(team => 
    team.workspaceId === currentWorkspace?.id
  );
  
  const workspaceDepartments = departments.filter(dept => 
    dept.workspaceId === currentWorkspace?.id
  );
  
  const [eventForm, setEventForm] = useState(() => ({
    title: event.title,
    description: event.description || '',
    type: event.type,
    priority: event.priority,
    status: event.status,
    location: event.location || '',
    start: event.start,
    end: event.end || event.start,
    allDay: event.allDay || false,
    attendees: event.attendees || [],
    teamId: event.teamId || undefined,
    departmentId: event.departmentId || undefined,
    notes: event.notes || '',
    isRecurring: event.isRecurring || false,
    visibility: event.visibility || 'public'
  }));

  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Show access denied if user cannot edit this event
  if (!canEditEvent) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Calendar</span>
          </Button>
        </div>
        
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">Access Denied</h3>
            <p className="text-sm text-muted-foreground mt-2">
              You do not have permission to edit this event.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Only event creators, admins, and owners can edit events.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check workspace isolation - ensure event belongs to current workspace
  if (event.workspaceId && event.workspaceId !== currentWorkspace?.id && !calendarAccess.canViewCrossWorkspace) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Calendar</span>
          </Button>
        </div>
        
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">Access Denied</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This event belongs to a different workspace.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You can only edit events within your current workspace.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!eventForm.title.trim()) {
      errors.title = 'Event title is required';
    }
    
    if (eventForm.start >= eventForm.end) {
      errors.end = 'End time must be after start time';
    }

    // Workspace validation
    if (!currentWorkspace?.id) {
      errors.workspace = 'Valid workspace is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Ensure workspace isolation - event stays in same workspace
      const updates = {
        ...eventForm,
        workspaceId: currentWorkspace!.id, // Enforce workspace isolation
        attendees: eventForm.attendees.length > 0 ? eventForm.attendees : undefined,
        teamId: eventForm.teamId || undefined,
        departmentId: eventForm.departmentId || undefined
      };

      await onUpdateEvent(event.id, updates);
      
      toast({
        title: '✅ Success',
        description: 'Event updated successfully!',
        className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none',
      });
      
      onBack();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return '👥';
      case 'deadline': return '⏰';
      case 'training': return '📚';
      case 'review': return '📋';
      case 'reminder': return '🔔';
      case 'report': return '📊';
      default: return '📅';
    }
  };

  const toggleAttendee = (userId: string) => {
    setEventForm(prev => ({
      ...prev,
      attendees: prev.attendees.includes(userId)
        ? prev.attendees.filter(id => id !== userId)
        : [...prev.attendees, userId]
    }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Calendar</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Edit Event
            </h1>
            <p className="text-muted-foreground mt-1">
              Update event details in {currentWorkspace?.name || 'your workspace'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !eventForm.title.trim()}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Updating...' : 'Update Event'}
          </Button>
        </div>
      </div>

      {/* Permission and Workspace Context Banner */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
        <div className="flex items-center space-x-2">
          <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Editing event in <strong>{currentWorkspace?.name}</strong> workspace
            {event.createdBy === user?.uid && (
              <span className="ml-2 text-xs">(You created this event)</span>
            )}
            {userRole === 'admin' && event.createdBy !== user?.uid && (
              <span className="ml-2 text-xs">(Admin privileges)</span>
            )}
            {userRole === 'owner' && (
              <span className="ml-2 text-xs">(Owner privileges)</span>
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Enter event title..."
                  className={validationErrors.title ? 'border-destructive' : ''}
                />
                {validationErrors.title && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Enter event description..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    placeholder="Enter location or meeting link..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={eventForm.notes}
                  onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                  placeholder="Any additional notes or instructions..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Date & Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={eventForm.allDay}
                  onCheckedChange={(checked) => setEventForm({ ...eventForm, allDay: checked })}
                />
                <Label>All day event</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date & Time</Label>
                  <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !eventForm.start && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventForm.start ? (
                          eventForm.allDay 
                            ? format(eventForm.start, "PPP")
                            : format(eventForm.start, "PPP p")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={eventForm.start}
                        onSelect={(date) => {
                          if (date) {
                            if (eventForm.allDay) {
                              setEventForm({ ...eventForm, start: date });
                            } else {
                              const newStart = new Date(date);
                              newStart.setHours(eventForm.start.getHours());
                              newStart.setMinutes(eventForm.start.getMinutes());
                              setEventForm({ ...eventForm, start: newStart });
                            }
                          }
                          setIsStartDateOpen(false);
                        }}
                        initialFocus
                      />
                      {!eventForm.allDay && (
                        <div className="p-3 border-t">
                          <Input
                            type="time"
                            value={format(eventForm.start, "HH:mm")}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':');
                              const newStart = new Date(eventForm.start);
                              newStart.setHours(parseInt(hours), parseInt(minutes));
                              setEventForm({ ...eventForm, start: newStart });
                            }}
                          />
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Date & Time</Label>
                  <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !eventForm.end && "text-muted-foreground",
                          validationErrors.end && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventForm.end ? (
                          eventForm.allDay 
                            ? format(eventForm.end, "PPP")
                            : format(eventForm.end, "PPP p")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={eventForm.end}
                        onSelect={(date) => {
                          if (date) {
                            if (eventForm.allDay) {
                              setEventForm({ ...eventForm, end: date });
                            } else {
                              const newEnd = new Date(date);
                              newEnd.setHours(eventForm.end.getHours());
                              newEnd.setMinutes(eventForm.end.getMinutes());
                              setEventForm({ ...eventForm, end: newEnd });
                            }
                          }
                          setIsEndDateOpen(false);
                        }}
                        initialFocus
                      />
                      {!eventForm.allDay && (
                        <div className="p-3 border-t">
                          <Input
                            type="time"
                            value={format(eventForm.end, "HH:mm")}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':');
                              const newEnd = new Date(eventForm.end);
                              newEnd.setHours(parseInt(hours), parseInt(minutes));
                              setEventForm({ ...eventForm, end: newEnd });
                            }}
                          />
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                  {validationErrors.end && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.end}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendees (Admin/Owner or event creator only) */}
          {(calendarAccess.isAdminOrOwner || event.createdBy === user?.uid) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Attendees & Organization</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Department and Team (Admin/Owner only) */}
                {calendarAccess.isAdminOrOwner && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select value={eventForm.departmentId ?? "none"} onValueChange={(value) => setEventForm({ ...eventForm, departmentId: value === "none" ? undefined : value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No department</SelectItem>
                          {workspaceDepartments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="team">Team</Label>
                      <Select value={eventForm.teamId ?? "none"} onValueChange={(value) => setEventForm({ ...eventForm, teamId: value === "none" ? undefined : value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No team</SelectItem>
                          {workspaceTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Attendees (from current workspace only) */}
                <div className="space-y-2">
                  <Label>Attendees ({eventForm.attendees.length} selected)</Label>
                  <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                    {workspaceUsers.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-2">No users available in this workspace</p>
                    ) : (
                      workspaceUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded cursor-pointer"
                          onClick={() => toggleAttendee(user.id)}
                        >
                          <input
                            type="checkbox"
                            checked={eventForm.attendees.includes(user.id)}
                            onChange={() => toggleAttendee(user.id)}
                            className="rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            {user.department && (
                              <p className="text-xs text-muted-foreground">{user.department}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Edit className="h-5 w-5" />
                <span>Event Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl">
                    {getEventTypeIcon(eventForm.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{eventForm.title || 'Event Title'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(eventForm.start, "PPP")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {eventForm.type}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs", {
                    "bg-red-100 text-red-700": eventForm.priority === 'urgent',
                    "bg-orange-100 text-orange-700": eventForm.priority === 'high',
                    "bg-yellow-100 text-yellow-700": eventForm.priority === 'medium',
                    "bg-green-100 text-green-700": eventForm.priority === 'low'
                  })}>
                    {eventForm.priority}
                  </Badge>
                </div>
                {eventForm.location && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {eventForm.location}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Event Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="type">Event Type</Label>
                <Select value={eventForm.type} onValueChange={(value) => setEventForm({ ...eventForm, type: value as CalendarEvent['type'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">👥 Meeting</SelectItem>
                    <SelectItem value="deadline">⏰ Deadline</SelectItem>
                    <SelectItem value="training">📚 Training</SelectItem>
                    <SelectItem value="review">📋 Review</SelectItem>
                    <SelectItem value="reminder">🔔 Reminder</SelectItem>
                    <SelectItem value="report">📊 Report</SelectItem>
                    <SelectItem value="other">📅 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={eventForm.priority} onValueChange={(value) => setEventForm({ ...eventForm, priority: value as CalendarEvent['priority'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Low</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span>Medium</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span>High</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>Urgent</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={eventForm.status} onValueChange={(value) => setEventForm({ ...eventForm, status: value as CalendarEvent['status'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={eventForm.visibility || 'public'} onValueChange={(value) => setEventForm({ ...eventForm, visibility: (value || 'public') as 'public' | 'private' | 'restricted' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">🌍 Public</SelectItem>
                    <SelectItem value="private">🔒 Private</SelectItem>
                    {calendarAccess.isAdminOrOwner && (
                      <SelectItem value="restricted">⚠️ Restricted</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
} 