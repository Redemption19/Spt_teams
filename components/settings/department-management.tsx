'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus,
  Building,
  Users,
  Crown,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertCircle,
  UserCheck,
  UserPlus,
  UserMinus,
  Loader2,
  Search,
  Settings,
  Eye,
  ArrowUpDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useIsAdminOrOwner } from '@/lib/rbac-hooks';
import { DepartmentService, type Department, type DepartmentUser } from '@/lib/department-service';
import { UserService } from '@/lib/user-service';
import { type User } from '@/lib/types';
import DeleteDepartmentAlertDialog from '@/components/folders/dialogs/DeleteDepartmentAlertDialog';

export function DepartmentManagement() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  const isAdminOrOwner = useIsAdminOrOwner();

  // Cross-workspace management state for owners
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);

  // States
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departmentMembers, setDepartmentMembers] = useState<{[key: string]: DepartmentUser[]}>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isAssignMembersOpen, setIsAssignMembersOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

  // Form states
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    headId: 'none',
    color: '#3B82F6',
    status: 'active' as 'active' | 'inactive',
  });

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Load data with cross-workspace support
  const loadData = async () => {
    if (!user?.uid) return;
    const workspaceIds = (isAdminOrOwner && showAllWorkspaces && accessibleWorkspaces?.length)
      ? accessibleWorkspaces.map(w => w.id)
      : currentWorkspace?.id ? [currentWorkspace.id] : [];
    if (workspaceIds.length === 0) return;
    try {
      setLoading(true);
      let allDepartments: Department[] = [];
      let allUsers: User[] = [];
      let allMembers: {[key: string]: DepartmentUser[]} = {};
      for (const wsId of workspaceIds) {
        const wsObj = accessibleWorkspaces?.find(w => w.id === wsId) || currentWorkspace;
      const [depts, workspaceUsers] = await Promise.all([
          DepartmentService.getWorkspaceDepartments(wsId),
          UserService.getUsersByWorkspace(wsId)
        ]);
        // Attach workspace info to each department for badge
        depts.forEach(dept => {
          (dept as any)._workspaceName = wsObj?.name || 'Workspace';
          (dept as any)._workspaceId = wsId;
          if (!allDepartments.some(d => d.id === dept.id)) {
            allDepartments.push(dept);
          }
        });
        workspaceUsers.forEach(user => {
          if (!allUsers.some(u => u.id === user.id)) {
            allUsers.push(user);
          }
        });
      // Load members for each department
      for (const dept of depts) {
          const members = await DepartmentService.getDepartmentMembers(wsId, dept.id);
          allMembers[dept.id] = members;
        }
      }
      setDepartments(allDepartments);
      setUsers(allUsers);
      setDepartmentMembers(allMembers);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load departments. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentWorkspace?.id, user?.uid, showAllWorkspaces, accessibleWorkspaces?.map(w => w.id).join(',')]);

  // Get current user's department info for members
  const currentUserProfile = users.find(u => u.email === user?.email);
  const userDepartment = currentUserProfile?.departmentId 
    ? departments.find(d => d.id === currentUserProfile.departmentId)
    : null;

  // Filter departments based on user role
  const filteredDepartments = isAdminOrOwner 
    ? departments.filter(dept => 
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : userDepartment 
      ? [userDepartment].filter(dept => 
          dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : []; // No departments if member is not assigned to any

  // Get unassigned users (prioritize departmentId for new system)
  const unassignedUsers = users.filter(user => {
    // In the new system, we use departmentId. Users without departmentId are considered unassigned
    // even if they have old department string values from the previous system
    const hasNoDepartmentId = !user.departmentId || user.departmentId === '' || user.departmentId === 'none';
    return hasNoDepartmentId;
  });

  // Handle create department
  const handleCreateDepartment = async () => {
    if (!user || !currentWorkspace?.id) return;

    try {
      setSubmitting(true);

      if (!departmentForm.name.trim()) {
        toast({
          title: 'Error',
          description: 'Department name is required',
          variant: 'destructive',
        });
        return;
      }

      await DepartmentService.createDepartment(
        currentWorkspace.id,
        {
          name: departmentForm.name.trim(),
          description: departmentForm.description.trim(),
          headId: departmentForm.headId === 'none' ? undefined : departmentForm.headId,
          color: departmentForm.color,
        },
        user.uid
      );

      toast({
        title: 'Success',
        description: `Department "${departmentForm.name}" created successfully`,
      });

      setIsCreateOpen(false);
      setDepartmentForm({
        name: '',
        description: '',
        headId: 'none',
        color: '#3B82F6',
        status: 'active',
      });

      await loadData();

    } catch (error: any) {
      console.error('Error creating department:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create department. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit department
  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setDepartmentForm({
      name: department.name,
      description: department.description || '',
      headId: department.headId || 'none',
      color: department.color || '#3B82F6',
      status: department.status,
    });
    setIsEditOpen(true);
  };

  // Handle update department
  const handleUpdateDepartment = async () => {
    if (!selectedDepartment || !user || !currentWorkspace?.id) return;

    try {
      setSubmitting(true);

      if (!departmentForm.name.trim()) {
        toast({
          title: 'Error',
          description: 'Department name is required',
          variant: 'destructive',
        });
        return;
      }

      await DepartmentService.updateDepartment(
        currentWorkspace.id,
        selectedDepartment.id,
        {
          name: departmentForm.name.trim(),
          description: departmentForm.description.trim(),
          headId: departmentForm.headId === 'none' ? undefined : departmentForm.headId,
          color: departmentForm.color,
          status: departmentForm.status,
        },
        user.uid
      );

      toast({
        title: 'Success',
        description: `Department "${departmentForm.name}" updated successfully`,
      });

      setIsEditOpen(false);
      setSelectedDepartment(null);
      await loadData();

    } catch (error: any) {
      console.error('Error updating department:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update department. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete department - opens the custom dialog
  const handleDeleteDepartment = (department: Department) => {
    setDepartmentToDelete(department);
    setIsDeleteOpen(true);
  };

  // Confirm delete department - actual deletion logic
  const confirmDeleteDepartment = async () => {
    if (!departmentToDelete || !user || !currentWorkspace?.id) return;

    try {
      setSubmitting(true);

      await DepartmentService.deleteDepartment(currentWorkspace.id, departmentToDelete.id, user.uid);

      toast({
        title: 'Success',
        description: `Department "${departmentToDelete.name}" deleted successfully`,
      });

      setIsDeleteOpen(false);
      setDepartmentToDelete(null);
      await loadData();

    } catch (error: any) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete department. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle view department members
  const handleViewMembers = (department: Department) => {
    setSelectedDepartment(department);
    setIsMembersOpen(true);
  };

  // Handle assign members to department
  const handleAssignMembers = (department: Department) => {
    setSelectedDepartment(department);
    setSelectedUserIds([]);
    setIsAssignMembersOpen(true);
  };

  // Handle member assignment
  const handleConfirmAssignMembers = async () => {
    if (!selectedDepartment || !currentWorkspace?.id || selectedUserIds.length === 0) return;

    try {
      setSubmitting(true);

      // Update users with department assignment
      for (const userId of selectedUserIds) {
        await UserService.updateUser(userId, {
          department: selectedDepartment.name,
          departmentId: selectedDepartment.id,
        });
      }

      // Update department member counts
      await DepartmentService.updateDepartmentMemberCounts(currentWorkspace.id);

      toast({
        title: 'Success',
        description: `${selectedUserIds.length} member(s) assigned to ${selectedDepartment.name}`,
      });

      setIsAssignMembersOpen(false);
      setSelectedUserIds([]);
      await loadData();

    } catch (error) {
      console.error('Error assigning members:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign members. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle remove member from department
  const handleRemoveMember = async (userId: string, departmentName: string) => {
    if (!currentWorkspace?.id) return;

    if (window.confirm(`Remove this member from ${departmentName}?`)) {
      try {
        setSubmitting(true);

        await UserService.updateUser(userId, {
          department: undefined,
          departmentId: undefined,
        });

        // Update department member counts
        await DepartmentService.updateDepartmentMemberCounts(currentWorkspace.id);

        toast({
          title: 'Success',
          description: 'Member removed from department',
        });

        await loadData();

      } catch (error) {
        console.error('Error removing member:', error);
        toast({
          title: 'Error',
          description: 'Failed to remove member. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Create sample departments
  const createSampleDepartments = async () => {
    if (!user?.uid || !currentWorkspace?.id) return;

    if (departments.length > 0) {
      toast({
        title: 'Info',
        description: 'You already have departments. Sample departments are not needed.',
      });
      return;
    }

    try {
      setSubmitting(true);
      await DepartmentService.createSampleDepartments(currentWorkspace.id, user.uid);
      
      toast({
        title: 'Sample Data Created',
        description: 'Sample departments have been added to help you get started.',
      });

      await loadData();
    } catch (error) {
      console.error('Error creating sample departments:', error);
      toast({
        title: 'Error',
        description: 'Failed to create sample departments.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Manual sync to fix existing department counts
  const syncDepartmentCounts = async () => {
    if (!user?.uid || !currentWorkspace?.id) return;

    try {
      setSubmitting(true);
      
      // Update all department member counts
      await DepartmentService.updateDepartmentMemberCounts(currentWorkspace.id);
      
      toast({
        title: 'Success',
        description: 'Department member counts have been synchronized.',
      });

      await loadData();
    } catch (error) {
      console.error('Error syncing department counts:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync department counts.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate real-time statistics (different for members vs admins)
  const departmentStats = isAdminOrOwner ? {
    totalDepartments: departments.length,
    activeDepartments: departments.filter(d => d.status === 'active').length,
    // Count users who have departmentId assigned to any department
    totalMembers: users.filter(user => user.departmentId && departments.some(dept => dept.id === user.departmentId)).length,
    // Count departments that have a headId assigned
    departmentsWithHeads: departments.filter(d => d.headId && d.headId !== 'none').length,
  } : {
    // For members, show stats only for their department
    totalDepartments: userDepartment ? 1 : 0,
    activeDepartments: userDepartment?.status === 'active' ? 1 : 0,
    totalMembers: userDepartment ? (userDepartment.memberCount || 0) : 0,
    departmentsWithHeads: userDepartment?.headId && userDepartment.headId !== 'none' ? 1 : 0,
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Header and Cross-Workspace Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {isAdminOrOwner ? 'Department Management' : 'Departments'}
            {isAdminOrOwner && showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
              <span className="ml-2 text-green-600 dark:text-green-400 text-lg align-middle">🌐</span>
            )}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            {isAdminOrOwner 
              ? 'Create and manage departments for your workspace'
              : 'View departments and team members in your workspace'
            }
          </p>
        </div>
        {/* Cross-workspace toggle for owners */}
        {isAdminOrOwner && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
          <div className="flex items-center space-x-2 px-2 py-1 sm:px-3 sm:py-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800/50 w-full sm:w-auto">
            <button
              onClick={() => setShowAllWorkspaces(!showAllWorkspaces)}
              className={`flex items-center space-x-2 text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto justify-center ${
                showAllWorkspaces 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400'
              }`}
            >
              <span className="text-base">{showAllWorkspaces ? '🌐' : '🏢'}</span>
              <span>
                {showAllWorkspaces 
                  ? `All Workspaces (${accessibleWorkspaces.length})` 
                  : 'Current Workspace'
                }
              </span>
            </button>
          </div>
        )}
                  </div>

      {/* Cross-workspace scope banner for owners */}
      {isAdminOrOwner && showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
        <div className="p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800/50 text-xs sm:text-sm">
          <p className="text-green-700 dark:text-green-400">
            🌐 <strong>Cross-Workspace Departments:</strong> Viewing and managing departments across all {accessibleWorkspaces.length} accessible workspaces. Departments and members from all workspaces are displayed together for centralized management.
          </p>
                  </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Departments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl sm:text-2xl font-bold">{departmentStats.totalDepartments}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Active Departments</CardTitle>
            <Building className="h-4 w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl sm:text-2xl font-bold">{departmentStats.activeDepartments}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl sm:text-2xl font-bold">{departmentStats.totalMembers}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">With Heads</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl sm:text-2xl font-bold">{departmentStats.departmentsWithHeads}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Departments and Unassigned Users */}
      <Tabs defaultValue="departments" className="space-y-3 sm:space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-full sm:w-auto flex flex-row">
            <TabsTrigger value="departments" className="flex-1 sm:flex-initial text-xs sm:text-sm">
              <span>Departments</span>
            </TabsTrigger>
            {isAdminOrOwner && (
              <TabsTrigger value="unassigned" className="flex-1 sm:flex-initial text-xs sm:text-sm">
                <span>Unassigned ({unassignedUsers.length})</span>
              </TabsTrigger>
            )}
          </TabsList>
          <div className="relative w-full sm:max-w-sm mt-2 sm:mt-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-xs sm:text-sm"
            />
          </div>
        </div>

        <TabsContent value="departments">
          {/* Departments List */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {!isAdminOrOwner && !userDepartment 
                  ? "You haven't been assigned to a department yet"
                  : "No departments found"
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {!isAdminOrOwner && !userDepartment 
                  ? "Please contact your administrator to be assigned to a department."
                  : searchTerm 
                    ? 'No departments match your search.' 
                    : 'Get started by creating your first department.'
                }
              </p>
              {!searchTerm && isAdminOrOwner && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Department
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDepartments.map((department) => (
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
                        {!isAdminOrOwner && userDepartment?.id === department.id && (
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
                            <DropdownMenuItem onClick={() => handleViewMembers(department)} className="text-sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Members
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignMembers(department)} className="text-sm">
                              <UserPlus className="h-4 w-4 mr-2" />
                              Assign Members
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditDepartment(department)} className="text-sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteDepartment(department)}
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
              ))}
            </div>
          )}
        </TabsContent>

        {isAdminOrOwner && (
          <TabsContent value="unassigned">
            {/* Unassigned Users */}
            {unassignedUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">All users are assigned</h3>
                <p className="text-muted-foreground">
                  All users in your workspace have been assigned to departments.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {unassignedUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-dept-name">Department Name *</Label>
              <Input
                id="edit-dept-name"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                placeholder="e.g., Finance, HR, Marketing"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dept-description">Description</Label>
              <Textarea
                id="edit-dept-description"
                value={departmentForm.description}
                onChange={(e) => setDepartmentForm({...departmentForm, description: e.target.value})}
                placeholder="Brief description of this department's role"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dept-head">Department Head</Label>
              <Select 
                value={departmentForm.headId} 
                onValueChange={(value) => setDepartmentForm({...departmentForm, headId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department head (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No department head</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dept-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={departmentForm.color}
                  onChange={(e) => setDepartmentForm({...departmentForm, color: e.target.value})}
                  className="w-12 h-8 rounded border"
                />
                <span className="text-sm text-muted-foreground">{departmentForm.color}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dept-status">Status</Label>
              <Select 
                value={departmentForm.status} 
                onValueChange={(value: 'active' | 'inactive') => setDepartmentForm({...departmentForm, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateDepartment}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Department'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Members Dialog */}
      <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDepartment?.name} Members ({selectedDepartment?.memberCount || 0})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {departmentMembers[selectedDepartment?.id || '']?.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {member.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{member.userName}</div>
                    <div className="text-sm text-muted-foreground">{member.userEmail}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{member.userRole}</Badge>
                  {member.departmentRole === 'head' && (
                    <Badge className="bg-yellow-100 text-yellow-800">Head</Badge>
                  )}
                  {isAdminOrOwner && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveMember(member.userId, selectedDepartment?.name || '')}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {(!departmentMembers[selectedDepartment?.id || ''] || departmentMembers[selectedDepartment?.id || ''].length === 0) && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No members in this department</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Members Dialog */}
      <Dialog open={isAssignMembersOpen} onOpenChange={setIsAssignMembersOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Assign Members to {selectedDepartment?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Select users to assign to this department:
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {unassignedUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedUserIds.includes(user.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUserIds([...selectedUserIds, user.id]);
                      } else {
                        setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                </div>
              ))}
              {unassignedUsers.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No unassigned users available</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAssignMembersOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAssignMembers}
              disabled={submitting || selectedUserIds.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                `Assign ${selectedUserIds.length} Member(s)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Department Alert Dialog */}
      <DeleteDepartmentAlertDialog
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
        departmentToDelete={departmentToDelete ? {
          ...departmentToDelete,
          memberCount: departmentMembers[departmentToDelete.id]?.length || departmentToDelete.memberCount || 0,
          headName: departmentToDelete.headId ? users.find(u => u.id === departmentToDelete.headId)?.name : undefined
        } : null}
        confirmDelete={confirmDeleteDepartment}
        isSubmitting={submitting}
      />
    </div>
  );
} 