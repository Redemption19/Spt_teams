'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  RefreshCw,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LeaveService, LeaveRequest } from '@/lib/leave-service';
import { UserService } from '@/lib/user-service';
import { WorkspaceService } from '@/lib/workspace-service';
import LeaveRequestCard from './LeaveRequestCard';
import LeaveLoadingSkeleton from './LeaveLoadingSkeleton';
import DeleteLeaveRequestDialog from './DeleteLeaveRequestDialog';
import { useAuth } from '@/lib/auth-context';

interface LeaveListProps {
  workspaceId?: string;
  workspaceFilter?: 'current' | 'all';
  allWorkspaces?: any[];
  shouldShowCrossWorkspace?: boolean;
}

export default function LeaveList({ 
  workspaceId, 
  workspaceFilter = 'current',
  allWorkspaces = [],
  shouldShowCrossWorkspace = false
}: LeaveListProps) {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all-time');
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRequestForDelete, setSelectedRequestForDelete] = useState<LeaveRequest | null>(null);
  
  // Check if user can delete (admin or owner)
  const canDelete = userProfile?.role === 'admin' || userProfile?.role === 'owner';

  const dateRangeOptions = [
    { value: 'all-time', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'this-week', label: 'This Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'last-30-days', label: 'Last 30 Days' }
  ];

  const getDateRange = (range: string) => {
    const today = new Date();
    
    switch (range) {
      case 'today':
        return { startDate: today, endDate: today };
      case 'this-week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return { startDate: weekStart, endDate: weekEnd };
      case 'this-month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { startDate: monthStart, endDate: monthEnd };
      case 'last-30-days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return { startDate: thirtyDaysAgo, endDate: today };
      default:
        return { startDate: undefined, endDate: undefined };
    }
  };

  const loadData = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      
      let requests: LeaveRequest[] = [];
      let allUsers: any[] = [];

      if (shouldShowCrossWorkspace && workspaceFilter === 'all') {
        // Load from all workspaces
        const workspaceIds = allWorkspaces.map(ws => ws.id);
        
        const [allRequests, allUsersData] = await Promise.all([
          LeaveService.getMultiWorkspaceLeaveRequests(workspaceIds, {
            status: statusFilter === 'all' ? undefined : statusFilter as any,
            ...getDateRange(dateRangeFilter)
          }),
          Promise.all(workspaceIds.map(wsId => UserService.getUsersByWorkspace(wsId)))
        ]);

        requests = allRequests;
        allUsers = allUsersData.flat().map(user => ({
          ...user,
          workspaceName: allWorkspaces.find(ws => ws.id === user.workspaceId)?.name || 'Unknown'
        }));
      } else {
        // Load from current workspace
        const [workspaceRequests, workspaceUsers] = await Promise.all([
          LeaveService.getLeaveRequests({
            workspaceId,
            workspaceFilter: 'current',
            status: statusFilter === 'all' ? undefined : statusFilter as any,
            ...getDateRange(dateRangeFilter)
          }),
          UserService.getUsersByWorkspace(workspaceId)
        ]);

        requests = workspaceRequests;
        allUsers = workspaceUsers;
      }

      console.log('🔍 Setting leave requests:', requests.map(req => ({
        id: req.id,
        employeeName: req.employeeName,
        status: req.status
      })));
      console.log('🔍 Setting users:', allUsers.map(user => ({
        id: user.id,
        name: user.name || `${user.firstName} ${user.lastName}`,
        role: user.role
      })));
      setLeaveRequests(requests);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading leave data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leave requests. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, workspaceFilter, shouldShowCrossWorkspace, allWorkspaces, statusFilter, dateRangeFilter, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleApproveLeave = async (requestId: string) => {
    try {
      // Get current user info for approval
      const currentUser = { uid: 'current-user-id', name: 'HR Manager' }; // TODO: Get from auth context
      
      await LeaveService.updateLeaveRequest(requestId, {
        status: 'approved',
        approvedBy: currentUser.uid
      }, currentUser.uid);

      setLeaveRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { 
                ...req, 
                status: 'approved' as const, 
                approvedBy: currentUser.uid,
                approvedByName: currentUser.name,
                approvedDate: new Date().toISOString().split('T')[0]
              }
            : req
        )
      );

      toast({
        title: 'Leave Approved',
        description: 'The leave request has been approved and notification sent to employee.',
      });
    } catch (error) {
      console.error('Error approving leave:', error);
      toast({
        title: 'Approval Failed',
        description: 'Failed to approve leave request. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleRejectLeave = async (requestId: string, reason: string) => {
    try {
      // Get current user info for rejection
      const currentUser = { uid: 'current-user-id', name: 'HR Manager' }; // TODO: Get from auth context
      
      await LeaveService.updateLeaveRequest(requestId, {
        status: 'rejected',
        rejectionReason: reason
      }, currentUser.uid);

      setLeaveRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'rejected' as const, rejectionReason: reason }
            : req
        )
      );

      toast({
        title: 'Leave Rejected',
        description: 'The leave request has been rejected and notification sent to employee.',
      });
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast({
        title: 'Rejection Failed',
        description: 'Failed to reject leave request. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteLeave = async (requestId: string) => {
    try {
      setDeleteLoading(true);
      await LeaveService.deleteLeaveRequest(requestId);
      
      setLeaveRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast({
        title: 'Leave Request Deleted',
        description: 'The leave request has been permanently deleted.',
      });
      
      setDeleteDialogOpen(false);
      setSelectedRequestForDelete(null);
    } catch (error) {
      console.error('Error deleting leave request:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete leave request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteDialog = (request: LeaveRequest) => {
    console.log('🔍 openDeleteDialog called with request:', {
      id: request.id,
      employeeName: request.employeeName,
      status: request.status
    });
    setSelectedRequestForDelete(request);
    setDeleteDialogOpen(true);
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = 
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmployee = employeeFilter === 'all' || request.employeeId === employeeFilter;
    
    return matchesSearch && matchesEmployee;
  });

  if (loading) {
    return <LeaveLoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search leave requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-border/50 focus:border-primary"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] border-border/50 focus:border-primary">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-[180px] border-border/50 focus:border-primary">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span>{user.firstName || user.name} {user.lastName || ''}</span>
                      {shouldShowCrossWorkspace && user.workspaceName && (
                        <Badge variant="outline" className="text-xs">
                          {user.workspaceName}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="w-[140px] border-border/50 focus:border-primary">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-border/50 hover:bg-accent hover:text-accent-foreground"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredRequests.length} leave request{filteredRequests.length !== 1 ? 's' : ''} found
        </p>
        {shouldShowCrossWorkspace && (
          <Badge variant="outline" className="text-xs">
            <Building className="w-3 h-3 mr-1" />
            Cross-Workspace View
          </Badge>
        )}
      </div>

      {/* Leave Requests List */}
      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <LeaveRequestCard
              key={request.id}
              request={request}
              onApprove={handleApproveLeave}
              onReject={handleRejectLeave}
              onDelete={openDeleteDialog}
              showEmployeeName={true}
              canDelete={canDelete}
            />
          ))
        ) : (
          <Card className="card-enhanced">
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Leave Requests Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || employeeFilter !== 'all' || dateRangeFilter !== 'all-time'
                  ? 'Try adjusting your filters or search terms.'
                  : 'No leave requests have been submitted yet.'
                }
              </p>
              {searchTerm || statusFilter !== 'all' || employeeFilter !== 'all' || dateRangeFilter !== 'all-time' && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setEmployeeFilter('all');
                    setDateRangeFilter('all-time');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {selectedRequestForDelete && deleteDialogOpen && (
        <>
          {console.log('🔍 Rendering dialog with selectedRequestForDelete:', {
            id: selectedRequestForDelete.id,
            employeeName: selectedRequestForDelete.employeeName,
            status: selectedRequestForDelete.status,
            fullObject: selectedRequestForDelete
          })}
          <DeleteLeaveRequestDialog
            isOpen={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedRequestForDelete(null);
            }}
            onConfirm={() => handleDeleteLeave(selectedRequestForDelete.id)}
            requestId={selectedRequestForDelete.id}
            employeeName={selectedRequestForDelete.employeeName}
            status={selectedRequestForDelete.status}
            loading={deleteLoading}
          />
        </>
      )}
    </div>
  );
} 