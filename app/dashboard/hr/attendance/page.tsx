'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Plus, 
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Building,
  Users,
  Calendar,
  BarChart3,
  Globe,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { AttendanceStats as AttendanceStatsType, AttendanceService } from '@/lib/attendance-service';
import { EmployeeService } from '@/lib/employee-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { AttendanceStats } from '@/components/attendance/AttendanceStats';
import { AttendanceList } from '@/components/attendance/AttendanceList';
import { ClockInOut } from '@/components/attendance/ClockInOut';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AttendancePage() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AttendanceStatsType | null>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const prevSelectedWorkspaceRef = useRef<string>('');

  // Check if user is owner and in main workspace for cross-workspace functionality
  const isOwner = userProfile?.role === 'owner';
  const shouldShowCrossWorkspace = isOwner && currentWorkspace?.id;

  // Save selected workspace to localStorage when it changes
  const handleWorkspaceChange = (workspaceId: string) => {
    prevSelectedWorkspaceRef.current = selectedWorkspace;
    setSelectedWorkspace(workspaceId);
    if (shouldShowCrossWorkspace) {
      localStorage.setItem('attendance-selected-workspace', workspaceId);
    }
  };

  // Cleanup localStorage when user is no longer an owner
  useEffect(() => {
    if (!shouldShowCrossWorkspace) {
      localStorage.removeItem('attendance-selected-workspace');
    }
  }, [shouldShowCrossWorkspace]);

  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    
    try {
      setLoading(true);
      
      // Load saved workspace from localStorage first (for owners)
      const savedWorkspace = shouldShowCrossWorkspace ? localStorage.getItem('attendance-selected-workspace') : null;
      if (savedWorkspace && !selectedWorkspace) {
        setSelectedWorkspace(savedWorkspace);
      }
      
      if (shouldShowCrossWorkspace) {
        // Owner - load cross-workspace statistics
        const workspaceData = await WorkspaceService.getUserAccessibleWorkspaces(user?.uid || '');
        const allWorkspaces = [
          ...workspaceData.mainWorkspaces,
          ...Object.values(workspaceData.subWorkspaces).flat()
        ];
        setAllWorkspaces(allWorkspaces);
        
        // Set default selected workspace if none is selected or if selected workspace doesn't exist
        if (allWorkspaces.length > 0) {
          const currentSelectedWorkspace = selectedWorkspace || savedWorkspace;
          const workspaceExists = allWorkspaces.some(ws => ws.id === currentSelectedWorkspace);
          if (!currentSelectedWorkspace || !workspaceExists) {
            const defaultWorkspaceId = currentWorkspace.id;
            setSelectedWorkspace(defaultWorkspaceId);
            if (shouldShowCrossWorkspace) {
              localStorage.setItem('attendance-selected-workspace', defaultWorkspaceId);
            }
          }
        }
        
        // Load stats for selected workspace or current workspace
        const currentSelectedWorkspace = selectedWorkspace || savedWorkspace;
        
        if (currentSelectedWorkspace) {
          // Specific workspace selected
          const attendanceStats = await AttendanceService.getAttendanceStats(currentSelectedWorkspace, undefined, undefined);
          setStats(attendanceStats);
        } else {
          // All workspaces - get combined stats
          const workspaceIds = allWorkspaces.map(ws => ws.id);
          const attendanceStats = await AttendanceService.getMultiWorkspaceStats(workspaceIds, undefined, undefined);
          setStats(attendanceStats);
        }
      } else {
        // Regular workspace-specific statistics
        const attendanceStats = await AttendanceService.getAttendanceStats(currentWorkspace.id, undefined, undefined);
        setStats(attendanceStats);
      }
      
      // Try to find current user as employee for clock in/out functionality
      if (user?.uid) {
        try {
          let employees: any[] = [];
          
          if (shouldShowCrossWorkspace) {
            // Owner - search across all workspaces if no specific workspace is selected
            const currentSelectedWorkspace = selectedWorkspace || savedWorkspace;
            if (!currentSelectedWorkspace) {
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
              
              employees = allEmployees.flat();
            } else {
              // Specific workspace selected - load employees from that workspace
              employees = await EmployeeService.getWorkspaceEmployees(currentSelectedWorkspace);
            }
          } else {
            // Regular workspace - load employees from current workspace
            employees = await EmployeeService.getWorkspaceEmployees(currentWorkspace?.id);
          }
          
          console.log('Found employees:', employees.length, employees);
          const employee = employees.find(emp => 
            emp.personalInfo.email === user.email ||
            emp.createdBy === user.uid
          );
          console.log('Current user as employee:', employee);
          setCurrentEmployee(employee);
        } catch (error) {
          console.log('User not found as employee, clock in/out will be disabled');
        }
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, [currentWorkspace?.id, shouldShowCrossWorkspace, user?.uid, user?.email, toast, selectedWorkspace]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle workspace selection changes (but not during initial load)
  useEffect(() => {
    if (selectedWorkspace && shouldShowCrossWorkspace && initialLoadComplete) {
      const prevSelected = prevSelectedWorkspaceRef.current;
      if (prevSelected !== selectedWorkspace) {
        prevSelectedWorkspaceRef.current = selectedWorkspace;
        loadData();
      }
    }
  }, [selectedWorkspace, shouldShowCrossWorkspace, initialLoadComplete, loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleDataChange = useCallback(async () => {
    await loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4 sm:mb-6">
            <div className="flex-1">
              <div className="h-6 sm:h-8 bg-muted rounded w-3/4 sm:w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-full sm:w-2/3"></div>
            </div>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
              <div className="h-10 bg-muted rounded w-full sm:w-24"></div>
              <div className="h-10 bg-muted rounded w-full sm:w-24"></div>
              <div className="h-10 bg-muted rounded w-full sm:w-28"></div>
            </div>
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 sm:h-28 lg:h-32 bg-muted rounded"></div>
            ))}
          </div>
          {/* Content skeleton */}
          <div className="h-80 sm:h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
            Attendance Management
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm lg:text-base leading-relaxed">
            Track and manage employee attendance for {format(new Date(), 'MMMM dd, yyyy')}
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:flex-wrap sm:items-center sm:space-y-0 sm:space-x-2 md:space-x-3 md:flex-nowrap">
          <Link href="/dashboard/hr/attendance/analytics" className="w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full sm:w-auto h-9 sm:h-10 flex items-center justify-center space-x-2 hover:bg-accent hover:text-accent-foreground transition-colors text-xs sm:text-sm"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">Analytics</span>
              <span className="xs:hidden sm:hidden">Stats</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full sm:w-auto h-9 sm:h-10 flex items-center justify-center space-x-2 hover:bg-accent hover:text-accent-foreground transition-colors text-xs sm:text-sm"
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Link href="/dashboard/hr/attendance/new" className="w-full sm:w-auto">
            <Button 
              size="sm"
              className="w-full sm:w-auto h-9 sm:h-10 flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors text-xs sm:text-sm"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">Add Record</span>
              <span className="xs:hidden sm:hidden">Add</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Cross-workspace info for owners */}
      {shouldShowCrossWorkspace && (
        <Card className="card-enhanced">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle className="flex items-center space-x-2 text-foreground text-sm sm:text-base">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="truncate">Cross-Workspace Management</span>
              </CardTitle>
              <Badge variant="outline" className="self-start sm:self-center">
                <Globe className="h-3 w-3 mr-1" />
                <span className="text-xs">Owner View</span>
              </Badge>
            </div>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm">
              <div className="space-y-1">
                <div>Select a workspace to view and manage its attendance data</div>
                {selectedWorkspace && allWorkspaces.length > 0 && (
                  <div className="font-medium text-foreground text-xs sm:text-sm">
                    Currently viewing: <span className="truncate inline-block max-w-[200px] sm:max-w-none">
                      {allWorkspaces.find(ws => ws.id === selectedWorkspace)?.name || 'Unknown'}
                    </span>
                  </div>
                )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
              <div className="flex-1 min-w-0">
                <Select value={selectedWorkspace} onValueChange={handleWorkspaceChange}>
                  <SelectTrigger className="w-full h-9 sm:h-10 border-border/50 focus:border-primary text-xs sm:text-sm">
                    <SelectValue placeholder="Select a workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {allWorkspaces.map(workspace => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        <div className="flex items-center space-x-2 max-w-full">
                          <Building className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate text-xs sm:text-sm">{workspace.name}</span>
                          {workspace.type && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {workspace.type}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground text-center md:text-left flex-shrink-0">
                <span className="font-medium">Total:</span> {allWorkspaces.length} workspace{allWorkspaces.length !== 1 ? 's' : ''}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clock In/Out Section - Only for regular employees, not owners */}
      {currentEmployee && !isOwner && currentWorkspace?.id && (
        <ClockInOut
          employeeId={currentEmployee.id}
          employeeName={`${currentEmployee.personalInfo.firstName} ${currentEmployee.personalInfo.lastName}`}
          onAttendanceChange={handleDataChange}
        />
      )}

      {/* Statistics */}
      {stats && (
        <AttendanceStats stats={stats} loading={loading} />
      )}

      {/* Attendance List */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            <span>Attendance Records</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            View and manage employee attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceList
            workspaceId={selectedWorkspace || currentWorkspace?.id || ''}
            canEdit={userProfile?.role === 'admin' || userProfile?.role === 'owner'}
            canDelete={userProfile?.role === 'admin' || userProfile?.role === 'owner'}
            canCreate={userProfile?.role === 'admin' || userProfile?.role === 'owner'}
            onDataChange={handleDataChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}