'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Users,
  Settings,
  Edit,
  Trash2,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Eye
} from 'lucide-react';

import { BranchService } from '@/lib/branch-service';
import { UserService } from '@/lib/user-service';
import { RegionService } from '@/lib/region-service';
import { TeamService } from '@/lib/team-service';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useRolePermissions, useIsOwner } from '@/lib/rbac-hooks';
import { Branch, Region, User, Team } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Assuming you have a Tabs component in your UI library
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // Adjust import based on your actual UI library

import { BranchCard } from './branch-card';
import { RegionCard } from './region-card';
import { ManagerCard } from './manager-card';
import { CreateBranchDialog } from './create-branch-dialog';
import { CreateRegionDialog } from './create-region-dialog';
import { CreateManagerDialog } from './create-manager-dialog';
import { EditBranchDialog } from './edit-branch-dialog';
import { EditRegionDialog } from './edit-region-dialog';
import { EditManagerDialog } from './edit-manager-dialog';
import { ViewBranchDetailsDialog } from './view-branch-details-dialog';
import { ViewRegionDetailsDialog } from './view-region-details-dialog';
import { DeleteBranchDialog } from './delete-branch-dialog';
import { DeleteRegionDialog } from './delete-region-dialog';
import { DeleteManagerDialog } from './delete-manager-dialog';
import { EmptyStateBranches } from './empty-state-branches';
import { EmptyStateRegions } from './empty-state-regions';
import { EmptyStateManagers } from './empty-state-managers';
import { BranchesTabsNavigation } from './branches-tabs-navigation';

// Form data interfaces
interface BranchFormData {
  name: string;
  description: string;
  regionId: string;
  managerId: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  contact: {
    phone: string;
    email: string;
  };
}

interface RegionFormData {
  name: string;
  description: string;
}

interface ManagerFormData {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
}

const INITIAL_BRANCH_FORM: BranchFormData = {
  name: '',
  description: '',
  regionId: '',
  managerId: '',
  address: {
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: ''
  },
  contact: {
    phone: '',
    email: ''
  }
};

const INITIAL_REGION_FORM: RegionFormData = {
  name: '',
  description: ''
};

const INITIAL_MANAGER_FORM: ManagerFormData = {
  name: '',
  email: '',
  phone: '',
  jobTitle: '',
  department: ''
};

