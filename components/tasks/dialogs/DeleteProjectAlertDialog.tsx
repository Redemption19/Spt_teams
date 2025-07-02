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
      <AlertDialogContent className="w-full max-w-[95vw] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            <span>Delete Project</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete the project <strong>"{projectToDelete?.name}"</strong>?
            </p>
            {projectToDelete && (
              <>
                {associatedTasksCount > 0 ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3">
                    <p className="text-red-800 text-sm font-medium">
                      ⚠️ Warning: This project has {associatedTasksCount} task(s).
                    </p>
                    <p className="text-red-700 text-sm mt-1">
                      Deleting this project will also permanently delete all associated tasks.
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    This project has no tasks and can be safely deleted.
                  </p>
                )}
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
            Delete Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}