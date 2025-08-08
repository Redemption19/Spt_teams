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
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { ActivityService } from './activity-service';
import { cleanFirestoreData, createDocumentData, createUpdateData } from './firestore-utils';

// Types for video call data
export interface Meeting {
  id: string;
  title: string;
  channelName: string;
  workspaceId: string;
  teamId?: string;
  hostId: string;
  hostName: string;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // in minutes
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  meetingType: 'instant' | 'scheduled' | 'interview' | 'team';
  participants: MeetingParticipant[];
  maxParticipants: number;
  hasRecording: boolean;
  recordingUrl?: string;
  recordingSize?: number; // in bytes
  description?: string;
  password?: string;
  waitingRoom: boolean;
  settings: MeetingSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingParticipant {
  userId: string;
  userName: string;
  email: string;
  joinedAt?: Date;
  leftAt?: Date;
  duration?: number; // in minutes
  role: 'host' | 'participant' | 'moderator';
  deviceType: 'desktop' | 'mobile' | 'tablet';
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  audioEnabled: boolean;
  videoEnabled: boolean;
}

export interface MeetingSettings {
  autoStartRecording: boolean;
  enableChat: boolean;
  enableScreenSharing: boolean;
  muteParticipantsOnJoin: boolean;
  disableCameraOnJoin: boolean;
  requirePassword: boolean;
  allowAnonymousUsers: boolean;
}

export interface VideoCallAnalytics {
  workspaceId: string;
  period: string; // '7d', '30d', '90d', '1y'
  overview: {
    totalMeetings: number;
    totalParticipants: number;
    totalDuration: number;
    averageDuration: number;
    meetingsThisWeek: number;
    meetingsThisMonth: number;
    growthRate: number;
  };
  usage: {
    dailyMeetings: Array<{ date: string; count: number; duration: number }>;
    weeklyMeetings: Array<{ week: string; count: number; duration: number }>;
    monthlyMeetings: Array<{ month: string; count: number; duration: number }>;
  };
  quality: {
    averageRating: number;
    connectionIssues: number;
    audioIssues: number;
    videoIssues: number;
    successfulConnections: number;
    failedConnections: number;
  };
  participants: {
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
    averageParticipantsPerMeeting: number;
    topUsers: Array<{ userId: string; name: string; meetings: number; duration: number }>;
  };
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  recordings: {
    totalRecordings: number;
    totalStorageUsed: number;
    averageRecordingSize: number;
    downloadCount: number;
  };
  generatedAt: Date;
}

export interface VideoCallSettings {
  workspaceId: string;
  userId?: string; // If user-specific settings
  general: {
    defaultMeetingDuration: number;
    maxParticipants: number;
    autoStartRecording: boolean;
    enableChat: boolean;
    enableScreenSharing: boolean;
    enableVirtualBackground: boolean;
    defaultMeetingPassword: boolean;
    waitingRoom: boolean;
    muteParticipantsOnJoin: boolean;
    disableCameraOnJoin: boolean;
  };
  audio: {
    defaultMicrophone: string;
    defaultSpeaker: string;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    microphoneVolume: number;
    speakerVolume: number;
  };
  video: {
    defaultCamera: string;
    defaultResolution: string;
    frameRate: number;
    enableHD: boolean;
    mirrorVideo: boolean;
    virtualBackgroundBlur: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    browserNotifications: boolean;
    mobileNotifications: boolean;
    meetingReminders: boolean;
    recordingReady: boolean;
    participantJoined: boolean;
    participantLeft: boolean;
    chatMessages: boolean;
  };
  security: {
    requirePassword: boolean;
    enableWaitingRoom: boolean;
    allowAnonymousUsers: boolean;
    recordingConsent: boolean;
    endToEndEncryption: boolean;
    dataRetentionDays: number;
    allowExternalParticipants: boolean;
  };
  storage: {
    autoDeleteRecordings: boolean;
    recordingRetentionDays: number;
    maxStoragePerUser: number;
    compressionLevel: string;
    cloudStorage: boolean;
    localDownloads: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class VideoCallDataService {
  /**
   * Create a new meeting
   */
  static async createMeeting(meetingData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const meetingRef = doc(collection(db, 'meetings'));
      const meeting: Meeting = {
        ...meetingData,
        id: meetingRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(meetingRef, createDocumentData(meetingData, meetingRef.id));

      // Log activity
      await ActivityService.logActivity(
        'meeting_created',
        'meeting',
        meeting.id,
        {
          meetingId: meeting.id,
          title: meeting.title,
          type: meeting.meetingType
        },
        meeting.workspaceId,
        meeting.hostId
      );

      return meeting.id;
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw new Error('Failed to create meeting');
    }
  }

  /**
   * Get meeting by ID
   */
  static async getMeeting(meetingId: string): Promise<Meeting | null> {
    try {
      const meetingDoc = await getDoc(doc(db, 'meetings', meetingId));
      if (!meetingDoc.exists()) {
        return null;
      }

      const data = meetingDoc.data();
      return cleanFirestoreData(data) as Meeting;
    } catch (error) {
      console.error('Error getting meeting:', error);
      throw new Error('Failed to get meeting');
    }
  }

  /**
   * Get meetings for workspace with filters
   */
  static async getMeetings(
    workspaceId: string,
    filters: {
      status?: string;
      type?: string;
      hostId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<Meeting[]> {
    try {
      let q = query(
        collection(db, 'meetings'),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      );

      if (filters.status && filters.status !== 'all') {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.type && filters.type !== 'all') {
        q = query(q, where('meetingType', '==', filters.type));
      }

      if (filters.hostId) {
        q = query(q, where('hostId', '==', filters.hostId));
      }

      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      const meetings = snapshot.docs.map(doc => {
        const data = doc.data();
        return cleanFirestoreData(data) as Meeting;
      });

      // Filter by date range if provided (client-side for now)
      if (filters.startDate || filters.endDate) {
        return meetings.filter(meeting => {
          const meetingDate = meeting.scheduledAt || meeting.createdAt;
          if (filters.startDate && meetingDate < filters.startDate) return false;
          if (filters.endDate && meetingDate > filters.endDate) return false;
          return true;
        });
      }

      return meetings;
    } catch (error) {
      console.error('Error getting meetings:', error);
      throw new Error('Failed to get meetings');
    }
  }

  /**
   * Update meeting
   */
  static async updateMeeting(meetingId: string, updates: Partial<Meeting>): Promise<void> {
    try {
      const updateData = createUpdateData({
        ...updates,
        updatedAt: new Date()
      });

      await updateDoc(doc(db, 'meetings', meetingId), updateData);

      // Log activity if status changed
      if (updates.status) {
        const meeting = await this.getMeeting(meetingId);
        if (meeting) {
          await ActivityService.logActivity(
            'meeting_updated',
            'meeting',
            meetingId,
            {
              meetingId,
              status: updates.status
            },
            meeting.workspaceId,
            meeting.hostId
          );
        }
      }
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw new Error('Failed to update meeting');
    }
  }

  /**
   * Start meeting (update status and add start time)
   */
  static async startMeeting(meetingId: string, hostId: string): Promise<void> {
    try {
      await this.updateMeeting(meetingId, {
        status: 'ongoing',
        startedAt: new Date()
      });

      const meeting = await this.getMeeting(meetingId);
      if (meeting) {
        await ActivityService.logActivity(
          'meeting_started',
          'meeting',
          meetingId,
          {
            meetingId,
            title: meeting.title
          },
          meeting.workspaceId,
          hostId
        );
      }
    } catch (error) {
      console.error('Error starting meeting:', error);
      throw new Error('Failed to start meeting');
    }
  }

  /**
   * End meeting (update status, end time, and calculate duration)
   */
  static async endMeeting(meetingId: string, hostId: string): Promise<void> {
    try {
      const meeting = await this.getMeeting(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const endedAt = new Date();
      const duration = meeting.startedAt 
        ? Math.round((endedAt.getTime() - meeting.startedAt.getTime()) / (1000 * 60))
        : 0;

      await this.updateMeeting(meetingId, {
        status: 'completed',
        endedAt,
        duration
      });

      await ActivityService.logActivity(
        'meeting_ended',
        'meeting',
        meetingId,
        {
          meetingId,
          title: meeting.title,
          duration
        },
        meeting.workspaceId,
        hostId
      );
    } catch (error) {
      console.error('Error ending meeting:', error);
      throw new Error('Failed to end meeting');
    }
  }

  /**
   * Add participant to meeting
   */
  static async addParticipant(meetingId: string, participant: MeetingParticipant): Promise<void> {
    try {
      const meeting = await this.getMeeting(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const updatedParticipants = [...meeting.participants];
      const existingIndex = updatedParticipants.findIndex(p => p.userId === participant.userId);
      
      if (existingIndex >= 0) {
        // Update existing participant
        updatedParticipants[existingIndex] = {
          ...updatedParticipants[existingIndex],
          ...participant,
          joinedAt: participant.joinedAt || new Date()
        };
      } else {
        // Add new participant
        updatedParticipants.push({
          ...participant,
          joinedAt: participant.joinedAt || new Date()
        });
      }

      await this.updateMeeting(meetingId, {
        participants: updatedParticipants
      });

      await ActivityService.logActivity(
        'meeting_joined',
        'meeting',
        meetingId,
        {
          meetingId,
          participantName: participant.userName
        },
        meeting.workspaceId,
        participant.userId
      );
    } catch (error) {
      console.error('Error adding participant:', error);
      throw new Error('Failed to add participant');
    }
  }

  /**
   * Remove participant from meeting
   */
  static async removeParticipant(meetingId: string, userId: string): Promise<void> {
    try {
      const meeting = await this.getMeeting(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const leftAt = new Date();
      const updatedParticipants = meeting.participants.map(p => {
        if (p.userId === userId) {
          const duration = p.joinedAt 
            ? Math.round((leftAt.getTime() - p.joinedAt.getTime()) / (1000 * 60))
            : 0;
          return { ...p, leftAt, duration };
        }
        return p;
      });

      await this.updateMeeting(meetingId, {
        participants: updatedParticipants
      });

      const participant = meeting.participants.find(p => p.userId === userId);
      if (participant) {
        await ActivityService.logActivity(
          'meeting_left',
          'meeting',
          meetingId,
          {
            meetingId,
            participantName: participant.userName
          },
          meeting.workspaceId,
          userId
        );
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      throw new Error('Failed to remove participant');
    }
  }

  /**
   * Delete meeting
   */
  static async deleteMeeting(meetingId: string, userId: string): Promise<void> {
    try {
      const meeting = await this.getMeeting(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      await deleteDoc(doc(db, 'meetings', meetingId));

      await ActivityService.logActivity(
        'meeting_deleted',
        'meeting',
        meetingId,
        {
          meetingId,
          title: meeting.title
        },
        meeting.workspaceId,
        userId
      );
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw new Error('Failed to delete meeting');
    }
  }

  /**
   * Get video call settings for workspace or user
   */
  static async getSettings(workspaceId: string, userId?: string): Promise<VideoCallSettings | null> {
    try {
      const settingsId = userId ? `${workspaceId}_${userId}` : workspaceId;
      const settingsDoc = await getDoc(doc(db, 'videoCallSettings', settingsId));
      
      if (!settingsDoc.exists()) {
        // Return default settings
        return this.getDefaultSettings(workspaceId, userId);
      }

      const data = settingsDoc.data();
      return cleanFirestoreData(data) as VideoCallSettings;
    } catch (error) {
      console.error('Error getting video call settings:', error);
      throw new Error('Failed to get video call settings');
    }
  }

  /**
   * Update video call settings
   */
  static async updateSettings(
    workspaceId: string, 
    settings: Partial<VideoCallSettings>,
    userId?: string
  ): Promise<void> {
    try {
      const settingsId = userId ? `${workspaceId}_${userId}` : workspaceId;
      const updateData = createUpdateData({
        ...settings,
        workspaceId,
        userId,
        updatedAt: new Date()
      });

      await setDoc(doc(db, 'videoCallSettings', settingsId), updateData, { merge: true });

      await ActivityService.logActivity(
        'video_settings_updated',
        'settings',
        settingsId,
        {
          settingsType: userId ? 'user' : 'workspace'
        },
        workspaceId,
        userId || 'system'
      );
    } catch (error) {
      console.error('Error updating video call settings:', error);
      throw new Error('Failed to update video call settings');
    }
  }

  /**
   * Get default settings
   */
  private static getDefaultSettings(workspaceId: string, userId?: string): VideoCallSettings {
    return {
      workspaceId,
      userId,
      general: {
        defaultMeetingDuration: 60,
        maxParticipants: 50,
        autoStartRecording: false,
        enableChat: true,
        enableScreenSharing: true,
        enableVirtualBackground: true,
        defaultMeetingPassword: false,
        waitingRoom: false,
        muteParticipantsOnJoin: false,
        disableCameraOnJoin: false
      },
      audio: {
        defaultMicrophone: 'default',
        defaultSpeaker: 'default',
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        microphoneVolume: 80,
        speakerVolume: 80
      },
      video: {
        defaultCamera: 'default',
        defaultResolution: '720p',
        frameRate: 30,
        enableHD: true,
        mirrorVideo: true,
        virtualBackgroundBlur: false
      },
      notifications: {
        emailNotifications: true,
        browserNotifications: true,
        mobileNotifications: true,
        meetingReminders: true,
        recordingReady: true,
        participantJoined: false,
        participantLeft: false,
        chatMessages: true
      },
      security: {
        requirePassword: false,
        enableWaitingRoom: false,
        allowAnonymousUsers: false,
        recordingConsent: true,
        endToEndEncryption: false,
        dataRetentionDays: 90,
        allowExternalParticipants: true
      },
      storage: {
        autoDeleteRecordings: false,
        recordingRetentionDays: 365,
        maxStoragePerUser: 5000, // MB
        compressionLevel: 'medium',
        cloudStorage: true,
        localDownloads: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Generate analytics for workspace
   */
  static async generateAnalytics(workspaceId: string, period: string = '30d'): Promise<VideoCallAnalytics> {
    try {
      const meetings = await this.getMeetings(workspaceId, { limit: 1000 });
      
      // Calculate date range based on period
      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const filteredMeetings = meetings.filter(m => 
        (m.createdAt >= startDate) && m.status === 'completed'
      );

      // Calculate analytics
      const analytics: VideoCallAnalytics = {
        workspaceId,
        period,
        overview: this.calculateOverview(filteredMeetings, meetings),
        usage: this.calculateUsage(filteredMeetings),
        quality: this.calculateQuality(filteredMeetings),
        participants: this.calculateParticipants(filteredMeetings),
        devices: this.calculateDevices(filteredMeetings),
        recordings: this.calculateRecordings(filteredMeetings),
        generatedAt: new Date()
      };

      return analytics;
    } catch (error) {
      console.error('Error generating analytics:', error);
      throw new Error('Failed to generate analytics');
    }
  }

  private static calculateOverview(filteredMeetings: Meeting[], allMeetings: Meeting[]) {
    const totalDuration = filteredMeetings.reduce((sum, m) => sum + (m.duration || 0), 0);
    const totalParticipants = filteredMeetings.reduce((sum, m) => sum + m.participants.length, 0);
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const meetingsThisWeek = allMeetings.filter(m => m.createdAt >= weekAgo).length;
    const meetingsThisMonth = allMeetings.filter(m => m.createdAt >= monthAgo).length;
    
    return {
      totalMeetings: filteredMeetings.length,
      totalParticipants,
      totalDuration,
      averageDuration: filteredMeetings.length > 0 ? Math.round(totalDuration / filteredMeetings.length) : 0,
      meetingsThisWeek,
      meetingsThisMonth,
      growthRate: 12.5 // TODO: Calculate actual growth rate
    };
  }

  private static calculateUsage(meetings: Meeting[]) {
    // Group by day, week, month
    const dailyMap = new Map<string, { count: number; duration: number }>();
    const weeklyMap = new Map<string, { count: number; duration: number }>();
    const monthlyMap = new Map<string, { count: number; duration: number }>();

    meetings.forEach(meeting => {
      const date = meeting.createdAt;
      const dayKey = date.toISOString().split('T')[0];
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const duration = meeting.duration || 0;

      // Daily
      const daily = dailyMap.get(dayKey) || { count: 0, duration: 0 };
      dailyMap.set(dayKey, { count: daily.count + 1, duration: daily.duration + duration });

      // Weekly
      const weekly = weeklyMap.get(weekKey) || { count: 0, duration: 0 };
      weeklyMap.set(weekKey, { count: weekly.count + 1, duration: weekly.duration + duration });

      // Monthly
      const monthly = monthlyMap.get(monthKey) || { count: 0, duration: 0 };
      monthlyMap.set(monthKey, { count: monthly.count + 1, duration: monthly.duration + duration });
    });

    return {
      dailyMeetings: Array.from(dailyMap.entries()).map(([date, data]) => ({ date, ...data })),
      weeklyMeetings: Array.from(weeklyMap.entries()).map(([week, data]) => ({ week, ...data })),
      monthlyMeetings: Array.from(monthlyMap.entries()).map(([month, data]) => ({ month, ...data }))
    };
  }

  private static calculateQuality(meetings: Meeting[]) {
    // Mock quality data - in real implementation, this would come from actual connection metrics
    return {
      averageRating: 4.2,
      connectionIssues: Math.floor(meetings.length * 0.05),
      audioIssues: Math.floor(meetings.length * 0.03),
      videoIssues: Math.floor(meetings.length * 0.02),
      successfulConnections: Math.floor(meetings.length * 0.95),
      failedConnections: Math.floor(meetings.length * 0.05)
    };
  }

  private static calculateParticipants(meetings: Meeting[]) {
    const allParticipants = meetings.flatMap(m => m.participants);
    const uniqueUsers = new Set(allParticipants.map(p => p.userId));
    
    const userStats = new Map<string, { meetings: number; duration: number; name: string }>();
    
    allParticipants.forEach(participant => {
      const stats = userStats.get(participant.userId) || { 
        meetings: 0, 
        duration: 0, 
        name: participant.userName 
      };
      userStats.set(participant.userId, {
        meetings: stats.meetings + 1,
        duration: stats.duration + (participant.duration || 0),
        name: participant.userName
      });
    });

    const topUsers = Array.from(userStats.entries())
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.meetings - a.meetings)
      .slice(0, 10);

    return {
      activeUsers: uniqueUsers.size,
      newUsers: Math.floor(uniqueUsers.size * 0.2), // Mock data
      returningUsers: Math.floor(uniqueUsers.size * 0.8), // Mock data
      averageParticipantsPerMeeting: meetings.length > 0 
        ? Math.round(allParticipants.length / meetings.length) 
        : 0,
      topUsers
    };
  }

  private static calculateDevices(meetings: Meeting[]) {
    const allParticipants = meetings.flatMap(m => m.participants);
    const deviceCounts = allParticipants.reduce((acc, p) => {
      acc[p.deviceType] = (acc[p.deviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      desktop: deviceCounts.desktop || 0,
      mobile: deviceCounts.mobile || 0,
      tablet: deviceCounts.tablet || 0
    };
  }

  private static calculateRecordings(meetings: Meeting[]) {
    const recordedMeetings = meetings.filter(m => m.hasRecording);
    const totalStorageUsed = recordedMeetings.reduce((sum, m) => sum + (m.recordingSize || 0), 0);
    
    return {
      totalRecordings: recordedMeetings.length,
      totalStorageUsed,
      averageRecordingSize: recordedMeetings.length > 0 
        ? Math.round(totalStorageUsed / recordedMeetings.length) 
        : 0,
      downloadCount: Math.floor(recordedMeetings.length * 2.5) // Mock data
    };
  }
}