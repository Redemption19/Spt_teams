import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInAnonymously,
  User as FirebaseUser,
  onAuthStateChanged,
  Auth
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { UserService } from './userService';
import { ActivityService } from './activityService';

export class AuthService {
  // Sign in with email and password
  static async signInWithEmail(email: string, password: string): Promise<{ user: User; isNewUser: boolean }> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userProfile = await UserService.getUserById(result.user.uid);
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Update last active
      await UserService.updateLastActive(result.user.uid);
      
      // Log login activity
      try {
        await ActivityService.logLoginActivity(result.user.uid, userProfile.workspaceId, 'email');
      } catch (error) {
        console.warn('Warning: Could not log login activity:', error);
      }
      
      return { user: userProfile, isNewUser: false };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Sign up with email and password
  static async signUpWithEmail(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    jobTitle?: string;
    department?: string;
    region?: string;
    branch?: string;
  }): Promise<{ user: User; isNewUser: boolean }> {
    try {
      const result = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      
      // Create user profile using UserService
      const userProfile = await UserService.createUserSecurely({
        id: result.user.uid,
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        jobTitle: userData.jobTitle,
        department: userData.department,
        branchId: userData.branch,
        regionId: userData.region,
        workspaceId: 'workspace-1', // Default workspace
      });

      // Log user creation activity
      try {
        await ActivityService.logUserCreationActivity(result.user.uid, userProfile.workspaceId, userProfile);
      } catch (error) {
        console.warn('Warning: Could not log user creation activity:', error);
      }

      return { user: userProfile, isNewUser: true };
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Sign in with Google
  static async signInWithGoogle(): Promise<{ user: User; isNewUser: boolean }> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      
      // Check if user profile exists
      const existingProfile = await UserService.getUserById(result.user.uid);
      
      if (existingProfile) {
        // Update last active
        await UserService.updateLastActive(result.user.uid);
        
        // Log login activity
        try {
          await ActivityService.logLoginActivity(result.user.uid, existingProfile.workspaceId, 'google');
        } catch (error) {
          console.warn('Warning: Could not log Google login activity:', error);
        }
        
        return { user: existingProfile, isNewUser: false };
      } else {
        // Create new user profile using UserService
        const userProfile = await UserService.createGoogleUser({
          id: result.user.uid,
          email: result.user.email!,
          name: result.user.displayName || 'Google User',
          firstName: result.user.displayName?.split(' ')[0] || '',
          lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
          workspaceId: 'workspace-1', // Default workspace for new users
          photoURL: result.user.photoURL || '',
          isEmailVerified: result.user.emailVerified,
        });
        
        // Log user creation activity
        try {
          await ActivityService.logUserCreationActivity(result.user.uid, userProfile.workspaceId, userProfile);
        } catch (error) {
          console.warn('Warning: Could not log Google user creation activity:', error);
        }
        
        return { user: userProfile, isNewUser: true };
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Sign in as guest
  static async signInAsGuest(): Promise<{ user: User; isNewUser: boolean }> {
    try {
      const result = await signInAnonymously(auth);
      
      // Create guest profile
      const guestProfile: User = {
        id: result.user.uid,
        email: 'guest@example.com',
        firstName: 'Guest',
        lastName: 'User',
        name: 'Guest User',
        role: 'member',
        workspaceId: 'guest-workspace',
        teamIds: [],
        preferences: {
          theme: 'light',
          notifications: { push: false, email: false, inApp: true },
          language: 'en',
          timezone: 'UTC'
        },
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isGuest: true,
      };

      // Save guest profile to Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        ...guestProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { user: guestProfile, isNewUser: true };
    } catch (error: any) {
      console.error('Guest sign in error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      // Get current user before signing out
      const currentUser = auth.currentUser;
      let userProfile: User | null = null;
      
      if (currentUser) {
        try {
          userProfile = await UserService.getUserById(currentUser.uid);
        } catch (error) {
          console.warn('Could not get user profile for logout logging:', error);
        }
      }
      
      await signOut(auth);
      await AsyncStorage.removeItem('user');
      await SecureStore.deleteItemAsync('auth_token');
      
      // Log logout activity if we have user profile
      if (userProfile) {
        try {
          await ActivityService.logLogoutActivity(currentUser!.uid, userProfile.workspaceId);
        } catch (error) {
          console.warn('Warning: Could not log logout activity:', error);
        }
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }



  // Get Firebase error message
  private static getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Sign-in was cancelled.',
      'auth/popup-blocked': 'Please allow pop-ups for this site.',
      'auth/unauthorized-domain': 'This domain is not authorized for sign-in.',
      'auth/operation-not-supported-in-this-environment': 'This operation is not supported.',
      'auth/auth-domain-config-required': 'Authentication domain configuration required.',
      'auth/web-storage-unsupported': 'Web storage is not supported in this environment.',
    };

    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
  }

  // Save user to local storage
  static async saveUserToStorage(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Save user to storage error:', error);
    }
  }

  // Get user from local storage
  static async getUserFromStorage(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get user from storage error:', error);
      return null;
    }
  }

  // Clear local storage
  static async clearStorage(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Clear storage error:', error);
    }
  }
}
