'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Shield, 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Settings, 
  UserCheck, 
  Crown,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions, useIsOwner } from '@/lib/rbac-hooks';
import { UserService } from '@/lib/user-service';
import { PermissionsService } from '@/lib/permissions-service';

import { PermissionsSummary } from '@/components/settings/user-management/permissions/permissions-summary';
import { PermissionsTemplates } from '@/components/settings/user-management/permissions/permissions-templates';

interface UserItem {
  user: any;
  role: string;
  joinedAt: any;
  workspaceId: string;
  isFromCurrentWorkspace: boolean;
}

export default function PermissionsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  const permissions = useRolePermissions();
  const isOwner = useIsOwner();
  
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all-users');
  
  // Permissions dialog states  
  const [isPermissionsTemplatesOpen, setIsPermissionsTemplatesOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserItem | null>(null);

  // Load users
  const loadUsers: () => Promise<void> = useCallback(async () => {
    try {
      setLoading(true);
      
      const isMainWorkspaceOwner = isOwner && currentWorkspace?.workspaceType === 'main';
      
      const users = isMainWorkspaceOwner 
        ? await UserService.getAllUsers()
        : await UserService.getUsersByWorkspace(currentWorkspace!.id);
      
      const formattedUsers = users.map(user => ({
        user,
        role: user.role || 'member',
        joinedAt: user.createdAt,
        workspaceId: user.workspaceId,
        isFromCurrentWorkspace: user.workspaceId === currentWorkspace?.id
      }));
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, isOwner, toast]);

  useEffect(() => {
    if (currentWorkspace?.id && user?.uid) {
      loadUsers();
    }
  }, [loadUsers, currentWorkspace?.id, user?.uid]);

  const handleOpenPermissionsTemplates = (userItem?: UserItem) => {
    if (!userItem && !selectedUserForPermissions) {
      toast({
        title: 'No User Selected',
        description: 'Please select a user before applying a permission template.',
        variant: 'destructive',
      });
      return;
    }
    if (userItem) {
      setSelectedUserForPermissions(userItem);
    }
    setIsPermissionsTemplatesOpen(true);
  };

  const handleApplyPermissionTemplate = async (template: any) => {
    // Debug: Log all relevant state before guard clause
    console.log('DEBUG handleApplyPermissionTemplate:', {
      selectedUserForPermissions,
      user,
      currentWorkspace,
      validWorkspaceIds,
      template
    });
    if (
      !selectedUserForPermissions ||
      !user?.uid ||
      !currentWorkspace?.id
    ) {
      toast({
        title: 'Error',
        description: 'Missing user or workspace information.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Build permissions object from template
      const permissionsObj: { [key: string]: { granted: boolean; grantedBy: string } } = {};
      template.permissions.forEach((permId: string) => {
        permissionsObj[permId] = { granted: true, grantedBy: user.uid };
      });

      await PermissionsService.setUserPermissions(
        selectedUserForPermissions.user.id,
        selectedUserForPermissions.workspaceId, // Use the user's workspaceId for cross-workspace management
        permissionsObj,
        user.uid
      );

      toast({
        title: 'Template Applied',
        description: `${template.name} template applied to ${selectedUserForPermissions.user.name}`,
      });

      loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to apply template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(userItem => {
    const user = userItem.user;
    const role = userItem.role;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Role filter
    if (roleFilter !== 'all' && role !== roleFilter) {
      return false;
    }
    
    return true;
  });

  // Sort users: owner > admin > member
  const roleOrder: Record<'owner' | 'admin' | 'member', number> = { owner: 0, admin: 1, member: 2 };
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    return roleOrder[a.role as 'owner' | 'admin' | 'member'] - roleOrder[b.role as 'owner' | 'admin' | 'member'];
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'member':
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const getUserInitials = (user: any) => {
    const firstName = user.firstName || user.name?.split(' ')[0] || '';
    const lastName = user.lastName || user.name?.split(' ')[1] || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get all valid workspace IDs
  const validWorkspaceIds = accessibleWorkspaces.map(w => w.id);

  if (!permissions?.canAssignUserRoles) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Permissions & Privileges
            </h1>
            <p className="text-muted-foreground mt-1">Manage user permissions and access controls</p>
          </div>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don&apos;t have permission to manage user permissions. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Permissions & Privileges
          </h1>
          <p className="text-muted-foreground mt-1">Manage user permissions and access controls</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => handleOpenPermissionsTemplates()}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <Shield className="h-4 w-4 mr-2" />
            Permission Templates
          </Button>
        </div>
      </div>

      {/* System Banner */}
      {isOwner && currentWorkspace?.workspaceType === 'main' && (
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertDescription>
            You&apos;re managing permissions for ALL users across the entire system. Users from different workspaces are highlighted.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Users</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-users">All Users ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="owners">Owners ({filteredUsers.filter(u => u.role === 'owner').length})</TabsTrigger>
          <TabsTrigger value="admins">Admins ({filteredUsers.filter(u => u.role === 'admin').length})</TabsTrigger>
          <TabsTrigger value="members">Members ({filteredUsers.filter(u => u.role === 'member').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all-users" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Shield className="h-12 w-12 text-muted-foreground" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">No users found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || roleFilter !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'No users are available for permission management.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedUsers.map((userItem) => {
                const user = userItem.user;
                const isFromOtherWorkspace = !userItem.isFromCurrentWorkspace;
                const isWorkspaceValid = validWorkspaceIds.includes(userItem.workspaceId);
                const isOwner = userItem.role === 'owner';
                
                return (
                  <Card 
                    key={user.id} 
                    className={`card-interactive rounded-xl ${
                      isOwner ? 'border-2 border-yellow-400 bg-yellow-900/10 shadow-lg' : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-white">
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate flex items-center space-x-2">
                              <span>{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'}</span>
                              {isOwner && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold ml-1">
                                  <Crown className="h-4 w-4 mr-1 text-yellow-700" /> Owner
                                </span>
                              )}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={`text-xs ${getRoleBadgeColor(userItem.role)}`}>
                          <UserCheck className="h-3 w-3 mr-1" />
                          <span className="capitalize">{userItem.role}</span>
                        </Badge>
                        
                        {isFromOtherWorkspace && (
                          <Badge variant="outline" className="text-xs text-blue-600">
                            Other Workspace
                          </Badge>
                        )}
                      </div>
                      
                      {/* Use the PermissionsSummary component here */}
                      <PermissionsSummary
                        userId={user.id}
                        workspaceId={userItem.workspaceId}
                        userName={user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                        userRole={userItem.role}
                        disabled={!isWorkspaceValid}
                      />
                      
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Joined:</span>
                          <span>{new Date(userItem.joinedAt).toLocaleDateString()}</span>
                        </div>
                        
                        {user.jobTitle && (
                          <div className="flex items-center justify-between">
                            <span>Position:</span>
                            <span className="truncate ml-2">{user.jobTitle}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Other tabs with filtered content */}
        <TabsContent value="owners" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.filter(u => u.role === 'owner').map((userItem) => {
              const user = userItem.user;
              return (
                <Card key={user.id} className="card-interactive">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-white">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PermissionsSummary
                      userId={user.id}
                      workspaceId={currentWorkspace?.id || ''}
                      userName={user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                      userRole={userItem.role}
                      disabled={true} // No direct permission management from here
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.filter(u => u.role === 'admin').map((userItem) => {
              const user = userItem.user;
              return (
                <Card key={user.id} className="card-interactive">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-white">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PermissionsSummary
                      userId={user.id}
                      workspaceId={currentWorkspace?.id || ''}
                      userName={user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                      userRole={userItem.role}
                      disabled={true} // No direct permission management from here
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.filter(u => u.role === 'member').map((userItem) => {
              const user = userItem.user;
              return (
                <Card key={user.id} className="card-interactive">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-white">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PermissionsSummary
                      userId={user.id}
                      workspaceId={currentWorkspace?.id || ''}
                      userName={user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                      userRole={userItem.role}
                      disabled={true} // No direct permission management from here
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>



      <PermissionsTemplates
        isOpen={isPermissionsTemplatesOpen}
        onClose={() => setIsPermissionsTemplatesOpen(false)}
        onApplyTemplate={handleApplyPermissionTemplate}
        currentPermissions={{}}
      />
    </div>
  );
} 