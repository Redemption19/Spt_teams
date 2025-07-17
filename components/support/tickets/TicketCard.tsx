import React, { useState, useEffect } from 'react';
import { SupportTicket, TicketFeedback, SupportService } from '@/lib/support-service';
import { EditTicketDialog } from './EditTicketDialog';
import { DeleteTicketAlertDialog } from './DeleteTicketAlertDialog';
import { FeedbackThread } from './FeedbackThread';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, MessageCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RateTicketDialog } from './RateTicketDialog';

interface TicketCardProps {
  ticket: SupportTicket;
  currentUserId: string;
  currentUserRole: 'owner' | 'admin' | 'member';
  onTicketUpdated: () => void;
  onTicketDeleted: () => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, currentUserId, currentUserRole, onTicketUpdated, onTicketDeleted }) => {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [feedback, setFeedback] = useState<TicketFeedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackRefresh, setFeedbackRefresh] = useState(0);
  const canChangeStatus = currentUserRole === 'owner' || currentUserRole === 'admin';
  const [status, setStatus] = useState(ticket.status);
  const [showRate, setShowRate] = useState(false);
  const hasRated = typeof ticket.satisfaction === 'number' && ticket.satisfaction > 0;
  const canRate = currentUserRole === 'member' && (status === 'resolved' || status === 'closed') && !hasRated && ticket.userId === currentUserId;

  // Permissions
  const canEdit = currentUserRole === 'owner' || currentUserRole === 'admin' || (currentUserRole === 'member' && ticket.userId === currentUserId);
  const canDelete = canEdit;
  const canAddFeedback = true; // All roles can add feedback

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoadingFeedback(true);
      const fb = await SupportService.getTicketFeedback(ticket.id);
      setFeedback(fb);
      setLoadingFeedback(false);
    };
    fetchFeedback();
  }, [ticket.id, feedbackRefresh]);

  const handleEdit = async (updates: Partial<SupportTicket>) => {
    await SupportService.editTicket(ticket.id, updates, currentUserId);
    setShowEdit(false);
    onTicketUpdated();
  };

  const handleDelete = async () => {
    await SupportService.deleteTicket(ticket.id, currentUserId);
    setShowDelete(false);
    onTicketDeleted();
  };

  const handleAddFeedback = async (content: string) => {
    await SupportService.addTicketFeedback(ticket.id, {
      userId: currentUserId,
      userName: ticket.userName, // Optionally fetch/display real name
      role: currentUserRole,
      content,
    });
    setFeedbackRefresh((c) => c + 1);
  };

  const handleStatusChange = async (newStatus: SupportTicket['status']) => {
    setStatus(newStatus);
    await SupportService.editTicket(ticket.id, { status: newStatus }, currentUserId);
    onTicketUpdated();
  };

  const handleRate = async (rating: number, comment: string) => {
    await SupportService.editTicket(ticket.id, { satisfaction: rating, feedbackComment: comment }, currentUserId);
    setShowRate(false);
    onTicketUpdated();
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border mb-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">{ticket.title}</h4>
            {canChangeStatus ? (
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs capitalize">{status}</span>
            )}
            <span className="px-2 py-1 rounded bg-orange-500 text-white text-xs capitalize">{ticket.priority}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>By: {ticket.userName || ticket.userEmail}</span>
            <span>Category: {ticket.category}</span>
            <span>Created: {ticket.createdAt.toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end ml-4 min-w-[140px]">
          {canChangeStatus ? (
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs capitalize">{status}</span>
          )}
          {canEdit && (
            <Button size="icon" variant="ghost" onClick={() => setShowEdit(true)} title="Edit Ticket">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button size="icon" variant="ghost" onClick={() => setShowDelete(true)} title="Delete Ticket">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => setFeedbackRefresh((c) => c + 1)} title="Refresh Feedback">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {/* Show rating if present */}
        {typeof ticket.satisfaction === 'number' && ticket.satisfaction > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 flex items-center">
              {Array.from({ length: ticket.satisfaction }).map((_, i) => (
                <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><polygon points="10,1 12.59,7.36 19.51,7.36 13.97,11.63 16.56,17.99 10,13.72 3.44,17.99 6.03,11.63 0.49,7.36 7.41,7.36" /></svg>
              ))}
            </span>
            <span className="text-sm text-muted-foreground">Rated {ticket.satisfaction}/5</span>
            {ticket.feedbackComment && <span className="text-sm text-muted-foreground italic ml-2">&quot;{ticket.feedbackComment}&quot;</span>}
          </div>
        )}
        {/* Rate Ticket button for members */}
        {canRate && (
          <Button size="sm" variant="outline" onClick={() => setShowRate(true)}>
            Rate Ticket
          </Button>
        )}
        <FeedbackThread
          ticketId={ticket.id}
          feedback={feedback}
          canAddFeedback={canAddFeedback}
          onAddFeedback={handleAddFeedback}
          currentUserId={currentUserId}
        />
      </div>
      <EditTicketDialog
        ticket={ticket}
        open={showEdit}
        onSave={handleEdit}
        onCancel={() => setShowEdit(false)}
      />
      <DeleteTicketAlertDialog
        ticket={ticket}
        open={showDelete}
        onDelete={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
      <RateTicketDialog
        open={showRate}
        onClose={() => setShowRate(false)}
        onSubmit={handleRate}
      />
    </div>
  );
}; 