'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeamCollaboration } from '@/hooks/use-team-collaboration';
import { TeamMeeting } from '@/lib/team-collaboration-service';
import { Team } from '@/lib/types';
import { 
  Video, 
  Calendar, 
  Users, 
  Clock, 
  Play, 
  Phone,
  PhoneCall,
  Activity,
  TrendingUp,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface TeamVideoCallIntegrationProps {
  team: Team;
  variant?: 'compact' | 'full';
  className?: string;
}

export default function TeamVideoCallIntegration({ 
  team, 
  variant = 'compact', 
  className 
}: TeamVideoCallIntegrationProps) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    upcomingMeetings,
    stats,
    loading,
    startInstantMeeting,
    scheduleMeeting,
    joinMeeting
  } = useTeamCollaboration(team.id);

  const [showQuickMeetingDialog, setShowQuickMeetingDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Quick meeting form
  const [quickMeetingTitle, setQuickMeetingTitle] = useState('');
  const [quickMeetingDescription, setQuickMeetingDescription] = useState('');

  // Schedule meeting form
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    meetingType: 'team_standup' as TeamMeeting['meetingType'],
    duration: 60
  });

  const handleQuickMeeting = async () => {
    if (!quickMeetingTitle.trim()) {
      toast({
        title: "Meeting title required",
        description: "Please enter a title for the meeting",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await startInstantMeeting(
        team.id,
        quickMeetingTitle,
        quickMeetingDescription
      );

      if (result) {
        setShowQuickMeetingDialog(false);
        setQuickMeetingTitle('');
        setQuickMeetingDescription('');
        
        toast({
          title: "Meeting started",
          description: "Redirecting to video call..."
        });
        
        // Navigate to video call room
        router.push(`/dashboard/video-call/join?channel=${result.channelName}&meeting=${result.meeting.id}`);
      }
    } catch (error) {
      toast({
        title: "Failed to start meeting",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleScheduleMeeting = async () => {
    if (!scheduleForm.title.trim() || !scheduleForm.scheduledAt) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await scheduleMeeting(team.id, {
        ...scheduleForm,
        scheduledAt: new Date(scheduleForm.scheduledAt)
      });

      if (result) {
        setShowScheduleDialog(false);
        setScheduleForm({
          title: '',
          description: '',
          scheduledAt: '',
          meetingType: 'team_standup',
          duration: 60
        });
        
        toast({
          title: "Meeting scheduled",
          description: "Team members will be notified"
        });
      }
    } catch (error) {
      toast({
        title: "Failed to schedule meeting",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleJoinMeeting = async (meetingId: string) => {
    try {
      const result = await joinMeeting(meetingId);
      if (result && result.channelName) {
        toast({
          title: "Joining meeting",
          description: "Redirecting to video call..."
        });
        router.push(`/dashboard/video-call/join?channel=${result.channelName}&meeting=${meetingId}`);
      }
    } catch (error) {
      toast({
        title: "Failed to join meeting",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const getMeetingTypeIcon = (type: TeamMeeting['meetingType']) => {
    switch (type) {
      case 'team_standup': return <Activity className="h-4 w-4" />;
      case 'team_planning': return <Calendar className="h-4 w-4" />;
      case 'team_review': return <TrendingUp className="h-4 w-4" />;
      case 'team_social': return <Users className="h-4 w-4" />;
      case 'team_training': return <Settings className="h-4 w-4" />;
      case 'team_emergency': return <Clock className="h-4 w-4" />;
      default: return <Video className="h-4 w-4" />;
    }
  };

  const getMeetingTypeColor = (type: TeamMeeting['meetingType']) => {
    switch (type) {
      case 'team_standup': return 'bg-blue-100 text-blue-800';
      case 'team_planning': return 'bg-purple-100 text-purple-800';
      case 'team_review': return 'bg-green-100 text-green-800';
      case 'team_social': return 'bg-yellow-100 text-yellow-800';
      case 'team_training': return 'bg-indigo-100 text-indigo-800';
      case 'team_emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5" />
            Team Video Calls
          </CardTitle>
          <CardDescription>
            Quick access to team meetings and collaboration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Dialog open={showQuickMeetingDialog} onOpenChange={setShowQuickMeetingDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Quick Meeting
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start Quick Team Meeting</DialogTitle>
                  <DialogDescription>
                    Start an instant video meeting with your team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quick-title">Meeting Title</Label>
                    <Input
                      id="quick-title"
                      value={quickMeetingTitle}
                      onChange={(e) => setQuickMeetingTitle(e.target.value)}
                      placeholder="e.g., Quick Sync"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quick-description">Description (Optional)</Label>
                    <Textarea
                      id="quick-description"
                      value={quickMeetingDescription}
                      onChange={(e) => setQuickMeetingDescription(e.target.value)}
                      placeholder="What's this meeting about?"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowQuickMeetingDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleQuickMeeting} disabled={!quickMeetingTitle.trim()}>
                      Start Meeting
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Team Meeting</DialogTitle>
                  <DialogDescription>
                    Plan a future meeting with your team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="schedule-title">Meeting Title</Label>
                    <Input
                      id="schedule-title"
                      value={scheduleForm.title}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Sprint Planning"
                    />
                  </div>
                  <div>
                    <Label htmlFor="schedule-description">Description</Label>
                    <Textarea
                      id="schedule-description"
                      value={scheduleForm.description}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Meeting agenda..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="schedule-date">Date & Time</Label>
                      <Input
                        id="schedule-date"
                        type="datetime-local"
                        value={scheduleForm.scheduledAt}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="schedule-type">Meeting Type</Label>
                      <Select
                        value={scheduleForm.meetingType}
                        onValueChange={(value) => setScheduleForm(prev => ({ ...prev, meetingType: value as TeamMeeting['meetingType'] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="team_standup">Daily Standup</SelectItem>
                          <SelectItem value="team_planning">Planning</SelectItem>
                          <SelectItem value="team_review">Review</SelectItem>
                          <SelectItem value="team_social">Social</SelectItem>
                          <SelectItem value="team_training">Training</SelectItem>
                          <SelectItem value="team_emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleScheduleMeeting} disabled={!scheduleForm.title.trim() || !scheduleForm.scheduledAt}>
                      Schedule Meeting
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" variant="outline" onClick={() => router.push('/dashboard/video-call')}>
              View All
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="font-semibold text-lg">{stats?.totalMeetings || 0}</div>
              <div className="text-muted-foreground">Total Meetings</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="font-semibold text-lg">{stats?.participationRate || 0}%</div>
              <div className="text-muted-foreground">Participation</div>
            </div>
          </div>

          {/* Upcoming Meetings */}
          {upcomingMeetings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Upcoming Meetings</h4>
              <div className="space-y-2">
                {upcomingMeetings.slice(0, 2).map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getMeetingTypeIcon(meeting.meetingType)}
                      <div>
                        <div className="font-medium text-sm">{meeting.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {meeting.scheduledAt && format(meeting.scheduledAt, 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleJoinMeeting(meeting.id)}>
                      Join
                    </Button>
                  </div>
                ))}
                {upcomingMeetings.length > 2 && (
                  <div className="text-center">
                    <Button size="sm" variant="ghost" onClick={() => router.push('/dashboard/video-call')}>
                      View {upcomingMeetings.length - 2} more
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6" />
            Team Video Collaboration
          </h2>
          <p className="text-muted-foreground">
            Manage team meetings and video communication for {team.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showQuickMeetingDialog} onOpenChange={setShowQuickMeetingDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4" />
                Start Meeting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Team Meeting</DialogTitle>
                <DialogDescription>
                  Start an instant video meeting with your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full-title">Meeting Title</Label>
                  <Input
                    id="full-title"
                    value={quickMeetingTitle}
                    onChange={(e) => setQuickMeetingTitle(e.target.value)}
                    placeholder="e.g., Team Standup"
                  />
                </div>
                <div>
                  <Label htmlFor="full-description">Description (Optional)</Label>
                  <Textarea
                    id="full-description"
                    value={quickMeetingDescription}
                    onChange={(e) => setQuickMeetingDescription(e.target.value)}
                    placeholder="Meeting agenda or notes..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowQuickMeetingDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleQuickMeeting} disabled={!quickMeetingTitle.trim()}>
                    Start Meeting
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => router.push('/dashboard/video-call')}>
            Full Dashboard
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMeetings || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.upcomingMeetings || 0} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meeting Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMeetingTime || 0}m</div>
            <p className="text-xs text-muted-foreground">
              Avg: {stats?.averageMeetingDuration || 0}m
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participation</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.participationRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Team engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frequency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{stats?.meetingFrequency || 'None'}</div>
            <p className="text-xs text-muted-foreground">
              Meeting pattern
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Team Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingMeetings.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming meetings</p>
              <p className="text-sm">Schedule a meeting to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getMeetingTypeIcon(meeting.meetingType)}
                    <div>
                      <h4 className="font-medium">{meeting.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {meeting.scheduledAt && format(meeting.scheduledAt, 'MMM d, yyyy h:mm a')}
                      </p>
                      {meeting.description && (
                        <p className="text-sm text-muted-foreground mt-1">{meeting.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getMeetingTypeColor(meeting.meetingType)}>
                      {meeting.meetingType.replace('team_', '').replace('_', ' ')}
                    </Badge>
                    <Button onClick={() => handleJoinMeeting(meeting.id)}>
                      Join Meeting
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}