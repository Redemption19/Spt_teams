import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Key, Users, Settings, Calendar, FileText, FolderOpen, BarChart3, Building2, MapPin, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PermissionsService, PermissionCategory, UserPermission } from '@/lib/permissions-service';

interface PermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  workspaceId: string;
  workspaceName: string;
  currentUserRole: string;
}

export function PermissionsDialog({
  isOpen,
  onClose,
  userId,
  userName,
  workspaceId,
  workspaceName,
  currentUserRole
}: PermissionsDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userPermissions, setUserPermissions] = useState<UserPermission | null>(null);
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState('user-management');

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      
      const [permissions, categories] = await Promise.all([
        PermissionsService.getUserPermissions(userId, workspaceId),
        PermissionsService.getPermissionCategories()
      ]);
      
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
      
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load permissions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, workspaceId, toast]);

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen, userId, workspaceId, loadPermissions]);

  const handlePermissionChange = (permissionId: string, granted: boolean) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permissionId]: granted
    }));
  };

  const handleSavePermissions = async () => {
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
            grantedBy: 'current-user' // Replace with actual current user ID
          };
        }
      });
      
      if (Object.keys(permissionUpdates).length > 0) {
        await PermissionsService.updateUserPermissions(
          userId,
          workspaceId,
          permissionUpdates,
          'current-user' // Replace with actual current user ID
        );
        
        toast({
          title: 'Permissions Updated',
          description: `Permissions for ${userName} have been updated successfully.`,
        });
        
        // Reload permissions to get updated data
        await loadPermissions();
      }
      
      onClose();
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
      'system': Settings
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Permissions & Privileges</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading permissions...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Info */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <UserCheck className="h-5 w-5" />
                  <span>{userName}</span>
                  <Badge variant="outline">{currentUserRole}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Workspace: {workspaceName}
                </p>
              </CardHeader>
            </Card>

            {/* Permission Categories */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                {permissionCategories.map(category => {
                  const Icon = getCategoryIcon(category.id);
                  const grantedCount = getPermissionCount(category.id);
                  const totalCount = getTotalPermissions(category.id);
                  
                  return (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      className="flex flex-col items-center space-y-1 p-3"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{category.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {grantedCount}/{totalCount}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {permissionCategories.map(category => (
                <TabsContent key={category.id} value={category.id} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                    </div>

                    {category.features.map(feature => (
                      <Card key={feature.id} className="border">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{feature.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {feature.permissions.map(permission => (
                              <div key={permission.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                                <Checkbox
                                  id={permission.id}
                                  checked={selectedPermissions[permission.id] || false}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(permission.id, checked as boolean)
                                  }
                                />
                                <div className="flex-1">
                                  <Label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                                    {permission.name}
                                  </Label>
                                  <p className="text-xs text-muted-foreground mt-1">
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

            {/* Summary */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="h-4 w-4" />
                    <span className="text-sm font-medium">Permission Summary</span>
                  </div>
                  <Badge variant="outline">
                    {Object.values(selectedPermissions).filter(Boolean).length} permissions granted
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSavePermissions} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Permissions'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 