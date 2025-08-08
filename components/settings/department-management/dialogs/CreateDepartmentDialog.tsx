import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { type User } from '@/lib/types'; // Assuming User type is available

interface CreateDepartmentDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  departmentForm: {
    name: string;
    description: string;
    headId: string;
    color: string;
    status: 'active' | 'inactive';
  };
  setDepartmentForm: (form: any) => void; // Update to a more specific type if available
  handleCreateDepartment: () => void;
  submitting: boolean;
  users: User[];
}

export function CreateDepartmentDialog({
  isOpen,
  setIsOpen,
  departmentForm,
  setDepartmentForm,
  handleCreateDepartment,
  submitting,
  users,
}: CreateDepartmentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-4">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg break-words">Create New Department</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="create-dept-name" className="text-sm font-medium">Department Name *</Label>
            <Input
              id="create-dept-name"
              value={departmentForm.name}
              onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
              placeholder="e.g., Finance, HR, Marketing"
              className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-dept-description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="create-dept-description"
              value={departmentForm.description}
              onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
              placeholder="Brief description of this department's role"
              rows={3}
              className="touch-manipulation resize-none rounded-lg border-border/50 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-dept-head" className="text-sm font-medium">Department Head</Label>
            <Select
              value={departmentForm.headId}
              onValueChange={(value) => setDepartmentForm({ ...departmentForm, headId: value })}
            >
              <SelectTrigger className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary">
                <SelectValue placeholder="Select department head (optional)" className="truncate" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none">No department head</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id} className="truncate">
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-dept-color" className="text-sm font-medium">Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={departmentForm.color}
                onChange={(e) => setDepartmentForm({ ...departmentForm, color: e.target.value })}
                className="w-12 h-10 sm:w-14 sm:h-8 rounded-lg border border-border/50 touch-manipulation"
              />
              <span className="text-xs sm:text-sm text-muted-foreground font-mono">{departmentForm.color}</span>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-3 sm:gap-2 p-4 sm:p-6">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={submitting}
            className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateDepartment}
            disabled={submitting}
            className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="truncate">Creating...</span>
              </>
            ) : (
              <span className="truncate">Create Department</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}