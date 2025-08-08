import { useState, useEffect, useCallback } from 'react';
import { 
  TeamCollaborationService, 
  TeamMeeting, 
  TeamCollaborationStats,
  TeamCommunicationChannel 
} from '@/lib/team-collaboration-service';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from './use-toast';

export interface UseTeamCollaborationReturn {
  // State
  meetings: TeamMeeting[];
  upcomingMeetings: TeamMeeting[];
  stats: TeamCollaborationStats | null;
  channels: TeamCommunicationChannel[];
  loading: boolean;
  error: string | null;

  // Actions
  startInstantMeeting: (teamId: string, title: string, description?: string) => Promise<{ meeting: TeamMeeting; channelName: string } | null>;
  scheduleMeeting: (teamId: string, meetingData: {
    title: string;
    description?: string;
    scheduledAt: Date;
    meetingType: TeamMeeting['meetingType'];
    duration?: number;
  }) => Promise<TeamMeeting | null>;
  endMeeting: (meetingId: string) => Promise<void>;
  joinMeeting: (meetingId: string) => Promise<{ channelName: string; meeting: TeamMeeting } | null>;
  createChannel: (teamId: string, channelData: {
    name: string;
    description?: string;
    type: TeamCommunicationChannel['type'];
    isPrivate: boolean;
  }) => Promise<TeamCommunicationChannel | null>;
  loadTeamData: (teamId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useTeamCollaboration(teamId?: string): UseTeamCollaborationReturn {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();

  const [meetings, setMeetings] = useState<TeamMeeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<TeamMeeting[]>([]);
  const [stats, setStats] = useState<TeamCollaborationStats | null>(null);
  const [channels, setChannels] = useState<TeamCommunicationChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load team collaboration data
  const loadTeamData = useCallback(async (targetTeamId: string) => {
    if (!user || !currentWorkspace) return;

    setLoading(true);
    setError(null);

    try {
      const [meetingsData, upcomingData, statsData, channelsData] = await Promise.all([
        TeamCollaborationService.getTeamMeetings(targetTeamId),
        TeamCollaborationService.getUpcomingTeamMeetings(targetTeamId),
        TeamCollaborationService.getTeamCollaborationStats(targetTeamId),
        TeamCollaborationService.getTeamChannels(targetTeamId, user.uid)
      ]);

      setMeetings(meetingsData);
      setUpcomingMeetings(upcomingData);
      setStats(statsData);
      setChannels(channelsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load team collaboration data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspace, toast]);

  // Refresh current data
  const refreshData = useCallback(async () => {
    if (teamId) {
      await loadTeamData(teamId);
    }
  }, [teamId, loadTeamData]);

  // Start instant meeting
  const startInstantMeeting = useCallback(async (
    targetTeamId: string,
    title: string,
    description?: string
  ): Promise<{ meeting: TeamMeeting; channelName: string } | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to start a meeting',
        variant: 'destructive'
      });
      return null;
    }

    setLoading(true);
    try {
      const result = await TeamCollaborationService.startInstantTeamMeeting(
        targetTeamId,
        user.uid,
        title,
        description
      );

      toast({
        title: 'Meeting Started',
        description: `${title} has been started successfully`,
      });

      // Refresh data if this is the current team
      if (targetTeamId === teamId) {
        await refreshData();
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start meeting';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, teamId, toast, refreshData]);

  // Schedule meeting
  const scheduleMeeting = useCallback(async (
    targetTeamId: string,
    meetingData: {
      title: string;
      description?: string;
      scheduledAt: Date;
      meetingType: TeamMeeting['meetingType'];
      duration?: number;
    }
  ): Promise<TeamMeeting | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to schedule a meeting',
        variant: 'destructive'
      });
      return null;
    }

    setLoading(true);
    try {
      const meeting = await TeamCollaborationService.scheduleTeamMeeting(
        targetTeamId,
        user.uid,
        meetingData
      );

      toast({
        title: 'Meeting Scheduled',
        description: `${meetingData.title} has been scheduled successfully`,
      });

      // Refresh data if this is the current team
      if (targetTeamId === teamId) {
        await refreshData();
      }

      return meeting;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule meeting';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, teamId, toast, refreshData]);

  // End meeting
  const endMeeting = useCallback(async (meetingId: string): Promise<void> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to end a meeting',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await TeamCollaborationService.endTeamMeeting(meetingId, user.uid);

      toast({
        title: 'Meeting Ended',
        description: 'The meeting has been ended successfully',
      });

      // Refresh data
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end meeting';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, refreshData]);

  // Join meeting
  const joinMeeting = useCallback(async (
    meetingId: string
  ): Promise<{ channelName: string; meeting: TeamMeeting } | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to join a meeting',
        variant: 'destructive'
      });
      return null;
    }

    setLoading(true);
    try {
      const result = await TeamCollaborationService.joinTeamMeetingFromChannel(
        meetingId,
        user.uid
      );

      toast({
        title: 'Joined Meeting',
        description: 'You have joined the meeting successfully',
      });

      // Refresh data
      await refreshData();

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join meeting';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast, refreshData]);

  // Create channel
  const createChannel = useCallback(async (
    targetTeamId: string,
    channelData: {
      name: string;
      description?: string;
      type: TeamCommunicationChannel['type'];
      isPrivate: boolean;
    }
  ): Promise<TeamCommunicationChannel | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a channel',
        variant: 'destructive'
      });
      return null;
    }

    setLoading(true);
    try {
      const channel = await TeamCollaborationService.createTeamChannel(
        targetTeamId,
        user.uid,
        channelData
      );

      toast({
        title: 'Channel Created',
        description: `${channelData.name} channel has been created successfully`,
      });

      // Refresh data if this is the current team
      if (targetTeamId === teamId) {
        await refreshData();
      }

      return channel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create channel';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, teamId, toast, refreshData]);

  // Load data when teamId changes
  useEffect(() => {
    if (teamId) {
      loadTeamData(teamId);
    }
  }, [teamId, loadTeamData]);

  return {
    // State
    meetings,
    upcomingMeetings,
    stats,
    channels,
    loading,
    error,

    // Actions
    startInstantMeeting,
    scheduleMeeting,
    endMeeting,
    joinMeeting,
    createChannel,
    loadTeamData,
    refreshData
  };
}

// Hook for getting team collaboration stats only
export function useTeamCollaborationStats(teamId: string) {
  const [stats, setStats] = useState<TeamCollaborationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!teamId) return;

    setLoading(true);
    setError(null);

    try {
      const statsData = await TeamCollaborationService.getTeamCollaborationStats(teamId);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load team stats';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  };
}

// Hook for getting upcoming meetings across multiple teams
export function useUpcomingTeamMeetings(teamIds: string[]) {
  const [meetings, setMeetings] = useState<TeamMeeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeetings = useCallback(async () => {
    if (teamIds.length === 0) {
      setMeetings([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allMeetings = await Promise.all(
        teamIds.map(teamId => TeamCollaborationService.getUpcomingTeamMeetings(teamId))
      );
      
      const flatMeetings = allMeetings.flat();
      // Sort by scheduled date
      flatMeetings.sort((a, b) => {
        if (!a.scheduledAt || !b.scheduledAt) return 0;
        return a.scheduledAt.getTime() - b.scheduledAt.getTime();
      });
      
      setMeetings(flatMeetings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load upcoming meetings';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [teamIds]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  return {
    meetings,
    loading,
    error,
    refresh: loadMeetings
  };
}