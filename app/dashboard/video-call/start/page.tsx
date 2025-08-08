'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Video, Users, Clock, Settings, Copy, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';

export default function StartMeetingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [meetingData, setMeetingData] = useState({
    title: '',
    description: '',
    maxParticipants: 10,
    enableRecording: false,
    enableChat: true,
    enableScreenShare: true
  });

  // Generate a unique meeting ID
  const generateMeetingId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const [meetingId] = useState(generateMeetingId());

  const handleStartMeeting = async () => {
    if (!meetingData.title.trim()) {
      toast({
        title: 'Meeting Title Required',
        description: 'Please enter a title for your meeting.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create meeting URL with parameters
      const meetingUrl = `/dashboard/video-call?channel=${meetingId}&title=${encodeURIComponent(meetingData.title)}&host=${user?.uid}`;
      
      // Navigate to the meeting room
      router.push(meetingUrl);
      
      toast({
        title: 'Meeting Started',
        description: 'Redirecting to your meeting room...',
      });
    } catch (error) {
      console.error('Error starting meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to start meeting. Please try again.',
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

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Start New Meeting</h1>
        <p className="text-muted-foreground">Create an instant video meeting and invite participants</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Meeting Setup */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Meeting Details
              </CardTitle>
              <CardDescription>
                Configure your meeting settings and preferences
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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleStartMeeting}
                  disabled={isLoading || !meetingData.title.trim()}
                  className="flex-1"
                  size="lg"
                >
                  <Video className="h-4 w-4 mr-2" />
                  {isLoading ? 'Starting...' : 'Start Meeting Now'}
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

        {/* Meeting Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Meeting Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Host</span>
                  <Badge variant="secondary">{user?.displayName || user?.email}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Workspace</span>
                  <Badge variant="outline">{currentWorkspace?.name}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Max Participants</span>
                  <Badge>{meetingData.maxParticipants}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Meeting Type</span>
                  <Badge variant="secondary">Instant</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Video & Audio</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Screen Sharing</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Chat</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Recording</span>
                  <Badge variant="outline">Available</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Share the meeting link with participants</p>
                <p>• Test your camera and microphone before starting</p>
                <p>• Use a stable internet connection</p>
                <p>• Enable notifications for better experience</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}