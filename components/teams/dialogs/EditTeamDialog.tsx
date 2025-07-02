// components/teams/dialogs/EditTeamDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Branch, Region, Team } from '@/lib/types'; // Assuming Team type is available

interface EditTeamDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  teamForm: {
    name: string;
    description: string;
    branchId: string;
    regionId: string;
    leadId: string;
    joinAsLead: boolean; // Not used in edit, but part of the form state
    workspaceId: string;
    members: string[];
  };
  setTeamForm: React.Dispatch<React.SetStateAction<{
    name: string;
    description: string;
    branchId: string;
    regionId: string;
    leadId: string;
    joinAsLead: boolean;
    workspaceId: string;
    members: string[];
  }>>;
  branches: Branch[];
  regions: Region[];
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  selectedTeam: Team | null; // Ensure the dialog has access to the team being edited
}

export default function EditTeamDialog({
  isOpen,
  setIsOpen,
  teamForm,
  setTeamForm,
  branches,
  regions,
  onSubmit,
  isSubmitting,
  selectedTeam,
}: EditTeamDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[95vw] max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg sm:text-xl">Edit Team</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-5 max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-180px)] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="edit-team-name" className="text-sm font-medium">
              Team Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-team-name"
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              placeholder="Enter team name"
              className="mt-1 h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-team-description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="edit-team-description"
              value={teamForm.description}
              onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
              placeholder="Enter team description"
              rows={3}
              className="mt-1 touch-manipulation resize-none rounded-lg border-border/50 focus:border-primary"
            />
          </div>

          <div>
            <Label htmlFor="edit-team-region" className="text-sm font-medium">
              Region
            </Label>
            <Select
              value={teamForm.regionId}
              onValueChange={(value) =>
                setTeamForm({ ...teamForm, regionId: value })
              }
            >
              <SelectTrigger className="mt-1 h-11 sm:h-10 touch-manipulation rounded-lg border-border/50">
                <SelectValue placeholder="Select region (optional)" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none" className="rounded-lg">No Region</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id} className="rounded-lg">
                    <span className="truncate">{region.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="edit-team-branch" className="text-sm font-medium">
              Branch
            </Label>
            <Select
              value={teamForm.branchId}
              onValueChange={(value) =>
                setTeamForm({ ...teamForm, branchId: value })
              }
            >
              <SelectTrigger className="mt-1 h-11 sm:h-10 touch-manipulation rounded-lg border-border/50">
                <SelectValue placeholder="Select branch (optional)" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none" className="rounded-lg">No Branch</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id} className="rounded-lg">
                    <span className="truncate">{branch.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Dialog Actions - Mobile-Friendly */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50"
          >
            Cancel
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={isSubmitting || !teamForm.name.trim()} 
            className="h-11 sm:h-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 touch-manipulation rounded-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              'Update Team'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}