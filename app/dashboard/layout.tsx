import { SpeedInsights } from '@vercel/speed-insights/next';
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

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
              <Sidebar />
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