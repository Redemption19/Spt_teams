/**
 * Agora Token Generation Service
 * For development: Using App Certificate to generate tokens
 * For production: Should use your backend server to generate tokens
 */

// Dynamic import to handle potential issues with agora-token (client-side only)
let RtcTokenBuilder: any;
let RtcRole: any;

// Only load on client-side to avoid SSR issues
if (typeof window !== 'undefined') {
  try {
    const agoraToken = require('agora-token');
    RtcTokenBuilder = agoraToken.RtcTokenBuilder;
    RtcRole = agoraToken.RtcRole;
  } catch (error) {
    // Token generation will be unavailable
  }
}

// Simple token generation for development (client-side)
// Note: In production, tokens should be generated server-side for security
export class AgoraTokenService {
  
  /**
   * Generate a token for development using App Certificate
   */
  static generateToken(
    appId: string,
    appCertificate: string,
    channelName: string,
    uid: string | number,
    role: number = 1, // 1 = PUBLISHER, 2 = SUBSCRIBER
    privilegeExpiredTs?: number
  ): string {
    
    if (!RtcTokenBuilder) {
      throw new Error('Agora token library not available. Please install agora-token.');
    }
    
    // Calculate expiration time (default: 24 hours from now)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpired = privilegeExpiredTs || (currentTimestamp + 86400); // 24 hours
    
    // Convert string UID to number if needed
    const numericUid = typeof uid === 'string' ? parseInt(uid.slice(-6), 36) % 1000000 : uid;
    
    try {
      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        numericUid,
        role,
        currentTimestamp,
        privilegeExpired
      );
      
      return token;
    } catch (error) {
      throw new Error(`Failed to generate token: ${(error as Error).message}`);
    }
  }
  
  /**
   * Check if token generation is available
   */
  static isTokenGenerationAvailable(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_AGORA_APP_ID && 
      process.env.NEXT_PUBLIC_AGORA_APP_CERTIFICATE &&
      RtcTokenBuilder
    );
  }
}

/**
 * Development Token Generator (Client-side)
 * WARNING: This is for development only!
 * In production, tokens must be generated on your backend server
 */
export async function generateDevelopmentToken(
  appId: string,
  channel: string,
  uid: string | number
): Promise<string | null> {
  
  // Only run on client-side
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Check if we have App Certificate in environment
  const appCertificate = process.env.NEXT_PUBLIC_AGORA_APP_CERTIFICATE;
  
  if (!appCertificate) {
    return null;
  }
  
  if (!AgoraTokenService.isTokenGenerationAvailable()) {
    return null;
  }
  
  try {
    const token = AgoraTokenService.generateToken(
      appId,
      appCertificate,
      channel,
      uid,
      1 // PUBLISHER role
    );
    
    return token;
  } catch (error) {
    return null;
  }
}