export default function BranchesManagement() {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();
  const { user, userProfile } = useAuth();
  const permissions = useRolePermissions();
  const isOwner = useIsOwner();

  // Set initial tab based on current route
  const getInitialTab = () => {
    if (pathname?.includes('/regions')) return 'regions';
    if (pathname?.includes('/managers')) return 'managers'; // New: check for managers path
    return 'branches';
  };
  // State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [managers, setManagers] = useState<(User & { workspaceRole?: string, effectiveRole?: string })[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [error, setError] = useState<string | null>(null);  // Dialog states
  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false);
  const [isCreateRegionOpen, setIsCreateRegionOpen] = useState(false);
  const [isCreateManagerOpen, setIsCreateManagerOpen] = useState(false);
  const [isEditBranchOpen, setIsEditBranchOpen] = useState(false);
  const [isEditRegionOpen, setIsEditRegionOpen] = useState(false);
  const [isEditManagerOpen, setIsEditManagerOpen] = useState(false);
  const [isViewBranchOpen, setIsViewBranchOpen] = useState(false);
  const [isViewRegionOpen, setIsViewRegionOpen] = useState(false);
  const [isDeleteBranchOpen, setIsDeleteBranchOpen] = useState(false);
  const [isDeleteRegionOpen, setIsDeleteRegionOpen] = useState(false);
  const [isDeleteManagerOpen, setIsDeleteManagerOpen] = useState(false);

  // Form states
  const [branchForm, setBranchForm] = useState<BranchFormData>(INITIAL_BRANCH_FORM);
  const [regionForm, setRegionForm] = useState<RegionFormData>(INITIAL_REGION_FORM);
  const [managerForm, setManagerForm] = useState<ManagerFormData>(INITIAL_MANAGER_FORM);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [editingManager, setEditingManager] = useState<User | null>(null);
  const [viewingBranch, setViewingBranch] = useState<Branch | null>(null);
  const [viewingRegion, setViewingRegion] = useState<Region | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [deletingRegion, setDeletingRegion] = useState<Region | null>(null);
  const [deletingManager, setDeletingManager] = useState<User | null>(null);
  const { toast } = useToast();

  // Sync active tab with pathname changes
  useEffect(() => {
    if (pathname?.includes('/regions')) {
      setActiveTab('regions');
    } else if (pathname?.includes('/branches')) {
      setActiveTab('branches');
    } else if (pathname?.includes('/managers')) { // New: handle managers path
      setActiveTab('managers');
    }
  }, [pathname]);

  // Load data
  const loadData = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      setLoading(true);
      setError(null);
      
      // Determine which workspace to load regions/branches from
      // For sub-workspaces, load from parent workspace (same logic as header and user management)
      const sourceWorkspaceId = currentWorkspace.workspaceType === 'sub' 
        ? currentWorkspace.parentWorkspaceId || currentWorkspace.id
        : currentWorkspace.id;
      
      const [branchesData, regionsData, managersData, teamsData, usersData] = await Promise.all([
        BranchService.getBranches(sourceWorkspaceId), // Use sourceWorkspaceId for sub-workspaces
        RegionService.getWorkspaceRegions(sourceWorkspaceId), // Use sourceWorkspaceId for sub-workspaces
        BranchService.getPotentialManagers(currentWorkspace.id), // Load managers from current workspace only
        TeamService.getWorkspaceTeams(currentWorkspace.id), // Teams stay in current workspace
        UserService.getUsersByWorkspace(currentWorkspace.id) // Users stay in current workspace
      ]);

      // Filter regions and branches based on workspace type and user role
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
      } else if (userProfile?.role === 'member') {
        // For members in main workspaces, only show their assigned region and branch
        if (userProfile.regionId) {
          filteredRegions = regionsData.filter(r => r.id === userProfile.regionId);
        } else {
          filteredRegions = [];
        }
        
        if (userProfile.branchId) {
          filteredBranches = branchesData.filter(b => b.id === userProfile.branchId);
        } else {
          filteredBranches = [];
        }
      }

      setBranches(filteredBranches); // Use filtered branches
      setRegions(filteredRegions);   // Use filtered regions
      setManagers(managersData);
      setTeams(teamsData);
      setUsers(usersData);

      console.log('Branches Management - Loaded data:', {
        branches: filteredBranches.length,
        regions: filteredRegions.length,
        managers: managersData.length,
        teams: teamsData.length,
        users: usersData.length,
        currentWorkspaceType: currentWorkspace.workspaceType,
        sourceWorkspaceId: sourceWorkspaceId,
        currentWorkspaceId: currentWorkspace.id,
        boundRegionId: currentWorkspace.regionId,
        boundBranchId: currentWorkspace.branchId,
        isSubWorkspace: currentWorkspace.workspaceType === 'sub'
      });

      console.log('Current workspace ID:', currentWorkspace.id);
      console.log('Teams data:', teamsData.map(t => ({ id: t.id, name: t.name, branchId: t.branchId, workspaceId: t.workspaceId })));
      console.log('Users data:', usersData.map(u => ({ id: u.id, name: u.name, branchId: u.branchId, workspaceId: u.workspaceId })));
      console.log('Branches data:', filteredBranches.map(b => ({ 
        id: b.id, 
        name: b.name, 
        userCount: usersData.filter(u => u.branchId === b.id).length,
        teamCount: teamsData.filter(t => t.branchId === b.id).length
      })));
      console.log('Regions data:', filteredRegions.map(r => ({ id: r.id, name: r.name, workspaceId: r.workspaceId })));
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, userProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync function for fixing existing data
  const syncBranchAssignments = async () => {
    if (!currentWorkspace) return;
    
    try {
      setSubmitting(true);
      await BranchService.syncBranchAssignments(currentWorkspace.id);
      await loadData(); // Reload data after sync
      toast({
        title: "Success",
        description: "Branch assignments synced successfully"
      });
    } catch (err) {
      console.error('Error syncing branch assignments:', err);
      toast({
        title: "Error",
        description: "Failed to sync branch assignments",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered data
  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || branch.regionId === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const filteredRegions = regions.filter(region =>
    region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    region.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredManagers = managers.filter(manager =>
    manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper functions
  const resetBranchForm = () => setBranchForm(INITIAL_BRANCH_FORM);
  const resetRegionForm = () => setRegionForm(INITIAL_REGION_FORM);

  const getRegionName = (regionId: string) => {
    return regions.find(r => r.id === regionId)?.name || 'Unknown Region';
  };
  const getManagerName = (managerId: string) => {
    return managers.find(m => m.id === managerId)?.name || 'No Manager';
  };

  // Email functionality for managers
  const handleEmailManager = (manager: User) => {
    const subject = encodeURIComponent(`Message from ${userProfile?.name || 'Team Member'}`);
    const body = encodeURIComponent(`Hello ${manager.name},\n\nI hope this message finds you well.\n\nBest regards,\n${userProfile?.name || 'Team Member'}\n${userProfile?.email || ''}`);
    const mailtoLink = `mailto:${manager.email}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
  };

  // Branch operations
  const handleCreateBranch = async () => {
    if (!currentWorkspace) {
      toast({ title: "Error", description: "No workspace selected", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);

      if (!branchForm.name || !branchForm.regionId) {
        throw new Error('Name and region are required');
      } 
      const branchData = {
        ...branchForm,
        status: 'active' as const,
        workspaceId: currentWorkspace.id,
        adminIds: [],
        teamIds: [],
        userIds: []
      };

      const branchId = await BranchService.createBranch(branchData, user?.uid);

      // Reload data to get the newly created branch
      await loadData();

      toast({
        title: "Success",
        description: "Branch created successfully"
      });

      setIsCreateBranchOpen(false);
      resetBranchForm();
    } catch (err) {
      console.error('Error creating branch:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create branch",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBranch = async () => {
    if (!editingBranch) return; 
    try {
      setSubmitting(true);

      await BranchService.updateBranch(editingBranch.id, branchForm, user?.uid);

      // Reload data to get the updated branch
      await loadData();

      toast({
        title: "Success",
        description: "Branch updated successfully"
      });

      setIsEditBranchOpen(false);
      setEditingBranch(null);
      resetBranchForm();
    } catch (err) {
      console.error('Error updating branch:', err);
      toast({
        title: "Error",
        description: "Failed to update branch",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBranch = (branch: Branch) => {
    setDeletingBranch(branch);
    setIsDeleteBranchOpen(true);
  };

  const confirmDeleteBranch = async () => {
    if (!deletingBranch) return;

    try {
      setSubmitting(true);
      await BranchService.deleteBranch(deletingBranch.id, user?.uid);
      // Reload data to reflect the deletion
      await loadData();

      toast({
        title: "Success",
        description: "Branch deleted successfully"
      });
    } catch (err) {
      console.error('Error deleting branch:', err);
      toast({
        title: "Error",
        description: "Failed to delete branch",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
      setIsDeleteBranchOpen(false);
      setDeletingBranch(null);
    }
  };  

  // Region operations
  const handleCreateRegion = async () => {
    if (!currentWorkspace) {
      toast({ title: "Error", description: "No workspace selected", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);

      if (!regionForm.name) {
        throw new Error('Name is required');
      } 
      const regionData = {
        ...regionForm,
        workspaceId: currentWorkspace.id,
        branches: [],
        adminIds: []
      };

      const regionId = await RegionService.createRegion(regionData, user?.uid || '');

      // Reload data to get the newly created region
      await loadData();

      toast({
        title: "Success",
        description: "Region created successfully"
      });

      setIsCreateRegionOpen(false);
      resetRegionForm();
    } catch (err) {
      console.error('Error creating region:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create region",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRegion = async () => {
    if (!editingRegion) return; 
    try {
      setSubmitting(true);

      await RegionService.updateRegion(editingRegion.id, regionForm, user?.uid); // Corrected service

      // Reload data to get the updated region
      await loadData();

      toast({
        title: "Success",
        description: "Region updated successfully"
      });

      setIsEditRegionOpen(false);
      setEditingRegion(null);
      resetRegionForm();
    } catch (err) {
      console.error('Error updating region:', err);
      toast({
        title: "Error",
        description: "Failed to update region",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRegion = (region: Region) => {
    setDeletingRegion(region);
    setIsDeleteRegionOpen(true);
  };

  const confirmDeleteRegion = async () => {
    if (!deletingRegion) return;

    try {
      setSubmitting(true);
      await RegionService.deleteRegion(deletingRegion.id, user?.uid); // Corrected service
      // Reload data to reflect the deletion
      await loadData();

      toast({
        title: "Success",
        description: "Region deleted successfully"
      });
    } catch (err) {
      console.error('Error deleting region:', err);
      toast({
        title: "Error",
        description: "Failed to delete region",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
      setIsDeleteRegionOpen(false);
      setDeletingRegion(null);
    }
  };

  // Edit handlers
  const startEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchForm({
      name: branch.name,
      description: branch.description || '',
      regionId: branch.regionId,
      managerId: branch.managerId || '',
      address: {
        street: branch.address?.street || '',
        city: branch.address?.city || '',
        state: branch.address?.state || '',
        country: branch.address?.country || '',
        postalCode: branch.address?.postalCode || ''
      },
      contact: {
        phone: branch.contact?.phone || '',
        email: branch.contact?.email || ''
      }
    });
    setIsEditBranchOpen(true);
  };

  const startEditRegion = (region: Region) => {
    setEditingRegion(region);
    setRegionForm({
      name: region.name,
      description: region.description || ''
    });
    setIsEditRegionOpen(true);
  };

  const startEditManager = (manager: User) => {
    setEditingManager(manager);
    setManagerForm({
      name: manager.name,
      email: manager.email,
      phone: manager.phone || '',
      jobTitle: manager.jobTitle || '',
      department: manager.department || '',
    });
    setIsEditManagerOpen(true);
  };

  // View handlers
  const viewBranchDetails = (branch: Branch) => {
    setViewingBranch(branch);
    setIsViewBranchOpen(true);
  };

  const viewRegionDetails = (region: Region) => {
    setViewingRegion(region);
    setIsViewRegionOpen(true);
  };

  // Create sample data
  const createSampleData = async () => {
    try {
      setSubmitting(true);
      await BranchService.createSampleRegions(currentWorkspace?.id);
      await loadData();
      toast({
        title: "Success",
        description: "Sample regions created successfully"
      });
    } catch (err) {
      console.error('Error creating sample data:', err);
      toast({
        title: "Error",
        description: "Failed to create sample data",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const createSampleManagers = async () => {
    try {
      setSubmitting(true);
      await BranchService.createSampleManagers(currentWorkspace?.id);
      await loadData();
      toast({
        title: "Success",
        description: "Sample managers created successfully"
      });
    } catch (err) {
      console.error('Error creating sample managers:', err);
      toast({
        title: "Error",
        description: "Failed to create sample managers",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Manager operations
  const handleCreateManager = async () => {
    if (!currentWorkspace) {
      toast({ title: "Error", description: "No workspace selected", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);

      if (!managerForm.name || !managerForm.email) {
        throw new Error('Name and email are required');
      }

      // Create a new User object for the manager with only defined values
      const newManager: Omit<User, 'id'> = {
        name: managerForm.name.trim(),
        email: managerForm.email.trim(),
        role: 'admin', // Managers typically have admin role
        status: 'active',
        workspaceId: currentWorkspace.id,
        teamIds: [],
        createdAt: new Date(),
        lastActive: new Date(),
      };

      // Only include optional fields if they have values
      if (managerForm.phone?.trim()) {
        newManager.phone = managerForm.phone.trim();
      }
      if (managerForm.jobTitle?.trim()) {
        newManager.jobTitle = managerForm.jobTitle.trim();
      }
      if (managerForm.department?.trim()) {
        newManager.department = managerForm.department.trim();
      }

      await UserService.createUser(newManager);
      setManagerForm(INITIAL_MANAGER_FORM);
      setIsCreateManagerOpen(false);

      // Reload data to include the new manager
      await loadData();

      toast({
        title: "Success",
        description: "Manager created successfully"
      });
    } catch (err) {
      console.error('Error creating manager:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create manager",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditManager = async () => {
    try {
      setSubmitting(true);

      if (!editingManager || !managerForm.name || !managerForm.email) {
        throw new Error('Name and email are required');
      }

      // Create update object with only defined values to avoid Firestore undefined field errors
      const updateData: Partial<User> = {
        name: managerForm.name,
        email: managerForm.email,
      };

      // Only include optional fields if they have values
      if (managerForm.phone?.trim()) {
        updateData.phone = managerForm.phone.trim();
      }
      if (managerForm.jobTitle?.trim()) {
        updateData.jobTitle = managerForm.jobTitle.trim();
      }
      if (managerForm.department?.trim()) {
        updateData.department = managerForm.department.trim();
      }

      await UserService.updateUser(editingManager.id, updateData);
      setManagerForm(INITIAL_MANAGER_FORM);
      setIsEditManagerOpen(false);
      setEditingManager(null);

      // Reload data to reflect changes
      await loadData();

      toast({
        title: "Success",
        description: "Manager updated successfully"
      });
    } catch (err) {
      console.error('Error updating manager:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update manager",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteManager = (manager: User) => {
    setDeletingManager(manager);
    setIsDeleteManagerOpen(true);
  };

  const confirmDeleteManager = async () => {
    if (!deletingManager) return;

    try {
      setSubmitting(true);

      await UserService.deleteUser(deletingManager.id);
      setIsDeleteManagerOpen(false);
      setDeletingManager(null);

      // Reload data to reflect changes
      await loadData();

      toast({
        title: "Success",
        description: "Manager deleted successfully"
      });
    } catch (err) {
      console.error('Error deleting manager:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete manager",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <div className="flex space-x-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state for all sections if no data
  if (branches.length === 0 && regions.length === 0 && managers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No Data Found</h3>
          <p className="text-muted-foreground">Get started by creating some sample data</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={createSampleData} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Sample Data (Regions & Branches)
          </Button>
          <Button onClick={createSampleManagers} disabled={submitting} variant="outline">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Sample Managers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Branches & Regions
          </h1>
          <p className="text-muted-foreground mt-1">Manage your organization&apos;s regional structure</p>
        </div>
        <div className="flex items-center space-x-3">
          {(isOwner || permissions.canManageBranches) && (
            <CreateRegionDialog
              isOpen={isCreateRegionOpen}
              setIsOpen={setIsCreateRegionOpen}
              regionForm={regionForm}
              setRegionForm={setRegionForm}
              handleCreateRegion={handleCreateRegion}
              submitting={submitting}
            />
          )}

          {(isOwner || permissions.canManageBranches) && (
            <CreateBranchDialog
              isOpen={isCreateBranchOpen}
              setIsOpen={setIsCreateBranchOpen}
              branchForm={branchForm}
              setBranchForm={setBranchForm}
              regions={regions}
              managers={managers}
              handleCreateBranch={handleCreateBranch}
              submitting={submitting}
              setIsCreateRegionOpen={setIsCreateRegionOpen}
            />
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <BranchesTabsNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          branchesLength={branches.length}
          regionsLength={regions.length}
          managersLength={managers.length}
          syncBranchAssignments={syncBranchAssignments}
          submitting={submitting}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          regions={regions}
          isOwner={isOwner}
          canManageBranches={permissions.canManageBranches}
          isCreateManagerOpen={isCreateManagerOpen}
          setIsCreateManagerOpen={setIsCreateManagerOpen}
          managerForm={managerForm}
          setManagerForm={setManagerForm}
          handleCreateManager={handleCreateManager}
        />

        <TabsContent value="branches" className="mt-0">
          {filteredBranches.length === 0 ? (
            <EmptyStateBranches
              searchTerm={searchTerm}
              selectedRegion={selectedRegion}
              isOwner={isOwner}
              canManageBranches={permissions.canManageBranches}
              setIsCreateBranchOpen={setIsCreateBranchOpen}
              setIsCreateRegionOpen={setIsCreateRegionOpen}
              branchForm={branchForm}
              setBranchForm={setBranchForm}
              regions={regions}
              managers={managers}
              handleCreateBranch={handleCreateBranch}
              submitting={submitting}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBranches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  getRegionName={getRegionName}
                  getManagerName={getManagerName}
                  users={users}
                  teams={teams}
                  viewBranchDetails={viewBranchDetails}
                  startEditBranch={startEditBranch}
                  handleDeleteBranch={handleDeleteBranch}
                  isOwner={isOwner}
                  canManageBranches={permissions.canManageBranches}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="regions" className="mt-0">
          {filteredRegions.length === 0 ? (
            <EmptyStateRegions
              searchTerm={searchTerm}
              isOwner={isOwner}
              canManageBranches={permissions.canManageBranches}
              setIsCreateRegionOpen={setIsCreateRegionOpen}
              regionForm={regionForm}
              setRegionForm={setRegionForm}
              handleCreateRegion={handleCreateRegion}
              submitting={submitting}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRegions.map((region) => (
                <RegionCard
                  key={region.id}
                  region={region}
                  viewRegionDetails={viewRegionDetails}
                  startEditRegion={startEditRegion}
                  handleDeleteRegion={handleDeleteRegion}
                  isOwner={isOwner}
                  canManageBranches={permissions.canManageBranches}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="managers" className="mt-0">
          {/* Role Legend */}
          {filteredManagers.length > 0 && (
            <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border/50 shadow-sm">
              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                <span className="mr-2">📋</span>
                Role Legend
              </h4>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                    Admin
                  </Badge>
                  <span className="text-muted-foreground">- Full workspace management access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                    Team Lead
                  </Badge>
                  <span className="text-muted-foreground">- Team and project management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                    Manager
                  </Badge>
                  <span className="text-muted-foreground">- Branch and operations management</span>
                </div>
              </div>
            </div>
          )}
          
          {filteredManagers.length === 0 ? (
            <EmptyStateManagers
              searchTerm={searchTerm}
              isOwner={isOwner}
              canManageBranches={permissions.canManageBranches}
              setIsCreateManagerOpen={setIsCreateManagerOpen}
              managerForm={managerForm}
              setManagerForm={setManagerForm}
              handleCreateManager={handleCreateManager}
              createSampleManagers={createSampleManagers}
              submitting={submitting}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredManagers.map((manager) => (
                <ManagerCard
                  key={manager.id}
                  manager={manager}
                  handleEmailManager={handleEmailManager}
                  startEditManager={startEditManager}
                  handleDeleteManager={handleDeleteManager}
                  isOwner={isOwner}
                  canManageBranches={permissions.canManageBranches}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EditBranchDialog
        isOpen={isEditBranchOpen}
        setIsOpen={setIsEditBranchOpen}
        editingBranch={editingBranch}
        branchForm={branchForm}
        setBranchForm={setBranchForm}
        regions={regions}
        managers={managers}
        handleEditBranch={handleEditBranch}
        submitting={submitting}
        resetBranchForm={resetBranchForm}
        setEditingBranch={setEditingBranch}
      />

      <EditRegionDialog
        isOpen={isEditRegionOpen}
        setIsOpen={setIsEditRegionOpen}
        editingRegion={editingRegion}
        regionForm={regionForm}
        setRegionForm={setRegionForm}
        handleEditRegion={handleEditRegion}
        submitting={submitting}
        resetRegionForm={resetRegionForm}
        setEditingRegion={setEditingRegion}
      />
      
      <ViewBranchDetailsDialog
        isOpen={isViewBranchOpen}
        setIsOpen={setIsViewBranchOpen}
        viewingBranch={viewingBranch}
        getRegionName={getRegionName}
        getManagerName={getManagerName}
      />

      <ViewRegionDetailsDialog
        isOpen={isViewRegionOpen}
        setIsOpen={setIsViewRegionOpen}
        viewingRegion={viewingRegion}
      />

      <DeleteBranchDialog
        isOpen={isDeleteBranchOpen}
        setIsOpen={setIsDeleteBranchOpen}
        deletingBranch={deletingBranch}
        confirmDeleteBranch={confirmDeleteBranch}
        submitting={submitting}
        setDeletingBranch={setDeletingBranch}
      />

      <DeleteRegionDialog
        isOpen={isDeleteRegionOpen}
        setIsOpen={setIsDeleteRegionOpen}
        deletingRegion={deletingRegion}
        confirmDeleteRegion={confirmDeleteRegion}
        submitting={submitting}
        setDeletingRegion={setDeletingRegion}
      />

      <EditManagerDialog
        isOpen={isEditManagerOpen}
        setIsOpen={setIsEditManagerOpen}
        editingManager={editingManager}
        managerForm={managerForm}
        setManagerForm={setManagerForm}
        handleEditManager={handleEditManager}
        submitting={submitting}
        INITIAL_MANAGER_FORM={INITIAL_MANAGER_FORM}
        setEditingManager={setEditingManager}
      />

      <DeleteManagerDialog
        isOpen={isDeleteManagerOpen}
        setIsOpen={setIsDeleteManagerOpen}
        deletingManager={deletingManager}
        confirmDeleteManager={confirmDeleteManager}
        submitting={submitting}
        setDeletingManager={setDeletingManager}
      />
    </div>
  );
}