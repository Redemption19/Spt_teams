/**
 * Test script to verify channel name generation utility
 * Run with: node test-channel-names.js
 */

// Import functions directly for testing
function generateChannelName(prefix, identifier) {
  const shortTimestamp = Date.now().toString().slice(-8);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  let channelName;
  if (identifier) {
    const cleanId = identifier.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
    channelName = `${cleanPrefix}-${cleanId}-${shortTimestamp}`;
  } else {
    channelName = `${cleanPrefix}-${shortTimestamp}-${randomSuffix}`;
  }
  
  if (channelName.length > 64) {
    const maxPrefixLength = 64 - shortTimestamp.length - 1;
    const truncatedPrefix = channelName.substring(0, maxPrefixLength);
    channelName = `${truncatedPrefix}-${shortTimestamp}`;
  }
  
  return channelName;
}

function generateInterviewChannelName(interviewId) {
  return generateChannelName('interview', interviewId);
}

function generateTeamChannelName(teamId) {
  return generateChannelName('team', teamId);
}

function generateMeetingChannelName(meetingId) {
  return generateChannelName('meeting', meetingId);
}

function validateChannelName(channelName) {
  const errors = [];
  const AGORA_VALID_CHARS = /^[a-zA-Z0-9\s!#$%&()+\-:;<=>?@\[\]^_{|}~,]*$/;
  
  if (channelName.length === 0) {
    errors.push('Channel name cannot be empty');
  } else if (channelName.length > 64) {
    errors.push('Channel name must be 64 characters or less');
  }
  
  if (!AGORA_VALID_CHARS.test(channelName)) {
    errors.push('Channel name contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function sanitizeChannelName(channelName) {
  let sanitized = channelName.replace(/[^a-zA-Z0-9\s!#$%&()+\-:;<=>?@\[\]^_{|}~,]/g, '-');
  sanitized = sanitized.replace(/-+/g, '-');
  sanitized = sanitized.replace(/^-+|-+$/g, '');
  
  if (sanitized.length > 64) {
    sanitized = sanitized.substring(0, 64);
    sanitized = sanitized.replace(/-+$/, '');
  }
  
  return sanitized;
}

function createSafeChannelName(input, prefix = 'call') {
  const sanitized = sanitizeChannelName(input);
  
  if (!sanitized) {
    return generateChannelName(prefix);
  }
  
  if (sanitized.length > 54) {
    return generateChannelName(prefix, sanitized.substring(0, 8));
  }
  
  return sanitized;
}

console.log('🧪 Testing Video Call Channel Name Generation\n');

// Test interview channel names
console.log('📋 Interview Channel Names:');
const interviewIds = [
  'interview-123456789012345678901234567890', // Long ID
  'short-id',
  'interview_with_special_chars!@#$%',
  '12345'
];

interviewIds.forEach(id => {
  const channelName = generateInterviewChannelName(id);
  const validation = validateChannelName(channelName);
  console.log(`  ID: ${id}`);
  console.log(`  Channel: ${channelName} (${channelName.length} chars)`);
  console.log(`  Valid: ${validation.isValid ? '✅' : '❌'}`);
  if (!validation.isValid) {
    console.log(`  Errors: ${validation.errors.join(', ')}`);
  }
  console.log('');
});

// Test team channel names
console.log('👥 Team Channel Names:');
const teamIds = [
  'team-very-long-team-id-that-might-cause-issues-123456789',
  'team-123',
  'special_team!@#'
];

teamIds.forEach(id => {
  const channelName = generateTeamChannelName(id);
  const validation = validateChannelName(channelName);
  console.log(`  ID: ${id}`);
  console.log(`  Channel: ${channelName} (${channelName.length} chars)`);
  console.log(`  Valid: ${validation.isValid ? '✅' : '❌'}`);
  if (!validation.isValid) {
    console.log(`  Errors: ${validation.errors.join(', ')}`);
  }
  console.log('');
});

// Test meeting channel names
console.log('🤝 Meeting Channel Names:');
for (let i = 0; i < 3; i++) {
  const channelName = generateMeetingChannelName();
  const validation = validateChannelName(channelName);
  console.log(`  Channel: ${channelName} (${channelName.length} chars)`);
  console.log(`  Valid: ${validation.isValid ? '✅' : '❌'}`);
  console.log('');
}

// Test the old problematic pattern
console.log('🚨 Testing Old Problematic Pattern:');
const oldPattern = `interview-very-long-interview-id-123456789012345678901234567890-${Date.now()}`;
const oldValidation = validateChannelName(oldPattern);
console.log(`  Old Pattern: ${oldPattern} (${oldPattern.length} chars)`);
console.log(`  Valid: ${oldValidation.isValid ? '✅' : '❌'}`);
if (!oldValidation.isValid) {
  console.log(`  Errors: ${oldValidation.errors.join(', ')}`);
}

// Test sanitization
console.log('\n🧹 Testing Sanitization:');
const problematicNames = [
  'interview-with-invalid-chars-äöü-123456789012345678901234567890',
  'meeting@#$%^&*()+=[]{}|\\:;"<>?,./~`',
  'team-' + 'x'.repeat(100) // Very long name
];

problematicNames.forEach(name => {
  const sanitized = sanitizeChannelName(name);
  const safe = createSafeChannelName(name);
  console.log(`  Original: ${name} (${name.length} chars)`);
  console.log(`  Sanitized: ${sanitized} (${sanitized.length} chars)`);
  console.log(`  Safe: ${safe} (${safe.length} chars)`);
  console.log(`  Safe Valid: ${validateChannelName(safe).isValid ? '✅' : '❌'}`);
  console.log('');
});

console.log('✅ Channel name generation test completed!');