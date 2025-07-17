'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  AlertCircle, 
  Mail, 
  UserCheck, 
  Edit, 
  Settings, 
  KeyRound, 
  UserMinus, 
  UserCheck as UserCheckIcon, 
  Trash2,
  Users 
} from 'lucide-react';

interface UserItem {
  user: any;
  role: string;
  joinedAt: any;
  workspaceId: string;
  isFromCurrentWorkspace: boolean;
}

interface UserDialogsProps {
  // Dialog states
  isInviteUserOpen: boolean;
  setIsInviteUserOpen: (value: boolean) => void;
  isCreateUserOpen: boolean;
  setIsCreateUserOpen: (value: boolean) => void;
  isEditUserOpen: boolean;
  setIsEditUserOpen: (value: boolean) => void;
  isChangeRoleOpen: boolean;
  setIsChangeRoleOpen: (value: boolean) => void;
  isUserSettingsOpen: boolean;
  setIsUserSettingsOpen: (value: boolean) => void;
  
  // Selected user
  selectedUser: UserItem | null;
  
  // Form states
  inviteForm: any;
  setInviteForm: (form: any) => void;
  createUserForm: any;
  setCreateUserForm: (form: any) => void;
  editUserForm: any;
  setEditUserForm: (form: any) => void;
  roleForm: any;
  setRoleForm: (form: any) => void;
  
  // Data
  teams: any[];
  branches: any[];
  regions: any[];
  departments?: any[];
  
  // Permissions
  isOwner: boolean;
  permissions: any;
  user: any;
  
  // Loading states
  submitting: boolean;
  
  // Actions
  onInviteUsers: () => void;
  onCreateUser: () => void;
  onUpdateUser: () => void;
  onChangeRole: () => void;
  onResetPassword: () => void;
  onDeactivateUser: () => void;
  onReactivateUser: () => void;
  onDeleteUser: () => void;
}

