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

export default function WorkspacePage() {
  const { 
    currentWorkspace, 
    userWorkspaces, 
    userRole, 
    switchWorkspace, 
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Admin Workspace Permission Info */}
      {userRole === 'admin' && !canCreateWorkspace && currentWorkspace?.workspaceType === 'sub' && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-3 sm:p-4 sm:pt-4">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm">📍</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                  You're in a Sub-Workspace
                </h4>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                  The <strong>"Allow Admin Workspace Creation"</strong> setting is per-workspace. If you want to create workspaces, ask the owner to enable this setting in <strong>this specific workspace</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Header - Responsive */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Workspaces</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage your workspaces and switch between them
          </p>
        </div>
        {canCreateWorkspace && (
          <div className="flex-shrink-0">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">New Workspace</span>
                  <span className="xs:hidden">New</span>
                </Button>
              </DialogTrigger>
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
                      className="text-sm sm:text-base rounded-lg border-2 focus:border-primary transition-colors"
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
                      className="text-sm sm:text-base rounded-lg border-2 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateOpen(false)} 
                      className="w-full sm:w-auto rounded-lg border-2 transition-all hover:border-primary"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateWorkspace} 
                      disabled={loading} 
                      className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all"
                    >
                      {loading ? 'Creating...' : 'Create Workspace'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Current Workspace - Responsive */}
      {currentWorkspace && (
        <Card className="border-primary/20">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  {currentWorkspace.logo ? (
                    <Image src={currentWorkspace.logo} alt={currentWorkspace.name} className="h-6 w-6 sm:h-8 sm:w-8 rounded" width={32} height={32} />
                  ) : (
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                    <span className="truncate text-lg sm:text-xl">{currentWorkspace.name}</span>
                    <Badge className={`${getRoleBadgeColor(userRole || '')} self-start sm:self-auto`}>
                      {getRoleIcon(userRole || '')}
                      <span className="ml-1 capitalize">{userRole}</span>
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base mt-1 line-clamp-2">
                    {currentWorkspace.description || 'No description'}
                  </CardDescription>
                </div>
              </div>
              
              {/* Action Buttons - Responsive */}
              <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:items-center sm:space-x-2">
                {canInviteUsers && (
                  <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="hidden xs:inline">Invite</span>
                        <span className="xs:hidden">Invite</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-md sm:mx-auto sm:w-full rounded-xl border shadow-lg">
                      <DialogHeader className="space-y-3">
                        <DialogTitle className="text-lg sm:text-xl font-semibold">Invite User</DialogTitle>
                        <DialogDescription className="text-sm sm:text-base text-muted-foreground">
                          Invite someone to join {currentWorkspace.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-5 pt-2">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email" className="text-sm font-medium">Email *</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="user@example.com"
                            className="text-sm sm:text-base rounded-lg border-2 focus:border-primary transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-role" className="text-sm font-medium">Role</Label>
                          <Select value={inviteForm.role} onValueChange={(value: 'admin' | 'member') => setInviteForm(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger className="text-sm sm:text-base rounded-lg border-2 focus:border-primary transition-colors">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border shadow-lg">
                              <SelectItem value="member" className="rounded-lg">Member</SelectItem>
                              <SelectItem value="admin" className="rounded-lg">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-4 border-t">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsInviteOpen(false)} 
                            className="w-full sm:w-auto rounded-lg border-2 transition-all hover:border-primary"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleInviteUser} 
                            disabled={loading} 
                            className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all"
                          >
                            {loading ? 'Sending...' : 'Send Invitation'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {(userRole === 'owner' || userRole === 'admin') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditWorkspace(currentWorkspace, userRole || '')}
                    className="flex-1 sm:flex-initial"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    <span className="hidden xs:inline">Edit</span>
                    <span className="xs:hidden">Edit</span>
                  </Button>
                )}
                {userRole === 'owner' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteWorkspace(currentWorkspace, userRole || '')}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-initial"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span className="hidden xs:inline">Delete</span>
                    <span className="xs:hidden">Del</span>
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyWorkspaceId(currentWorkspace.id)}
                  className="flex-shrink-0"
                  title="Copy Workspace ID"
                >
                  {copied === currentWorkspace.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
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
                <p className="font-mono text-xs sm:text-xs font-medium truncate sm:mt-1 max-w-[120px] sm:max-w-none">
                  {currentWorkspace.id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Workspaces - Responsive */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 px-1">All Workspaces</h2>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {userWorkspaces.map(({ workspace, role }) => (
            <Card 
              key={workspace.id} 
              className={`transition-all duration-200 hover:border-primary/50 hover:shadow-md ${
                currentWorkspace?.id === workspace.id ? 'border-primary shadow-sm' : ''
              }`}
            >
              <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div 
                    className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center cursor-pointer flex-shrink-0 transition-transform hover:scale-105"
                    onClick={() => switchWorkspace(workspace.id)}
                  >
                    {workspace.logo ? (
                      <Image 
                        src={workspace.logo} 
                        alt={workspace.name} 
                        className="h-5 w-5 sm:h-6 sm:w-6 rounded" 
                        width={24} 
                        height={24} 
                      />
                    ) : (
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    )}
                  </div>
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => switchWorkspace(workspace.id)}
                  >
                    <CardTitle className="text-sm sm:text-base truncate leading-tight">
                      {workspace.name}
                    </CardTitle>
                    <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                      <Badge className={`text-xs ${getRoleBadgeColor(role)} px-1.5 py-0.5`}>
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
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
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
                onClick={() => switchWorkspace(workspace.id)} 
                className="cursor-pointer p-3 sm:p-4 pt-0 sm:pt-0"
              >
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                  {workspace.description || 'No description provided'}
                </p>
                <div className="pt-2 sm:pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Created {toDate(workspace.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
                className="text-sm sm:text-base rounded-lg border-2 focus:border-primary transition-colors"
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
                className="text-sm sm:text-base rounded-lg border-2 focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsEditOpen(false)} 
                className="w-full sm:w-auto rounded-lg border-2 transition-all hover:border-primary"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                disabled={loading} 
                className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all"
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
            <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1 rounded-lg border-2 transition-all hover:border-primary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto order-1 sm:order-2 rounded-lg transition-all"
            >
              {loading ? 'Deleting...' : 'Delete Workspace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
