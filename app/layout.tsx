'use client';

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { NotificationProvider } from '@/lib/notification-context';
import { WorkspaceProvider } from '@/lib/workspace-context';
import { Toaster } from '@/components/ui/toaster';
import { WorkspaceAssistantProvider, FloatingWorkspaceAssistant } from '@/components/workspace-assistant';
import { useAuth } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WorkSpace - Collaboration Platform',
  description: 'Advanced workspace collaboration system with branch management and analytics',
};

function WorkspaceProviderWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <WorkspaceProvider userId={user?.uid || ''}>
      {children}
    </WorkspaceProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <WorkspaceProviderWrapper>
              <NotificationProvider>
                <WorkspaceAssistantProvider>
                  {children}
                  <FloatingWorkspaceAssistant />
                  <Toaster />
                </WorkspaceAssistantProvider>
              </NotificationProvider>
            </WorkspaceProviderWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}