'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Building2,
  Users,
  Settings,
  Edit,
  Trash2,
  Phone,
  Mail,
  Eye
} from 'lucide-react';
import { Branch, User, Team } from '@/lib/types';
import { useRolePermissions, useIsOwner } from '@/lib/rbac-hooks'; // Import RBAC hooks

interface BranchCardProps {
  branch: Branch;
  getRegionName: (regionId: string) => string;
  getManagerName: (managerId: string) => string;
  users: User[];
  teams: Team[];
  viewBranchDetails: (branch: Branch) => void;
  startEditBranch: (branch: Branch) => void;
  handleDeleteBranch: (branch: Branch) => void;
  isOwner: ReturnType<typeof useIsOwner>;
  canManageBranches: ReturnType<typeof useRolePermissions>['canManageBranches'];
}

export function BranchCard({
  branch,
  getRegionName,
  getManagerName,
  users,
  teams,
  viewBranchDetails,
  startEditBranch,
  handleDeleteBranch,
  isOwner,
  canManageBranches,
}: BranchCardProps) {
  return (
    <Card className="card-interactive border border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <Badge className={`${
              branch.status === 'active'
                ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
            }`}>
              {branch.status}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => viewBranchDetails(branch)}
              className="h-8 w-8 p-0"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {(isOwner || canManageBranches) && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditBranch(branch)}
                  className="h-8 w-8 p-0"
                  title="Edit Branch"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteBranch(branch)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  title="Delete Branch"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        <div>
          <CardTitle className="text-lg">{branch.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{getRegionName(branch.regionId)}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {branch.description || 'No description available'}
        </p>                  
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{users.filter(u => u.branchId === branch.id).length} users</span>
          </div>
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Settings className="h-4 w-4" />
            <span>{teams.filter(t => t.branchId === branch.id).length} teams</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {getManagerName(branch.managerId || '').charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {getManagerName(branch.managerId || '')}
          </span>
        </div>

        {branch.contact && (
          <div className="space-y-1">
            {branch.contact.phone && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{branch.contact.phone}</span>
              </div>
            )}
            {branch.contact.email && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{branch.contact.email}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}