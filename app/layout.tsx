import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { NotificationProvider } from '@/lib/notification-context';
import { WorkspaceProvider } from '@/lib/workspace-context';
import { Toaster } from '@/components/ui/toaster';
import { WorkspaceAssistantProvider, FloatingWorkspaceAssistant } from '@/components/workspace-assistant';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WorkSpace - Collaboration Platform',
  description: 'Advanced workspace collaboration system with branch management and analytics',
};

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
            <WorkspaceProvider>
              <NotificationProvider>
                <WorkspaceAssistantProvider>
                  {children}
                  <FloatingWorkspaceAssistant />
                  <Toaster />
                </WorkspaceAssistantProvider>
              </NotificationProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}