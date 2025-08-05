# 🎥 Video Call Implementation Guide - SPT Teams

## 🎯 Overview

Complete implementation roadmap for video calling functionality in SPT Teams, designed to integrate seamlessly with the existing HR recruitment system, team collaboration, and AI assistant features.

## 🏗️ **Implementation Options Analysis**

### **Option 1: WebRTC (Recommended for Enterprise)**
**Best Choice for SPT Teams**

#### ✅ **Advantages:**
- **Complete Control**: Full customization and branding
- **No Third-Party Dependencies**: Host your own video infrastructure
- **GDPR/Compliance Ready**: Full data control for enterprise
- **Cost Effective**: No per-minute charges after setup
- **Platform Integration**: Deep integration with existing HR/recruitment system
- **Scalable**: Can handle 1-on-1 to large meetings

#### ⚠️ **Considerations:**
- Higher initial development complexity
- Requires WebRTC expertise
- Server infrastructure for TURN/STUN servers

---

### **Option 2: Agora.io (Best Third-Party Solution)**
**Professional Video SDK**

#### ✅ **Advantages:**
- **Enterprise Grade**: Used by major companies
- **Easy Integration**: Well-documented APIs
- **Global Infrastructure**: Low latency worldwide
- **Advanced Features**: Screen sharing, recording, AI features
- **Scalable**: Supports massive conferences

#### ⚠️ **Considerations:**
- Usage-based pricing ($0.99-$3.99 per 1000 minutes)
- Third-party dependency
- Data flows through Agora servers

---

### **Option 3: Zoom SDK**
**Industry Standard**

#### ✅ **Advantages:**
- **Familiar Interface**: Users know Zoom
- **Reliable**: Proven enterprise solution
- **Feature Rich**: Breakout rooms, recording, etc.
- **Mobile Support**: Excellent mobile apps

#### ⚠️ **Considerations:**
- Higher cost for commercial use
- Limited customization
- Zoom branding in free tier

---

### **Option 4: Jitsi Meet (Open Source)**
**Free Alternative**

#### ✅ **Advantages:**
- **Completely Free**: No usage limits
- **Self-Hosted**: Full control
- **Good Quality**: Proven video solution
- **Easy Integration**: Embed via iframe

#### ⚠️ **Considerations:**
- Limited advanced features
- Requires server setup for scale
- Less polished UI

---

## 🚀 **Recommended Implementation: WebRTC + Agora Hybrid**

### **Phase 1: Quick Start with Agora.io (2-3 weeks)**
Start with Agora for rapid deployment, then migrate to custom WebRTC solution as needed.

### **Phase 2: Custom WebRTC (4-6 weeks)**
Build enterprise-grade custom solution for full control.

---

## 📋 **Phase 1: Agora.io Implementation**

### **1.1 Project Setup**

```bash
npm install agora-rtc-sdk-ng
npm install @types/agora-rtc-sdk-ng
```

### **1.2 Core Video Call Service**

