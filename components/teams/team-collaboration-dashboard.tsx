'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTeamCollaboration } from '@/hooks/use-team-collaboration';
import { TeamMeeting, TeamCommunicationChannel } from '@/lib/team-collaboration-service';
import { Team } from '@/lib/types';
import { 
  Video, 
  Calendar, 
  Users, 
  Clock, 
  MessageSquare, 
  Plus, 
  Play, 
  Square, 
  Settings,
  TrendingUp,
  Activity,
  Hash,
  Lock,
  Globe
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface TeamCollaborationDashboardProps {
  team: Team;
  className?: string;
}

export default function TeamCollaborationDashboard({ team, className }: TeamCollaborationDashboardProps) {
  const router = useRouter();
  const {
    meetings,
    upcomingMeetings,
    stats,
    channels,
    loading,
    startInstantMeeting,
    scheduleMeeting,
    endMeeting,
    joinMeeting,
    createChannel
  } = useTeamCollaboration(team.id);

  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showChannelDialog, setShowChannelDialog] = useState(false);
  const [showInstantMeetingDialog, setShowInstantMeetingDialog] = useState(false);

  // Instant meeting form
  const [instantMeetingTitle, setInstantMeetingTitle] = useState('');
  const [instantMeetingDescription, setInstantMeetingDescription] = useState('');

  // Schedule meeting form
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    meetingType: 'team_standup' as TeamMeeting['meetingType'],
    duration: 60
  });

  // Channel form
  const [channelForm, setChannelForm] = useState({
    name: '',
    description: '',
    type: 'general' as TeamCommunicationChannel['type'],
    isPrivate: false
  });

  const handleStartInstantMeeting = async () => {
    if (!instantMeetingTitle.trim()) return;

    const result = await startInstantMeeting(
      team.id,
      instantMeetingTitle,
      instantMeetingDescription
    );

    if (result) {
      setShowInstantMeetingDialog(false);
      setInstantMeetingTitle('');
      setInstantMeetingDescription('');
      
      // Navigate to video call room
      router.push(`/dashboard/video-call/join?channel=${result.channelName}&meeting=${result.meeting.id}`);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!scheduleForm.title.trim() || !scheduleForm.scheduledAt) return;

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
    }
  };

  const handleCreateChannel = async () => {
    if (!channelForm.name.trim()) return;

    const result = await createChannel(team.id, channelForm);

    if (result) {
      setShowChannelDialog(false);
      setChannelForm({
        name: '',
        description: '',
        type: 'general',
        isPrivate: false
      });
    }
  };

  const handleJoinMeeting = async (meetingId: string) => {
    const result = await joinMeeting(meetingId);
    if (result && result.channelName) {
      router.push(`/dashboard/video-call/join?channel=${result.channelName}&meeting=${meetingId}`);
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

  const getChannelIcon = (type: TeamCommunicationChannel['type']) => {
    switch (type) {
      case 'general': return <Hash className="h-4 w-4" />;
      case 'announcements': return <MessageSquare className="h-4 w-4" />;
      case 'project': return <Settings className="h-4 w-4" />;
      case 'social': return <Users className="h-4 w-4" />;
      default: return <Hash className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Team Collaboration
          </CardTitle>
          <CardDescription>
            Start meetings, schedule sessions, and manage team communication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Dialog open={showInstantMeetingDialog} onOpenChange={setShowInstantMeetingDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Start Meeting
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start Instant Team Meeting</DialogTitle>
                  <DialogDescription>
                    Start a video meeting with your team members right now
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="instant-title">Meeting Title</Label>
                    <Input
                      id="instant-title"
                      value={instantMeetingTitle}
                      onChange={(e) => setInstantMeetingTitle(e.target.value)}
                      placeholder="e.g., Daily Standup"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instant-description">Description (Optional)</Label>
                    <Textarea
                      id="instant-description"
                      value={instantMeetingDescription}
                      onChange={(e) => setInstantMeetingDescription(e.target.value)}
                      placeholder="Meeting agenda or notes..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowInstantMeetingDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleStartInstantMeeting} disabled={!instantMeetingTitle.trim()}>
                      Start Meeting
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule Meeting
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
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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

            <Dialog open={showChannelDialog} onOpenChange={setShowChannelDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Create Channel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Communication Channel</DialogTitle>
                  <DialogDescription>
                    Create a new channel for team communication
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="channel-name">Channel Name</Label>
                    <Input
                      id="channel-name"
                      value={channelForm.name}
                      onChange={(e) => setChannelForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., project-updates"
                    />
                  </div>
                  <div>
                    <Label htmlFor="channel-description">Description</Label>
                    <Textarea
                      id="channel-description"
                      value={channelForm.description}
                      onChange={(e) => setChannelForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What is this channel for?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="channel-type">Channel Type</Label>
                      <Select
                        value={channelForm.type}
                        onValueChange={(value) => setChannelForm(prev => ({ ...prev, type: value as TeamCommunicationChannel['type'] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="announcements">Announcements</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="channel-private"
                        checked={channelForm.isPrivate}
                        onCheckedChange={(checked) => setChannelForm(prev => ({ ...prev, isPrivate: checked }))}
                      />
                      <Label htmlFor="channel-private">Private Channel</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowChannelDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateChannel} disabled={!channelForm.name.trim()}>
                      Create Channel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {upcomingMeetings.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming meetings</p>
                  <p className="text-sm">Schedule a meeting to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getMeetingTypeIcon(meeting.meetingType)}
                        <div>
                          <h4 className="font-medium">{meeting.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {meeting.scheduledAt && format(meeting.scheduledAt, 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getMeetingTypeColor(meeting.meetingType)}>
                          {meeting.meetingType.replace('team_', '').replace('_', ' ')}
                        </Badge>
                        <Button size="sm" onClick={() => handleJoinMeeting(meeting.id)}>
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Communication Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Communication Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {channels.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No channels created</p>
                  <p className="text-sm">Create a channel to start communicating</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {channels.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getChannelIcon(channel.type)}
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {channel.name}
                            {channel.isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {channel.description || `${channel.type} channel`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {channel.members.length} members
                        </Badge>
                        <Button size="sm" variant="outline">
                          Open
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {meetings.filter(m => m.status === 'completed').length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No completed meetings</p>
                <p className="text-sm">Start your first team meeting</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings
                  .filter(m => m.status === 'completed')
                  .slice(0, 5)
                  .map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getMeetingTypeIcon(meeting.meetingType)}
                        <div>
                          <h4 className="font-medium">{meeting.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {meeting.startedAt && format(meeting.startedAt, 'MMM d, yyyy h:mm a')}
                            {meeting.startedAt && meeting.endedAt && (
                              <span className="ml-2">
                                • {Math.round((meeting.endedAt.getTime() - meeting.startedAt.getTime()) / 60000)}m
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getMeetingTypeColor(meeting.meetingType)}>
                          {meeting.meetingType.replace('team_', '').replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {meeting.participants.length} participants
                        </Badge>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}