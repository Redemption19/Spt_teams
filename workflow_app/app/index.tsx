import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { BRAND_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';

export default function Index() {
  const router = useRouter();
  const { user, isAuthenticated, isNewUser, isLoading, error } = useAuthStore();

  useEffect(() => {
    console.log('🔍 Auth State:', { 
      isAuthenticated, 
      isNewUser, 
      isLoading, 
      hasUser: !!user,
      error,
      userEmail: user?.email
    });
    
    // Force re-render when auth state changes
    console.log('🔄 Index useEffect triggered - checking redirection logic');

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Loading timeout, checking auth state...');
        if (isAuthenticated && user) {
          console.log('⏰ Timeout but user is authenticated, redirecting to dashboard');
          router.replace('/dashboard');
        } else {
          console.log('⏰ Loading timeout, redirecting to login');
          router.replace('/auth/login');
        }
      }
    }, 8000); // 8 second timeout

    if (!isLoading) {
      console.log('🚀 Not loading, checking auth state...');
      if (isAuthenticated && user) {
        console.log('✅ User is authenticated:', user.email);
        if (isNewUser) {
          console.log('🆕 New user detected, redirecting to onboarding');
          router.replace('/onboarding');
        } else {
          console.log('✅ Existing user authenticated, redirecting to dashboard');
          console.log('🔄 About to navigate to dashboard...');
          router.replace('/dashboard');
          console.log('🔄 Navigation command sent to dashboard');
          
          // Force navigation after a small delay to ensure it works
          setTimeout(() => {
            console.log('🔄 Force navigation to dashboard');
            router.replace('/dashboard');
          }, 500);
        }
      } else {
        console.log('🔐 User not authenticated, redirecting to login');
        console.log('isAuthenticated:', isAuthenticated, 'user:', !!user);
        router.replace('/auth/login');
      }
    } else {
      console.log('⏳ Still loading...');
    }

    return () => clearTimeout(timeout);
  }, [isAuthenticated, isNewUser, isLoading, user, router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>SPT</Text>
        </View>
        <Text style={styles.title}>SPT Teams</Text>
        <Text style={styles.subtitle}>Workspace Management</Text>
        <ActivityIndicator 
          size="large" 
          color={BRAND_COLORS.primary} 
          style={styles.loader}
        />
        <Text style={styles.loadingText}>
          {isLoading ? 'Loading...' : 'Redirecting...'}
        </Text>
        <Text style={styles.debugText}>
          Debug: Auth={isAuthenticated ? 'Yes' : 'No'}, User={user ? 'Yes' : 'No'}, New={isNewUser ? 'Yes' : 'No'}
        </Text>
        {error && (
          <Text style={styles.errorText}>Error: {error}</Text>
        )}
        <TouchableOpacity 
          style={styles.debugButton} 
          onPress={() => {
            console.log('🔧 Manual redirect to dashboard');
            router.replace('/dashboard');
          }}
        >
          <Text style={styles.debugButtonText}>Manual Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes['3xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#1e293b',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: '#6b7280',
    marginBottom: SPACING.xl,
  },
  loader: {
    marginBottom: SPACING.md,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#6b7280',
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#ef4444',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  debugText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: '#6b7280',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  debugButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
