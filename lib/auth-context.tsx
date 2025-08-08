'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from './types';
import { EmailService } from './email-service';
import { PasswordChangeModal } from '../components/auth/password-change-modal';

// Helper to ensure guest user doc exists in Firestore
async function ensureGuestUserDoc(user: FirebaseUser) {
  if (!user) return;
  await setDoc(doc(db, 'users', user.uid), {
    id: user.uid,
    email: 'guest@example.com',
    name: 'Guest User',
    role: 'member',
    workspaceId: 'guest-workspace',
    teamIds: [],
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    status: 'active',
    isGuest: true,
  }, { merge: true });
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  isNewUser: boolean;
  requiresPasswordChange: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: {
    name: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    jobTitle?: string;
    department?: string;
    branchId?: string;
    regionId?: string;
    workspaceId?: string;
  }, role?: 'owner' | 'admin' | 'member', inviteToken?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  clearNewUserFlag: () => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  // Initialize EmailJS on client side
  useEffect(() => {
    EmailService.init();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check if this is a guest user
        const isGuestUser = user.isAnonymous;
        setIsGuest(isGuestUser);
        
        if (isGuestUser) {
          // Create a guest profile
          const guestProfile: User = {
            id: user.uid,
            email: 'guest@example.com',
            name: 'Guest User',
            role: 'member',
            workspaceId: 'guest-workspace',
            teamIds: [],
            createdAt: new Date(),
            lastActive: new Date(),
            status: 'active',
            // Guest-specific flags
            requiresPasswordChange: false,
            firstLogin: false,
          };
          setUserProfile(guestProfile);
          setRequiresPasswordChange(false);
          // Ensure guest user doc exists in Firestore
          await ensureGuestUserDoc(user);
        } else {
          // Load user profile from Firestore for regular users
          try {
            const { UserService } = await import('./user-service');
            const profile = await UserService.getUserById(user.uid);
            
            if (profile) {
              setUserProfile(profile);
              // Check if user requires password change
              setRequiresPasswordChange(!!profile.requiresPasswordChange);
            } else {
              // Fallback to mock profile if not found in Firestore
              const mockProfile: User = {
                id: user.uid,
                email: user.email!,
                name: user.displayName || 'User',
                role: 'admin',
                workspaceId: 'workspace-1',
                teamIds: ['team-1'],
                branchId: 'branch-1',
                regionId: 'region-1',
                createdAt: new Date(),
                lastActive: new Date(),
              };
              setUserProfile(mockProfile);
              setRequiresPasswordChange(false);
            }
          } catch (error) {
            console.error('Error loading user profile:', error);
            // Fallback to mock profile
            const mockProfile: User = {
              id: user.uid,
              email: user.email!,
              name: user.displayName || 'User',
              role: 'admin',
              workspaceId: 'workspace-1',
              teamIds: ['team-1'],
              branchId: 'branch-1',
              regionId: 'region-1',
              createdAt: new Date(),
              lastActive: new Date(),
            };
            setUserProfile(mockProfile);
            setRequiresPasswordChange(false);
          }
        }
      } else {
        setUserProfile(null);
        setRequiresPasswordChange(false);
        setIsGuest(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Log login activity
      try {
        const { ActivityService } = await import('./activity-service');
        const { UserService } = await import('./user-service');
        
        const userProfile = await UserService.getUserById(result.user.uid);
        if (userProfile) {
          await ActivityService.logActivity(
            'user_login',
            'user',
            result.user.uid,
            { 
              targetName: userProfile.name,
              email: userProfile.email,
              loginMethod: 'email'
            },
            userProfile.workspaceId,
            result.user.uid
          );
        }
      } catch (error) {
        console.warn('Warning: Could not log login activity:', error);
      }
    } catch (error) {
      // Re-throw the error so it can be handled by the login form
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: {
    name: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    jobTitle?: string;
    department?: string;
    branchId?: string;
    regionId?: string;
    workspaceId?: string;
  }, role: 'owner' | 'admin' | 'member' = 'member', inviteToken?: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Use the secure user creation method that determines role properly
    // Import UserService and create user with all form fields
    const { UserService } = await import('./user-service');
    
    await UserService.createUserSecurely({
      id: result.user.uid,
      email: result.user.email!,
      name: userData.name,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      jobTitle: userData.jobTitle,
      department: userData.department,
      branchId: userData.branchId,
      regionId: userData.regionId,
      workspaceId: userData.workspaceId || 'workspace-1', // Default if not provided
      inviteToken: inviteToken,
      preAssignedRole: role,
      // Role will be securely determined by UserService.determineUserRole()
      // - First user becomes owner
      // - Invited users get their pre-assigned role
      // - All other registrations default to member
    });
    
    // Set flag for new user if not invited
    if (!inviteToken) {
      setIsNewUser(true);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Add custom parameters for better UX
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      // Check if this is a new user
      const { UserService } = await import('./user-service');
      const existingProfile = await UserService.getUserById(result.user.uid);
      
      if (!existingProfile) {
        // Use the new Google user creation method that handles self-registration
        await UserService.createGoogleUser({
          id: result.user.uid,
          email: result.user.email!,
          name: result.user.displayName || 'Google User',
          firstName: result.user.displayName?.split(' ')[0] || '',
          lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
          workspaceId: 'workspace-1', // Default workspace, will be updated if user becomes owner
          photoURL: result.user.photoURL || '',
          isEmailVerified: result.user.emailVerified,
        });
        
        console.log('Created new user profile for Google sign-in with secure role determination');
        
        // Set new user flag for onboarding
        setIsNewUser(true);
        
        // Log the Google sign-up activity
        try {
          const { ActivityService } = await import('./activity-service');
          await ActivityService.logActivity(
            'user_created',
            'user',
            result.user.uid,
            { 
              targetName: result.user.displayName || 'Google User',
              email: result.user.email!,
              loginMethod: 'google',
              isNewUser: true
            },
            'workspace-1', // Default workspace
            result.user.uid
          );
        } catch (error) {
          console.warn('Warning: Could not log Google signup activity:', error);
        }
      } else {
        // Log login activity for existing users
        try {
          const { ActivityService } = await import('./activity-service');
          await ActivityService.logActivity(
            'user_login',
            'user',
            result.user.uid,
            { 
              targetName: existingProfile.name,
              email: existingProfile.email,
              loginMethod: 'google'
            },
            existingProfile.workspaceId,
            result.user.uid
          );
        } catch (error) {
          console.warn('Warning: Could not log Google login activity:', error);
        }
      }
    } catch (error) {
      // Re-throw the error so it can be handled by the login form
      throw error;
    }
  };

  const signInAsGuest = async () => {
    try {
      // Check if there's already a guest user signed in
      if (user && user.isAnonymous) {
        console.log('Reusing existing guest user:', user.uid);
        return; // Already signed in as guest
      }
      
      // Check if there's a guest account in localStorage
      const existingGuestUid = localStorage.getItem('guestUserId');
      if (existingGuestUid) {
        try {
          // Try to sign in with the existing guest account
          // Note: Firebase doesn't support signing in to anonymous accounts
          // So we'll create a new one but clean up old ones
          console.log('Found existing guest UID, will clean up old data');
        } catch (error) {
          console.log('Could not reuse guest account, creating new one');
        }
      }
      
      const result = await signInAnonymously(auth);
      console.log('Guest user signed in:', result.user.uid);
      
      // Store the guest UID for potential reuse
      localStorage.setItem('guestUserId', result.user.uid);
      
      // Guest users don't need activity logging or profile creation
      // The profile will be created in the onAuthStateChanged callback
    } catch (error) {
      console.error('Error signing in as guest:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Log logout activity before signing out (only for non-guest users)
    try {
      if (userProfile && !isGuest) {
        const { ActivityService } = await import('./activity-service');
        await ActivityService.logActivity(
          'user_logout',
          'user',
          userProfile.id,
          { 
            targetName: userProfile.name,
            email: userProfile.email
          },
          userProfile.workspaceId,
          userProfile.id
        );
      }
    } catch (error) {
      console.warn('Warning: Could not log logout activity:', error);
    }
    
    // Clean up guest data if this is a guest user
    if (isGuest && user) {
      try {
        const { GuestService } = await import('./guest-service');
        await GuestService.cleanupGuestData(user.uid);
        
        // Also clean up old guest accounts from localStorage
        const oldGuestUid = localStorage.getItem('guestUserId');
        if (oldGuestUid && oldGuestUid !== user.uid) {
          try {
            await GuestService.cleanupGuestData(oldGuestUid);
            console.log('Cleaned up old guest account:', oldGuestUid);
          } catch (error) {
            console.warn('Could not clean up old guest account:', error);
          }
        }
        
        // Remove guest UID from localStorage
        localStorage.removeItem('guestUserId');
      } catch (error) {
        console.warn('Warning: Could not cleanup guest data:', error);
      }
    }
    
    await signOut(auth);
    setIsNewUser(false);
    setIsGuest(false);
  };
  
  const clearNewUserFlag = () => {
    setIsNewUser(false);
  };

  // Handle redirection for new users
  useEffect(() => {
    if (user && isNewUser && !loading) {
      // Use window.location for redirection to avoid hook issues
      console.log('New user detected, redirecting to onboarding');
      window.location.href = '/onboarding';
    }
  }, [user, isNewUser, loading]);

  const refreshUserProfile = async () => {
    if (user && !isGuest) {
      try {
        const { UserService } = await import('./user-service');
        const profile = await UserService.getUserById(user.uid);
        
        if (profile) {
          setUserProfile(profile);
          setRequiresPasswordChange(!!profile.requiresPasswordChange);
        }
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

  const handlePasswordChanged = () => {
    setRequiresPasswordChange(false);
    // Refresh the user profile to get updated data
    refreshUserProfile();
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      isNewUser,
      requiresPasswordChange,
      isGuest,
      signIn,
      signUp,
      signInWithGoogle,
      signInAsGuest,
      logout,
      clearNewUserFlag,
      refreshUserProfile
    }}>
      {children}
      {/* Password Change Modal - only show for non-guest users */}
      {user && userProfile && requiresPasswordChange && !isGuest && (
        <PasswordChangeModal
          isOpen={requiresPasswordChange}
          userEmail={user.email || ''}
          userId={user.uid}
          onPasswordChanged={handlePasswordChanged}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}