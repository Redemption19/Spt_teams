// Authentication validation utilities
import { z } from 'zod';

// Password validation schema
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// Email validation schema
export const emailSchema = z.string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

// Name validation schema
export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters long')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Phone validation schema
export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number');

// Workspace name validation schema
export const workspaceNameSchema = z.string()
  .min(3, 'Workspace name must be at least 3 characters long')
  .max(50, 'Workspace name must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\s-_]+$/, 'Workspace name can only contain letters, numbers, spaces, hyphens, and underscores');

// Registration form schema
export const registrationSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
});

// Password reset schema
export const passwordResetSchema = z.object({
  email: emailSchema
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string()
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword']
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
});

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema.optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  timezone: z.string().optional()
});

// Workspace creation schema
export const workspaceCreationSchema = z.object({
  name: workspaceNameSchema,
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  industry: z.string().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional()
});

// Two-factor authentication setup schema
export const twoFactorSetupSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits').regex(/^[0-9]+$/, 'Code must contain only numbers')
});

// Security question schema
export const securityQuestionSchema = z.object({
  question: z.string().min(10, 'Security question must be at least 10 characters'),
  answer: z.string().min(3, 'Answer must be at least 3 characters')
});

// Account recovery schema
export const accountRecoverySchema = z.object({
  email: emailSchema,
  securityAnswer: z.string().min(1, 'Security answer is required')
});

// Validation helper functions
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const isLongEnough = password.length >= 8;
  const isVeryLong = password.length >= 12;
  
  const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length;
  
  if (criteriaCount >= 4 && isVeryLong) {
    strength = 'strong';
  } else if (criteriaCount >= 3 && isLongEnough) {
    strength = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

export function validateEmail(email: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateName(name: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  } else {
    if (name.length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (name.length > 50) {
      errors.push('Name must be less than 50 characters');
    }
    
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Rate limiting interfaces and functions
export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

export interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

export interface LoginAttempt {
  timestamp: number;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory rate limiting (for client-side)
const rateLimitStore = new Map<string, LoginAttempt[]>();

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    blockDurationMs: 15 * 60 * 1000 // 15 minutes
  }
): RateLimitState {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Get or create attempts array
  const attempts = rateLimitStore.get(identifier) || [];
  
  // Filter to only recent attempts
  const recentAttempts = attempts.filter(attempt => attempt.timestamp >= windowStart);
  const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
  
  const state: RateLimitState = {
    attempts: failedAttempts.length,
    lastAttempt: failedAttempts.length > 0 ? Math.max(...failedAttempts.map(a => a.timestamp)) : 0
  };

  // Check if blocked
  if (failedAttempts.length >= config.maxAttempts) {
    const lastAttempt = Math.max(...failedAttempts.map(a => a.timestamp));
    const blockUntil = lastAttempt + config.blockDurationMs;
    
    if (now < blockUntil) {
      state.blockedUntil = blockUntil;
    }
  }

  return state;
}

/**
 * Format time remaining for rate limit blocks
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '0:00';
  
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Generate a secure random string for tokens
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Validate Firebase Auth error codes and return user-friendly messages
 */
export function getFirebaseAuthErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
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
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
    'auth/invalid-api-key': 'Firebase configuration error. Please check your API key.',
    'auth/api-key-not-valid': 'Invalid Firebase API key. Please check your configuration.',
    'auth/app-not-authorized': 'This app is not authorized to use Firebase Authentication.',
    'auth/argument-error': 'Invalid argument provided to Firebase Authentication.',
    'auth/invalid-app-credential': 'Invalid app credential.',
    'auth/invalid-app-token': 'Invalid app token.',
    'auth/invalid-user-token': 'Invalid user token.',
    'auth/invalid-tenant-id': 'Invalid tenant ID.',
    'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations.',
    'auth/unsupported-persistence-type': 'Unsupported persistence type.',
    'auth/invalid-persistence-type': 'Invalid persistence type.',
    'auth/invalid-phone-number': 'Invalid phone number format.',
    'auth/quota-exceeded': 'Quota exceeded. Please try again later.',
    'auth/retry-phone-auth': 'Phone authentication should be retried.',
    'auth/session-expired': 'Session expired. Please sign in again.',
    'auth/unauthorized-continue-uri': 'Unauthorized continue URI.',
    'auth/web-storage-unsupported': 'Web storage is not supported in this environment.',
    'auth/expired-action-code': 'Action code has expired.',
    'auth/invalid-action-code': 'Invalid action code.',
    'auth/missing-action-code': 'Missing action code.',
    'auth/credential-already-in-use': 'This credential is already associated with a different user account.',
    'auth/email-change-needs-verification': 'Email change requires verification.',
    'auth/cancelled-popup-request': 'Popup request was cancelled.',
    'auth/popup-blocked': 'Popup was blocked by the browser.',
    'auth/popup-closed-by-user': 'Popup was closed by the user.',
    'auth/auth-domain-config-required': 'Auth domain configuration is required.',
    'auth/cordova-not-ready': 'Cordova is not ready.',
    'auth/cors-unsupported': 'CORS is not supported.',
    'auth/dependent-sdk-initialized-before-auth': 'Dependent SDK was initialized before Auth.',
    'auth/dynamic-link-not-activated': 'Dynamic link is not activated.',
    'auth/emulator-config-failed': 'Emulator configuration failed.',
    'auth/internal-error': 'Internal error occurred.',
    'auth/invalid-cert-hash': 'Invalid certificate hash.',
    'auth/invalid-continue-uri': 'Invalid continue URI.',
    'auth/invalid-cordova-configuration': 'Invalid Cordova configuration.',
    'auth/invalid-custom-token': 'Invalid custom token.',
    'auth/invalid-dynamic-link-domain': 'Invalid dynamic link domain.',
    'auth/invalid-oauth-provider': 'Invalid OAuth provider.',
    'auth/invalid-oauth-client-id': 'Invalid OAuth client ID.',
    'auth/invalid-provider-id': 'Invalid provider ID.',
    'auth/invalid-recipient-email': 'Invalid recipient email.',
    'auth/invalid-sender': 'Invalid sender.',
    'auth/missing-android-pkg-name': 'Missing Android package name.',
    'auth/missing-app-credential': 'Missing app credential.',
    'auth/missing-client-type': 'Missing client type.',
    'auth/missing-continue-uri': 'Missing continue URI.',
    'auth/missing-iframe-start': 'Missing iframe start.',
    'auth/missing-ios-bundle-id': 'Missing iOS bundle ID.',
    'auth/missing-or-invalid-nonce': 'Missing or invalid nonce.',
    'auth/missing-phone-number': 'Missing phone number.',
    'auth/missing-verification-code': 'Missing verification code.',
    'auth/missing-verification-id': 'Missing verification ID.',
    'auth/app-deleted': 'App was deleted.',
    'auth/operation-not-supported-in-this-environment': 'Operation not supported in this environment.',
    'auth/timeout': 'Operation timed out.',
    'auth/user-mismatch': 'User mismatch.'
  };

  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
}
