// components/teams/dialogs/DeleteTeamAlertDialog.tsx
import { DeleteDialog, useDeleteDialog } from '@/components/ui/delete-dialog';
import { useEffect } from 'react';

interface DeleteTeamAlertDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  teamName: string; // Pass the name of the team to delete for display
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export default function DeleteTeamAlertDialog({
  isOpen,
  setIsOpen,
  teamName,
  onConfirm,
  isSubmitting,
}: DeleteTeamAlertDialogProps) {
  const deleteDialog = useDeleteDialog();

  // Sync external state with internal dialog state
  useEffect(() => {
    if (isOpen && !deleteDialog.isOpen) {
      deleteDialog.openDialog({ id: 'team-delete', name: teamName });
    } else if (!isOpen && deleteDialog.isOpen) {
      deleteDialog.closeDialog();
    }
  }, [isOpen, deleteDialog, teamName]);

  const handleClose = () => {
    deleteDialog.closeDialog();
    setIsOpen(false);
  };

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <DeleteDialog
      isOpen={deleteDialog.isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Delete Team"
      description="You are about to permanently delete this team. This action cannot be undone."
      item={deleteDialog.item}
      itemDetails={[
        { label: 'Team Name', value: teamName }
      ]}
      consequences={[
        'Permanently remove this team from the workspace',
        'Remove all team member associations',
        'Clear all team-related data and history',
        'This team will no longer be accessible to anyone'
      ]}
      confirmText="Delete Team"
      isLoading={isSubmitting}
      warningLevel="high"
    />
  );
}