import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export default function Index() {
  const router = useRouter();
  const { user, isAuthenticated, isNewUser, isLoading, error } = useAuthStore();

  useEffect(() => {
    console.log('🔍 Auth State:', { 
      isAuthenticated, 
      isNewUser, 
      isLoading, 
      hasUser: !!user,
      error 
    });

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Loading timeout, redirecting to login');
        router.replace('/auth/login');
      }
    }, 5000); // 5 second timeout

    if (!isLoading) {
      if (isAuthenticated && user) {
        console.log('✅ User authenticated, redirecting to dashboard');
        router.replace('/dashboard');
      } else {
        console.log('🔐 User not authenticated, redirecting to login');
        router.replace('/auth/login');
      }
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
        {error && (
          <Text style={styles.errorText}>Error: {error}</Text>
        )}
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
});
