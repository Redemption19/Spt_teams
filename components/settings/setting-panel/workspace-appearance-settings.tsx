// components/settings/workspace-appearance-settings.tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { useTheme } from '@/lib/theme-context';
import { 
  Palette, 
  Building2, 
  Info, 
  Crown, 
  UserCheck, 
  AlertCircle, 
  Save 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BudgetTrackingService } from '@/lib/budget-tracking-service';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { LanguageSelector } from '@/components/ui/language-selector';
import { useI18n } from '@/lib/i18n-context';

interface WorkspaceAppearanceSettingsProps {
  workspaceSettings: any;
  setWorkspaceSettings: React.Dispatch<React.SetStateAction<any>>;
  userRole: 'owner' | 'admin' | 'member';
  getRoleIcon: (role: string) => JSX.Element;
  getRoleBadgeColor: (role: string) => string;
  currentWorkspace: any; // Assuming currentWorkspace from workspace-context
  refreshCurrentWorkspace: () => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

export function WorkspaceAppearanceSettings({ 
  workspaceSettings, 
  setWorkspaceSettings, 
  userRole, 
  getRoleIcon, 
  getRoleBadgeColor,
  currentWorkspace,
  refreshCurrentWorkspace,
  refreshWorkspaces
}: WorkspaceAppearanceSettingsProps) {

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
        allowGuestAccess: workspaceSettings.allowGuestAccess,
        // Add other workspace settings here once they are managed by updateWorkspaceSettings
        // defaultTimezone: workspaceSettings.defaultTimezone,
        // workingHours: workspaceSettings.workingHours,
        // weekStart: workspaceSettings.weekStart,
        // requireTwoFA: workspaceSettings.requireTwoFA,
        // autoArchive: workspaceSettings.autoArchive,
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

  const { toast } = useToast();
  const [recalcLoading, setRecalcLoading] = useState(false);
  const { brandColors, setBrandColors, resetBrandColors } = useTheme();
  const { t } = useI18n();

  // Handler for batch recalculation
  const handleRecalculateBudgets = async () => {
    if (!currentWorkspace?.id) return;
    setRecalcLoading(true);
    try {
      await BudgetTrackingService.recalculateAllBudgetsSpent(currentWorkspace.id);
      toast({ title: 'Budgets Recalculated', description: 'All budgets have been recalculated from expenses.', variant: 'default' });
      if (refreshCurrentWorkspace) await refreshCurrentWorkspace();
      if (refreshWorkspaces) await refreshWorkspaces();
    } catch (err) {
      toast({ title: 'Recalculation Failed', description: 'Could not recalculate budgets. See console for details.', variant: 'destructive' });
      console.error('Batch recalculation error:', err);
    } finally {
      setRecalcLoading(false);
    }
  };

  return (
    <>
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
              </div>

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
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">{t('settings.themeColors')}</h3>
              
              {/* Theme Selector */}
              <ThemeSelector />
              
              {/* Color Scheme Preview */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Brand Colors</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Primary</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={brandColors.primary}
                        onChange={(e) => setBrandColors({ primary: e.target.value })}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={brandColors.primary}
                        onChange={(e) => setBrandColors({ primary: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Accent</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={brandColors.accent}
                        onChange={(e) => setBrandColors({ accent: e.target.value })}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={brandColors.accent}
                        onChange={(e) => setBrandColors({ accent: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Secondary</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={brandColors.secondary}
                        onChange={(e) => setBrandColors({ secondary: e.target.value })}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={brandColors.secondary}
                        onChange={(e) => setBrandColors({ secondary: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 rounded-full bg-primary border" />
                    <div className="w-6 h-6 rounded-full bg-accent border" />
                    <div className="w-6 h-6 rounded-full bg-secondary border" />
                  </div>
                  <Button variant="outline" onClick={resetBrandColors}>Reset Colors</Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Localization */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">{t('settings.localization')}</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t('settings.language')}</Label>
                  <LanguageSelector />
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.dateFormat')}</Label>
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

      {/* Maintenance/Advanced Section */}
      {(userRole === 'owner' || userRole === 'admin') && (
        <div className="pt-6 mt-6 border-t">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" /> Maintenance
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use these tools for troubleshooting or after bulk data changes. Normally, you do not need to use them.
          </p>
          <Button variant="outline" onClick={handleRecalculateBudgets} disabled={recalcLoading}>
            {recalcLoading ? 'Recalculating Budgets...' : 'Recalculate Budgets'}
          </Button>
        </div>
      )}
    </>
  );
}