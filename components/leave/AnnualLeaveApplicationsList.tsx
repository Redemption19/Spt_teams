'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Calendar,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { LeaveService, AnnualLeaveApplicationData } from '@/lib/leave-service';
import AnnualLeaveApplicationForm from './AnnualLeaveApplicationForm';

// Helper function to safely format dates
const safeFormatDate = (date: Date | null | undefined, formatString: string): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Date not available';
  }
  try {
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', date, error);
    return 'Invalid date';
  }
};

interface AnnualLeaveApplicationsListProps {
  workspaceId: string;
  isAdminOrOwner?: boolean;
}

export default function AnnualLeaveApplicationsList({ 
  workspaceId, 
  isAdminOrOwner = false 
}: AnnualLeaveApplicationsListProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [applications, setApplications] = useState<AnnualLeaveApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<AnnualLeaveApplicationData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadApplications = useCallback(async () => {
    if (!workspaceId || !user?.uid) return;

    try {
      setLoading(true);
      let applicationsData: AnnualLeaveApplicationData[];

      if (isAdminOrOwner) {
        // Load all applications for admins/owners
        applicationsData = await LeaveService.getAnnualLeaveApplications(workspaceId);
      } else {
        // Load only employee's applications for members
        applicationsData = await LeaveService.getEmployeeAnnualLeaveApplications(user.uid, workspaceId);
      }

      setApplications(applicationsData);
      
      // Debug logging for date conversion
      console.log('🔍 Loaded applications:', applicationsData.map(app => ({
        id: app.id,
        fromDate: app.fromDate,
        toDate: app.toDate,
        applicationDate: app.applicationDate,
        fromDateType: typeof app.fromDate,
        toDateType: typeof app.toDate,
        applicationDateType: typeof app.applicationDate
      })));
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, user?.uid, isAdminOrOwner, toast]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleEdit = async (application: AnnualLeaveApplicationData) => {
    if (isAdminOrOwner) {
      // For admins/owners, they can edit any application
      setSelectedApplication(application);
      setEditDialogOpen(true);
    } else {
      // For members, check if they can edit this application
      const canEdit = await LeaveService.canEditApplication(application.id!, user?.uid || '');
      if (canEdit) {
        setSelectedApplication(application);
        setEditDialogOpen(true);
      } else {
        toast({
          title: 'Cannot Edit',
          description: 'This application cannot be edited as it has been approved or rejected.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleDelete = async (application: AnnualLeaveApplicationData) => {
    if (isAdminOrOwner) {
      // For admins/owners, they can delete any application
      setSelectedApplication(application);
      setDeleteDialogOpen(true);
    } else {
      // For members, check if they can delete this application
      const canDelete = await LeaveService.canDeleteApplication(application.id!, user?.uid || '');
      if (canDelete) {
        setSelectedApplication(application);
        setDeleteDialogOpen(true);
      } else {
        toast({
          title: 'Cannot Delete',
          description: 'This application cannot be deleted as it has been approved or rejected.',
          variant: 'destructive'
        });
      }
    }
  };

  const confirmDelete = async () => {
    if (!selectedApplication) return;

    try {
      setDeleting(true);
      await LeaveService.deleteAnnualLeaveApplication(selectedApplication.id!);
      
      toast({
        title: 'Success',
        description: 'Application deleted successfully.',
      });

      setDeleteDialogOpen(false);
      setSelectedApplication(null);
      loadApplications(); // Reload the list
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete application. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canEditApplication = (application: AnnualLeaveApplicationData) => {
    if (isAdminOrOwner) return true;
    return application.employeeId === user?.uid && application.approvalStatus === 'pending';
  };

  const canDeleteApplication = (application: AnnualLeaveApplicationData) => {
    if (isAdminOrOwner) return true;
    return application.employeeId === user?.uid && application.approvalStatus === 'pending';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading applications...</span>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Annual Leave Applications</CardTitle>
          <CardDescription>
            {isAdminOrOwner ? 'No applications found.' : 'You have no leave applications yet.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isAdminOrOwner 
                ? 'No annual leave applications have been submitted yet.'
                : 'Start by creating your first annual leave application.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Annual Leave Applications</h2>
        <div className="text-sm text-muted-foreground">
          {applications.length} application{applications.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid gap-4">
        {applications.map((application) => (
          <Card key={application.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      {application.employeeName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {application.fromDate && application.toDate ? (
                        `${safeFormatDate(application.fromDate, 'MMM dd')} - ${safeFormatDate(application.toDate, 'MMM dd, yyyy')}`
                      ) : (
                        'Date range not available'
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(application.approvalStatus)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nature of Leave:</span>
                  <p className="text-muted-foreground">{application.natureOfLeave}</p>
                </div>
                <div>
                  <span className="font-medium">Period:</span>
                  <p className="text-muted-foreground">{application.periodOfLeave}</p>
                </div>
                <div>
                  <span className="font-medium">Applied:</span>
                  <p className="text-muted-foreground">
                    {safeFormatDate(application.applicationDate, 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedApplication(application);
                    setEditDialogOpen(true);
                  }}
                  disabled={!canEditApplication(application)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                
                {canEditApplication(application) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(application)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                
                {canDeleteApplication(application) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(application)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Annual Leave Application</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <AnnualLeaveApplicationForm
              workspaceId={workspaceId}
              isEditing={true}
              existingData={selectedApplication}
              onSuccess={() => {
                setEditDialogOpen(false);
                setSelectedApplication(null);
                loadApplications();
              }}
              onCancel={() => {
                setEditDialogOpen(false);
                setSelectedApplication(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this annual leave application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 