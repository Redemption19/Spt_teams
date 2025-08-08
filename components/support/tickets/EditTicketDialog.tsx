import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SupportTicket } from '@/lib/support-service';

interface EditTicketDialogProps {
  ticket: SupportTicket;
  open: boolean;
  onSave: (updates: Partial<SupportTicket>) => void;
  onCancel: () => void;
}

export const EditTicketDialog: React.FC<EditTicketDialogProps> = ({ ticket, open, onSave, onCancel }) => {
  const [form, setForm] = useState({
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-4 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl break-words">Edit Ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ticket title"
              className="h-11 sm:h-10 touch-manipulation"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the issue"
              rows={4}
              className="min-h-[100px] touch-manipulation"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={form.category}
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger className="h-11 sm:h-10 touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="feature-request">Feature Request</SelectItem>
                  <SelectItem value="bug-report">Bug Report</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={form.priority}
                onValueChange={(value) => handleChange('priority', value)}
              >
                <SelectTrigger className="h-11 sm:h-10 touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              disabled={saving}
              className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation"
            >
              <span className="truncate">{saving ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};