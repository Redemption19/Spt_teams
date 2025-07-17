// components/settings/notification-security-settings.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Shield, 
  Key, 
  Phone, 
  Lock, 
  Info, 
  Crown, 
  UserCheck, 
  Save 
} from 'lucide-react';

interface NotificationSecuritySettingsProps {
  notifications: any;
  setNotifications: React.Dispatch<React.SetStateAction<any>>;
  userRole: 'owner' | 'admin' | 'member';
  getRoleIcon: (role: string) => JSX.Element;
}

export function NotificationSecuritySettings({ 
  notifications, 
  setNotifications, 
  userRole, 
  getRoleIcon 
}: NotificationSecuritySettingsProps) {
  return (
    <>
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
    </>
  );
}