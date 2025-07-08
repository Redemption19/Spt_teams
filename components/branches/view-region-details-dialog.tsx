import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Region } from '@/lib/types'; // Assuming Region type is defined

interface ViewRegionDetailsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  viewingRegion: Region | null;
}

export function ViewRegionDetailsDialog({
  isOpen,
  setIsOpen,
  viewingRegion,
}: ViewRegionDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Region Details</DialogTitle>
        </DialogHeader>
        {viewingRegion && (            
          <div className="space-y-6">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">Name</Label>
              <p className="text-lg font-semibold text-foreground">{viewingRegion.name}</p>
            </div>

            {viewingRegion.description && (
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="mt-1 text-foreground bg-muted/50 p-3 rounded-md border">{viewingRegion.description}</p>
              </div>
            )}              
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">Branches</Label>
              <p className="text-2xl font-bold text-primary">{viewingRegion.branches?.length || 0}</p>
            </div>
          </div>          
        )}        
      </DialogContent>
    </Dialog>
  );
}