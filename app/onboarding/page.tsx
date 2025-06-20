'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { OnboardingFlow } from '@/components/auth/onboarding-flow';

export default function OnboardingPage() {
  const { user, loading, isNewUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not a new user or not authenticated, redirect to dashboard
    if (!loading && (!user || !isNewUser)) {
      router.push('/dashboard');
    }
  }, [user, loading, isNewUser, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isNewUser) {
    return null;
  }

  return <OnboardingFlow />;
} 