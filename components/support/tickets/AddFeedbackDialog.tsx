import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface AddFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
}

export const AddFeedbackDialog: React.FC<AddFeedbackDialogProps> = ({ open, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Feedback cannot be empty.');
      return;
    }
    setSaving(true);
    await onSubmit(content.trim());
    setContent('');
    setSaving(false);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your feedback or comment..."
            rows={4}
          />
          {error && <div className="text-destructive text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 