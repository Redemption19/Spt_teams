// Authentication Security Service
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch 
} from 'firebase/firestore';

export interface SecurityEvent {
  id: string;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  eventType: 'login_success' | 'login_failed' | 'logout' | 'password_reset' | 'account_locked' | 'suspicious_activity';
  timestamp: Date;
  metadata?: Record<string, any>;
  workspaceId?: string;
}

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

export interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
  isBlocked: boolean;
}

export interface SessionInfo {
  id: string;
  userId: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActive: Date;
  expiresAt: Date;
  isActive: boolean;
  workspaceId?: string;
}

export interface SecuritySettings {
  enableRateLimiting: boolean;
  enableSessionTracking: boolean;
  enableSuspiciousActivityDetection: boolean;
  maxSessionsPerUser: number;
  sessionTimeoutMinutes: number;
  requirePasswordChangeOnSuspiciousActivity: boolean;
  notifyOnSuspiciousActivity: boolean;
  allowedLoginAttempts: number;
  lockoutDurationMinutes: number;
  suspiciousActivityThreshold: number;
}

export class AuthSecurityService {
  private static readonly SECURITY_EVENTS_COLLECTION = 'security_events';
  private static readonly SESSIONS_COLLECTION = 'user_sessions';
  private static readonly SECURITY_SETTINGS_COLLECTION = 'security_settings';

  /**
   * Log a security event
   */
  static async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const eventDoc = doc(collection(db, this.SECURITY_EVENTS_COLLECTION));
      const securityEvent: SecurityEvent = {
        id: eventDoc.id,
        ...event,
        timestamp: new Date()
      };

      await setDoc(eventDoc, {
        ...securityEvent,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Check rate limiting for a specific identifier (email, IP, etc.)
   */
  static async checkRateLimit(
    identifier: string,
    config: RateLimitConfig = {
      maxAttempts: 5,
      windowMs: 5 * 60 * 1000, // 5 minutes
      blockDurationMs: 15 * 60 * 1000 // 15 minutes
    }
  ): Promise<RateLimitState> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);

      // Query recent failed login attempts
      const eventsQuery = query(
        collection(db, this.SECURITY_EVENTS_COLLECTION),
        where('eventType', '==', 'login_failed'),
        where('email', '==', identifier),
        where('timestamp', '>=', windowStart),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(eventsQuery);
      const failedAttempts = snapshot.docs.map(doc => ({
        timestamp: doc.data().timestamp.toDate(),
        ...doc.data()
      }));

      const state: RateLimitState = {
        attempts: failedAttempts.length,
        lastAttempt: failedAttempts.length > 0 ? failedAttempts[0].timestamp.getTime() : 0,
        isBlocked: false
      };

      // Check if blocked
      if (failedAttempts.length >= config.maxAttempts) {
        const lastAttempt = failedAttempts[0].timestamp.getTime();
        const blockUntil = lastAttempt + config.blockDurationMs;
        
        if (now.getTime() < blockUntil) {
          state.blockedUntil = blockUntil;
          state.isBlocked = true;
        }
      }

      return state;
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      // Return safe default
      return {
        attempts: 0,
        lastAttempt: 0,
        isBlocked: false
      };
    }
  }

