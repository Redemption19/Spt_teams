// Test Firebase Configuration
require('dotenv').config();

console.log('🧪 Testing Firebase Configuration...\n');

const requiredEnvVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID'
];

let allGood = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    allGood = false;
  }
});

console.log('\n📊 Additional Services:');
const additionalVars = [
  'EXPO_PUBLIC_GEMINI_API_KEY',
  'EXPO_PUBLIC_AGORA_APP_ID',
  'EXPO_PUBLIC_EXCHANGERATE_API_KEY'
];

additionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`⚠️  ${varName}: Not configured (optional)`);
  }
});

console.log('\n' + (allGood ? '🎉 Firebase configuration is ready!' : '❌ Firebase configuration is incomplete!'));
