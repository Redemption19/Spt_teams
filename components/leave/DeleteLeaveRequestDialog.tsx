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
      <AlertDialogContent className="w-full max-w-sm sm:max-w-md mx-4">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg break-words">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
            Delete Leave Request
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm sm:text-base">
            Are you sure you want to delete this leave request? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
            <span className="font-medium text-sm">Employee:</span>
            <span className="text-sm break-words">{employeeName || 'Unknown'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
            <span className="font-medium text-sm">Status:</span>
            <span className="capitalize text-sm">{status || 'Unknown'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
            <span className="font-medium text-sm">Request ID:</span>
            <span className="text-xs font-mono break-all">{requestId || 'Unknown'}</span>
          </div>
        </div>

        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-3 sm:gap-2">
          <AlertDialogCancel disabled={loading} className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="w-full sm:w-auto h-11 sm:h-10 bg-red-600 hover:bg-red-700 text-white touch-manipulation"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                <span className="truncate">Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                <span className="truncate">Delete Request</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}