import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Debug: Log configuration to verify values
if (__DEV__) {
  console.log('🔧 Firebase Config Check:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 10)}...` : 'MISSING'
  });
  
  // Additional debug info
  console.log('🔧 Environment:', {
    platform: 'React Native',
    isExpo: true,
    nodeEnv: process.env.NODE_ENV
  });
}

// Debug: Log configuration (remove in production)
// if (__DEV__) {
//   console.log('🔧 Firebase Config:', {
//     apiKey: firebaseConfig.apiKey?.substring(0, 10) + '...',
//     authDomain: firebaseConfig.authDomain,
//     projectId: firebaseConfig.projectId,
//     appId: firebaseConfig.appId?.substring(0, 10) + '...'
//   });
// }

// Initialize Firebase app with better error handling
let app;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('🔥 Firebase initialized successfully');
  } else {
    app = getApp();
    console.log('🔥 Using existing Firebase app');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // If there's an error, try to get the existing app
  try {
    app = getApp();
    console.log('🔥 Retrieved existing Firebase app after error');
  } catch (getAppError) {
    console.error('❌ Failed to get existing Firebase app:', getAppError);
    throw new Error('Firebase initialization failed');
  }
}

// Ensure app is defined
if (!app) {
  throw new Error('Firebase app is not initialized');
}

// Initialize Firebase services with error handling
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log('✅ Firebase services initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase services:', error);
  throw error;
}

// Ensure all services are properly initialized
if (!auth || !db || !storage) {
  throw new Error('Firebase services are not properly initialized');
}

export { auth, db, storage };

// Connect to emulators in development mode (temporarily disabled)
/*
if (__DEV__) {
  try {
    // Connect Auth emulator
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('🔧 Connected to Auth Emulator');
    
    // Connect Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔧 Connected to Firestore Emulator');
    
    // Connect Storage emulator
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('🔧 Connected to Storage Emulator');
  } catch (error) {
    console.warn('Failed to connect to Firebase emulators:', error);
  }
}
*/

export default app;
