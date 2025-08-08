'use client';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2,
  AlertTriangle,
  Archive,
  FileText,
  Clock,
  TrendingUp,
  Info,
  Loader2
} from 'lucide-react';
import { ReportTemplate } from '@/lib/types';

interface DeleteTemplateDialogProps {
  template: ReportTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
}

export function DeleteTemplateDialog({
  template,
  isOpen,
  onClose,
  onConfirm,
  submitting
}: DeleteTemplateDialogProps) {
  if (!template) return null;

  const hasReports = template.usage.totalReports > 0;
  const isActive = template.status === 'active';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-4 max-h-[95vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-start sm:items-center gap-2 text-sm sm:text-base">
            {hasReports ? (
              <>
                <Archive className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                <span className="break-words">Archive Template</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0 mt-0.5 sm:mt-0" />
                <span className="break-words">Delete Template</span>
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Template Information */}
              <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-2 mb-3 sm:mb-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm sm:text-base break-words">{template.name}</h4>
                    {template.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant={isActive ? 'default' : 'secondary'}
                      className={
                        isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 text-xs'
                      }
                    >
                      {template.status}
                    </Badge>
                    {template.category && (
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="break-words">{template.fields.length} field{template.fields.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="break-words">{template.usage.totalReports} report{template.usage.totalReports !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="break-words">v{template.version}</span>
                  </div>
                </div>
              </div>

              {/* Warning Messages */}
              {hasReports ? (
                <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
                  <Archive className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800 dark:text-orange-300">
                    <strong>This template will be archived instead of deleted</strong> because it has been used to create {template.usage.totalReports} report{template.usage.totalReports !== 1 ? 's' : ''}. 
                    Archiving preserves existing reports while preventing new ones from being created with this template.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>This action cannot be undone.</strong> The template and all its configuration will be permanently deleted.
                    Since no reports have been created with this template, it can be safely removed.
                  </AlertDescription>
                </Alert>
              )}

              {/* Usage Statistics */}
              {hasReports && (
                <div className="p-3 sm:p-4 border rounded-lg">
                  <h5 className="font-medium mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <TrendingUp className="h-4 w-4 flex-shrink-0" />
                    Usage Statistics
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-semibold">{template.usage.totalReports}</div>
                      <div className="text-muted-foreground text-xs sm:text-sm">Total Reports</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-semibold">{template.usage.drafts}</div>
                      <div className="text-muted-foreground text-xs sm:text-sm">Drafts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-semibold">{template.usage.submitted}</div>
                      <div className="text-muted-foreground text-xs sm:text-sm">Submitted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-semibold">{template.usage.approved}</div>
                      <div className="text-muted-foreground text-xs sm:text-sm">Approved</div>
                    </div>
                  </div>
                </div>
              )}

              {/* What happens after deletion/archiving */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {hasReports ? (
                    <>
                      <strong>After archiving:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Existing reports created with this template will remain accessible</li>
                        <li>Users will no longer be able to create new reports with this template</li>
                        <li>The template will be moved to archived status</li>
                        <li>You can reactivate the template later if needed</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <strong>After deletion:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>The template configuration will be permanently removed</li>
                        <li>All field definitions and settings will be lost</li>
                        <li>This template will no longer appear in the templates list</li>
                        <li>You will need to recreate the template if you want to use it again</li>
                      </ul>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-3 sm:gap-2 p-4 sm:p-6">
          <AlertDialogCancel disabled={submitting} className="w-full sm:w-auto h-11 sm:h-10 text-sm touch-manipulation">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={submitting}
            className={`w-full sm:w-auto h-11 sm:h-10 text-sm touch-manipulation ${
              hasReports 
                ? "bg-orange-600 hover:bg-orange-700 focus:ring-orange-600" 
                : "bg-destructive hover:bg-destructive/90 focus:ring-destructive"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                <span className="truncate">{hasReports ? 'Archiving...' : 'Deleting...'}</span>
              </>
            ) : (
              <>
                {hasReports ? (
                  <>
                    <Archive className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Archive Template</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Delete Template</span>
                  </>
                )}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}