'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Chrome, Mail, Lock, AlertCircle, Eye, EyeOff, User, Shield, Clock, AlertTriangle } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { isValidEmail } from '@/lib/utils';

// Validation and security interfaces
interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface LoginAttempt {
  timestamp: number;
  success: boolean;
  ip?: string;
}

interface RateLimitInfo {
  attempts: number;
  blockedUntil?: number;
  lastAttempt: number;
}

export function LoginForm() {
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
  
  const { signIn, signInWithGoogle, signInAsGuest } = useAuth();
  const router = useRouter();

  // Rate limiting constants
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
  const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

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
        localStorage.setItem('loginAttempts', JSON.stringify(validAttempts));
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

  // Load saved login attempts from localStorage
  useEffect(() => {
    const savedAttempts = localStorage.getItem('loginAttempts');
    if (savedAttempts) {
      try {
        const attempts: LoginAttempt[] = JSON.parse(savedAttempts);
        setLoginAttempts(attempts);
        checkRateLimit(attempts);
      } catch (error) {
        console.warn('Failed to load login attempts:', error);
      }
    }
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
  const recordLoginAttempt = useCallback((success: boolean) => {
    const attempt: LoginAttempt = {
      timestamp: Date.now(),
      success,
      ip: 'client-side' // In production, this would come from server
    };

    const newAttempts = [...loginAttempts, attempt];
    
    // Keep only attempts from the last 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const validAttempts = newAttempts.filter(attempt => attempt.timestamp > oneDayAgo);
    
    setLoginAttempts(validAttempts);
    localStorage.setItem('loginAttempts', JSON.stringify(validAttempts));
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

  const getErrorMessage = (error: FirebaseError): string => {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address. Please check your email or create a new account.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again or use "Forgot your password?" to reset it.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later or reset your password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      case 'auth/user-token-expired':
        return 'Your session has expired. Please sign in again.';
      case 'auth/requires-recent-login':
        return 'For security reasons, please sign in again to continue.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address but different sign-in credentials.';
      case 'auth/invalid-credential':
        return 'Invalid credentials. Please check your email and password.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is not enabled. Please contact support.';
      case 'auth/invalid-verification-code':
        return 'Invalid verification code. Please try again.';
      case 'auth/invalid-verification-id':
        return 'Invalid verification ID. Please try again.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was cancelled. Please try again.';
      case 'auth/popup-blocked':
        return 'Google sign-in popup was blocked. Please allow pop-ups and try again.';
      case 'auth/cancelled-popup-request':
        return 'Google sign-in was cancelled. Please try again.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for Google sign-in. Please contact support.';
      case 'auth/operation-not-supported-in-this-environment':
        return 'Google sign-in is not supported in this environment. Please try a different browser.';
      case 'auth/auth-domain-config-required':
        return 'Google sign-in configuration is missing. Please contact support.';
      case 'auth/web-storage-unsupported':
        return 'Your browser does not support web storage. Please enable cookies and try again.';
      default:
        return 'An error occurred during sign in. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if blocked
    if (isBlocked) {
      toast.error(`Too many failed attempts. Please wait ${Math.ceil(blockTimeRemaining / 60000)} minutes before trying again.`);
      return;
    }

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors above and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      
      // Record successful attempt
      recordLoginAttempt(true);
      
      // Clear rate limiting data on successful login
      clearRateLimitData();
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedEmail');
      }
      
      // Show success toast
      toast.success('Welcome back!', {
        duration: 3000,
        description: 'Successfully signed in to your account'
      });
      
      // Let the auth context handle redirection
      // New users will be redirected to /onboarding, existing users to /dashboard
      setLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      
      // Record failed attempt
      recordLoginAttempt(false);
      
      if (error instanceof FirebaseError) {
        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
        
        // Show specific toast messages
        if (error.code === 'auth/wrong-password') {
          const remainingAttempts = MAX_ATTEMPTS - (rateLimitInfo.attempts + 1);
          if (remainingAttempts > 0) {
            toast.error(`Incorrect password. ${remainingAttempts} attempts remaining.`);
          } else {
            toast.error('Too many failed attempts. Please wait 15 minutes before trying again.');
          }
        } else if (error.code === 'auth/user-not-found') {
          toast.error('No account found with this email.');
        } else if (error.code === 'auth/too-many-requests') {
          toast.error('Too many failed attempts. Please try again later or reset your password.');
        } else {
          toast.error(errorMessage);
        }
      } else {
        const genericError = 'An unexpected error occurred. Please try again.';
        setError(genericError);
        toast.error(genericError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isBlocked) {
      toast.error(`Too many failed attempts. Please wait ${Math.ceil(blockTimeRemaining / 60000)} minutes before trying again.`);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await signInWithGoogle();
      recordLoginAttempt(true);
      
      // Clear rate limiting data on successful login
      clearRateLimitData();
      
      // Show success toast
      toast.success('Welcome!', {
        duration: 3000,
        description: 'Successfully signed in with Google'
      });
      
      // Let the auth context handle redirection
      // New users will be redirected to /onboarding, existing users to /dashboard
      setLoading(false);
    } catch (error) {
      console.error('Google sign-in error:', error);
      recordLoginAttempt(false);
      
      if (error instanceof FirebaseError) {
        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
        
        // Show specific toast messages for common Google auth errors
        if (error.code === 'auth/popup-closed-by-user') {
          toast.error('Google sign-in was cancelled. Please try again.');
        } else if (error.code === 'auth/popup-blocked') {
          toast.error('Please allow pop-ups for this site to use Google sign-in.');
        } else if (error.code === 'auth/unauthorized-domain') {
          toast.error('Google sign-in is not configured for this domain. Please contact support.');
        } else {
          toast.error(errorMessage);
        }
      } else {
        const genericError = 'Google sign-in failed. Please try again.';
        setError(genericError);
        toast.error(genericError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    if (isBlocked) {
      toast.error(`Too many failed attempts. Please wait ${Math.ceil(blockTimeRemaining / 60000)} minutes before trying again.`);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await signInAsGuest();
      recordLoginAttempt(true);
      
      // Clear rate limiting data on successful login
      clearRateLimitData();
      
      // Show success toast
      toast.success('Welcome! You are now exploring as a guest.', {
        duration: 3000,
        description: 'Guest mode activated successfully'
      });
      
      // Let the auth context handle redirection
      setLoading(false);
    } catch (error) {
      console.error('Guest sign-in error:', error);
      recordLoginAttempt(false);
      
      if (error instanceof FirebaseError) {
        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        const genericError = 'Guest sign-in failed. Please try again.';
        setError(genericError);
        toast.error(genericError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load remembered email on component mount
  useEffect(() => {
    const remembered = localStorage.getItem('rememberMe');
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    
    if (remembered === 'true' && rememberedEmail) {
      setRememberMe(true);
      setEmail(rememberedEmail);
    }
  }, []);

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Clear rate limiting data on successful login
  const clearRateLimitData = useCallback(() => {
    localStorage.removeItem('loginAttempts');
    setLoginAttempts([]);
    setRateLimitInfo({ attempts: 0, lastAttempt: 0 });
    setIsBlocked(false);
    setBlockTimeRemaining(0);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-secondary/10 p-2 sm:p-4">
      <Card className="w-full max-w-sm sm:max-w-lg shadow-2xl border card-enhanced">
        <CardHeader className="space-y-3 sm:space-y-4 text-center px-4 sm:px-6">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-foreground rounded-md shadow-inner"></div>
          </div>
          <div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome back
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground">
              Sign in to your workspace
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Rate Limit Warning */}
          {isBlocked && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <Clock className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Too many failed attempts. Please wait {formatTimeRemaining(blockTimeRemaining)} before trying again.
              </AlertDescription>
            </Alert>
          )}

          {/* Security Warning */}
          {rateLimitInfo.attempts > 0 && !isBlocked && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
                {MAX_ATTEMPTS - rateLimitInfo.attempts} login attempts remaining before temporary lockout.
              </AlertDescription>
            </Alert>
          )}

          {/* General Error */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            variant="outline"
            className="w-full h-11 sm:h-12 border-2 border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-sm sm:text-base touch-manipulation"
            onClick={handleGoogleSignIn}
            disabled={loading || isBlocked}
          >
            <Chrome className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
            Continue with Google
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearValidationErrors();
                    }}
                    className={`pl-10 h-11 sm:h-12 transition-all duration-200 focus:border-primary/50 text-sm sm:text-base ${
                      validationErrors.email ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    required
                    disabled={loading || isBlocked}
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearValidationErrors();
                    }}
                    className={`pl-10 pr-12 h-11 sm:h-12 transition-all duration-200 focus:border-primary/50 text-sm sm:text-base ${
                      validationErrors.password ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    required
                    disabled={loading || isBlocked}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                    disabled={loading || isBlocked}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
                )}
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={loading || isBlocked}
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base touch-manipulation" 
              disabled={loading || isBlocked}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <button 
              onClick={() => router.push('/reset-password')}
              className="text-sm text-primary hover:text-accent font-medium transition-colors duration-200 hover:underline"
              disabled={loading || isBlocked}
            >
              Forgot your password?
            </button>
            <div className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <button 
                onClick={() => router.push('/register')}
                className="text-primary hover:text-accent font-medium transition-colors duration-200 hover:underline"
                disabled={loading || isBlocked}
              >
                Create account
              </button>
            </div>
          </div>

          {/* Guest Mode Notice */}
          <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Guest Mode</p>
                <p className="text-muted-foreground">
                  Explore the app without creating an account. Your data will be temporary and won&apos;t be saved permanently.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGuestSignIn}
                  disabled={loading || isBlocked}
                  className="mt-3 border-primary/30 text-primary hover:bg-primary/10 touch-manipulation"
                >
                  <User className="h-4 w-4 mr-2" />
                  Try as Guest
                </Button>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="mt-4 p-3 bg-muted/50 border border-border rounded-lg">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Your login is protected with rate limiting and security measures</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}