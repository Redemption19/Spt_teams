'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Building, UserCheck, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useIsAdminOrOwner } from '@/lib/rbac-hooks';
import { DepartmentService, type Department, type DepartmentUser } from '@/lib/department-service';
import { UserService } from '@/lib/user-service';
import { type User } from '@/lib/types';
import DeleteDepartmentAlertDialog from '@/components/folders/dialogs/DeleteDepartmentAlertDialog'; // Keep this as is if it's already a separate component
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { useDeleteDialog } from '@/components/ui/delete-dialog';

import { DepartmentStats } from './DepartmentStats';
import { DepartmentCard } from './DepartmentCard';
import { CreateDepartmentDialog } from './dialogs/CreateDepartmentDialog';
import { EditDepartmentDialog } from './dialogs/EditDepartmentDialog';
import { ViewMembersDialog } from './dialogs/ViewMembersDialog';
import { AssignMembersDialog } from './dialogs/AssignMembersDialog';
import { UnassignedUsersList } from './UnassignedUsersList';
import { DepartmentLoadingSkeleton } from './DepartmentLoadingSkeleton';
import { PerformanceMonitor } from './PerformanceMonitor';

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

  // Delete dialog for member removal
  const {
    isOpen: isDeleteMemberOpen,
    openDialog: openDeleteMemberDialog,
    closeDialog: closeDeleteMemberDialog,
    handleConfirm: confirmDeleteMember,
    isLoading: isDeletingMember,
    item: itemToDelete
  } = useDeleteDialog();
  const [memberToRemove, setMemberToRemove] = useState<{userId: string, departmentName: string} | null>(null);

  // Form states for Create/Edit
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    headId: 'none',
    color: '#3B82F6',
    status: 'active' as 'active' | 'inactive',
  });

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Optimized data loading with parallel processing and caching
  const loadData: () => Promise<void> = useCallback(async () => {
    if (!user?.uid) return;
    const workspaceIds = (isAdminOrOwner && showAllWorkspaces && accessibleWorkspaces?.length)
      ? accessibleWorkspaces.map(w => w.id)
      : currentWorkspace?.id ? [currentWorkspace.id] : [];
    if (workspaceIds.length === 0) return;

    try {
      setLoading(true);
      
      // Load all workspace data in parallel instead of sequentially
      const workspacePromises = workspaceIds.map(async (wsId) => {
        const wsObj = accessibleWorkspaces?.find(w => w.id === wsId) || currentWorkspace;
        
        try {
          // Load departments and users in parallel for each workspace
          const [depts, workspaceUsers] = await Promise.all([
            DepartmentService.getWorkspaceDepartments(wsId),
            UserService.getUsersByWorkspace(wsId)
          ]);

          // Add workspace metadata
          const departmentsWithMeta = depts.map(dept => ({
            ...dept,
            _workspaceName: wsObj?.name || 'Workspace',
            _workspaceId: wsId
          }));

          return {
            departments: departmentsWithMeta,
            users: workspaceUsers,
            workspaceId: wsId
          };
        } catch (error) {
          console.warn(`Failed to load data for workspace ${wsId}:`, error);
          return {
            departments: [],
            users: [],
            workspaceId: wsId
          };
        }
      });

      // Wait for all workspace data to load in parallel
      const workspaceResults = await Promise.all(workspacePromises);
      
      // Combine results efficiently
      const allDepartments: Department[] = [];
      const allUsers: User[] = [];
      const userIdSet = new Set<string>();
      const departmentIdSet = new Set<string>();

      workspaceResults.forEach(({ departments, users }) => {
        departments.forEach(dept => {
          if (!departmentIdSet.has(dept.id)) {
            departmentIdSet.add(dept.id);
            allDepartments.push(dept);
          }
        });
        
        users.forEach(user => {
          if (!userIdSet.has(user.id)) {
            userIdSet.add(user.id);
            allUsers.push(user);
          }
        });
      });

      // Load department members efficiently using batch loading
      const allMemberPromises = workspaceResults.map(async ({ departments, workspaceId }) => {
        if (departments.length === 0) return {};
        
        try {
          const departmentIds = departments.map(d => d.id);
          return await DepartmentService.getBatchDepartmentMembers(workspaceId, departmentIds);
        } catch (error) {
          console.warn(`Failed to batch load members for workspace ${workspaceId}:`, error);
          return {};
        }
      });

      const allMemberResults = await Promise.all(allMemberPromises);
      const allMembers: {[key: string]: DepartmentUser[]} = {};
      
      allMemberResults.forEach(memberMap => {
        Object.assign(allMembers, memberMap);
      });

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
  }, [user?.uid, isAdminOrOwner, showAllWorkspaces, accessibleWorkspaces, currentWorkspace, toast]);

  // Optimized effect with stable dependencies
  const workspaceIdsString = useMemo(() => 
    accessibleWorkspaces?.map(w => w.id).sort().join(',') || '', 
    [accessibleWorkspaces]
  );

  useEffect(() => {
    loadData();
  }, [currentWorkspace?.id, user?.uid, showAllWorkspaces, workspaceIdsString, loadData]);

  // Optimized memoized values with reduced dependencies
  const currentUserProfile = useMemo(() => 
    users.find(u => u.email === user?.email), 
    [users, user?.email]
  );
  
  const userDepartment = useMemo(() => 
    currentUserProfile?.departmentId
      ? departments.find(d => d.id === currentUserProfile.departmentId)
      : null, 
    [currentUserProfile?.departmentId, departments]
  );

  // Optimized department filtering with better search performance
  const filteredDepartments = useMemo(() => {
    const departmentsToFilter = isAdminOrOwner ? departments : (userDepartment ? [userDepartment] : []);
    
    if (!searchTerm) return departmentsToFilter;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return departmentsToFilter.filter(dept =>
      dept.name.toLowerCase().includes(lowerSearchTerm) ||
      (dept.description && dept.description.toLowerCase().includes(lowerSearchTerm))
    );
  }, [isAdminOrOwner, departments, userDepartment, searchTerm]);

  // Optimized unassigned users calculation
  const unassignedUsers = useMemo(() => 
    users.filter(user => !user.departmentId || user.departmentId === '' || user.departmentId === 'none'), 
    [users]
  );

  // Handle create department
  const handleCreateDepartment = async () => {
    if (!user || !currentWorkspace?.id) return;

    try {
      setSubmitting(true);
      if (!departmentForm.name.trim()) {
        toast({ title: 'Error', description: 'Department name is required', variant: 'destructive' });
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
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
      setIsCreateOpen(false);
      setDepartmentForm({ name: '', description: '', headId: 'none', color: '#3B82F6', status: 'active' });
      await loadData();
    } catch (error: any) {
      console.error('Error creating department:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create department. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit department - opens the dialog and populates form
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

  // Handle update department - called from EditDepartmentDialog
  const handleUpdateDepartment = async () => {
    if (!selectedDepartment || !user || !currentWorkspace?.id) return;

    try {
      setSubmitting(true);
      if (!departmentForm.name.trim()) {
        toast({ title: 'Error', description: 'Department name is required', variant: 'destructive' });
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
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
      setIsEditOpen(false);
      setSelectedDepartment(null);
      await loadData();
    } catch (error: any) {
      console.error('Error updating department:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update department. Please try again.', variant: 'destructive' });
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
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
      setIsDeleteOpen(false);
      setDepartmentToDelete(null);
      await loadData();
    } catch (error: any) {
      console.error('Error deleting department:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete department. Please try again.', variant: 'destructive' });
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
    setSelectedUserIds([]); // Clear previous selections
    setIsAssignMembersOpen(true);
  };

  // Handle member assignment
  const handleConfirmAssignMembers = async () => {
    if (!selectedDepartment || !currentWorkspace?.id || selectedUserIds.length === 0) return;

    try {
      setSubmitting(true);
      for (const userId of selectedUserIds) {
        await UserService.updateUser(userId, {
          department: selectedDepartment.name, // Old field for backward compatibility
          departmentId: selectedDepartment.id,
        });
      }
      await DepartmentService.updateDepartmentMemberCounts(currentWorkspace.id); // Sync counts
      toast({ 
        title: 'Success', 
        description: `${selectedUserIds.length} member(s) assigned to ${selectedDepartment.name}`,
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
      setIsAssignMembersOpen(false);
      setSelectedUserIds([]);
      await loadData();
    } catch (error) {
      console.error('Error assigning members:', error);
      toast({ title: 'Error', description: 'Failed to assign members. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle remove member from department
  const handleRemoveMember = async (userId: string, departmentName: string) => {
    if (!currentWorkspace?.id) return;

    const user = users.find(u => u.id === userId);
    const memberItem = {
      id: userId,
      name: user?.name || 'Unknown User',
      type: 'Member'
    };
    
    setMemberToRemove({ userId, departmentName });
    openDeleteMemberDialog(memberItem);
  };

  // Confirm remove member from department
  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !currentWorkspace?.id) return;

    try {
      await UserService.updateUser(memberToRemove.userId, {
        department: undefined,
        departmentId: undefined,
      });
      await DepartmentService.updateDepartmentMemberCounts(currentWorkspace.id); // Sync counts
      toast({ 
        title: 'Success', 
        description: 'Member removed from department',
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
      await loadData();
      setMemberToRemove(null);
    } catch (error) {
      console.error('Error removing member:', error);
      toast({ title: 'Error', description: 'Failed to remove member. Please try again.', variant: 'destructive' });
      throw error; // Re-throw to let useDeleteDialog handle the error state
    }
  };

  // Optimized statistics calculation with caching
  const departmentStats = useMemo(() => {
    if (isAdminOrOwner) {
      const activeDepts = departments.filter(d => d.status === 'active');
      const usersWithDepartments = users.filter(user => 
        user.departmentId && departments.some(dept => dept.id === user.departmentId)
      );
      const deptsWithHeads = departments.filter(d => d.headId && d.headId !== 'none');
      
      return {
        totalDepartments: departments.length,
        activeDepartments: activeDepts.length,
        totalMembers: usersWithDepartments.length,
        departmentsWithHeads: deptsWithHeads.length,
      };
    } else {
      return {
        totalDepartments: userDepartment ? 1 : 0,
        activeDepartments: userDepartment?.status === 'active' ? 1 : 0,
        totalMembers: userDepartment ? (userDepartment.memberCount || 0) : 0,
        departmentsWithHeads: userDepartment?.headId && userDepartment.headId !== 'none' ? 1 : 0,
      };
    }
  }, [isAdminOrOwner, departments, users, userDepartment]);

  // Show loading skeleton for better UX
  if (loading) {
    return <DepartmentLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
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
        {/* Header Actions: Group Create Department and Workspace Toggle */}
        {isAdminOrOwner && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto sm:items-center sm:justify-end">
            <Button
              className="w-full sm:w-auto h-11 sm:h-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Create Department</span>
              <span className="sm:hidden">New</span>
            </Button>
            {accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
              <div className="flex items-center">
                <button
                  onClick={() => setShowAllWorkspaces(!showAllWorkspaces)}
                  className={`flex items-center space-x-2 text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto justify-center px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800/50` + (showAllWorkspaces ? ' text-green-700 dark:text-green-400' : ' text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400')}
                >
                  <span className="text-base">{showAllWorkspaces ? '🌍' : '🏢'}</span>
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
      <DepartmentStats stats={departmentStats} />

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
          {filteredDepartments.length === 0 ? (
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
                <DepartmentCard
                  key={department.id}
                  department={department}
                  isAdminOrOwner={isAdminOrOwner}
                  showAllWorkspaces={showAllWorkspaces}
                  accessibleWorkspaces={accessibleWorkspaces}
                  isMyDepartment={userDepartment?.id === department.id}
                  onViewMembers={handleViewMembers}
                  onAssignMembers={handleAssignMembers}
                  onEditDepartment={handleEditDepartment}
                  onDeleteDepartment={handleDeleteDepartment}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {isAdminOrOwner && (
          <TabsContent value="unassigned">
            <UnassignedUsersList unassignedUsers={unassignedUsers} />
          </TabsContent>
        )}
      </Tabs>

      {/* Dialogs */}
      <CreateDepartmentDialog
        isOpen={isCreateOpen}
        setIsOpen={setIsCreateOpen}
        departmentForm={departmentForm}
        setDepartmentForm={setDepartmentForm}
        handleCreateDepartment={handleCreateDepartment}
        submitting={submitting}
        users={users}
      />

      <EditDepartmentDialog
        isOpen={isEditOpen}
        setIsOpen={setIsEditOpen}
        departmentForm={departmentForm}
        setDepartmentForm={setDepartmentForm}
        handleUpdateDepartment={handleUpdateDepartment}
        submitting={submitting}
        users={users}
      />

      <ViewMembersDialog
        isOpen={isMembersOpen}
        setIsOpen={setIsMembersOpen}
        selectedDepartment={selectedDepartment}
        departmentMembers={departmentMembers}
        isAdminOrOwner={isAdminOrOwner}
        handleRemoveMember={handleRemoveMember}
      />

      <AssignMembersDialog
        isOpen={isAssignMembersOpen}
        setIsOpen={setIsAssignMembersOpen}
        selectedDepartment={selectedDepartment}
        unassignedUsers={unassignedUsers}
        selectedUserIds={selectedUserIds}
        setSelectedUserIds={setSelectedUserIds}
        handleConfirmAssignMembers={handleConfirmAssignMembers}
        submitting={submitting}
      />

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

      {/* Delete Member Dialog */}
       <DeleteDialog
         isOpen={isDeleteMemberOpen}
         onClose={closeDeleteMemberDialog}
         onConfirm={() => confirmDeleteMember(handleConfirmRemoveMember)}
         title="Remove Member"
         description="This action will remove the member from the department and unassign them."
         item={itemToDelete}
         itemDetails={memberToRemove ? [
           { label: 'Department', value: memberToRemove.departmentName },
           { label: 'Action', value: 'Remove from department' }
         ] : []}
         consequences={[
           'Member will be unassigned from the department',
           'Member will lose department-specific permissions',
           'Member can be reassigned to another department later',
           'This action can be reversed by reassigning the member'
         ]}
         confirmText="REMOVE MEMBER"
         isLoading={isDeletingMember}
         warningLevel="medium"
       />

      {/* Performance Monitor (development only) */}
      <PerformanceMonitor />
    </div>
  );
}