import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail } from 'lucide-react';
import { Branch } from '@/lib/types'; // Assuming Branch type is defined

interface ViewBranchDetailsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  viewingBranch: Branch | null;
  getRegionName: (regionId: string) => string;
  getManagerName: (managerId: string) => string;
}

export function ViewBranchDetailsDialog({
  isOpen,
  setIsOpen,
  viewingBranch,
  getRegionName,
  getManagerName,
}: ViewBranchDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-4 bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg text-foreground break-words">Branch Details</DialogTitle>
        </DialogHeader>
        {viewingBranch && (
          <div className="space-y-4 sm:space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="text-base sm:text-lg font-semibold text-foreground break-words">{viewingBranch.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Region</Label>
                <p className="text-base sm:text-lg text-foreground break-words">{getRegionName(viewingBranch.regionId)}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <Badge variant={viewingBranch.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {viewingBranch.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Manager</Label>
                <p className="text-base sm:text-lg text-foreground break-words">{getManagerName(viewingBranch.managerId || '')}</p>
              </div>
            </div>
            {viewingBranch.description && (
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm sm:text-base text-foreground bg-muted/50 p-3 rounded-lg border break-words">{viewingBranch.description}</p>
              </div>
            )}              
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <Label className="text-sm font-medium text-muted-foreground">Teams</Label>
                <p className="text-xl sm:text-2xl font-bold text-primary">{viewingBranch.teamIds?.length || 0}</p>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <Label className="text-sm font-medium text-muted-foreground">Users</Label>
                <p className="text-xl sm:text-2xl font-bold text-primary">{viewingBranch.userIds?.length || 0}</p>
              </div>
            </div>

            {viewingBranch.address && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                <div className="bg-muted/50 p-3 rounded-lg border space-y-1">
                  {viewingBranch.address.street && <p className="text-sm sm:text-base text-foreground break-words">{viewingBranch.address.street}</p>}
                  <p className="text-sm sm:text-base text-foreground break-words">
                    {[viewingBranch.address.city, viewingBranch.address.state, viewingBranch.address.postalCode]
                      .filter(Boolean).join(', ')}
                  </p>
                  {viewingBranch.address.country && <p className="text-sm sm:text-base text-foreground break-words">{viewingBranch.address.country}</p>}
                </div>
              </div>
            )}

            {viewingBranch.contact && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Contact</Label>
                <div className="bg-muted/50 p-3 rounded-lg border space-y-2">
                  {viewingBranch.contact.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm sm:text-base text-foreground break-all">{viewingBranch.contact.phone}</span>
                    </div>
                  )}
                  {viewingBranch.contact.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm sm:text-base text-foreground break-all">{viewingBranch.contact.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}