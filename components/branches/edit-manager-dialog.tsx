import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { User } from '@/lib/types';
import React from 'react';

interface ManagerFormData {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
}

interface EditManagerDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editingManager: User | null;
  managerForm: ManagerFormData;
  setManagerForm: React.Dispatch<React.SetStateAction<ManagerFormData>>;
  handleEditManager: () => Promise<void>;
  submitting: boolean;
  INITIAL_MANAGER_FORM: ManagerFormData;
  setEditingManager: (manager: User | null) => void;
}

export function EditManagerDialog({
  isOpen,
  setIsOpen,
  editingManager,
  managerForm,
  setManagerForm,
  handleEditManager,
  submitting,
  INITIAL_MANAGER_FORM,
  setEditingManager,
}: EditManagerDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setEditingManager(null);
        setManagerForm(INITIAL_MANAGER_FORM);
      }
    }}>
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
              setIsOpen(false);
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
  );
}