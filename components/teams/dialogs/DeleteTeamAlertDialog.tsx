// components/teams/dialogs/DeleteTeamAlertDialog.tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface DeleteTeamAlertDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  teamName: string; // Pass the name of the team to delete for display
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export default function DeleteTeamAlertDialog({
  isOpen,
  setIsOpen,
  teamName,
  onConfirm,
  isSubmitting,
}: DeleteTeamAlertDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-md rounded-xl border-border/50">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <AlertDialogTitle className="text-center text-lg sm:text-xl">
            Delete Team
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            <p>
              Are you sure you want to delete the team &quot;{teamName}&quot;? This action cannot be undone.
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All team data and member associations will be permanently removed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 pt-4">
          <AlertDialogCancel 
            disabled={isSubmitting}
            className="h-11 sm:h-10 rounded-lg border-border/50 touch-manipulation"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isSubmitting}
            className="h-11 sm:h-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg touch-manipulation"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Team
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}