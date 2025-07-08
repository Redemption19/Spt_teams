import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, MapPin } from 'lucide-react';
import React from 'react';

interface RegionFormData {
  name: string;
  description: string;
}

interface EmptyStateRegionsProps {
  searchTerm: string;
  isOwner: boolean;
  canManageBranches: boolean;
  setIsCreateRegionOpen: (isOpen: boolean) => void;
  regionForm: RegionFormData;
  setRegionForm: React.Dispatch<React.SetStateAction<RegionFormData>>;
  handleCreateRegion: () => void;
  submitting: boolean;
}

export function EmptyStateRegions({
  searchTerm,
  isOwner,
  canManageBranches,
  setIsCreateRegionOpen,
  regionForm,
  setRegionForm,
  handleCreateRegion,
  submitting,
}: EmptyStateRegionsProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3 bg-muted/20 rounded-lg p-6">
      <MapPin className="h-10 w-10 text-muted-foreground" />
      <h3 className="text-lg font-semibold text-muted-foreground">No Regions Found</h3>
      <p className="text-sm text-muted-foreground">
        {searchTerm ? "No regions match your search." : (isOwner || canManageBranches) ? "Start by creating a new region." : "No regions assigned to you. Contact your administrator to get assigned to a region."}
      </p>
      {!searchTerm && (isOwner || canManageBranches) && (
        <Dialog open={false} onOpenChange={setIsCreateRegionOpen}> {/* Manually control open state */}
          <DialogTrigger asChild>
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" /> Create Region
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Region</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="region-name-empty">Name</Label>
                <Input
                  id="region-name-empty"
                  value={regionForm.name}
                  onChange={(e) => setRegionForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter region name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region-description-empty">Description</Label>
                <Textarea
                  id="region-description-empty"
                  value={regionForm.description}
                  onChange={(e) => setRegionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter region description"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsCreateRegionOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRegion} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Region
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}