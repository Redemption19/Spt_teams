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
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 8 }).map((_, i) => (
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage employee attendance for {format(new Date(), 'MMMM dd, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/dashboard/hr/attendance/analytics">
            <Button variant="outline" className="flex items-center space-x-2 hover:bg-accent hover:text-accent-foreground transition-colors">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Link href="/dashboard/hr/attendance/new">
            <Button className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
              <Plus className="h-4 w-4" />
              <span>Add Record</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Cross-workspace info for owners */}
      {shouldShowCrossWorkspace && (
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <Globe className="h-5 w-5 text-primary" />
              <span>Cross-Workspace Management</span>
              <Badge variant="outline" className="ml-2">
                <Globe className="h-3 w-3 mr-1" />
                Owner View
              </Badge>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Select a workspace to view and manage its attendance data
              {selectedWorkspace && allWorkspaces.length > 0 && (
                <span className="ml-2 font-medium text-foreground">
                  • Currently viewing: {allWorkspaces.find(ws => ws.id === selectedWorkspace)?.name || 'Unknown'}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Select value={selectedWorkspace} onValueChange={handleWorkspaceChange}>
                  <SelectTrigger className="border-border/50 focus:border-primary">
                    <SelectValue placeholder="Select a workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {allWorkspaces.map(workspace => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span>{workspace.name}</span>
                          {workspace.type && (
                            <Badge variant="outline" className="text-xs">
                              {workspace.type}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Total Workspaces:</span> {allWorkspaces.length}
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