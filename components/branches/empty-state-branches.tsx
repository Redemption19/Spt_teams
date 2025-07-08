import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, Building2, AlertCircle } from 'lucide-react';
import { Branch, Region, User } from '@/lib/types';
import React from 'react';

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

interface EmptyStateBranchesProps {
  searchTerm: string;
  selectedRegion: string;
  isOwner: boolean;
  canManageBranches: boolean;
  setIsCreateBranchOpen: (isOpen: boolean) => void;
  setIsCreateRegionOpen: (isOpen: boolean) => void;
  branchForm: BranchFormData;
  setBranchForm: React.Dispatch<React.SetStateAction<BranchFormData>>;
  regions: Region[];
  managers: User[];
  handleCreateBranch: () => void;
  submitting: boolean;
}

export function EmptyStateBranches({
  searchTerm,
  selectedRegion,
  isOwner,
  canManageBranches,
  setIsCreateBranchOpen,
  setIsCreateRegionOpen,
  branchForm,
  setBranchForm,
  regions,
  managers,
  handleCreateBranch,
  submitting,
}: EmptyStateBranchesProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3 bg-muted/20 rounded-lg p-6">
      <Building2 className="h-10 w-10 text-muted-foreground" />
      <h3 className="text-lg font-semibold text-muted-foreground">No Branches Found</h3>
      <p className="text-sm text-muted-foreground">
        {searchTerm || selectedRegion !== 'all' ? "No branches match your search/filter." : (isOwner || canManageBranches) ? "Start by creating a new branch." : "No branches assigned to you. Contact your administrator to get assigned to a branch."}
      </p>
      {!searchTerm && selectedRegion === 'all' && (isOwner || canManageBranches) && (
        <Dialog open={false} onOpenChange={setIsCreateBranchOpen}> {/* Manually control open state */}
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
  );
}