```typescript
// lib/video-call-service.ts
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack 
} from 'agora-rtc-sdk-ng';

export interface VideoCallConfig {
  appId: string;
  channel: string;
  token?: string;
  uid?: string | number;
}

export interface CallParticipant {
  uid: string | number;
  name: string;
  avatar?: string;
  isMuted?: boolean;
  isCameraOff?: boolean;
}

export class VideoCallService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private isJoined = false;

  constructor() {
    AgoraRTC.setLogLevel(4); // Production: set to 0
  }

  /**
   * Initialize video call client
   */
  async initializeClient(): Promise<IAgoraRTCClient> {
    if (!this.client) {
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      this.setupEventHandlers();
    }
    return this.client;
  }

  /**
   * Join video call
   */
  async joinCall(config: VideoCallConfig): Promise<void> {
    try {
      const client = await this.initializeClient();
      
      // Join channel
      await client.join(
        config.appId,
        config.channel,
        config.token || null,
        config.uid || null
      );
      
      this.isJoined = true;
      
      // Create and publish local tracks
      await this.createLocalTracks();
      await this.publishLocalTracks();
      
    } catch (error) {
      console.error('Failed to join call:', error);
      throw error;
    }
  }

  /**
   * Leave video call
   */
  async leaveCall(): Promise<void> {
    try {
      // Destroy local tracks
      if (this.localAudioTrack) {
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }
      
      if (this.localVideoTrack) {
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }
      
      // Leave channel
      if (this.client && this.isJoined) {
        await this.client.leave();
        this.isJoined = false;
      }
      
    } catch (error) {
      console.error('Failed to leave call:', error);
      throw error;
    }
  }

  /**
   * Create local audio/video tracks
   */
  private async createLocalTracks(): Promise<void> {
    try {
      [this.localAudioTrack, this.localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
    } catch (error) {
      console.error('Failed to create local tracks:', error);
      throw error;
    }
  }

  /**
   * Publish local tracks
   */
  private async publishLocalTracks(): Promise<void> {
    if (!this.client || !this.localAudioTrack || !this.localVideoTrack) return;
    
    try {
      await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
    } catch (error) {
      console.error('Failed to publish tracks:', error);
      throw error;
    }
  }

  /**
   * Toggle microphone
   */
  async toggleMicrophone(): Promise<boolean> {
    if (!this.localAudioTrack) return false;
    
    const isMuted = this.localAudioTrack.muted;
    await this.localAudioTrack.setMuted(!isMuted);
    return !isMuted;
  }

  /**
   * Toggle camera
   */
  async toggleCamera(): Promise<boolean> {
    if (!this.localVideoTrack) return false;
    
    const isEnabled = this.localVideoTrack.enabled;
    await this.localVideoTrack.setEnabled(!isEnabled);
    return !isEnabled;
  }

  /**
   * Get local video track for rendering
   */
  getLocalVideoTrack(): ICameraVideoTrack | null {
    return this.localVideoTrack;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('user-published', this.handleUserPublished.bind(this));
    this.client.on('user-unpublished', this.handleUserUnpublished.bind(this));
    this.client.on('user-joined', this.handleUserJoined.bind(this));
    this.client.on('user-left', this.handleUserLeft.bind(this));
  }

  private handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (!this.client) return;
    
    await this.client.subscribe(user, mediaType);
    
    if (mediaType === 'video') {
      // Emit event for UI to render remote video
      window.dispatchEvent(new CustomEvent('remote-video-added', { 
        detail: { user, videoTrack: user.videoTrack } 
      }));
    }
  };

  private handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (mediaType === 'video') {
      window.dispatchEvent(new CustomEvent('remote-video-removed', { 
        detail: { user } 
      }));
    }
  };

  private handleUserJoined = (user: IAgoraRTCRemoteUser) => {
    window.dispatchEvent(new CustomEvent('user-joined', { 
      detail: { user } 
    }));
  };

  private handleUserLeft = (user: IAgoraRTCRemoteUser) => {
    window.dispatchEvent(new CustomEvent('user-left', { 
      detail: { user } 
    }));
  };
}
```

### **1.3 Video Call Hook**

```typescript
// hooks/use-video-call.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoCallService, VideoCallConfig, CallParticipant } from '@/lib/video-call-service';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

export interface UseVideoCallProps {
  onCallEnd?: () => void;
  onError?: (error: Error) => void;
}

export function useVideoCall({ onCallEnd, onError }: UseVideoCallProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoServiceRef = useRef<VideoCallService | null>(null);
  
  const [isInCall, setIsInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize video service
  useEffect(() => {
    if (!videoServiceRef.current) {
      videoServiceRef.current = new VideoCallService();
    }

    // Setup event listeners
    const handleUserJoined = (event: CustomEvent) => {
      const { user: remoteUser } = event.detail;
      setParticipants(prev => [
        ...prev.filter(p => p.uid !== remoteUser.uid),
        {
          uid: remoteUser.uid,
          name: `User ${remoteUser.uid}`,
          isMuted: false,
          isCameraOff: false
        }
      ]);
    };

    const handleUserLeft = (event: CustomEvent) => {
      const { user: remoteUser } = event.detail;
      setParticipants(prev => prev.filter(p => p.uid !== remoteUser.uid));
    };

    window.addEventListener('user-joined', handleUserJoined as EventListener);
    window.addEventListener('user-left', handleUserLeft as EventListener);

    return () => {
      window.removeEventListener('user-joined', handleUserJoined as EventListener);
      window.removeEventListener('user-left', handleUserLeft as EventListener);
    };
  }, []);

  /**
   * Start video call
   */
  const startCall = useCallback(async (config: VideoCallConfig) => {
    if (!videoServiceRef.current || !user) return;

    try {
      setIsConnecting(true);
      setError(null);

      await videoServiceRef.current.joinCall({
        ...config,
        uid: user.uid
      });

      setIsInCall(true);
      toast({
        title: 'Call Started',
        description: 'Successfully joined the video call',
      });

    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
      toast({
        title: 'Call Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  }, [user, toast, onError]);

  /**
   * End video call
   */
  const endCall = useCallback(async () => {
    if (!videoServiceRef.current) return;

    try {
      await videoServiceRef.current.leaveCall();
      setIsInCall(false);
      setParticipants([]);
      onCallEnd?.();
      
      toast({
        title: 'Call Ended',
        description: 'Video call has been terminated',
      });

    } catch (err) {
      console.error('Error ending call:', err);
    }
  }, [onCallEnd, toast]);

  /**
   * Toggle microphone
   */
  const toggleMicrophone = useCallback(async () => {
    if (!videoServiceRef.current) return;

    try {
      const muted = await videoServiceRef.current.toggleMicrophone();
      setIsMuted(muted);
    } catch (err) {
      console.error('Error toggling microphone:', err);
    }
  }, []);

  /**
   * Toggle camera
   */
  const toggleCamera = useCallback(async () => {
    if (!videoServiceRef.current) return;

    try {
      const cameraOff = await videoServiceRef.current.toggleCamera();
      setIsCameraOff(cameraOff);
    } catch (err) {
      console.error('Error toggling camera:', err);
    }
  }, []);

  /**
   * Get local video track
   */
  const getLocalVideoTrack = useCallback(() => {
    return videoServiceRef.current?.getLocalVideoTrack() || null;
  }, []);

  return {
    isInCall,
    isConnecting,
    isMuted,
    isCameraOff,
    participants,
    error,
    startCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
    getLocalVideoTrack
  };
}
```

