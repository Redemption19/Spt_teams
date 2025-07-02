'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Building, MapPin, UserPlus, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { SubWorkspaceData, Region, Branch, User } from '@/lib/types';

interface SubWorkspaceCreatorProps {
  parentWorkspaceId?: string;
  trigger?: React.ReactNode;
}

export function SubWorkspaceCreator({ parentWorkspaceId, trigger }: SubWorkspaceCreatorProps) {
  const { currentWorkspace, createSubWorkspace, canCreateSubWorkspace, refreshWorkspaces } = useWorkspace();
  const { userProfile } = useAuth();
  const { toast } = useToast();

  // Form state
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  
  // Region and Branch selection
  const [regions, setRegions] = useState<Region[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [regionBranches, setRegionBranches] = useState<Branch[]>([]);
  
  // User inheritance settings
  const [inheritUsers, setInheritUsers] = useState(true);
  const [inheritRoles, setInheritRoles] = useState(true);
  const [inheritTeams, setInheritTeams] = useState(false);
  const [inheritBranches, setInheritBranches] = useState(false);
  
  // Additional users
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);
  const [selectedAdditionalUsers, setSelectedAdditionalUsers] = useState<string[]>([]);
  
  // Validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const workspaceForCreation = parentWorkspaceId ? 
    { id: parentWorkspaceId } : 
    currentWorkspace;

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen && workspaceForCreation) {
      loadWorkspaceData();
    }
  }, [isOpen, workspaceForCreation]);

  // Update region branches when region changes
  useEffect(() => {
    if (selectedRegionId) {
      const filteredBranches = branches.filter(b => b.regionId === selectedRegionId);
      setRegionBranches(filteredBranches);
      
      // Auto-select first branch if available
      if (filteredBranches.length > 0 && !selectedBranchId) {
        setSelectedBranchId(filteredBranches[0].id);
      } else if (filteredBranches.length === 0) {
        setSelectedBranchId('');
      }
    } else {
      setRegionBranches([]);
      setSelectedBranchId('');
    }
  }, [selectedRegionId, branches]);

  const loadWorkspaceData = async () => {
    if (!workspaceForCreation) return;

    try {
      // Load regions, branches, and users
      const [RegionService, BranchService, WorkspaceService] = await Promise.all([
        import('@/lib/region-service'),
        import('@/lib/branch-service'),
        import('@/lib/workspace-service')
      ]);

      const [regionsData, branchesData, usersData] = await Promise.all([
        RegionService.RegionService.getWorkspaceRegions(workspaceForCreation.id),
        BranchService.BranchService.getBranches(workspaceForCreation.id),
        WorkspaceService.WorkspaceService.getWorkspaceUsers(workspaceForCreation.id)
      ]);

      setRegions(regionsData);
      setBranches(branchesData);
      setWorkspaceUsers(usersData.map(u => u.user));

    } catch (error) {
      console.error('Error loading workspace data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workspace data',
        variant: 'destructive'
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Sub-workspace name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (!selectedRegionId) {
      newErrors.region = 'Please select a region for this sub-workspace';
    }

    if (!selectedBranchId) {
      newErrors.branch = 'Please select a branch for this sub-workspace';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !workspaceForCreation) return;

    setIsSubmitting(true);
    try {
      const subWorkspaceData: SubWorkspaceData = {
        name: name.trim(),
        description: description.trim() || undefined,
        logo: logo.trim() || undefined,
        regionId: selectedRegionId,
        branchId: selectedBranchId,
        inheritUsers,
        inheritRoles,
        inheritTeams,
        inheritBranches,
        initialUsers: selectedAdditionalUsers
      };

      await createSubWorkspace(workspaceForCreation.id, subWorkspaceData);

      toast({
        title: 'Sub-Workspace Created',
        description: `Successfully created "${name}" sub-workspace`,
      });

      // Reset form and close dialog
      resetForm();
      setIsOpen(false);

    } catch (error) {
      console.error('Error creating sub-workspace:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create sub-workspace',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setLogo('');
    setSelectedRegionId('');
    setSelectedBranchId('');
    setInheritUsers(true);
    setInheritRoles(true);
    setInheritTeams(false);
    setInheritBranches(false);
    setSelectedAdditionalUsers([]);
    setCurrentStep(1);
    setErrors({});
  };

  const handleUserToggle = (userId: string) => {
    setSelectedAdditionalUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectedRegion = regions.find(r => r.id === selectedRegionId);
  const selectedBranch = branches.find(b => b.id === selectedBranchId);
  const additionalUsers = workspaceUsers.filter(u => selectedAdditionalUsers.includes(u.id));

  // Check if user can create sub-workspaces
  if (!canCreateSubWorkspace && !parentWorkspaceId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Sub-Workspace</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Create Sub-Workspace</span>
          </DialogTitle>
          <DialogDescription>
            Create a new sub-workspace under {(workspaceForCreation && 'name' in workspaceForCreation) ? workspaceForCreation.name : 'the specified workspace'}. 
            Sub-workspaces can inherit users, roles, and settings from the parent workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center space-x-2 text-sm">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    currentStep >= step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step ? <Check className="h-3 w-3" /> : step}
                </div>
                {step < 3 && <div className="w-8 h-px bg-muted mx-2" />}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Sub-Workspace Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., North Region Operations"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this sub-workspace..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL (Optional)</Label>
                <Input
                  id="logo"
                  placeholder="https://example.com/logo.png"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Region & Branch Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Region *</Label>
                <Select value={selectedRegionId} onValueChange={setSelectedRegionId}>
                  <SelectTrigger className={errors.region ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Choose a region for this sub-workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{region.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.region && (
                  <p className="text-sm text-destructive">{errors.region}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Select Branch *</Label>
                <Select 
                  value={selectedBranchId} 
                  onValueChange={setSelectedBranchId}
                  disabled={!selectedRegionId}
                >
                  <SelectTrigger className={errors.branch ? 'border-destructive' : ''}>
                    <SelectValue placeholder={
                      selectedRegionId 
                        ? "Choose a branch" 
                        : "Select a region first"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {regionBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span>{branch.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branch && (
                  <p className="text-sm text-destructive">{errors.branch}</p>
                )}
              </div>

              {selectedRegion && selectedBranch && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Selection Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Region: {selectedRegion.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>Branch: {selectedBranch.name}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Inheritance & Users */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Inheritance Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Inherit Users</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically add all parent workspace users
                      </p>
                    </div>
                    <Switch
                      checked={inheritUsers}
                      onCheckedChange={setInheritUsers}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Inherit Roles</Label>
                      <p className="text-sm text-muted-foreground">
                        Keep user roles from parent workspace
                      </p>
                    </div>
                    <Switch
                      checked={inheritRoles}
                      onCheckedChange={setInheritRoles}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Inherit Teams</Label>
                      <p className="text-sm text-muted-foreground">
                        Copy team structures from parent workspace
                      </p>
                    </div>
                    <Switch
                      checked={inheritTeams}
                      onCheckedChange={setInheritTeams}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Additional Users</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Select specific users to add to this sub-workspace (in addition to inherited users)
                </p>
                
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {workspaceUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedAdditionalUsers.includes(user.id)}
                        onCheckedChange={() => handleUserToggle(user.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex space-x-2">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={
                    (currentStep === 1 && !name.trim()) ||
                    (currentStep === 2 && (!selectedRegionId || !selectedBranchId))
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Sub-Workspace'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 