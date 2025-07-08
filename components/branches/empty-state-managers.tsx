import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Users } from 'lucide-react';
import React from 'react';

interface ManagerFormData {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
}

interface EmptyStateManagersProps {
  searchTerm: string;
  isOwner: boolean;
  canManageBranches: boolean;
  setIsCreateManagerOpen: (isOpen: boolean) => void;
  managerForm: ManagerFormData;
  setManagerForm: React.Dispatch<React.SetStateAction<ManagerFormData>>;
  handleCreateManager: () => void;
  createSampleManagers: () => void;
  submitting: boolean;
}

export function EmptyStateManagers({
  searchTerm,
  isOwner,
  canManageBranches,
  setIsCreateManagerOpen,
  managerForm,
  setManagerForm,
  handleCreateManager,
  createSampleManagers,
  submitting,
}: EmptyStateManagersProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3 bg-muted/20 rounded-lg p-6">
      <Users className="h-10 w-10 text-muted-foreground" />
      <h3 className="text-lg font-semibold text-muted-foreground">No Managers Found</h3>
      <p className="text-sm text-muted-foreground">
        {searchTerm ? "No managers match your search." : "Start by creating a new manager or generating sample managers."}
      </p>
      {!searchTerm && (isOwner || canManageBranches) && (
        <div className="flex gap-3 justify-center mt-4">
          <Dialog open={false} onOpenChange={setIsCreateManagerOpen}> {/* Manually control open state */}
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
  );
}