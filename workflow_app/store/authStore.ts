import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { AuthService } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  error: string | null;
}

interface AuthActions {
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsNewUser: (isNewUser: boolean) => void;
  
  // Auth operations
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    jobTitle?: string;
    department?: string;
    region?: string;
    branch?: string;
  }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Utility
  clearError: () => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start with loading true
      isNewUser: false,
      error: null,

      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        error: null 
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      setIsNewUser: (isNewUser) => set({ isNewUser }),
      
      // Auth operations
      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, isNewUser } = await AuthService.signInWithEmail(email, password);
          await AuthService.saveUserToStorage(user);
          set({ 
            user, 
            isAuthenticated: true, 
            isNewUser,
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message, 
            isLoading: false 
          });
          throw error;
        }
      },

      signUp: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const { user, isNewUser } = await AuthService.signUpWithEmail(userData);
          await AuthService.saveUserToStorage(user);
          set({ 
            user, 
            isAuthenticated: true, 
            isNewUser,
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message, 
            isLoading: false 
          });
          throw error;
        }
      },

      signInWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          const { user, isNewUser } = await AuthService.signInWithGoogle();
          await AuthService.saveUserToStorage(user);
          set({ 
            user, 
            isAuthenticated: true, 
            isNewUser,
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message, 
            isLoading: false 
          });
          throw error;
        }
      },

      signInAsGuest: async () => {
        set({ isLoading: true, error: null });
        try {
          const { user, isNewUser } = await AuthService.signInAsGuest();
          await AuthService.saveUserToStorage(user);
          set({ 
            user, 
            isAuthenticated: true, 
            isNewUser,
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message, 
            isLoading: false 
          });
          throw error;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await AuthService.signOut();
          await AuthService.clearStorage();
          set({ 
            user: null, 
            isAuthenticated: false, 
            isNewUser: false,
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message, 
            isLoading: false 
          });
          throw error;
        }
      },

      // Utility
      clearError: () => set({ error: null }),
      
      clearAuth: () => set({ 
        user: null, 
        isAuthenticated: false, 
        isNewUser: false,
        error: null 
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isNewUser: state.isNewUser
      }),
    }
  )
);
