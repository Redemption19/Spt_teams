'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowRight, 
  Users, 
  Building, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  UserX, 
  Settings,
  Crown,
  Shield,
  User
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { WorkspaceService } from '@/lib/workspace-service';
import type { Workspace } from '@/lib/types';

interface TransferableUser {
  user: any;
  role: string;
  canTransfer: boolean;
  reason?: string;
}

interface TransferResult {
  success: string[];
  failed: { userId: string; error: string }[];
}

export default function UserTransferPage() {
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [transferableUsers, setTransferableUsers] = useState<TransferableUser[]>([]);
  const [destinationWorkspaces, setDestinationWorkspaces] = useState<Workspace[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member'>('member');
  const [transferring, setTransferring] = useState(false);
  const [transferResults, setTransferResults] = useState<TransferResult | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Check if user is owner of current workspace
  const isOwner = userProfile?.role === 'owner';

  useEffect(() => {
    if (currentWorkspace?.id && userProfile?.id && isOwner) {
      loadTransferData();
    }
  }, [currentWorkspace, userProfile, isOwner]);

  const loadTransferData = async () => {
    if (!currentWorkspace?.id || !userProfile?.id) return;

    setLoading(true);
    try {
      // Load transferable users from current workspace
      const users = await WorkspaceService.getTransferableUsers(
        currentWorkspace.id,
        userProfile.id
      );
      setTransferableUsers(users);

      // Load available destination workspaces (where user is owner)
      const destinations = await WorkspaceService.getTransferDestinations(userProfile.id);
      // Filter out current workspace
      const filteredDestinations = destinations.filter(w => w.id !== currentWorkspace.id);
      setDestinationWorkspaces(filteredDestinations);

      if (users.length === 0) {
        setMessage({
          type: 'info',
          text: 'No users available for transfer in this workspace'
        });
      } else if (filteredDestinations.length === 0) {
        setMessage({
          type: 'info',
          text: 'No destination workspaces available. You need to be an owner of another workspace to transfer users.'
        });
      }
    } catch (error) {
      console.error('Error loading transfer data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load transfer data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => 
      checked 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const transferableUserIds = transferableUsers
        .filter(u => u.canTransfer)
        .map(u => u.user.id);
      setSelectedUsers(transferableUserIds);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleTransfer = async () => {
    if (selectedUsers.length === 0 || !selectedDestination || !userProfile?.id || !currentWorkspace?.id) {
      return;
    }

    setTransferring(true);
    setTransferResults(null);
    setMessage(null);

    try {
      const results = await WorkspaceService.transferMultipleUsers(
        selectedUsers,
        currentWorkspace.id,
        selectedDestination,
        selectedRole,
        userProfile.id
      );

      setTransferResults(results);
      
      if (results.success.length > 0) {
        setMessage({
          type: 'success',
          text: `Successfully transferred ${results.success.length} user(s)`
        });
        
        // Reload data to reflect changes
        await loadTransferData();
        
        // Clear selections
        setSelectedUsers([]);
        setSelectedDestination('');
        setSelectedRole('member');
      }

      if (results.failed.length > 0) {
        setMessage({
          type: 'error',
          text: `${results.failed.length} transfer(s) failed. Check the results below.`
        });
      }
    } catch (error) {
      console.error('Error during transfer:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Transfer failed. Please try again.'
      });
    } finally {
      setTransferring(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  };

  if (!isOwner) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Alert className="border-yellow-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Only workspace owners can transfer users between workspaces.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading transfer data...</span>
        </div>
      </div>
    );
  }

  const transferableCount = transferableUsers.filter(u => u.canTransfer).length;
  const selectedTransferableCount = selectedUsers.length;

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">User Transfer Management</h1>
          <p className="text-muted-foreground">
            Move users between workspaces you own
          </p>
        </div>
      </div>

      {message && (
        <Alert className={
          message.type === 'error' ? 'border-red-200' : 
          message.type === 'success' ? 'border-green-200' : 
          'border-blue-200'
        }>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{transferableUsers.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{transferableCount}</p>
                <p className="text-sm text-muted-foreground">Transferable</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{selectedTransferableCount}</p>
                <p className="text-sm text-muted-foreground">Selected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{destinationWorkspaces.length}</p>
                <p className="text-sm text-muted-foreground">Destinations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Controls */}
      {transferableCount > 0 && destinationWorkspaces.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Settings</CardTitle>
            <CardDescription>
              Configure where to transfer selected users and their new role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Destination Workspace</label>
                <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination workspace..." />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationWorkspaces.map((workspace) => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-none">
                <label className="text-sm font-medium mb-2 block">New Role</label>
                <Select value={selectedRole} onValueChange={(value: 'admin' | 'member') => setSelectedRole(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    disabled={selectedUsers.length === 0 || !selectedDestination || transferring}
                    className="min-w-32"
                  >
                    {transferring ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    Transfer ({selectedUsers.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm User Transfer</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to transfer {selectedUsers.length} user(s) to{' '}
                      {destinationWorkspaces.find(w => w.id === selectedDestination)?.name} as {selectedRole}s?
                      <br /><br />
                      This action will:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Remove users from the current workspace</li>
                        <li>Add them to the destination workspace</li>
                        <li>Update their primary workspace</li>
                        <li>Set their new role as specified</li>
                      </ul>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                    <Button onClick={handleTransfer} disabled={transferring}>
                      {transferring ? 'Transferring...' : 'Confirm Transfer'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users in {currentWorkspace?.name}</CardTitle>
              <CardDescription>
                Select users to transfer to another workspace
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadTransferData} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {transferableCount > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedUsers.length === transferableCount}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select All Transferable
                  </label>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transferableUsers.map((userStatus, index) => (
              <div key={userStatus.user.id}>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {userStatus.canTransfer && (
                      <Checkbox
                        checked={selectedUsers.includes(userStatus.user.id)}
                        onCheckedChange={(checked) => handleUserSelect(userStatus.user.id, checked as boolean)}
                      />
                    )}
                    
                    {!userStatus.canTransfer && (
                      <UserX className="h-5 w-5 text-gray-400" />
                    )}
                    
                    <div className="flex items-center gap-2">
                      {getRoleIcon(userStatus.role)}
                      <div>
                        <div className="font-medium">{userStatus.user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {userStatus.user.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={getRoleBadgeVariant(userStatus.role)}>
                      {userStatus.role}
                    </Badge>
                    
                    {!userStatus.canTransfer && userStatus.reason && (
                      <Badge variant="destructive" className="text-xs">
                        {userStatus.reason}
                      </Badge>
                    )}
                  </div>
                </div>
                {index < transferableUsers.length - 1 && <Separator />}
              </div>
            ))}
            
            {transferableUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found in this workspace.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transfer Results */}
      {transferResults && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transferResults.success.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Successfully Transferred ({transferResults.success.length})
                  </h4>
                  <div className="space-y-1">
                    {transferResults.success.map(userId => {
                      const user = transferableUsers.find(u => u.user.id === userId)?.user;
                      return (
                        <div key={userId} className="text-sm text-green-600">
                          • {user?.name} ({user?.email})
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {transferResults.failed.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Failed Transfers ({transferResults.failed.length})
                  </h4>
                  <div className="space-y-1">
                    {transferResults.failed.map(({ userId, error }) => {
                      const user = transferableUsers.find(u => u.user.id === userId)?.user;
                      return (
                        <div key={userId} className="text-sm text-red-600">
                          • {user?.name} ({user?.email}): {error}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About User Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Only workspace owners can transfer users between workspaces</p>
            <p>• You can only transfer users to workspaces where you are also an owner</p>
            <p>• The last owner of a workspace cannot be transferred (workspace must have at least one owner)</p>
            <p>• Transferred users will have their primary workspace updated to the destination</p>
            <p>• User permissions and team memberships will be updated accordingly</p>
            <p>• All transfers are logged in the activity feed of both workspaces</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 