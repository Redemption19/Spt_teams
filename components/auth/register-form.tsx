'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Chrome, Mail, Lock, User, Building2, Phone, Briefcase, MapPin, CheckSquare, Eye, EyeOff, AlertCircle, AlertTriangle, Shield } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { isValidEmail, sanitizeInput } from '@/lib/utils';
import { registrationSchema, getFirebaseAuthErrorMessage } from '@/lib/auth-validation';
import { PasswordStrengthIndicator } from './password-strength-indicator';

interface RegisterFormProps {
  inviteToken?: string;
  preAssignedRole?: 'owner' | 'admin' | 'member';
  preAssignedEmail?: string;
  workspaceId?: string;
  teamId?: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  jobTitle?: string;
  department?: string;
  general?: string;
}

interface RegistrationAttempt {
  timestamp: number;
  success: boolean;
  email?: string;
}

export function RegisterForm({ 
  inviteToken, 
  preAssignedRole, 
  preAssignedEmail,
  workspaceId,
  teamId 
}: RegisterFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: preAssignedEmail || '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: preAssignedRole || 'member',
    department: '',
    jobTitle: '',
    workspaceId: workspaceId || 'workspace-1',
    teamIds: teamId ? [teamId] : [],
    branchId: '',
    regionId: '',
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationAttempts, setRegistrationAttempts] = useState<RegistrationAttempt[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Rate limiting constants
  const MAX_REGISTRATION_ATTEMPTS = 3;
  const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes
  const ATTEMPT_WINDOW = 10 * 60 * 1000; // 10 minutes

  // Check rate limiting
  const checkRateLimit = useCallback((attempts: RegistrationAttempt[]) => {
    const now = Date.now();
    const recentAttempts = attempts.filter(
      attempt => now - attempt.timestamp < ATTEMPT_WINDOW
    );
    
    const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
    
    if (failedAttempts.length >= MAX_REGISTRATION_ATTEMPTS) {
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
        setRegistrationAttempts(validAttempts);
        localStorage.setItem('registrationAttempts', JSON.stringify(validAttempts));
        setIsBlocked(false);
      }
    } else {
      setIsBlocked(false);
    }
  }, [ATTEMPT_WINDOW, BLOCK_DURATION, MAX_REGISTRATION_ATTEMPTS]);

  // Load saved registration attempts from localStorage
  useEffect(() => {
    const savedAttempts = localStorage.getItem('registrationAttempts');
    if (savedAttempts) {
      try {
        const attempts: RegistrationAttempt[] = JSON.parse(savedAttempts);
        setRegistrationAttempts(attempts);
        checkRateLimit(attempts);
      } catch (error) {
        console.warn('Failed to load registration attempts:', error);
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

  // Record registration attempt
  const recordRegistrationAttempt = useCallback((success: boolean, email?: string) => {
    const attempt: RegistrationAttempt = {
      timestamp: Date.now(),
      success,
      email
    };

    const newAttempts = [...registrationAttempts, attempt];
    
    // Keep only attempts from the last 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const validAttempts = newAttempts.filter(attempt => attempt.timestamp > oneDayAgo);
    
    setRegistrationAttempts(validAttempts);
    localStorage.setItem('registrationAttempts', JSON.stringify(validAttempts));
    checkRateLimit(validAttempts);
  }, [registrationAttempts, checkRateLimit]);

  // Clear validation errors when user types
  const clearValidationErrors = useCallback(() => {
    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors({});
    }
  }, [validationErrors]);

  // Form validation
  const validateForm = useCallback((): boolean => {
    try {
      // Validate using Zod schema
      registrationSchema.parse({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: formData.acceptTerms
      });

      // Additional custom validation
      const errors: ValidationErrors = {};

      // Phone validation (optional but if provided, validate format)
      if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }

      // Job title validation
      if (formData.jobTitle && formData.jobTitle.length < 2) {
        errors.jobTitle = 'Job title must be at least 2 characters';
      }

      // Department validation
      if (formData.department && formData.department.length < 2) {
        errors.department = 'Department must be at least 2 characters';
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return false;
      }

      setValidationErrors({});
      return true;
    } catch (error: any) {
      // Handle Zod validation errors
      const errors: ValidationErrors = {};
      
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          if (field && typeof field === 'string') {
            errors[field as keyof ValidationErrors] = err.message;
          }
        });
      }
      
      setValidationErrors(errors);
      return false;
    }
  }, [formData]);

  // Sanitize form data
  const sanitizeFormData = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      firstName: sanitizeInput(prev.firstName),
      lastName: sanitizeInput(prev.lastName),
      email: sanitizeInput(prev.email),
      phone: sanitizeInput(prev.phone),
      jobTitle: sanitizeInput(prev.jobTitle),
      department: sanitizeInput(prev.department)
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if blocked
    if (isBlocked) {
      toast.error(`Too many failed attempts. Please wait ${Math.ceil(blockTimeRemaining / 60000)} minutes before trying again.`);
      return;
    }

    // Sanitize inputs
    sanitizeFormData();

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors above and try again.');
      return;
    }

    setLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Determine the actual role based on invitation or if this is the first user
      let actualRole = formData.role;
      
      if (inviteToken) {
        actualRole = preAssignedRole || 'member';
      } else {
        actualRole = 'member';
      }

      // Prepare user data with all form fields
      const userData = {
        name: fullName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        jobTitle: formData.jobTitle,
        department: formData.department,
        branchId: formData.branchId === 'none' ? undefined : formData.branchId || undefined,
        regionId: formData.regionId === 'none' ? undefined : formData.regionId || undefined,
        workspaceId: formData.workspaceId,
      };

      await signUp(formData.email, formData.password, userData, actualRole, inviteToken);
      
      // Record successful attempt
      recordRegistrationAttempt(true, formData.email);
      
      if (inviteToken) {
        toast.success('Account created and invitation accepted! Welcome to the team!', {
          duration: 3000,
          description: 'Successfully joined the workspace'
        });
      } else {
        toast.success('Account created successfully!', {
          duration: 3000,
          description: 'Welcome to your new workspace'
        });
      }
      
      // Small delay to let the auth context update
      setTimeout(() => {
        if (inviteToken) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }, 1000);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Record failed attempt
      recordRegistrationAttempt(false, formData.email);
      
      if (error instanceof FirebaseError) {
        const errorMessage = getFirebaseAuthErrorMessage(error.code);
        toast.error(errorMessage);
      } else {
        toast.error(`Failed to create account: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (isBlocked) {
      toast.error(`Too many failed attempts. Please wait ${Math.ceil(blockTimeRemaining / 60000)} minutes before trying again.`);
      return;
    }

    setLoading(true);
    try {
      await signInWithGoogle();
      recordRegistrationAttempt(true);
      
      toast.success('Account created successfully!', {
        duration: 3000,
        description: 'Successfully signed up with Google'
      });
      
      // The auth context will handle redirection automatically
      // based on the isNewUser flag that was set in signInWithGoogle
      // New users will be redirected to /onboarding, existing users to /dashboard
    } catch (error) {
      recordRegistrationAttempt(false);
      
      if (error instanceof FirebaseError) {
        const errorMessage = getFirebaseAuthErrorMessage(error.code);
        
        // Show specific toast messages for common Google auth errors
        if (error.code === 'auth/popup-closed-by-user') {
          toast.error('Google sign-up was cancelled. Please try again.');
        } else if (error.code === 'auth/popup-blocked') {
          toast.error('Please allow pop-ups for this site to use Google sign-up.');
        } else if (error.code === 'auth/unauthorized-domain') {
          toast.error('Google sign-up is not configured for this domain. Please contact support.');
        } else if (error.code === 'auth/email-already-in-use') {
          toast.error('An account with this email already exists. Please sign in instead.');
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Google sign-up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isOwnerRegistration = !inviteToken && !preAssignedRole;
  const showOwnerSetupInfo = isOwnerRegistration;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-secondary/10 p-2 sm:p-4">
      <Card className="w-full max-w-lg sm:max-w-2xl shadow-2xl border card-enhanced">
        <CardHeader className="space-y-3 sm:space-y-4 text-center px-4 sm:px-6">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-foreground rounded-md shadow-inner"></div>
          </div>
          <div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {inviteToken ? 'Join the Team' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground">
              {inviteToken 
                ? 'Complete your registration to join the workspace' 
                : 'Set up your workspace account'
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Rate Limit Warning */}
          {isBlocked && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Too many failed attempts. Please wait {formatTimeRemaining(blockTimeRemaining)} before trying again.
              </AlertDescription>
            </Alert>
          )}

          {/* Security Warning */}
          {registrationAttempts.length > 0 && !isBlocked && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
                {MAX_REGISTRATION_ATTEMPTS - registrationAttempts.length} registration attempts remaining before temporary lockout.
              </AlertDescription>
            </Alert>
          )}

          {!inviteToken && (
            <>
              <Button
                variant="outline"
                className="w-full h-11 sm:h-12 border-2 border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-sm sm:text-base touch-manipulation"
                onClick={handleGoogleSignUp}
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
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({...formData, firstName: e.target.value});
                        clearValidationErrors();
                      }}
                      className={`pl-10 h-11 sm:h-12 transition-all duration-200 focus:border-primary/50 text-sm sm:text-base ${
                        validationErrors.firstName ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      required
                      disabled={loading || isBlocked}
                    />
                  </div>
                  {validationErrors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-foreground">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({...formData, lastName: e.target.value});
                        clearValidationErrors();
                      }}
                      className={`pl-10 h-11 sm:h-12 transition-all duration-200 focus:border-primary/50 text-sm sm:text-base ${
                        validationErrors.lastName ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      required
                      disabled={loading || isBlocked}
                    />
                  </div>
                  {validationErrors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({...formData, email: e.target.value});
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
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+233 XX XXX XXXX"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({...formData, phone: e.target.value});
                        clearValidationErrors();
                      }}
                      className={`pl-10 h-11 sm:h-12 transition-all duration-200 focus:border-primary/50 text-sm sm:text-base ${
                        validationErrors.phone ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      disabled={loading || isBlocked}
                    />
                  </div>
                  {validationErrors.phone && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Professional Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-sm font-medium text-foreground">Job Title</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="jobTitle"
                        type="text"
                        placeholder="e.g. Software Developer"
                        value={formData.jobTitle}
                        onChange={(e) => {
                          setFormData({...formData, jobTitle: e.target.value});
                          clearValidationErrors();
                        }}
                        className={`pl-10 h-11 sm:h-12 transition-all duration-200 focus:border-primary/50 text-sm sm:text-base ${
                          validationErrors.jobTitle ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        disabled={loading || isBlocked}
                      />
                  </div>
                  {validationErrors.jobTitle && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.jobTitle}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium text-foreground">Department</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select 
                      value={formData.department} 
                      onValueChange={(value) => {
                        setFormData({...formData, department: value});
                        clearValidationErrors();
                      }}
                      disabled={loading || isBlocked}
                    >
                      <SelectTrigger className={`pl-10 h-11 sm:h-12 text-sm sm:text-base ${
                        validationErrors.department ? 'border-red-500 focus:border-red-500' : ''
                      }`}>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="hr">Human Resources</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {validationErrors.department && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.department}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region" className="text-sm font-medium text-foreground">Region (Optional)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select
                      value={formData.regionId}
                      onValueChange={(value) => setFormData({...formData, regionId: value})}
                      disabled={loading || isBlocked}
                    >
                      <SelectTrigger className="pl-10 h-11 sm:h-12 text-sm sm:text-base">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="greater-accra">Greater Accra</SelectItem>
                        <SelectItem value="ashanti">Ashanti</SelectItem>
                        <SelectItem value="eastern">Eastern</SelectItem>
                        <SelectItem value="western">Western</SelectItem>
                        <SelectItem value="northern">Northern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch" className="text-sm font-medium text-foreground">Branch (Optional)</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select
                      value={formData.branchId}
                      onValueChange={(value) => setFormData({...formData, branchId: value})}
                      disabled={loading || isBlocked}
                    >
                      <SelectTrigger className="pl-10 h-11 sm:h-12 text-sm sm:text-base">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="central-branch">Accra Branch</SelectItem>
                        <SelectItem value="east-legon-branch">Takoradi Branch</SelectItem>
                        <SelectItem value="kumasi-central">Kumasi Branch</SelectItem>
                        <SelectItem value="tema-branch">Tema Branch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Security
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({...formData, password: e.target.value});
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
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <PasswordStrengthIndicator 
                      password={formData.password}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({...formData, confirmPassword: e.target.value});
                        clearValidationErrors();
                      }}
                      className={`pl-10 pr-12 h-11 sm:h-12 transition-all duration-200 focus:border-primary/50 text-sm sm:text-base ${
                        validationErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      required
                      disabled={loading || isBlocked}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                      disabled={loading || isBlocked}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Role Assignment - Only for invited users or first owner */}
            {(isOwnerRegistration && !inviteToken) && (
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Account Type
                </h3>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-2 border-amber-200 dark:border-amber-800/50">
                  <div className="flex items-start space-x-3">
                    <CheckSquare className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">Organization Setup</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        You&apos;re creating the first account for this organization. You will be assigned as the Owner with full administrative privileges.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {preAssignedRole && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center space-x-3">
                  <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    You&apos;re being invited as: <strong className="capitalize">{preAssignedRole}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 sm:p-4 bg-muted/30 border border-border rounded-lg">
                <Checkbox 
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => setFormData({...formData, acceptTerms: checked as boolean})}
                  className="mt-1 touch-manipulation"
                  disabled={loading || isBlocked}
                />
                <div className="space-y-1">
                  <Label htmlFor="terms" className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I agree to the Terms and Conditions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By creating an account, you agree to our{' '}
                    <button type="button" className="text-primary hover:text-accent underline transition-colors touch-manipulation">
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button type="button" className="text-primary hover:text-accent underline transition-colors touch-manipulation">
                      Privacy Policy
                    </button>
                  </p>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 sm:h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base touch-manipulation" 
              disabled={loading || !formData.acceptTerms || isBlocked}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button 
              onClick={() => router.push('/')}
              className="text-primary hover:text-accent font-medium transition-colors duration-200 hover:underline"
              disabled={loading || isBlocked}
            >
              Sign in
            </button>
          </div>

          {/* Security Info */}
          <div className="mt-4 p-3 bg-muted/50 border border-border rounded-lg">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Your registration is protected with rate limiting and security measures</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
