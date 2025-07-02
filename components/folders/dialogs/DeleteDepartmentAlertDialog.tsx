import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, Loader2, Building, Users, Crown } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  headName?: string;
  status: 'active' | 'inactive';
}

interface DeleteDepartmentAlertDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  departmentToDelete: Department | null;
  confirmDelete: () => Promise<void>;
  isSubmitting: boolean;
}

export default function DeleteDepartmentAlertDialog({
  isOpen,
  setIsOpen,
  departmentToDelete,
  confirmDelete,
  isSubmitting,
}: DeleteDepartmentAlertDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="w-full max-w-[95vw] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            <span>Delete Department</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete the <strong>"{departmentToDelete?.name}"</strong> department?
            </p>
            {departmentToDelete && (
              <>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 mt-3">
                  {departmentToDelete.description && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                      <strong>Description:</strong> {departmentToDelete.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <Users className="h-4 w-4" />
                      <span><strong>{departmentToDelete.memberCount || 0}</strong> members</span>
                    </div>
                    {departmentToDelete.headName && (
                      <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <Crown className="h-4 w-4" />
                        <span><strong>Head:</strong> {departmentToDelete.headName}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 text-sm mt-2">
                    <Building className="h-4 w-4" />
                    <span><strong>Status:</strong> {departmentToDelete.status}</span>
                  </div>
                </div>
                {(departmentToDelete.memberCount || 0) > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-3 mt-3">
                    <p className="text-amber-800 dark:text-amber-300 text-sm">
                      <strong>⚠️ Warning:</strong> This department has {departmentToDelete.memberCount} member(s). 
                      Deleting it will unassign all members from this department.
                    </p>
                  </div>
                )}
                <p className="text-muted-foreground text-sm mt-2">
                  This action cannot be undone.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1" disabled={isSubmitting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            disabled={isSubmitting}
            className="w-full sm:w-auto order-1 sm:order-2 bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Department
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 