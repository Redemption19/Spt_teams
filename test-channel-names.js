/**
 * Test script to verify channel name generation utility
 * Run with: node test-channel-names.js
 */

// Test channel name generation to ensure it works correctly
const { generateChannelName, validateChannelName, sanitizeChannelName } = require('./lib/video-call-utils.ts');

// Test the old problematic method
function oldGenerateMeetingId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Test the new safe method
function newGenerateMeetingId() {
  return generateChannelName('meeting');
}

console.log('Testing channel name generation...\n');

// Test old method (problematic)
console.log('OLD METHOD (Problematic):');
for (let i = 0; i < 5; i++) {
  const oldId = oldGenerateMeetingId();
  const validation = validateChannelName(oldId);
  console.log(`  Generated: "${oldId}"`);
  console.log(`  Length: ${oldId.length}`);
  console.log(`  Valid: ${validation.isValid}`);
  if (!validation.isValid) {
    console.log(`  Errors: ${validation.errors.join(', ')}`);
  }
  console.log('');
}

// Test new method (safe)
console.log('NEW METHOD (Safe):');
for (let i = 0; i < 5; i++) {
  const newId = newGenerateMeetingId();
  const validation = validateChannelName(newId);
  console.log(`  Generated: "${newId}"`);
  console.log(`  Length: ${newId.length}`);
  console.log(`  Valid: ${validation.isValid}`);
  if (!validation.isValid) {
    console.log(`  Errors: ${validation.errors.join(', ')}`);
  }
  console.log('');
}

// Test sanitization
console.log('SANITIZATION TEST:');
const problematicNames = [
  'meeting@#$%^&*()',
  'call with spaces and special chars!@#',
  'very-long-meeting-name-that-exceeds-the-maximum-length-allowed-by-agora-and-should-be-truncated',
  'meeting-with-unicode-🚀-emoji',
  'meeting/with/slashes\\and\\backslashes'
];

problematicNames.forEach(name => {
  const sanitized = sanitizeChannelName(name);
  const validation = validateChannelName(sanitized);
  console.log(`  Original: "${name}"`);
  console.log(`  Sanitized: "${sanitized}"`);
  console.log(`  Length: ${sanitized.length}`);
  console.log(`  Valid: ${validation.isValid}`);
  console.log('');
});

console.log('✅ Channel name generation test completed!');