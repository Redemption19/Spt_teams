'use client';

import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, FolderOpen, Lock, Users, Globe, Shield } from 'lucide-react';

import { Folder } from '@/lib/types';
import { useCanDeleteFolder } from '@/lib/rbac-hooks';

interface DeleteFolderAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  folder: Folder | null;
  submitting: boolean;
}

export default function DeleteFolderAlertDialog({
  isOpen,
  onClose,
  onConfirm,
  folder,
  submitting
}: DeleteFolderAlertDialogProps) {
  const canDelete = useCanDeleteFolder(folder || undefined);

  if (!folder) return null;

  const getVisibilityIcon = () => {
    switch (folder.visibility) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'team': return <Users className="h-4 w-4" />;
      case 'project': return <FolderOpen className="h-4 w-4" />;
      default: return <Lock className="h-4 w-4" />;
    }
  };

  const getTypeColor = () => {
    switch (folder.type) {
      case 'team': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'member': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'project': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'shared': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const isDangerous = folder.isSystemFolder || folder.type === 'member' || folder.fileCount > 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <span>Delete Folder</span>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this folder? This action cannot be undone.
              </p>

              {/* Folder Info */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FolderOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{folder.name}</span>
                      <Badge className={getTypeColor()}>
                        {folder.type}
                      </Badge>
                    </div>
                    
                    {folder.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {folder.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        {getVisibilityIcon()}
                        <span className="capitalize">{folder.visibility}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <FolderOpen className="h-3 w-3" />
                        <span>{folder.fileCount} files</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning Messages */}
              {folder.isSystemFolder && (
                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium text-sm">System Folder Warning</span>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    This is a system folder. Deleting it may affect project functionality and member access.
                  </p>
                </div>
              )}

              {folder.type === 'member' && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center space-x-2 text-orange-700 dark:text-orange-400">
                    <Users className="h-4 w-4" />
                    <span className="font-medium text-sm">Member Folder Warning</span>
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                    This is a member's personal folder. Deleting it will remove their workspace and all contents.
                  </p>
                </div>
              )}

              {folder.fileCount > 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-400">
                    <FolderOpen className="h-4 w-4" />
                    <span className="font-medium text-sm">Files Will Be Lost</span>
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                    This folder contains {folder.fileCount} file{folder.fileCount !== 1 ? 's' : ''}. 
                    All files will be permanently deleted.
                  </p>
                </div>
              )}

              {!canDelete && (
                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium text-sm">Insufficient Permissions</span>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    You don't have permission to delete this folder. Contact an administrator for assistance.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={submitting || !canDelete}
            className={isDangerous 
              ? "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700" 
              : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            }
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Folder'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
