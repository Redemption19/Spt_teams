/**
 * Video Call Utility Functions
 * Handles channel name generation and validation for Agora video calls
 */

// Agora channel name constraints
const AGORA_CHANNEL_NAME_MAX_LENGTH = 64;
const AGORA_VALID_CHARS = /^[a-zA-Z0-9\s!#$%&()+\-:;<=>?@\[\]^_{|}~,]*$/;

/**
 * Generate a short, valid channel name for Agora video calls
 * Ensures the name is within 64 characters and uses only supported characters
 */
export function generateChannelName(prefix: string, identifier?: string): string {
  // Create a short timestamp (last 8 digits of current time)
  const shortTimestamp = Date.now().toString().slice(-8);
  
  // Create a short random string for uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  
  // Clean the prefix to only include valid characters
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  // If identifier is provided, use a short version of it
  let channelName: string;
  if (identifier) {
    // Take first 8 characters of identifier and clean it
    const cleanId = identifier.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
    channelName = `${cleanPrefix}-${cleanId}-${shortTimestamp}`;
  } else {
    channelName = `${cleanPrefix}-${shortTimestamp}-${randomSuffix}`;
  }
  
  // Ensure the channel name doesn't exceed the maximum length
  if (channelName.length > AGORA_CHANNEL_NAME_MAX_LENGTH) {
    // Truncate while keeping the timestamp for uniqueness
    const maxPrefixLength = AGORA_CHANNEL_NAME_MAX_LENGTH - shortTimestamp.length - 1; // -1 for hyphen
    const truncatedPrefix = channelName.substring(0, maxPrefixLength);
    channelName = `${truncatedPrefix}-${shortTimestamp}`;
  }
  
  return channelName;
}

/**
 * Generate a channel name specifically for interviews
 */
export function generateInterviewChannelName(interviewId: string): string {
  return generateChannelName('interview', interviewId);
}

/**
 * Generate a channel name for team meetings
 */
export function generateTeamChannelName(teamId: string): string {
  return generateChannelName('team', teamId);
}

/**
 * Generate a channel name for general meetings
 */
export function generateMeetingChannelName(meetingId?: string): string {
  return generateChannelName('meeting', meetingId);
}

/**
 * Validate if a channel name is valid for Agora
 */
export function validateChannelName(channelName: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check length
  if (channelName.length === 0) {
    errors.push('Channel name cannot be empty');
  } else if (channelName.length > AGORA_CHANNEL_NAME_MAX_LENGTH) {
    errors.push(`Channel name must be ${AGORA_CHANNEL_NAME_MAX_LENGTH} characters or less`);
  }
  
  // Check valid characters
  if (!AGORA_VALID_CHARS.test(channelName)) {
    errors.push('Channel name contains invalid characters. Only a-z, A-Z, 0-9, space, !, #, $, %, &, (, ), +, -, :, ;, <, =, ., >, ?, @, [, ], ^, _, {, }, |, ~, , are allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize a channel name to make it valid for Agora
 */
export function sanitizeChannelName(channelName: string): string {
  // Replace invalid characters with hyphens
  let sanitized = channelName.replace(/[^a-zA-Z0-9\s!#$%&()+\-:;<=>?@\[\]^_{|}~,]/g, '-');
  
  // Remove multiple consecutive hyphens
  sanitized = sanitized.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '');
  
  // Truncate if too long
  if (sanitized.length > AGORA_CHANNEL_NAME_MAX_LENGTH) {
    sanitized = sanitized.substring(0, AGORA_CHANNEL_NAME_MAX_LENGTH);
    // Remove trailing hyphen if truncation created one
    sanitized = sanitized.replace(/-+$/, '');
  }
  
  return sanitized;
}

/**
 * Create a safe channel name from any input string
 */
export function createSafeChannelName(input: string, prefix: string = 'call'): string {
  const sanitized = sanitizeChannelName(input);
  
  // If sanitization resulted in empty string, generate a new one
  if (!sanitized) {
    return generateChannelName(prefix);
  }
  
  // If still too long after sanitization, use generation method
  if (sanitized.length > AGORA_CHANNEL_NAME_MAX_LENGTH - 10) { // Leave room for timestamp
    return generateChannelName(prefix, sanitized.substring(0, 8));
  }
  
  return sanitized;
}

/**
 * Get channel name constraints for display in UI
 */
export function getChannelNameConstraints() {
  return {
    maxLength: AGORA_CHANNEL_NAME_MAX_LENGTH,
    validCharsPattern: AGORA_VALID_CHARS,
    validCharsDescription: 'a-z, A-Z, 0-9, space, !, #, $, %, &, (, ), +, -, :, ;, <, =, ., >, ?, @, [, ], ^, _, {, }, |, ~, ,'
  };
}