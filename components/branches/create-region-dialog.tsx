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

interface CreateRegionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  regionForm: RegionFormData;
  setRegionForm: React.Dispatch<React.SetStateAction<RegionFormData>>;
  handleCreateRegion: () => void;
  submitting: boolean;
}

export function CreateRegionDialog({
  isOpen,
  setIsOpen,
  regionForm,
  setRegionForm,
  handleCreateRegion,
  submitting,
}: CreateRegionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-border hover:bg-gray-100 dark:hover:bg-gray-800">
          <MapPin className="h-4 w-4 mr-2" />
          New Region
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Region</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="region-name">Name</Label>
            <Input
              id="region-name"
              value={regionForm.name}
              onChange={(e) => setRegionForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter region name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region-description">Description</Label>
            <Textarea
              id="region-description"
              value={regionForm.description}
              onChange={(e) => setRegionForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter region description"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
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
  );
}