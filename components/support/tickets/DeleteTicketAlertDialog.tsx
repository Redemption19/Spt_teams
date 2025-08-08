import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { SupportTicket } from '@/lib/support-service';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteTicketAlertDialogProps {
  ticket: SupportTicket;
  open: boolean;
  onDelete: () => void;
  onCancel: () => void;
}

export const DeleteTicketAlertDialog: React.FC<DeleteTicketAlertDialogProps> = ({ ticket, open, onDelete, onCancel }) => {
  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-4 max-h-[95vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-lg sm:text-xl break-words">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
            Delete Ticket
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm sm:text-base">
            Are you sure you want to delete the ticket titled &quot;<span className="font-medium break-words">{ticket?.title}</span>&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {ticket && (
          <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="font-medium text-sm">Ticket ID:</span>
              <span className="text-xs font-mono break-all">{ticket.id}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="font-medium text-sm">Category:</span>
              <span className="text-sm capitalize">{ticket.category}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="font-medium text-sm">Priority:</span>
              <span className="text-sm capitalize">{ticket.priority}</span>
            </div>
          </div>
        )}
        
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-3 sm:gap-2">
          <AlertDialogCancel 
            onClick={onCancel}
            className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onDelete} 
            className="w-full sm:w-auto h-11 sm:h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90 touch-manipulation"
          >
            <Trash2 className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Delete Ticket</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};