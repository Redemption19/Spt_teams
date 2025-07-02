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
import { Button } from '@/components/ui/button';
import { AlertCircle, Trash2 } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
  onConfirm: () => void;
}

export function ConfirmationDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md w-[95vw] max-w-[420px] rounded-lg border border-border/50 bg-background shadow-2xl">
        <AlertDialogHeader className="space-y-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-3">
            {variant === 'destructive' && (
              <div className="h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-red-500/10 to-rose-500/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-6 w-6 sm:h-5 sm:w-5 text-red-500" />
              </div>
            )}
            {variant === 'warning' && (
              <div className="h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 sm:h-5 sm:w-5 text-primary" />
              </div>
            )}

            <div className="text-center sm:text-left">
              <AlertDialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {title}
              </AlertDialogTitle>
            </div>
          </div>

          <AlertDialogDescription className="text-base sm:text-sm text-muted-foreground text-center sm:text-left leading-relaxed px-2 sm:px-0">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-6">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto min-h-[44px] border-border/50 hover:bg-muted/50"
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              onClick={onConfirm}
              className={`w-full sm:w-auto min-h-[44px] font-medium ${
                variant === 'warning'
                  ? 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg'
                  : ''
              }`}
            >
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}