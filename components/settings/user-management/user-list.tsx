'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal,
  Edit,
  Settings,
  UserMinus,
  UserCheck,
  Crown,
  Shield,
  Key,
  Mail,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { PermissionsSummary } from './permissions/permissions-summary';

interface UserItem {
  user: any;
  role: string;
  joinedAt: any;
  workspaceId: string;
  isFromCurrentWorkspace: boolean;
}

interface UserListProps {
  filteredUsers: UserItem[];
  loading: boolean;
  isOwner: boolean;
  permissions: any;
  currentWorkspace: any;
  searchTerm: string;
  roleFilter: string;
  statusFilter: string;
  onChangeRole: (user: UserItem) => void;
  onEditUser: (user: UserItem) => void;
  onUserSettings: (user: UserItem) => void;
  onOpenPermissions?: (user: UserItem) => void;
}

export function UserList({
  filteredUsers,
  loading,
  isOwner,
  permissions,
  currentWorkspace,
  searchTerm,
  roleFilter,
  statusFilter,
  onChangeRole,
  onEditUser,
  onUserSettings,
  onOpenPermissions
}: UserListProps) {
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />;
      case 'admin':
        return <UserCheck className="h-3 w-3" />;
      case 'member':
        return <UserCheck className="h-3 w-3" />;
      default:
        return <UserCheck className="h-3 w-3" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      default:
        return <AlertCircle className="h-3 w-3 text-gray-500" />;
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString();
  };

  const getUserInitials = (user: any) => {
    const firstName = user.firstName || user.name?.split(' ')[0] || '';
    const lastName = user.lastName || user.name?.split(' ')[1] || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Sort users: owner > admin > member
  const roleOrder: Record<'owner' | 'admin' | 'member', number> = { owner: 0, admin: 1, member: 2 };
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    return roleOrder[a.role as 'owner' | 'admin' | 'member'] - roleOrder[b.role as 'owner' | 'admin' | 'member'];
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Loading users...</span>
        </div>
      </div>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <UserCheck className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">No users found</h3>
          <p className="text-muted-foreground">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'No users have been added to this workspace yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedUsers.map((userItem) => {
        const user = userItem.user;
        const isFromOtherWorkspace = !userItem.isFromCurrentWorkspace;
        const isOwner = userItem.role === 'owner';
        
        return (
          <Card 
            key={user.id} 
            className={`card-interactive rounded-xl ${
              isOwner ? 'border-2 border-yellow-400 bg-yellow-900/10 shadow-lg' : ''
            } ${isFromOtherWorkspace ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
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
                        <span className="inline-flex items-center px-3 py-1 rounded-full border border-yellow-400 bg-yellow-900/80 text-yellow-400 text-sm font-semibold ml-1">
                          <Crown className="h-4 w-4 mr-1 text-yellow-400" />
                          Owner
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => onEditUser(userItem)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </DropdownMenuItem>
                    
                    {permissions?.canManageUsers && (
                      <DropdownMenuItem onClick={() => onChangeRole(userItem)}>
                        <Crown className="h-4 w-4 mr-2" />
                        Change Role
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem onClick={() => onUserSettings(userItem)}>
                      <Settings className="h-4 w-4 mr-2" />
                      User Settings
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {onOpenPermissions && permissions?.canManagePermissions && (
                      <DropdownMenuItem onClick={() => onOpenPermissions(userItem)}>
                        <Shield className="h-4 w-4 mr-2" />
                        <div className="flex flex-col">
                          <span>Permissions & Privileges</span>
                          <span className="text-xs text-muted-foreground">Manage granular permissions</span>
                        </div>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Message
                    </DropdownMenuItem>
                    
                    {permissions?.canManageUsers && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600">
                          <UserMinus className="h-4 w-4 mr-2" />
                          Deactivate User
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={`text-xs ${getRoleBadgeColor(userItem.role)}`}>
                  {getRoleIcon(userItem.role)}
                  <span className="ml-1 capitalize">{userItem.role}</span>
                </Badge>
                
                <div className="flex items-center space-x-1">
                  {getStatusIcon(user.status || 'active')}
                  <span className="text-xs text-muted-foreground capitalize">
                    {user.status || 'active'}
                  </span>
                </div>
              </div>
              
              {onOpenPermissions && permissions?.canManagePermissions && (
                <PermissionsSummary
                  userId={user.id}
                  workspaceId={currentWorkspace?.id || ''}
                  userName={user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                  userRole={userItem.role}
                  // onOpenPermissions removed, not in props
                />
              )}
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Joined:</span>
                  <span>{formatDate(userItem.joinedAt)}</span>
                </div>
                
                {user.jobTitle && (
                  <div className="flex items-center justify-between">
                    <span>Position:</span>
                    <span className="truncate ml-2">{user.jobTitle}</span>
                  </div>
                )}
                
                {user.department && user.department !== 'none' && (
                  <div className="flex items-center justify-between">
                    <span>Department:</span>
                    <span className="truncate ml-2">{user.department}</span>
                  </div>
                )}
                
                {isFromOtherWorkspace && (
                  <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                    <span>Workspace:</span>
                    <span className="truncate ml-2">{user.workspaceId}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 