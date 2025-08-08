
'use client';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AuthProvider } from '@/lib/auth-context';
import { NotificationProvider } from '@/lib/notification-context';
import { WorkspaceProvider } from '@/lib/workspace-context';
import { WorkspaceAssistantProvider, FloatingWorkspaceAssistant } from '@/components/workspace-assistant';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { GuestBanner } from '@/components/layout/guest-banner';

// Separate component that uses useAuth inside AuthProvider
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading, isGuest } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Handle swipe gestures for mobile sidebar
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchCurrentX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const deltaX = touchCurrentX.current - touchStartX.current;
      const threshold = 100; // Minimum swipe distance

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && touchStartX.current < 50) {
          // Swipe right from left edge - open sidebar (trigger header mobile menu)
          const mobileMenuButton = document.querySelector('[data-mobile-menu-trigger]') as HTMLButtonElement;
          if (mobileMenuButton) {
            mobileMenuButton.click();
          }
        }
      }
    };

    // Only add listeners on mobile screens
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    if (mediaQuery.matches) {
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <WorkspaceProvider userId={user.uid} isGuest={isGuest}>
      <NotificationProvider>
        <WorkspaceAssistantProvider>
          <div className="min-h-screen bg-background">
            <div className="flex h-screen">
              <div className="hidden md:block">
                <Sidebar />
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
                  <div className="max-w-7xl mx-auto">
                    <GuestBanner />
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </div>
          <FloatingWorkspaceAssistant />
          <Toaster />
        </WorkspaceAssistantProvider>
      </NotificationProvider>
    </WorkspaceProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
      <SpeedInsights />
    </AuthProvider>
  );
}