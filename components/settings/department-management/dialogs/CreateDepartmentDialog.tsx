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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Department</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="create-dept-name">Department Name *</Label>
            <Input
              id="create-dept-name"
              value={departmentForm.name}
              onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
              placeholder="e.g., Finance, HR, Marketing"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-dept-description">Description</Label>
            <Textarea
              id="create-dept-description"
              value={departmentForm.description}
              onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
              placeholder="Brief description of this department's role"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-dept-head">Department Head</Label>
            <Select
              value={departmentForm.headId}
              onValueChange={(value) => setDepartmentForm({ ...departmentForm, headId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department head (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No department head</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-dept-color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={departmentForm.color}
                onChange={(e) => setDepartmentForm({ ...departmentForm, color: e.target.value })}
                className="w-12 h-8 rounded border"
              />
              <span className="text-sm text-muted-foreground">{departmentForm.color}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateDepartment}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Department'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}