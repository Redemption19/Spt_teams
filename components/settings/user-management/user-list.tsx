'use client';

import { Badge } from '@/components/ui/badge';
import { Users, Crown, Loader2 } from 'lucide-react';
import { UserCard } from './user-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader } from '@/components/ui/card';

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
  onChangeRole: (userItem: UserItem) => void;
  onEditUser: (userItem: UserItem) => void;
  onUserSettings: (userItem: UserItem) => void;
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
}: UserListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="card-interactive">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-12" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 space-y-2">
        <Users className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No users found</p>
        <p className="text-sm text-muted-foreground">
          {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
            ? 'No users match your current filters'
            : 'No users are added to this workspace yet'}
        </p>
      </div>
    );
  }

  const owners = filteredUsers.filter(userItem => userItem.role === 'owner');
  const nonOwners = filteredUsers.filter(userItem => userItem.role !== 'owner');
  const admins = nonOwners.filter(userItem => userItem.role === 'admin');
  const members = nonOwners.filter(userItem => userItem.role === 'member');

  return (
    <div className="space-y-6">
      {/* Workspace Ownership Section */}
      {owners.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-foreground">Workspace Ownership</h3>
            <Badge variant="outline" className="text-xs">
              {owners.length} Owner{owners.length > 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {owners.map((userItem) => (
              <UserCard
                key={userItem.user.id}
                userItem={userItem}
                isOwner={isOwner}
                permissions={permissions}
                currentWorkspace={currentWorkspace}
                onChangeRole={onChangeRole}
                onEditUser={onEditUser}
                onUserSettings={onUserSettings}
                isOwnerCard={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Team Members Section */}
      {nonOwners.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Team Members</h3>
              <Badge variant="outline" className="text-xs">
                {admins.length} Admin{admins.length !== 1 ? 's' : ''} • {members.length} Member{members.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {nonOwners.map((userItem) => (
              <UserCard
                key={userItem.user.id}
                userItem={userItem}
                isOwner={isOwner}
                permissions={permissions}
                currentWorkspace={currentWorkspace}
                onChangeRole={onChangeRole}
                onEditUser={onEditUser}
                onUserSettings={onUserSettings}
                isOwnerCard={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* No team members message when only owners exist */}
      {owners.length > 0 && nonOwners.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-1">No team members found</p>
          <p className="text-xs text-muted-foreground">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
              ? 'Try adjusting your search filters' 
              : 'Invite users to get started'
            }
          </p>
        </div>
      )}
    </div>
  );
} 