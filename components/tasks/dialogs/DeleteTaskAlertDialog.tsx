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
      <AlertDialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-4">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg break-words">
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
            <span>Delete Task</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 sm:space-y-2 text-sm sm:text-base break-words">
            <p>
              Are you sure you want to delete the task &quot;{taskToDelete?.title}&quot;? This action cannot be undone.
            </p>
            {taskToDelete && (
              <>
                <div className="bg-muted/50 border rounded-lg p-3 space-y-2">
                  <p className="text-foreground text-xs sm:text-sm">
                    <strong>Project:</strong> <span className="break-words">{taskToDelete.projectName}</span>
                  </p>
                  {taskToDelete.assigneeName && (
                    <p className="text-foreground text-xs sm:text-sm">
                      <strong>Assigned to:</strong> <span className="break-words">{taskToDelete.assigneeName}</span>
                    </p>
                  )}
                  <p className="text-foreground text-xs sm:text-sm">
                    <strong>Status:</strong> {taskToDelete.status.replace('-', ' ')}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  This action cannot be undone.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2">
          <AlertDialogCancel className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />}
            <span className="truncate">Delete Task</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}