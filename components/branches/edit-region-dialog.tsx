import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Region } from '@/lib/types';
import React from 'react';

interface RegionFormData {
  name: string;
  description: string;
}

interface EditRegionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editingRegion: Region | null;
  regionForm: RegionFormData;
  setRegionForm: React.Dispatch<React.SetStateAction<RegionFormData>>;
  handleEditRegion: () => void;
  submitting: boolean;
  resetRegionForm: () => void;
  setEditingRegion: (region: Region | null) => void;
}

export function EditRegionDialog({
  isOpen,
  setIsOpen,
  editingRegion,
  regionForm,
  setRegionForm,
  handleEditRegion,
  submitting,
  resetRegionForm,
  setEditingRegion,
}: EditRegionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        resetRegionForm();
        setEditingRegion(null);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Region</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-region-name">Name</Label>
            <Input
              id="edit-region-name"
              value={regionForm.name}
              onChange={(e) => setRegionForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter region name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-region-description">Description</Label>
            <Textarea
              id="edit-region-description"
              value={regionForm.description}
              onChange={(e) => setRegionForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter region description"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => {
              setIsOpen(false);
              resetRegionForm();
              setEditingRegion(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditRegion} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Region
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}