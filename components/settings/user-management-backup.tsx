'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Search, 
  Users, 
  Crown,
  Mail,
  Settings,
  Edit,
  UserPlus,
  MoreHorizontal,
  Trash2,
  Shield,
  User as UserIcon,
  Loader2,
  AlertCircle,
  ChevronDown,
  UserCheck,
  KeyRound,
  UserMinus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { WorkspaceService } from '@/lib/workspace-service';
import { UserService } from '@/lib/user-service';
import { TeamService } from '@/lib/team-service';
import { BranchService } from '@/lib/branch-service';
import { RegionService } from '@/lib/region-service';
import { InvitationService } from '@/lib/invitation-service';
import { useAuth } from '@/lib/auth-context';
import { useRolePermissions, useIsOwner } from '@/lib/rbac-hooks';
import { safeFormatDate } from '@/lib/utils/date-utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PasswordResetService } from '@/lib/password-reset-service';
import { Skeleton } from '@/components/ui/skeleton';

// Sample data for development/demonstration
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+233 20 123 4567',
    jobTitle: 'Senior Software Engineer',
    department: 'Development',
    role: 'owner',
    status: 'active',
    lastActive: '2024-01-15',
    teams: ['Development Team', 'Analytics Team'],
    branchId: 'central-branch',
    regionId: 'greater-accra',
    avatar: 'JD',
    createdAt: '2023-06-15',
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@company.com',
    phone: '+233 20 987 6543',
    jobTitle: 'UI/UX Designer',
    department: 'Design',
    role: 'admin',
    status: 'active',
    lastActive: '2024-01-14',
    teams: ['Development Team', 'Design Team'],
    branchId: 'central-branch',
    regionId: 'greater-accra',
    avatar: 'SW',
    createdAt: '2023-07-20',
  },
];

