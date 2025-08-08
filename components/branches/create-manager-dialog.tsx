import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import React from 'react';
import { User } from '@/lib/types';

interface ManagerFormData {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
}

interface CreateManagerDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  managerForm: ManagerFormData;
  setManagerForm: React.Dispatch<React.SetStateAction<ManagerFormData>>;
  handleCreateManager: () => void;
  submitting: boolean;
}

export function CreateManagerDialog({
  isOpen,
  setIsOpen,
  managerForm,
  setManagerForm,
  handleCreateManager,
  submitting,
}: CreateManagerDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-accent text-white border-0 ml-4">
          <Plus className="h-4 w-4 mr-2" />
          New Manager
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-4 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg break-words">Create New Manager</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="manager-name-tab" className="text-sm font-medium">Full Name *</Label>
              <Input
                id="manager-name-tab"
                value={managerForm.name}
                onChange={(e) => setManagerForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                className="h-11 sm:h-10 touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager-email-tab" className="text-sm font-medium">Email *</Label>
              <Input
                id="manager-email-tab"
                type="email"
                value={managerForm.email}
                onChange={(e) => setManagerForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className="h-11 sm:h-10 touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager-phone-tab" className="text-sm font-medium">Phone</Label>
              <Input
                id="manager-phone-tab"
                value={managerForm.phone}
                onChange={(e) => setManagerForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                className="h-11 sm:h-10 touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager-jobTitle-tab" className="text-sm font-medium">Job Title</Label>
              <Input
                id="manager-jobTitle-tab"
                value={managerForm.jobTitle}
                onChange={(e) => setManagerForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                placeholder="e.g., Branch Manager"
                className="h-11 sm:h-10 touch-manipulation"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="manager-department-tab" className="text-sm font-medium">Department</Label>
            <Input
              id="manager-department-tab"
              value={managerForm.department}
              onChange={(e) => setManagerForm(prev => ({ ...prev, department: e.target.value }))}
              placeholder="e.g., Operations, Sales"
              className="h-11 sm:h-10 touch-manipulation"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation">
              Cancel
            </Button>
            <Button onClick={handleCreateManager} disabled={submitting} className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <span className="truncate">Create Manager</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}