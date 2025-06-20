'use client';

import { useState } from 'react';
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
import { useHasPermission } from '@/lib/rbac-hooks';
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
    refreshWorkspaces 
  } = useWorkspace();
  
  const canEditWorkspace = useHasPermission('canEditWorkspace');
  const canInviteUsers = useHasPermission('canInviteUsers');
  const canCreateWorkspace = useHasPermission('canCreateWorkspace');
  
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">
            Manage your workspaces and switch between them
          </p>
        </div>
        {canCreateWorkspace && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>
                  Create a new workspace to organize your teams and projects.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">Name *</Label>
                  <Input
                    id="workspace-name"
                    value={workspaceForm.name}
                    onChange={(e) => setWorkspaceForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter workspace name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace-description">Description</Label>
                  <Textarea
                    id="workspace-description"
                    value={workspaceForm.description}
                    onChange={(e) => setWorkspaceForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your workspace"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace-logo">Logo URL</Label>
                  <Input
                    id="workspace-logo"
                    value={workspaceForm.logo}
                    onChange={(e) => setWorkspaceForm(prev => ({ ...prev, logo: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateWorkspace} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Workspace'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Current Workspace */}
      {currentWorkspace && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">                  {currentWorkspace.logo ? (
                    <Image src={currentWorkspace.logo} alt={currentWorkspace.name} className="h-8 w-8 rounded" width={32} height={32} />
                  ) : (
                    <Building2 className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{currentWorkspace.name}</span>
                    <Badge className={getRoleBadgeColor(userRole || '')}>
                      {getRoleIcon(userRole || '')}
                      <span className="ml-1 capitalize">{userRole}</span>
                    </Badge>
                  </CardTitle>
                  <CardDescription>{currentWorkspace.description || 'No description'}</CardDescription>
                </div>
              </div>              <div className="flex items-center space-x-2">
                {canInviteUsers && (
                  <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Mail className="h-4 w-4 mr-2" />
                        Invite
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Invite User</DialogTitle>
                        <DialogDescription>
                          Invite someone to join {currentWorkspace.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">Email *</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="user@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-role">Role</Label>
                          <Select value={inviteForm.role} onValueChange={(value: 'admin' | 'member') => setInviteForm(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                          <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleInviteUser} disabled={loading}>
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
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {userRole === 'owner' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteWorkspace(currentWorkspace, userRole || '')}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyWorkspaceId(currentWorkspace.id)}
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
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>                <p className="font-medium">
                  {toDate(currentWorkspace.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Your Role</p>
                <p className="font-medium capitalize">{userRole}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Workspace ID</p>
                <p className="font-mono text-xs truncate">{currentWorkspace.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Workspaces */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Workspaces</h2>        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userWorkspaces.map(({ workspace, role }) => (
            <Card 
              key={workspace.id} 
              className={`transition-colors hover:border-primary/50 ${
                currentWorkspace?.id === workspace.id ? 'border-primary' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center cursor-pointer"
                    onClick={() => switchWorkspace(workspace.id)}
                  >
                    {workspace.logo ? (
                      <Image src={workspace.logo} alt={workspace.name} className="h-6 w-6 rounded" width={24} height={24} />
                    ) : (
                      <Building2 className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => switchWorkspace(workspace.id)}
                  >
                    <CardTitle className="text-base truncate">{workspace.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs ${getRoleBadgeColor(role)}`}>
                        {getRoleIcon(role)}
                        <span className="ml-1 capitalize">{role}</span>
                      </Badge>
                    </div>
                  </div>
                  {(role === 'owner' || role === 'admin') && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleEditWorkspace(workspace, role);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {role === 'owner' && (
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkspace(workspace, role);
                            }}
                            className="text-red-600"
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
              <CardContent onClick={() => switchWorkspace(workspace.id)} className="cursor-pointer">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {workspace.description || 'No description provided'}
                </p>
                <div className="mt-3 pt-3 border-t border-border">                  <p className="text-xs text-muted-foreground">
                    Created {toDate(workspace.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}        </div>
      </div>

      {/* Edit Workspace Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>
              Update your workspace details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Workspace"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of your workspace"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-logo">Logo URL</Label>
              <Input
                id="edit-logo"
                value={editForm.logo}
                onChange={(e) => setEditForm(prev => ({ ...prev, logo: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Workspace Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedWorkspace?.name}&quot;? This action cannot be undone and will permanently delete the workspace and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Deleting...' : 'Delete Workspace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
