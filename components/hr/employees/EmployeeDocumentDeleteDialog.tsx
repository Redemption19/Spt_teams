'use client';

import { useState } from 'react';
import { DeleteDialog, DeleteItem } from '@/components/ui/delete-dialog';
import { EmployeeService, EmployeeDocument } from '@/lib/employee-service';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface EmployeeDocumentDeleteDialogProps {
  document: EmployeeDocument;
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmployeeDocumentDeleteDialog({
  document,
  employeeId,
  employeeName,
  onClose,
  onSuccess,
}: EmployeeDocumentDeleteDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      
      await EmployeeService.removeEmployeeDocument(
        employeeId,
        document.id,
        'system' // TODO: Get actual user ID
      );

      toast({
        title: 'Document deleted successfully',
        description: 'The document has been removed from the employee profile.',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete document. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Convert EmployeeDocument to DeleteItem format
  const deleteItem: DeleteItem = {
    id: document.id,
    name: document.name,
    type: 'Employee Document',
    status: document.status,
  };

  // Define item details to display
  const itemDetails = [
    {
      label: 'Document Name',
      value: document.name
    },
    {
      label: 'Document Type',
      value: document.type.charAt(0).toUpperCase() + document.type.slice(1)
    },
    {
      label: 'Employee',
      value: employeeName
    },
    {
      label: 'Upload Date',
      value: format(document.uploadDate, 'MMM dd, yyyy')
    },
    {
      label: 'Status',
      value: document.status.charAt(0).toUpperCase() + document.status.slice(1)
    },
    ...(document.expiryDate ? [{
      label: 'Expiry Date',
      value: format(document.expiryDate, 'MMM dd, yyyy')
    }] : []),
    ...(document.notes ? [{
      label: 'Notes',
      value: document.notes
    }] : [])
  ];

  // Define consequences of deletion
  const consequences = [
    'Permanently remove this document from the employee profile',
    'Delete the file from cloud storage',
    'Remove all document metadata and history',
    'This document will no longer be accessible to anyone',
    'Any references to this document in reports will be affected'
  ];

  return (
    <DeleteDialog
      isOpen={true}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Employee Document"
      description="You are about to permanently delete this employee document. This action will remove the document file and all associated metadata."
      item={deleteItem}
      itemDetails={itemDetails}
      consequences={consequences}
      confirmText="Delete Document"
      cancelText="Cancel"
      isLoading={isLoading}
      showItemInfo={true}
      warningLevel="high"
    />
  );
}