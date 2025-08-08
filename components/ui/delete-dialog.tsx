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
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, Info, Trash2 } from 'lucide-react';

export interface DeleteItem {
  id: string;
  name: string;
  type?: string;
  status?: string;
  [key: string]: any;
}

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  item?: DeleteItem | null;
  itemDetails?: Array<{
    label: string;
    value: string | React.ReactNode;
  }>;
  consequences?: string[];
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  showItemInfo?: boolean;
  warningLevel?: 'low' | 'medium' | 'high';
}

export function DeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  item,
  itemDetails,
  consequences,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isLoading = false,
  showItemInfo = true,
  warningLevel = 'high',
}: DeleteDialogProps) {
  const getWarningColor = () => {
    switch (warningLevel) {
      case 'low':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'medium':
        return 'text-orange-600 dark:text-orange-400';
      case 'high':
      default:
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getWarningBg = () => {
    switch (warningLevel) {
      case 'low':
        return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800';
      case 'medium':
        return 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800';
      case 'high':
      default:
        return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
    }
  };

  const getButtonColor = () => {
    switch (warningLevel) {
      case 'low':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'medium':
        return 'bg-orange-600 hover:bg-orange-700 text-white';
      case 'high':
      default:
        return 'bg-red-600 hover:bg-red-700 text-white';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="w-full max-w-md sm:max-w-lg md:max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className={`flex items-center gap-2 text-base sm:text-lg ${getWarningColor()}`}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="break-words">{title}</span>
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* Main Description */}
          {description && (
            <AlertDialogDescription className="text-sm sm:text-base leading-relaxed">
              {description}
            </AlertDialogDescription>
          )}

          {/* Item Information */}
          {item && showItemInfo && (
            <div className={`border rounded-lg p-3 sm:p-4 ${getWarningBg()}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${getWarningColor()}`} />
                <div className="space-y-2 flex-1 min-w-0">
                  <h4 className={`font-medium text-sm sm:text-base break-words ${getWarningColor()}`}>
                    Are you sure you want to delete &quot;{item.name}&quot;?
                  </h4>
                  
                  {/* Item Details */}
                  {itemDetails && itemDetails.length > 0 && (
                    <div className={`text-xs sm:text-sm space-y-1 ${getWarningColor().replace('600', '700').replace('400', '300')}`}>
                      {itemDetails.map((detail, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                          <span className="font-medium">{detail.label}:</span>
                          <span className="break-words">{detail.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Auto-generated details from item */}
                  {!itemDetails && (
                    <div className={`text-xs sm:text-sm space-y-1 ${getWarningColor().replace('600', '700').replace('400', '300')}`}>
                      {item.type && (
                        <p className="break-words"><strong>Type:</strong> {item.type}</p>
                      )}
                      {item.status && (
                        <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <strong>Status:</strong>
                          <Badge variant="outline" className="text-xs w-fit">
                            {item.status}
                          </Badge>
                        </p>
                      )}
                      {item.id && (
                        <p className="break-all"><strong>ID:</strong> {item.id}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Consequences Warning */}
          {consequences && consequences.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 min-w-0 flex-1">
                  <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">
                    This action will:
                  </h4>
                  <ul className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {consequences.map((consequence, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1 flex-shrink-0">•</span>
                        <span className="break-words">{consequence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Final Warning */}
          <div className={`text-xs sm:text-sm font-medium text-center sm:text-left ${getWarningColor()}`}>
            ⚠️ This action cannot be undone.
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>
          
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full sm:w-auto min-h-[44px] sm:min-h-[36px] ${getButtonColor()}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  {confirmText}
                </div>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for managing delete dialog state
export function useDeleteDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [item, setItem] = React.useState<DeleteItem | null>(null);

  const openDialog = (itemToDelete: DeleteItem) => {
    setItem(itemToDelete);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setIsLoading(false);
    setItem(null);
  };

  const handleConfirm = async (deleteFunction: (item: DeleteItem) => Promise<void>) => {
    if (!item) return;
    
    setIsLoading(true);
    try {
      await deleteFunction(item);
      closeDialog();
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  return {
    isOpen,
    isLoading,
    item,
    openDialog,
    closeDialog,
    handleConfirm,
    setIsLoading,
  };
}