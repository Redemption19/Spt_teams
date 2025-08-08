'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireGuest?: boolean;
  fallback?: React.ReactNode;
}

export function RouteGuard({ 
  children, 
  requireAuth = true, 
  requireGuest = false,
  fallback 
}: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // User needs to be authenticated but isn't
        console.log('RouteGuard: User not authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      if (requireGuest && user) {
        // User needs to be a guest but is authenticated
        console.log('RouteGuard: User is authenticated but route requires guest, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }

      // User is authorized for this route
      setIsAuthorized(true);
    }
  }, [user, loading, requireAuth, requireGuest, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </Card>
      </div>
    );
  }

  // Show fallback or loading while redirecting
  if (!isAuthorized) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Redirecting...</p>
        </Card>
      </div>
    );
  }

  // User is authorized, show the protected content
  return <>{children}</>;
}
