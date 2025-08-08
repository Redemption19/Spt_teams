'use client';

import { LoginForm } from '@/components/auth/login-form';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';

// Simple notification provider for login page that doesn't require workspace context
function LoginNotificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <Toaster 
        position="top-right"
        closeButton
        duration={4000}
        theme="system"
        className="toast-theme-aware"
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginNotificationProvider>
        <LoginForm />
      </LoginNotificationProvider>
    </AuthProvider>
  );
} 