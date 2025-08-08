// components/tasks/dialogs/TaskDetailDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { format as formatDate } from 'date-fns';
// Import from the main project-task-management.tsx for shared types/constants
import { TaskWithDisplayInfo, PRIORITY_COLORS } from '../project-task-management';

interface TaskDetailDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedTask: TaskWithDisplayInfo | null;
  handleEditTask: (task: TaskWithDisplayInfo) => void;
  initiateDeleteTask: (task: TaskWithDisplayInfo) => void;
}

export default function TaskDetailDialog({
  isOpen,
  setIsOpen,
  selectedTask,
  handleEditTask,
  initiateDeleteTask,
}: TaskDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-4 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg break-words">Task Details</DialogTitle>
        </DialogHeader>
        {selectedTask && (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold line-clamp-2">{selectedTask.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{selectedTask.projectName}</p>
              </div>

              {selectedTask.description && (
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Description</Label>
                  <p className="text-xs sm:text-sm mt-1">{selectedTask.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge className="text-xs">
                      {selectedTask.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Priority</Label>
                  <div className="mt-1">
                    <Badge className={`text-xs ${PRIORITY_COLORS[selectedTask.priority]}`}>
                      {selectedTask.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Assignee</Label>
                  <p className="text-xs sm:text-sm mt-1">{selectedTask.assigneeName || 'Unassigned'}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Due Date</Label>
                  <p className="text-xs sm:text-sm mt-1">
                    {selectedTask.dueDate ? formatDate(selectedTask.dueDate, 'MMM dd,yyyy') : 'No due date'}
                  </p>
                </div>
              </div>

              {selectedTask.estimatedHours && (
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Estimated Hours</Label>
                  <p className="text-xs sm:text-sm mt-1">{selectedTask.estimatedHours}h</p>
                </div>
              )}

              {selectedTask.tags.length > 0 && (
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTask.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full sm:w-auto order-3 sm:order-1 h-11 sm:h-10 touch-manipulation text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
                onClick={() => selectedTask && initiateDeleteTask(selectedTask)}
              >
                <Trash2 className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Delete Task</span>
              </Button>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto order-2 sm:order-1 h-11 sm:h-10 touch-manipulation"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="w-full sm:w-auto order-1 sm:order-2 h-11 sm:h-10 touch-manipulation"
                  onClick={() => selectedTask && handleEditTask(selectedTask)}
                >
                  <Edit className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Edit Task</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}