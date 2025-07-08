'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Plus,
  Users, 
  Crown,
  Mail,
  UserPlus,
  MoreHorizontal,
  ChevronDown,
  Loader2,
  Search,
  Shield,
  Edit,
  Settings,
  UserCheck,
  UserMinus,
  KeyRound,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { UserService } from '@/lib/user-service';
import { TeamService } from '@/lib/team-service';
import { BranchService } from '@/lib/branch-service';
import { RegionService } from '@/lib/region-service';
import { InvitationService } from '@/lib/invitation-service';
import { NotificationService } from '@/lib/notification-service';
import { useAuth } from '@/lib/auth-context';
import { useRolePermissions, useIsOwner } from '@/lib/rbac-hooks';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PasswordResetService } from '@/lib/password-reset-service';
import { DepartmentService } from '@/lib/department-service';
import { toDate } from '@/lib/firestore-utils';

// Import modular components
import { UserFilters } from './user-management/user-filters';
import { UserList } from './user-management/user-list';
import { UserDialogs } from './user-management/user-dialogs';

interface UserItem {
  user: any;
  role: string;
  joinedAt: any;
  workspaceId: string;
  isFromCurrentWorkspace: boolean;
}

export function UserManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const permissions = useRolePermissions();
  const isOwner = useIsOwner();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [workspaceUsers, setWorkspaceUsers] = useState<UserItem[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [inviteForm, setInviteForm] = useState({
    emails: '',
    role: 'member',
    teams: [] as string[],
    branchId: 'none',
    regionId: 'none',
    message: '',
  });

  const [createUserForm, setCreateUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: 'none',
    role: 'member',
    branchId: 'none',
    regionId: 'none',
    teamIds: [] as string[],
    sendWelcomeEmail: true,
    enablePassword: false,
    password: '',
    confirmPassword: '',
  });

  const [editUserForm, setEditUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: 'none',
    branchId: 'none',
    regionId: 'none',
    teamIds: [] as string[],
    status: 'active',
  });

  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);

  const [roleForm, setRoleForm] = useState({
    userId: '',
    currentRole: '',
    newRole: '',
  });

  // Load workspace users from Firestore
  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id || !user?.uid) return;
    
    try {
      setLoading(true);
      
      const sourceWorkspaceId = currentWorkspace.workspaceType === 'sub' 
        ? currentWorkspace.parentWorkspaceId || currentWorkspace.id
        : currentWorkspace.id;
      
      const isMainWorkspaceOwner = isOwner && currentWorkspace.workspaceType === 'main';
      
      const [users, workspaceTeams, branchesData, regionsData, invitations, departmentsData] = await Promise.all([
        isMainWorkspaceOwner 
          ? UserService.getAllUsers()
          : UserService.getUsersByWorkspace(currentWorkspace.id),
        TeamService.getWorkspaceTeams(currentWorkspace.id),
        BranchService.getBranches(sourceWorkspaceId),
        RegionService.getWorkspaceRegions(sourceWorkspaceId),
        InvitationService.getWorkspaceInvitations(currentWorkspace.id),
        DepartmentService.getWorkspaceDepartments(currentWorkspace.id)
      ]);
      
      let filteredRegions = regionsData;
      let filteredBranches = branchesData;
      
      if (currentWorkspace.workspaceType === 'sub') {
        filteredRegions = currentWorkspace.regionId 
          ? regionsData.filter(r => r.id === currentWorkspace.regionId)
          : [];
        
        filteredBranches = currentWorkspace.branchId 
          ? branchesData.filter(b => b.id === currentWorkspace.branchId)
          : [];
      }
      
      const formattedUsers = users.map(user => ({
        user,
        role: user.role || 'member',
        joinedAt: user.createdAt,
        workspaceId: user.workspaceId,
        isFromCurrentWorkspace: user.workspaceId === currentWorkspace.id
      }));
      
      setWorkspaceUsers(formattedUsers);
      setTeams(workspaceTeams);
      setBranches(filteredBranches);
      setRegions(filteredRegions);
      setPendingInvitations(invitations.filter(inv => inv.status === 'pending'));
      setDepartments(departmentsData);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, toast, user, isOwner]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Use real workspace users data instead of mock data
  const filteredUsers = workspaceUsers
    .filter(userItem => {
      const user = userItem.user;
      const role = userItem.role;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.jobTitle?.toLowerCase().includes(searchLower) ||
          user.department?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }
      
      // Role filter
      if (roleFilter !== 'all' && role !== roleFilter) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && user.status !== statusFilter) {
        return false;
      }
      
      return true;
    });

  const openChangeRoleDialog = (userItem: UserItem) => {
    setSelectedUser(userItem);
    setRoleForm({
      userId: userItem.user.id,
      currentRole: userItem.role,
      newRole: userItem.role,
    });
    setIsChangeRoleOpen(true);
  };
    
  const canChangeUserRole = (userRole: string) => {
    if (isOwner) {
      return !(userRole === 'owner' && user?.uid === selectedUser?.user.id);
    }
    return permissions.canAssignUserRoles && userRole === 'member';
  };

  const handleChangeRole = async () => {
    if (!currentWorkspace?.id || !selectedUser || !roleForm.newRole || !user?.uid) return;
    
    try {
      setSubmitting(true);
      
      await UserService.updateUserRole(
        selectedUser.user.id, 
        roleForm.newRole as 'owner' | 'admin' | 'member',
        user.uid
      );

      // Send notification about role change
      try {
        await NotificationService.notifyRoleChanged(
          user.uid,
          currentWorkspace.id,
          selectedUser.user.id,
          selectedUser.user.name || selectedUser.user.email,
          roleForm.currentRole,
          roleForm.newRole,
          user.displayName || 'System Administrator'
        );
      } catch (error) {
        console.error('Error sending role change notification:', error);
      }
      
      await loadData();
      
      setIsChangeRoleOpen(false);
      setSelectedUser(null);
      
      toast({
        title: 'Success',
        description: `User role updated to ${roleForm.newRole}`,
      });
    } catch (error) {
      console.error('Error changing user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to change user role. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (userItem: UserItem) => {
    const user = userItem.user;
    setSelectedUser(userItem);
    
    try {
      const userTeams = await TeamService.getUserTeams(user.id, currentWorkspace?.id || '');
      const teamIds = userTeams.map(ut => ut.team.id);
      
      setEditUserForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        jobTitle: user.jobTitle || '',
        department: user.department || 'none',
        branchId: user.branchId || 'none',
        regionId: user.regionId || 'none',
        teamIds: teamIds,
        status: user.status || 'active',
      });
      
      setIsEditUserOpen(true);
    } catch (error) {
      console.error('Error loading user teams:', error);
      setEditUserForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        jobTitle: user.jobTitle || '',
        department: user.department || 'none',
        branchId: user.branchId || 'none',
        regionId: user.regionId || 'none',
        teamIds: [],
        status: user.status || 'active',
      });
      
      setIsEditUserOpen(true);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !currentWorkspace?.id) return;

    try {
      setSubmitting(true);

      if (!editUserForm.firstName || !editUserForm.lastName || !editUserForm.email) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields (First Name, Last Name, Email)',
          variant: 'destructive',
        });
        return;
      }

      await UserService.updateUser(selectedUser.user.id, {
        firstName: editUserForm.firstName,
        lastName: editUserForm.lastName,
        name: `${editUserForm.firstName} ${editUserForm.lastName}`,
        email: editUserForm.email,
        phone: editUserForm.phone,
        jobTitle: editUserForm.jobTitle,
        department: editUserForm.department === 'none' ? undefined : editUserForm.department,
        branchId: editUserForm.branchId === 'none' ? undefined : editUserForm.branchId,
        regionId: editUserForm.regionId === 'none' ? undefined : editUserForm.regionId,
        status: editUserForm.status as 'active' | 'inactive' | 'suspended',
      });

      if (editUserForm.teamIds.length > 0 || selectedUser.user.teamIds?.length > 0) {
        const currentUserTeams = await TeamService.getUserTeams(selectedUser.user.id, currentWorkspace.id);
        const currentTeamIds = currentUserTeams.map(ut => ut.team.id);
        const newTeamIds = editUserForm.teamIds;

        const teamsToAdd = newTeamIds.filter(teamId => !currentTeamIds.includes(teamId));
        const teamsToRemove = currentTeamIds.filter(teamId => !newTeamIds.includes(teamId));

        const addPromises = teamsToAdd.map(teamId =>
          TeamService.addUserToTeam(selectedUser.user.id, teamId, 'member', user?.uid || '')
        );

        const removePromises = teamsToRemove.map(teamId =>
          TeamService.removeUserFromTeam(selectedUser.user.id, teamId)
        );

        await Promise.all([...addPromises, ...removePromises]);
      }

      toast({
        title: 'Success',
        description: `User ${editUserForm.firstName} ${editUserForm.lastName} updated successfully`,
      });

      setIsEditUserOpen(false);
      setSelectedUser(null);
      
      await loadData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserSettings = (userItem: UserItem) => {
    setSelectedUser(userItem);
    setIsUserSettingsOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !user?.uid || !currentWorkspace?.id) return;
    
    try {
      setSubmitting(true);
      
      const result = await PasswordResetService.sendAdminPasswordReset(
        selectedUser.user.email,
        user.uid,
        user.displayName || 'System Administrator'
      );
      
      if (!result.success) {
        throw new Error(result.message);
      }

      // Send notification about password reset
      try {
        await NotificationService.notifyPasswordReset(
          user.uid,
          currentWorkspace.id,
          selectedUser.user.id,
          selectedUser.user.email,
          user.displayName || 'System Administrator'
        );
      } catch (error) {
        console.error('Error sending password reset notification:', error);
      }
      
      toast({
        title: 'Password Reset Email Sent',
        description: result.message,
      });
      
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      
      toast({
        title: 'Password Reset Failed',
        description: error.message || 'Failed to send password reset email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser || !currentWorkspace?.id || !user?.uid) return;

    try {
      setSubmitting(true);
      
      await UserService.deactivateUser(selectedUser.user.id);

      // Send notification about user deactivation
      try {
        await NotificationService.notifyUserDeactivated(
          user.uid,
          currentWorkspace.id,
          selectedUser.user.id,
          selectedUser.user.name || selectedUser.user.email,
          user.displayName || 'System Administrator'
        );
      } catch (error) {
        console.error('Error sending user deactivation notification:', error);
      }
      
      toast({
        title: 'Success',
        description: `User ${selectedUser.user.name} has been deactivated`,
      });

      setIsUserSettingsOpen(false);
      setSelectedUser(null);
      
      await loadData();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivateUser = async () => {
    if (!selectedUser || !currentWorkspace?.id || !user?.uid) return;

    try {
      setSubmitting(true);
      await UserService.updateUser(selectedUser.user.id, { status: 'active' });

      // Send notification about user reactivation
      try {
        await NotificationService.notifyUserReactivated(
          user.uid,
          currentWorkspace.id,
          selectedUser.user.id,
          selectedUser.user.name || selectedUser.user.email,
          user.displayName || 'System Administrator'
        );
      } catch (error) {
        console.error('Error sending user reactivation notification:', error);
      }

      toast({
        title: 'Success',
        description: `User ${selectedUser.user.name} has been reactivated`,
      });
      setIsUserSettingsOpen(false);
      await loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reactivate user',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    if (window.confirm(`Are you sure you want to permanently delete ${selectedUser?.user.name}? This action cannot be undone.`)) {
      try {
        setSubmitting(true);
        await UserService.deleteUser(selectedUser.user.id);
        toast({
          title: 'Success',
          description: `User ${selectedUser.user.name} has been deleted`,
        });
        setIsUserSettingsOpen(false);
        await loadData();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete user',
          variant: 'destructive',
        });
      } finally {
        setSubmitting(false);
      }
    }
  };
  
  // Handle invite users
  const handleInviteUsers = async () => {
    if (!currentWorkspace?.id || !user?.uid) return;

    try {
      setSubmitting(true);
      
      const emailList = inviteForm.emails
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email && email.includes('@'));

      if (emailList.length === 0) {
        toast({
          title: 'Error',
          description: 'Please enter at least one valid email address',
          variant: 'destructive',
        });
        return;
      }

      const invitationRole = inviteForm.role === 'owner' ? 'admin' : inviteForm.role as 'admin' | 'member';

      const invitationPromises = emailList.map(email =>
        InvitationService.createInvitation({
          email,
          workspaceId: currentWorkspace.id,
          role: invitationRole,
          teamId: inviteForm.teams.length > 0 ? inviteForm.teams[0] : undefined,
        }, user.displayName || 'Admin')
      );

      await Promise.all(invitationPromises);

      // Send notifications for each invitation
      try {
        const notificationPromises = emailList.map(email =>
          NotificationService.notifyUserInvited(
            user.uid,
            currentWorkspace.id,
            email,
            user.displayName || 'System Administrator'
          )
        );
        await Promise.all(notificationPromises);
      } catch (error) {
        console.error('Error sending invitation notifications:', error);
      }

      const roleMessage = inviteForm.role === 'owner' 
        ? `Invitations sent as Admin (Owner role requires workspace transfer)`
        : `Invitations sent to ${emailList.length} email${emailList.length > 1 ? 's' : ''}`;

      toast({
        title: 'Success',
        description: roleMessage,
      });

      setInviteForm({
        emails: '',
        role: 'member',
        teams: [],
        branchId: 'none',
        regionId: 'none',
        message: '',
      });
      setIsInviteUserOpen(false);
      
      await loadData();
    } catch (error) {
      console.error('Error sending invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle create user directly
  const handleCreateUser = async () => {
    if (!currentWorkspace?.id || !user?.uid) return;

    try {
      setSubmitting(true);

      if (!createUserForm.firstName || !createUserForm.lastName || !createUserForm.email) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields (First Name, Last Name, Email)',
          variant: 'destructive',
        });
        return;
      }

      if (createUserForm.enablePassword) {
        if (!createUserForm.password || createUserForm.password.length < 6) {
          toast({
            title: 'Error',
            description: 'Password must be at least 6 characters long',
            variant: 'destructive',
          });
          return;
        }
        
        if (createUserForm.password !== createUserForm.confirmPassword) {
          toast({
            title: 'Error',
            description: 'Passwords do not match',
            variant: 'destructive',
          });
          return;
        }
      }

      const newUser = await UserService.createUserSecurely({
        email: createUserForm.email,
        name: `${createUserForm.firstName} ${createUserForm.lastName}`,
        firstName: createUserForm.firstName,
        lastName: createUserForm.lastName,
        phone: createUserForm.phone,
        jobTitle: createUserForm.jobTitle,
        department: createUserForm.department === 'none' ? undefined : createUserForm.department,
        workspaceId: currentWorkspace.id,
        branchId: createUserForm.branchId === 'none' ? undefined : createUserForm.branchId,
        regionId: createUserForm.regionId === 'none' ? undefined : createUserForm.regionId,
        preAssignedRole: createUserForm.role as 'owner' | 'admin' | 'member',
        password: createUserForm.enablePassword ? createUserForm.password : undefined,
      });

      if (createUserForm.teamIds.length > 0) {
        const teamPromises = createUserForm.teamIds.map(teamId =>
          TeamService.addUserToTeam(newUser.id, teamId, 'member', user?.uid || '')
        );
        await Promise.all(teamPromises);
      }

      // Send notification about user creation
      try {
        await NotificationService.notifyUserCreated(
          user.uid,
          currentWorkspace.id,
          `${createUserForm.firstName} ${createUserForm.lastName}`,
          createUserForm.email,
          newUser.id,
          user.displayName || 'System Administrator'
        );
      } catch (error) {
        console.error('Error sending user creation notification:', error);
      }

      if (createUserForm.enablePassword) {
        toast({
          title: 'User Created with Password',
          description: `${createUserForm.firstName} ${createUserForm.lastName} created successfully. You may need to refresh the page to restore your admin session.`,
        });
        
        setTimeout(() => {
          toast({
            title: 'Password Change Required',
            description: `${createUserForm.firstName} will be prompted to change their password on first login for security.`,
          });
        }, 2000);
      } else {
        toast({
          title: 'User Created',
          description: `${createUserForm.firstName} ${createUserForm.lastName} created. Send them a password reset email to set up login.`,
        });
      }

      setCreateUserForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        department: 'none',
        role: 'member',
        branchId: 'none',
        regionId: 'none',
        teamIds: [],
        sendWelcomeEmail: true,
        enablePassword: false,
        password: '',
        confirmPassword: '',
      });
      setIsCreateUserOpen(false);
      
      await loadData();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage users, roles, and invitations</p>
        </div>
        <div className="flex items-center space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setIsInviteUserOpen(true)}>
                <Mail className="h-4 w-4 mr-2" />
                <div className="flex flex-col">
                  <span>Invite User by Email</span>
                  <span className="text-xs text-muted-foreground">Send invitation link</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCreateUserOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                <div className="flex flex-col">
                  <span>Create User Directly</span>
                  <span className="text-xs text-muted-foreground">Add user immediately</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="invitations">
            Pending Invitations ({pendingInvitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* All Users System Banner */}
          {isOwner && currentWorkspace?.workspaceType === 'main' && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50 shadow-sm">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                <Crown className="mr-2 h-4 w-4" />
                System-Wide User Management (Owner View)
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                You're viewing ALL users across the entire system. Users from different workspaces are highlighted.
              </p>
            </div>
          )}

          {/* Role Legend */}
          <div className="p-3 bg-muted/50 rounded-lg border border-border/50 shadow-sm">
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <span className="mr-2">👥</span>
              Role Legend
            </h4>
            <div className="flex flex-wrap gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                  Owner
                </Badge>
                <span className="text-muted-foreground hidden sm:inline">- Full system control</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                  Admin
                </Badge>
                <span className="text-muted-foreground hidden sm:inline">- Workspace management</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
                  Member
                </Badge>
                <span className="text-muted-foreground hidden sm:inline">- Standard access</span>
              </div>
            </div>
          </div>

          {/* User Filters */}
          <UserFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            isInviteUserOpen={isInviteUserOpen}
            setIsInviteUserOpen={setIsInviteUserOpen}
            isCreateUserOpen={isCreateUserOpen}
            setIsCreateUserOpen={setIsCreateUserOpen}
          />

          {/* User List */}
          <UserList
            filteredUsers={filteredUsers}
            loading={loading}
            isOwner={isOwner}
            permissions={permissions}
            currentWorkspace={currentWorkspace}
            searchTerm={searchTerm}
            roleFilter={roleFilter}
            statusFilter={statusFilter}
            onChangeRole={openChangeRoleDialog}
            onEditUser={handleEditUser}
            onUserSettings={handleUserSettings}
          />
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          {pendingInvitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-2">
              <Mail className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No pending invitations</p>
              <p className="text-sm text-muted-foreground">Invitations you send will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingInvitations.map((invitation) => (
                <Card key={invitation.id} className="card-interactive">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{invitation.email}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {invitation.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {toDate(invitation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Invited by {invitation.invitedBy}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* All Dialogs */}
      <UserDialogs
        isInviteUserOpen={isInviteUserOpen}
        setIsInviteUserOpen={setIsInviteUserOpen}
        isCreateUserOpen={isCreateUserOpen}
        setIsCreateUserOpen={setIsCreateUserOpen}
        isEditUserOpen={isEditUserOpen}
        setIsEditUserOpen={setIsEditUserOpen}
        isChangeRoleOpen={isChangeRoleOpen}
        setIsChangeRoleOpen={setIsChangeRoleOpen}
        isUserSettingsOpen={isUserSettingsOpen}
        setIsUserSettingsOpen={setIsUserSettingsOpen}
        selectedUser={selectedUser}
        inviteForm={inviteForm}
        setInviteForm={setInviteForm}
        createUserForm={createUserForm}
        setCreateUserForm={setCreateUserForm}
        editUserForm={editUserForm}
        setEditUserForm={setEditUserForm}
        roleForm={roleForm}
        setRoleForm={setRoleForm}
        teams={teams}
        branches={branches}
        regions={regions}
        departments={departments}
        isOwner={isOwner}
        permissions={permissions}
        user={user}
        submitting={submitting}
        onInviteUsers={handleInviteUsers}
        onCreateUser={handleCreateUser}
        onUpdateUser={handleUpdateUser}
        onChangeRole={handleChangeRole}
        onResetPassword={handleResetPassword}
        onDeactivateUser={handleDeactivateUser}
        onReactivateUser={handleReactivateUser}
        onDeleteUser={handleDeleteUser}
      />
    </div>
  );
}