### **1.4 Video Call Component**

```typescript
// components/video-call/video-call-room.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Volume2
} from 'lucide-react';
import { useVideoCall } from '@/hooks/use-video-call';
import { cn } from '@/lib/utils';

interface VideoCallRoomProps {
  channelName: string;
  appId: string;
  token?: string;
  onCallEnd?: () => void;
  participants?: { name: string; avatar?: string; }[];
}

export default function VideoCallRoom({
  channelName,
  appId,
  token,
  onCallEnd,
  participants: participantData = []
}: VideoCallRoomProps) {
  const localVideoRef = useRef<HTMLDivElement>(null);
  const [remoteVideoElements, setRemoteVideoElements] = useState<Map<string, HTMLDivElement>>(new Map());
  
  const {
    isInCall,
    isConnecting,
    isMuted,
    isCameraOff,
    participants,
    error,
    startCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
    getLocalVideoTrack
  } = useVideoCall({ onCallEnd });

  // Auto-start call when component mounts
  useEffect(() => {
    if (!isInCall && !isConnecting) {
      startCall({
        appId,
        channel: channelName,
        token
      });
    }
  }, [appId, channelName, token, startCall, isInCall, isConnecting]);

  // Handle local video rendering
  useEffect(() => {
    if (isInCall && localVideoRef.current) {
      const localTrack = getLocalVideoTrack();
      if (localTrack) {
        localTrack.play(localVideoRef.current);
      }
    }
  }, [isInCall, isCameraOff, getLocalVideoTrack]);

  // Handle remote video rendering
  useEffect(() => {
    const handleRemoteVideoAdded = (event: CustomEvent) => {
      const { user, videoTrack } = event.detail;
      
      // Create video element for remote user
      const videoElement = document.createElement('div');
      videoElement.id = `remote-video-${user.uid}`;
      videoElement.className = 'w-full h-full rounded-lg bg-gray-900';
      
      // Add to remote videos container
      const remoteContainer = document.getElementById('remote-videos-container');
      if (remoteContainer) {
        remoteContainer.appendChild(videoElement);
        videoTrack.play(videoElement);
        
        setRemoteVideoElements(prev => new Map(prev.set(user.uid, videoElement)));
      }
    };

    const handleRemoteVideoRemoved = (event: CustomEvent) => {
      const { user } = event.detail;
      const videoElement = document.getElementById(`remote-video-${user.uid}`);
      if (videoElement) {
        videoElement.remove();
        setRemoteVideoElements(prev => {
          const newMap = new Map(prev);
          newMap.delete(user.uid);
          return newMap;
        });
      }
    };

    window.addEventListener('remote-video-added', handleRemoteVideoAdded as EventListener);
    window.addEventListener('remote-video-removed', handleRemoteVideoRemoved as EventListener);

    return () => {
      window.removeEventListener('remote-video-added', handleRemoteVideoAdded as EventListener);
      window.removeEventListener('remote-video-removed', handleRemoteVideoRemoved as EventListener);
    };
  }, []);

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-500 mb-4">
          <PhoneOff className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Call Failed</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={onCallEnd}>
          Return to Dashboard
        </Button>
      </Card>
    );
  }

  if (isConnecting) {
    return (
      <Card className="p-6 text-center">
        <div className="text-primary mb-4">
          <Phone className="w-12 h-12 mx-auto mb-2 animate-pulse" />
          <h3 className="text-lg font-semibold">Connecting...</h3>
          <p className="text-sm text-muted-foreground">Joining video call</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-green-500 text-white">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
            Live
          </Badge>
          <span className="text-white font-medium">{channelName}</span>
        </div>
        
        <div className="flex items-center gap-2 text-white">
          <Users className="w-4 h-4" />
          <span>{participants.length + 1}</span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <VideoOff className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Camera Off</p>
              </div>
            )}
          </div>
          
          {/* Local Video Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              You {isMuted && <MicOff className="w-3 h-3 ml-1" />}
            </Badge>
          </div>
        </Card>

        {/* Remote Videos Container */}
        <div id="remote-videos-container" className="contents">
          {/* Remote video elements will be dynamically added here */}
        </div>

        {/* Empty slots for better grid layout */}
        {Array.from({ length: Math.max(0, 6 - participants.length - 1) }).map((_, index) => (
          <Card key={index} className="aspect-video bg-gray-800/50 border-dashed border-gray-600 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Waiting for participant</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-center gap-4">
          {/* Microphone Toggle */}
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="lg"
            onClick={toggleMicrophone}
            className="rounded-full w-12 h-12 p-0"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {/* Camera Toggle */}
          <Button
            variant={isCameraOff ? "destructive" : "secondary"}
            size="lg"
            onClick={toggleCamera}
            className="rounded-full w-12 h-12 p-0"
          >
            {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={endCall}
            className="rounded-full w-12 h-12 p-0"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>

          {/* Additional Controls */}
          <Button
            variant="secondary"
            size="lg"
            className="rounded-full w-12 h-12 p-0"
          >
            <ScreenShare className="w-5 h-5" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="rounded-full w-12 h-12 p-0"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔗 **Integration Points**

### **2.1 HR Recruitment Integration**

```typescript
// Update InterviewManagement.tsx to include video call functionality
const handleStartVideoInterview = async (interview: Interview) => {
  const channelName = `interview-${interview.id}`;
  const config = {
    appId: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
    channel: channelName,
    // Generate token server-side
    token: await generateAgoraToken(channelName, interview.candidateId)
  };
  
  // Navigate to video call room
  router.push(`/dashboard/hr/recruitment/video-call/${channelName}?interview=${interview.id}`);
};
```

### **2.2 Team Collaboration Integration**

```typescript
// Add to team-service.ts
export class TeamService {
  /**
   * Start team video meeting
   */
  static async startTeamMeeting(teamId: string, userId: string): Promise<string> {
    const channelName = `team-${teamId}-${Date.now()}`;
    
    // Store meeting in Firebase
    const meetingRef = doc(db, 'meetings', channelName);
    await setDoc(meetingRef, {
      teamId,
      channelName,
      startedBy: userId,
      startTime: new Date(),
      status: 'active',
      participants: [userId]
    });
    
    return channelName;
  }
}
```

### **2.3 Calendar Integration**

```typescript
// Add video call links to calendar events
export const createMeetingEvent = async (eventData: {
  title: string;
  start: Date;
  end: Date;
  attendees: string[];
}) => {
  const channelName = `meeting-${Date.now()}`;
  const meetingLink = `${window.location.origin}/video-call/${channelName}`;
  
  const calendarEvent = {
    ...eventData,
    description: `Join video call: ${meetingLink}`,
    meetingLink
  };
  
  return await CalendarService.createEvent(calendarEvent);
};
```

---

## 🎛️ **Advanced Features Roadmap**

### **Phase 2: Enhanced Features (Weeks 3-4)**

1. **Screen Sharing**
   - Desktop/application sharing
   - Annotation tools
   - Remote control (for technical interviews)

2. **Recording & Playback**
   - Interview recording for review
   - Automatic transcription
   - Meeting highlights

3. **AI Integration**
   - Real-time interview insights
   - Candidate sentiment analysis
   - Automated meeting notes

4. **Mobile Support**
   - React Native components
   - Mobile-optimized UI
   - Push notifications

### **Phase 3: Enterprise Features (Weeks 5-6)**

1. **Breakout Rooms**
   - Team collaboration sessions
   - Private candidate discussions
   - Dynamic room creation

2. **Analytics & Reporting**
   - Call quality metrics
   - Usage analytics
   - Interview effectiveness tracking

3. **Integration Ecosystem**
   - Slack/Teams notifications
   - Calendar sync
   - CRM integration

---

## 💰 **Cost Analysis**

### **Agora.io Pricing (Recommended Start)**

#### **🎁 Free Tier**
- **10,000 FREE minutes** to get started (no credit card required)
- Perfect for development, testing, and small teams
- Includes all features (voice, video, recording)

#### **Production Pricing**
- **Voice**: $0.99 per 1,000 minutes
- **HD Video**: $3.99 per 1,000 minutes  
- **4K Video**: $15.99 per 1,000 minutes
- **Recording**: $1.49 per 1,000 minutes
- **Transcription**: $1.00 per 1,000 minutes

**Monthly Estimate for 100 employees:**
- Light usage (50 hours): ~$12/month
- Medium usage (200 hours): ~$48/month
- Heavy usage (500 hours): ~$120/month
- **Very cost-effective for enterprise scale**

### **WebRTC (Complete Freedom - FREE)**

#### **✅ WebRTC is 100% FREE**
- **Open Standard**: No licensing fees ever
- **Browser Native**: Built into all modern browsers
- **Unlimited Usage**: No per-minute charges
- **Full Control**: Complete customization possible

#### **Infrastructure Costs (Self-Hosted)**
- **STUN Servers**: FREE (Google provides public STUN)
- **TURN Servers**: $50-200/month (for NAT traversal)
- **Signaling Server**: $20-100/month (WebSocket server)
- **Media Server**: $100-500/month (for group calls >4 people)

### **Custom WebRTC Implementation (Phase 2)**
- **Development Time**: 6-12 weeks
- **Development Cost**: $15,000-30,000
- **Monthly Infrastructure**: $200-800/month
- **Maintenance**: $2,000-4,000/month

### **💡 Cost Comparison Summary**

| Solution | Setup Cost | Monthly (100 users) | Control Level | Time to Market |
|----------|------------|-------------------|---------------|----------------|
| **Agora.io** | $0 | $48-120 | Medium | 1-2 weeks |
| **WebRTC (Simple)** | $5,000 | $200-400 | High | 4-6 weeks |
| **WebRTC (Enterprise)** | $20,000 | $500-800 | Complete | 8-12 weeks |

---

## 🚀 **Quick Start Implementation**

Ready to implement? Here's the immediate next steps:

1. **🎁 Set up Agora.io account** - **10,000 FREE minutes** to start (no credit card!)
2. **📦 Install dependencies** (`npm install agora-rtc-sdk-ng`)
3. **⚙️ Create video call service** (provided above)
4. **🛣️ Add video call routes** (`/dashboard/video-call/[channel]`)
5. **🔗 Integrate with existing HR system**

### **Why Start with Agora.io?**
- ✅ **FREE 10,000 minutes** - No upfront costs
- ✅ **Production ready** in 1-2 weeks  
- ✅ **Enterprise grade** - SOC2, GDPR, HIPAA compliant
- ✅ **99.99% uptime** - Mission critical reliability
- ✅ **Global coverage** - 200+ countries
- ✅ **Easy migration path** to custom WebRTC later

### **WebRTC Alternative (100% Free Forever)**
If you prefer complete control and have development resources:
- ✅ **No usage fees** - Ever
- ✅ **Complete customization** 
- ✅ **No vendor lock-in**
- ⚠️ **Higher complexity** - 6-12 weeks development
- ⚠️ **Infrastructure management** required

## 🛡️ **Security & Compliance**

### **Data Protection**
- End-to-end encryption
- GDPR compliance
- SOC 2 Type II certification (Agora)
- No data storage by default

### **Access Control**
- Role-based meeting access
- Workspace-level permissions
- Interview-specific channels
- Time-limited tokens

---

## 📱 **Mobile & Responsive Design**

Following your mobile-first architecture:

```typescript
// Mobile-optimized video call component
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
  {/* Responsive video grid */}
</div>

// Touch-friendly controls
<Button className="w-12 h-12 md:w-14 md:h-14 rounded-full">
  {/* Large touch targets */}
</Button>
```

---

This implementation provides enterprise-grade video calling that integrates seamlessly with your existing SPT Teams architecture. The hybrid approach lets you start quickly with Agora while maintaining the option to build custom solutions as you scale.

Would you like me to implement any specific part of this roadmap first?
