import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Users, AlertCircle, Building, Calendar } from 'lucide-react';
import { AttendanceRecord, AttendanceService, AttendanceFilters } from '@/lib/attendance-service';
import { EmployeeService } from '@/lib/employee-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { AttendanceCard } from './AttendanceCard';
import { AttendanceLoadingSkeleton } from '@/components/attendance/AttendanceLoadingSkeleton';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface AttendanceListProps {
  workspaceId: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
  filters?: AttendanceFilters;
  onDataChange?: () => Promise<void>;
}

export function AttendanceList({
  workspaceId,
  canEdit = false,
  canDelete = false,
  canCreate = false,
  filters,
  onDataChange
}: AttendanceListProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all-time');
  const [workspaceFilter, setWorkspaceFilter] = useState('all');
  
  // Deletion state
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Derived data for filters
  const [employees, setEmployees] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  // Check if user is owner and should see cross-workspace data
  const isOwner = userProfile?.role === 'owner';
  const shouldShowCrossWorkspace = isOwner && currentWorkspace?.id === workspaceId;

  // Date range options
  const dateRangeOptions = [
    { value: 'all-time', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this-week', label: 'This Week' },
    { value: 'last-week', label: 'Last Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'last-7-days', label: 'Last 7 Days' },
    { value: 'last-30-days', label: 'Last 30 Days' }
  ];

  const getDateRange = useCallback((range: string) => {
    const today = new Date();
    
    switch (range) {
      case 'all-time':
        // Return a very old date to effectively show all records
        return { startDate: new Date('2020-01-01'), endDate: new Date('2030-12-31') };
      case 'today':
        return { startDate: today, endDate: today };
      case 'yesterday':
        const yesterday = subDays(today, 1);
        return { startDate: yesterday, endDate: yesterday };
      case 'this-week':
        return { startDate: startOfWeek(today), endDate: endOfWeek(today) };
      case 'last-week':
        const lastWeekStart = startOfWeek(subDays(today, 7));
        const lastWeekEnd = endOfWeek(subDays(today, 7));
        return { startDate: lastWeekStart, endDate: lastWeekEnd };
      case 'this-month':
        return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
      case 'last-month':
        const lastMonthStart = startOfMonth(subDays(today, 30));
        const lastMonthEnd = endOfMonth(subDays(today, 30));
        return { startDate: lastMonthStart, endDate: lastMonthEnd };
      case 'last-7-days':
        return { startDate: subDays(today, 6), endDate: today };
      case 'last-30-days':
        return { startDate: subDays(today, 29), endDate: today };
      default:
        return { startDate: today, endDate: today };
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      setLoading(true);
      
      // Load employees for filter
      let employees: any[] = [];
      
      if (shouldShowCrossWorkspace && workspaceFilter === 'all') {
        // Owner in main workspace - load employees from all workspaces
        const workspaceData = await WorkspaceService.getUserAccessibleWorkspaces(user?.uid || '');
        const allWorkspaces = [
          ...workspaceData.mainWorkspaces,
          ...Object.values(workspaceData.subWorkspaces).flat()
        ];
        
        const allEmployees = await Promise.all(
          allWorkspaces.map(ws => 
            EmployeeService.getWorkspaceEmployees(ws.id).catch(err => {
              console.log(`Failed to load employees from workspace ${ws.id}:`, err);
              return [];
            })
          )
        );
        
        employees = allEmployees.flat().map(emp => ({
          ...emp,
          workspaceName: allWorkspaces.find(ws => ws.id === emp.workspaceId)?.name || 'Unknown Workspace'
        }));
      } else {
        // Regular workspace or specific workspace selected
        employees = await EmployeeService.getWorkspaceEmployees(workspaceId);
      }
      
      console.log('AttendanceList - Found employees:', employees.length, employees);
      setEmployees(employees);
      
      // Load workspaces for filter if owner
      if (shouldShowCrossWorkspace) {
        const workspaceData = await WorkspaceService.getUserAccessibleWorkspaces(user?.uid || '');
        const allWorkspaces = [
          ...workspaceData.mainWorkspaces,
          ...Object.values(workspaceData.subWorkspaces).flat()
        ];
        setWorkspaces(allWorkspaces);
      }
      
      // Get date range
      const dateRange = getDateRange(dateRangeFilter);
      
      // Load attendance records
      let records: AttendanceRecord[] = [];
      
      if (shouldShowCrossWorkspace && workspaceFilter !== 'all') {
        // Load from specific workspace
        records = await AttendanceService.getAttendanceRecords({
          workspaceId: workspaceFilter,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          employeeId: employeeFilter !== 'all' ? employeeFilter : undefined
        });
      } else {
        // Load from current workspace
        records = await AttendanceService.getAttendanceRecords({
          workspaceId: workspaceId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          employeeId: employeeFilter !== 'all' ? employeeFilter : undefined
        });
      }
      
      console.log('AttendanceList - Found records:', records.length, records);
      console.log('AttendanceList - Date range filter:', dateRangeFilter);
      console.log('AttendanceList - Date range:', dateRange);
      console.log('AttendanceList - Status filter:', statusFilter);
      console.log('AttendanceList - Workspace filter:', workspaceFilter);
      console.log('AttendanceList - Employee filter:', employeeFilter);
      setRecords(records);
    } catch (error) {
      console.error('Error loading attendance records:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance records. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, shouldShowCrossWorkspace, workspaceFilter, dateRangeFilter, statusFilter, employeeFilter, user?.uid, getDateRange, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = useCallback(async (record: AttendanceRecord) => {
    try {
      await AttendanceService.deleteAttendance(record.id);
      toast({
        title: 'Success',
        description: 'Attendance record deleted successfully.',
      });
      await loadData();
      if (onDataChange) {
        await onDataChange();
      }
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete attendance record. Please try again.',
        variant: 'destructive'
      });
    }
  }, [loadData, onDataChange, toast]);

  const handleEdit = useCallback((record: AttendanceRecord) => {
    router.push(`/dashboard/hr/attendance/edit/${record.id}`);
  }, [router]);

  const filteredRecords = records.filter(record => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        record.employeeName.toLowerCase().includes(searchLower) ||
        record.location?.toLowerCase().includes(searchLower) ||
        record.notes?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return <AttendanceLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-border/50 focus:border-primary"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-border/50 focus:border-primary">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="half-day">Half Day</SelectItem>
                <SelectItem value="work-from-home">Work from Home</SelectItem>
              </SelectContent>
            </Select>

            {/* Employee Filter */}
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="border-border/50 focus:border-primary">
                <SelectValue placeholder="Filter by employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex items-center space-x-2">
                      <span>{employee.personalInfo.firstName} {employee.personalInfo.lastName}</span>
                      {shouldShowCrossWorkspace && workspaceFilter === 'all' && employee.workspaceName && (
                        <Badge variant="outline" className="text-xs">
                          {employee.workspaceName}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="border-border/50 focus:border-primary">
                <SelectValue placeholder="Select date range" />
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

          {/* Workspace Filter for Owners */}
          {shouldShowCrossWorkspace && (
            <div className="mt-4">
              <Select value={workspaceFilter} onValueChange={setWorkspaceFilter}>
                <SelectTrigger className="border-border/50 focus:border-primary">
                  <SelectValue placeholder="Filter by workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workspaces</SelectItem>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {filteredRecords.length} attendance record{filteredRecords.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {canCreate && (
          <Link href="/dashboard/hr/attendance/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </Link>
        )}
      </div>

      {/* Records */}
      {filteredRecords.length === 0 ? (
        <Card className="card-enhanced">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Attendance Records</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || employeeFilter !== 'all' || dateRangeFilter !== 'all-time'
                ? 'No records match your current filters. Try adjusting your search criteria or use "All Time" to see all records.'
                : 'No attendance records found for the selected period.'}
            </p>
            {canCreate && (
              <Link href="/dashboard/hr/attendance/new">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Record
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map((record) => (
            <AttendanceCard
              key={record.id}
              record={record}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={handleEdit}
              onDelete={(record) => {
                setDeletingRecord(record);
                setShowDeleteDialog(true);
              }}
              showEmployeeName={true}
              showWorkspaceName={shouldShowCrossWorkspace && workspaceFilter === 'all'}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingRecord(null);
        }}
        onConfirm={() => {
          if (deletingRecord) {
            handleDelete(deletingRecord);
          }
          setShowDeleteDialog(false);
          setDeletingRecord(null);
        }}
        title="Delete Attendance Record"
        description="Are you sure you want to delete this attendance record? This action cannot be undone."
      />
    </div>
  );
}