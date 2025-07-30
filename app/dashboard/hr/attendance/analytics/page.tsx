'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Calendar,
  RefreshCw,
  Building,
  Download,
  Filter,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { AttendanceService, AttendanceRecord } from '@/lib/attendance-service';
import { EmployeeService } from '@/lib/employee-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';

interface AttendanceAnalytics {
  totalRecords: number;
  attendanceRate: number;
  avgWorkHours: number;
  totalOvertime: number;
  punctualityRate: number;
  absenteeismRate: number;
  wfhRate: number;
  
  // Trends
  dailyAttendance: { date: string; present: number; absent: number; late: number; total: number }[];
  weeklyTrends: { week: string; attendanceRate: number; avgHours: number }[];
  departmentStats: { department: string; attendanceRate: number; avgHours: number; employees: number }[];
  statusBreakdown: { status: string; count: number; percentage: number }[];
  
  // Time patterns
  peakHours: { hour: number; clockIns: number; clockOuts: number }[];
  workPatterns: { pattern: string; count: number; avgHours: number }[];
}

interface AnalyticsFilters {
  dateRange: 'all-time' | 'last-7-days' | 'last-30-days' | 'this-month' | 'last-month' | 'this-quarter' | 'custom';
  workspaceScope: 'current' | 'all';
  department?: string;
  employmentType?: string;
}

