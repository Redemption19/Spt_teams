import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { UserService } from '../services/userService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function RootLayout() {
  const { setUser, setIsNewUser, setLoading } = useAuthStore();

  useEffect(() => {
    console.log('🔧 Setting up Firebase auth listener...');
    
    // Add timeout to prevent hanging
    const authTimeout = setTimeout(() => {
      console.log('⏰ Auth listener timeout, setting loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout
    
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('🔥 Firebase auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
        
        if (firebaseUser) {
          try {
            console.log('👤 Loading user profile for:', firebaseUser.uid);
            const userProfile = await UserService.getUserById(firebaseUser.uid);
            if (userProfile) {
              console.log('✅ User profile loaded:', userProfile.email);
              setUser(userProfile);
              setLoading(false);
              // Check if this is a new user (first login)
              if (userProfile.firstLogin) {
                setIsNewUser(true);
                console.log('🆕 New user detected');
              }
            } else {
              console.log('⚠️ No user profile found for:', firebaseUser.uid);
              setUser(null);
              setIsNewUser(false);
              setLoading(false);
            }
                      } catch (error) {
              console.error('❌ Error loading user profile:', error);
              setUser(null);
              setIsNewUser(false);
              setLoading(false);
            }
                  } else {
            console.log('👋 User logged out, clearing state');
            setUser(null);
            setIsNewUser(false);
            setLoading(false);
          }
      });

      return () => {
        console.log('🧹 Cleaning up Firebase auth listener');
        clearTimeout(authTimeout);
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ Error setting up Firebase auth listener:', error);
    }
  }, [setUser, setIsNewUser]);



  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
