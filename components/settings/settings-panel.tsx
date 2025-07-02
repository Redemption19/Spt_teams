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
  Globe,
  Key,
  Mail,
  Phone,
  Building2,
  Users,
  Save,
  Upload,
  Crown,
  UserCheck,
  Info,
  Lock,
  Edit3,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SettingsPanelProps {
  userRole?: 'owner' | 'admin' | 'member';
}

export function SettingsPanel({ userRole = 'member' }: SettingsPanelProps) {
  const { userProfile } = useAuth();
  const { currentWorkspace, refreshWorkspaces, refreshCurrentWorkspace } = useWorkspace();
  
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

  // Role-based tab access
  const getAvailableTabs = () => {
    const baseTabs = ['profile', 'notifications', 'security', 'appearance'];
    
    if (userRole === 'owner' || userRole === 'admin') {
      baseTabs.splice(3, 0, 'workspace'); // Insert workspace before appearance
    }
    
    return baseTabs;
  };

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

  // Save profile function
  const handleSaveProfile = async () => {
    try {
      // Get the current user ID
      const userId = userProfile?.id;
      if (!userId) {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive"
        });
        return;
      }

      // Update the full name if first/last name changed
      const fullName = profile.firstName && profile.lastName 
        ? `${profile.firstName} ${profile.lastName}` 
        : profile.name;

      // Import ProfileService dynamically
      const { ProfileService } = await import('@/lib/profile-service');
      
      // Update profile in database
      await ProfileService.updateProfile(userId, {
        ...profile,
        name: fullName,
      });

      // Update local state with the new name
      setProfile(prev => ({
        ...prev,
        name: fullName
      }));

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  // Save workspace settings function
  const handleSaveWorkspaceSettings = async () => {
    try {
      if (!currentWorkspace) {
        toast({
          title: "Error",
          description: "No workspace selected",
          variant: "destructive"
        });
        return;
      }

      // Import WorkspaceService dynamically
      const { WorkspaceService } = await import('@/lib/workspace-service');
      
      // Update basic workspace info
      await WorkspaceService.updateWorkspace(currentWorkspace.id, {
        name: workspaceSettings.workspaceName,
      });

      // Update workspace settings separately
      await WorkspaceService.updateWorkspaceSettings(currentWorkspace.id, {
        allowAdminWorkspaceCreation: workspaceSettings.allowAdminWorkspaceCreation,
      });

      // Refresh current workspace data immediately to reflect changes
      await refreshCurrentWorkspace();
      
      // Also refresh the full workspace list
      await refreshWorkspaces();

      toast({
        title: "Success",
        description: "Workspace settings updated successfully!",
      });
      
    } catch (error) {
      console.error('Error saving workspace settings:', error);
      toast({
        title: "Error",
        description: "Failed to update workspace settings",
        variant: "destructive"
      });
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

        <TabsContent value="profile" className="space-y-6">
          <Card className="card-enhanced border border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <span className="text-foreground">Profile Information</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${getRoleBadgeColor(profile.role)} flex items-center space-x-1 border`}>
                    {getRoleIcon(profile.role)}
                    <span className="capitalize">{profile.role}</span>
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                    className="text-xs"
                  >
                    <Link href="/dashboard/profile">
                      <Edit3 className="h-3 w-3 mr-1" />
                      Advanced
                    </Link>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role info alert */}
              <Alert className="border-primary/20 bg-primary/5 dark:bg-primary/10">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-foreground">
                  Your role determines which settings and features you can access. Contact an administrator to change your role.
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={profile.firstName}
                    onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                    className="border-border bg-background focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={profile.lastName}
                    onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                    className="border-border bg-background focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="border-border bg-background focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="border-border bg-background focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input 
                    id="jobTitle" 
                    value={profile.jobTitle}
                    onChange={(e) => setProfile({...profile, jobTitle: e.target.value})}
                    className="border-border bg-background focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={profile.department} onValueChange={(value) => setProfile({...profile, department: value})}>
                    <SelectTrigger className="border-border bg-background focus:ring-primary focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Analytics">Analytics</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  placeholder="Tell us about yourself..."
                  className="border-border bg-background focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  onClick={handleSaveProfile}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="card-enhanced border border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary" />
                <span className="text-foreground">Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">General Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch 
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                  </div>
                  <Switch 
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                  />
                </div>
              </div>

              <Separator />

              {/* Activity Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary border-b pb-2">Activity Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Task Updates</Label>
                    <p className="text-sm text-muted-foreground">When tasks are assigned or updated</p>
                  </div>
                  <Switch 
                    checked={notifications.taskUpdates}
                    onCheckedChange={(checked) => setNotifications({...notifications, taskUpdates: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Team Invitations</Label>
                    <p className="text-sm text-muted-foreground">When you are invited to join a team</p>
                  </div>
                  <Switch 
                    checked={notifications.teamInvites}
                    onCheckedChange={(checked) => setNotifications({...notifications, teamInvites: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Report Submissions</Label>
                    <p className="text-sm text-muted-foreground">When reports are submitted or reviewed</p>
                  </div>
                  <Switch 
                    checked={notifications.reportSubmissions}
                    onCheckedChange={(checked) => setNotifications({...notifications, reportSubmissions: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">Weekly summary of your activity</p>
                  </div>
                  <Switch 
                    checked={notifications.weeklyDigest}
                    onCheckedChange={(checked) => setNotifications({...notifications, weeklyDigest: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">Important security and account updates</p>
                  </div>
                  <Switch 
                    checked={notifications.securityAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, securityAlerts: checked})}
                  />
                </div>
              </div>

              {/* Admin/Owner specific notifications */}
              {(userRole === 'owner' || userRole === 'admin') && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center space-x-2">
                      {userRole === 'owner' ? <Crown className="h-4 w-4 text-yellow-500 dark:text-yellow-400" /> : <UserCheck className="h-4 w-4 text-blue-500 dark:text-blue-400" />}
                      <span>{userRole === 'owner' ? 'Owner' : 'Admin'} Notifications</span>
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base">Workspace Updates</Label>
                        <p className="text-sm text-muted-foreground">User registrations, role changes, and workspace settings</p>
                      </div>
                      <Switch 
                        checked={notifications.workspaceUpdates}
                        onCheckedChange={(checked) => setNotifications({...notifications, workspaceUpdates: checked})}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="card-enhanced border border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-foreground">Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Password Change Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Change Password</h3>                  <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input 
                      id="current-password" 
                      type="password" 
                      className="border-border bg-background focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      className="border-border bg-background focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      className="border-border bg-background focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Password must be at least 8 characters with a mix of letters, numbers, and symbols.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Two-Factor Authentication */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Two-Factor Authentication</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Authenticator App</p>
                      <p className="text-sm text-muted-foreground">Use an authenticator app to generate codes</p>
                    </div>
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                      <Key className="h-4 w-4 mr-2" />
                      Set Up
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">SMS Authentication</p>
                      <p className="text-sm text-muted-foreground">Receive codes via text message</p>
                    </div>
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                      <Phone className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Session Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Active Sessions</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Current Session - Chrome (Windows)</p>
                      <p className="text-sm text-muted-foreground">Last active: Now • IP: 192.168.1.1</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Mobile App - Android</p>
                      <p className="text-sm text-muted-foreground">Last active: 2 hours ago • IP: 192.168.1.15</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Lock className="h-4 w-4 mr-2" />
                      Revoke
                    </Button>
                  </div>
                </div>

                <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                  Sign Out All Other Sessions
                </Button>
              </div>

              {/* Security Alerts */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Security Alerts</h3>
                
                <Alert className="border-primary/20 bg-primary/5 dark:bg-primary/10">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-foreground">
                    Enable security notifications to be alerted about suspicious login attempts and account changes.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex justify-end">
                <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                  <Save className="h-4 w-4 mr-2" />
                  Update Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workspace Settings Tab - Only for Owners and Admins */}
        {(userRole === 'owner' || userRole === 'admin') && (
          <TabsContent value="workspace" className="space-y-6">
            <Card className="card-enhanced border border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="text-foreground">Workspace Settings</span>
                  </div>
                  <Badge className={`${getRoleBadgeColor(userRole)} flex items-center space-x-1 border`}>
                    {getRoleIcon(userRole)}
                    <span className="capitalize">{userRole} Access</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Workspace Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Workspace Information</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="workspaceName">Workspace Name</Label>
                      <Input 
                        id="workspaceName" 
                        value={workspaceSettings.workspaceName}
                        onChange={(e) => setWorkspaceSettings({...workspaceSettings, workspaceName: e.target.value})}
                        className="border-border bg-background focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Default Timezone</Label>
                      <Select value={workspaceSettings.defaultTimezone} onValueChange={(value) => setWorkspaceSettings({...workspaceSettings, defaultTimezone: value})}>
                        <SelectTrigger className="border-border bg-background focus:ring-primary focus:border-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GMT">GMT (Ghana)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">EST</SelectItem>
                          <SelectItem value="PST">PST</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Working Hours & Schedule */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Working Hours & Schedule</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="workingHours">Default Working Hours</Label>
                      <Input 
                        id="workingHours" 
                        value={workspaceSettings.workingHours}
                        onChange={(e) => setWorkspaceSettings({...workspaceSettings, workingHours: e.target.value})}
                        placeholder="09:00-17:00"
                        className="border-border bg-background focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weekStart">Week Starts On</Label>
                      <Select value={workspaceSettings.weekStart} onValueChange={(value) => setWorkspaceSettings({...workspaceSettings, weekStart: value})}>
                        <SelectTrigger className="border-border bg-background focus:ring-primary focus:border-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sunday">Sunday</SelectItem>
                          <SelectItem value="monday">Monday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Security & Access Control */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary border-b pb-2">Security & Access</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base">Allow Guest Access</Label>
                        <p className="text-sm text-muted-foreground">Let non-members view public content</p>
                      </div>
                      <Switch 
                        checked={workspaceSettings.allowGuestAccess}
                        onCheckedChange={(checked) => setWorkspaceSettings({...workspaceSettings, allowGuestAccess: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base">Require Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">Mandate 2FA for all workspace members</p>
                      </div>
                      <Switch 
                        checked={workspaceSettings.requireTwoFA}
                        onCheckedChange={(checked) => setWorkspaceSettings({...workspaceSettings, requireTwoFA: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base">Auto-Archive Inactive Projects</Label>
                        <p className="text-sm text-muted-foreground">Automatically archive projects after 90 days of inactivity</p>
                      </div>
                      <Switch 
                        checked={workspaceSettings.autoArchive}
                        onCheckedChange={(checked) => setWorkspaceSettings({...workspaceSettings, autoArchive: checked})}
                      />
                    </div>

                    {/* Owner-only admin workspace creation setting */}
                    {userRole === 'owner' && (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-base">Allow Admin Workspace Creation</Label>
                            <p className="text-sm text-muted-foreground">
                              Let admins create new workspaces. Otherwise only owners can create workspaces.
                            </p>
                          </div>
                          <Switch 
                            checked={workspaceSettings.allowAdminWorkspaceCreation}
                            onCheckedChange={(checked) => setWorkspaceSettings({...workspaceSettings, allowAdminWorkspaceCreation: checked})}
                          />
                        </div>
                        
                        {workspaceSettings.allowAdminWorkspaceCreation && (
                          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
                            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <AlertDescription className="text-amber-800 dark:text-amber-200">
                              <strong>Note:</strong> Admins will be able to create new workspaces and automatically become their owners. You can revoke this permission at any time.
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {userRole === 'owner' && (
                  <>
                    <Separator />
                    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
                      <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200">
                        <strong>Owner Privileges:</strong> Only you can transfer workspace ownership, delete the workspace, or change critical security settings.
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                <Separator />

                {/* Department Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Department Management</h3>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Manage workspace departments to control access to reports and organize your team structure.
                    </p>
                    
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">Create & Manage Departments</p>
                        <p className="text-sm text-muted-foreground">
                          Set up departments for better organization and access control
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="border-primary text-primary hover:bg-primary hover:text-white"
                        asChild
                      >
                        <Link href="/dashboard/settings?tab=departments">
                          <Building2 className="h-4 w-4 mr-2" />
                          Manage Departments
                        </Link>
                      </Button>
                    </div>

                    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        <strong>Department Benefits:</strong> Use departments to control who can access specific report templates, organize users, and manage permissions across your workspace.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button 
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    onClick={handleSaveWorkspaceSettings}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Workspace Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="appearance" className="space-y-6">
          <Card className="card-enhanced border border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5 text-primary" />
                <span className="text-foreground">Appearance Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Settings */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Theme & Colors</h3>
                
                {/* Theme Selector */}
                <ThemeSelector />
                
                {/* Color Scheme Preview */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Color Scheme</Label>
                  <div className="p-4 border border-border rounded-lg bg-gradient-to-r from-background to-muted">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-foreground">Brand Colors</span>
                      <div className="flex space-x-2">
                        <div className="w-4 h-4 rounded-full bg-primary" title="Primary: Deep Maroon"></div>
                        <div className="w-4 h-4 rounded-full bg-accent" title="Accent: Bright Crimson"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-primary rounded-full w-3/4"></div>
                      <div className="h-2 bg-accent rounded-full w-1/2"></div>
                      <div className="h-2 bg-muted rounded-full w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Localization */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Localization</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger className="border-border bg-background focus:ring-primary focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="tw">Twi</SelectItem>
                        <SelectItem value="ga">Ga</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date & Time Format</Label>
                    <Select defaultValue="24h">
                      <SelectTrigger className="border-border bg-background focus:ring-primary focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Display Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary border-b pb-2">Display Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base">Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">Reduce spacing and padding for more content</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base">Show Animations</Label>
                      <p className="text-sm text-muted-foreground">Enable smooth transitions and effects</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base">High Contrast Mode</Label>
                      <p className="text-sm text-muted-foreground">Improve readability with enhanced contrast</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base">Show Role Badges</Label>
                      <p className="text-sm text-muted-foreground">Display role indicators next to user names</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save Appearance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}