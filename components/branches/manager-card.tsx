'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Building2,
  Mail,
  Phone,
  Edit,
  Trash2
} from 'lucide-react';
import { User } from '@/lib/types';
import { useRolePermissions, useIsOwner } from '@/lib/rbac-hooks'; // Import RBAC hooks

interface ManagerCardProps {
  manager: User;
  handleEmailManager: (manager: User) => void;
  startEditManager: (manager: User) => void;
  handleDeleteManager: (manager: User) => void;
  isOwner: ReturnType<typeof useIsOwner>;
  canManageBranches: ReturnType<typeof useRolePermissions>['canManageBranches'];
}

export function ManagerCard({
  manager,
  handleEmailManager,
  startEditManager,
  handleDeleteManager,
  isOwner,
  canManageBranches,
}: ManagerCardProps) {
  // Helper function to get role badge styling
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'team_lead':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      case 'manager':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  // Helper function to get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'team_lead':
        return 'Team Lead';
      case 'manager':
        return 'Manager';
      default:
        return role;
    }
  };

  // Get border color based on role
  const getCardBorderStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'border-blue-200 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-900/5';
      case 'team_lead':
        return 'border-purple-200 dark:border-purple-800/50 bg-purple-50/30 dark:bg-purple-900/5';
      case 'manager':
        return 'border-orange-200 dark:border-orange-800/50 bg-orange-50/30 dark:bg-orange-900/5';
      default:
        return 'border-border/30';
    }
  };

  return (
    <Card key={manager.id} className={`border ${getCardBorderStyle(manager.role || 'member')}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                {manager.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{manager.name}</h4>
              <p className="text-sm text-muted-foreground">{manager.jobTitle || 'Manager'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {/* Email button for all users */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEmailManager(manager)}
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
              title="Send Email"
            >
              <Mail className="h-4 w-4" />
            </Button>
            {/* Edit/Delete buttons only for owners and admins */}
            {(isOwner || canManageBranches) && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditManager(manager)}
                  className="h-8 w-8 p-0"
                  title="Edit Manager"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteManager(manager)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  title="Delete Manager"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{manager.email}</span>
          </div>
          {manager.phone && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{manager.phone}</span>
            </div>
          )}
          {manager.department && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{manager.department}</span>
            </div>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <div className="space-y-1">
            {/* Workspace Role Badge */}
            {manager.role && (
              <Badge className={getRoleBadgeStyle(manager.role)}>
                {getRoleDisplayName(manager.role)}
              </Badge>
            )}
            {/* Global Role Badge (if different from workspace role) */}
            {manager.role && manager.role !== manager.role && (
              <Badge variant="outline" className="ml-2 text-xs">
                Global: {manager.role}
              </Badge>
            )}
          </div>
          {/* Status Badge */}
          <Badge className={`${
            manager.status === 'active'
              ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
              : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
          }`}>
            {manager.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}