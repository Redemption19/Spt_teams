import { CalendarService } from '../calendar-service';
import { WorkspaceService } from '../workspace-service';
import { UserService } from '../user-service';
import type {
  CalendarInsights,
  MeetingSuggestion
} from '../ai-types/ai-interfaces';

// =============================================================================
// CALENDAR AI SERVICE (Calendar-related AI insights)
// =============================================================================

export class CalendarAIService {
  // Helper function to resolve user IDs to names
  private static async resolveUserNames(userIds: string[], workspaceUsers?: any[]): Promise<string[]> {
    try {
      const userNames = [];
      for (const userId of userIds) {
        try {
          // First try to get from workspace users (faster lookup)
          if (workspaceUsers) {
            const workspaceUser = workspaceUsers.find(wu => wu.user.id === userId);
            if (workspaceUser && workspaceUser.user) {
              const user = workspaceUser.user;
              const displayName = user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.email || `User ${userId.slice(0, 8)}`;
              userNames.push(displayName);
              continue;
            }
          }
          
          // Fallback to UserService lookup
          const userProfile = await UserService.getUser(userId);
          if (userProfile) {
            const displayName = userProfile.firstName && userProfile.lastName 
              ? `${userProfile.firstName} ${userProfile.lastName}`
              : userProfile.email || `User ${userId.slice(0, 8)}`;
            userNames.push(displayName);
          } else {
            userNames.push(`User ${userId.slice(0, 8)}`);
          }
        } catch (error) {
          userNames.push(`User ${userId.slice(0, 8)}`);
        }
      }
      return userNames;
    } catch (error) {
      return userIds.map(id => `User ${id.slice(0, 8)}`);
    }
  }
  // Get comprehensive calendar insights with real data
  static async getCalendarInsights(userId: string, workspaceId: string): Promise<CalendarInsights> {
    try {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get real calendar events from the workspace
      const events = await CalendarService.getEvents(workspaceId, oneWeekAgo, oneWeekFromNow);

      // Filter upcoming events (next 7 days)
      const upcomingEvents = events
        .filter(event => event.start >= now && event.start <= oneWeekFromNow)
        .slice(0, 10)
        .map(event => ({
          id: event.id,
          title: event.title,
          start: event.start,
          type: event.type,
          priority: event.priority
        }));

      // Find conflicting meetings (overlapping times)
      const conflictingMeetings = this.findConflictingMeetings(events);

      // Calculate calendar utilization for the current week
      const weekEvents = events.filter(event => 
        event.start >= oneWeekAgo && 
        event.start <= now &&
        event.type === 'meeting'
      );

      const calendarUtilization = this.calculateUtilization(weekEvents);

      // Find free time slots (next 7 days, working hours only)
      const freeTimeSlots = this.findFreeTimeSlots(events, now, oneWeekFromNow);

      // Generate AI-powered meeting suggestions
      const suggestedMeetingTimes = await this.generateMeetingSuggestions(userId, workspaceId, events);

      // Calculate weekly statistics
      const weeklyMeetingCount = weekEvents.length;
      const averageMeetingDuration = weekEvents.length > 0 
        ? weekEvents.reduce((sum, event) => {
            const duration = event.end ? (event.end.getTime() - event.start.getTime()) / (1000 * 60) : 60;
            return sum + duration;
          }, 0) / weekEvents.length
        : 60;

      // Find most/least active days
      const dayActivity = this.analyzeDayActivity(events);

      const insights: CalendarInsights = {
        upcomingEvents,
        conflictingMeetings,
        calendarUtilization,
        freeTimeSlots,
        suggestedMeetingTimes,
        weeklyMeetingCount,
        averageMeetingDuration: Math.round(averageMeetingDuration),
        mostActiveDay: dayActivity.mostActive,
        leastActiveDay: dayActivity.leastActive
      };

      return insights;
    } catch (error) {
      console.error('❌ Error getting calendar insights:', error);
      // Return minimal insights on error
      return this.getEmptyInsights();
    }
  }

