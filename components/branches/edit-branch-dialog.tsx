import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
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

interface EditBranchDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editingBranch: Branch | null;
  branchForm: BranchFormData;
  setBranchForm: React.Dispatch<React.SetStateAction<BranchFormData>>;
  regions: Region[];
  managers: User[];
  handleEditBranch: () => void;
  submitting: boolean;
  resetBranchForm: () => void;
  setEditingBranch: (branch: Branch | null) => void;
}

export function EditBranchDialog({
  isOpen,
  setIsOpen,
  editingBranch,
  branchForm,
  setBranchForm,
  regions,
  managers,
  handleEditBranch,
  submitting,
  resetBranchForm,
  setEditingBranch,
}: EditBranchDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        resetBranchForm();
        setEditingBranch(null);
      }
    }}>
      <DialogContent className="w-full max-w-sm sm:max-w-4xl mx-4 max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg break-words">Edit Branch</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-branch-name" className="text-sm font-medium">Name *</Label>
              <Input
                id="edit-branch-name"
                value={branchForm.name}
                onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter branch name"
                className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-branch-region" className="text-sm font-medium">Region *</Label>
              <Select
                value={branchForm.regionId}
                onValueChange={(value) => setBranchForm(prev => ({ ...prev, regionId: value }))}
              >
                <SelectTrigger className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary">
                  <SelectValue placeholder="Select a region" className="truncate" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id} className="truncate">
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="edit-branch-manager" className="text-sm font-medium">Manager</Label>
              <Select
                value={branchForm.managerId}
                onValueChange={(value) => setBranchForm(prev => ({ ...prev, managerId: value }))}
              >
                <SelectTrigger className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary">
                  <SelectValue placeholder="Select a manager" className="truncate" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id} className="truncate">
                      {manager.name} ({manager.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-branch-description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="edit-branch-description"
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
                <Label htmlFor="edit-branch-street" className="text-sm font-medium">Street</Label>
                <Input
                  id="edit-branch-street"
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
                <Label htmlFor="edit-branch-city" className="text-sm font-medium">City</Label>
                <Input
                  id="edit-branch-city"
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
                <Label htmlFor="edit-branch-state" className="text-sm font-medium">State</Label>
                <Input
                  id="edit-branch-state"
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
                <Label htmlFor="edit-branch-country" className="text-sm font-medium">Country</Label>
                <Input
                  id="edit-branch-country"
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
                <Label htmlFor="edit-branch-postal" className="text-sm font-medium">Postal Code</Label>
                <Input
                  id="edit-branch-postal"
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
                <Label htmlFor="edit-branch-phone" className="text-sm font-medium">Phone</Label>
                <Input
                  id="edit-branch-phone"
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
                <Label htmlFor="edit-branch-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="edit-branch-email"
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
              onClick={() => {
                setIsOpen(false);
                resetBranchForm();
                setEditingBranch(null);
              }}
              className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditBranch} 
              disabled={submitting}
              className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <span className="truncate">Update Branch</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}