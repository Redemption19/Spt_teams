'use client';

import { LoginForm } from '@/components/auth/login-form';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/toaster';

// Simple notification provider for login page that doesn't require workspace context
function LoginNotificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <Toaster />
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