'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function useFloatingAssistantVisibility() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Don't show on auth pages
    const isAuthPage = pathname.startsWith('/auth') || 
                      pathname.startsWith('/login') || 
                      pathname.startsWith('/register') ||
                      pathname.startsWith('/reset-password');
    
    // Don't show on landing page
    const isLandingPage = pathname === '/';
    
    // Don't show on onboarding
    const isOnboardingPage = pathname.startsWith('/onboarding');
    
    // Only show if user is authenticated and not on excluded pages
    const shouldShowAssistant = !!user && !isAuthPage && !isLandingPage && !isOnboardingPage;
    
    setShouldShow(shouldShowAssistant);
  }, [pathname, user]);

  return shouldShow;
}
