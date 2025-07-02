// components/tasks/dialogs/DeleteTaskAlertDialog.tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
// Import from the main project-task-management.tsx for shared types/constants
import { TaskWithDisplayInfo } from '../project-task-management';

interface DeleteTaskAlertDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  taskToDelete: TaskWithDisplayInfo | null;
  confirmDelete: () => Promise<void>;
  isSubmitting: boolean;
}

export default function DeleteTaskAlertDialog({
  isOpen,
  setIsOpen,
  taskToDelete,
  confirmDelete,
  isSubmitting,
}: DeleteTaskAlertDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="w-full max-w-[95vw] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            <span>Delete Task</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete the task <strong>"{taskToDelete?.title}"</strong>?
            </p>
            {taskToDelete && (
              <>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mt-3">
                  <p className="text-gray-700 text-sm">
                    <strong>Project:</strong> {taskToDelete.projectName}
                  </p>
                  {taskToDelete.assigneeName && (
                    <p className="text-gray-700 text-sm">
                      <strong>Assigned to:</strong> {taskToDelete.assigneeName}
                    </p>
                  )}
                  <p className="text-gray-700 text-sm">
                    <strong>Status:</strong> {taskToDelete.status.replace('-', ' ')}
                  </p>
                </div>
                <p className="text-muted-foreground text-sm mt-2">
                  This action cannot be undone.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            disabled={isSubmitting}
            className="w-full sm:w-auto order-1 sm:order-2 bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Task
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}