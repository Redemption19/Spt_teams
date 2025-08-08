import { RegisterForm } from '@/components/auth/register-form';
import { Toaster } from 'sonner';

// Simple notification provider for registration page that doesn't require workspace context
function RegisterNotificationProvider({ children }: { children: React.ReactNode }) {
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

export default function RegisterPage() {
  return (
    <RegisterNotificationProvider>
      <RegisterForm />
    </RegisterNotificationProvider>
  );
}
