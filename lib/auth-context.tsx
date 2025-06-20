'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from './firebase';
import { User } from './types';
import { EmailService } from './email-service';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  isNewUser: boolean;
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
  logout: () => Promise<void>;
  clearNewUserFlag: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Initialize EmailJS on client side
  useEffect(() => {
    EmailService.init();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Load user profile from Firestore
        try {
          const { UserService } = await import('./user-service');
          const profile = await UserService.getUserById(user.uid);
          
          if (profile) {
            setUserProfile(profile);
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
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
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
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if this is a new user
    const { UserService } = await import('./user-service');
    const existingProfile = await UserService.getUserById(result.user.uid);
    
    if (!existingProfile) {
      setIsNewUser(true);
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
  };

  const logout = async () => {
    // Log logout activity before signing out
    try {
      if (userProfile) {
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
    
    await signOut(auth);
    setIsNewUser(false);
  };
  
  const clearNewUserFlag = () => {
    setIsNewUser(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      isNewUser,
      signIn,
      signUp,
      signInWithGoogle,
      logout,
      clearNewUserFlag
    }}>
      {children}
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