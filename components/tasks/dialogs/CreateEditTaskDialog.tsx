// components/tasks/dialogs/CreateEditTaskDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, Shield, User as UserIcon } from 'lucide-react';
import { Project, Task, User as UserType } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useProjectRole } from '@/lib/rbac-hooks';
// Import from the main project-task-management.tsx for shared types/constants
import { TaskWithDisplayInfo } from '../project-task-management';

interface CreateEditTaskDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  taskForm: {
    title: string;
    description: string;
    projectId: string;
    assigneeId: string | undefined;
    priority: Task['priority'];
    status: Task['status'];
    estimatedHours: string;
  };
  setTaskForm: React.Dispatch<React.SetStateAction<{
    title: string;
    description: string;
    projectId: string;
    assigneeId: string | undefined;
    priority: Task['priority'];
    status: Task['status'];
    estimatedHours: string;
  }>>;
  projects: Project[];
  users: UserType[];
  onSubmit: () => Promise<void>;
  submitting: boolean;
  isEdit: boolean;
  editingTask?: TaskWithDisplayInfo | null;
}

export default function CreateEditTaskDialog({
  isOpen,
  setIsOpen,
  taskForm,
  setTaskForm,
  projects,
  users,
  onSubmit,
  submitting,
  isEdit,
  editingTask,
}: CreateEditTaskDialogProps) {
  const { user } = useAuth();
  
  // ✅ ENHANCED RBAC - Get selected project role information
  const selectedProject = projects.find(p => p.id === taskForm.projectId);
  const projectRole = useProjectRole(selectedProject || null, user?.uid);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3" />;
      case 'admin': return <Shield className="h-3 w-3" />;
      default: return <UserIcon className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'admin': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'member': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{isEdit ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-title" className="text-xs sm:text-sm">Task Title *</Label>
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-project" className="text-xs sm:text-sm">
                Project * {selectedProject && (
                  <Badge className={`ml-2 text-xs ${getRoleColor(projectRole.role)}`}>
                    {getRoleIcon(projectRole.role)}
                    <span className="ml-1 capitalize">{projectRole.role}</span>
                  </Badge>
                )}
              </Label>
              <Select
                value={taskForm.projectId || "unassigned"}
                onValueChange={(value) => setTaskForm(prev => ({ ...prev, projectId: value === "unassigned" ? "" : value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Select a project</SelectItem>
                  {projects.map((project) => {
                    const role = useProjectRole(project, user?.uid);
                    return (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center space-x-2">
                          <span>{project.name}</span>
                          <Badge className={`text-xs ${getRoleColor(role.role)}`}>
                            {getRoleIcon(role.role)}
                            <span className="ml-1 capitalize">{role.role}</span>
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {/* ✅ ENHANCED RBAC - Show helpful message if no projects available */}
              {projects.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No projects available. You must be a member of a project to create tasks.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description" className="text-xs sm:text-sm">Description</Label>
            <Textarea
              id="task-description"
              value={taskForm.description}
              onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the task..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-assignee" className="text-xs sm:text-sm">Assignee</Label>
              <Select
                value={taskForm.assigneeId || "unassigned"}
                onValueChange={(value) => setTaskForm(prev => ({ ...prev, assigneeId: value === "unassigned" ? undefined : value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-priority" className="text-xs sm:text-sm">Priority</Label>
              <Select
                value={taskForm.priority}
                onValueChange={(value: Task['priority']) => setTaskForm(prev => ({ ...prev, priority: value }))}
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
              <Label htmlFor="task-status" className="text-xs sm:text-sm">Status</Label>
              <Select
                value={taskForm.status}
                onValueChange={(value: Task['status']) => setTaskForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-estimated" className="text-xs sm:text-sm">Est. Hours</Label>
              <Input
                id="task-estimated"
                type="number"
                value={taskForm.estimatedHours}
                onChange={(e) => setTaskForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                placeholder="0"
                className="text-sm"
              />
            </div>
          </div>

          {/* ✅ ENHANCED RBAC - Show project role information */}
          {selectedProject && (
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="text-xs text-muted-foreground mb-1">Your role in this project:</div>
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs ${getRoleColor(projectRole.role)}`}>
                  {getRoleIcon(projectRole.role)}
                  <span className="ml-1 capitalize">{projectRole.role}</span>
                </Badge>
                {projectRole.isProjectCreator && (
                  <Badge variant="outline" className="text-xs">
                    Project Creator
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  • Can create tasks
                </span>
              </div>
            </div>
          )}

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
              disabled={submitting || !taskForm.title || !taskForm.projectId}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}