export default function AttendanceAnalyticsPage() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);

  // Check if user is owner and in main workspace for cross-workspace functionality
  const isOwner = userProfile?.role === 'owner';
  const shouldShowCrossWorkspace = isOwner && currentWorkspace?.id;

  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: 'all-time',
    workspaceScope: shouldShowCrossWorkspace ? 'all' : 'current'
  });

  // Date range options
  const dateFilters = useMemo(() => {
    const today = new Date();
    
    switch (filters.dateRange) {
      case 'all-time':
        // Return a very wide date range to effectively show all records
        return { startDate: new Date('2020-01-01'), endDate: new Date('2030-12-31') };
      case 'last-7-days':
        return { startDate: subDays(today, 6), endDate: today };
      case 'last-30-days':
        return { startDate: subDays(today, 29), endDate: today };
      case 'this-month':
        return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
      case 'last-month':
        const lastMonth = subDays(startOfMonth(today), 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      case 'this-quarter':
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
        return { startDate: quarterStart, endDate: quarterEnd };
      default:
        return { startDate: subDays(today, 29), endDate: today };
    }
  }, [filters.dateRange]);

  const calculateAdvancedAnalytics = useCallback((records: AttendanceRecord[], employees: any[]): AttendanceAnalytics => {
    const totalRecords = records.length;
    const totalEmployees = employees.length;
    
    if (totalRecords === 0) {
      return {
        totalRecords: 0,
        attendanceRate: 0,
        avgWorkHours: 0,
        totalOvertime: 0,
        punctualityRate: 0,
        absenteeismRate: 0,
        wfhRate: 0,
        dailyAttendance: [],
        weeklyTrends: [],
        departmentStats: [],
        statusBreakdown: [],
        peakHours: [],
        workPatterns: []
      };
    }

    // Calculate basic metrics
    const presentRecords = records.filter(r => r.status === 'present');
    const absentRecords = records.filter(r => r.status === 'absent');
    const lateRecords = records.filter(r => r.status === 'late');
    const wfhRecords = records.filter(r => r.status === 'work-from-home');
    
    const totalWorkHours = records.reduce((sum, r) => sum + (r.workHours || 0), 0);
    const totalOvertime = records.reduce((sum, r) => sum + (r.overtime || 0), 0);
    
    const attendanceRate = totalEmployees > 0 ? (presentRecords.length / totalRecords) * 100 : 0;
    const avgWorkHours = totalRecords > 0 ? totalWorkHours / totalRecords : 0;
    const punctualityRate = totalRecords > 0 ? ((presentRecords.length + wfhRecords.length) / totalRecords) * 100 : 0;
    const absenteeismRate = totalRecords > 0 ? (absentRecords.length / totalRecords) * 100 : 0;
    const wfhRate = totalRecords > 0 ? (wfhRecords.length / totalRecords) * 100 : 0;

    // Daily attendance trends
    const dailyAttendance = eachDayOfInterval({ start: dateFilters.startDate, end: dateFilters.endDate }).map(date => {
      const dayRecords = records.filter(r => format(parseISO(r.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
      const present = dayRecords.filter(r => r.status === 'present').length;
      const absent = dayRecords.filter(r => r.status === 'absent').length;
      const late = dayRecords.filter(r => r.status === 'late').length;
      
      return {
        date: format(date, 'MMM dd'),
        present,
        absent,
        late,
        total: dayRecords.length
      };
    });

    // Weekly trends
    const weeklyTrends = [];
    const weeks = Math.ceil(dateFilters.endDate.getTime() - dateFilters.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000);
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(dateFilters.startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
      const weekRecords = records.filter(r => {
        const recordDate = parseISO(r.date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });
      
      const weekAttendanceRate = weekRecords.length > 0 ? 
        (weekRecords.filter(r => r.status === 'present').length / weekRecords.length) * 100 : 0;
      const weekAvgHours = weekRecords.length > 0 ? 
        weekRecords.reduce((sum, r) => sum + (r.workHours || 0), 0) / weekRecords.length : 0;
      
      weeklyTrends.push({
        week: `Week ${i + 1}`,
        attendanceRate: weekAttendanceRate,
        avgHours: weekAvgHours
      });
    }

    // Department statistics
    const departmentStats: Array<{
      department: string;
      attendanceRate: number;
      avgHours: number;
      employees: number;
    }> = [];
    const departments = [...new Set(employees.map(emp => emp.employmentDetails.department).filter(Boolean))];
    departments.forEach(dept => {
      const deptEmployees = employees.filter(emp => emp.employmentDetails.department === dept);
      const deptRecords = records.filter(r => 
        deptEmployees.some(emp => emp.id === r.employeeId)
      );
      
      const deptAttendanceRate = deptRecords.length > 0 ? 
        (deptRecords.filter(r => r.status === 'present').length / deptRecords.length) * 100 : 0;
      const deptAvgHours = deptRecords.length > 0 ? 
        deptRecords.reduce((sum, r) => sum + (r.workHours || 0), 0) / deptRecords.length : 0;
      
      departmentStats.push({
        department: dept,
        attendanceRate: deptAttendanceRate,
        avgHours: deptAvgHours,
        employees: deptEmployees.length
      });
    });

    // Status breakdown
    const statusCounts = records.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / totalRecords) * 100
    }));

    // Peak hours analysis
    const peakHours = Array.from({ length: 24 }, (_, hour) => {
      const clockIns = records.filter(r => {
        if (!r.clockIn) return false;
        const clockInHour = parseInt(r.clockIn.split(':')[0]);
        return clockInHour === hour;
      }).length;
      
      const clockOuts = records.filter(r => {
        if (!r.clockOut) return false;
        const clockOutHour = parseInt(r.clockOut.split(':')[0]);
        return clockOutHour === hour;
      }).length;
      
      return { hour, clockIns, clockOuts };
    });

    // Work patterns
    const workPatterns = [
      { pattern: 'Regular (8h)', count: records.filter(r => r.workHours >= 7.5 && r.workHours <= 8.5).length, avgHours: 8 },
      { pattern: 'Long Day (9h+)', count: records.filter(r => r.workHours > 8.5).length, avgHours: 9.5 },
      { pattern: 'Short Day (<7h)', count: records.filter(r => r.workHours < 7.5).length, avgHours: 6 },
      { pattern: 'Half Day', count: records.filter(r => r.status === 'half-day').length, avgHours: 4 }
    ];

    return {
      totalRecords,
      attendanceRate,
      avgWorkHours,
      totalOvertime,
      punctualityRate,
      absenteeismRate,
      wfhRate,
      dailyAttendance,
      weeklyTrends,
      departmentStats,
      statusBreakdown,
      peakHours,
      workPatterns
    };
  }, [dateFilters]);

  const loadAnalytics = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    
    try {
      setLoading(true);
      
      let records: AttendanceRecord[] = [];
      let employees: any[] = [];
      
      if (shouldShowCrossWorkspace && filters.workspaceScope === 'all') {
        // Load cross-workspace data
        const workspaceData = await WorkspaceService.getUserAccessibleWorkspaces(user?.uid || '');
        const allWorkspaces = [
          ...workspaceData.mainWorkspaces,
          ...Object.values(workspaceData.subWorkspaces).flat()
        ];
        setAllWorkspaces(allWorkspaces);
        
                          // Load records from all workspaces
         const allRecords = await Promise.all(
           allWorkspaces.map(ws => 
             AttendanceService.getAttendanceRecords({
               workspaceId: ws.id,
               startDate: dateFilters.startDate,
               endDate: dateFilters.endDate
             })
           )
         );
         records = allRecords.flat();
         
         // Load employees from all workspaces
         const allEmployees = await Promise.all(
           allWorkspaces.map(ws => EmployeeService.getWorkspaceEmployees(ws.id))
         );
         employees = allEmployees.flat();
       } else {
         // Load current workspace data
         records = await AttendanceService.getAttendanceRecords({
           workspaceId: currentWorkspace.id,
           startDate: dateFilters.startDate,
           endDate: dateFilters.endDate
         });
         
         employees = await EmployeeService.getWorkspaceEmployees(currentWorkspace.id);
       }
      
      // Extract departments
      const deptSet = new Set(employees.map(emp => emp.employmentDetails.department).filter(Boolean));
      setDepartments(Array.from(deptSet));
      
      console.log('Analytics - Loaded records:', records.length);
      console.log('Analytics - Loaded employees:', employees.length);
      console.log('Analytics - Workspace scope:', filters.workspaceScope);
      console.log('Analytics - Should show cross-workspace:', shouldShowCrossWorkspace);
      
      // Calculate analytics
      const calculatedAnalytics = calculateAdvancedAnalytics(records, employees);
      setAnalytics(calculatedAnalytics);
      
    } catch (error) {
      console.error('Error loading attendance analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance analytics. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, shouldShowCrossWorkspace, filters, dateFilters, user?.uid, calculateAdvancedAnalytics, toast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  }, [loadAnalytics]);

  const formatPercentage = (value: number) => `${Math.round(value)}%`;
  const formatHours = (hours: number) => `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/hr/attendance">
            <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Attendance
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into attendance patterns and trends
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Cross-workspace info for owners */}
      {shouldShowCrossWorkspace && (
        <Alert className="border-accent/20 bg-accent/5">
          <Building className="h-4 w-4 text-accent" />
          <AlertDescription className="text-accent-foreground">
            You are viewing analytics across all accessible workspaces as an owner.
            Use the filters below to focus on specific workspaces or departments.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Date Range</label>
              <Select value={filters.dateRange} onValueChange={(value: any) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                <SelectTrigger className="border-border/50 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-time">All Time</SelectItem>
                  <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {shouldShowCrossWorkspace && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Workspace Scope</label>
                <Select value={filters.workspaceScope} onValueChange={(value: any) => setFilters(prev => ({ ...prev, workspaceScope: value }))}>
                  <SelectTrigger className="border-border/50 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Workspace</SelectItem>
                    <SelectItem value="all">All Workspaces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Department</label>
              <Select value={filters.department || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value === 'all' ? undefined : value }))}>
                <SelectTrigger className="border-border/50 focus:border-primary">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Employment Type</label>
              <Select value={filters.employmentType || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, employmentType: value === 'all' ? undefined : value }))}>
                <SelectTrigger className="border-border/50 focus:border-primary">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Content */}
      {analytics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                    <p className="text-2xl font-bold text-foreground">{formatPercentage(analytics.attendanceRate)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Work Hours</p>
                    <p className="text-2xl font-bold text-foreground">{formatHours(analytics.avgWorkHours)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-accent/10">
                    <Clock className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Punctuality Rate</p>
                    <p className="text-2xl font-bold text-foreground">{formatPercentage(analytics.punctualityRate)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.totalRecords}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Analytics Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Status Breakdown</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Distribution of attendance statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.statusBreakdown.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-sm font-medium text-foreground capitalize">{status.status.replace('-', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-foreground">{status.count}</span>
                        <span className="text-xs text-muted-foreground ml-2">({formatPercentage(status.percentage)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Department Performance */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <Building className="h-5 w-5 text-primary" />
                  <span>Department Performance</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Attendance rates by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.departmentStats.map((dept) => (
                    <div key={dept.department} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-foreground">{dept.department}</span>
                        <span className="text-xs text-muted-foreground ml-2">({dept.employees} employees)</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-foreground">{formatPercentage(dept.attendanceRate)}</span>
                        <span className="text-xs text-muted-foreground ml-2">({formatHours(dept.avgHours)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Work Patterns */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Work Patterns</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Distribution of work hour patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics.workPatterns.map((pattern) => (
                  <div key={pattern.pattern} className="text-center p-4 rounded-lg bg-muted/30 border border-border/30">
                    <div className="text-2xl font-bold text-foreground">{pattern.count}</div>
                    <div className="text-sm text-muted-foreground">{pattern.pattern}</div>
                    <div className="text-xs text-muted-foreground mt-1">Avg: {formatHours(pattern.avgHours)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}