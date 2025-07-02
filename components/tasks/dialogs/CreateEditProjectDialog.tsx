// components/tasks/dialogs/CreateEditProjectDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Project, Team } from '@/lib/types';

interface CreateEditProjectDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  projectForm: {
    name: string;
    description: string;
    teamId: string;
    priority: Project['priority'];
    status: Project['status'];
  };
  setProjectForm: React.Dispatch<React.SetStateAction<{
    name: string;
    description: string;
    teamId: string;
    priority: Project['priority'];
    status: Project['status'];
  }>>;
  teams: Team[];
  onSubmit: () => Promise<void>;
  submitting: boolean;
  isEdit: boolean;
}

export default function CreateEditProjectDialog({
  isOpen,
  setIsOpen,
  projectForm,
  setProjectForm,
  teams,
  onSubmit,
  submitting,
  isEdit,
}: CreateEditProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{isEdit ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-xs sm:text-sm">Project Name *</Label>
              <Input
                id="project-name"
                value={projectForm.name}
                onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-team" className="text-xs sm:text-sm">Team *</Label>
              <Select
                value={projectForm.teamId}
                onValueChange={(value) => setProjectForm(prev => ({ ...prev, teamId: value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description" className="text-xs sm:text-sm">Description</Label>
            <Textarea
              id="project-description"
              value={projectForm.description}
              onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the project..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-priority" className="text-xs sm:text-sm">Priority</Label>
              <Select
                value={projectForm.priority}
                onValueChange={(value: Project['priority']) => setProjectForm(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-status" className="text-xs sm:text-sm">Status</Label>
              <Select
                value={projectForm.status}
                onValueChange={(value: Project['status']) => setProjectForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2 border-t">
            <Button
              variant="outline"
              className="w-full sm:w-auto order-2 sm:order-1"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={submitting}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}