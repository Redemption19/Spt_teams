'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, ArrowLeft, Save, Loader2, AlertTriangle, Shield, Users, Bell, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { DepartmentService, type Department } from '@/lib/department-service';

interface DepartmentSettings {
  notifications: {
    budgetAlerts: boolean;
    performanceReports: boolean;
    memberUpdates: boolean;
    weeklyDigest: boolean;
  };
  permissions: {
    allowMemberSelfAssignment: boolean;
    requireApprovalForBudgetChanges: boolean;
    allowPublicVisibility: boolean;
  };
  automation: {
    autoGenerateReports: boolean;
    autoAssignTasks: boolean;
    budgetWarningThreshold: number;
  };
}

export default function DepartmentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const { userProfile } = useAuth();
  
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<DepartmentSettings>({
    notifications: {
      budgetAlerts: true,
      performanceReports: true,
      memberUpdates: false,
      weeklyDigest: true,
    },
    permissions: {
      allowMemberSelfAssignment: false,
      requireApprovalForBudgetChanges: true,
      allowPublicVisibility: false,
    },
    automation: {
      autoGenerateReports: true,
      autoAssignTasks: false,
      budgetWarningThreshold: 80,
    },
  });

  const departmentId = params.id as string;

  useEffect(() => {
    const fetchDepartment = async () => {
      // Wait for workspace to load before checking
      if (workspaceLoading) {
        return;
      }
      
      if (!currentWorkspace?.id || !departmentId) {
        setError('Missing workspace or department ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const dept = await DepartmentService.getDepartment(currentWorkspace.id, departmentId);
        setDepartment(dept);
        // In a real implementation, you would fetch the actual settings from the backend
        // For now, we'll use the default settings
      } catch (err: any) {
        console.error('Error fetching department:', err);
        setError(err.message || 'Failed to load department details');
        toast({
          title: 'Error',
          description: 'Failed to load department details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [currentWorkspace?.id, departmentId, workspaceLoading, toast]);

  const handleNotificationChange = (key: keyof DepartmentSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const handlePermissionChange = (key: keyof DepartmentSettings['permissions'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value,
      },
    }));
  };

  const handleAutomationChange = (key: keyof DepartmentSettings['automation'], value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      automation: {
        ...prev.automation,
        [key]: value,
      },
    }));
  };

  const handleSaveSettings = async () => {
    if (!currentWorkspace?.id || !userProfile?.id || !department) {
      toast({
        title: 'Error',
        description: 'Missing required information for saving settings.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // In a real implementation, you would save the settings to the backend
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Success',
        description: 'Department settings saved successfully.',
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/departments/${departmentId}`);
  };

  if (loading || workspaceLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading department settings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push(`/dashboard/departments/${departmentId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Department
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Error Loading Department</h3>
            <p className="text-muted-foreground mb-4">{error || 'Department not found'}</p>
            <Button onClick={() => router.push('/dashboard/departments')}>
              Back to Departments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Department Settings
            </h1>
            <p className="text-muted-foreground">
              Configure settings for {department.name}
            </p>
          </div>
        </div>
        
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure when and how you receive notifications for this department
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Budget Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when budget thresholds are reached
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.budgetAlerts}
                  onCheckedChange={(checked) => handleNotificationChange('budgetAlerts', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Performance Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Get monthly performance reports for this department
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.performanceReports}
                  onCheckedChange={(checked) => handleNotificationChange('performanceReports', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Member Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications when members join or leave the department
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.memberUpdates}
                  onCheckedChange={(checked) => handleNotificationChange('memberUpdates', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of department activities
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.weeklyDigest}
                  onCheckedChange={(checked) => handleNotificationChange('weeklyDigest', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permission Settings
              </CardTitle>
              <CardDescription>
                Control access and permissions for this department
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Allow Member Self-Assignment</Label>
                  <p className="text-sm text-muted-foreground">
                    Let employees assign themselves to this department
                  </p>
                </div>
                <Switch
                  checked={settings.permissions.allowMemberSelfAssignment}
                  onCheckedChange={(checked) => handlePermissionChange('allowMemberSelfAssignment', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Require Approval for Budget Changes</Label>
                  <p className="text-sm text-muted-foreground">
                    Budget modifications require manager approval
                  </p>
                </div>
                <Switch
                  checked={settings.permissions.requireApprovalForBudgetChanges}
                  onCheckedChange={(checked) => handlePermissionChange('requireApprovalForBudgetChanges', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Allow Public Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Make department information visible to all organization members
                  </p>
                </div>
                <Switch
                  checked={settings.permissions.allowPublicVisibility}
                  onCheckedChange={(checked) => handlePermissionChange('allowPublicVisibility', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Automation Settings
              </CardTitle>
              <CardDescription>
                Configure automated processes for this department
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-Generate Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate monthly department reports
                  </p>
                </div>
                <Switch
                  checked={settings.automation.autoGenerateReports}
                  onCheckedChange={(checked) => handleAutomationChange('autoGenerateReports', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-Assign Tasks</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically distribute tasks based on workload
                  </p>
                </div>
                <Switch
                  checked={settings.automation.autoAssignTasks}
                  onCheckedChange={(checked) => handleAutomationChange('autoAssignTasks', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <Label className="text-base">Budget Warning Threshold</Label>
                  <p className="text-sm text-muted-foreground">
                    Send alerts when budget usage reaches this percentage
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.automation.budgetWarningThreshold}
                    onChange={(e) => handleAutomationChange('budgetWarningThreshold', parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}