export function UserDialogs(props: UserDialogsProps) {
  const {
    isInviteUserOpen,
    setIsInviteUserOpen,
    isCreateUserOpen,
    setIsCreateUserOpen,
    isEditUserOpen,
    setIsEditUserOpen,
    isChangeRoleOpen,
    setIsChangeRoleOpen,
    isUserSettingsOpen,
    setIsUserSettingsOpen,
    selectedUser,
    inviteForm,
    setInviteForm,
    createUserForm,
    setCreateUserForm,
    editUserForm,
    setEditUserForm,
    roleForm,
    setRoleForm,
    teams,
    branches,
    regions,
    departments,
    isOwner,
    permissions,
    user,
    submitting,
    onInviteUsers,
    onCreateUser,
    onUpdateUser,
    onChangeRole,
    onResetPassword,
    onDeactivateUser,
    onReactivateUser,
    onDeleteUser,
  } = props;

  const canChangeUserRole = (userRole: string) => {
    if (isOwner) {
      return !(userRole === 'owner' && user?.uid === selectedUser?.user.id);
    }
    return permissions.canAssignUserRoles && userRole === 'member';
  };

  return (
    <>
      {/* Invite User Dialog */}
      <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-primary" />
              <span>Invite User by Email</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Send Invitation</p>
                <p className="text-sm">
                  Users will receive an email invitation to join your workspace.
                </p>
              </div>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="emails">Email Addresses *</Label>
              <Textarea
                id="emails"
                placeholder="Enter email addresses (one per line or comma-separated)"
                value={inviteForm.emails}
                onChange={(e) => setInviteForm({...inviteForm, emails: e.target.value})}
                rows={3}
                className="resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Default Role</Label>
                <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({...inviteForm, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    {isOwner && <SelectItem value="owner">Owner (sent as Admin)</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="region">Default Region</Label>
                <Select value={inviteForm.regionId} onValueChange={(value) => setInviteForm({...inviteForm, regionId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Region</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Default Branch</Label>
              <Select value={inviteForm.branchId} onValueChange={(value) => setInviteForm({...inviteForm, branchId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Branch</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsInviteUserOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={onInviteUsers}
              disabled={submitting || !inviteForm.emails.trim()}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={isChangeRoleOpen} onOpenChange={setIsChangeRoleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                  {selectedUser?.user.firstName?.[0]}{selectedUser?.user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground">{selectedUser?.user.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedUser?.user.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newRole">New Role</Label>
              <Select value={roleForm.newRole} onValueChange={(value) => setRoleForm({...roleForm, newRole: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {isOwner && <SelectItem value="owner">Owner</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {roleForm.newRole === 'owner' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Transfer Ownership</p>
                  <p className="text-sm">
                    This will transfer workspace ownership to this user. You will become an admin.
                  </p>
                </div>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangeRoleOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={onChangeRole}
              disabled={submitting || roleForm.currentRole === roleForm.newRole || !canChangeUserRole(selectedUser?.role || '')}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Settings Dialog */}
      <Dialog open={isUserSettingsOpen} onOpenChange={setIsUserSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>User Settings</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                  {selectedUser?.user.firstName?.[0]}{selectedUser?.user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground">{selectedUser?.user.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedUser?.user.email}</p>
                <Badge variant={selectedUser?.role === 'owner' ? 'default' : selectedUser?.role === 'admin' ? 'secondary' : 'outline'} className="text-xs">
                  {selectedUser?.role}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Account Actions</div>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={onResetPassword}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4 mr-2" />
                )}
                Send Password Reset Email
              </Button>

              {selectedUser?.user.status === 'active' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                  onClick={onDeactivateUser}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4 mr-2" />
                  )}
                  Deactivate User
                </Button>
              )}

              {selectedUser?.user.status === 'inactive' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                  onClick={onReactivateUser}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserCheckIcon className="h-4 w-4 mr-2" />
                  )}
                  Reactivate User
                </Button>
              )}

              <div className="border-t pt-3">
                <div className="text-sm font-medium text-foreground mb-2">Danger Zone</div>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={onDeleteUser}
                  disabled={submitting || selectedUser?.role === 'owner'}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete User Permanently
                </Button>
                
                {selectedUser?.role === 'owner' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cannot delete workspace owner. Transfer ownership first.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUserSettingsOpen(false)}
              disabled={submitting}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>Create User Directly</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <Alert>
              <UserCheck className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Direct Creation</p>
                <p className="text-sm">
                  User will be added immediately to your workspace with the specified settings.
                </p>
              </div>
            </Alert>

            <div className="grid grid-cols-3 gap-4">
              {/* Column 1: Basic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-center border-b pb-1">Basic Information</h3>
                
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-xs">First Name *</Label>
                  <Input
                    id="firstName"
                    value={createUserForm.firstName}
                    onChange={(e) => setCreateUserForm({...createUserForm, firstName: e.target.value})}
                    placeholder="John"
                    className="h-8"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-xs">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={createUserForm.lastName}
                    onChange={(e) => setCreateUserForm({...createUserForm, lastName: e.target.value})}
                    placeholder="Doe"
                    className="h-8"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm({...createUserForm, email: e.target.value})}
                    placeholder="john.doe@company.com"
                    className="h-8"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                  <Input
                    id="phone"
                    value={createUserForm.phone}
                    onChange={(e) => setCreateUserForm({...createUserForm, phone: e.target.value})}
                    placeholder="+233 20 123 4567"
                    className="h-8"
                  />
                </div>

                <div className="space-y-2 p-2 border rounded-lg bg-muted/20">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enablePassword"
                      checked={createUserForm.enablePassword}
                      onChange={(e) => setCreateUserForm({...createUserForm, enablePassword: e.target.checked, password: '', confirmPassword: ''})}
                      className="rounded"
                    />
                    <Label htmlFor="enablePassword" className="text-xs font-medium">
                      Set Initial Password (Optional)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {createUserForm.enablePassword 
                      ? "Set user's password. They'll change it on first login."
                      : "User gets password reset email (recommended)."
                    }
                  </p>
                  
                  {createUserForm.enablePassword && (
                    <div className="space-y-2 pt-1">
                      <div className="space-y-1">
                        <Label htmlFor="password" className="text-xs">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={createUserForm.password}
                          onChange={(e) => setCreateUserForm({...createUserForm, password: e.target.value})}
                          placeholder="Min 6 characters"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="confirmPassword" className="text-xs">Confirm *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={createUserForm.confirmPassword}
                          onChange={(e) => setCreateUserForm({...createUserForm, confirmPassword: e.target.value})}
                          placeholder="Re-enter password"
                          className="h-8 text-sm"
                        />
                        {createUserForm.password && createUserForm.confirmPassword && createUserForm.password !== createUserForm.confirmPassword && (
                          <p className="text-xs text-red-500">Passwords don&apos;t match</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Work Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-center border-b pb-1">Work Information</h3>
                
                <div className="space-y-1">
                  <Label htmlFor="jobTitle" className="text-xs">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={createUserForm.jobTitle}
                    onChange={(e) => setCreateUserForm({...createUserForm, jobTitle: e.target.value})}
                    placeholder="Software Engineer"
                    className="h-8"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="department" className="text-xs">Department</Label>
                  <Select value={createUserForm.department} onValueChange={(value) => setCreateUserForm({...createUserForm, department: value})}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Analytics">Analytics</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="role" className="text-xs">Role</Label>
                  <Select value={createUserForm.role} onValueChange={(value) => setCreateUserForm({...createUserForm, role: value})}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {isOwner && <SelectItem value="owner">Owner</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="region" className="text-xs">Region</Label>
                  <Select value={createUserForm.regionId} onValueChange={(value) => setCreateUserForm({...createUserForm, regionId: value})}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Region</SelectItem>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="branch" className="text-xs">Branch</Label>
                  <Select value={createUserForm.branchId} onValueChange={(value) => setCreateUserForm({...createUserForm, branchId: value})}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Branch</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Column 3: Team Assignment */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-center border-b pb-1">Team Assignment</h3>
                
                {teams.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-xs">Select Teams (Optional)</Label>
                    <div className="space-y-1 max-h-40 overflow-y-auto border border-border rounded-md p-2">
                      {teams.map((team) => (
                        <label key={team.id} className="flex items-center space-x-2 p-1 border rounded hover:bg-accent/50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={createUserForm.teamIds.includes(team.id)}
                            onChange={(e) => {
                              const updatedTeams = e.target.checked
                                ? [...createUserForm.teamIds, team.id]
                                : createUserForm.teamIds.filter((id: string) => id !== team.id);
                              setCreateUserForm({...createUserForm, teamIds: updatedTeams});
                            }}
                            className="rounded"
                          />
                          <div className="flex flex-col flex-1">
                            <span className="text-xs font-medium">{team.name}</span>
                            {team.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {team.description}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Selected: {createUserForm.teamIds.length} team{createUserForm.teamIds.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">No teams available</p>
                    <p className="text-xs text-muted-foreground">Create teams first to assign users</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateUserOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={onCreateUser}
              disabled={
                submitting || 
                !createUserForm.firstName || 
                !createUserForm.lastName || 
                !createUserForm.email ||
                (createUserForm.enablePassword && (!createUserForm.password || createUserForm.password !== createUserForm.confirmPassword))
              }
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5 text-primary" />
              <span>Edit User</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                  {selectedUser?.user.firstName?.[0]}{selectedUser?.user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground">{selectedUser?.user.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedUser?.user.email}</p>
                <Badge variant={selectedUser?.role === 'owner' ? 'default' : selectedUser?.role === 'admin' ? 'secondary' : 'outline'} className="text-xs">
                  {selectedUser?.role}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-center border-b pb-1">Personal Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="editFirstName" className="text-xs">First Name *</Label>
                  <Input
                    id="editFirstName"
                    value={editUserForm.firstName}
                    onChange={(e) => setEditUserForm({...editUserForm, firstName: e.target.value})}
                    placeholder="John"
                    className="h-8"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editLastName" className="text-xs">Last Name *</Label>
                  <Input
                    id="editLastName"
                    value={editUserForm.lastName}
                    onChange={(e) => setEditUserForm({...editUserForm, lastName: e.target.value})}
                    placeholder="Doe"
                    className="h-8"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editEmail" className="text-xs">Email Address *</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
                    placeholder="john.doe@company.com"
                    className="h-8"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editPhone" className="text-xs">Phone Number</Label>
                  <Input
                    id="editPhone"
                    value={editUserForm.phone}
                    onChange={(e) => setEditUserForm({...editUserForm, phone: e.target.value})}
                    placeholder="+233 20 123 4567"
                    className="h-8"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editStatus" className="text-xs">Status</Label>
                  <Select value={editUserForm.status} onValueChange={(value) => setEditUserForm({...editUserForm, status: value})}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-center border-b pb-1">Work Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="editJobTitle" className="text-xs">Job Title</Label>
                  <Input
                    id="editJobTitle"
                    value={editUserForm.jobTitle}
                    onChange={(e) => setEditUserForm({...editUserForm, jobTitle: e.target.value})}
                    placeholder="Software Engineer"
                    className="h-8"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editDepartment" className="text-xs">Department</Label>
                  <Select value={editUserForm.department} onValueChange={(value) => setEditUserForm({...editUserForm, department: value})}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Department</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Analytics">Analytics</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editRegion" className="text-xs">Region</Label>
                  <Select value={editUserForm.regionId} onValueChange={(value) => setEditUserForm({...editUserForm, regionId: value})}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Region</SelectItem>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editBranch" className="text-xs">Branch</Label>
                  <Select value={editUserForm.branchId} onValueChange={(value) => setEditUserForm({...editUserForm, branchId: value})}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Branch</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-center border-b pb-1">Team Assignment</h3>
                
                {teams.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-xs">Select Teams (Optional)</Label>
                    <div className="space-y-1 max-h-48 overflow-y-auto border border-border rounded-md p-2">
                      {teams.map((team) => (
                        <label key={team.id} className="flex items-center space-x-2 p-1 border rounded hover:bg-accent/50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editUserForm.teamIds.includes(team.id)}
                            onChange={(e) => {
                              const updatedTeams = e.target.checked
                                ? [...editUserForm.teamIds, team.id]
                                : editUserForm.teamIds.filter((id: string) => id !== team.id);
                              setEditUserForm({...editUserForm, teamIds: updatedTeams});
                            }}
                            className="rounded text-xs"
                          />
                          <div className="flex flex-col flex-1">
                            <span className="text-xs font-medium">{team.name}</span>
                            {team.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {team.description}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Selected: {editUserForm.teamIds.length} team{editUserForm.teamIds.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No teams available</p>
                    <p className="text-xs text-muted-foreground">Create teams first to assign users</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditUserOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={onUpdateUser}
              disabled={submitting || !editUserForm.firstName || !editUserForm.lastName || !editUserForm.email}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 