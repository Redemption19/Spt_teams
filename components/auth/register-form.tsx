'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Chrome, Mail, Lock, User, Building2, Phone, Briefcase, MapPin, CheckSquare } from 'lucide-react';

interface RegisterFormProps {
  inviteToken?: string;
  preAssignedRole?: 'owner' | 'admin' | 'member';
  preAssignedEmail?: string;
  workspaceId?: string;
  teamId?: string;
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
    role: preAssignedRole || 'member', // Always default to member for security
    department: '',
    jobTitle: '',
    workspaceId: workspaceId || 'workspace-1', // Use provided workspace ID or default
    teamIds: teamId ? [teamId] : [], // Add to team if specified
    branchId: '',
    regionId: '',
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (!formData.acceptTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Determine the actual role based on invitation or if this is the first user
      let actualRole = formData.role;
      
      if (inviteToken) {
        // If invited, use the pre-assigned role from invitation
        actualRole = preAssignedRole || 'member';
      } else {
        // For open registration, check if this is the first user (in real app, check database)
        // For now, we'll always assign 'member' role for open registrations
        actualRole = 'member';
        
        // In a real application, you would:
        // 1. Check if any owner exists in the database
        // 2. If no owner exists, make this user the owner
        // 3. Otherwise, assign as member and require admin approval
      }
        // Prepare user data with all form fields
      const userData = {
        name: fullName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        jobTitle: formData.jobTitle,
        department: formData.department,        branchId: formData.branchId === 'none' ? undefined : formData.branchId || undefined,
        regionId: formData.regionId === 'none' ? undefined : formData.regionId || undefined,
        workspaceId: formData.workspaceId,
      };
        await signUp(formData.email, formData.password, userData, actualRole, inviteToken);
      
      if (inviteToken) {
        toast.success('Account created and invitation accepted! Welcome to the team!');
      } else {
        toast.success('Account created successfully!');
      }
      
      // Small delay to let the auth context update
      setTimeout(() => {
        if (inviteToken) {
          // Invited users go directly to dashboard
          router.push('/dashboard');
        } else {
          // New self-registered users go to onboarding
          router.push('/onboarding');
        }
      }, 1000);
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else if (error.code === 'auth/invalid-api-key') {
        toast.error('Firebase configuration error. Please check your API key.');
      } else if (error.code === 'auth/api-key-not-valid') {
        toast.error('Invalid Firebase API key. Please check your configuration.');
      } else if (error.message?.includes('CONFIGURATION_NOT_FOUND')) {
        toast.error('Firebase project not configured properly. Enable Email/Password auth in Firebase Console.');
      } else {
        toast.error(`Failed to create account: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };
  const isOwnerRegistration = !inviteToken && !preAssignedRole;
  const showOwnerSetupInfo = isOwnerRegistration; // In real app, check if no owner exists in database

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-secondary/10 p-4">
      <Card className="w-full max-w-2xl shadow-2xl border card-enhanced">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
            <div className="w-8 h-8 bg-primary-foreground rounded-md shadow-inner"></div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {inviteToken ? 'Join the Team' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {inviteToken 
                ? 'Complete your registration to join the workspace' 
                : 'Set up your workspace account'
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!inviteToken && (
            <>
              <Button
                variant="outline"
                className="w-full h-12 border-2 border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                <Chrome className="w-5 h-5 mr-2 text-primary" />
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
          )}          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="pl-10 h-12 transition-all duration-200 focus:border-primary/50"
                      required
                    />
                  </div>
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
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="pl-10 h-12 transition-all duration-200 focus:border-primary/50"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-10 h-12 transition-all duration-200 focus:border-primary/50"
                      required
                    />
                  </div>
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
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="pl-10 h-12 transition-all duration-200 focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Professional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-sm font-medium text-foreground">Job Title</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="jobTitle"
                      type="text"
                      placeholder="e.g. Software Developer"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                      className="pl-10 h-12 transition-all duration-200 focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium text-foreground">Department</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select 
                      value={formData.department} 
                      onValueChange={(value) => setFormData({...formData, department: value})}
                    >
                      <SelectTrigger className="pl-10 h-12">
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
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region" className="text-sm font-medium text-foreground">Region (Optional)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select                      value={formData.regionId}
                      onValueChange={(value) => setFormData({...formData, regionId: value})}
                    >
                      <SelectTrigger className="pl-10 h-12">
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
                    <Select                      value={formData.branchId}
                      onValueChange={(value) => setFormData({...formData, branchId: value})}
                    >
                      <SelectTrigger className="pl-10 h-12">
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
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Security
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="pl-10 h-12 transition-all duration-200 focus:border-primary/50"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 6 characters required</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="pl-10 h-12 transition-all duration-200 focus:border-primary/50"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>            {/* Role Assignment - Only for invited users or first owner */}
            {(isOwnerRegistration && !inviteToken) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
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
            )}            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="terms"                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => setFormData({...formData, acceptTerms: checked as boolean})}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I agree to the Terms and Conditions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By creating an account, you agree to our{' '}
                    <button type="button" className="text-primary hover:text-accent underline transition-colors">
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button type="button" className="text-primary hover:text-accent underline transition-colors">
                      Privacy Policy
                    </button>
                  </p>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={loading || !formData.acceptTerms}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button 
              onClick={() => router.push('/')}
              className="text-primary hover:text-accent font-medium transition-colors duration-200 hover:underline"
            >
              Sign in
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
