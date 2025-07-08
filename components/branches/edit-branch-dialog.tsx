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
            <Button variant="outline" onClick={() => {
              setIsOpen(false);
              resetBranchForm();
              setEditingBranch(null);
            }}>
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
  );
}