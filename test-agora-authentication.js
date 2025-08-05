/**
 * Test script to verify Agora token generation
 * Run this in the browser console to test authentication
 */

async function testAgoraTokenGeneration() {
  console.log('🧪 Testing Agora Token Generation...');
  
  // Test environment variables
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.NEXT_PUBLIC_AGORA_APP_CERTIFICATE;
  
  console.log('📋 Environment Check:', {
    'App ID': appId ? `${appId.slice(0, 8)}...` : '❌ Missing',
    'App Certificate': appCertificate ? `${appCertificate.slice(0, 8)}...` : '❌ Missing'
  });
  
  if (!appId || !appCertificate) {
    console.error('❌ Missing required environment variables');
    return;
  }
  
  try {
    // Dynamic import of token service
    const { generateDevelopmentToken } = await import('./lib/agora-token-service');
    
    // Test parameters
    const testChannel = 'test-channel-' + Date.now();
    const testUid = 'test-user-123';
    
    console.log('🔐 Generating token for:', {
      appId: `${appId.slice(0, 8)}...`,
      channel: testChannel,
      uid: testUid
    });
    
    // Generate token
    const token = await generateDevelopmentToken(appId, testChannel, testUid);
    
    if (token) {
      console.log('✅ Token generated successfully!');
      console.log('🎫 Token preview:', `${token.slice(0, 50)}...`);
      console.log('📏 Token length:', token.length, 'characters');
      
      // Verify token format (Agora tokens typically start with specific patterns)
      if (token.length > 100 && token.includes('.')) {
        console.log('✅ Token format appears valid');
      } else {
        console.warn('⚠️ Token format may be invalid');
      }
    } else {
      console.error('❌ Token generation failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in browser console
window.testAgoraTokenGeneration = testAgoraTokenGeneration;

console.log('🔧 Test function loaded. Run testAgoraTokenGeneration() in console to test.');