  // Find meetings that have overlapping times
  private static findConflictingMeetings(events: any[]): Array<{
    id: string;
    title: string;
    conflictWith: string;
    start: Date;
    end: Date;
  }> {
    const conflicts = [];
    const meetings = events.filter(event => event.type === 'meeting' && event.end);

    for (let i = 0; i < meetings.length; i++) {
      for (let j = i + 1; j < meetings.length; j++) {
        const meeting1 = meetings[i];
        const meeting2 = meetings[j];

        // Check if meetings overlap
        if (meeting1.start < meeting2.end && meeting2.start < meeting1.end) {
          conflicts.push({
            id: meeting1.id,
            title: meeting1.title,
            conflictWith: meeting2.title,
            start: meeting1.start,
            end: meeting1.end
          });
        }
      }
    }

    return conflicts.slice(0, 5); // Limit to 5 conflicts
  }

  // Calculate calendar utilization percentage
  private static calculateUtilization(events: any[]): number {
    const workingHoursPerWeek = 40 * 60; // 40 hours in minutes
    const totalMeetingTime = events.reduce((sum, event) => {
      const duration = event.end ? (event.end.getTime() - event.start.getTime()) / (1000 * 60) : 60;
      return sum + duration;
    }, 0);

    return Math.min(Math.round((totalMeetingTime / workingHoursPerWeek) * 100), 100);
  }

