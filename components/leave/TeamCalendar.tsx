'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Building,
  RefreshCw,
  Filter,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LeaveService, LeaveRequest } from '@/lib/leave-service';
import { EmployeeService } from '@/lib/employee-service';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, isSameWeek } from 'date-fns';

interface TeamCalendarProps {
  workspaceId?: string;
  workspaceFilter?: 'current' | 'all';
  allWorkspaces?: any[];
  shouldShowCrossWorkspace?: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  leaveRequests: LeaveRequest[];
}

interface EmployeeWithLeave {
  employee: any;
  leaveRequests: LeaveRequest[];
}

export default function TeamCalendar({
  workspaceId,
  workspaceFilter = 'current',
  allWorkspaces = [],
  shouldShowCrossWorkspace = false
}: TeamCalendarProps) {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLeaveType, setSelectedLeaveType] = useState('all');

  const loadData = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      
      let requests: LeaveRequest[] = [];
      let allEmployees: any[] = [];

      if (shouldShowCrossWorkspace && workspaceFilter === 'all') {
        // Load from all workspaces
        const workspaceIds = allWorkspaces.map(ws => ws.id);
        
        const [allRequests, allEmployeesData] = await Promise.all([
          LeaveService.getMultiWorkspaceLeaveRequests(workspaceIds),
          Promise.all(workspaceIds.map(wsId => EmployeeService.getWorkspaceEmployees(wsId)))
        ]);

        requests = allRequests;
        allEmployees = allEmployeesData.flat().map(emp => ({
          ...emp,
          workspaceName: allWorkspaces.find(ws => ws.id === emp.workspaceId)?.name || 'Unknown'
        }));
      } else {
        // Load from current workspace
        const [workspaceRequests, workspaceEmployees] = await Promise.all([
          LeaveService.getLeaveRequests({ workspaceId, workspaceFilter: 'current' }),
          EmployeeService.getWorkspaceEmployees(workspaceId)
        ]);

        requests = workspaceRequests;
        allEmployees = workspaceEmployees;
      }

      setLeaveRequests(requests);
      setEmployees(allEmployees);
    } catch (error) {
      console.error('Error loading team calendar data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team calendar data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, workspaceFilter, shouldShowCrossWorkspace, allWorkspaces, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  // Get unique leave types from requests
  const leaveTypes = useMemo(() => {
    const types = new Set<string>();
    leaveRequests.forEach(request => {
      if (request.leaveType) {
        types.add(request.leaveType);
      }
    });
    return Array.from(types);
  }, [leaveRequests]);

  // Filter requests based on selected filters
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter(request => {
      const matchesEmployee = selectedEmployee === 'all' || request.employeeId === selectedEmployee;
      const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
      const matchesLeaveType = selectedLeaveType === 'all' || request.leaveType === selectedLeaveType;
      
      return matchesEmployee && matchesStatus && matchesLeaveType;
    });
  }, [leaveRequests, selectedEmployee, selectedStatus, selectedLeaveType]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days: CalendarDay[] = [];

    eachDayOfInterval({ start: calendarStart, end: calendarEnd }).forEach(date => {
      const dayRequests = filteredRequests.filter(request => {
        const startDate = new Date(request.startDate);
        const endDate = new Date(request.endDate);
        return date >= startDate && date <= endDate;
      });

      days.push({
        date,
        isCurrentMonth: isSameMonth(date, currentDate),
        isToday: isToday(date),
        leaveRequests: dayRequests
      });
    });

    return days;
  }, [currentDate, filteredRequests]);

  // Group employees with their leave requests
  const employeesWithLeave = useMemo(() => {
    return employees.map(employee => ({
      employee,
      leaveRequests: filteredRequests.filter(request => request.employeeId === employee.id)
    })).filter(item => item.leaveRequests.length > 0);
  }, [employees, filteredRequests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-3 h-3" />;
      case 'rejected': return <XCircle className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="h-10 w-[200px] bg-muted rounded animate-pulse" />
              <div className="h-10 w-[140px] bg-muted rounded animate-pulse" />
              <div className="h-10 w-[140px] bg-muted rounded animate-pulse" />
              <div className="h-10 w-[100px] bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-2">
              {[...Array(42)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="border-border/50 hover:bg-accent hover:text-accent-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h2 className="text-xl font-semibold text-foreground">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="border-border/50 hover:bg-accent hover:text-accent-foreground"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDate(new Date())}
          className="border-border/50 hover:bg-accent hover:text-accent-foreground"
        >
          Today
        </Button>
      </div>

      {/* Filters */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-[180px] border-border/50 focus:border-primary">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center gap-2">
                      <span>{emp.firstName} {emp.lastName}</span>
                      {shouldShowCrossWorkspace && emp.workspaceName && (
                        <Badge variant="outline" className="text-xs">
                          {emp.workspaceName}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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

            <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
              <SelectTrigger className="w-[160px] border-border/50 focus:border-primary">
                <SelectValue placeholder="Leave Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {leaveTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
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

      {/* Calendar */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Team Leave Calendar
          </CardTitle>
          <CardDescription>
            View all leave requests for {format(currentDate, 'MMMM yyyy')}
            {shouldShowCrossWorkspace && (
              <span className="ml-2">
                • Cross-workspace view
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-[120px] p-2 border rounded-lg ${
                  day.isCurrentMonth 
                    ? 'bg-background' 
                    : 'bg-muted/30'
                } ${
                  day.isToday 
                    ? 'ring-2 ring-primary ring-opacity-50' 
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    day.isCurrentMonth 
                      ? 'text-foreground' 
                      : 'text-muted-foreground'
                  } ${
                    day.isToday 
                      ? 'text-primary font-bold' 
                      : ''
                  }`}>
                    {format(day.date, 'd')}
                  </span>
                  {day.leaveRequests.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {day.leaveRequests.length}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1">
                  {day.leaveRequests.slice(0, 3).map((request, reqIndex) => {
                    const employee = employees.find(emp => emp.id === request.employeeId);
                    return (
                      <div
                        key={reqIndex}
                        className={`text-xs p-1 rounded truncate ${getStatusColor(request.status)}`}
                        title={`${employee?.firstName} ${employee?.lastName} - ${request.leaveType} (${request.status})`}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          <span className="truncate">
                            {employee?.firstName} {employee?.lastName}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {day.leaveRequests.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{day.leaveRequests.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employee Leave Summary */}
      {employeesWithLeave.length > 0 && (
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Employee Leave Summary
            </CardTitle>
            <CardDescription>
              Overview of leave requests for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {employeesWithLeave.map(({ employee, leaveRequests }) => (
                <div key={employee.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </h4>
                      {employee.workspaceName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {employee.workspaceName}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {leaveRequests.map((request) => (
                      <div
                        key={request.id}
                        className={`text-xs p-2 rounded ${getStatusColor(request.status)}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{request.leaveType}</span>
                          {getStatusIcon(request.status)}
                        </div>
                        <div className="text-xs opacity-75">
                          {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="card-enhanced">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium">Legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-100 rounded" />
              <span className="text-xs">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 rounded" />
              <span className="text-xs">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-100 rounded" />
              <span className="text-xs">Rejected</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}