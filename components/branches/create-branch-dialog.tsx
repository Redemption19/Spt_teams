import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { Branch, Region, User } from '@/lib/types'; // Assuming these types are defined
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

interface CreateBranchDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  branchForm: BranchFormData;
  setBranchForm: React.Dispatch<React.SetStateAction<BranchFormData>>;
  regions: Region[];
  managers: User[];
  handleCreateBranch: () => void;
  submitting: boolean;
  setIsCreateRegionOpen: (isOpen: boolean) => void; // To open create region dialog
}

export function CreateBranchDialog({
  isOpen,
  setIsOpen,
  branchForm,
  setBranchForm,
  regions,
  managers,
  handleCreateBranch,
  submitting,
  setIsCreateRegionOpen,
}: CreateBranchDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-accent text-white border-0">
          <Plus className="h-4 w-4 mr-2" />
          New Branch
        </Button>
      </DialogTrigger>            
      <DialogContent className="w-full max-w-sm sm:max-w-4xl mx-4">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg break-words">Create New Branch</DialogTitle>
        </DialogHeader>

        {regions.length === 0 && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to create a region first before creating a branch.
              <Button 
                variant="link" 
                className="px-2 py-0 h-auto text-primary"
                onClick={() => {
                  setIsOpen(false); // Close create branch dialog
                  setIsCreateRegionOpen(true); // Open create region dialog
                }}
              >
                Create a region now
              </Button>
            </AlertDescription>
          </Alert>
        )}              
        <div className="space-y-4 sm:space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch-name" className="text-sm font-medium">Name *</Label>
              <Input
                id="branch-name"
                value={branchForm.name}
                onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter branch name"
                className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary"
              />
            </div>                  
            <div className="space-y-2">
              <Label htmlFor="branch-region" className="text-sm font-medium">Region *</Label>
              <Select
                value={branchForm.regionId}
                onValueChange={(value) => setBranchForm(prev => ({ ...prev, regionId: value }))}
              >
                <SelectTrigger className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50">
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {regions.length === 0 ? (
                    <SelectItem value="no-regions" disabled className="rounded-lg">
                      No regions available - Create a region first
                    </SelectItem>
                  ) : (
                    regions.map((region) => (
                      <SelectItem key={region.id} value={region.id} className="rounded-lg">
                        <span className="truncate">{region.name}</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="branch-manager" className="text-sm font-medium">Manager</Label>
              <Select
                value={branchForm.managerId}
                onValueChange={(value) => setBranchForm(prev => ({ ...prev, managerId: value }))}
              >
                <SelectTrigger className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50">
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id} className="rounded-lg">
                      <span className="truncate">{manager.name} ({manager.email})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>                
          <div className="space-y-2">
            <Label htmlFor="branch-description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="branch-description"
              value={branchForm.description}
              onChange={(e) => setBranchForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter branch description"
              rows={3}
              className="touch-manipulation resize-none rounded-lg border-border/50 focus:border-primary"
            />
          </div>                
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-sm font-medium">Address & Contact</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">                    
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="branch-street" className="text-sm font-medium">Street</Label>
                <Input
                  id="branch-street"
                  value={branchForm.address.street}
                  onChange={(e) => setBranchForm(prev => ({
                    ...prev,
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  placeholder="Street address"
                  className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-city" className="text-sm font-medium">City</Label>
                <Input
                  id="branch-city"
                  value={branchForm.address.city}
                  onChange={(e) => setBranchForm(prev => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  placeholder="City"
                  className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-state" className="text-sm font-medium">State</Label>
                <Input
                  id="branch-state"
                  value={branchForm.address.state}
                  onChange={(e) => setBranchForm(prev => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value }
                  }))}
                  placeholder="State"
                  className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-country" className="text-sm font-medium">Country</Label>
                <Input
                  id="branch-country"
                  value={branchForm.address.country}
                  onChange={(e) => setBranchForm(prev => ({
                    ...prev,
                    address: { ...prev.address, country: e.target.value }
                  }))}
                  placeholder="Country"
                  className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-postal" className="text-sm font-medium">Postal Code</Label>
                <Input
                  id="branch-postal"
                  value={branchForm.address.postalCode}
                  onChange={(e) => setBranchForm(prev => ({
                    ...prev,
                    address: { ...prev.address, postalCode: e.target.value }
                  }))}
                  placeholder="Postal code"
                  className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-phone" className="text-sm font-medium">Phone</Label>
                <Input
                  id="branch-phone"
                  value={branchForm.contact.phone}                        
                  onChange={(e) => setBranchForm(prev => ({
                    ...prev,
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                  placeholder="Phone number"
                  className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="branch-email"
                  type="email"
                  value={branchForm.contact.email}
                  onChange={(e) => setBranchForm(prev => ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                  placeholder="Email address"
                  className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary"
                />
              </div>
            </div>                
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2 p-4 sm:p-0">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBranch} 
              disabled={submitting}
              className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <span className="truncate">Create Branch</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}