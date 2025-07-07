import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, MoreHorizontal, Edit, Trash2, Eye, UserPlus } from 'lucide-react';
import { type Department } from '@/lib/department-service';
import { type Workspace } from '@/lib/types'; // Assuming Workspace type is available here or passed from parent

interface DepartmentCardProps {
  department: Department;
  isAdminOrOwner: boolean;
  showAllWorkspaces: boolean;
  accessibleWorkspaces: Workspace[] | null;
  isMyDepartment: boolean;
  onViewMembers: (department: Department) => void;
  onAssignMembers: (department: Department) => void;
  onEditDepartment: (department: Department) => void;
  onDeleteDepartment: (department: Department) => void;
}

export function DepartmentCard({
  department,
  isAdminOrOwner,
  showAllWorkspaces,
  accessibleWorkspaces,
  isMyDepartment,
  onViewMembers,
  onAssignMembers,
  onEditDepartment,
  onDeleteDepartment,
}: DepartmentCardProps) {
  return (
    <Card key={department.id} className="card-interactive hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: department.color }}
            />
            <CardTitle className="text-sm sm:text-base md:text-lg truncate">{department.name}</CardTitle>
            {isAdminOrOwner && showAllWorkspaces && accessibleWorkspaces && (
              <Badge
                variant="outline"
                className="ml-1 sm:ml-2 text-2xs sm:text-xs flex items-center gap-1 px-2 py-0.5 whitespace-nowrap max-w-[120px] truncate"
                title={(department as any)._workspaceName}
              >
                <span className="text-blue-400 text-base">🌐</span>
                <span className="truncate">{(department as any)._workspaceName || 'Workspace'}</span>
              </Badge>
            )}
            {!isAdminOrOwner && isMyDepartment && (
              <Badge variant="secondary" className="text-2xs sm:text-xs">
                My Department
              </Badge>
            )}
          </div>
          {isAdminOrOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onViewMembers(department)} className="text-sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAssignMembers(department)} className="text-sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditDepartment(department)} className="text-sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeleteDepartment(department)}
                  className="text-destructive text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 pt-0">
        {department.description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {department.description}
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs sm:text-sm font-medium">{department.memberCount} members</span>
          </div>
          <Badge
            variant={department.status === 'active' ? 'default' : 'secondary'}
            className="text-2xs sm:text-xs"
          >
            {department.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}