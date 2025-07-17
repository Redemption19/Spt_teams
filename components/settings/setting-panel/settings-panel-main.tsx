// components/settings/settings-panel-main.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Building2,
  Crown,
  UserCheck,
  Info,
  Edit3,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Import the sub-components
import { ProfileSettings } from './profile-settings';
import { NotificationSecuritySettings } from './notification-security-settings';
import { WorkspaceAppearanceSettings } from './workspace-appearance-settings';

interface SettingsPanelProps {
  userRole?: 'owner' | 'admin' | 'member';
}

export function SettingsPanel({ userRole = 'member' }: SettingsPanelProps) {
  const { userProfile } = useAuth();
  const { currentWorkspace, refreshWorkspaces, refreshCurrentWorkspace } = useWorkspace();
  
  // State for profile information (passed to ProfileSettings)
  const [profile, setProfile] = useState({
    name: userProfile?.name || 'John Doe',
    firstName: userProfile?.firstName || 'John',
    lastName: userProfile?.lastName || 'Doe',
    email: userProfile?.email || 'john.doe@company.com',
    phone: userProfile?.phone || '+233 20 123 4567',
    role: userProfile?.role || userRole,
    jobTitle: userProfile?.jobTitle || 'Team Member',
    department: userProfile?.department || 'Development',
    bio: 'Experienced team member with a passion for creating innovative solutions.',
  });

  // State for notifications (passed to NotificationSecuritySettings)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    taskUpdates: true,
    teamInvites: true,
    reportSubmissions: false,
    weeklyDigest: true,
    securityAlerts: true,
    workspaceUpdates: userRole === 'owner' || userRole === 'admin',
  });

  // State for workspace settings (passed to WorkspaceAppearanceSettings)
  const [workspaceSettings, setWorkspaceSettings] = useState({
    workspaceName: '',
    defaultTimezone: 'GMT',
    workingHours: '09:00-17:00',
    weekStart: 'monday',
    allowGuestAccess: false,
    requireTwoFA: false,
    autoArchive: true,
    allowAdminWorkspaceCreation: false,
  });

  // Load workspace data when component mounts or currentWorkspace changes
  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceSettings(prev => ({
        ...prev,
        workspaceName: currentWorkspace.name || 'Workspace',
        allowAdminWorkspaceCreation: currentWorkspace.settings?.allowAdminWorkspaceCreation || false,
        allowGuestAccess: currentWorkspace.settings?.allowGuestAccess || false,
      }));
    }
  }, [currentWorkspace]);

  // Update profile when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || 'John Doe',
        firstName: userProfile.firstName || 'John',
        lastName: userProfile.lastName || 'Doe',
        email: userProfile.email || 'john.doe@company.com',
        phone: userProfile.phone || '+233 20 123 4567',
        role: userProfile.role || userRole,
        jobTitle: userProfile.jobTitle || 'Team Member',
        department: userProfile.department || 'Development',
        bio: userProfile.bio || 'Experienced team member with a passion for creating innovative solutions.',
      });
    }
  }, [userProfile, userRole]);

  // Helper functions for role-based styling (can be passed as props or kept local if used only here)
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />;
      case 'admin':
        return <UserCheck className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account and workspace preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          {(userRole === 'owner' || userRole === 'admin') && (
            <TabsTrigger value="workspace">
              <Building2 className="h-4 w-4 mr-2" />
              Workspace
            </TabsTrigger>
          )}
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <ProfileSettings 
          profile={profile} 
          setProfile={setProfile} 
          userRole={userRole} 
          getRoleIcon={getRoleIcon} 
          getRoleBadgeColor={getRoleBadgeColor} 
          userProfile={userProfile}
        />

        <NotificationSecuritySettings 
          notifications={notifications} 
          setNotifications={setNotifications} 
          userRole={userRole} 
          getRoleIcon={getRoleIcon} 
        />

        <WorkspaceAppearanceSettings 
          workspaceSettings={workspaceSettings} 
          setWorkspaceSettings={setWorkspaceSettings} 
          userRole={userRole} 
          getRoleIcon={getRoleIcon} 
          getRoleBadgeColor={getRoleBadgeColor}
          currentWorkspace={currentWorkspace}
          refreshCurrentWorkspace={refreshCurrentWorkspace}
          refreshWorkspaces={refreshWorkspaces}
        />
      </Tabs>
    </div>
  );
}