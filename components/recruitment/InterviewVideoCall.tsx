'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff,
  Clock,
  User,
  Users,
  Award,
  MessageSquare,
  ScreenShare,
  Settings,
  Maximize2,
  Minimize2,
  Play,
  Pause
} from 'lucide-react';
import { useVideoCall } from '@/hooks/use-video-call';
import { Interview, Candidate } from '@/lib/recruitment-service';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import InterviewChat from './InterviewChat';
import InterviewScreenShare from './InterviewScreenShare';
import InterviewSettings, { InterviewSettings as SettingsType } from './InterviewSettings';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
}

interface InterviewVideoCallProps {
  interview: Interview;
  candidate: Candidate;
  channelName: string;
  onCallEnd?: (callData: { duration: number; feedback?: string }) => void;
  isInterviewer?: boolean;
}

export default function InterviewVideoCall({
  interview,
  candidate,
  channelName,
  onCallEnd,
  isInterviewer = false
}: InterviewVideoCallProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const hasStartedCall = useRef(false); // Prevent duplicate calls in React development mode
  const [isClient, setIsClient] = useState(false);
  
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  
  // New functionality state
  const [showChat, setShowChat] = useState(false);
  const [showScreenShare, setShowScreenShare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [sharedStream, setSharedStream] = useState<MediaStream | null>(null);
  const [callSettings, setCallSettings] = useState<SettingsType>({
    // Audio Settings
    microphoneDevice: '',
    speakerDevice: '',
    microphoneVolume: 100,
    speakerVolume: 100,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,

    // Video Settings
    cameraDevice: '',
    videoQuality: 'high',
    frameRate: 30,
    resolution: '1280x720',
    mirrorVideo: true,

    // Network Settings
    bandwidthLimit: 2000,
    enableAdaptiveBitrate: true,
    enableNetworkOptimization: true,

    // Interface Settings
    showParticipantNames: true,
    showConnectionQuality: true,
    enableKeyboardShortcuts: true,
    autoMuteOnJoin: false,
    autoCameraOffOnJoin: false,

    // Accessibility
    enableCaptions: false,
    highContrastMode: false,
    reduceMotion: false,
  });

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    isInCall,
    isConnecting,
    isMuted,
    isCameraOff,
    participants,
    error,
    isServiceInitialized,
    startCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
    pauseVideo,
    resumeVideo,
    isVideoPaused,
    getLocalVideoTrack
  } = useVideoCall({
    onCallEnd: () => {
      onCallEnd?.({ duration: callDuration, feedback });
    }
  });

  // Format call duration
  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Auto-start call when component mounts and service is initialized
  useEffect(() => {
    if (!isInCall && !isConnecting && isServiceInitialized && process.env.NEXT_PUBLIC_AGORA_APP_ID && !hasStartedCall.current) {
      hasStartedCall.current = true; // Mark as started to prevent duplicate calls
      
      startCall({
        appId: process.env.NEXT_PUBLIC_AGORA_APP_ID,
        channel: channelName,
        uid: user?.uid
      });
    } else if (!process.env.NEXT_PUBLIC_AGORA_APP_ID) {
      // App ID not configured
    }
  }, [startCall, channelName, user?.uid, isInCall, isConnecting, isServiceInitialized]);

  // Reset call started flag when component unmounts
  useEffect(() => {
    return () => {
      hasStartedCall.current = false;
    };
  }, []);

  // Update call duration every second
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInCall]);

  // Handle local video rendering
  useEffect(() => {
    if (isInCall && localVideoRef.current && !isCameraOff) {
      const localTrack = getLocalVideoTrack();
      if (localTrack) {
        localTrack.play(localVideoRef.current);
      }
    }
  }, [isInCall, isCameraOff, getLocalVideoTrack]);

  // Handle remote video rendering
  useEffect(() => {
    const handleRemoteVideoAdded = (event: CustomEvent) => {
      const { videoTrack } = event.detail;
      if (remoteVideoRef.current) {
        videoTrack.play(remoteVideoRef.current);
      }
    };

    const handleRemoteVideoRemoved = () => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.innerHTML = '';
      }
    };

    window.addEventListener('remote-video-added', handleRemoteVideoAdded as EventListener);
    window.addEventListener('remote-video-removed', handleRemoteVideoRemoved as EventListener);

    return () => {
      window.removeEventListener('remote-video-added', handleRemoteVideoAdded as EventListener);
      window.removeEventListener('remote-video-removed', handleRemoteVideoRemoved as EventListener);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when in call and not typing in input fields
      if (!isInCall || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case ' ': // Spacebar for pause/resume
          event.preventDefault();
          if (isVideoPaused()) {
            resumeVideo();
          } else {
            pauseVideo();
          }
          break;
        case 'm': // M for mute/unmute
          event.preventDefault();
          toggleMicrophone();
          break;
        case 'v': // V for video on/off
          event.preventDefault();
          toggleCamera();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isInCall, isVideoPaused, resumeVideo, pauseVideo, toggleMicrophone, toggleCamera]);

  // Chat functionality
  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: user?.uid || 'unknown',
      senderName: user?.displayName || 'You',
      message,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    
    // In a real implementation, you would send this message to other participants
    // For now, we'll just add it to the local chat
  };

  // Screen sharing functionality
  const handleStartScreenShare = (stream: MediaStream) => {
    setIsScreenSharing(true);
    setSharedStream(stream);
    setShowScreenShare(false);
    
    // Only notify when screen sharing starts (important for awareness)
    toast({
      title: 'Screen Sharing Active',
      description: 'Your screen is being shared with participants.',
    });
  };

  const handleStopScreenShare = () => {
    if (sharedStream) {
      sharedStream.getTracks().forEach(track => track.stop());
      setSharedStream(null);
    }
    setIsScreenSharing(false);
    
    // No notification needed when stopping - UI feedback is sufficient
  };

  // Settings functionality
  const handleSettingsChange = (newSettings: SettingsType) => {
    setCallSettings(newSettings);
    
    // Apply settings to video call
    // In a real implementation, you would apply these settings to the video service
    console.log('Applying new settings:', newSettings);
  };

  const handleEndCall = async () => {
    if (isInterviewer) {
      setShowFeedbackDialog(true);
    } else {
      await endCall();
    }
  };

  const handleFeedbackSubmit = async () => {
    await endCall();
    setShowFeedbackDialog(false);
  };

  if (error) {
    const isAuthError = error.includes('Authentication failed') || error.includes('CAN_NOT_GET_GATEWAY_SERVER');
    
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-destructive mb-4">
            <PhoneOff className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Interview Call Failed</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} className="mr-2">
            Retry
          </Button>
          <Button variant="outline" onClick={() => window.close()}>
            Close Window
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isConnecting) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-primary mb-4">
            <Video className="w-16 h-16 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold mb-2">Joining Interview</h3>
            <p className="text-muted-foreground">
              Connecting to {isInterviewer ? candidate.name : interview.interviewer}...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading screen until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading video call...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "h-screen bg-background flex flex-col",
        isFullscreen && "fixed inset-0 z-50"
      )}>
        {/* Header */}
        <div className="bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge 
            variant="secondary" 
            className="bg-primary/10 text-primary border-primary/20"
          >
            <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
            Interview in Progress
          </Badge>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatDuration(callDuration)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            <span>{participants.length + 1} participants</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={connectionQuality === 'excellent' ? 'default' : 'secondary'}>
            {connectionQuality}
          </Badge>
          
          <div className="text-xs text-muted-foreground hidden md:block">
            <span className="font-mono bg-muted px-2 py-1 rounded">Space</span> Pause • 
            <span className="font-mono bg-muted px-2 py-1 rounded ml-1">M</span> Mute • 
            <span className="font-mono bg-muted px-2 py-1 rounded ml-1">V</span> Video
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Interview Info Banner */}
      <div className="bg-muted/30 px-4 py-2 border-b">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{candidate.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>{interview.type} Interview</span>
            </div>
          </div>
          
          {isInterviewer && (
            <div className="text-muted-foreground">
              Experience: {candidate.experience} years
            </div>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Remote Video (Larger for interviewer view) */}
        <Card className="relative overflow-hidden aspect-video">
          <div 
            ref={remoteVideoRef}
            className="w-full h-full bg-muted/20 rounded-lg flex items-center justify-center"
          >
            {participants.length === 0 && (
              <div className="text-center text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-2" />
                <p>Waiting for {isInterviewer ? candidate.name : interview.interviewer}</p>
              </div>
            )}
          </div>
          
          {/* Remote Video Overlay */}
          {participants.length > 0 && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                {isInterviewer ? candidate.name : interview.interviewer}
              </Badge>
            </div>
          )}
        </Card>

        {/* Local Video */}
        <Card className="relative overflow-hidden aspect-video">
          <div 
            ref={localVideoRef}
            className={cn(
              "w-full h-full rounded-lg",
              isCameraOff ? "bg-muted/20 flex items-center justify-center" : ""
            )}
          >
            {isCameraOff && (
              <div className="text-center text-muted-foreground">
                <VideoOff className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Camera Off</p>
              </div>
            )}
          </div>
          
          {/* Pause Overlay */}
          {isVideoPaused() && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <Pause className="w-12 h-12 mx-auto mb-2" />
                <p className="text-lg font-medium">Video Paused</p>
                <p className="text-sm text-white/80">Click resume to continue</p>
              </div>
            </div>
          )}
          
          {/* Local Video Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
              You {isMuted && <MicOff className="w-3 h-3 ml-1" />}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="bg-card border-t p-4">
        <div className="flex items-center justify-center gap-4">
          {/* Microphone Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                onClick={toggleMicrophone}
                className="rounded-full w-14 h-14 p-0"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isMuted ? "Unmute microphone (M)" : "Mute microphone (M)"}
            </TooltipContent>
          </Tooltip>

          {/* Camera Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isCameraOff ? "destructive" : "secondary"}
                size="lg"
                onClick={toggleCamera}
                className="rounded-full w-14 h-14 p-0"
              >
                {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isCameraOff ? "Turn camera on (V)" : "Turn camera off (V)"}
            </TooltipContent>
          </Tooltip>

          {/* Pause/Resume Video */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isVideoPaused() ? "default" : "secondary"}
                size="lg"
                onClick={isVideoPaused() ? resumeVideo : pauseVideo}
                className="rounded-full w-14 h-14 p-0"
              >
                {isVideoPaused() ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isVideoPaused() ? "Resume video (Space)" : "Pause video (Space)"}
            </TooltipContent>
          </Tooltip>

          {/* End Call */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="lg"
                onClick={handleEndCall}
                className="rounded-full w-14 h-14 p-0"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              End interview call
            </TooltipContent>
          </Tooltip>

          {/* Additional Controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="lg"
                onClick={() => setShowScreenShare(true)}
                className="rounded-full w-14 h-14 p-0"
              >
                <ScreenShare className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isScreenSharing ? "Screen sharing active" : "Share your screen"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showChat ? "default" : "secondary"}
                size="lg"
                onClick={() => setShowChat(!showChat)}
                className="rounded-full w-14 h-14 p-0"
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showChat ? "Close chat" : "Open chat"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showSettings ? "default" : "secondary"}
                size="lg"
                onClick={() => setShowSettings(!showSettings)}
                className="rounded-full w-14 h-14 p-0"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showSettings ? "Close settings" : "Call settings"}
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Call Quality Info */}
        <div className="text-center mt-3 text-xs text-muted-foreground">
          Duration: {formatDuration(callDuration)} • Quality: {connectionQuality}
        </div>
      </div>

      {/* Feedback Dialog for Interviewers */}
      {showFeedbackDialog && isInterviewer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Interview Complete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Quick Feedback (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Brief notes about the interview..."
                  className="w-full p-2 border rounded-md h-20 text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleFeedbackSubmit}
                  className="flex-1"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleFeedbackSubmit}
                  className="flex-1"
                >
                  End Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Functional Components */}
      <InterviewChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        channelName={channelName}
        participants={participants.map(p => ({ uid: p.uid.toString(), name: p.name || `User ${p.uid}` }))}
        onSendMessage={handleSendMessage}
        messages={chatMessages}
      />

      <InterviewScreenShare
        isOpen={showScreenShare}
        onClose={() => setShowScreenShare(false)}
        onStartSharing={handleStartScreenShare}
        onStopSharing={handleStopScreenShare}
        isSharing={isScreenSharing}
        sharedStream={sharedStream}
      />

      <InterviewSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsChange={handleSettingsChange}
        currentSettings={callSettings}
      />
    </div>
    </TooltipProvider>
  );
}
