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
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasReports ? (
              <>
                <Archive className="h-5 w-5 text-orange-500" />
                Archive Template
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete Template
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Template Information */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={isActive ? 'default' : 'secondary'}
                      className={
                        isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }
                    >
                      {template.status}
                    </Badge>
                    {template.category && (
                      <Badge variant="outline">
                        {template.category}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{template.fields.length} field{template.fields.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>{template.usage.totalReports} report{template.usage.totalReports !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>v{template.version}</span>
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
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Usage Statistics
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{template.usage.totalReports}</div>
                      <div className="text-muted-foreground">Total Reports</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{template.usage.drafts}</div>
                      <div className="text-muted-foreground">Drafts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{template.usage.submitted}</div>
                      <div className="text-muted-foreground">Submitted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{template.usage.approved}</div>
                      <div className="text-muted-foreground">Approved</div>
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
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={submitting}
            className={hasReports 
              ? "bg-orange-600 hover:bg-orange-700 focus:ring-orange-600" 
              : "bg-destructive hover:bg-destructive/90 focus:ring-destructive"
            }
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {hasReports ? 'Archiving...' : 'Deleting...'}
              </>
            ) : (
              <>
                {hasReports ? (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Template
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Template
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