// Dynamic imports for client-side only
let AgoraRTC: any;

// Type definitions for Agora SDK
type IAgoraRTCClient = any;
type IAgoraRTCRemoteUser = any;
type ICameraVideoTrack = any;
type IMicrophoneAudioTrack = any;

// Initialize Agora SDK only on client-side
async function initializeAgoraSDK() {
  if (typeof window !== 'undefined' && !AgoraRTC) {
    const agoraModule = await import('agora-rtc-sdk-ng');
    AgoraRTC = agoraModule.default;
    return AgoraRTC;
  }
  return AgoraRTC;
}

  // Dynamic import for token generation (client-side only)
async function generateToken(
  appId: string,
  channel: string,
  uid: string | number
): Promise<string | null> {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return null;
  }
  
  const appCertificate = process.env.NEXT_PUBLIC_AGORA_APP_CERTIFICATE;
  if (!appCertificate) {
    return null;
  }
  
  try {
    // Dynamic import to avoid SSR issues
    const { generateDevelopmentToken } = await import('./agora-token-service');
    return await generateDevelopmentToken(appId, channel, uid);
  } catch (error) {
    return null;
  }
}export interface VideoCallConfig {
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

export interface CallStats {
  duration: number;
  participantCount: number;
  qualityRating: 'excellent' | 'good' | 'fair' | 'poor';
}

export class VideoCallService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private isJoined = false;
  private callStartTime: Date | null = null;
  private isPaused = false; // Dedicated pause state
  private previousVideoState: boolean = true; // Store video state before pause
  private previousAudioState: boolean = true; // Store audio state before pause

  constructor() {
    // Constructor kept minimal - initialization happens in initializeClient()
  }

  /**
   * Initialize video call client
   */
  async initializeClient(): Promise<IAgoraRTCClient> {
    if (!this.client) {
      // Initialize Agora SDK first
      await initializeAgoraSDK();
      
      // Set log level after SDK is loaded: 0 (DEBUG), 1 (INFO), 2 (WARNING), 3 (ERROR), 4 (NONE)
      AgoraRTC.setLogLevel(process.env.NODE_ENV === 'production' ? 3 : 1);
      
      this.client = AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8' 
      });
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
      
      // Check if already joined or connecting to prevent duplicate attempts
      if (this.isJoined || client.connectionState === 'CONNECTING' || client.connectionState === 'CONNECTED') {
        return;
      }
      
      // Generate token using App Certificate
      let token: string | null = config.token || null;
      
      if (!token && process.env.NEXT_PUBLIC_AGORA_APP_CERTIFICATE) {
        try {
          token = await generateToken(
            config.appId,
            config.channel,
            config.uid || 'default-uid'
          );
          
          if (!token) {
            throw new Error('Failed to generate authentication token');
          }
        } catch (tokenError) {
          throw new Error('Authentication token generation failed. Please check your App Certificate configuration.');
        }
      }
      
      // Join channel - convert string UID to number to avoid Agora warning
      const numericUid = config.uid ? 
        (typeof config.uid === 'string' ? parseInt(config.uid.slice(-6), 36) % 1000000 : config.uid) 
        : null;
      
      await client.join(
        config.appId,
        config.channel,
        token,
        numericUid
      );
      
      this.isJoined = true;
      this.callStartTime = new Date();
      
      // Create and publish local tracks
      await this.createLocalTracks();
      await this.publishLocalTracks();
      
    } catch (error) {
      // Handle specific Agora authentication errors
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('CAN_NOT_GET_GATEWAY_SERVER') || errorMessage.includes('dynamic use static key')) {
        throw new Error(
          'Authentication failed: Please ensure your Agora Console is configured for "App ID + App Certificate" mode for development, or implement proper token generation for production.'
        );
      }
      
      throw new Error(`Failed to join video call: ${errorMessage}`);
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTING' {
    return this.client?.connectionState || 'DISCONNECTED';
  }

  /**
   * Check if currently joined or connecting
   */
  isConnectedOrConnecting(): boolean {
    const state = this.getConnectionState();
    return this.isJoined || state === 'CONNECTING' || state === 'CONNECTED' || state === 'RECONNECTING';
  }

  /**
   * Leave video call
   */
  async leaveCall(): Promise<CallStats> {
    try {
      const callDuration = this.callStartTime 
        ? Math.floor((Date.now() - this.callStartTime.getTime()) / 1000)
        : 0;

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

      return {
        duration: callDuration,
        participantCount: this.client?.remoteUsers.length || 0,
        qualityRating: 'good' // TODO: Implement quality rating logic
      };
      
    } catch (error) {
      throw new Error(`Failed to leave video call: ${(error as Error).message}`);
    }
  }

  /**
   * Create local audio/video tracks
   */
  private async createLocalTracks(): Promise<void> {
    // Ensure Agora SDK is initialized
    await initializeAgoraSDK();
    
    try {
      [this.localAudioTrack, this.localVideoTrack] = 
        await AgoraRTC.createMicrophoneAndCameraTracks();
    } catch (error) {
      // Fallback: try to create audio only
      try {
        this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      } catch (audioError) {
        throw new Error('Failed to access microphone and camera');
      }
    }
  }

  /**
   * Publish local tracks
   */
  private async publishLocalTracks(): Promise<void> {
    if (!this.client) return;
    
    try {
      const tracksToPublish = [
        this.localAudioTrack,
        this.localVideoTrack
      ].filter((track): track is IMicrophoneAudioTrack | ICameraVideoTrack => track !== null);

      if (tracksToPublish.length > 0) {
        await this.client.publish(tracksToPublish);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle microphone
   */
  async toggleMicrophone(): Promise<boolean> {
    if (!this.localAudioTrack) {
      throw new Error('Microphone not available');
    }
    
    const isMuted = this.localAudioTrack.muted;
    await this.localAudioTrack.setMuted(!isMuted);
    
    return !isMuted;
  }

  /**
   * Toggle camera
   */
  async toggleCamera(): Promise<boolean> {
    if (!this.localVideoTrack) {
      throw new Error('Camera not available');
    }
    
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
   * Pause video and audio (temporarily disable both tracks)
   */
  async pauseVideo(): Promise<void> {
    if (!this.localVideoTrack || !this.localAudioTrack) {
      throw new Error('Audio/video tracks not available');
    }

    if (this.isPaused) return; // Already paused

    // Store current states before pausing
    this.previousVideoState = this.localVideoTrack.enabled;
    this.previousAudioState = this.localAudioTrack.enabled;

    await this.localVideoTrack.setEnabled(false);
    await this.localAudioTrack.setEnabled(false);
    
    this.isPaused = true;
    
    // Emit pause event
    window.dispatchEvent(new CustomEvent('videoPaused'));
  }

  /**
   * Resume video and audio (re-enable both tracks)
   */
  async resumeVideo(): Promise<void> {
    if (!this.localVideoTrack || !this.localAudioTrack) {
      throw new Error('Audio/video tracks not available');
    }

    if (!this.isPaused) return; // Not paused

    // Restore previous states
    await this.localVideoTrack.setEnabled(this.previousVideoState ?? true);
    await this.localAudioTrack.setEnabled(this.previousAudioState ?? true);
    
    this.isPaused = false;
    
    // Emit resume event
    window.dispatchEvent(new CustomEvent('videoResumed'));
  }

  /**
   * Check if video is currently paused
   */
  isVideoPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Get call statistics
   */
  getCallStats(): CallStats | null {
    if (!this.callStartTime || !this.client) return null;

    const duration = Math.floor((Date.now() - this.callStartTime.getTime()) / 1000);
    return {
      duration,
      participantCount: this.client.remoteUsers.length + 1,
      qualityRating: 'good' // TODO: Implement quality metrics
    };
  }

  /**
   * Check if currently in a call
   */
  isInCall(): boolean {
    return this.isJoined;
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
    this.client.on('connection-state-change', this.handleConnectionStateChange.bind(this));
  }

  private handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (!this.client) return;
    
    try {
      await this.client.subscribe(user, mediaType);
      
      if (mediaType === 'video') {
        // Emit event for UI to render remote video
        window.dispatchEvent(new CustomEvent('remote-video-added', { 
          detail: { user, videoTrack: user.videoTrack } 
        }));
      }
    } catch (error) {
      // Subscription failed
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

  private handleConnectionStateChange = (curState: string, revState: string) => {    
    window.dispatchEvent(new CustomEvent('connection-state-change', {
      detail: { currentState: curState, previousState: revState }
    }));
  };
}

// Singleton instance
let videoCallServiceInstance: VideoCallService | null = null;

export const getVideoCallService = (): VideoCallService => {
  if (!videoCallServiceInstance) {
    videoCallServiceInstance = new VideoCallService();
  }
  return videoCallServiceInstance;
};
