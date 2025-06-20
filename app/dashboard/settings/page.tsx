'use client';

import { SettingsPanel } from '@/components/settings/settings-panel';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { userProfile } = useAuth();
  
  return (
    <SettingsPanel 
      userRole={userProfile?.role || 'member'} 
    />
  );
}