// Mock invitations removed - now using real data from Firestore

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
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);

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
      
      // Determine which workspace to load regions/branches from
      // For sub-workspaces, load from parent workspace (same logic as header)
      const sourceWorkspaceId = currentWorkspace.workspaceType === 'sub' 
        ? currentWorkspace.parentWorkspaceId || currentWorkspace.id
        : currentWorkspace.id;
      
      // Check if user is owner in main workspace to show all users
      const isMainWorkspaceOwner = isOwner && currentWorkspace.workspaceType === 'main';
      
      console.log('User Management - Loading data:', {
        currentWorkspaceType: currentWorkspace.workspaceType,
        isOwner,
        isMainWorkspaceOwner,
        willShowAllUsers: isMainWorkspaceOwner
      });
      
      // Load all necessary data in parallel
      const [users, workspaceTeams, branchesData, regionsData, invitations] = await Promise.all([
        // If owner in main workspace, load ALL users from system, otherwise load workspace users
        isMainWorkspaceOwner 
          ? UserService.getAllUsers() // Load all users in system
          : UserService.getUsersByWorkspace(currentWorkspace.id), // Load workspace users only
        TeamService.getWorkspaceTeams(currentWorkspace.id),
        BranchService.getBranches(sourceWorkspaceId), // Use sourceWorkspaceId for sub-workspaces
        RegionService.getWorkspaceRegions(sourceWorkspaceId), // Use sourceWorkspaceId for sub-workspaces
        InvitationService.getWorkspaceInvitations(currentWorkspace.id) // Load real invitations
      ]);
      
      // Filter regions and branches for sub-workspaces to only show bound ones
      let filteredRegions = regionsData;
      let filteredBranches = branchesData;
      
      if (currentWorkspace.workspaceType === 'sub') {
        // For sub-workspaces, only show the bound region and branch
        filteredRegions = currentWorkspace.regionId 
          ? regionsData.filter(r => r.id === currentWorkspace.regionId)
          : [];
        
        filteredBranches = currentWorkspace.branchId 
          ? branchesData.filter(b => b.id === currentWorkspace.branchId)
          : [];
      }
      
      console.log('Loaded workspace data:', {
        users: users.length,
        teams: workspaceTeams.length,
        branches: filteredBranches.length,
        regions: filteredRegions.length,
        invitations: invitations.length,
        pendingInvitations: invitations.filter(inv => inv.status === 'pending').length,
        currentWorkspaceType: currentWorkspace.workspaceType,
        sourceWorkspaceId: sourceWorkspaceId,
        currentWorkspaceId: currentWorkspace.id,
        boundRegionId: currentWorkspace.regionId,
        boundBranchId: currentWorkspace.branchId,
        isSubWorkspace: currentWorkspace.workspaceType === 'sub',
        isMainWorkspaceOwner,
        showingAllUsers: isMainWorkspaceOwner
      });
      
      // Format users data with workspace information
      const formattedUsers = users.map(user => ({
        user,
        role: user.role || 'member',
        joinedAt: user.createdAt,
        workspaceId: user.workspaceId,
        isFromCurrentWorkspace: user.workspaceId === currentWorkspace.id
      }));
      
      setWorkspaceUsers(formattedUsers);
      setTeams(workspaceTeams);
      setBranches(filteredBranches); // Use filtered branches
      setRegions(filteredRegions);   // Use filtered regions
      setPendingInvitations(invitations.filter(inv => inv.status === 'pending')); // Set pending invitations
      
      if (formattedUsers.length === 0) {
        console.warn('No users found for workspace:', currentWorkspace.id);
      }
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

  const openChangeRoleDialog = (userItem: any) => {
    setSelectedUser(userItem);
    setRoleForm({
      userId: userItem.user.id,
      currentRole: userItem.role,
      newRole: userItem.role,
    });
    setIsChangeRoleOpen(true);
  };
    
  const canChangeUserRole = (userRole: string) => {
    // Owners can change any role except themselves to another owner
    if (isOwner) {
      return !(userRole === 'owner' && user?.uid === selectedUser?.user.id);
    }
    
    // Admins can only manage members, not other admins or owners
    return permissions.canAssignUserRoles && userRole === 'member';
  };  const handleChangeRole = async () => {
    if (!currentWorkspace?.id || !selectedUser || !roleForm.newRole || !user?.uid) return;
    
    try {
      setSubmitting(true);
      
      // Update user role using the specific role update method
      await UserService.updateUserRole(
        selectedUser.user.id, 
        roleForm.newRole as 'owner' | 'admin' | 'member',
        user.uid
      );
      
      // Reload data to reflect changes
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
  const handleEditUser = async (userItem: any) => {
    const user = userItem.user;
    setSelectedUser(userItem);
    
    // Get user's current teams
    try {
      const userTeams = await TeamService.getUserTeams(user.id, currentWorkspace?.id || '');
      const teamIds = userTeams.map(ut => ut.team.id);
      
      // Pre-populate the edit form with current user data
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
      // Still open the dialog even if team loading fails
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

      // Validate required fields
      if (!editUserForm.firstName || !editUserForm.lastName || !editUserForm.email) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields (First Name, Last Name, Email)',
          variant: 'destructive',
        });
        return;
      }

      // Update user data
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

      // Handle team assignments
      if (editUserForm.teamIds.length > 0 || selectedUser.user.teamIds?.length > 0) {
        // Get current teams
        const currentUserTeams = await TeamService.getUserTeams(selectedUser.user.id, currentWorkspace.id);
        const currentTeamIds = currentUserTeams.map(ut => ut.team.id);
        const newTeamIds = editUserForm.teamIds;

        // Teams to add (in new list but not in current)
        const teamsToAdd = newTeamIds.filter(teamId => !currentTeamIds.includes(teamId));
        
        // Teams to remove (in current but not in new list)
        const teamsToRemove = currentTeamIds.filter(teamId => !newTeamIds.includes(teamId));

        // Add to new teams
        const addPromises = teamsToAdd.map(teamId =>
          TeamService.addUserToTeam(selectedUser.user.id, teamId, 'member', user?.uid || '')
        );

        // Remove from old teams
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
      
      // Reload data to show changes
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

  const handleUserSettings = (userItem: any) => {
    setSelectedUser(userItem);
    setIsUserSettingsOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !user?.uid) return;
    
    try {
      setSubmitting(true);
      
      // Send password reset email using custom EmailJS service
      const result = await PasswordResetService.sendAdminPasswordReset(
        selectedUser.user.email,
        user.uid,
        user.displayName || 'System Administrator'
      );
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      toast({
        title: 'Password Reset Email Sent',
        description: result.message,
      });
      
      // Don't close the modal immediately - let user see the success message
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
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      
      await UserService.deactivateUser(selectedUser.user.id);
      
      toast({
        title: 'Success',
        description: `User ${selectedUser.user.name} has been deactivated`,
      });

      setIsUserSettingsOpen(false);
      setSelectedUser(null);
      
      // Reload data to show changes
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
  
  // Handle invite users
  const handleInviteUsers = async () => {
    if (!currentWorkspace?.id || !user?.uid) return;

    try {
      setSubmitting(true);
      
      // Parse email addresses
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

      // Handle owner role - convert to admin for invitation (owners are created through workspace transfer)
      const invitationRole = inviteForm.role === 'owner' ? 'admin' : inviteForm.role as 'admin' | 'member';

      // Send invitations for each email
      const invitationPromises = emailList.map(email =>
        InvitationService.createInvitation({
          email,
          workspaceId: currentWorkspace.id,
          role: invitationRole,
          teamId: inviteForm.teams.length > 0 ? inviteForm.teams[0] : undefined,
        }, user.displayName || 'Admin')
      );

      await Promise.all(invitationPromises);

      // Show different message if owner was selected
      const roleMessage = inviteForm.role === 'owner' 
        ? `Invitations sent as Admin (Owner role requires workspace transfer)`
        : `Invitations sent to ${emailList.length} email${emailList.length > 1 ? 's' : ''}`;

      toast({
        title: 'Success',
        description: roleMessage,
      });

      // Reset form and close dialog
      setInviteForm({
        emails: '',
        role: 'member',
        teams: [],
        branchId: 'none',
        regionId: 'none',
        message: '',
      });
      setIsInviteUserOpen(false);
      
      // Reload data to show pending invitations
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

      // Validate required fields
      if (!createUserForm.firstName || !createUserForm.lastName || !createUserForm.email) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields (First Name, Last Name, Email)',
          variant: 'destructive',
        });
        return;
      }

      // Validate password if enabled
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

      // Create user with or without password
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

      // Assign to teams if selected
      if (createUserForm.teamIds.length > 0) {
        const teamPromises = createUserForm.teamIds.map(teamId =>
          TeamService.addUserToTeam(newUser.id, teamId, 'member', user?.uid || '')
        );
        await Promise.all(teamPromises);
      }

      // Show success message with different instructions
      if (createUserForm.enablePassword) {
        toast({
          title: 'User Created with Password',
          description: `${createUserForm.firstName} ${createUserForm.lastName} created successfully. You may need to refresh the page to restore your admin session.`,
        });
        
        // Show additional info about password change requirement
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

      // Reset form and close dialog
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
      
      // Reload data to show new user
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
                <UserCheck className="h-4 w-4 mr-2" />
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
                You&apos;re viewing ALL users across the entire system. Users from different workspaces are highlighted.
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

          {/* Workspace Ownership Section */}
          {(() => {
            const owners = filteredUsers.filter(userItem => userItem.role === 'owner');
            return owners.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-foreground">Workspace Ownership</h3>
                  <Badge variant="outline" className="text-xs">{owners.length} Owner{owners.length > 1 ? 's' : ''}</Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {owners.map((userItem) => {
                    const user = userItem.user;
                    const role = userItem.role;
                    const joinedAt = userItem.joinedAt;

                    return (
                      <Card key={user.id} className="card-interactive border-2 border-yellow-200 dark:border-yellow-800/50 bg-gradient-to-br from-yellow-50/50 to-amber-50/30 dark:from-yellow-900/10 dark:to-amber-900/5">
                        <CardHeader className="p-4 pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-yellow-200 dark:ring-yellow-800">
                                <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-amber-500 text-white text-sm font-semibold">
                                  {user.firstName?.[0]}{user.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-base truncate">{user.name}</h3>
                                  <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                {user.jobTitle && <p className="text-xs text-muted-foreground truncate">{user.jobTitle}</p>}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 font-medium">
                                Owner
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0.5">
                                {user.status}
                              </Badge>
                            </div>
                            
                            {joinedAt && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Joined: {safeFormatDate(joinedAt, undefined, 'Unknown')}</span>
                              </div>
                            )}

                            <div className="flex gap-1 pt-2 border-t border-yellow-200 dark:border-yellow-800/50">
                              {(isOwner || (permissions.canAssignUserRoles && role !== 'owner')) && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 h-7 text-xs px-2 border-yellow-200 hover:bg-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-900/20"
                                  onClick={() => openChangeRoleDialog(userItem)}
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  Role
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 h-7 text-xs px-2 border-yellow-200 hover:bg-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-900/20" 
                                onClick={() => handleEditUser(userItem)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 h-7 text-xs px-2 border-yellow-200 hover:bg-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-900/20" 
                                onClick={() => handleUserSettings(userItem)}
                              >
                                <Settings className="h-3 w-3 mr-1" />
                                More
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-border bg-background"
              />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-28 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-28 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    <Mail className="h-3 w-3 sm:mr-2" />
                    <span className="hidden sm:inline">Invite</span>
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    <UserPlus className="h-3 w-3 sm:mr-2" />
                    <span className="hidden sm:inline">Create</span>
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
            {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-2">
              <Users className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No users found</p>
              <p className="text-sm text-muted-foreground">
                {workspaceUsers.length === 0 
                  ? 'No users are added to this workspace yet' 
                  : 'No users match your current filters'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {filteredUsers.map((userItem) => {
                const user = userItem.user;
                const role = userItem.role;
                const joinedAt = userItem.joinedAt;
                
                // Helper function to get role badge styling
                const getRoleBadgeStyle = (role: string) => {
                  switch (role) {
                    case 'owner':
                      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
                    case 'admin':
                      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
                    case 'member':
                      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
                    default:
                      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
                  }
                };

                // Get card border style based on role
                const getCardBorderStyle = (role: string) => {
                  switch (role) {
                    case 'owner':
                      return 'border-yellow-200 dark:border-yellow-800/50 bg-yellow-50/30 dark:bg-yellow-900/5';
                    case 'admin':
                      return 'border-blue-200 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-900/5';
                    case 'member':
                      return 'border-gray-200 dark:border-gray-800/50 bg-gray-50/30 dark:bg-gray-900/5';
                    default:
                      return 'border-border/30';
                  }
                };

                return (
                  <Card key={user.id} className={`card-interactive border ${getCardBorderStyle(role)}`}>
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <h3 className="font-medium text-sm truncate">{user.name}</h3>
                              {role === 'owner' && <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            {user.jobTitle && <p className="text-xs text-muted-foreground truncate">{user.jobTitle}</p>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <Badge className={`text-xs px-1.5 py-0.5 ${getRoleBadgeStyle(role)}`}>
                            {role}
                          </Badge>
                          {/* Workspace Badge for system-wide view */}
                          {isOwner && currentWorkspace?.workspaceType === 'main' && !userItem.isFromCurrentWorkspace && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-muted">
                              Other
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0.5">
                            {user.status}
                          </Badge>
                        </div>
                        
                        {/* Workspace info for system-wide view */}
                        {isOwner && currentWorkspace?.workspaceType === 'main' && (
                          <div className="text-xs text-muted-foreground">
                            <span>WS: </span>
                            <span className="font-medium">
                              {userItem.isFromCurrentWorkspace ? 'Current' : user.workspaceId?.slice(-8) || 'Unknown'}
                            </span>
                          </div>
                        )}
                        
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="text-muted-foreground">Active: </span>
                            <span className="font-medium">
                              {user.lastActive ? (
                                user.lastActive.toDate ? 
                                  user.lastActive.toDate().toLocaleDateString() : 
                                  new Date(user.lastActive).toLocaleDateString()
                              ) : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Joined: </span>
                            <span className="font-medium">
                              {user.createdAt ? (
                                user.createdAt.toDate ? 
                                  user.createdAt.toDate().toLocaleDateString() : 
                                  new Date(user.createdAt).toLocaleDateString()
                              ) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1 pt-2 border-t border-border">
                        {(isOwner || (permissions.canAssignUserRoles && role !== 'owner')) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 h-7 text-xs px-2"
                            onClick={() => openChangeRoleDialog(userItem)}
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Role
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 h-7 text-xs px-2" 
                          onClick={() => handleEditUser(userItem)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 h-7 text-xs px-2" 
                          onClick={() => handleUserSettings(userItem)}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          More
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
                    {/* Loading State */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="card-interactive">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Team Members Section */}
              {(() => {
                const nonOwners = filteredUsers.filter(userItem => userItem.role !== 'owner');
                const admins = nonOwners.filter(userItem => userItem.role === 'admin');
                const members = nonOwners.filter(userItem => userItem.role === 'member');
                
                if (nonOwners.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">No team members found</p>
                      <p className="text-xs text-muted-foreground">
                        {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                          ? 'Try adjusting your search filters' 
                          : 'Invite users to get started'
                        }
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Team Members</h3>
                        <Badge variant="outline" className="text-xs">
                          {admins.length} Admin{admins.length !== 1 ? 's' : ''} • {members.length} Member{members.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {nonOwners.map((userItem) => {
                        const user = userItem.user;
                        const role = userItem.role;
                        const joinedAt = userItem.joinedAt;
                        
                        // Helper function to get role badge styling
                        const getRoleBadgeStyle = (role: string) => {
                          switch (role) {
                            case 'admin':
                              return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
                            case 'member':
                              return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
                            default:
                              return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
                          }
                        };

                        // Get card border style based on role
                        const getCardBorderStyle = (role: string) => {
                          switch (role) {
                            case 'admin':
                              return 'border-blue-200 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-900/5';
                            case 'member':
                              return 'border-gray-200 dark:border-gray-800/50 bg-gray-50/30 dark:bg-gray-900/5';
                            default:
                              return 'border-border/30';
                          }
                        };

                        return (
                          <Card key={user.id} className={`card-interactive border ${getCardBorderStyle(role)}`}>
                            <CardHeader className="p-3 pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                                      {user.firstName?.[0]}{user.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                      <h3 className="font-medium text-sm truncate">{user.name}</h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    {user.jobTitle && <p className="text-xs text-muted-foreground truncate">{user.jobTitle}</p>}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-end gap-1">
                                  <Badge className={`text-xs px-1.5 py-0.5 ${getRoleBadgeStyle(role)}`}>
                                    {role}
                                  </Badge>
                                  {/* Workspace Badge for system-wide view */}
                                  {isOwner && currentWorkspace?.workspaceType === 'main' && !userItem.isFromCurrentWorkspace && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-muted">
                                      Other
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-1">
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Status:</span>
                                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0.5">
                                    {user.status}
                                  </Badge>
                                </div>
                                
                                {/* Workspace info for system-wide view */}
                                {isOwner && currentWorkspace?.workspaceType === 'main' && (
                                  <div className="text-xs text-muted-foreground">
                                    <span>WS: </span>
                                    <span className="font-medium">
                                      {userItem.isFromCurrentWorkspace ? 'Current' : user.workspaceId?.slice(-8) || 'Unknown'}
                                    </span>
                                  </div>
                                )}
                                
                                {joinedAt && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <span>Active: {new Date(joinedAt.toDate?.() || joinedAt).toLocaleDateString()}</span>
                                  </div>
                                )}

                                <div className="flex gap-1 pt-2 border-t border-border">
                                  {(isOwner || (permissions.canAssignUserRoles && role !== 'owner')) && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="flex-1 h-7 text-xs px-2"
                                      onClick={() => openChangeRoleDialog(userItem)}
                                    >
                                      <Shield className="h-3 w-3 mr-1" />
                                      Role
                                    </Button>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 h-7 text-xs px-2" 
                                    onClick={() => handleEditUser(userItem)}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 h-7 text-xs px-2" 
                                    onClick={() => handleUserSettings(userItem)}
                                  >
                                    <Settings className="h-3 w-3 mr-1" />
                                    More
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </TabsContent>

        </Tabs>

      {/* Change Role Modal */}
      <Dialog open={isChangeRoleOpen} onOpenChange={setIsChangeRoleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                  {selectedUser?.user.avatar}
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
            
            {user?.uid === selectedUser?.user.id && roleForm.newRole !== 'owner' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <div>
                  <p className="text-sm">
                    You are changing your own role. This may remove your ability to manage users.
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
              onClick={handleChangeRole}
              disabled={submitting || roleForm.currentRole === roleForm.newRole || !canChangeUserRole(selectedUser?.role)}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                {inviteForm.role === 'owner' && (
                  <p className="text-xs text-muted-foreground">
                    Owner role requires workspace transfer after user joins as Admin
                  </p>
                )}
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

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to the invitation"
                value={inviteForm.message}
                onChange={(e) => setInviteForm({...inviteForm, message: e.target.value})}
                rows={2}
                className="resize-none"
              />
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
              onClick={handleInviteUsers}
              disabled={submitting || !inviteForm.emails.trim()}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Directly Dialog */}
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

            {/* Form Fields in 3 Columns */}
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

                {/* Add Password Option */}
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
                                : createUserForm.teamIds.filter(id => id !== team.id);
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
              onClick={handleCreateUser}
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
            {/* User Header - Compact */}
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

            {/* Form Fields in 3 Columns */}
            <div className="grid grid-cols-3 gap-4">
              {/* Column 1: Personal Information */}
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

              {/* Column 2: Work Information */}
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

              {/* Column 3: Team Information */}
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
                                : editUserForm.teamIds.filter(id => id !== team.id);
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
              onClick={handleUpdateUser}
              disabled={submitting || !editUserForm.firstName || !editUserForm.lastName || !editUserForm.email}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
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
            {/* User Header */}
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

            {/* Settings Options */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Account Actions</div>
              
                             <Button 
                 variant="outline" 
                 className="w-full justify-start"
                 onClick={handleResetPassword}
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
                  onClick={handleDeactivateUser}
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
                  onClick={async () => {
                    try {
                      setSubmitting(true);
                      await UserService.updateUser(selectedUser.user.id, { status: 'active' });
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
                  }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  Reactivate User
                </Button>
              )}

              <div className="border-t pt-3">
                <div className="text-sm font-medium text-foreground mb-2">Danger Zone</div>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={async () => {
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
                  }}
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
    </div>
  );
}
