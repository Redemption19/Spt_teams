import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { SupportTicket } from '@/lib/support-service';

interface DeleteTicketAlertDialogProps {
  ticket: SupportTicket;
  open: boolean;
  onDelete: () => void;
  onCancel: () => void;
}

export const DeleteTicketAlertDialog: React.FC<DeleteTicketAlertDialogProps> = ({ ticket, open, onDelete, onCancel }) => {
  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="py-2">
          Are you sure you want to delete the ticket titled &quot;{ticket?.title}&quot;? This action cannot be undone.
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}; 