'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Video, 
  Phone, 
  Users, 
  Calendar,
  Clock,
  Copy,
  ExternalLink,
  Settings,
  Mic,
  MicOff,
  VideoOff,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { generateMeetingChannelName } from '@/lib/video-call-utils';

interface VideoCallLauncherProps {
  // Quick start props
  channelName?: string;
  meetingTitle?: string;
  participants?: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  }[];
  
  // Integration props
  interviewId?: string;
  teamId?: string;
  eventId?: string;
  
  // UI props
  variant?: 'button' | 'card' | 'inline';
  size?: 'sm' | 'lg' | 'default';
  showPreview?: boolean;
}

export default function VideoCallLauncher({
  channelName,
  meetingTitle,
  participants = [],
  interviewId,
  teamId,
  eventId,
  variant = 'button',
  size = 'default',
  showPreview = false
}: VideoCallLauncherProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deviceSettings, setDeviceSettings] = useState({
    camera: true,
    microphone: true
  });

  // Generate meeting details
  const generateMeetingDetails = () => {
    const generatedChannelName = channelName || generateMeetingChannelName();
    const generatedTitle = meetingTitle || 
      (interviewId ? 'Interview Call' : 
       teamId ? 'Team Meeting' : 
       eventId ? 'Scheduled Meeting' : 
       'Video Call');

    return {
      channelName: generatedChannelName,
      title: generatedTitle,
      appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || 'demo-app-id',
      // In production, generate token server-side
      token: undefined
    };
  };

  const handleStartCall = () => {
    const meeting = generateMeetingDetails();
    
    // Construct URL with meeting parameters
    const params = new URLSearchParams({
      channel: meeting.channelName,
      title: meeting.title,
      appId: meeting.appId
    });
    
    if (meeting.token) {
      params.set('token', meeting.token);
    }
    if (interviewId) {
      params.set('interview', interviewId);
    }
    if (teamId) {
      params.set('team', teamId);
    }
    if (eventId) {
      params.set('event', eventId);
    }

    // Navigate to video call room
    router.push(`/dashboard/video-call?${params.toString()}`);
  };

  const handleCopyMeetingLink = () => {
    const meeting = generateMeetingDetails();
    const meetingUrl = `${window.location.origin}/join-call/${meeting.channelName}`;
    
    navigator.clipboard.writeText(meetingUrl);
    toast({
      title: 'Meeting Link Copied',
      description: 'Share this link with participants to join the call',
    });
  };

  const handleScheduleMeeting = () => {
    // Integration with calendar service
    toast({
      title: 'Schedule Meeting',
      description: 'Calendar integration coming soon',
    });
  };

  // Preview Dialog Component
  const PreviewDialog = () => (
    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Ready to Join Call?
          </DialogTitle>
          <DialogDescription>
            Check your camera and microphone settings before joining
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Camera Preview */}
          <div className="relative bg-gray-900 rounded-lg aspect-video overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              {deviceSettings.camera ? (
                <div className="text-center text-white">
                  <Video className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Camera preview</p>
                  <p className="text-xs text-gray-400">Camera access will be requested</p>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <VideoOff className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Camera disabled</p>
                </div>
              )}
            </div>
            
            {/* Preview Controls */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2">
              <Button
                variant={deviceSettings.camera ? "secondary" : "destructive"}
                size="sm"
                onClick={() => setDeviceSettings(prev => ({ ...prev, camera: !prev.camera }))}
                className="rounded-full w-8 h-8 p-0"
              >
                {deviceSettings.camera ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
              <Button
                variant={deviceSettings.microphone ? "secondary" : "destructive"}
                size="sm"
                onClick={() => setDeviceSettings(prev => ({ ...prev, microphone: !prev.microphone }))}
                className="rounded-full w-8 h-8 p-0"
              >
                {deviceSettings.microphone ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Meeting Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{participants.length + 1} participant{participants.length !== 0 ? 's' : ''}</span>
            </div>
            {meetingTitle && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{meetingTitle}</span>
              </div>
            )}
          </div>

          {/* Participants List */}
          {participants.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Participants</Label>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-2 text-sm">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback className="text-xs">
                        {participant.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>{participant.name}</span>
                    {participant.role && (
                      <Badge variant="secondary" className="text-xs">
                        {participant.role}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleStartCall} className="flex-1">
              <Video className="w-4 h-4 mr-2" />
              Join Call
            </Button>
            <Button variant="outline" onClick={handleCopyMeetingLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Render based on variant
  if (variant === 'card') {
    return (
      <>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setIsPreviewOpen(true)}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="w-5 h-5 text-primary" />
              {meetingTitle || 'Video Call'}
            </CardTitle>
            <CardDescription>
              {participants.length > 0 
                ? `${participants.length} participant${participants.length > 1 ? 's' : ''} invited`
                : 'Start a video call'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((participant) => (
                  <Avatar key={participant.id} className="w-8 h-8 border-2 border-background">
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback className="text-xs">
                      {participant.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {participants.length > 3 && (
                  <div className="w-8 h-8 bg-muted rounded-full border-2 border-background flex items-center justify-center">
                    <span className="text-xs font-medium">+{participants.length - 3}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  handleCopyMeetingLink();
                }}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={(e) => {
                  e.stopPropagation();
                  handleStartCall();
                }}>
                  <Video className="w-4 h-4 mr-2" />
                  Join
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {showPreview && <PreviewDialog />}
      </>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={showPreview ? () => setIsPreviewOpen(true) : handleStartCall}
          size={size}
          className="gap-2"
        >
          <Video className="w-4 h-4" />
          Start Call
        </Button>
        <Button
          variant="outline"
          size={size}
          onClick={handleCopyMeetingLink}
        >
          <Copy className="w-4 h-4" />
        </Button>
        {showPreview && <PreviewDialog />}
      </div>
    );
  }

  // Default button variant
  return (
    <>
      {showPreview ? (
        <Button
          onClick={() => setIsPreviewOpen(true)}
          size={size}
          className="gap-2"
        >
          <Video className="w-4 h-4" />
          {meetingTitle || 'Start Video Call'}
        </Button>
      ) : (
        <Button
          onClick={handleStartCall}
          size={size}
          className="gap-2"
        >
          <Video className="w-4 h-4" />
          {meetingTitle || 'Start Video Call'}
        </Button>
      )}
      {showPreview && <PreviewDialog />}
    </>
  );
}
