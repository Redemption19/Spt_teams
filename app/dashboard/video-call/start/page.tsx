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
import { generateChannelName, sanitizeChannelName } from '@/lib/video-call-utils';

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

  // Generate a unique meeting ID using proper channel name generation
  const generateMeetingId = () => {
    const generatedId = generateChannelName('meeting');
    // Ensure it's properly sanitized
    const sanitizedId = sanitizeChannelName(generatedId);
    console.log('🔍 Meeting ID Generation:', {
      generated: generatedId,
      sanitized: sanitizedId,
      changed: generatedId !== sanitizedId
    });
    return sanitizedId;
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
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Start New Meeting</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Create an instant video meeting and invite participants</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Meeting Setup */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
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
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Meeting Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter meeting title..."
                  value={meetingData.title}
                  onChange={(e) => setMeetingData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full h-10 sm:h-11 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add meeting agenda or description..."
                  value={meetingData.description}
                  onChange={(e) => setMeetingData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full min-h-[80px] sm:min-h-[100px] text-base resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="participants" className="text-sm font-medium">Max Participants</Label>
                  <Input
                    id="participants"
                    type="number"
                    min="2"
                    max="50"
                    value={meetingData.maxParticipants}
                    onChange={(e) => setMeetingData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 10 }))}
                    className="h-10 sm:h-11 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Meeting ID</Label>
                  <div className="flex items-center gap-2">
                    <Input value={meetingId} readOnly className="font-mono text-sm h-10 sm:h-11 flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyMeetingLink}
                      className="shrink-0 h-10 w-10 sm:h-11 sm:w-11 p-0"
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
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleStartMeeting}
                  disabled={isLoading || !meetingData.title.trim()}
                  className="w-full h-12 sm:h-14 text-base font-medium"
                  size="lg"
                >
                  <Video className="h-5 w-5 mr-2" />
                  {isLoading ? 'Starting...' : 'Start Meeting Now'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={copyMeetingLink}
                  disabled={!meetingData.title.trim()}
                  className="w-full h-12 sm:h-14 text-base font-medium"
                  size="lg"
                >
                  <Copy className="h-5 w-5 mr-2" />
                  Copy Meeting Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meeting Info Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Meeting Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground flex-shrink-0">Host</span>
                  <Badge variant="secondary" className="text-xs truncate max-w-[150px]">{user?.displayName || user?.email}</Badge>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground flex-shrink-0">Workspace</span>
                  <Badge variant="outline" className="text-xs truncate max-w-[150px]">{currentWorkspace?.name}</Badge>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground flex-shrink-0">Max Participants</span>
                  <Badge className="text-xs">{meetingData.maxParticipants}</Badge>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground flex-shrink-0">Meeting Type</span>
                  <Badge variant="secondary" className="text-xs">Instant</Badge>
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
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm flex-shrink-0">Video & Audio</span>
                  <Badge variant="secondary" className="text-xs">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm flex-shrink-0">Screen Sharing</span>
                  <Badge variant="secondary" className="text-xs">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm flex-shrink-0">Chat</span>
                  <Badge variant="secondary" className="text-xs">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm flex-shrink-0">Recording</span>
                  <Badge variant="outline" className="text-xs">Available</Badge>
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
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Share the meeting link with participants</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Test your camera and microphone before starting</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Use a stable internet connection</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Enable notifications for better experience</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}