'use client';

import { SettingsPanel } from '@/components/settings/setting-panel/settings-panel-main';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { userProfile } = useAuth();
  
  return (
    <SettingsPanel 
      userRole={userProfile?.role || 'member'} 
    />
  );
}