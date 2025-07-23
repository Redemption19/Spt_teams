'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Shield, 
  Key, 
  Users, 
  Settings, 
  Calendar, 
  FileText, 
  FolderOpen, 
  BarChart3, 
  Building2, 
  UserCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { PermissionsService, PermissionCategory, UserPermission } from '@/lib/permissions-service';
import { UserService } from '@/lib/user-service';

interface ManagePermissionsPageProps {
  params: {
    userId: string;
  };
}

export default function ManagePermissionsPage({ params }: ManagePermissionsPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermission | null>(null);
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState('user-management');
  const [hasChanges, setHasChanges] = useState(false);

  const loadUserAndPermissions = useCallback(async () => {
    if (!currentWorkspace?.id || !params.userId) return;
    
    console.log('🔐 PermissionsManage: Current workspace context:', {
      workspaceId: currentWorkspace?.id,
      workspaceName: currentWorkspace?.name,
      targetUserId: params.userId
    });
    
    try {
      setLoading(true);
      
      const [targetUserData, permissions, categories] = await Promise.all([
        UserService.getUserById(params.userId),
        PermissionsService.getUserPermissions(params.userId, currentWorkspace.id),
        PermissionsService.getPermissionCategories()
      ]);
      
      if (!targetUserData) {
        toast({
          title: 'User Not Found',
          description: 'The specified user could not be found.',
          variant: 'destructive',
        });
        router.push('/dashboard/permissions');
        return;
      }
      
      setTargetUser(targetUserData);
      setUserPermissions(permissions);
      setPermissionCategories(categories);
      
      // Initialize selected permissions
      const initialPermissions: { [key: string]: boolean } = {};
      if (permissions) {
        Object.keys(permissions.permissions).forEach(permissionId => {
          initialPermissions[permissionId] = permissions.permissions[permissionId].granted;
        });
      }
      setSelectedPermissions(initialPermissions);
      
      // Set default active tab based on available categories
      if (categories.length > 0) {
        setActiveTab(categories[0].id);
      }
      
    } catch (error) {
      console.error('Error loading user and permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user permissions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, currentWorkspace?.name, params.userId, toast, router]);

  useEffect(() => {
    loadUserAndPermissions();
  }, [loadUserAndPermissions]);

  const handlePermissionChange = (permissionId: string, granted: boolean) => {
    setSelectedPermissions(prev => {
      const newPermissions = {
        ...prev,
        [permissionId]: granted
      };
      
      // Check if there are changes from original permissions
      const originalGranted = userPermissions?.permissions[permissionId]?.granted || false;
      const hasChangesNow = Object.keys(newPermissions).some(id => {
        const original = userPermissions?.permissions[id]?.granted || false;
        return original !== newPermissions[id];
      });
      setHasChanges(hasChangesNow);
      
      return newPermissions;
    });
  };

  const handleSavePermissions = async () => {
    if (!currentWorkspace?.id || !user?.uid) return;
    
    try {
      setSaving(true);
      
      const permissionUpdates: { [key: string]: { granted: boolean; grantedBy: string } } = {};
      
      // Only update permissions that have changed
      Object.keys(selectedPermissions).forEach(permissionId => {
        const currentGranted = userPermissions?.permissions[permissionId]?.granted || false;
        const newGranted = selectedPermissions[permissionId];
        
        if (currentGranted !== newGranted) {
          permissionUpdates[permissionId] = {
            granted: newGranted,
            grantedBy: user.uid
          };
        }
      });
      
      if (Object.keys(permissionUpdates).length > 0) {
        await PermissionsService.updateUserPermissions(
          params.userId,
          currentWorkspace.id,
          permissionUpdates,
          user.uid
        );
        
        toast({
          title: 'Permissions Updated',
          description: `Permissions for ${targetUser?.name || 'user'} have been updated successfully.`,
        });
        
        // Reload permissions to get updated data
        await loadUserAndPermissions();
        setHasChanges(false);
      } else {
        toast({
          title: 'No Changes',
          description: 'No permission changes were made.',
        });
      }
      
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to save permissions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const icons: { [key: string]: any } = {
      'user-management': Users,
      'workspace-management': Building2,
      'project-management': FileText,
      'team-management': UserCheck,
      'organization-management': Building2,
      'content-management': FolderOpen,
      'reporting': BarChart3,
      'communication': Calendar,
      'system': Settings,
      'financial-management': BarChart3
    };
    return icons[categoryId] || Settings;
  };

  const getPermissionCount = (categoryId: string) => {
    const category = permissionCategories.find(c => c.id === categoryId);
    if (!category) return 0;
    
    let count = 0;
    category.features.forEach(feature => {
      feature.permissions.forEach(permission => {
        if (selectedPermissions[permission.id]) {
          count++;
        }
      });
    });
    
    return count;
  };

  const getTotalPermissions = (categoryId: string) => {
    const category = permissionCategories.find(c => c.id === categoryId);
    if (!category) return 0;
    
    let total = 0;
    category.features.forEach(feature => {
      total += feature.permissions.length;
    });
    
    return total;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">Loading permissions...</span>
        </div>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold">User Not Found</h2>
          <p className="text-muted-foreground">The specified user could not be found.</p>
          <Button onClick={() => router.push('/dashboard/permissions')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Permissions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/permissions')}
                className="shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold">Manage Permissions</h1>
                </div>
                <p className="text-muted-foreground mt-1">
                  Configure access controls for {targetUser.name || `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Unsaved Changes
                </Badge>
              )}
              <Button
                onClick={handleSavePermissions}
                disabled={saving || !hasChanges}
                className="bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* User Info Card */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserCheck className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-xl">
                    {targetUser.name || `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim()}
                  </CardTitle>
                  <p className="text-muted-foreground">{targetUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline">{targetUser.role || 'member'}</Badge>
                    <Badge variant="secondary">
                      Workspace: {currentWorkspace?.name}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Permission Summary</span>
                </div>
                <Badge variant="outline" className="mt-1">
                  {Object.values(selectedPermissions).filter(Boolean).length} permissions granted
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Permission Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Categories</CardTitle>
            <p className="text-muted-foreground">
              Configure specific permissions by category. Changes are automatically tracked.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 h-auto p-1">
                {permissionCategories.map(category => {
                  const Icon = getCategoryIcon(category.id);
                  const grantedCount = getPermissionCount(category.id);
                  const totalCount = getTotalPermissions(category.id);
                  const progress = totalCount > 0 ? (grantedCount / totalCount) * 100 : 0;
                  
                  return (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      className="flex flex-col items-center space-y-2 p-4 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium text-center leading-tight">
                        {category.name}
                      </span>
                      <div className="space-y-1">
                        <Badge 
                          variant={progress > 0 ? "default" : "secondary"} 
                          className="text-xs"
                        >
                          {grantedCount}/{totalCount}
                        </Badge>
                        <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-current transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {permissionCategories.map(category => (
                <TabsContent key={category.id} value={category.id} className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center space-x-2">
                      {getCategoryIcon(category.id) && (
                        <span className="p-2 bg-primary/10 rounded-lg">
                          {React.createElement(getCategoryIcon(category.id), { className: "h-5 w-5 text-primary" })}
                        </span>
                      )}
                      <span>{category.name}</span>
                    </h3>
                    <p className="text-muted-foreground">{category.description}</p>
                  </div>

                  <div className="grid gap-6">
                    {category.features.map(feature => (
                      <Card key={feature.id} className="border-l-2 border-l-muted">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg">{feature.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {feature.permissions.map(permission => (
                              <div 
                                key={permission.id} 
                                className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <Checkbox
                                  id={permission.id}
                                  checked={selectedPermissions[permission.id] || false}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(permission.id, checked as boolean)
                                  }
                                  className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <Label 
                                    htmlFor={permission.id} 
                                    className="text-sm font-medium cursor-pointer block mb-1"
                                  >
                                    {permission.name}
                                  </Label>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Save Reminder */}
        {hasChanges && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              You have unsaved changes. Don&#39;t forget to save your permission updates.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
} 