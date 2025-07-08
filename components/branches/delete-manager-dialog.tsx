import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { User } from '@/lib/types'; // Assuming User type is defined

interface DeleteManagerDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  deletingManager: User | null;
  confirmDeleteManager: () => void;
  submitting: boolean;
  setDeletingManager: (manager: User | null) => void;
}

export function DeleteManagerDialog({
  isOpen,
  setIsOpen,
  deletingManager,
  confirmDeleteManager,
  submitting,
  setDeletingManager,
}: DeleteManagerDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setDeletingManager(null);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>Delete Manager</span>
          </DialogTitle>
        </DialogHeader>
        {deletingManager && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">                    
                  <h4 className="font-medium text-red-800 dark:text-red-300">
                    Are you sure you want to delete &ldquo;{deletingManager.name}&rdquo;?
                  </h4>
                  <div className="text-sm text-red-700 dark:text-red-400 space-y-1">
                    <p><strong>Email:</strong> {deletingManager.email}</p>
                    {deletingManager.jobTitle && (
                      <p><strong>Job Title:</strong> {deletingManager.jobTitle}</p>
                    )}
                    {deletingManager.department && (
                      <p><strong>Department:</strong> {deletingManager.department}</p>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-3">
                This action cannot be undone. Any branches assigned to this manager will need to be reassigned.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setDeletingManager(null);
                }}
                disabled={submitting}
                className="border-border"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteManager}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Manager
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}