'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteLeaveRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  requestId: string;
  employeeName: string;
  status: string;
  loading?: boolean;
}

export default function DeleteLeaveRequestDialog({
  isOpen,
  onClose,
  onConfirm,
  requestId,
  employeeName,
  status,
  loading = false
}: DeleteLeaveRequestDialogProps) {
  // Debug logging
  console.log('🔍 DeleteLeaveRequestDialog props:', {
    isOpen,
    requestId: requestId || 'UNDEFINED',
    employeeName: employeeName || 'UNDEFINED',
    status: status || 'UNDEFINED',
    loading,
    requestIdType: typeof requestId,
    employeeNameType: typeof employeeName,
    statusType: typeof status
  });
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Leave Request
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this leave request? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Employee:</span>
            <span>{employeeName || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Status:</span>
            <span className="capitalize">{status || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Request ID:</span>
            <span className="text-xs font-mono">{requestId || 'Unknown'}</span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Request
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 