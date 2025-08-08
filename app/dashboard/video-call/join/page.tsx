'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Phone, Video, Link2, Users, Clock, AlertCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { validateChannelName, sanitizeChannelName } from '@/lib/video-call-utils';

export default function JoinMeetingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [joinData, setJoinData] = useState({
    meetingId: '',
    meetingUrl: '',
    displayName: user?.displayName || user?.email || ''
  });

  // Recent meetings (mock data - would come from API)
  const recentMeetings = [
    {
      id: 'abc123def456',
      title: 'Team Standup',
      host: 'John Doe',
      time: '2 hours ago',
      participants: 5,
      status: 'ended'
    },
    {
      id: 'xyz789uvw012',
      title: 'Project Review',
      host: 'Jane Smith',
      time: '1 day ago',
      participants: 8,
      status: 'ended'
    },
    {
      id: 'mno345pqr678',
      title: 'Client Presentation',
      host: 'Mike Johnson',
      time: '3 days ago',
      participants: 12,
      status: 'ended'
    }
  ];

  const extractMeetingIdFromUrl = (url: string) => {
    try {
      // If the URL doesn't start with http/https, it might already be a meeting ID
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return url;
      }
      
      const urlObj = new URL(url);
      const channel = urlObj.searchParams.get('channel');
      return channel || '';
    } catch {
      // If URL parsing fails, try to extract channel parameter manually
      const channelMatch = url.match(/[?&]channel=([^&]+)/);
      return channelMatch ? decodeURIComponent(channelMatch[1]) : '';
    }
  };

  const handleJoinMeeting = async () => {
    let meetingId = joinData.meetingId.trim();
    
    // If user pasted a URL, extract the meeting ID
    if (joinData.meetingUrl.trim()) {
      meetingId = extractMeetingIdFromUrl(joinData.meetingUrl);
    } else if (joinData.meetingId.trim().includes('http')) {
      // If the meeting ID field contains a URL, extract from it
      meetingId = extractMeetingIdFromUrl(joinData.meetingId.trim());
    }

    console.log('🔍 Join Meeting Debug:', {
      originalMeetingId: joinData.meetingId,
      extractedMeetingId: meetingId,
      meetingUrl: joinData.meetingUrl,
      isUrl: joinData.meetingId.includes('http') || joinData.meetingUrl.includes('http')
    });

    if (!meetingId) {
      toast({
        title: 'Meeting ID Required',
        description: 'Please enter a valid meeting ID or URL.',
        variant: 'destructive'
      });
      return;
    }

    // Additional validation for extracted meeting ID
    if (meetingId.length > 64) {
      toast({
        title: 'Invalid Meeting ID',
        description: 'The extracted meeting ID is too long. Please check the meeting link and try again.',
        variant: 'destructive'
      });
      return;
    }

    // Validate and sanitize the channel name
    const validation = validateChannelName(meetingId);
    console.log('🔍 Meeting ID Validation:', {
      meetingId,
      isValid: validation.isValid,
      errors: validation.errors,
      length: meetingId.length
    });
    
    if (!validation.isValid) {
      toast({
        title: 'Invalid Meeting ID',
        description: `The meeting ID contains invalid characters. ${validation.errors.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    // Sanitize the channel name to ensure it's safe
    const sanitizedMeetingId = sanitizeChannelName(meetingId);
    console.log('🔍 Meeting ID Sanitization:', {
      original: meetingId,
      sanitized: sanitizedMeetingId,
      changed: meetingId !== sanitizedMeetingId
    });

    setIsLoading(true);
    
    try {
      // Create meeting URL with parameters
      const meetingUrl = `/dashboard/video-call?channel=${sanitizedMeetingId}&participant=${user?.uid}&name=${encodeURIComponent(joinData.displayName)}`;
      
      // Navigate to the meeting room
      router.push(meetingUrl);
      
      toast({
        title: 'Joining Meeting',
        description: 'Connecting to the meeting room...',
      });
    } catch (error) {
      console.error('Error joining meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to join meeting. Please check the meeting ID and try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRecentMeeting = (meeting: any) => {
    setJoinData(prev => ({ ...prev, meetingId: meeting.id }));
    // Auto-join if it's a recent meeting
    const sanitizedMeetingId = sanitizeChannelName(meeting.id);
    const meetingUrl = `/dashboard/video-call?channel=${sanitizedMeetingId}&participant=${user?.uid}&name=${encodeURIComponent(joinData.displayName)}`;
    router.push(meetingUrl);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Join Meeting</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Enter a meeting ID or paste a meeting link to join</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Join Form */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Join Meeting
              </CardTitle>
              <CardDescription>
                Enter the meeting details to join an ongoing video call
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium">Your Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Enter your name..."
                  value={joinData.displayName}
                  onChange={(e) => setJoinData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full h-10 sm:h-11 text-base"
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meetingId" className="text-sm font-medium">Meeting ID or Link</Label>
                  <Input
                    id="meetingId"
                    placeholder="Enter meeting ID or paste the full meeting link..."
                    value={joinData.meetingId}
                    onChange={(e) => setJoinData(prev => ({ ...prev, meetingId: e.target.value, meetingUrl: '' }))}
                    className="w-full h-10 sm:h-11 text-base font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can enter just the meeting ID (e.g., meeting-12345678-abc123) or paste the full meeting link
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="text-sm text-muted-foreground">OR</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="meetingUrl" className="text-sm font-medium">Meeting URL</Label>
                  <Input
                    id="meetingUrl"
                    placeholder="Paste meeting URL here..."
                    value={joinData.meetingUrl}
                    onChange={(e) => setJoinData(prev => ({ ...prev, meetingUrl: e.target.value, meetingId: '' }))}
                    className="w-full h-10 sm:h-11 text-base"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Join Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Join Options</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleJoinMeeting}
                  disabled={isLoading || (!joinData.meetingId.trim() && !joinData.meetingUrl.trim()) || !joinData.displayName.trim()}
                  className="flex-1 h-12 sm:h-14 text-base font-medium"
                  size="lg"
                >
                  <Video className="h-5 w-5 mr-2" />
                  {isLoading ? 'Joining...' : 'Join Meeting'}
                </Button>
              </div>
              
              {(!joinData.displayName.trim() || (!joinData.meetingId.trim() && !joinData.meetingUrl.trim())) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    {!joinData.displayName.trim() 
                      ? 'Please enter your display name'
                      : 'Please enter a meeting ID or URL'
                    }
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Meetings
              </CardTitle>
              <CardDescription>
                Quickly rejoin recent meetings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              <div className="space-y-3">
                {recentMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors touch-manipulation">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{meeting.title}</h4>
                        <Badge variant="outline" className="text-xs">{meeting.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Host: {meeting.host}</span>
                        <span>{meeting.time}</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {meeting.participants}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleJoinRecentMeeting(meeting)}
                      disabled={!joinData.displayName.trim()}
                      className="ml-2 flex-shrink-0"
                    >
                      <Link2 className="h-3 w-3 mr-1" />
                      Rejoin
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Join Info Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Participant Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground flex-shrink-0">Name</span>
                  <Badge variant="secondary" className="text-xs truncate max-w-[150px]">{joinData.displayName || 'Not set'}</Badge>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground flex-shrink-0">Email</span>
                  <Badge variant="outline" className="text-xs truncate max-w-[150px]">{user?.email}</Badge>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground flex-shrink-0">Workspace</span>
                  <Badge variant="outline" className="text-xs truncate max-w-[150px]">{currentWorkspace?.name}</Badge>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground flex-shrink-0">Role</span>
                  <Badge className="text-xs">Participant</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meeting Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Ensure your camera and microphone are working</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Join with a stable internet connection</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Mute yourself when not speaking</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Use the chat for questions during presentations</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Be respectful of other participants</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Having trouble joining? Contact the meeting host or check your meeting invitation for the correct details.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Get Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}