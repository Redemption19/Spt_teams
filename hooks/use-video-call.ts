import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

// Dynamic import types
type VideoCallService = any;
type VideoCallConfig = any;
type CallParticipant = any;
type CallStats = any;

export interface UseVideoCallProps {
  onCallEnd?: (stats: CallStats) => void;
  onError?: (error: Error) => void;
  onParticipantJoined?: (participant: CallParticipant) => void;
  onParticipantLeft?: (participantId: string | number) => void;
}

export interface VideoCallState {
  isInCall: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  participants: CallParticipant[];
  error: string | null;
  connectionState: string;
  callDuration: number;
  isServiceInitialized: boolean;
}

export function useVideoCall({
  onCallEnd,
  onError,
  onParticipantJoined,
  onParticipantLeft
}: UseVideoCallProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoServiceRef = useRef<VideoCallService | null>(null);
  const callIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [state, setState] = useState<VideoCallState>({
    isInCall: false,
    isConnecting: false,
    isMuted: false,
    isCameraOff: false,
    participants: [],
    error: null,
    connectionState: 'DISCONNECTED',
    callDuration: 0,
    isServiceInitialized: false
  });

    // Initialize video service
  useEffect(() => {
    if (!videoServiceRef.current && typeof window !== 'undefined') {
      const initVideoService = async () => {
        try {
          // Dynamic import of video service
          const { getVideoCallService } = await import('@/lib/video-call-service');
          videoServiceRef.current = getVideoCallService();
          
          // Update state to indicate service is initialized
          setState(prev => ({ 
            ...prev, 
            isServiceInitialized: true 
          }));
        } catch (error) {
          setState(prev => ({ 
            ...prev, 
            error: 'Video calling is not available. Please check if Agora SDK is installed.',
            isServiceInitialized: false
          }));
        }
      };
      
      initVideoService();
    }

    // Setup event listeners
    const handleUserJoined = (event: CustomEvent) => {
      const { user: remoteUser } = event.detail;
      const participant: CallParticipant = {
        uid: remoteUser.uid,
        name: `User ${remoteUser.uid}`,
        isMuted: false,
        isCameraOff: false
      };
      
      setState(prev => ({
        ...prev,
        participants: [
          ...prev.participants.filter(p => p.uid !== remoteUser.uid),
          participant
        ]
      }));

      onParticipantJoined?.(participant);
    };

    const handleUserLeft = (event: CustomEvent) => {
      const { user: remoteUser } = event.detail;
      setState(prev => ({
        ...prev,
        participants: prev.participants.filter(p => p.uid !== remoteUser.uid)
      }));

      onParticipantLeft?.(remoteUser.uid);
    };

    const handleConnectionStateChange = (event: CustomEvent) => {
      const { currentState } = event.detail;
      setState(prev => ({ ...prev, connectionState: currentState }));
    };

    window.addEventListener('user-joined', handleUserJoined as EventListener);
    window.addEventListener('user-left', handleUserLeft as EventListener);
    window.addEventListener('connection-state-change', handleConnectionStateChange as EventListener);

    return () => {
      window.removeEventListener('user-joined', handleUserJoined as EventListener);
      window.removeEventListener('user-left', handleUserLeft as EventListener);
      window.removeEventListener('connection-state-change', handleConnectionStateChange as EventListener);
      
      // Clear call duration interval
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
      }
    };
  }, [onParticipantJoined, onParticipantLeft]);

  /**
   * Start call duration timer
   */
  const startCallTimer = useCallback(() => {
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
    }

    callIntervalRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        callDuration: prev.callDuration + 1
      }));
    }, 1000);
  }, []);

  /**
   * Stop call duration timer
   */
  const stopCallTimer = useCallback(() => {
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
      callIntervalRef.current = null;
    }
  }, []);

  /**
   * Start video call
   */
  const startCall = useCallback(async (config: VideoCallConfig) => {
    if (!user) {
      const error = new Error('User not authenticated');
      setState(prev => ({ ...prev, error: error.message }));
      onError?.(error);
      return;
    }

    if (!process.env.NEXT_PUBLIC_AGORA_APP_ID) {
      const error = new Error('Agora App ID not configured. Please check your environment variables.');
      setState(prev => ({ ...prev, error: error.message }));
      onError?.(error);
      return;
    }

    // Wait for service initialization if not ready yet
    if (!videoServiceRef.current || !state.isServiceInitialized) {
      console.log('⏳ Waiting for video service initialization...');
      
      // Wait up to 10 seconds for service to initialize
      let attempts = 0;
      const maxAttempts = 50; // 50 * 200ms = 10 seconds
      
      while ((!videoServiceRef.current || !state.isServiceInitialized) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
      
      if (!videoServiceRef.current || !state.isServiceInitialized) {
        const error = new Error('Video service failed to initialize within timeout period');
        setState(prev => ({ ...prev, error: error.message }));
        onError?.(error);
        return;
      }
    }

    // Prevent duplicate join attempts
    if (videoServiceRef.current.isConnectedOrConnecting()) {
      console.log('⚠️ Already connected or connecting, skipping duplicate join attempt');
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        isConnecting: true, 
        error: null,
        callDuration: 0
      }));

      await videoServiceRef.current.joinCall({
        ...config,
        uid: user.uid
      });

      setState(prev => ({ 
        ...prev, 
        isInCall: true, 
        isConnecting: false 
      }));

      startCallTimer();

      toast({
        title: 'Call Started',
        description: 'Successfully joined the video call',
      });

    } catch (err) {
      const error = err as Error;
      setState(prev => ({ 
        ...prev, 
        error: error.message, 
        isConnecting: false 
      }));
      onError?.(error);
      toast({
        title: 'Call Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [user, state.isServiceInitialized, toast, onError, startCallTimer]);

  /**
   * End video call
   */
  const endCall = useCallback(async () => {
    if (!videoServiceRef.current) return;

    try {
      stopCallTimer();
      
      const callStats = await videoServiceRef.current.leaveCall();
      
      setState(prev => ({ 
        ...prev, 
        isInCall: false, 
        participants: [],
        connectionState: 'DISCONNECTED'
      }));

      onCallEnd?.(callStats);
      
      toast({
        title: 'Call Ended',
        description: `Call duration: ${Math.floor(callStats.duration / 60)}:${String(callStats.duration % 60).padStart(2, '0')}`,
      });

    } catch (err) {
      console.error('Error ending call:', err);
      toast({
        title: 'Error',
        description: 'Failed to end call properly',
        variant: 'destructive'
      });
    }
  }, [onCallEnd, toast, stopCallTimer]);

  /**
   * Toggle microphone
   */
  const toggleMicrophone = useCallback(async () => {
    if (!videoServiceRef.current) return;

    try {
      const muted = await videoServiceRef.current.toggleMicrophone();
      setState(prev => ({ ...prev, isMuted: muted }));
      
      toast({
        title: muted ? 'Microphone Muted' : 'Microphone Unmuted',
        description: muted ? 'You are now muted' : 'You are now unmuted',
      });
    } catch (err) {
      console.error('Error toggling microphone:', err);
      toast({
        title: 'Error',
        description: 'Failed to toggle microphone',
        variant: 'destructive'
      });
    }
  }, [toast]);

  /**
   * Toggle camera
   */
  const toggleCamera = useCallback(async () => {
    if (!videoServiceRef.current) return;

    try {
      const cameraEnabled = await videoServiceRef.current.toggleCamera();
      setState(prev => ({ ...prev, isCameraOff: !cameraEnabled }));
      
      toast({
        title: cameraEnabled ? 'Camera On' : 'Camera Off',
        description: cameraEnabled ? 'Your camera is now on' : 'Your camera is now off',
      });
    } catch (err) {
      console.error('Error toggling camera:', err);
      toast({
        title: 'Error',
        description: 'Failed to toggle camera',
        variant: 'destructive'
      });
    }
  }, [toast]);

  /**
   * Pause video and audio
   */
  const pauseVideo = useCallback(async () => {
    if (!videoServiceRef.current) return;

    try {
      await videoServiceRef.current.pauseVideo();
      // Don't modify isCameraOff or isMuted - pause is separate from individual controls
      
      toast({
        title: 'Video Paused',
        description: 'Video and audio have been paused',
        variant: 'default'
      });
    } catch (err) {
      console.error('Error pausing video:', err);
      toast({
        title: 'Error',
        description: 'Failed to pause video',
        variant: 'destructive'
      });
    }
  }, [toast]);

  /**
   * Resume video and audio
   */
  const resumeVideo = useCallback(async () => {
    if (!videoServiceRef.current) return;

    try {
      await videoServiceRef.current.resumeVideo();
      // Don't modify isCameraOff or isMuted - resume restores previous states
      
      toast({
        title: 'Video Resumed',
        description: 'Video and audio have been resumed',
        variant: 'default'
      });
    } catch (err) {
      console.error('Error resuming video:', err);
      toast({
        title: 'Error',
        description: 'Failed to resume video',
        variant: 'destructive'
      });
    }
  }, [toast]);

  /**
   * Check if video is paused
   */
  const isVideoPaused = useCallback(() => {
    return videoServiceRef.current?.isVideoPaused() || false;
  }, []);

  /**
   * Get local video track
   */
  const getLocalVideoTrack = useCallback(() => {
    return videoServiceRef.current?.getLocalVideoTrack() || null;
  }, []);

  /**
   * Get current call statistics
   */
  const getCurrentCallStats = useCallback(() => {
    return videoServiceRef.current?.getCallStats() || null;
  }, []);

  /**
   * Format call duration as MM:SS
   */
  const formatCallDuration = useCallback((duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    startCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
    pauseVideo,
    resumeVideo,
    
    // Utilities
    getLocalVideoTrack,
    getCurrentCallStats,
    isVideoPaused,
    formatCallDuration: () => formatCallDuration(state.callDuration),
    
    // Computed values
    participantCount: state.participants.length + (state.isInCall ? 1 : 0),
    isVideoServiceAvailable: !!videoServiceRef.current
  };
}
