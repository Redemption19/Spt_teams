'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Building2, 
  Users, 
  Settings, 
  Crown,
  Shield,
  User,
  Mail,
  Calendar,
  Edit,
  Trash2,
  Copy,
  Check,
  MoreHorizontal
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions } from '@/lib/rbac-hooks';
import { WorkspaceService } from '@/lib/workspace-service';
import { InvitationService } from '@/lib/invitation-service';
import { toDate } from '@/lib/firestore-utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import FixSubWorkspaceOwnership from './FixSubWorkspaceOwnership';
import { SubWorkspaceCreator } from '@/components/layout/sub-workspace-creator';
import { WorkspaceMembersTable } from './WorkspaceMembersTable';
import { AssignUserToWorkspaceCard } from './AssignUserToWorkspaceCard';
import { MoveUserBetweenWorkspacesCard } from './MoveUserBetweenWorkspacesCard';

export default function WorkspacePage() {
  const { 
    currentWorkspace, 
    userWorkspaces, 
    userRole, 
    switchToWorkspace, 
    createWorkspace, 
    refreshWorkspaces,
    refreshCurrentWorkspace
  } = useWorkspace();
  
  const permissions = useRolePermissions();
  const canEditWorkspace = permissions.canEditWorkspace;
  const canInviteUsers = permissions.canInviteUsers;
  const canCreateWorkspace = permissions.canCreateWorkspace;
  
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  
  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
    description: '',
    logo: ''
  });
    const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member' as 'admin' | 'member'
  });
  
  // Edit and delete state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    logo: ''
  });

  // Fix Sub-Workspace Ownership state
  const [showFixDialog, setShowFixDialog] = useState(false);

  // New state for workspace type selection
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [showSubWorkspaceDialog, setShowSubWorkspaceDialog] = useState(false);

  // Listen for real-time workspace settings changes
  useEffect(() => {
    const handleWorkspaceSettingsChanged = (event: CustomEvent) => {
      const { workspaceName, newSettings } = event.detail;
      
      // Show toast notification, especially important for admin users
      if (userRole === 'admin') {
        toast({
          title: "Workspace Settings Updated",
          description: `${workspaceName} settings have been updated. Your permissions may have changed.`,
          duration: 5000,
        });
        
        // Special notification for admin workspace creation permission
        if (newSettings?.allowAdminWorkspaceCreation) {
          setTimeout(() => {
            toast({
              title: "New Permission Granted! 🎉",
              description: "You can now create new workspaces. Check the 'New Workspace' button.",
              duration: 7000,
            });
          }, 1000);
        }
      }
    };

    window.addEventListener('workspaceSettingsChanged', handleWorkspaceSettingsChanged as EventListener);

    return () => {
      window.removeEventListener('workspaceSettingsChanged', handleWorkspaceSettingsChanged as EventListener);
    };
  }, [userRole, toast]);

  const handleCreateWorkspace = async () => {
    if (!workspaceForm.name.trim()) {
      toast({
        title: "Error",
        description: "Workspace name is required"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Prepare workspace data, excluding empty optional fields
      const workspaceData: any = {
        name: workspaceForm.name.trim(),
        ownerId: 'current-user-id' // This should come from auth context
      };
      
      // Only add optional fields if they have values
      if (workspaceForm.description.trim()) {
        workspaceData.description = workspaceForm.description.trim();
      }
      
      if (workspaceForm.logo.trim()) {
        workspaceData.logo = workspaceForm.logo.trim();
      }
      
      await createWorkspace(workspaceData);
      
      setWorkspaceForm({ name: '', description: '', logo: '' });
      setIsCreateOpen(false);
      
      toast({
        title: "Success",
        description: "Workspace created successfully"
      });
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast({
        title: "Error",
        description: "Failed to create workspace"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteForm.email.trim() || !currentWorkspace) {
      toast({
        title: "Error",
        description: "Email is required"
      });
      return;
    }    try {
      setLoading(true);
      await InvitationService.createInvitation({
        email: inviteForm.email.trim(),
        workspaceId: currentWorkspace.id,
        role: inviteForm.role,
      });
      
      setInviteForm({ email: '', role: 'member' });
      setIsInviteOpen(false);
      
      toast({
        title: "Success",
        description: "Invitation sent successfully"
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyWorkspaceId = (workspaceId: string) => {
    navigator.clipboard.writeText(workspaceId);
    setCopied(workspaceId);
    toast({
      title: "Copied",
      description: "Workspace ID copied to clipboard"
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'member': return <User className="h-4 w-4 text-gray-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'admin': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'member': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleEditWorkspace = (workspace: any, role: string) => {
    setSelectedWorkspace({ ...workspace, userRole: role });
    setEditForm({
      name: workspace.name,
      description: workspace.description || '',
      logo: workspace.logo || ''
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim() || !selectedWorkspace) {
      toast({
        title: "Error",
        description: "Workspace name is required"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Prepare update data, excluding empty optional fields
      const updateData: any = {
        name: editForm.name.trim(),
      };
      
      if (editForm.description.trim()) {
        updateData.description = editForm.description.trim();
      }
      
      if (editForm.logo.trim()) {
        updateData.logo = editForm.logo.trim();
      }

      await WorkspaceService.updateWorkspace(selectedWorkspace.id, updateData);
      await refreshWorkspaces();
      
      setIsEditOpen(false);
      setSelectedWorkspace(null);
      setEditForm({ name: '', description: '', logo: '' });
      
      toast({
        title: "Success",
        description: "Workspace updated successfully"
      });
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast({
        title: "Error",
        description: "Failed to update workspace"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkspace = (workspace: any, role: string) => {
    setSelectedWorkspace({ ...workspace, userRole: role });
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedWorkspace) return;

    try {
      setLoading(true);
      await WorkspaceService.deleteWorkspace(selectedWorkspace.id);
      await refreshWorkspaces();
      
      setIsDeleteOpen(false);
      setSelectedWorkspace(null);
      
      toast({
        title: "Success",
        description: "Workspace deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast({
        title: "Error",
        description: "Failed to delete workspace"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to get workspace section title based on role
  function getWorkspaceSectionTitle(role: string) {
    if (role === 'owner') return 'Manage Workspace';
    if (role === 'admin') return 'Workspace Overview';
    return 'My Workspace';
  }

  // Add a helper function before the return statement
  function getWorkspacePageDescription(role: string | undefined) {
    if (role === 'owner') return 'Create, manage, and oversee all your workspaces.';
    if (role === 'admin') return 'View and help manage your assigned workspaces.';
    return 'Access and collaborate in your workspaces.';
  }

  const [selectedMembersWorkspaceId, setSelectedMembersWorkspaceId] = useState<string | null>(null);
  const accessibleWorkspaces = userWorkspaces.filter(ws => ws.workspace.id !== currentWorkspace?.id);

  return (
    <div className="space-y-6">
      {/* Page Header - Responsive */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight truncate leading-tight">
            Workspaces
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-2 leading-relaxed max-w-3xl">
            {getWorkspacePageDescription(userRole || undefined)}
          </p>
        </div>
        <div className="flex flex-row gap-3 items-center">
          {/* Only show Fix button for owners */}
          {userRole === 'owner' && (
            <Dialog open={showFixDialog} onOpenChange={setShowFixDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  🛠️ Fix Sub-Workspace Ownership
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <FixSubWorkspaceOwnership />
              </DialogContent>
            </Dialog>
          )}
          {canCreateWorkspace && (
            <>
              {/* Workspace Type Selection Dialog */}
              <Dialog open={showTypeSelect} onOpenChange={setShowTypeSelect}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation bg-rose-600 hover:bg-rose-700 text-white">
                    <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">New Workspace</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select Workspace Type</DialogTitle>
                    <DialogDescription>
                      Would you like to create a Main Workspace or a Sub Workspace?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 mt-4">
                    <Button
                      className="w-full bg-primary text-white hover:bg-primary/90"
                      onClick={() => {
                        setShowTypeSelect(false);
                        setIsCreateOpen(true);
                      }}
                    >
                      Main Workspace
                    </Button>
                    <Button
                      className="w-full bg-background text-primary border border-primary hover:bg-primary/10 hover:text-primary"
                      style={{ fontWeight: 600 }}
                      onClick={() => {
                        setShowTypeSelect(false);
                        setShowSubWorkspaceDialog(true);
                      }}
                    >
                      Sub Workspace
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {/* Main Workspace Creation Dialog (existing) */}
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-md sm:mx-auto sm:w-full rounded-xl border shadow-lg">
                  <DialogHeader className="space-y-3">
                    <DialogTitle className="text-lg sm:text-xl font-semibold">Create New Workspace</DialogTitle>
                    <DialogDescription className="text-sm sm:text-base text-muted-foreground">
                      Create a new workspace to organize your teams and projects.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="workspace-name" className="text-sm font-medium">Name *</Label>
                      <Input
                        id="workspace-name"
                        value={workspaceForm.name}
                        onChange={(e) => setWorkspaceForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter workspace name"
                        className="text-sm sm:text-base rounded-lg border-2 focus:border-primary transition-colors h-11 sm:h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workspace-description" className="text-sm font-medium">Description</Label>
                      <Textarea
                        id="workspace-description"
                        value={workspaceForm.description}
                        onChange={(e) => setWorkspaceForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your workspace"
                        rows={3}
                        className="text-sm sm:text-base resize-none rounded-lg border-2 focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workspace-logo" className="text-sm font-medium">Logo URL</Label>
                      <Input
                        id="workspace-logo"
                        value={workspaceForm.logo}
                        onChange={(e) => setWorkspaceForm(prev => ({ ...prev, logo: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                        className="text-sm sm:text-base rounded-lg border-2 focus:border-primary transition-colors h-11 sm:h-10"
                      />
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreateOpen(false)} 
                        className="w-full sm:w-auto rounded-lg border-2 transition-all hover:border-primary h-11 sm:h-10"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateWorkspace} 
                        disabled={loading} 
                        className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all h-11 sm:h-10"
                      >
                        {loading ? 'Creating...' : 'Create Workspace'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              {/* Sub Workspace Creation Dialog */}
              <SubWorkspaceCreator
                parentWorkspaceId={currentWorkspace?.id}
                open={showSubWorkspaceDialog}
                onOpenChange={setShowSubWorkspaceDialog}
                trigger={null}
              />
            </>
          )}
        </div>
      </div>

      {/* Current Workspace - Responsive */}
      {currentWorkspace && (
        <Card className="border-primary/20">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  {currentWorkspace.logo ? (
                    <Image src={currentWorkspace.logo} alt={currentWorkspace.name} className="h-7 w-7 sm:h-8 sm:w-8 rounded" width={32} height={32} />
                  ) : (
                    <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                    <span className="truncate text-lg sm:text-xl lg:text-2xl">{currentWorkspace.name}</span>
                    <Badge className={`${getRoleBadgeColor(userRole || '')} self-start sm:self-auto`}>
                      {getRoleIcon(userRole || '')}
                      <span className="ml-1 capitalize">{userRole}</span>
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base lg:text-lg mt-2 line-clamp-2 leading-relaxed">
                    {currentWorkspace.description || 'No description'}
                  </CardDescription>
                  {/* Workspace section title based on role */}
                  <div className="mt-2 font-semibold text-base sm:text-lg">
                    {getWorkspaceSectionTitle(userRole || '')}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-sm sm:text-base">
              <div className="flex justify-between sm:block">
                <p className="text-muted-foreground font-medium sm:font-normal">Created</p>
                <p className="font-medium sm:font-medium sm:mt-1">
                  {toDate(currentWorkspace.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-between sm:block">
                <p className="text-muted-foreground font-medium sm:font-normal">Your Role</p>
                <p className="font-medium capitalize sm:mt-1">{userRole}</p>
              </div>
              <div className="flex justify-between sm:block">
                <p className="text-muted-foreground font-medium sm:font-normal">Workspace ID</p>
                <p className="font-mono text-xs sm:text-sm font-medium truncate sm:mt-1 max-w-[120px] sm:max-w-none">
                  {currentWorkspace.id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Workspaces - Responsive */}
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 sm:mb-6 px-1">All Workspaces</h2>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {userWorkspaces.map(({ workspace, role }) => (
            <Card 
              key={workspace.id} 
              className={`transition-all duration-200 hover:border-primary/50 hover:shadow-md ${
                currentWorkspace?.id === workspace.id ? 'border-primary shadow-sm' : ''
              }`}
            >
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div 
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center cursor-pointer flex-shrink-0 transition-transform hover:scale-105 touch-manipulation"
                    onClick={() => switchToWorkspace(workspace.id)}
                  >
                    {workspace.logo ? (
                      <Image 
                        src={workspace.logo} 
                        alt={workspace.name} 
                        className="h-6 w-6 sm:h-7 sm:w-7 rounded" 
                        width={28} 
                        height={28} 
                      />
                    ) : (
                      <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    )}
                  </div>
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => switchToWorkspace(workspace.id)}
                  >
                    <CardTitle className="text-base sm:text-lg truncate leading-tight">
                      {workspace.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 sm:space-x-3 mt-2">
                      <Badge className={`text-xs sm:text-sm ${getRoleBadgeColor(role)} px-2 py-1`}>
                        {getRoleIcon(role)}
                        <span className="ml-1 capitalize">{role}</span>
                      </Badge>
                    </div>
                  </div>
                  {(role === 'owner' || role === 'admin') && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 sm:h-10 sm:w-10 p-0 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 touch-manipulation"
                        >
                          <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 sm:w-48">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditWorkspace(workspace, role);
                          }}
                          className="text-sm"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {role === 'owner' && (
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkspace(workspace, role);
                            }}
                            className="text-red-600 text-sm"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent 
                onClick={() => switchToWorkspace(workspace.id)} 
                className="cursor-pointer p-4 sm:p-6 pt-0"
              >
                <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                  {workspace.description || 'No description provided'}
                </p>
                <div className="pt-3 sm:pt-4 border-t border-border">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Created {toDate(workspace.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {accessibleWorkspaces && accessibleWorkspaces.length > 0 && (
          <div className="mt-10">
            {/* Move User Between Workspaces Card */}
            <MoveUserBetweenWorkspacesCard workspaces={userWorkspaces.map(uw => uw.workspace)} />
            {/* Assign User to Workspace Card */}
            <AssignUserToWorkspaceCard workspaces={userWorkspaces.map(uw => uw.workspace)} />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <h2 className="text-lg sm:text-xl font-semibold">Workspace Members</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Select Workspace:</span>
                <Select
                  value={selectedMembersWorkspaceId || currentWorkspace?.id || ''}
                  onValueChange={setSelectedMembersWorkspaceId}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessibleWorkspaces.map(ws => (
                      <SelectItem key={ws.workspace.id} value={ws.workspace.id}>{ws.workspace.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <WorkspaceMembersTable workspaceId={selectedMembersWorkspaceId || currentWorkspace?.id || ''} />
          </div>
        )}
      </div>

      {/* Edit Workspace Dialog - Responsive */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-md sm:mx-auto sm:w-full rounded-xl border shadow-lg">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-lg sm:text-xl font-semibold">Edit Workspace</DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground">
              Update your workspace details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Workspace"
                className="text-sm sm:text-base rounded-lg border-2 focus:border-primary transition-colors h-11 sm:h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of your workspace"
                rows={3}
                className="text-sm sm:text-base resize-none rounded-lg border-2 focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-logo" className="text-sm font-medium">Logo URL</Label>
              <Input
                id="edit-logo"
                value={editForm.logo}
                onChange={(e) => setEditForm(prev => ({ ...prev, logo: e.target.value }))}
                placeholder="https://example.com/logo.png"
                className="text-sm sm:text-base rounded-lg border-2 focus:border-primary transition-colors h-11 sm:h-10"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsEditOpen(false)} 
                className="w-full sm:w-auto rounded-lg border-2 transition-all hover:border-primary h-11 sm:h-10"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                disabled={loading} 
                className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all h-11 sm:h-10"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Workspace Dialog - Responsive */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-lg sm:mx-auto sm:w-full rounded-xl border shadow-lg">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-lg sm:text-xl font-semibold text-red-600">Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              Are you sure you want to delete <strong>&quot;{selectedWorkspace?.name}&quot;</strong>? 
              This action cannot be undone and will permanently delete the workspace and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
            <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1 rounded-lg border-2 transition-all hover:border-primary h-11 sm:h-10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto order-1 sm:order-2 rounded-lg transition-all h-11 sm:h-10"
            >
              {loading ? 'Deleting...' : 'Delete Workspace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
