"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, ArrowLeft } from 'lucide-react';
import { UserService } from '@/lib/user-service';
import { PermissionsService, PermissionCategory, UserPermission } from '@/lib/permissions-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { useToast } from '@/hooks/use-toast';

export default function ManagePermissionsPage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const { userId } = params;

  const [user, setUser] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch user, workspace, and permissions data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const userData = await UserService.getUser(userId);
        if (!userData) throw new Error('User not found');
        setUser(userData);
        // Fetch workspace by ID
        const workspaceData = await WorkspaceService.getWorkspace(userData.workspaceId);
        setWorkspace(workspaceData);
        const categories = await PermissionsService.getPermissionCategories();
        setPermissionCategories(categories);
        const permissions = await PermissionsService.getUserPermissions(userId, userData.workspaceId);
        setUserPermissions(permissions);
        // Initialize selected permissions
        const initialPermissions: { [key: string]: boolean } = {};
        if (permissions) {
          Object.keys(permissions.permissions).forEach(permissionId => {
            initialPermissions[permissionId] = permissions.permissions[permissionId].granted;
          });
        }
        setSelectedPermissions(initialPermissions);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  const handlePermissionChange = (permissionId: string, granted: boolean) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permissionId]: granted
    }));
  };

  const handleSave = async () => {
    if (!user || !userPermissions) return;
    setSaving(true);
    try {
      // Get current user ID for grantedBy (replace with your auth context if available)
      const grantedBy = typeof window !== 'undefined' ? localStorage.getItem('currentUserId') || 'system' : 'system';
      const permissionUpdates: { [key: string]: { granted: boolean; grantedBy: string } } = {};
      Object.keys(selectedPermissions).forEach(permissionId => {
        const currentGranted = userPermissions.permissions[permissionId]?.granted || false;
        const newGranted = selectedPermissions[permissionId];
        if (currentGranted !== newGranted) {
          permissionUpdates[permissionId] = {
            granted: newGranted,
            grantedBy,
          };
        }
      });
      if (Object.keys(permissionUpdates).length > 0) {
        await PermissionsService.updateUserPermissions(
          user.id,
          user.workspaceId,
          permissionUpdates,
          grantedBy
        );
        toast({
          title: 'Permissions Updated',
          description: `Permissions for ${user.name} have been updated successfully.`,
        });
        // Reload permissions to get updated data
        const updated = await PermissionsService.getUserPermissions(user.id, user.workspaceId);
        setUserPermissions(updated);
      } else {
        toast({
          title: 'No Changes',
          description: 'No permission changes to save.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save permissions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <span className="text-lg">Loading...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-red-500">{error}</div>
    );
  }
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/dashboard">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/permissions">Permissions & Privileges</Link>
        <span>/</span>
        <span className="text-primary font-semibold">Manage Permissions</span>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>{user.name}</span>
              <span className="text-xs bg-gray-200 dark:bg-gray-800 rounded px-2 py-1 ml-2">{user.role}</span>
            </CardTitle>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            <div className="text-xs mt-1">
              Workspace: {workspace?.name || 'Unknown'} <span className="text-muted-foreground">({user.workspaceId})</span>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard/permissions')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Permissions
          </Button>
        </CardHeader>
      </Card>

      {/* Permissions Sections */}
      <Accordion type="multiple" className="space-y-4">
        {permissionCategories.map(category => (
          <AccordionItem key={category.id} value={category.id}>
            <AccordionTrigger>{category.name}</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.features.map(feature => (
                  <Card key={feature.id}>
                    <CardHeader>
                      <CardTitle>{feature.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {feature.permissions.map(permission => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={!!selectedPermissions[permission.id]}
                              onCheckedChange={checked => handlePermissionChange(permission.id, !!checked)}
                            />
                            <label htmlFor={permission.id} className="text-sm font-medium">
                              {permission.name}
                            </label>
                            <span className="text-xs text-muted-foreground">{permission.description}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-primary to-accent" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
} 