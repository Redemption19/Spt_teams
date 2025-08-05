'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  PhoneOff,
  Settings,
  Users,
  MessageSquare,
  ScreenShare,
  Volume2,
  VolumeX,
  Monitor,
  Maximize2,
  Grid3x3,
  Timer,
  SignalHigh,
  SignalMedium,
  SignalLow
} from 'lucide-react';
import { useVideoCall } from '@/hooks/use-video-call';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

interface VideoCallRoomProps {
  channelName: string;
  appId: string;
  token?: string;
  onCallEnd?: () => void;
  participants?: { 
    id: string;
    name: string; 
    avatar?: string; 
    role?: string;
  }[];
  meetingTitle?: string;
  showControls?: boolean;
  autoJoin?: boolean;
}

interface RemoteVideoElement {
  uid: string | number;
  element: HTMLDivElement;
}

export default function VideoCallRoom({
  channelName,
  appId,
  token,
  onCallEnd,
  participants: participantData = [],
  meetingTitle,
  showControls = true,
  autoJoin = true
}: VideoCallRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLDivElement>(null);
  const [remoteVideoElements, setRemoteVideoElements] = useState<Map<string | number, HTMLDivElement>>(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedVideoLayout, setSelectedVideoLayout] = useState<'grid' | 'speaker' | 'gallery'>('grid');
  const [connectionQuality, setConnectionQuality] = useState<'high' | 'medium' | 'low'>('high');
  
  const {
    isInCall,
    isConnecting,
    isMuted,
    isCameraOff,
    participants,
    error,
    connectionState,
    callDuration,
    participantCount,
    startCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
    getLocalVideoTrack,
    formatCallDuration,
    isVideoServiceAvailable
  } = useVideoCall({ 
    onCallEnd: (stats) => {
      console.log('Call ended with stats:', stats);
      onCallEnd?.();
    },
    onError: (error) => {
      console.error('Video call error:', error);
    }
  });

  // Auto-start call when component mounts
  useEffect(() => {
    if (autoJoin && isVideoServiceAvailable && !isInCall && !isConnecting && appId && channelName) {
      startCall({
        appId,
        channel: channelName,
        token
      });
    }
  }, [appId, channelName, token, startCall, isInCall, isConnecting, autoJoin, isVideoServiceAvailable]);

  // Handle local video rendering
  useEffect(() => {
    if (isInCall && localVideoRef.current && !isCameraOff) {
      const localTrack = getLocalVideoTrack();
      if (localTrack) {
        try {
          localTrack.play(localVideoRef.current);
        } catch (error) {
          console.error('Failed to play local video:', error);
        }
      }
    }
  }, [isInCall, isCameraOff, getLocalVideoTrack]);

  // Handle remote video rendering
  useEffect(() => {
    const handleRemoteVideoAdded = (event: CustomEvent) => {
      const { user: remoteUser, videoTrack } = event.detail;
      
      // Create video container
      const videoContainer = document.createElement('div');
      videoContainer.id = `remote-video-${remoteUser.uid}`;
      videoContainer.className = 'w-full h-full rounded-lg bg-gray-900 overflow-hidden';
      
      // Add to remote videos container
      const remoteContainer = document.getElementById('remote-videos-container');
      if (remoteContainer && videoTrack) {
        // Create wrapper card
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'relative bg-gray-800 rounded-lg overflow-hidden aspect-video';
        cardWrapper.appendChild(videoContainer);
        
        // Add participant info overlay
        const infoOverlay = document.createElement('div');
        infoOverlay.className = 'absolute bottom-2 left-2 right-2 flex items-center justify-between';
        infoOverlay.innerHTML = `
          <div class="px-2 py-1 bg-black/50 rounded text-white text-xs font-medium">
            User ${remoteUser.uid}
          </div>
        `;
        cardWrapper.appendChild(infoOverlay);
        
        remoteContainer.appendChild(cardWrapper);
        
        try {
          videoTrack.play(videoContainer);
          setRemoteVideoElements(prev => new Map(prev.set(remoteUser.uid, videoContainer)));
        } catch (error) {
          console.error('Failed to play remote video:', error);
        }
      }
    };

    const handleRemoteVideoRemoved = (event: CustomEvent) => {
      const { user: remoteUser } = event.detail;
      const videoElement = document.getElementById(`remote-video-${remoteUser.uid}`);
      if (videoElement?.parentElement) {
        videoElement.parentElement.remove();
        setRemoteVideoElements(prev => {
          const newMap = new Map(prev);
          newMap.delete(remoteUser.uid);
          return newMap;
        });
      }
    };

    // Connection quality monitoring
    const handleConnectionStateChange = (event: CustomEvent) => {
      const { currentState } = event.detail;
      switch (currentState) {
        case 'CONNECTED':
          setConnectionQuality('high');
          break;
        case 'RECONNECTING':
          setConnectionQuality('medium');
          break;
        case 'FAILED':
          setConnectionQuality('low');
          break;
      }
    };

    window.addEventListener('remote-video-added', handleRemoteVideoAdded as EventListener);
    window.addEventListener('remote-video-removed', handleRemoteVideoRemoved as EventListener);
    window.addEventListener('connection-state-change', handleConnectionStateChange as EventListener);

    return () => {
      window.removeEventListener('remote-video-added', handleRemoteVideoAdded as EventListener);
      window.removeEventListener('remote-video-removed', handleRemoteVideoRemoved as EventListener);
      window.removeEventListener('connection-state-change', handleConnectionStateChange as EventListener);
    };
  }, []);

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'm':
            event.preventDefault();
            toggleMicrophone();
            break;
          case 'e':
            event.preventDefault();
            toggleCamera();
            break;
          case 'f':
            event.preventDefault();
            toggleFullscreen();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleMicrophone, toggleCamera]);

  const getConnectionQualityIcon = () => {
    switch (connectionQuality) {
      case 'high': return <SignalHigh className="w-4 h-4 text-green-500" />;
      case 'medium': return <SignalMedium className="w-4 h-4 text-yellow-500" />;
      case 'low': return <SignalLow className="w-4 h-4 text-red-500" />;
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <PhoneOff className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Call Failed</h3>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry Connection
            </Button>
            <Button variant="outline" onClick={onCallEnd} className="w-full">
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Connecting state
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <div className="text-primary mb-4">
            <Phone className="w-16 h-16 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold">Connecting...</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Joining {meetingTitle || channelName}
            </p>
          </div>
          <div className="animate-pulse flex space-x-2 justify-center">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <div className="w-2 h-2 bg-primary rounded-full"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-3 sm:p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-green-500 text-white px-2 py-1">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
            Live
          </Badge>
          <div className="hidden sm:block">
            <h2 className="text-white font-medium text-sm sm:text-base">
              {meetingTitle || channelName}
            </h2>
            <p className="text-gray-400 text-xs">
              {formatCallDuration()} • {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-white">
          {getConnectionQualityIcon()}
          <div className="hidden sm:flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <span className="text-sm font-mono">{formatCallDuration()}</span>
          </div>
          <Users className="w-4 h-4" />
          <span className="text-sm">{participantCount}</span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-2 sm:p-4">
        <div className={cn(
          "h-full grid gap-2 sm:gap-4",
          selectedVideoLayout === 'grid' && [
            "grid-cols-1",
            participantCount > 1 && "md:grid-cols-2",
            participantCount > 4 && "lg:grid-cols-3",
            participantCount > 6 && "xl:grid-cols-4"
          ],
          selectedVideoLayout === 'gallery' && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        )}>
          
          {/* Local Video */}
          <Card className="relative overflow-hidden bg-gray-800 aspect-video">
            <div 
              ref={localVideoRef}
              className={cn(
                "w-full h-full rounded-lg",
                isCameraOff ? "bg-gray-700 flex items-center justify-center" : ""
              )}
            >
              {isCameraOff && (
                <div className="text-center text-white">
                  <Avatar className="w-16 h-16 mx-auto mb-2">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback>
                      {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm">Camera Off</p>
                </div>
              )}
            </div>
            
            {/* Local Video Overlay */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <Badge variant="secondary" className="text-xs bg-black/50 border-0 text-white">
                You {isMuted && <MicOff className="w-3 h-3 ml-1" />}
              </Badge>
              {!isCameraOff && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70"
                  onClick={toggleFullscreen}
                >
                  <Maximize2 className="w-3 h-3 text-white" />
                </Button>
              )}
            </div>
          </Card>

          {/* Remote Videos Container */}
          <div id="remote-videos-container" className="contents">
            {/* Remote video elements will be dynamically added here */}
          </div>

          {/* Empty slots for better grid layout */}
          {Array.from({ length: Math.max(0, 6 - participants.length - 1) }).map((_, index) => (
            <Card key={`empty-${index}`} className="aspect-video bg-gray-800/30 border-dashed border-gray-600 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs sm:text-sm">Waiting for participant</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="bg-gray-800 p-3 sm:p-4 border-t border-gray-700">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {/* Microphone Toggle */}
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              onClick={toggleMicrophone}
              className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0"
              title={`${isMuted ? 'Unmute' : 'Mute'} microphone (Ctrl+M)`}
            >
              {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>

            {/* Camera Toggle */}
            <Button
              variant={isCameraOff ? "destructive" : "secondary"}
              size="lg"
              onClick={toggleCamera}
              className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0"
              title={`${isCameraOff ? 'Turn on' : 'Turn off'} camera (Ctrl+E)`}
            >
              {isCameraOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>

            {/* End Call */}
            <Button
              variant="destructive"
              size="lg"
              onClick={endCall}
              className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0"
              title="End call"
            >
              <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            {/* Additional Controls */}
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden sm:flex"
              title="Screen share (Coming soon)"
              disabled
            >
              <ScreenShare className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden sm:flex"
              title="Chat (Coming soon)"
              disabled
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            {/* Layout Toggle */}
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setSelectedVideoLayout(prev => 
                prev === 'grid' ? 'gallery' : 'grid'
              )}
              className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden lg:flex"
              title="Change layout"
            >
              <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
          
          {/* Keyboard shortcuts hint */}
          <div className="text-center mt-2 hidden sm:block">
            <p className="text-xs text-gray-400">
              Shortcuts: Ctrl+M (mute), Ctrl+E (camera), Ctrl+F (fullscreen)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
