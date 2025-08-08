'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Users, Mail, Copy, Check, Plus, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';

export default function ScheduleMeetingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [meetingData, setMeetingData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '60',
    timezone: 'UTC',
    maxParticipants: 10,
    enableRecording: false,
    enableChat: true,
    enableScreenShare: true,
    requirePassword: false,
    password: '',
    sendInvites: true,
    participants: [] as string[]
  });

  const [newParticipant, setNewParticipant] = useState('');

  // Generate a unique meeting ID
  const generateMeetingId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const [meetingId] = useState(generateMeetingId());

  const addParticipant = () => {
    if (newParticipant.trim() && !meetingData.participants.includes(newParticipant.trim())) {
      setMeetingData(prev => ({
        ...prev,
        participants: [...prev.participants, newParticipant.trim()]
      }));
      setNewParticipant('');
    }
  };

  const removeParticipant = (email: string) => {
    setMeetingData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== email)
    }));
  };

  const handleScheduleMeeting = async () => {
    if (!meetingData.title.trim()) {
      toast({
        title: 'Meeting Title Required',
        description: 'Please enter a title for your meeting.',
        variant: 'destructive'
      });
      return;
    }

    if (!meetingData.date || !meetingData.time) {
      toast({
        title: 'Date and Time Required',
        description: 'Please select a date and time for your meeting.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Here you would typically save to your backend/database
      const scheduledMeeting = {
        id: meetingId,
        ...meetingData,
        hostId: user?.uid,
        hostName: user?.displayName || user?.email,
        workspaceId: currentWorkspace?.id,
        createdAt: new Date().toISOString(),
        status: 'scheduled'
      };

      console.log('Scheduled meeting:', scheduledMeeting);
      
      toast({
        title: 'Meeting Scheduled',
        description: `Meeting "${meetingData.title}" has been scheduled successfully.`,
      });

      // Redirect to meeting history or dashboard
      router.push('/dashboard/video-call/history');
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule meeting. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyMeetingLink = async () => {
    const meetingUrl = `${window.location.origin}/dashboard/video-call?channel=${meetingId}&title=${encodeURIComponent(meetingData.title)}`;
    
    try {
      await navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      toast({
        title: 'Link Copied',
        description: 'Meeting link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy meeting link',
        variant: 'destructive'
      });
    }
  };

  const formatDateTime = () => {
    if (meetingData.date && meetingData.time) {
      const dateTime = new Date(`${meetingData.date}T${meetingData.time}`);
      return dateTime.toLocaleString();
    }
    return 'Not set';
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Schedule Meeting</h1>
        <p className="text-muted-foreground">Plan and schedule a future video meeting with participants</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Scheduling Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Meeting Details
              </CardTitle>
              <CardDescription>
                Configure your meeting information and schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter meeting title..."
                  value={meetingData.title}
                  onChange={(e) => setMeetingData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add meeting agenda or description..."
                  value={meetingData.description}
                  onChange={(e) => setMeetingData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={meetingData.date}
                    onChange={(e) => setMeetingData(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={meetingData.time}
                    onChange={(e) => setMeetingData(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select value={meetingData.duration} onValueChange={(value) => setMeetingData(prev => ({ ...prev, duration: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="participants">Max Participants</Label>
                  <Input
                    id="participants"
                    type="number"
                    min="2"
                    max="50"
                    value={meetingData.maxParticipants}
                    onChange={(e) => setMeetingData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 10 }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Meeting ID</Label>
                  <div className="flex items-center gap-2">
                    <Input value={meetingId} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyMeetingLink}
                      className="shrink-0"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Participants
              </CardTitle>
              <CardDescription>
                Add participants who will receive meeting invitations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address..."
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                  className="flex-1"
                />
                <Button onClick={addParticipant} disabled={!newParticipant.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {meetingData.participants.length > 0 && (
                <div className="space-y-2">
                  <Label>Invited Participants ({meetingData.participants.length})</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {meetingData.participants.map((email, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <span className="text-sm">{email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParticipant(email)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meeting Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Meeting Settings</CardTitle>
              <CardDescription>
                Configure meeting features and security options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableRecording"
                      checked={meetingData.enableRecording}
                      onCheckedChange={(checked) => setMeetingData(prev => ({ ...prev, enableRecording: !!checked }))}
                    />
                    <Label htmlFor="enableRecording">Enable Recording</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableChat"
                      checked={meetingData.enableChat}
                      onCheckedChange={(checked) => setMeetingData(prev => ({ ...prev, enableChat: !!checked }))}
                    />
                    <Label htmlFor="enableChat">Enable Chat</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableScreenShare"
                      checked={meetingData.enableScreenShare}
                      onCheckedChange={(checked) => setMeetingData(prev => ({ ...prev, enableScreenShare: !!checked }))}
                    />
                    <Label htmlFor="enableScreenShare">Enable Screen Sharing</Label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requirePassword"
                      checked={meetingData.requirePassword}
                      onCheckedChange={(checked) => setMeetingData(prev => ({ ...prev, requirePassword: !!checked }))}
                    />
                    <Label htmlFor="requirePassword">Require Password</Label>
                  </div>
                  
                  {meetingData.requirePassword && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Meeting Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password..."
                        value={meetingData.password}
                        onChange={(e) => setMeetingData(prev => ({ ...prev, password: e.target.value }))}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendInvites"
                      checked={meetingData.sendInvites}
                      onCheckedChange={(checked) => setMeetingData(prev => ({ ...prev, sendInvites: !!checked }))}
                    />
                    <Label htmlFor="sendInvites">Send Email Invitations</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Meeting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleScheduleMeeting}
                  disabled={isLoading || !meetingData.title.trim() || !meetingData.date || !meetingData.time}
                  className="flex-1"
                  size="lg"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {isLoading ? 'Scheduling...' : 'Schedule Meeting'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={copyMeetingLink}
                  disabled={!meetingData.title.trim()}
                  className="flex-1"
                  size="lg"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Meeting Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meeting Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Meeting Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Title</span>
                  <p className="font-medium">{meetingData.title || 'Not set'}</p>
                </div>
                
                <div>
                  <span className="text-sm text-muted-foreground">Date & Time</span>
                  <p className="font-medium">{formatDateTime()}</p>
                </div>
                
                <div>
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <p className="font-medium">{meetingData.duration} minutes</p>
                </div>
                
                <div>
                  <span className="text-sm text-muted-foreground">Host</span>
                  <Badge variant="secondary">{user?.displayName || user?.email}</Badge>
                </div>
                
                <div>
                  <span className="text-sm text-muted-foreground">Participants</span>
                  <Badge>{meetingData.participants.length} invited</Badge>
                </div>
                
                <div>
                  <span className="text-sm text-muted-foreground">Max Participants</span>
                  <Badge variant="outline">{meetingData.maxParticipants}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features Enabled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Recording</span>
                  <Badge variant={meetingData.enableRecording ? 'secondary' : 'outline'}>
                    {meetingData.enableRecording ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Chat</span>
                  <Badge variant={meetingData.enableChat ? 'secondary' : 'outline'}>
                    {meetingData.enableChat ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Screen Sharing</span>
                  <Badge variant={meetingData.enableScreenShare ? 'secondary' : 'outline'}>
                    {meetingData.enableScreenShare ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Password</span>
                  <Badge variant={meetingData.requirePassword ? 'secondary' : 'outline'}>
                    {meetingData.requirePassword ? 'Required' : 'Not Required'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Invites</span>
                  <Badge variant={meetingData.sendInvites ? 'secondary' : 'outline'}>
                    {meetingData.sendInvites ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduling Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Schedule meetings at least 15 minutes in advance</p>
                <p>• Consider participant&apos;s time zones</p>
                <p>• Add a clear agenda in the description</p>
                <p>• Test your setup before important meetings</p>
                <p>• Send calendar invites for better attendance</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}