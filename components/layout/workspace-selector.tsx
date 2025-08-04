'use client';

import { useState } from 'react';
import { Check, ChevronDown, Plus, Building, Users, Crown, UserCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useWorkspace } from '@/lib/workspace-context';
import { SubWorkspaceCreator } from '@/components/layout/sub-workspace-creator';
import { Workspace } from '@/lib/types';

export function WorkspaceSelector() {
  const {
    currentWorkspace,
    mainWorkspaces,
    subWorkspaces,
    userRole,
    canCreateSubWorkspace,
    getUserRole,
    switchToWorkspace,
    loading
  } = useWorkspace();

  const [isOpen, setIsOpen] = useState(false);

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    try {
      await switchToWorkspace(workspaceId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error switching workspace:', error);
    }
  };

  const getWorkspaceIcon = (workspace: Workspace) => {
    if (workspace.workspaceType === 'main') {
      return <Building className="h-4 w-4" />;
    }
    return <Users className="h-4 w-4" />;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-600" />;
      case 'admin':
        return <UserCheck className="h-3 w-3 text-blue-600" />;
      default:
        return <User className="h-3 w-3 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20';
      case 'admin':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loading || !currentWorkspace) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-2 hover:bg-accent">
          <div className="flex items-center space-x-3">
            {/* Workspace Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm font-medium">
                {currentWorkspace.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Workspace Info */}
            <div className="flex flex-col items-start min-w-0">
              <div className="flex items-center space-x-2">
                {getWorkspaceIcon(currentWorkspace)}
                <span className="font-medium text-sm truncate max-w-[120px]">
                  {currentWorkspace.name}
                </span>
              </div>
              
              {/* Role Badge */}
              <div className="flex items-center space-x-1">
                {getRoleIcon(userRole || 'member')}
                <span className="text-xs text-muted-foreground capitalize">
                  {userRole || 'member'}
                </span>
              </div>
            </div>
            
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-80 bg-popover border-border">
        {/* Current Workspace */}
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Current Workspace</span>
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-1 ${getRoleBadgeColor(userRole || 'member')}`}
          >
            {userRole || 'member'}
          </Badge>
        </DropdownMenuLabel>
        
        <DropdownMenuItem className="flex items-center justify-between p-3 bg-muted/50">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                {currentWorkspace.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                {getWorkspaceIcon(currentWorkspace)}
                <span className="font-medium">{currentWorkspace.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {currentWorkspace.workspaceType === 'main' ? 'Main Workspace' : 'Sub-Workspace'}
              </p>
            </div>
          </div>
          <Check className="h-4 w-4 text-primary" />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Main Workspaces */}
        <DropdownMenuLabel>Main Workspaces</DropdownMenuLabel>
        {mainWorkspaces.map((workspace) => {
          const workspaceRole = getUserRole(workspace.id);
          const isActive = currentWorkspace.id === workspace.id;
          const hasSubWorkspaces = subWorkspaces[workspace.id]?.length > 0;

          if (hasSubWorkspaces) {
            // Main workspace with sub-workspaces - use submenu
            return (
              <DropdownMenuSub key={workspace.id}>
                <DropdownMenuSubTrigger className="flex items-center space-x-3 p-3">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {workspace.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Building className="h-3 w-3" />
                      <span className="text-sm font-medium">{workspace.name}</span>
                      {isActive && <Check className="h-3 w-3 text-primary" />}
                    </div>
                    <div className="flex items-center space-x-1">
                      {getRoleIcon(workspaceRole || 'member')}
                      <span className="text-xs text-muted-foreground">
                        {workspaceRole} • {subWorkspaces[workspace.id].length} sub-workspaces
                      </span>
                    </div>
                  </div>
                </DropdownMenuSubTrigger>
                
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {/* Main workspace option */}
                    <DropdownMenuItem 
                      onClick={() => handleWorkspaceSwitch(workspace.id)}
                      className="flex items-center space-x-3 p-3"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {workspace.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Building className="h-3 w-3" />
                          <span className="text-sm font-medium">{workspace.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Main workspace</span>
                      </div>
                      {isActive && <Check className="h-3 w-3 text-primary ml-auto" />}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs">Sub-Workspaces</DropdownMenuLabel>

                    {/* Sub-workspaces */}
                    {subWorkspaces[workspace.id].map((subWorkspace) => {
                      const subWorkspaceRole = getUserRole(subWorkspace.id);
                      const isSubActive = currentWorkspace.id === subWorkspace.id;

                      return (
                        <DropdownMenuItem
                          key={subWorkspace.id}
                          onClick={() => handleWorkspaceSwitch(subWorkspace.id)}
                          className="flex items-center space-x-3 p-3 pl-6"
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-accent/10 text-accent text-xs">
                              {subWorkspace.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Users className="h-3 w-3" />
                              <span className="text-sm">{subWorkspace.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {getRoleIcon(subWorkspaceRole || 'member')}
                              <span className="text-xs text-muted-foreground">
                                {subWorkspaceRole}
                              </span>
                            </div>
                          </div>
                          {isSubActive && <Check className="h-3 w-3 text-primary" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            );
          } else {
            // Main workspace without sub-workspaces - direct item
            return (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleWorkspaceSwitch(workspace.id)}
                className="flex items-center space-x-3 p-3"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {workspace.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Building className="h-3 w-3" />
                    <span className="text-sm font-medium">{workspace.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(workspaceRole || 'member')}
                    <span className="text-xs text-muted-foreground">{workspaceRole}</span>
                  </div>
                </div>
                {isActive && <Check className="h-3 w-3 text-primary" />}
              </DropdownMenuItem>
            );
          }
        })}

        {/* Create Workspace Options */}
        {canCreateSubWorkspace && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Create New</DropdownMenuLabel>
            {/* Remove SubWorkspaceCreator trigger/button here */}
          </>
        )}

        {/* Only show main workspace creation for owners */}
        {userRole === 'owner' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center space-x-3 p-3 text-primary">
              <Plus className="h-4 w-4" />
              <span className="text-sm">Create Main Workspace</span>
            </DropdownMenuItem>
          </>
        )}

        {/* Workspace count info */}
        <DropdownMenuSeparator />
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {mainWorkspaces.length} main workspace{mainWorkspaces.length !== 1 ? 's' : ''} • {' '}
          {Object.values(subWorkspaces).flat().length} sub-workspace{Object.values(subWorkspaces).flat().length !== 1 ? 's' : ''}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 