  /**
   * Create a new user session
   */
  static async createSession(sessionData: Omit<SessionInfo, 'id' | 'createdAt' | 'lastActive'>): Promise<string> {
    try {
      const sessionDoc = doc(collection(db, this.SESSIONS_COLLECTION));
      const session: SessionInfo = {
        id: sessionDoc.id,
        ...sessionData,
        createdAt: new Date(),
        lastActive: new Date()
      };

      await setDoc(sessionDoc, {
        ...session,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        expiresAt: serverTimestamp()
      });

      return sessionDoc.id;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Update session activity
   */
  static async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(db, this.SESSIONS_COLLECTION, sessionId);
      await updateDoc(sessionRef, {
        lastActive: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  /**
   * Get active sessions for a user
   */
  static async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const sessionsQuery = query(
        collection(db, this.SESSIONS_COLLECTION),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('lastActive', 'desc')
      );

      const snapshot = await getDocs(sessionsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        lastActive: doc.data().lastActive?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      })) as SessionInfo[];
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Invalidate a session
   */
  static async invalidateSession(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(db, this.SESSIONS_COLLECTION, sessionId);
      await updateDoc(sessionRef, {
        isActive: false
      });
    } catch (error) {
      console.error('Failed to invalidate session:', error);
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  static async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      const sessionsQuery = query(
        collection(db, this.SESSIONS_COLLECTION),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(sessionsQuery);
      const batch = writeBatch(db);

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to invalidate user sessions:', error);
    }
  }

  /**
   * Detect suspicious activity
   */
  static async detectSuspiciousActivity(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string
  ): Promise<boolean> {
    try {
      const settings = await this.getSecuritySettings();
      if (!settings.enableSuspiciousActivityDetection) {
        return false;
      }

      // Check for multiple failed attempts
      const recentEvents = await this.getRecentSecurityEvents(email, 24); // Last 24 hours
      const failedAttempts = recentEvents.filter(event => event.eventType === 'login_failed');
      
      if (failedAttempts.length >= settings.suspiciousActivityThreshold) {
        await this.logSecurityEvent({
          userId,
          email,
          ipAddress,
          userAgent,
          eventType: 'suspicious_activity',
          metadata: {
            reason: 'multiple_failed_attempts',
            failedAttempts: failedAttempts.length,
            threshold: settings.suspiciousActivityThreshold
          }
        });
        return true;
      }

      // Check for login from new location/IP
      const userSessions = await this.getUserSessions(userId);
      const knownIPs = new Set(userSessions.map(session => session.ipAddress));
      
      if (!knownIPs.has(ipAddress) && userSessions.length > 0) {
        await this.logSecurityEvent({
          userId,
          email,
          ipAddress,
          userAgent,
          eventType: 'suspicious_activity',
          metadata: {
            reason: 'new_ip_address',
            knownIPs: Array.from(knownIPs)
          }
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to detect suspicious activity:', error);
      return false;
    }
  }

  /**
   * Get recent security events
   */
  static async getRecentSecurityEvents(
    email: string,
    hours: number = 24
  ): Promise<SecurityEvent[]> {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - (hours * 60 * 60 * 1000));

      const eventsQuery = query(
        collection(db, this.SECURITY_EVENTS_COLLECTION),
        where('email', '==', email),
        where('timestamp', '>=', startTime),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(eventsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as SecurityEvent[];
    } catch (error) {
      console.error('Failed to get recent security events:', error);
      return [];
    }
  }

  /**
   * Get security settings
   */
  static async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const settingsDoc = await getDoc(doc(db, this.SECURITY_SETTINGS_COLLECTION, 'default'));
      
      if (settingsDoc.exists()) {
        return settingsDoc.data() as SecuritySettings;
      }

      // Return default settings
      return {
        enableRateLimiting: true,
        enableSessionTracking: true,
        enableSuspiciousActivityDetection: true,
        maxSessionsPerUser: 5,
        sessionTimeoutMinutes: 60 * 24, // 24 hours
        requirePasswordChangeOnSuspiciousActivity: true,
        notifyOnSuspiciousActivity: true,
        allowedLoginAttempts: 5,
        lockoutDurationMinutes: 15,
        suspiciousActivityThreshold: 3
      };
    } catch (error) {
      console.error('Failed to get security settings:', error);
      // Return safe defaults
      return {
        enableRateLimiting: true,
        enableSessionTracking: false,
        enableSuspiciousActivityDetection: false,
        maxSessionsPerUser: 5,
        sessionTimeoutMinutes: 60 * 24,
        requirePasswordChangeOnSuspiciousActivity: false,
        notifyOnSuspiciousActivity: false,
        allowedLoginAttempts: 5,
        lockoutDurationMinutes: 15,
        suspiciousActivityThreshold: 3
      };
    }
  }

  /**
   * Update security settings
   */
  static async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<void> {
    try {
      const settingsRef = doc(db, this.SECURITY_SETTINGS_COLLECTION, 'default');
      await setDoc(settingsRef, settings, { merge: true });
    } catch (error) {
      console.error('Failed to update security settings:', error);
      throw new Error('Failed to update security settings');
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = new Date();
      const sessionsQuery = query(
        collection(db, this.SESSIONS_COLLECTION),
        where('isActive', '==', true),
        where('expiresAt', '<', now)
      );

      const snapshot = await getDocs(sessionsQuery);
      const batch = writeBatch(db);

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }

  /**
   * Get security statistics
   */
  static async getSecurityStats(workspaceId?: string): Promise<{
    totalEvents: number;
    failedLogins: number;
    suspiciousActivities: number;
    activeSessions: number;
    lockedAccounts: number;
  }> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));

      // Get events in last 24 hours
      const eventsQuery = query(
        collection(db, this.SECURITY_EVENTS_COLLECTION),
        where('timestamp', '>=', last24Hours),
        ...(workspaceId ? [where('workspaceId', '==', workspaceId)] : [])
      );

      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => doc.data());

      // Get active sessions
      const sessionsQuery = query(
        collection(db, this.SESSIONS_COLLECTION),
        where('isActive', '==', true),
        ...(workspaceId ? [where('workspaceId', '==', workspaceId)] : [])
      );

      const sessionsSnapshot = await getDocs(sessionsQuery);

      return {
        totalEvents: events.length,
        failedLogins: events.filter(e => e.eventType === 'login_failed').length,
        suspiciousActivities: events.filter(e => e.eventType === 'suspicious_activity').length,
        activeSessions: sessionsSnapshot.size,
        lockedAccounts: events.filter(e => e.eventType === 'account_locked').length
      };
    } catch (error) {
      console.error('Failed to get security stats:', error);
      return {
        totalEvents: 0,
        failedLogins: 0,
        suspiciousActivities: 0,
        activeSessions: 0,
        lockedAccounts: 0
      };
    }
  }
}
