import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Region } from '@/lib/types'; // Assuming Region type is defined

interface DeleteRegionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  deletingRegion: Region | null;
  confirmDeleteRegion: () => void;
  submitting: boolean;
  setDeletingRegion: (region: Region | null) => void;
}

export function DeleteRegionDialog({
  isOpen,
  setIsOpen,
  deletingRegion,
  confirmDeleteRegion,
  submitting,
  setDeletingRegion,
}: DeleteRegionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setDeletingRegion(null);
      }
    }}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-lg font-semibold text-foreground">Delete Region</DialogTitle>
        </DialogHeader>
        {deletingRegion && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete the following region?
              </p>
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="font-medium text-foreground">{deletingRegion.name}</p>
                {deletingRegion.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {deletingRegion.description}
                  </p>
                )}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                This action cannot be undone. All branches in this region will need to be reassigned.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setDeletingRegion(null);
                }}
                disabled={submitting}
                className="border-border"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteRegion}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Region
              </Button>
            </div>
          </div>          
        )}
      </DialogContent>
    </Dialog>
  );
}