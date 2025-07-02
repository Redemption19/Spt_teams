import React from 'react';
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
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: 'default' | 'destructive' | 'warning';
  onConfirm: () => void;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  title,
  description,
  confirmText,
  cancelText,
  variant,
  onConfirm,
}: ConfirmationDialogProps) {
  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return <CheckCircle className="h-6 w-6 text-primary" />;
    }
  };

  const getHeaderStyle = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-b border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-b border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-gradient-to-r from-primary/5 to-accent/5 border-b border-primary/20';
    }
  };

  const getConfirmButtonStyle = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white border-0';
      default:
        return 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md overflow-hidden">
        <AlertDialogHeader className={`-m-6 p-6 mb-4 ${getHeaderStyle()}`}>
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-foreground">
                {title}
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </AlertDialogDescription>
        
        <AlertDialogFooter className="gap-2 mt-6">
          <AlertDialogCancel className="min-h-[44px] touch-manipulation">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`min-h-[44px] touch-manipulation ${getConfirmButtonStyle()}`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 