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
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Search - Full width on mobile */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-border/50 focus:border-primary touch-manipulation"
                />
              </div>
            </div>

            {/* Filter Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Status Filter */}
              <div className="w-full">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 border-border/50 focus:border-primary touch-manipulation">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Filter */}
              <div className="w-full">
                <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                  <SelectTrigger className="h-11 border-border/50 focus:border-primary touch-manipulation">
                    <SelectValue placeholder="Filter by employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-2 w-full">
                          <span className="truncate flex-1">{user.firstName || user.name} {user.lastName || ''}</span>
                          {shouldShowCrossWorkspace && user.workspaceName && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {user.workspaceName}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="w-full">
                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger className="h-11 border-border/50 focus:border-primary touch-manipulation">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Refresh Button */}
              <div className="w-full">
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="w-full h-11 border-border/50 hover:bg-accent hover:text-accent-foreground touch-manipulation"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count and Cross-Workspace Badge */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="text-sm text-muted-foreground font-medium">
          Showing <span className="text-foreground font-semibold">{filteredRequests.length}</span> of <span className="text-foreground font-semibold">{leaveRequests.length}</span> leave requests
        </div>
        {shouldShowCrossWorkspace && (
          <Badge variant="outline" className="self-start sm:self-center px-3 py-1">
            <Building className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="text-xs">Cross-Workspace View</span>
          </Badge>
        )}
      </div>

      {/* Leave Requests List */}
      <div className="space-y-3 sm:space-y-4">
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
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="flex flex-col items-center space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">No Leave Requests Found</h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {searchTerm || statusFilter !== 'all' || employeeFilter !== 'all' || dateRangeFilter !== 'all-time'
                      ? 'No leave requests match your current filters. Try adjusting your search criteria.'
                      : 'No leave requests have been submitted yet. New requests will appear here once submitted.'
                    }
                  </p>
                </div>
                {(searchTerm || statusFilter !== 'all' || employeeFilter !== 'all' || dateRangeFilter !== 'all-time') && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setEmployeeFilter('all');
                      setDateRangeFilter('all-time');
                    }}
                    className="mt-4 h-11 px-6 touch-manipulation"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
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