import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { BRAND_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Validation and security interfaces
interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface LoginAttempt {
  timestamp: number;
  success: boolean;
}

interface RateLimitInfo {
  attempts: number;
  blockedUntil?: number;
  lastAttempt: number;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo>({
    attempts: 0,
    lastAttempt: 0
  });
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  
  const { signIn, signInWithGoogle, signInAsGuest } = useAuthStore();
  const router = useRouter();

  // Rate limiting constants (same as web app)
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
  const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check rate limiting
  const checkRateLimit = useCallback((attempts: LoginAttempt[]) => {
    const now = Date.now();
    const recentAttempts = attempts.filter(
      attempt => now - attempt.timestamp < ATTEMPT_WINDOW
    );
    
    const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
    
    if (failedAttempts.length >= MAX_ATTEMPTS) {
      const lastAttempt = Math.max(...failedAttempts.map(a => a.timestamp));
      const blockUntil = lastAttempt + BLOCK_DURATION;
      
      if (now < blockUntil) {
        setIsBlocked(true);
        setBlockTimeRemaining(blockUntil - now);
      } else {
        // Block expired, clear old attempts
        const validAttempts = attempts.filter(
          attempt => now - attempt.timestamp < ATTEMPT_WINDOW
        );
        setLoginAttempts(validAttempts);
        AsyncStorage.setItem('loginAttempts', JSON.stringify(validAttempts));
        setIsBlocked(false);
      }
    } else {
      setIsBlocked(false);
      setRateLimitInfo({
        attempts: failedAttempts.length,
        lastAttempt: failedAttempts.length > 0 ? Math.max(...failedAttempts.map(a => a.timestamp)) : 0
      });
    }
  }, [ATTEMPT_WINDOW, BLOCK_DURATION, MAX_ATTEMPTS]);

  // Load saved login attempts from AsyncStorage
  useEffect(() => {
    const loadAttempts = async () => {
      try {
        const savedAttempts = await AsyncStorage.getItem('loginAttempts');
        if (savedAttempts) {
          const attempts: LoginAttempt[] = JSON.parse(savedAttempts);
          setLoginAttempts(attempts);
          checkRateLimit(attempts);
        }
      } catch (error) {
        console.warn('Failed to load login attempts:', error);
      }
    };
    loadAttempts();
  }, [checkRateLimit]);

  // Update block time remaining
  useEffect(() => {
    if (!isBlocked) return;

    const interval = setInterval(() => {
      setBlockTimeRemaining(prev => {
        if (prev <= 1000) {
          setIsBlocked(false);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBlocked]);

  // Record login attempt
  const recordLoginAttempt = useCallback(async (success: boolean) => {
    const attempt: LoginAttempt = {
      timestamp: Date.now(),
      success,
    };

    const newAttempts = [...loginAttempts, attempt];
    
    // Keep only attempts from the last 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const validAttempts = newAttempts.filter(attempt => attempt.timestamp > oneDayAgo);
    
    setLoginAttempts(validAttempts);
    await AsyncStorage.setItem('loginAttempts', JSON.stringify(validAttempts));
    checkRateLimit(validAttempts);
  }, [loginAttempts, checkRateLimit]);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [email, password]);

  // Clear validation errors when user types
  const clearValidationErrors = useCallback(() => {
    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors({});
    }
    if (error) {
      setError(null);
    }
  }, [validationErrors, error]);

  // Get Firebase error message (same as web app)
  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'No account found with this email address. Please check your email or create a new account.',
      'auth/wrong-password': 'Incorrect password. Please try again or use "Forgot your password?" to reset it.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later or reset your password.',
      'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
      'auth/user-token-expired': 'Your session has expired. Please sign in again.',
      'auth/requires-recent-login': 'For security reasons, please sign in again to continue.',
      'auth/account-exists-with-different-credential': 'An account already exists with the same email address but different sign-in credentials.',
      'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
      'auth/operation-not-allowed': 'Email/password sign-in is not enabled. Please contact support.',
      'auth/invalid-verification-code': 'Invalid verification code. Please try again.',
      'auth/invalid-verification-id': 'Invalid verification ID. Please try again.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled. Please try again.',
      'auth/popup-blocked': 'Google sign-in popup was blocked. Please allow pop-ups and try again.',
      'auth/cancelled-popup-request': 'Google sign-in was cancelled. Please try again.',
      'auth/unauthorized-domain': 'This domain is not authorized for Google sign-in. Please contact support.',
      'auth/operation-not-supported-in-this-environment': 'Google sign-in is not supported in this environment. Please try a different browser.',
      'auth/auth-domain-config-required': 'Google sign-in configuration is missing. Please contact support.',
      'auth/web-storage-unsupported': 'Your browser does not support web storage. Please enable cookies and try again.',
    };

    return errorMessages[errorCode] || 'An error occurred during sign in. Please try again.';
  };

  // Clear rate limiting data on successful login
  const clearRateLimitData = useCallback(async () => {
    await AsyncStorage.removeItem('loginAttempts');
    setLoginAttempts([]);
    setRateLimitInfo({ attempts: 0, lastAttempt: 0 });
    setIsBlocked(false);
    setBlockTimeRemaining(0);
  }, []);

  const handleSubmit = async () => {
    // Check if blocked
    if (isBlocked) {
      Alert.alert(
        'Account Temporarily Locked',
        `Too many failed attempts. Please wait ${Math.ceil(blockTimeRemaining / 60000)} minutes before trying again.`
      );
      return;
    }

    // Validate form
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors above and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      
      // Record successful attempt
      await recordLoginAttempt(true);
      
      // Clear rate limiting data on successful login
      await clearRateLimitData();
      
      // Handle remember me
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
        await AsyncStorage.setItem('rememberedEmail', email);
      } else {
        await AsyncStorage.removeItem('rememberMe');
        await AsyncStorage.removeItem('rememberedEmail');
      }
      
      // Show success alert with a small delay to let auth store process
      setTimeout(() => {
        Alert.alert(
          'Welcome back!',
          'Successfully signed in to your account',
          [{ text: 'OK' }]
        );
      }, 100);
      
      // Don't set loading to false here - let the auth store handle it
      // The auth store will set loading to false and trigger redirection
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Record failed attempt
      await recordLoginAttempt(false);
      
      const errorMessage = getErrorMessage(error.code || 'unknown');
      setError(errorMessage);
      
      // Show specific alert messages
      if (error.code === 'auth/wrong-password') {
        const remainingAttempts = MAX_ATTEMPTS - (rateLimitInfo.attempts + 1);
        if (remainingAttempts > 0) {
          Alert.alert('Incorrect Password', `Incorrect password. ${remainingAttempts} attempts remaining.`);
        } else {
          Alert.alert('Account Locked', 'Too many failed attempts. Please wait 15 minutes before trying again.');
        }
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert('Account Not Found', 'No account found with this email.');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Too Many Requests', 'Too many failed attempts. Please try again later or reset your password.');
      } else {
        Alert.alert('Sign In Error', errorMessage);
      }
    } finally {
      // Only set loading to false on error, not on success
      // On success, let the auth store handle the loading state
    }
  };

  const handleGoogleSignIn = async () => {
    if (isBlocked) {
      Alert.alert(
        'Account Temporarily Locked',
        `Too many failed attempts. Please wait ${Math.ceil(blockTimeRemaining / 60000)} minutes before trying again.`
      );
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await signInWithGoogle();
      await recordLoginAttempt(true);
      
      // Clear rate limiting data on successful login
      await clearRateLimitData();
      
      // Show success alert with a small delay to let auth store process
      setTimeout(() => {
        Alert.alert(
          'Welcome!',
          'Successfully signed in with Google',
          [{ text: 'OK' }]
        );
      }, 100);
      
      // Don't set loading to false here - let the auth store handle it
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      await recordLoginAttempt(false);
      
      const errorMessage = getErrorMessage(error.code || 'unknown');
      setError(errorMessage);
      
      // Show specific alert messages for common Google auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        Alert.alert('Sign In Cancelled', 'Google sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        Alert.alert('Popup Blocked', 'Please allow pop-ups for this site to use Google sign-in.');
      } else if (error.code === 'auth/unauthorized-domain') {
        Alert.alert('Unauthorized Domain', 'Google sign-in is not configured for this domain. Please contact support.');
      } else {
        Alert.alert('Google Sign In Error', errorMessage);
      }
    } finally {
      // Only set loading to false on error, not on success
      // On success, let the auth store handle the loading state
    }
  };

  const handleGuestSignIn = async () => {
    if (isBlocked) {
      Alert.alert(
        'Account Temporarily Locked',
        `Too many failed attempts. Please wait ${Math.ceil(blockTimeRemaining / 60000)} minutes before trying again.`
      );
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await signInAsGuest();
      await recordLoginAttempt(true);
      
      // Clear rate limiting data on successful login
      await clearRateLimitData();
      
      // Show success alert with a small delay to let auth store process
      setTimeout(() => {
        Alert.alert(
          'Welcome!',
          'You are now exploring as a guest. Guest mode activated successfully.',
          [{ text: 'OK' }]
        );
      }, 100);
      
      // Don't set loading to false here - let the auth store handle it
    } catch (error: any) {
      console.error('Guest sign-in error:', error);
      await recordLoginAttempt(false);
      
      const errorMessage = getErrorMessage(error.code || 'unknown');
      setError(errorMessage);
      Alert.alert('Guest Sign In Error', errorMessage);
    } finally {
      // Only set loading to false on error, not on success
      // On success, let the auth store handle the loading state
    }
  };

  // Load remembered email on component mount
  useEffect(() => {
    const loadRememberedEmail = async () => {
      try {
        const remembered = await AsyncStorage.getItem('rememberMe');
        const rememberedEmail = await AsyncStorage.getItem('rememberedEmail');
        
        if (remembered === 'true' && rememberedEmail) {
          setRememberMe(true);
          setEmail(rememberedEmail);
        }
      } catch (error) {
        console.warn('Failed to load remembered email:', error);
      }
    };
    loadRememberedEmail();
  }, []);

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" padding="lg" style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>SPT</Text>
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your workspace</Text>
          </View>

          {/* Rate Limit Warning */}
          {isBlocked && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningTitle}>Account Temporarily Locked</Text>
              <Text style={styles.warningText}>
                Too many failed attempts. Please wait {formatTimeRemaining(blockTimeRemaining)} before trying again.
              </Text>
            </View>
          )}

          {/* Security Warning */}
          {rateLimitInfo.attempts > 0 && !isBlocked && (
            <View style={styles.securityWarningContainer}>
              <Text style={styles.securityWarningText}>
                {MAX_ATTEMPTS - rateLimitInfo.attempts} login attempts remaining before temporary lockout.
              </Text>
            </View>
          )}

          {/* General Error */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Google Sign In Button */}
          <Button
            title="Continue with Google"
            variant="outline"
            onPress={handleGoogleSignIn}
            disabled={loading || isBlocked}
            style={styles.googleButton}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearValidationErrors();
              }}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={validationErrors.email}
              editable={!(loading || isBlocked)}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearValidationErrors();
              }}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              error={validationErrors.password}
              editable={!(loading || isBlocked)}
              rightIcon={showPassword ? 'eye-off' : 'eye'}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {/* Remember Me */}
            <View style={styles.rememberMeContainer}>
              <Button
                title="Remember me"
                variant="ghost"
                onPress={() => setRememberMe(!rememberMe)}
                disabled={loading || isBlocked}
                style={styles.rememberMeButton}
              />
            </View>

            {/* Sign In Button */}
            <Button
              title={loading ? 'Signing in...' : 'Sign in'}
              variant="primary"
              onPress={handleSubmit}
              disabled={loading || isBlocked}
              style={styles.signInButton}
            />
          </View>

          {/* Links */}
          <View style={styles.linksContainer}>
            <Button
              title="Forgot your password?"
              variant="ghost"
              onPress={() => Alert.alert('Reset Password', 'Password reset functionality will be implemented soon.')}
              disabled={loading || isBlocked}
              style={styles.linkButton}
            />
            
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <Button
                title="Create account"
                variant="ghost"
                onPress={() => Alert.alert('Register', 'Registration functionality will be implemented soon.')}
                disabled={loading || isBlocked}
                style={styles.linkButton}
              />
            </View>
          </View>

          {/* Guest Mode */}
          <View style={styles.guestContainer}>
            <Text style={styles.guestTitle}>Guest Mode</Text>
            <Text style={styles.guestDescription}>
              Explore the app without creating an account. Your data will be temporary and won't be saved permanently.
            </Text>
            <Button
              title="Try as Guest"
              variant="outline"
              onPress={handleGuestSignIn}
              disabled={loading || isBlocked}
              style={styles.guestButton}
            />
          </View>

          {/* Security Info */}
          <View style={styles.securityContainer}>
            <Text style={styles.securityText}>
              Your login is protected with rate limiting and security measures
            </Text>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  card: {
    marginHorizontal: SPACING.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: BRAND_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#1e293b',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: '#6b7280',
  },
  warningContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  warningTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#dc2626',
    marginBottom: SPACING.xs,
  },
  warningText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#dc2626',
  },
  securityWarningContainer: {
    backgroundColor: '#fffbeb',
    borderColor: '#fed7aa',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  securityWarningText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#d97706',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#dc2626',
  },
  googleButton: {
    marginBottom: SPACING.md,
  },
  googleButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: BRAND_COLORS.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: '#6b7280',
    marginHorizontal: SPACING.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  form: {
    marginBottom: SPACING.lg,
  },
  rememberMeContainer: {
    marginBottom: SPACING.md,
  },
  rememberMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#374151',
  },
  signInButton: {
    marginBottom: SPACING.md,
  },
  signInButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#ffffff',
  },
  linksContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  linkButton: {
    paddingHorizontal: 0,
  },
  linkText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: BRAND_COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  registerText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#6b7280',
  },
  guestContainer: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  guestTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#1e293b',
    marginBottom: SPACING.xs,
  },
  guestDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#475569',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  guestButton: {
    alignSelf: 'flex-start',
  },
  guestButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: BRAND_COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  securityContainer: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  securityText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: '#64748b',
  },
});
