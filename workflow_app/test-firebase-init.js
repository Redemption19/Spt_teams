// Test Firebase Initialization
require('dotenv').config();

console.log('🧪 Testing Firebase Initialization...\n');

// Test environment variables
const requiredEnvVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID'
];

console.log('📋 Environment Variables:');
let allEnvVarsGood = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    allEnvVarsGood = false;
  }
});

if (!allEnvVarsGood) {
  console.log('\n❌ Environment variables are missing. Cannot proceed with Firebase test.');
  process.exit(1);
}

console.log('\n🔥 Testing Firebase Initialization...');

// Test Firebase initialization
try {
  const { initializeApp, getApps, getApp } = require('firebase/app');
  
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  let app;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');
  } else {
    app = getApp();
    console.log('✅ Using existing Firebase app');
  }

  // Test Firebase services
  const { getAuth } = require('firebase/auth');
  const { getFirestore } = require('firebase/firestore');
  const { getStorage } = require('firebase/storage');
  
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  
  console.log('✅ Firebase services initialized successfully');
  console.log('✅ Auth service:', !!auth);
  console.log('✅ Firestore service:', !!db);
  console.log('✅ Storage service:', !!storage);
  
  console.log('\n🎉 Firebase initialization test passed!');
  
} catch (error) {
  console.error('\n❌ Firebase initialization test failed:', error.message);
  process.exit(1);
}
