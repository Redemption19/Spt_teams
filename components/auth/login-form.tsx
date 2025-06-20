'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Chrome, Mail, Lock } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border card-enhanced">
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 transition-all duration-200 focus:border-primary/50"
                  required
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
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 transition-all duration-200 focus:border-primary/50"
                  required
                />
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
              >
                Create account
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}