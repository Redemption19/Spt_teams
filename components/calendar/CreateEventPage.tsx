'use client';

import { useState, useEffect } from 'react';
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
  Plus,
  AlertTriangle
} from 'lucide-react';
import { CalendarEvent } from '@/lib/calendar-service';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useCalendarAccess, useCalendarEventPermissions } from '@/lib/rbac-hooks';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';

interface CreateEventPageProps {
  users: any[];
  teams: any[];
  departments: any[];
  onCreateEvent: (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onBack: () => void;
  permissions: any;
}

export function CreateEventPage({
  users,
  teams,
  departments,
  onCreateEvent,
  onBack,
  permissions
}: CreateEventPageProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace, userRole } = useWorkspace();
  const calendarAccess = useCalendarAccess();

  // All hooks must be called before any conditional returns
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'meeting' as CalendarEvent['type'],
    start: new Date(),
    end: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    allDay: false,
    location: '',
    priority: 'medium' as CalendarEvent['priority'],
    status: 'scheduled' as CalendarEvent['status'],
    visibility: 'public' as CalendarEvent['visibility'],
    teamId: '',
    departmentId: '',
    invitees: [] as string[],
    notes: '',
    reminder: 15,
    recurring: false,
    recurrencePattern: 'none' as 'none' | 'daily' | 'weekly' | 'monthly'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter users, teams, and departments by current workspace
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

  useEffect(() => {
    // Set default end time when start time changes
    const endTime = new Date(formData.start.getTime() + 60 * 60 * 1000);
    setFormData(prev => ({ ...prev, end: endTime }));
  }, [formData.start]);

  // Check if user has permission to create events
  if (!calendarAccess.canCreateEvents) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
        <div className="max-w-4xl mx-auto">
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
                You do not have permission to create calendar events.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Contact your workspace {userRole === 'member' ? 'admin or owner' : 'owner'} for access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.start) {
      newErrors.start = 'Start date and time is required';
    }

    if (!formData.end) {
      newErrors.end = 'End date and time is required';
    }

    if (formData.start && formData.end && formData.start >= formData.end) {
      newErrors.end = 'End time must be after start time';
    }

    // Workspace validation
    if (!currentWorkspace?.id) {
      newErrors.workspace = 'Valid workspace is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

    setLoading(true);
    try {
      // Convert special "no selection" values back to empty strings
      const processedFormData = {
        ...formData,
        departmentId: formData.departmentId === 'no-department' ? '' : formData.departmentId,
        teamId: formData.teamId === 'no-team' ? '' : formData.teamId
      };
      
      const eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
        ...processedFormData,
        workspaceId: currentWorkspace!.id, // Ensure workspace isolation
        createdBy: user!.uid,
        attendees: processedFormData.invitees,
        tags: [],
        attachments: []
      };

      await onCreateEvent(eventData);
      
      toast({
        title: '✅ Success',
        description: 'Event created successfully!',
        className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none',
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleInvitee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      invitees: prev.invitees.includes(userId)
        ? prev.invitees.filter(id => id !== userId)
        : [...prev.invitees, userId]
    }));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Calendar</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Create New Event
            </h1>
            <p className="text-sm text-muted-foreground">
              Create a new calendar event for {currentWorkspace?.name || 'your workspace'}
            </p>
          </div>
        </div>

        {/* Workspace Information Banner */}
        <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Creating event in <strong>{currentWorkspace?.name}</strong> workspace
              {userRole === 'admin' && (
                <span className="ml-2 text-xs">(Admin privileges within this workspace)</span>
              )}
              {userRole === 'owner' && (
                <span className="ml-2 text-xs">(Owner privileges across all workspaces)</span>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter event title"
                    className={errors.title ? 'border-destructive' : ''}
                  />
                  {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter event description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Event Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as CalendarEvent['type'] }))}>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as CalendarEvent['priority'] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🟢 Low</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="urgent">🔴 Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select value={formData.visibility} onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value as CalendarEvent['visibility'] }))}>
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
                </div>
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Date & Time</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allDay"
                    checked={formData.allDay}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allDay: checked }))}
                  />
                  <Label htmlFor="allDay">All Day Event</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start">Start Date & Time *</Label>
                  <EnhancedDatePicker
                    date={formData.start}
                    onDateChange={(date) => {
                      if (date) {
                        // Preserve the current time when date changes
                        const newStart = new Date(date);
                        if (!formData.allDay) {
                          newStart.setHours(formData.start.getHours());
                          newStart.setMinutes(formData.start.getMinutes());
                        }
                        setFormData(prev => ({ ...prev, start: newStart }));
                      }
                    }}
                    placeholder="Select start date"
                  />
                  {!formData.allDay && (
                    <Input
                      type="time"
                      value={format(formData.start, "HH:mm")}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newStart = new Date(formData.start);
                        newStart.setHours(parseInt(hours), parseInt(minutes));
                        setFormData(prev => ({ ...prev, start: newStart }));
                      }}
                      className="mt-2"
                    />
                  )}
                  {errors.start && <p className="text-xs text-destructive">{errors.start}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end">End Date & Time *</Label>
                  <EnhancedDatePicker
                    date={formData.end}
                    onDateChange={(date) => {
                      if (date) {
                        // Preserve the current time when date changes
                        const newEnd = new Date(date);
                        if (!formData.allDay) {
                          newEnd.setHours(formData.end.getHours());
                          newEnd.setMinutes(formData.end.getMinutes());
                        }
                        setFormData(prev => ({ ...prev, end: newEnd }));
                      }
                    }}
                    placeholder="Select end date"
                  />
                  {!formData.allDay && (
                    <Input
                      type="time"
                      value={format(formData.end, "HH:mm")}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newEnd = new Date(formData.end);
                        newEnd.setHours(parseInt(hours), parseInt(minutes));
                        setFormData(prev => ({ ...prev, end: newEnd }));
                      }}
                      className="mt-2"
                    />
                  )}
                  {errors.end && <p className="text-xs text-destructive">{errors.end}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder">Reminder (minutes before)</Label>
                  <Select value={formData.reminder.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, reminder: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No reminder</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="1440">1 day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter event location"
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organization & Attendees */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Organization & Attendees</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Department and Team (Admin/Owner only) */}
                {calendarAccess.isAdminOrOwner && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select value={formData.departmentId} onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-department">No department</SelectItem>
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
                      <Select value={formData.teamId} onValueChange={(value) => setFormData(prev => ({ ...prev, teamId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-team">No team</SelectItem>
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

                {/* Invitees (from current workspace only) */}
                <div className="space-y-2">
                  <Label>Invitees ({formData.invitees.length} selected)</Label>
                  <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                    {workspaceUsers.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-2">No users available in this workspace</p>
                    ) : (
                      workspaceUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded cursor-pointer"
                          onClick={() => toggleInvitee(user.id)}
                        >
                          <input
                            type="checkbox"
                            checked={formData.invitees.includes(user.id)}
                            onChange={() => toggleInvitee(user.id)}
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

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes for this event"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating Event...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}