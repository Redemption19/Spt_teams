'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  User,
  TrendingUp,
  CalendarDays,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LeaveService, LeaveRequest, LeaveBalance, LeaveType } from '@/lib/leave-service';
import { EmployeeService } from '@/lib/employee-service';
import { format, parseISO } from 'date-fns';
import EmployeeLeaveRequestForm from './EmployeeLeaveRequestForm';
import LeaveRequestCard from './LeaveRequestCard';
import AnnualLeaveApplicationsList from './AnnualLeaveApplicationsList';

interface EmployeeLeaveDashboardProps {
  workspaceId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
}

export default function EmployeeLeaveDashboard({
  workspaceId,
  employeeId,
  employeeName,
  employeeEmail
}: EmployeeLeaveDashboardProps) {
  // Debug logging
  console.log('EmployeeLeaveDashboard props:', {
    workspaceId,
    employeeId,
    employeeName,
    employeeEmail
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load employee leave data
  const loadData = useCallback(async () => {
    console.log('🔍 EmployeeLeaveDashboard - loadData called with:', { employeeId, workspaceId });
    
    try {
      setLoading(true);
      
      console.log('🔍 EmployeeLeaveDashboard - Starting Promise.all...');
      
      const [requests, balances, types] = await Promise.all([
        LeaveService.getEmployeeLeaveRequests(employeeId, workspaceId),
        LeaveService.getLeaveBalances(workspaceId, new Date().getFullYear()),
        LeaveService.getLeaveTypesForEmployee(workspaceId)
      ]);

      console.log('🔍 EmployeeLeaveDashboard - Promise.all completed');
      console.log('🔍 EmployeeLeaveDashboard - Requests:', requests.length);
      console.log('🔍 EmployeeLeaveDashboard - Balances:', balances.length);
      console.log('🔍 EmployeeLeaveDashboard - Raw leave types:', types);
      console.log('🔍 EmployeeLeaveDashboard - Raw leave types length:', types.length);
      console.log('🔍 EmployeeLeaveDashboard - Active leave types:', types.filter(t => t.isActive));
      console.log('🔍 EmployeeLeaveDashboard - Active leave types length:', types.filter(t => t.isActive).length);
      console.log('🔍 EmployeeLeaveDashboard - Leave types with isActive field:', types.map(t => ({ id: t.id, name: t.name, isActive: t.isActive })));

      setLeaveRequests(requests);
      setLeaveBalances(balances.filter(b => b.employeeId === employeeId));
      // Show all leave types, not just active ones, to handle legacy data
      setLeaveTypes(types);
      
      console.log('🔍 EmployeeLeaveDashboard - State updated with types:', types.length);
    } catch (error) {
      console.error('🔍 EmployeeLeaveDashboard - Error loading employee leave data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leave data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      console.log('🔍 EmployeeLeaveDashboard - loadData completed');
    }
  }, [employeeId, workspaceId, toast]);

  useEffect(() => {
    console.log('🔍 EmployeeLeaveDashboard - useEffect triggered with:', { workspaceId, employeeId });
    loadData();
  }, [workspaceId, employeeId, loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleNewRequestSuccess = () => {
    setShowNewRequestDialog(false);
    loadData();
    toast({
      title: 'Success',
      description: 'Leave request submitted successfully!',
      variant: 'default'
    });
  };

  const handleInitializeDefaultTypes = async () => {
    try {
      setLoading(true);
      await LeaveService.initializeDefaultLeaveTypes(workspaceId);
      toast({
        title: 'Success',
        description: 'Default leave types created successfully!',
        variant: 'default'
      });
      loadData();
    } catch (error) {
      console.error('Error initializing default leave types:', error);
      toast({
        title: 'Error',
        description: 'Failed to create default leave types. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const pendingRequests = leaveRequests.filter(r => r.status === 'pending').length;
  const approvedRequests = leaveRequests.filter(r => r.status === 'approved').length;
  const rejectedRequests = leaveRequests.filter(r => r.status === 'rejected').length;
  const totalDaysRequested = leaveRequests.reduce((sum, r) => sum + r.days, 0);
  const totalDaysApproved = leaveRequests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.days, 0);

  // Get current year
  const currentYear = new Date().getFullYear();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Statistics Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stats-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
              <span className="text-sm font-medium text-muted-foreground truncate">Pending</span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-foreground">{pendingRequests}</div>
              <p className="text-xs text-muted-foreground leading-tight">Awaiting approval</p>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              <span className="text-sm font-medium text-muted-foreground truncate">Approved</span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-foreground">{approvedRequests}</div>
              <p className="text-xs text-muted-foreground leading-tight">{totalDaysApproved} days total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
              <span className="text-sm font-medium text-muted-foreground truncate">Rejected</span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-foreground">{rejectedRequests}</div>
              <p className="text-xs text-muted-foreground leading-tight">Not approved</p>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
              <span className="text-sm font-medium text-muted-foreground truncate">Total Requested</span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-foreground">{totalDaysRequested}</div>
              <p className="text-xs text-muted-foreground leading-tight">Days requested</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto bg-muted p-1 text-muted-foreground rounded-lg">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-3 sm:py-2 lg:py-1.5 min-h-[44px] sm:min-h-[40px] lg:min-h-[36px] touch-manipulation">
            <span className="truncate">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="types" className="text-xs sm:text-sm px-2 py-3 sm:py-2 lg:py-1.5 min-h-[44px] sm:min-h-[40px] lg:min-h-[36px] touch-manipulation">
            <span className="truncate">Leave Types</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="text-xs sm:text-sm px-2 py-3 sm:py-2 lg:py-1.5 min-h-[44px] sm:min-h-[40px] lg:min-h-[36px] touch-manipulation">
            <span className="truncate">Annual Applications</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Recent Requests */}
            <Card className="card-enhanced">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-foreground text-base sm:text-lg">
                  <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Recent Requests</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Your latest leave requests
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {leaveRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No leave requests yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-10 touch-manipulation"
                      onClick={() => setShowNewRequestDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Request Leave
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaveRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg space-y-2 sm:space-y-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{request.leaveType}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(request.startDate), 'MMM dd')} - {format(parseISO(request.endDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge
                          variant={
                            request.status === 'approved' ? 'default' :
                            request.status === 'rejected' ? 'destructive' : 'secondary'
                          }
                          className="self-start sm:self-center flex-shrink-0"
                        >
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                    {leaveRequests.length > 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-10 touch-manipulation"
                        onClick={() => setActiveTab('requests')}
                      >
                        View All Requests
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leave Balances Summary */}
            <Card className="card-enhanced">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-foreground text-base sm:text-lg">
                  <TrendingUp className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Leave Balances</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Your current leave entitlements
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {leaveBalances.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No leave balances found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaveBalances.map((balance) => (
                      <div key={balance.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg space-y-2 sm:space-y-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{balance.leaveTypeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {balance.remainingDays} days remaining
                          </p>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                          <p className="text-sm font-medium">{balance.usedDays}/{balance.totalDays}</p>
                          <p className="text-xs text-muted-foreground">Used/Total</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <User className="h-5 w-5 text-primary" />
                <span>My Leave Requests</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                View and track all your leave requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaveRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No leave requests yet</p>
                  <Button
                    onClick={() => setShowNewRequestDialog(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Your First Request
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.map((request) => (
                    <LeaveRequestCard
                      key={request.id}
                      request={request}
                      showActions={false}
                      showEmployeeName={false}
                      canDelete={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Balances Tab */}
        <TabsContent value="balances" className="space-y-6">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Leave Balances for {currentYear}</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Your leave entitlements and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaveBalances.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No leave balances found for this year</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leaveBalances.map((balance) => {
                    const usagePercentage = (balance.usedDays / balance.totalDays) * 100;
                    const remainingPercentage = (balance.remainingDays / balance.totalDays) * 100;
                    
                    return (
                      <Card key={balance.id} className="border-border/50">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-foreground">{balance.leaveTypeName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {balance.totalDays} days total
                              </p>
                            </div>
                            <Badge
                              variant={remainingPercentage > 50 ? 'default' : remainingPercentage > 25 ? 'secondary' : 'destructive'}
                            >
                              {balance.remainingDays} left
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Used</span>
                              <span>{balance.usedDays} days</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${usagePercentage}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Remaining</span>
                              <span>{balance.remainingDays} days</span>
                            </div>
                          </div>
                          
                          {balance.carriedForwardDays > 0 && (
                            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                              <span className="text-blue-800">
                                {balance.carriedForwardDays} days carried forward from previous year
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Types Tab */}
        <TabsContent value="types" className="space-y-6">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <Settings className="h-5 w-5 text-primary" />
                <span>Available Leave Types</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Leave types you can request
              </CardDescription>
            </CardHeader>
            <CardContent>
                                {leaveTypes.length === 0 ? (
                    <div className="text-center py-8">
                      <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No leave types configured yet</p>
                      <p className="text-sm text-muted-foreground mt-2 mb-4">
                        Contact your administrator to set up leave types
                      </p>
                      <Button
                        onClick={handleInitializeDefaultTypes}
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Create Default Leave Types
                      </Button>
                    </div>
                  ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {leaveTypes.map((type) => (
                    <Card key={type.id} className="border-border/50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-foreground">{type.name}</h3>
                          </div>
                          <Badge className={type.color}>{type.maxDays} days</Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4">{type.description}</p>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>Maximum Days:</span>
                            <span className="font-medium">{type.maxDays}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span>Carry Forward:</span>
                            <div className="flex items-center gap-1">
                              {type.carryForward ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span>{type.carryForward ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                          
                          {type.carryForward && (
                            <div className="flex items-center justify-between text-sm">
                              <span>Carry Forward Limit:</span>
                              <span className="font-medium">{type.carryForwardLimit} days</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm">
                            <span>Requires Approval:</span>
                            <div className="flex items-center gap-1">
                              {type.requiresApproval ? (
                                <AlertCircle className="w-4 h-4 text-orange-600" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              <span>{type.requiresApproval ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Annual Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          <AnnualLeaveApplicationsList
            workspaceId={workspaceId}
            isAdminOrOwner={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}