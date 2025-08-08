import { useState, useEffect, useCallback } from 'react';
import { 
  VideoCallDataService, 
  Meeting, 
  VideoCallAnalytics, 
  VideoCallSettings,
  MeetingParticipant 
} from '@/lib/video-call-data-service';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from './use-toast';

interface UseVideoCallDataOptions {
  autoLoad?: boolean;
  filters?: {
    status?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  };
}

export function useVideoCallData(options: UseVideoCallDataOptions = {}) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { autoLoad = true, filters = {} } = options;

  // Load meetings
  const loadMeetings = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    setLoading(true);
    setError(null);

    try {
      const meetingsData = await VideoCallDataService.getMeetings(
        currentWorkspace.id,
        filters
      );
      setMeetings(meetingsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load meetings';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, filters, toast]);

  // Auto-load on mount and dependency changes
  useEffect(() => {
    if (autoLoad) {
      loadMeetings();
    }
  }, [autoLoad, loadMeetings]);

  // Create meeting
  const createMeeting = useCallback(async (
    meetingData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string | null> => {
    if (!currentWorkspace?.id || !user?.uid) {
      toast({
        title: 'Error',
        description: 'User or workspace not available',
        variant: 'destructive'
      });
      return null;
    }

    setLoading(true);
    try {
      const meetingId = await VideoCallDataService.createMeeting({
        ...meetingData,
        workspaceId: currentWorkspace.id,
        hostId: user.uid
      });

      toast({
        title: 'Success',
        description: 'Meeting created successfully'
      });

      // Reload meetings
      await loadMeetings();
      return meetingId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create meeting';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, user?.uid, toast, loadMeetings]);

  // Update meeting
  const updateMeeting = useCallback(async (
    meetingId: string, 
    updates: Partial<Meeting>
  ): Promise<boolean> => {
    setLoading(true);
    try {
      await VideoCallDataService.updateMeeting(meetingId, updates);
      
      toast({
        title: 'Success',
        description: 'Meeting updated successfully'
      });

      // Reload meetings
      await loadMeetings();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update meeting';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, loadMeetings]);

  // Start meeting
  const startMeeting = useCallback(async (meetingId: string): Promise<boolean> => {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive'
      });
      return false;
    }

    setLoading(true);
    try {
      await VideoCallDataService.startMeeting(meetingId, user.uid);
      
      toast({
        title: 'Success',
        description: 'Meeting started successfully'
      });

      // Reload meetings
      await loadMeetings();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start meeting';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast, loadMeetings]);

  // End meeting
  const endMeeting = useCallback(async (meetingId: string): Promise<boolean> => {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive'
      });
      return false;
    }

    setLoading(true);
    try {
      await VideoCallDataService.endMeeting(meetingId, user.uid);
      
      toast({
        title: 'Success',
        description: 'Meeting ended successfully'
      });

      // Reload meetings
      await loadMeetings();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end meeting';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast, loadMeetings]);

  // Delete meeting
  const deleteMeeting = useCallback(async (meetingId: string): Promise<boolean> => {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive'
      });
      return false;
    }

    setLoading(true);
    try {
      await VideoCallDataService.deleteMeeting(meetingId, user.uid);
      
      toast({
        title: 'Success',
        description: 'Meeting deleted successfully'
      });

      // Reload meetings
      await loadMeetings();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete meeting';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast, loadMeetings]);

  // Add participant
  const addParticipant = useCallback(async (
    meetingId: string, 
    participant: MeetingParticipant
  ): Promise<boolean> => {
    try {
      await VideoCallDataService.addParticipant(meetingId, participant);
      
      // Reload meetings
      await loadMeetings();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add participant';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    }
  }, [toast, loadMeetings]);

  // Remove participant
  const removeParticipant = useCallback(async (
    meetingId: string, 
    userId: string
  ): Promise<boolean> => {
    try {
      await VideoCallDataService.removeParticipant(meetingId, userId);
      
      // Reload meetings
      await loadMeetings();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove participant';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    }
  }, [toast, loadMeetings]);

  return {
    meetings,
    loading,
    error,
    loadMeetings,
    createMeeting,
    updateMeeting,
    startMeeting,
    endMeeting,
    deleteMeeting,
    addParticipant,
    removeParticipant
  };
}

// Hook for video call analytics
export function useVideoCallAnalytics(period: string = '30d') {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<VideoCallAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    setLoading(true);
    setError(null);

    try {
      const analyticsData = await VideoCallDataService.generateAnalytics(
        currentWorkspace.id,
        period
      );
      setAnalytics(analyticsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, period, toast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    loadAnalytics
  };
}

// Hook for video call settings
export function useVideoCallSettings(userId?: string) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [settings, setSettings] = useState<VideoCallSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || user?.uid;

  const loadSettings = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    setLoading(true);
    setError(null);

    try {
      const settingsData = await VideoCallDataService.getSettings(
        currentWorkspace.id,
        targetUserId
      );
      setSettings(settingsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, targetUserId, toast]);

  const updateSettings = useCallback(async (
    updates: Partial<VideoCallSettings>
  ): Promise<boolean> => {
    if (!currentWorkspace?.id) {
      toast({
        title: 'Error',
        description: 'Workspace not available',
        variant: 'destructive'
      });
      return false;
    }

    setLoading(true);
    try {
      await VideoCallDataService.updateSettings(
        currentWorkspace.id,
        updates,
        targetUserId
      );
      
      toast({
        title: 'Success',
        description: 'Settings updated successfully'
      });

      // Reload settings
      await loadSettings();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, targetUserId, toast, loadSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    loadSettings,
    updateSettings
  };
}

// Hook for getting a single meeting
export function useMeeting(meetingId: string | null) {
  const { toast } = useToast();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeeting = useCallback(async () => {
    if (!meetingId) {
      setMeeting(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const meetingData = await VideoCallDataService.getMeeting(meetingId);
      setMeeting(meetingData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load meeting';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [meetingId, toast]);

  useEffect(() => {
    loadMeeting();
  }, [loadMeeting]);

  return {
    meeting,
    loading,
    error,
    loadMeeting
  };
}