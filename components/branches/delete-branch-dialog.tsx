import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Branch } from '@/lib/types'; // Assuming Branch type is defined

interface DeleteBranchDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  deletingBranch: Branch | null;
  confirmDeleteBranch: () => void;
  submitting: boolean;
  setDeletingBranch: (branch: Branch | null) => void;
}

export function DeleteBranchDialog({
  isOpen,
  setIsOpen,
  deletingBranch,
  confirmDeleteBranch,
  submitting,
  setDeletingBranch,
}: DeleteBranchDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setDeletingBranch(null);
      }
    }}>
      <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-4 max-h-[95vh] overflow-y-auto bg-background border-border">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground break-words">Delete Branch</DialogTitle>
        </DialogHeader>
        {deletingBranch && (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base text-muted-foreground">
                Are you sure you want to delete the following branch?
              </p>
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
                <p className="font-medium text-foreground break-words">{deletingBranch.name}</p>
                {deletingBranch.address && (
                  <p className="text-sm text-muted-foreground break-words">
                    {deletingBranch.address.city}, {deletingBranch.address.state}
                  </p>
                )}
              </div>
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">
                This action cannot be undone. All associated data will be permanently removed.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setDeletingBranch(null);
                }}
                disabled={submitting}
                className="w-full sm:w-auto h-11 sm:h-10 border-border touch-manipulation"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteBranch}
                disabled={submitting}
                className="w-full sm:w-auto h-11 sm:h-10 bg-red-600 hover:bg-red-700 text-white touch-manipulation"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />}
                <span className="truncate">Delete Branch</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}