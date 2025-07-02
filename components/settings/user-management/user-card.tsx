'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Crown, Shield, Edit, Settings } from 'lucide-react';

interface UserItem {
  user: any;
  role: string;
  joinedAt: any;
  workspaceId: string;
  isFromCurrentWorkspace: boolean;
}

interface UserCardProps {
  userItem: UserItem;
  isOwner: boolean;
  permissions: any;
  currentWorkspace: any;
  onChangeRole: (userItem: UserItem) => void;
  onEditUser: (userItem: UserItem) => void;
  onUserSettings: (userItem: UserItem) => void;
  isOwnerCard?: boolean;
}

export function UserCard({
  userItem,
  isOwner,
  permissions,
  currentWorkspace,
  onChangeRole,
  onEditUser,
  onUserSettings,
  isOwnerCard = false,
}: UserCardProps) {
  const { user, role } = userItem;

  // Helper function to get role badge styling
  const getRoleBadgeStyle = (role: string) => {
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

  // Get card border style based on role
  const getCardBorderStyle = (role: string) => {
    switch (role) {
      case 'owner':
        return 'border-2 border-yellow-200 dark:border-yellow-800/50 bg-gradient-to-br from-yellow-50/50 to-amber-50/30 dark:from-yellow-900/10 dark:to-amber-900/5';
      case 'admin':
        return 'border-blue-200 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-900/5';
      case 'member':
        return 'border-gray-200 dark:border-gray-800/50 bg-gray-50/30 dark:bg-gray-900/5';
      default:
        return 'border-border/30';
    }
  };

  return (
    <Card className={`card-interactive border ${getCardBorderStyle(role)}`}>
      <CardHeader className={isOwnerCard ? "p-4 pb-3" : "p-3 pb-2"}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className={`${isOwnerCard ? 'h-10 w-10' : 'h-8 w-8'} flex-shrink-0 ${role === 'owner' && isOwnerCard ? 'ring-2 ring-yellow-200 dark:ring-yellow-800' : ''}`}>
              <AvatarFallback className={`${role === 'owner' && isOwnerCard ? 'bg-gradient-to-br from-yellow-500 to-amber-500 text-white text-sm font-semibold' : 'bg-gradient-to-br from-primary to-accent text-white text-xs'}`}>
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`font-${isOwnerCard ? 'semibold text-base' : 'medium text-sm'} truncate`}>
                  {user.name}
                </h3>
                {role === 'owner' && <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
              </div>
              <p className={`${isOwnerCard ? 'text-sm' : 'text-xs'} text-muted-foreground truncate`}>
                {user.email}
              </p>
              {user.jobTitle && (
                <p className="text-xs text-muted-foreground truncate">{user.jobTitle}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={`text-xs px-2 py-1 ${getRoleBadgeStyle(role)} ${isOwnerCard ? 'font-medium' : ''}`}>
              {role}
            </Badge>
            {isOwner && currentWorkspace?.workspaceType === 'main' && !userItem.isFromCurrentWorkspace && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-muted">
                Other
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={isOwnerCard ? "p-4 pt-1" : "p-3 pt-1"}>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0.5">
              {user.status}
            </Badge>
          </div>
          
          {isOwner && currentWorkspace?.workspaceType === 'main' && (
            <div className="text-xs text-muted-foreground">
              <span>WS: </span>
              <span className="font-medium">
                {userItem.isFromCurrentWorkspace ? 'Current' : user.workspaceId?.slice(-8) || 'Unknown'}
              </span>
            </div>
          )}
          
          {userItem.joinedAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Joined: {new Date(userItem.joinedAt.toDate?.() || userItem.joinedAt).toLocaleDateString()}</span>
            </div>
          )}

          <div className={`flex gap-1 pt-2 border-t ${role === 'owner' && isOwnerCard ? 'border-yellow-200 dark:border-yellow-800/50' : 'border-border'}`}>
            {(isOwner || (permissions.canAssignUserRoles && role !== 'owner')) && (
              <Button 
                variant="outline" 
                size="sm" 
                className={`flex-1 h-7 text-xs px-2 ${role === 'owner' && isOwnerCard ? 'border-yellow-200 hover:bg-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-900/20' : ''}`}
                onClick={() => onChangeRole(userItem)}
              >
                <Shield className="h-3 w-3 mr-1" />
                Role
              </Button>
            )}
            <TooltipProvider>
              {!isOwner && role === 'owner' ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={true}
                      className={`flex-1 h-7 text-xs px-2 opacity-50 cursor-not-allowed`}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Only owners can edit owner profiles</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`flex-1 h-7 text-xs px-2 ${role === 'owner' && isOwnerCard ? 'border-yellow-200 hover:bg-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-900/20' : ''}`}
                  onClick={() => onEditUser(userItem)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
              
              {!isOwner && role === 'owner' ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={true}
                      className={`flex-1 h-7 text-xs px-2 opacity-50 cursor-not-allowed`}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      More
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Only owners can manage owner profiles</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`flex-1 h-7 text-xs px-2 ${role === 'owner' && isOwnerCard ? 'border-yellow-200 hover:bg-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-900/20' : ''}`}
                  onClick={() => onUserSettings(userItem)}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  More
                </Button>
              )}
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 