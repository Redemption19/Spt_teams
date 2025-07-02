import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ======================================
// FIREBASE EMULATOR CONFIGURATION
// (Commented out for production mode)
// ======================================
/*
// Connect to emulators in development mode
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Check if we're in the browser and in development mode
  const isEmulatorConnected = {
    auth: false,
    firestore: false,
    storage: false
  };

  // Connect Auth emulator
  if (!isEmulatorConnected.auth) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099');
      isEmulatorConnected.auth = true;
      console.log('🔧 Connected to Auth Emulator');
    } catch (error) {
      console.warn('Failed to connect to Auth Emulator:', error);
    }
  }

  // Connect Firestore emulator
  if (!isEmulatorConnected.firestore) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      isEmulatorConnected.firestore = true;
      console.log('🔧 Connected to Firestore Emulator');
    } catch (error) {
      console.warn('Failed to connect to Firestore Emulator:', error);
    }
  }

  // Connect Storage emulator
  if (!isEmulatorConnected.storage) {
    try {
      connectStorageEmulator(storage, 'localhost', 9199);
      isEmulatorConnected.storage = true;
      console.log('🔧 Connected to Storage Emulator');
    } catch (error) {
      console.warn('Failed to connect to Storage Emulator:', error);
    }
  }
}
*/

export default app;