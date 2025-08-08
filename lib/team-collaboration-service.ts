import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { TeamService } from './team-service';
import { UserService } from './user-service';
import { VideoCallDataService, Meeting } from './video-call-data-service';
import { ActivityService } from './activity-service';
import { Team, TeamUser } from './types';
import { generateTeamChannelName } from './video-call-utils';

export interface TeamMeeting {
  id: string;
  teamId: string;
  workspaceId: string;
  title: string;
  description?: string;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  meetingType: 'team_standup' | 'team_planning' | 'team_review' | 'team_social' | 'team_training' | 'team_emergency';
  createdBy: string;
  participants: string[];
  channelName?: string;
  recordingUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamCollaborationStats {
  teamId: string;
  totalMeetings: number;
  totalMeetingTime: number;
  averageMeetingDuration: number;
  participationRate: number;
  lastMeetingDate?: Date;
  upcomingMeetings: number;
  meetingFrequency: 'daily' | 'weekly' | 'monthly' | 'irregular';
}

export interface TeamCommunicationChannel {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  type: 'general' | 'announcements' | 'project' | 'social';
  isPrivate: boolean;
  createdBy: string;
  members: string[];
  lastActivity?: Date;
  createdAt: Date;
}

export class TeamCollaborationService {
  /**
   * Start an instant team meeting
   */
  static async startInstantTeamMeeting(
    teamId: string,
    userId: string,
    title: string,
    description?: string
  ): Promise<{ meeting: TeamMeeting; channelName: string }> {
    try {
      // Get team details
      const team = await TeamService.getTeam(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Get user information
      const user = await UserService.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is team member
      const userRole = await TeamService.getUserTeamRole(userId, teamId);
      if (!userRole) {
        throw new Error('User is not a member of this team');
      }

      // Get team members
      const teamMembers = await TeamService.getTeamMembers(teamId);
      const participantIds = teamMembers.map(member => member.userId);

      // Create video call meeting
      const channelName = generateTeamChannelName(teamId);
      const meetingData = {
        title,
        description: description || `Team meeting for ${team.name}`,
        channelName,
        workspaceId: team.workspaceId,
        hostId: userId,
        hostName: user.name,
        scheduledAt: new Date(),
        status: 'ongoing' as const,
        meetingType: 'team' as const,
        participants: participantIds.map(id => ({
          userId: id,
          userName: '',
          email: '',
          role: 'participant' as const,
          deviceType: 'desktop' as const,
          audioEnabled: true,
          videoEnabled: true
        })),
        maxParticipants: 50,
        hasRecording: false,
        waitingRoom: false,
        settings: {
          autoStartRecording: false,
          enableChat: true,
          enableScreenSharing: true,
          muteParticipantsOnJoin: false,
          disableCameraOnJoin: false,
          requirePassword: false,
          allowAnonymousUsers: false
        }
      };

      const meetingId = await VideoCallDataService.createMeeting(meetingData);

      // Create team meeting record
      const teamMeetingRef = doc(collection(db, 'teamMeetings'));
      const teamMeeting: TeamMeeting = {
        id: teamMeetingRef.id,
        teamId,
        workspaceId: team.workspaceId,
        title,
        description,
        startedAt: new Date(),
        status: 'active',
        meetingType: 'team_standup',
        createdBy: userId,
        participants: participantIds,
        channelName,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(teamMeetingRef, teamMeeting);

      // Log activity
      await ActivityService.logActivity(
        'team_meeting_started',
        'team',
        teamId,
        {
          teamName: team.name,
          meetingTitle: title,
          participantCount: participantIds.length
        },
        team.workspaceId,
        userId
      );

      return { meeting: teamMeeting, channelName };
    } catch (error) {
      console.error('Error starting instant team meeting:', error);
      throw error;
    }
  }

  /**
   * Schedule a team meeting
   */
  static async scheduleTeamMeeting(
    teamId: string,
    userId: string,
    meetingData: {
      title: string;
      description?: string;
      scheduledAt: Date;
      meetingType: TeamMeeting['meetingType'];
      duration?: number;
    }
  ): Promise<TeamMeeting> {
    try {
      // Get team details
      const team = await TeamService.getTeam(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Get user information
      const user = await UserService.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user can schedule meetings for this team
      const userRole = await TeamService.getUserTeamRole(userId, teamId);
      if (!userRole || (userRole !== 'lead' && userRole !== 'admin' && userRole !== 'owner')) {
        throw new Error('Insufficient permissions to schedule team meetings');
      }

      // Get team members
      const teamMembers = await TeamService.getTeamMembers(teamId);
      const participantIds = teamMembers.map(member => member.userId);

      // Create scheduled meeting in video call system
      const channelName = generateTeamChannelName(teamId);
      const videoMeetingData = {
        title: meetingData.title,
        description: meetingData.description || `Team meeting for ${team.name}`,
        channelName,
        workspaceId: team.workspaceId,
        hostId: userId,
        hostName: user.name,
        scheduledAt: meetingData.scheduledAt,
        status: 'scheduled' as const,
        meetingType: 'team' as const,
        participants: participantIds.map(id => ({
          userId: id,
          userName: '',
          email: '',
          role: 'participant' as const,
          deviceType: 'desktop' as const,
          audioEnabled: true,
          videoEnabled: true
        })),
        maxParticipants: 50,
        hasRecording: false,
        waitingRoom: false,
        settings: {
          autoStartRecording: false,
          enableChat: true,
          enableScreenSharing: true,
          muteParticipantsOnJoin: false,
          disableCameraOnJoin: false,
          requirePassword: false,
          allowAnonymousUsers: false
        }
      };

      const meetingId = await VideoCallDataService.createMeeting(videoMeetingData);

      // Create team meeting record
      const teamMeetingRef = doc(collection(db, 'teamMeetings'));
      const teamMeeting: TeamMeeting = {
        id: teamMeetingRef.id,
        teamId,
        workspaceId: team.workspaceId,
        title: meetingData.title,
        description: meetingData.description,
        scheduledAt: meetingData.scheduledAt,
        status: 'scheduled',
        meetingType: meetingData.meetingType,
        createdBy: userId,
        participants: participantIds,
        channelName,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(teamMeetingRef, teamMeeting);

      // Log activity
      await ActivityService.logActivity(
        'team_meeting_scheduled',
        'team',
        teamId,
        {
          teamName: team.name,
          meetingTitle: meetingData.title,
          scheduledAt: meetingData.scheduledAt,
          participantCount: participantIds.length
        },
        team.workspaceId,
        userId
      );

      return teamMeeting;
    } catch (error) {
      console.error('Error scheduling team meeting:', error);
      throw error;
    }
  }

  /**
   * Get team meetings
   */
  static async getTeamMeetings(
    teamId: string,
    status?: TeamMeeting['status'],
    limit_count: number = 50
  ): Promise<TeamMeeting[]> {
    try {
      const meetingsRef = collection(db, 'teamMeetings');
      let q = query(
        meetingsRef,
        where('teamId', '==', teamId),
        orderBy('createdAt', 'desc'),
        limit(limit_count)
      );

      if (status) {
        q = query(
          meetingsRef,
          where('teamId', '==', teamId),
          where('status', '==', status),
          orderBy('createdAt', 'desc'),
          limit(limit_count)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TeamMeeting));
    } catch (error) {
      console.error('Error fetching team meetings:', error);
      throw error;
    }
  }

  /**
   * Get upcoming team meetings
   */
  static async getUpcomingTeamMeetings(teamId: string): Promise<TeamMeeting[]> {
    try {
      const now = new Date();
      const meetingsRef = collection(db, 'teamMeetings');
      const q = query(
        meetingsRef,
        where('teamId', '==', teamId),
        where('status', '==', 'scheduled'),
        where('scheduledAt', '>', now),
        orderBy('scheduledAt', 'asc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TeamMeeting));
    } catch (error) {
      console.error('Error fetching upcoming team meetings:', error);
      throw error;
    }
  }

  /**
   * End a team meeting
   */
  static async endTeamMeeting(meetingId: string, userId: string): Promise<void> {
    try {
      const meetingRef = doc(db, 'teamMeetings', meetingId);
      const meetingDoc = await getDoc(meetingRef);
      
      if (!meetingDoc.exists()) {
        throw new Error('Team meeting not found');
      }

      const meeting = meetingDoc.data() as TeamMeeting;
      
      // Check if user can end this meeting
      if (meeting.createdBy !== userId) {
        const userRole = await TeamService.getUserTeamRole(userId, meeting.teamId);
        if (!userRole || (userRole !== 'lead' && userRole !== 'admin' && userRole !== 'owner')) {
          throw new Error('Insufficient permissions to end this meeting');
        }
      }

      // Update meeting status
      await updateDoc(meetingRef, {
        status: 'completed',
        endedAt: new Date(),
        updatedAt: new Date()
      });

      // End the video call meeting if it exists
      if (meeting.channelName) {
        try {
          // Find the video call meeting by channel name
          const videoMeetings = await VideoCallDataService.getMeetings(meeting.workspaceId);
          const videoMeeting = videoMeetings.find(m => m.channelName === meeting.channelName);
          if (videoMeeting) {
            await VideoCallDataService.endMeeting(videoMeeting.id, userId);
          }
        } catch (error) {
          console.warn('Could not end video call meeting:', error);
        }
      }

      // Log activity
      await ActivityService.logActivity(
        'team_updated',
        'team',
        meeting.teamId,
        {
          meetingTitle: meeting.title,
          action: 'meeting_ended',
          duration: meeting.startedAt ? 
            Math.round((new Date().getTime() - meeting.startedAt.getTime()) / 60000) : 0
        },
        meeting.workspaceId,
        userId
      );
    } catch (error) {
      console.error('Error ending team meeting:', error);
      throw error;
    }
  }

  /**
   * Get team collaboration statistics
   */
  static async getTeamCollaborationStats(teamId: string): Promise<TeamCollaborationStats> {
    try {
      const meetings = await this.getTeamMeetings(teamId);
      const completedMeetings = meetings.filter(m => m.status === 'completed');
      const upcomingMeetings = meetings.filter(m => m.status === 'scheduled');
      
      const totalMeetingTime = completedMeetings.reduce((total, meeting) => {
        if (meeting.startedAt && meeting.endedAt) {
          return total + (meeting.endedAt.getTime() - meeting.startedAt.getTime());
        }
        return total;
      }, 0);

      const averageMeetingDuration = completedMeetings.length > 0 ? 
        totalMeetingTime / completedMeetings.length : 0;

      // Calculate participation rate
      const teamMembers = await TeamService.getTeamMembers(teamId);
      const totalPossibleParticipations = completedMeetings.length * teamMembers.length;
      const actualParticipations = completedMeetings.reduce((total, meeting) => 
        total + meeting.participants.length, 0);
      const participationRate = totalPossibleParticipations > 0 ? 
        (actualParticipations / totalPossibleParticipations) * 100 : 0;

      // Determine meeting frequency
      let meetingFrequency: TeamCollaborationStats['meetingFrequency'] = 'irregular';
      if (completedMeetings.length >= 4) {
        const sortedMeetings = completedMeetings
          .filter(m => m.startedAt)
          .sort((a, b) => a.startedAt!.getTime() - b.startedAt!.getTime());
        
        if (sortedMeetings.length >= 2) {
          const intervals = [];
          for (let i = 1; i < sortedMeetings.length; i++) {
            const interval = sortedMeetings[i].startedAt!.getTime() - sortedMeetings[i-1].startedAt!.getTime();
            intervals.push(interval);
          }
          
          const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
          const days = averageInterval / (1000 * 60 * 60 * 24);
          
          if (days <= 2) meetingFrequency = 'daily';
          else if (days <= 8) meetingFrequency = 'weekly';
          else if (days <= 35) meetingFrequency = 'monthly';
        }
      }

      return {
        teamId,
        totalMeetings: meetings.length,
        totalMeetingTime: Math.round(totalMeetingTime / 60000), // Convert to minutes
        averageMeetingDuration: Math.round(averageMeetingDuration / 60000), // Convert to minutes
        participationRate: Math.round(participationRate),
        lastMeetingDate: completedMeetings.length > 0 ? 
          completedMeetings[0].startedAt : undefined,
        upcomingMeetings: upcomingMeetings.length,
        meetingFrequency
      };
    } catch (error) {
      console.error('Error getting team collaboration stats:', error);
      throw error;
    }
  }

  /**
   * Create a team communication channel
   */
  static async createTeamChannel(
    teamId: string,
    userId: string,
    channelData: {
      name: string;
      description?: string;
      type: TeamCommunicationChannel['type'];
      isPrivate: boolean;
    }
  ): Promise<TeamCommunicationChannel> {
    try {
      // Check if user can create channels for this team
      const userRole = await TeamService.getUserTeamRole(userId, teamId);
      if (!userRole) {
        throw new Error('User is not a member of this team');
      }

      // Get team members for channel membership
      const teamMembers = await TeamService.getTeamMembers(teamId);
      const memberIds = teamMembers.map(member => member.userId);

      const channelRef = doc(collection(db, 'teamChannels'));
      const channel: TeamCommunicationChannel = {
        id: channelRef.id,
        teamId,
        name: channelData.name,
        description: channelData.description,
        type: channelData.type,
        isPrivate: channelData.isPrivate,
        createdBy: userId,
        members: memberIds,
        createdAt: new Date()
      };

      await setDoc(channelRef, channel);

      // Log activity
      const team = await TeamService.getTeam(teamId);
      if (team) {
        await ActivityService.logActivity(
          'team_updated',
          'team',
          teamId,
          {
            teamName: team.name,
            channelName: channelData.name,
            channelType: channelData.type,
            action: 'channel_created'
          },
          team.workspaceId,
          userId
        );
      }

      return channel;
    } catch (error) {
      console.error('Error creating team channel:', error);
      throw error;
    }
  }

  /**
   * Get team channels
   */
  static async getTeamChannels(teamId: string, userId: string): Promise<TeamCommunicationChannel[]> {
    try {
      // Check if user is team member
      const userRole = await TeamService.getUserTeamRole(userId, teamId);
      if (!userRole) {
        throw new Error('User is not a member of this team');
      }

      const channelsRef = collection(db, 'teamChannels');
      const q = query(
        channelsRef,
        where('teamId', '==', teamId),
        where('members', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TeamCommunicationChannel));
    } catch (error) {
      console.error('Error fetching team channels:', error);
      throw error;
    }
  }

  /**
   * Join team meeting from channel
   */
  static async joinTeamMeetingFromChannel(
    meetingId: string,
    userId: string
  ): Promise<{ channelName: string; meeting: TeamMeeting }> {
    try {
      const meetingRef = doc(db, 'teamMeetings', meetingId);
      const meetingDoc = await getDoc(meetingRef);
      
      if (!meetingDoc.exists()) {
        throw new Error('Team meeting not found');
      }

      const meeting = meetingDoc.data() as TeamMeeting;
      
      // Check if user is team member
      const userRole = await TeamService.getUserTeamRole(userId, meeting.teamId);
      if (!userRole) {
        throw new Error('User is not a member of this team');
      }

      // Add user to meeting participants if not already included
      if (!meeting.participants.includes(userId)) {
        await updateDoc(meetingRef, {
          participants: [...meeting.participants, userId],
          updatedAt: new Date()
        });
      }

      // Join the video call if it exists
      if (meeting.channelName) {
        try {
          // Get user information for participant
          const user = await UserService.getUser(userId);
          if (user) {
            const videoMeetings = await VideoCallDataService.getMeetings(meeting.workspaceId);
            const videoMeeting = videoMeetings.find(m => m.channelName === meeting.channelName);
            if (videoMeeting) {
              await VideoCallDataService.addParticipant(videoMeeting.id, {
                userId,
                userName: user.name,
                email: user.email,
                role: 'participant',
                deviceType: 'desktop',
                audioEnabled: true,
                videoEnabled: true
              });
            }
          }
        } catch (error) {
          console.warn('Could not join video call meeting:', error);
        }
      }

      return {
        channelName: meeting.channelName || '',
        meeting
      };
    } catch (error) {
      console.error('Error joining team meeting:', error);
      throw error;
    }
  }
}