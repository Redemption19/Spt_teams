'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { User, X, ArrowRight, Crown } from 'lucide-react';
import { toast } from 'sonner';

export function GuestBanner() {
  const { isGuest, logout } = useAuth();
  const { isGuest: isGuestWorkspace } = useWorkspace();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  if (!isGuest || !isGuestWorkspace || !isVisible) {
    return null;
  }

  const handleSignUp = () => {
    // Logout guest user and redirect to registration
    logout();
    router.push('/register');
  };

  const handleContinueAsGuest = () => {
    setIsVisible(false);
    toast.success('Continuing as guest. Your data will be temporary.');
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <Alert className="border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <User className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <AlertDescription className="text-foreground">
              <div className="flex items-center space-x-2 mb-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Guest Mode Active</span>
              </div>
              <p className="text-sm mb-3 text-muted-foreground">
                You&apos;re exploring the application as a guest. Your data is temporary and will be lost when you log out. 
                Create an account to save your work and access all features.
              </p>
              <div className="flex items-center space-x-3">
                <Button
                  size="sm"
                  onClick={handleSignUp}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Create Account
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleContinueAsGuest}
                  className="border-primary/30 text-primary hover:bg-primary/10"
                >
                  Continue as Guest
                </Button>
              </div>
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-primary hover:text-accent hover:bg-primary/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
} 