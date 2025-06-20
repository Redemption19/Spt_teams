'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    
    // Handle different auth actions
    switch (mode) {
      case 'resetPassword':
        // Redirect to your custom password reset page
        router.replace(`/reset-password/confirm?oobCode=${oobCode}&mode=${mode}`);
        break;
        
      case 'verifyEmail':
        // Redirect to email verification page (if you have one)
        router.replace(`/verify-email?oobCode=${oobCode}&mode=${mode}`);
        break;
        
      case 'recoverEmail':
        // Redirect to email recovery page (if you have one)
        router.replace(`/recover-email?oobCode=${oobCode}&mode=${mode}`);
        break;
        
      default:
        // Invalid or unknown mode, redirect to login
        router.replace('/');
        break;
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Processing your request...</p>
      </div>
    </div>
  );
} 