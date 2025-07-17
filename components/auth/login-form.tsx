'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Chrome, Mail, Lock, AlertCircle, Eye, EyeOff, User } from 'lucide-react';
import { FirebaseError } from 'firebase/app';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithGoogle, signInAsGuest } = useAuth();
  const router = useRouter();

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
      default:
        return 'An error occurred during sign in. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof FirebaseError) {
        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
        
        // Also show toast for immediate feedback
        if (error.code === 'auth/wrong-password') {
          toast.error('Incorrect password. Please try again.');
        } else if (error.code === 'auth/user-not-found') {
          toast.error('No account found with this email.');
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
    setLoading(true);
    setError(null);
    
    try {
      await signInWithGoogle();
      toast.success('Welcome!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      if (error instanceof FirebaseError) {
        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
        toast.error(errorMessage);
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
    setLoading(true);
    setError(null);
    
    try {
      await signInAsGuest();
      toast.success('Welcome! You are now exploring as a guest.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Guest sign-in error:', error);
      
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

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-secondary/10 p-4">
      <Card className="w-full max-w-lg shadow-2xl border card-enhanced">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
            <div className="w-8 h-8 bg-primary-foreground rounded-md shadow-inner"></div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome back
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to your workspace
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
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
            className="w-full h-12 border-2 border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
            onClick={handleGoogleSignIn}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      if (error) clearError();
                    }}
                    className="pl-10 h-12 transition-all duration-200 focus:border-primary/50"
                    required
                    disabled={loading}
                  />
                </div>
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
                      if (error) clearError();
                    }}
                    className="pl-10 pr-10 h-12 transition-all duration-200 focus:border-primary/50"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <button 
              onClick={() => router.push('/reset-password')}
              className="text-sm text-primary hover:text-accent font-medium transition-colors duration-200 hover:underline"
            >
              Forgot your password?
            </button>
            <div className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <button 
                onClick={() => router.push('/register')}
                className="text-primary hover:text-accent font-medium transition-colors duration-200 hover:underline"
                disabled={loading}
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
                  disabled={loading}
                  className="mt-3 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <User className="h-4 w-4 mr-2" />
                  Try as Guest
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}