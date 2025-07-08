import React, { useState } from 'react';
import { TicketFeedback } from '@/lib/support-service';
import { Button } from '@/components/ui/button';
import { AddFeedbackDialog } from './AddFeedbackDialog';

interface FeedbackThreadProps {
  ticketId: string;
  feedback: TicketFeedback[];
  canAddFeedback: boolean;
  onAddFeedback: (content: string) => Promise<void>;
  currentUserId: string;
}

export const FeedbackThread: React.FC<FeedbackThreadProps> = ({ ticketId, feedback, canAddFeedback, onAddFeedback, currentUserId }) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div className="space-y-4">
      <div className="font-semibold mb-2">Feedback & Comments</div>
      <div className="space-y-2">
        {feedback.length === 0 ? (
          <div className="text-muted-foreground text-sm">No feedback yet.</div>
        ) : (
          feedback.map((fb) => (
            <div key={fb.id} className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-primary">{fb.userName}</span>
                <span className="text-xs text-muted-foreground">({fb.role})</span>
                <span className="text-xs text-muted-foreground ml-auto">{fb.createdAt.toLocaleString()}</span>
              </div>
              <div className="text-sm text-foreground whitespace-pre-line">{fb.content}</div>
            </div>
          ))
        )}
      </div>
      {canAddFeedback && (
        <div className="mt-2">
          <Button onClick={() => setShowDialog(true)} size="sm">
            Add Feedback
          </Button>
          <AddFeedbackDialog
            open={showDialog}
            onClose={() => setShowDialog(false)}
            onSubmit={onAddFeedback}
          />
        </div>
      )}
    </div>
  );
}; 