  // Find available time slots during working hours
  private static findFreeTimeSlots(events: any[], startDate: Date, endDate: Date): Array<{
    start: Date;
    end: Date;
    duration: number;
  }> {
    const freeSlots = [];
    const workingHours = { start: 9, end: 17 }; // 9 AM to 5 PM
    
    // For each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Check for free slots during working hours
      const dayStart = new Date(currentDate);
      dayStart.setHours(workingHours.start, 0, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(workingHours.end, 0, 0, 0);

      // Get events for this day
      const dayEvents = events
        .filter(event => 
          event.start.toDateString() === currentDate.toDateString() &&
          event.type === 'meeting'
        )
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      let lastEventEnd = dayStart;

      for (const event of dayEvents) {
        if (event.start > lastEventEnd) {
          const duration = (event.start.getTime() - lastEventEnd.getTime()) / (1000 * 60);
          if (duration >= 30) { // At least 30 minutes free
            freeSlots.push({
              start: new Date(lastEventEnd),
              end: new Date(event.start),
              duration: Math.round(duration)
            });
          }
        }
        lastEventEnd = event.end || new Date(event.start.getTime() + 60 * 60 * 1000); // 1 hour default
      }

      // Check for free time after last event
      if (lastEventEnd < dayEnd) {
        const duration = (dayEnd.getTime() - lastEventEnd.getTime()) / (1000 * 60);
        if (duration >= 30) {
          freeSlots.push({
            start: new Date(lastEventEnd),
            end: new Date(dayEnd),
            duration: Math.round(duration)
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return freeSlots.slice(0, 5); // Limit to 5 slots
  }

  // Generate AI-powered meeting suggestions based on workspace activity and user role
  private static async generateMeetingSuggestions(userId: string, workspaceId: string, events: any[]): Promise<MeetingSuggestion[]> {
    try {
      const suggestions: MeetingSuggestion[] = [];
      const userRole = await WorkspaceService.getUserRole(userId, workspaceId);
      const workspaceUsers = await WorkspaceService.getWorkspaceUsers(workspaceId);

      // Generate suggestions based on user role and workspace activity
      if (userRole === 'owner') {
        // Strategic meetings for owners
        const adminUserIds = workspaceUsers.filter(u => u.role === 'admin').map(u => u.user.id).slice(0, 3);
        const adminNames = await this.resolveUserNames(adminUserIds, workspaceUsers);
        
        suggestions.push({
          id: 'strategic-review',
          title: 'Monthly Strategic Review',
          description: 'Review workspace performance and plan strategic initiatives',
          type: 'Executive',
          suggestedTime: this.getNextWeekdayAt(10, 0), // Monday 10 AM
          duration: 120,
          priority: 'high',
          attendees: adminNames,
          reason: 'Regular strategic alignment ensures all departments work towards common goals',
          confidence: 0.9
        });

        const seniorUserIds = workspaceUsers.filter(u => u.role !== 'member').map(u => u.user.id).slice(0, 5);
        const seniorNames = await this.resolveUserNames(seniorUserIds, workspaceUsers);

        suggestions.push({
          id: 'department-heads-sync',
          title: 'Department Heads Synchronization',
          description: 'Sync between department heads on cross-departmental initiatives',
          type: 'Executive',
          suggestedTime: this.getNextWeekdayAt(14, 0), // Wednesday 2 PM
          duration: 90,
          priority: 'high',
          attendees: seniorNames,
          reason: 'Cross-departmental alignment prevents silos and improves collaboration',
          confidence: 0.85
        });
      }

      if (userRole === 'admin' || userRole === 'owner') {
        // Team meetings for admins and owners
        const teamUserIds = workspaceUsers.map(u => u.user.id).slice(0, 8);
        const teamNames = await this.resolveUserNames(teamUserIds, workspaceUsers);
        
        suggestions.push({
          id: 'team-standup',
          title: 'Weekly Team Standup',
          description: 'Weekly sync with team members on progress and blockers',
          type: 'Team Meeting',
          suggestedTime: this.getNextWeekdayAt(9, 30), // Monday 9:30 AM
          duration: 60,
          priority: 'medium',
          attendees: teamNames,
          reason: 'Regular team communication improves transparency and collaboration',
          confidence: 0.8
        });

        const projectUserIds = workspaceUsers.filter(u => u.role !== 'member').map(u => u.user.id).slice(0, 4);
        const projectNames = await this.resolveUserNames(projectUserIds, workspaceUsers);

        suggestions.push({
          id: 'project-review',
          title: 'Project Progress Review',
          description: 'Review current project status and address any issues',
          type: 'Review',
          suggestedTime: this.getNextWeekdayAt(15, 0), // Friday 3 PM
          duration: 75,
          priority: 'medium',
          attendees: projectNames,
          reason: 'Regular project reviews help identify issues early and maintain quality',
          confidence: 0.75
        });
      }

      // One-on-one suggestions for all roles
      if (workspaceUsers.length > 1) {
        const otherUserId = workspaceUsers.find(u => u.user.id !== userId)?.user.id || workspaceUsers[0].user.id;
        const otherUserNames = await this.resolveUserNames([otherUserId], workspaceUsers);
        
        suggestions.push({
          id: 'one-on-one',
          title: 'Team Member One-on-One',
          description: 'Individual meeting to discuss performance and career development',
          type: 'One-on-One',
          suggestedTime: this.getNextWeekdayAt(11, 0), // Tuesday 11 AM
          duration: 45,
          priority: 'medium',
          attendees: otherUserNames,
          reason: 'Regular one-on-ones improve employee engagement and development',
          confidence: 0.7
        });
      }

      // Training suggestions based on workspace size
      if (workspaceUsers.length >= 3) {
        const trainingUserIds = workspaceUsers.map(u => u.user.id).slice(0, 10);
        const trainingNames = await this.resolveUserNames(trainingUserIds, workspaceUsers);
        
        suggestions.push({
          id: 'skills-training',
          title: 'Professional Development Session',
          description: 'Team training session on relevant skills and technologies',
          type: 'Training',
          suggestedTime: this.getNextWeekdayAt(13, 30), // Thursday 1:30 PM
          duration: 90,
          priority: 'low',
          attendees: trainingNames,
          reason: 'Regular training sessions improve team capabilities and job satisfaction',
          confidence: 0.6
        });
      }

      return suggestions.slice(0, 4); // Limit to 4 suggestions
    } catch (error) {
      console.error('Error generating meeting suggestions:', error);
      return [];
    }
  }

  // Helper to get next weekday at specific time
  private static getNextWeekdayAt(hours: number, minutes: number): Date {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    
    // Find next weekday
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }
    
    next.setHours(hours, minutes, 0, 0);
    return next;
  }

  // Analyze which days have the most/least activity
  private static analyzeDayActivity(events: any[]): { mostActive: string; leastActive: string } {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCount = new Array(7).fill(0);

    events.forEach(event => {
      if (event.type === 'meeting') {
        dayCount[event.start.getDay()]++;
      }
    });

    const maxIndex = dayCount.indexOf(Math.max(...dayCount));
    const minIndex = dayCount.indexOf(Math.min(...dayCount));

    return {
      mostActive: dayNames[maxIndex],
      leastActive: dayNames[minIndex]
    };
  }

  // Return empty insights when no data is available
  private static getEmptyInsights(): CalendarInsights {
    return {
      upcomingEvents: [],
      conflictingMeetings: [],
      calendarUtilization: 0,
      freeTimeSlots: [],
      suggestedMeetingTimes: [],
      weeklyMeetingCount: 0,
      averageMeetingDuration: 0,
      mostActiveDay: 'Monday',
      leastActiveDay: 'Friday'
    };
  }
}
