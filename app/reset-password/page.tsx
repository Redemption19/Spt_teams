'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import { UserService } from '@/lib/user-service';
import { useToast } from '@/hooks/use-toast';
import { PasswordResetService } from '@/lib/password-reset-service';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Send password reset email using custom EmailJS service
      const result = await PasswordResetService.sendPasswordResetEmail(email);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      setEmailSent(true);
      
      toast({
        title: 'Reset Email Sent',
        description: result.message,
      });
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      
      // Handle Firebase Auth errors
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a password reset link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Password reset emails have been sent! You'll receive:
                <ul className="mt-2 space-y-1">
                  <li>• A branded notification from Standard Pensions Trust</li>
                  <li>• A secure password reset link from Firebase</li>
                </ul>
                Please check both your inbox and spam folder.
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
            
            <div className="text-center">
              <Link href="/">
                <Button variant="ghost" className="text-sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Reset Password
          </CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-11"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reset Link
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link href="/" className="text-primary hover:underline">
                Back to Login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 