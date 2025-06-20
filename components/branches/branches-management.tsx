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
import { Branch, Region, User, Team } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Assuming you have a Tabs component in your UI library
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // Adjust import based on your actual UI library

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
  const { user } = useAuth();

  // Set initial tab based on current route
  const getInitialTab = () => {
    if (pathname?.includes('/regions')) return 'regions';
    if (pathname?.includes('/managers')) return 'managers'; // New: check for managers path
    return 'branches';
  };
  // State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
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
    if (!currentWorkspace) return;    try {
      setLoading(true);
      setError(null);
      const [branchesData, regionsData, managersData, teamsData, usersData] = await Promise.all([
        BranchService.getBranches(currentWorkspace.id),
        RegionService.getWorkspaceRegions(currentWorkspace.id),
        BranchService.getPotentialManagers(),
        TeamService.getWorkspaceTeams(currentWorkspace.id),
        UserService.getUsersByWorkspace(currentWorkspace.id)
      ]); setBranches(branchesData);
      setRegions(regionsData);
      setManagers(managersData);
      setTeams(teamsData);
      setUsers(usersData);      console.log('Branches Management - Loaded data:', {
        branches: branchesData.length,
        regions: regionsData.length,
        managers: managersData.length,
        teams: teamsData.length,
        users: usersData.length
      });      console.log('Current workspace ID:', currentWorkspace.id);
      console.log('Teams data:', teamsData.map(t => ({ id: t.id, name: t.name, branchId: t.branchId, workspaceId: t.workspaceId })));
      console.log('Users data:', usersData.map(u => ({ id: u.id, name: u.name, branchId: u.branchId, workspaceId: u.workspaceId })));
      console.log('Branches data:', branchesData.map(b => ({ 
        id: b.id, 
        name: b.name, 
        userCount: usersData.filter(u => u.branchId === b.id).length,
        teamCount: teamsData.filter(t => t.branchId === b.id).length
      })));
      console.log('Regions data:', regionsData.map(r => ({ id: r.id, name: r.name, workspaceId: r.workspaceId })));
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);
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
      } const branchData = {
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
        description: err instanceof Error ? err.message : "Failed to create branch"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBranch = async () => {
    if (!editingBranch) return; try {
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
        description: "Failed to update branch"
      });
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteBranch = async (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;

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
        description: "Failed to delete branch"
      });
    } finally {
      setSubmitting(false);
      setIsDeleteBranchOpen(false);
      setDeletingBranch(null);
    }
  };  // Region operations
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
      } const regionData = {
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
        description: err instanceof Error ? err.message : "Failed to create region"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRegion = async () => {
    if (!editingRegion) return; try {
      setSubmitting(true);

      await BranchService.updateRegion(editingRegion.id, regionForm, user?.uid);

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
        description: "Failed to update region"
      });
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteRegion = async (regionId: string) => {
    const region = regions.find(r => r.id === regionId);
    if (!region) return;

    setDeletingRegion(region);
    setIsDeleteRegionOpen(true);
  };

  const confirmDeleteRegion = async () => {
    if (!deletingRegion) return;

    try {
      setSubmitting(true);
      await BranchService.deleteRegion(deletingRegion.id, user?.uid);
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
        description: "Failed to delete region"
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
      await BranchService.createSampleRegions();
      await loadData();
      toast({
        title: "Success",
        description: "Sample regions created successfully"
      });
    } catch (err) {
      console.error('Error creating sample data:', err);
      toast({
        title: "Error",
        description: "Failed to create sample data"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const createSampleManagers = async () => {
    try {
      setSubmitting(true);
      await BranchService.createSampleManagers();
      await loadData();
      toast({
        title: "Success",
        description: "Sample managers created successfully"
      });
    } catch (err) {
      console.error('Error creating sample managers:', err);
      toast({
        title: "Error",
        description: "Failed to create sample managers"
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
        description: err instanceof Error ? err.message : "Failed to create manager"
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
        description: err instanceof Error ? err.message : "Failed to update manager"
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
        description: err instanceof Error ? err.message : "Failed to delete manager"
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
          <Dialog open={isCreateRegionOpen} onOpenChange={setIsCreateRegionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-border hover:bg-gray-100 dark:hover:bg-gray-800">
                <MapPin className="h-4 w-4 mr-2" />
                New Region
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Region</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="region-name">Name</Label>
                  <Input
                    id="region-name"
                    value={regionForm.name}
                    onChange={(e) => setRegionForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter region name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region-description">Description</Label>
                  <Textarea
                    id="region-description"
                    value={regionForm.description}
                    onChange={(e) => setRegionForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter region description"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsCreateRegionOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRegion} disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Region
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateBranchOpen} onOpenChange={setIsCreateBranchOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent text-white border-0">
                <Plus className="h-4 w-4 mr-2" />
                New Branch
              </Button>
            </DialogTrigger>            <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New Branch</DialogTitle>
              </DialogHeader>

              {regions.length === 0 && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to create a region first before creating a branch.
                    <Dialog open={isCreateRegionOpen} onOpenChange={setIsCreateRegionOpen}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="px-2 py-0 h-auto text-primary">
                          Create a region now
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </AlertDescription>
                </Alert>
              )}              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch-name">Name *</Label>
                    <Input
                      id="branch-name"
                      value={branchForm.name}
                      onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter branch name"
                    />
                  </div>                  <div className="space-y-2">
                    <Label htmlFor="branch-region">Region *</Label>
                    <Select
                      value={branchForm.regionId}
                      onValueChange={(value) => setBranchForm(prev => ({ ...prev, regionId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.length === 0 ? (
                          <SelectItem value="no-regions" disabled>
                            No regions available - Create a region first
                          </SelectItem>
                        ) : (
                          regions.map((region) => (
                            <SelectItem key={region.id} value={region.id}>
                              {region.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch-manager">Manager</Label>
                    <Select
                      value={branchForm.managerId}
                      onValueChange={(value) => setBranchForm(prev => ({ ...prev, managerId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name} ({manager.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>                <div className="space-y-2">
                  <Label htmlFor="branch-description">Description</Label>
                  <Textarea
                    id="branch-description"
                    value={branchForm.description}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter branch description"
                    rows={3}
                  />
                </div>                <div className="space-y-4">
                  <Label>Address & Contact</Label>
                  <div className="grid grid-cols-3 gap-4">                    <div className="space-y-2">
                      <Label htmlFor="branch-street">Street</Label>
                      <Input
                        id="branch-street"
                        value={branchForm.address.street}
                        onChange={(e) => setBranchForm(prev => ({
                          ...prev,
                          address: { ...prev.address, street: e.target.value }
                        }))}
                        placeholder="Street address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch-city">City</Label>
                      <Input
                        id="branch-city"
                        value={branchForm.address.city}
                        onChange={(e) => setBranchForm(prev => ({
                          ...prev,
                          address: { ...prev.address, city: e.target.value }
                        }))}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch-state">State</Label>
                      <Input
                        id="branch-state"
                        value={branchForm.address.state}
                        onChange={(e) => setBranchForm(prev => ({
                          ...prev,
                          address: { ...prev.address, state: e.target.value }
                        }))}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch-country">Country</Label>
                      <Input
                        id="branch-country"
                        value={branchForm.address.country}
                        onChange={(e) => setBranchForm(prev => ({
                          ...prev,
                          address: { ...prev.address, country: e.target.value }
                        }))}
                        placeholder="Country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch-postal">Postal Code</Label>
                      <Input
                        id="branch-postal"
                        value={branchForm.address.postalCode}
                        onChange={(e) => setBranchForm(prev => ({
                          ...prev,
                          address: { ...prev.address, postalCode: e.target.value }
                        }))}
                        placeholder="Postal code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch-phone">Phone</Label>
                      <Input
                        id="branch-phone"
                        value={branchForm.contact.phone}                        onChange={(e) => setBranchForm(prev => ({
                          ...prev,
                          contact: { ...prev.contact, phone: e.target.value }
                        }))}
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch-email">Email</Label>
                      <Input
                        id="branch-email"
                        type="email"
                        value={branchForm.contact.email}
                        onChange={(e) => setBranchForm(prev => ({
                          ...prev,
                          contact: { ...prev.contact, email: e.target.value }
                        }))}
                        placeholder="Email address"
                      />
                    </div>
                  </div>                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsCreateBranchOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBranch} disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Branch
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="branches">
              <Building2 className="h-4 w-4 mr-2" /> Branches ({branches.length})
            </TabsTrigger>
            <TabsTrigger value="regions">
              <MapPin className="h-4 w-4 mr-2" /> Regions ({regions.length})
            </TabsTrigger>
            <TabsTrigger value="managers">
              <Users className="h-4 w-4 mr-2" /> Managers ({managers.length})
            </TabsTrigger>          </TabsList>          <Button 
            onClick={syncBranchAssignments} 
            disabled={submitting}
            variant="outline"
            size="sm"
            className="ml-4"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sync Data
          </Button>
          <div className="relative flex-1 max-w-md ml-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-border bg-background"
            />
          </div>
          {activeTab === 'branches' && (
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-48 border-border ml-4">
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {activeTab === 'managers' && (
            <Dialog open={isCreateManagerOpen} onOpenChange={setIsCreateManagerOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-accent text-white border-0 ml-4">
                  <Plus className="h-4 w-4 mr-2" />
                  New Manager
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Manager</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manager-name-tab">Full Name *</Label>
                      <Input
                        id="manager-name-tab"
                        value={managerForm.name}
                        onChange={(e) => setManagerForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manager-email-tab">Email *</Label>
                      <Input
                        id="manager-email-tab"
                        type="email"
                        value={managerForm.email}
                        onChange={(e) => setManagerForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manager-phone-tab">Phone</Label>
                      <Input
                        id="manager-phone-tab"
                        value={managerForm.phone}
                        onChange={(e) => setManagerForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manager-jobTitle-tab">Job Title</Label>
                      <Input
                        id="manager-jobTitle-tab"
                        value={managerForm.jobTitle}
                        onChange={(e) => setManagerForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                        placeholder="e.g., Branch Manager"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager-department-tab">Department</Label>
                    <Input
                      id="manager-department-tab"
                      value={managerForm.department}
                      onChange={(e) => setManagerForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g., Operations, Sales"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setIsCreateManagerOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateManager} disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Manager
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="branches" className="mt-0">
          {filteredBranches.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3 bg-muted/20 rounded-lg p-6">
              <Building2 className="h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-muted-foreground">No Branches Found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || selectedRegion !== 'all' ? "No branches match your search/filter." : "Start by creating a new branch."}
              </p>
              {!searchTerm && selectedRegion === 'all' && (
                <Dialog open={isCreateBranchOpen} onOpenChange={setIsCreateBranchOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" /> Create Branch
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Create New Branch</DialogTitle>
                    </DialogHeader>
                    {regions.length === 0 && (
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          You need to create a region first before creating a branch.
                          <Button variant="link" className="px-2 py-0 h-auto text-primary" onClick={() => {
                            setIsCreateBranchOpen(false);
                            setIsCreateRegionOpen(true);
                          }}>
                            Create a region now
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="branch-name-empty">Name *</Label>
                          <Input
                            id="branch-name-empty"
                            value={branchForm.name}
                            onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter branch name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="branch-region-empty">Region *</Label>
                          <Select
                            value={branchForm.regionId}
                            onValueChange={(value) => setBranchForm(prev => ({ ...prev, regionId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a region" />
                            </SelectTrigger>
                            <SelectContent>
                              {regions.length === 0 ? (
                                <SelectItem value="no-regions" disabled>
                                  No regions available - Create a region first
                                </SelectItem>
                              ) : (
                                regions.map((region) => (
                                  <SelectItem key={region.id} value={region.id}>
                                    {region.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="branch-manager-empty">Manager</Label>
                          <Select
                            value={branchForm.managerId}
                            onValueChange={(value) => setBranchForm(prev => ({ ...prev, managerId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a manager" />
                            </SelectTrigger>
                            <SelectContent>
                              {managers.map((manager) => (
                                <SelectItem key={manager.id} value={manager.id}>
                                  {manager.name} ({manager.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="branch-description-empty">Description</Label>
                        <Textarea
                          id="branch-description-empty"
                          value={branchForm.description}
                          onChange={(e) => setBranchForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter branch description"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-4">
                        <Label>Address & Contact</Label>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="branch-street-empty">Street</Label>
                            <Input
                              id="branch-street-empty"
                              value={branchForm.address.street}
                              onChange={(e) => setBranchForm(prev => ({
                                ...prev,
                                address: { ...prev.address, street: e.target.value }
                              }))}
                              placeholder="Street address"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="branch-city-empty">City</Label>
                            <Input
                              id="branch-city-empty"
                              value={branchForm.address.city}
                              onChange={(e) => setBranchForm(prev => ({
                                ...prev,
                                address: { ...prev.address, city: e.target.value }
                              }))}
                              placeholder="City"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="branch-state-empty">State</Label>
                            <Input
                              id="branch-state-empty"
                              value={branchForm.address.state}
                              onChange={(e) => setBranchForm(prev => ({
                                ...prev,
                                address: { ...prev.address, state: e.target.value }
                              }))}
                              placeholder="State"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="branch-country-empty">Country</Label>
                            <Input
                              id="branch-country-empty"
                              value={branchForm.address.country}
                              onChange={(e) => setBranchForm(prev => ({
                                ...prev,
                                address: { ...prev.address, country: e.target.value }
                              }))}
                              placeholder="Country"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="branch-postal-empty">Postal Code</Label>
                            <Input
                              id="branch-postal-empty"
                              value={branchForm.address.postalCode}
                              onChange={(e) => setBranchForm(prev => ({
                                ...prev,
                                address: { ...prev.address, postalCode: e.target.value }
                              }))}
                              placeholder="Postal code"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="branch-phone-empty">Phone</Label>
                            <Input
                              id="branch-phone-empty"
                              value={branchForm.contact.phone}
                              onChange={(e) => setBranchForm(prev => ({
                                ...prev,
                                contact: { ...prev.contact, phone: e.target.value }
                              }))}
                              placeholder="Phone number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="branch-email-empty">Email</Label>
                            <Input
                              id="branch-email-empty"
                              type="email"
                              value={branchForm.contact.email}
                              onChange={(e) => setBranchForm(prev => ({
                                ...prev,
                                contact: { ...prev.contact, email: e.target.value }
                              }))}
                              placeholder="Email address"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={() => setIsCreateBranchOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateBranch} disabled={submitting}>
                          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Create Branch
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBranches.map((branch) => (
              <Card key={branch.id} className="card-interactive border border-border/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <Badge className={`${
                        branch.status === 'active'
                          ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                          : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
                      }`}>
                        {branch.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewBranchDetails(branch)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditBranch(branch)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBranch(branch.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{branch.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{getRegionName(branch.regionId)}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {branch.description || 'No description available'}
                  </p>                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{users.filter(u => u.branchId === branch.id).length} users</span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Settings className="h-4 w-4" />
                      <span>{teams.filter(t => t.branchId === branch.id).length} teams</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getManagerName(branch.managerId || '').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {getManagerName(branch.managerId || '')}
                    </span>
                  </div>

                  {branch.contact && (
                    <div className="space-y-1">
                      {branch.contact.phone && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{branch.contact.phone}</span>
                        </div>
                      )}
                      {branch.contact.email && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{branch.contact.email}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>            ))}
          </div>
        </TabsContent>

        <TabsContent value="regions" className="mt-0">
          {filteredRegions.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3 bg-muted/20 rounded-lg p-6">
              <MapPin className="h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-muted-foreground">No Regions Found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "No regions match your search." : "Start by creating a new region."}
              </p>
              {!searchTerm && (
                <Dialog open={isCreateRegionOpen} onOpenChange={setIsCreateRegionOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" /> Create Region
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Region</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="region-name-empty">Name</Label>
                        <Input
                          id="region-name-empty"
                          value={regionForm.name}
                          onChange={(e) => setRegionForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter region name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="region-description-empty">Description</Label>
                        <Textarea
                          id="region-description-empty"
                          value={regionForm.description}
                          onChange={(e) => setRegionForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter region description"
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={() => setIsCreateRegionOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateRegion} disabled={submitting}>
                          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Create Region
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRegions.map((region) => (
              <Card key={region.id} className="card-interactive border border-border/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewRegionDetails(region)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditRegion(region)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRegion(region.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>                  <div>
                    <CardTitle className="text-lg">{region.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Region</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {region.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{region.branches?.length || 0} branches</span>
                    </div>
                  </div>
                </CardContent>
              </Card>            ))}
          </div>
        </TabsContent>

        <TabsContent value="managers" className="mt-0">
          {filteredManagers.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3 bg-muted/20 rounded-lg p-6">
              <Users className="h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-muted-foreground">No Managers Found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "No managers match your search." : "Start by creating a new manager or generating sample managers."}
              </p>
              {!searchTerm && (
                <div className="flex gap-3 justify-center mt-4">
                  <Dialog open={isCreateManagerOpen} onOpenChange={setIsCreateManagerOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" /> Create Manager
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Manager</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="manager-name-empty">Full Name *</Label>
                            <Input
                              id="manager-name-empty"
                              value={managerForm.name}
                              onChange={(e) => setManagerForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="manager-email-empty">Email *</Label>
                            <Input
                              id="manager-email-empty"
                              type="email"
                              value={managerForm.email}
                              onChange={(e) => setManagerForm(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="Enter email address"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="manager-phone-empty">Phone</Label>
                            <Input
                              id="manager-phone-empty"
                              value={managerForm.phone}
                              onChange={(e) => setManagerForm(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="Enter phone number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="manager-jobTitle-empty">Job Title</Label>
                            <Input
                              id="manager-jobTitle-empty"
                              value={managerForm.jobTitle}
                              onChange={(e) => setManagerForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                              placeholder="e.g., Branch Manager"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="manager-department-empty">Department</Label>
                          <Input
                            id="manager-department-empty"
                            value={managerForm.department}
                            onChange={(e) => setManagerForm(prev => ({ ...prev, department: e.target.value }))}
                            placeholder="e.g., Operations, Sales"
                          />
                        </div>
                        <div className="flex justify-end space-x-3">
                          <Button variant="outline" onClick={() => setIsCreateManagerOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateManager} disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Manager
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={createSampleManagers} disabled={submitting} variant="outline">
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Sample Managers
                  </Button>
                </div>
              )}
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredManagers.map((manager) => (
              <Card key={manager.id} className="border border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                          {manager.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{manager.name}</h4>
                        <p className="text-sm text-muted-foreground">{manager.jobTitle || 'Manager'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditManager(manager)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteManager(manager)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{manager.email}</span>
                    </div>
                    {manager.phone && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{manager.phone}</span>
                      </div>
                    )}
                    {manager.department && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{manager.department}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <Badge className={`${
                      manager.status === 'active'
                        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                        : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
                    }`}>
                      {manager.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>


      {/* Edit Branch Dialog */}
      <Dialog open={isEditBranchOpen} onOpenChange={setIsEditBranchOpen}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-branch-name">Name *</Label>
                <Input
                  id="edit-branch-name"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter branch name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-branch-region">Region *</Label>
                <Select
                  value={branchForm.regionId}
                  onValueChange={(value) => setBranchForm(prev => ({ ...prev, regionId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-branch-manager">Manager</Label>
                <Select
                  value={branchForm.managerId}
                  onValueChange={(value) => setBranchForm(prev => ({ ...prev, managerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name} ({manager.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-branch-description">Description</Label>
              <Textarea
                id="edit-branch-description"
                value={branchForm.description}
                onChange={(e) => setBranchForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter branch description"
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label>Address & Contact</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-branch-street">Street</Label>
                  <Input
                    id="edit-branch-street"
                    value={branchForm.address.street}
                    onChange={(e) => setBranchForm(prev => ({
                      ...prev,
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-branch-city">City</Label>
                  <Input
                    id="edit-branch-city"
                    value={branchForm.address.city}
                    onChange={(e) => setBranchForm(prev => ({
                      ...prev,
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-branch-state">State</Label>
                  <Input
                    id="edit-branch-state"
                    value={branchForm.address.state}
                    onChange={(e) => setBranchForm(prev => ({
                      ...prev,
                      address: { ...prev.address, state: e.target.value }
                    }))}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-branch-country">Country</Label>
                  <Input
                    id="edit-branch-country"
                    value={branchForm.address.country}
                    onChange={(e) => setBranchForm(prev => ({
                      ...prev,
                      address: { ...prev.address, country: e.target.value }
                    }))}
                    placeholder="Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-branch-postal">Postal Code</Label>
                  <Input
                    id="edit-branch-postal"
                    value={branchForm.address.postalCode}
                    onChange={(e) => setBranchForm(prev => ({
                      ...prev,
                      address: { ...prev.address, postalCode: e.target.value }
                    }))}
                    placeholder="Postal code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-branch-phone">Phone</Label>
                  <Input
                    id="edit-branch-phone"
                    value={branchForm.contact.phone}
                    onChange={(e) => setBranchForm(prev => ({
                      ...prev,
                      contact: { ...prev.contact, phone: e.target.value }
                    }))}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-branch-email">Email</Label>
                  <Input
                    id="edit-branch-email"
                    type="email"
                    value={branchForm.contact.email}
                    onChange={(e) => setBranchForm(prev => ({
                      ...prev,
                      contact: { ...prev.contact, email: e.target.value }
                    }))}
                    placeholder="Email address"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsEditBranchOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditBranch} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Branch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Region Dialog */}
      <Dialog open={isEditRegionOpen} onOpenChange={setIsEditRegionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Region</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-region-name">Name</Label>
              <Input
                id="edit-region-name"
                value={regionForm.name}
                onChange={(e) => setRegionForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter region name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-region-description">Description</Label>
              <Textarea
                id="edit-region-description"
                value={regionForm.description}
                onChange={(e) => setRegionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter region description"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsEditRegionOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditRegion} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Region
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>      {/* View Branch Details Dialog */}
      <Dialog open={isViewBranchOpen} onOpenChange={setIsViewBranchOpen}>
        <DialogContent className="sm:max-w-2xl bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Branch Details</DialogTitle>
          </DialogHeader>
          {viewingBranch && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="text-lg font-semibold text-foreground">{viewingBranch.name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Region</Label>
                  <p className="text-lg text-foreground">{getRegionName(viewingBranch.regionId)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={viewingBranch.status === 'active' ? 'default' : 'secondary'}>
                    {viewingBranch.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Manager</Label>
                  <p className="text-lg text-foreground">{getManagerName(viewingBranch.managerId || '')}</p>
                </div>
              </div>
              {viewingBranch.description && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="mt-1 text-foreground bg-muted/50 p-3 rounded-md border">{viewingBranch.description}</p>
                </div>
              )}              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Teams</Label>
                  <p className="text-2xl font-bold text-primary">{viewingBranch.teamIds?.length || 0}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Users</Label>
                  <p className="text-2xl font-bold text-primary">{viewingBranch.userIds?.length || 0}</p>
                </div>
                           </div>

              {viewingBranch.address && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                  <div className="bg-muted/50 p-3 rounded-md border space-y-1">
                    {viewingBranch.address.street && <p className="text-foreground">{viewingBranch.address.street}</p>}
                    <p className="text-foreground">
                      {[viewingBranch.address.city, viewingBranch.address.state, viewingBranch.address.postalCode]
                        .filter(Boolean).join(', ')}
                    </p>
                    {viewingBranch.address.country && <p className="text-foreground">{viewingBranch.address.country}</p>}
                  </div>
                </div>
              )}

              {viewingBranch.contact && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Contact</Label>
                  <div className="bg-muted/50 p-3 rounded-md border space-y-2">
                    {viewingBranch.contact.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{viewingBranch.contact.phone}</span>
                      </div>
                    )}
                    {viewingBranch.contact.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{viewingBranch.contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>      {/* View Region Details Dialog */}
      <Dialog open={isViewRegionOpen} onOpenChange={setIsViewRegionOpen}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Region Details</DialogTitle>
          </DialogHeader>
          {viewingRegion && (            <div className="space-y-6">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="text-lg font-semibold text-foreground">{viewingRegion.name}</p>
              </div>

              {viewingRegion.description && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="mt-1 text-foreground bg-muted/50 p-3 rounded-md border">{viewingRegion.description}</p>
                </div>
              )}              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Branches</Label>
                <p className="text-2xl font-bold text-primary">{viewingRegion.branches?.length || 0}</p>
              </div>
            </div>          )}        </DialogContent>
      </Dialog>

      {/* Delete Branch Confirmation Dialog */}
      <Dialog open={isDeleteBranchOpen} onOpenChange={setIsDeleteBranchOpen}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-lg font-semibold text-foreground">Delete Branch</DialogTitle>
          </DialogHeader>
          {deletingBranch && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete the following branch?
                </p>
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="font-medium text-foreground">{deletingBranch.name}</p>
                  {deletingBranch.address && (
                    <p className="text-sm text-muted-foreground">
                      {deletingBranch.address.city}, {deletingBranch.address.state}
                    </p>
                  )}
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  This action cannot be undone. All associated data will be permanently removed.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteBranchOpen(false);
                    setDeletingBranch(null);
                  }}
                  disabled={submitting}
                  className="border-border"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteBranch}
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Branch
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Region Confirmation Dialog */}
      <Dialog open={isDeleteRegionOpen} onOpenChange={setIsDeleteRegionOpen}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-lg font-semibold text-foreground">Delete Region</DialogTitle>
          </DialogHeader>
          {deletingRegion && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete the following region?
                </p>
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="font-medium text-foreground">{deletingRegion.name}</p>
                  {deletingRegion.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {deletingRegion.description}
                    </p>
                  )}
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  This action cannot be undone. All branches in this region will need to be reassigned.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteRegionOpen(false);
                    setDeletingRegion(null);
                  }}
                  disabled={submitting}
                  className="border-border"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteRegion}
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Region
                </Button>
              </div>
            </div>          )}
        </DialogContent>
      </Dialog>

      {/* Edit Manager Dialog */}
      <Dialog open={isEditManagerOpen} onOpenChange={setIsEditManagerOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Manager</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-manager-name">Full Name *</Label>
                <Input
                  id="edit-manager-name"
                  value={managerForm.name}
                  onChange={(e) => setManagerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-manager-email">Email *</Label>
                <Input
                  id="edit-manager-email"
                  type="email"
                  value={managerForm.email}
                  onChange={(e) => setManagerForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-manager-phone">Phone</Label>
                <Input
                  id="edit-manager-phone"
                  value={managerForm.phone}
                  onChange={(e) => setManagerForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-manager-jobTitle">Job Title</Label>
                <Input
                  id="edit-manager-jobTitle"
                  value={managerForm.jobTitle}
                  onChange={(e) => setManagerForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                  placeholder="e.g., Branch Manager"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-manager-department">Department</Label>
              <Input
                id="edit-manager-department"
                value={managerForm.department}
                onChange={(e) => setManagerForm(prev => ({ ...prev, department: e.target.value }))}
                placeholder="e.g., Operations, Sales"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => {
                setIsEditManagerOpen(false);
                setEditingManager(null);
                setManagerForm(INITIAL_MANAGER_FORM);
              }}>
                Cancel
              </Button>
              <Button onClick={handleEditManager} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Manager
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Manager Dialog */}
      <Dialog open={isDeleteManagerOpen} onOpenChange={setIsDeleteManagerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Delete Manager</span>
            </DialogTitle>
          </DialogHeader>
          {deletingManager && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">                    <h4 className="font-medium text-red-800 dark:text-red-300">
                      Are you sure you want to delete &ldquo;{deletingManager.name}&rdquo;?
                    </h4>
                    <div className="text-sm text-red-700 dark:text-red-400 space-y-1">
                      <p><strong>Email:</strong> {deletingManager.email}</p>
                      {deletingManager.jobTitle && (
                        <p><strong>Job Title:</strong> {deletingManager.jobTitle}</p>
                      )}
                      {deletingManager.department && (
                        <p><strong>Department:</strong> {deletingManager.department}</p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-3">
                  This action cannot be undone. Any branches assigned to this manager will need to be reassigned.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteManagerOpen(false);
                    setDeletingManager(null);
                  }}
                  disabled={submitting}
                  className="border-border"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteManager}
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Manager
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}