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
      <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-4 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg break-words">Edit Manager</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-manager-name" className="text-sm font-medium">Full Name *</Label>
              <Input
                id="edit-manager-name"
                value={managerForm.name}
                onChange={(e) => setManagerForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                className="h-11 sm:h-10 touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manager-email" className="text-sm font-medium">Email *</Label>
              <Input
                id="edit-manager-email"
                type="email"
                value={managerForm.email}
                onChange={(e) => setManagerForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className="h-11 sm:h-10 touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manager-phone" className="text-sm font-medium">Phone</Label>
              <Input
                id="edit-manager-phone"
                value={managerForm.phone}
                onChange={(e) => setManagerForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                className="h-11 sm:h-10 touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manager-jobTitle" className="text-sm font-medium">Job Title</Label>
              <Input
                id="edit-manager-jobTitle"
                value={managerForm.jobTitle}
                onChange={(e) => setManagerForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                placeholder="e.g., Branch Manager"
                className="h-11 sm:h-10 touch-manipulation"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-manager-department" className="text-sm font-medium">Department</Label>
            <Input
              id="edit-manager-department"
              value={managerForm.department}
              onChange={(e) => setManagerForm(prev => ({ ...prev, department: e.target.value }))}
              placeholder="e.g., Operations, Sales"
              className="h-11 sm:h-10 touch-manipulation"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2 pt-4">
            <Button variant="outline" onClick={() => {
              setIsOpen(false);
              setEditingManager(null);
              setManagerForm(INITIAL_MANAGER_FORM);
            }} className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation">
              Cancel
            </Button>
            <Button onClick={handleEditManager} disabled={submitting} className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <span className="truncate">Update Manager</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}