// components/tasks/dialogs/DeleteProjectAlertDialog.tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { Project, Task } from '@/lib/types';

interface DeleteProjectAlertDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  projectToDelete: Project | null;
  tasks: Task[];
  confirmDelete: () => Promise<void>;
  isSubmitting: boolean;
}

export default function DeleteProjectAlertDialog({
  isOpen,
  setIsOpen,
  projectToDelete,
  tasks,
  confirmDelete,
  isSubmitting,
}: DeleteProjectAlertDialogProps) {
  const associatedTasksCount = projectToDelete ? tasks.filter(task => task.projectId === projectToDelete.id).length : 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-4">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg break-words">
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
            <span>Delete Project</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 sm:space-y-2">
            <p className="text-sm sm:text-base break-words">
              Are you sure you want to delete the project &quot;{projectToDelete?.name}&quot;? This action cannot be undone.
            </p>
            {projectToDelete && (
              <>
                {associatedTasksCount > 0 ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3">
                    <p className="text-red-800 text-xs sm:text-sm font-medium">
                      ⚠️ Warning: This project has {associatedTasksCount} task(s).
                    </p>
                    <p className="text-red-700 text-xs sm:text-sm mt-1">
                      Deleting this project will also permanently delete all associated tasks.
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    This project has no tasks and can be safely deleted.
                  </p>
                )}
                <p className="text-muted-foreground text-xs sm:text-sm mt-2">
                  This action cannot be undone.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-3 sm:gap-2">
          <AlertDialogCancel className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-11 sm:h-10 bg-red-600 hover:bg-red-700 focus:ring-red-600 touch-manipulation"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <span className="truncate">Delete Project</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}