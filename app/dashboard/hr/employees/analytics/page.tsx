'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  PieChart,
  Calendar,
  DollarSign,
  Clock,
  Building,
  UserCheck,
  UserX,
  UserPlus,
  Download,
  RefreshCw,
  ArrowLeft,
  Target,
  Briefcase,
  MapPin,
  GraduationCap,
  Award,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { Employee, EmployeeService, EmployeeStats } from '@/lib/employee-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { useCurrency } from '@/hooks/use-currency';
import Link from 'next/link';
import { format, subDays, subMonths, subYears, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface EmployeeAnalytics {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  newHiresThisMonth: number;
  departmentBreakdown: { [department: string]: number };
  statusBreakdown: { [status: string]: number };
  averageTenure: number;
  turnoverRate: number;
  employmentTypeBreakdown: { [type: string]: number };
  workLocationBreakdown: { [location: string]: number };
  genderBreakdown: { [gender: string]: number };
  ageGroupBreakdown: { [ageGroup: string]: number };
  salaryRangeBreakdown: { [range: string]: number };
  hiringTrends: Array<{
    month: string;
    hires: number;
    terminations: number;
    netChange: number;
  }>;
  departmentSalaryAnalysis: Array<{
    department: string;
    averageSalary: number;
    minSalary: number;
    maxSalary: number;
    employeeCount: number;
  }>;
  tenureAnalysis: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  upcomingProbationEnds: Employee[];
  upcomingContractEnds: Employee[];
}

interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
    preset: 'last-30-days' | 'last-3-months' | 'last-6-months' | 'last-year';
  };
  department?: string;
  status?: string;
  employmentType?: string;
}

export default function EmployeeAnalyticsPage() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { formatAmount } = useCurrency();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<EmployeeAnalytics | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<'last-30-days' | 'last-3-months' | 'last-6-months' | 'last-year'>('last-3-months');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user is owner and in main workspace for cross-workspace functionality
  const isOwner = userProfile?.role === 'owner';
  const shouldShowCrossWorkspace = isOwner && currentWorkspace?.id;

  // Calculate date ranges based on preset
  const dateFilters = useMemo((): AnalyticsFilters => {
    const now = new Date();
    const to = new Date(now);
    let from = new Date(now);

    switch (selectedPreset) {
      case 'last-30-days':
        from.setDate(now.getDate() - 30);
        break;
      case 'last-3-months':
        from.setMonth(now.getMonth() - 3);
        break;
      case 'last-6-months':
        from.setMonth(now.getMonth() - 6);
        break;
      case 'last-year':
        from.setFullYear(now.getFullYear() - 1);
        break;
    }

    return {
      dateRange: { from, to, preset: selectedPreset },
      department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined
    };
  }, [selectedPreset, selectedDepartment, selectedStatus]);

  // Calculate advanced analytics from employee data
  const calculateAdvancedAnalytics = useCallback((employeeData: Employee[]): EmployeeAnalytics => {
    const now = new Date();
    const thisMonth = startOfMonth(now);
    
    // Basic stats
    const totalEmployees = employeeData.length;
    const activeEmployees = employeeData.filter(emp => emp.status === 'active').length;
    const onLeaveEmployees = employeeData.filter(emp => emp.status === 'on-leave').length;
    const newHiresThisMonth = employeeData.filter(emp => 
      new Date(emp.employmentDetails.hireDate) >= thisMonth
    ).length;

    // Department breakdown
    const departmentBreakdown: { [department: string]: number } = {};
    employeeData.forEach(emp => {
      const dept = emp.employmentDetails.department;
      departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + 1;
    });

    // Status breakdown
    const statusBreakdown: { [status: string]: number } = {};
    employeeData.forEach(emp => {
      statusBreakdown[emp.status] = (statusBreakdown[emp.status] || 0) + 1;
    });

    // Employment type breakdown
    const employmentTypeBreakdown: { [type: string]: number } = {};
    employeeData.forEach(emp => {
      const type = emp.employmentDetails.employmentType;
      employmentTypeBreakdown[type] = (employmentTypeBreakdown[type] || 0) + 1;
    });

    // Work location breakdown
    const workLocationBreakdown: { [location: string]: number } = {};
    employeeData.forEach(emp => {
      const location = emp.employmentDetails.workLocation;
      workLocationBreakdown[location] = (workLocationBreakdown[location] || 0) + 1;
    });

    // Gender breakdown
    const genderBreakdown: { [gender: string]: number } = {};
    employeeData.forEach(emp => {
      const gender = emp.personalInfo.gender;
      genderBreakdown[gender] = (genderBreakdown[gender] || 0) + 1;
    });

    // Age group breakdown
    const ageGroupBreakdown: { [ageGroup: string]: number } = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56+': 0
    };
    employeeData.forEach(emp => {
      const birthDate = new Date(emp.personalInfo.dateOfBirth);
      const age = now.getFullYear() - birthDate.getFullYear();
      if (age <= 25) ageGroupBreakdown['18-25']++;
      else if (age <= 35) ageGroupBreakdown['26-35']++;
      else if (age <= 45) ageGroupBreakdown['36-45']++;
      else if (age <= 55) ageGroupBreakdown['46-55']++;
      else ageGroupBreakdown['56+']++;
    });

    // Salary range breakdown
    const salaryRangeBreakdown: { [range: string]: number } = {
      '0-30k': 0,
      '30k-50k': 0,
      '50k-75k': 0,
      '75k-100k': 0,
      '100k+': 0
    };
    employeeData.forEach(emp => {
      const salary = emp.compensation.baseSalary;
      if (salary < 30000) salaryRangeBreakdown['0-30k']++;
      else if (salary < 50000) salaryRangeBreakdown['30k-50k']++;
      else if (salary < 75000) salaryRangeBreakdown['50k-75k']++;
      else if (salary < 100000) salaryRangeBreakdown['75k-100k']++;
      else salaryRangeBreakdown['100k+']++;
    });

    // Calculate average tenure
    let averageTenure = 0;
    if (employeeData.length > 0) {
      const totalTenure = employeeData.reduce((sum, emp) => {
        const hireDate = new Date(emp.employmentDetails.hireDate);
        const tenure = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30); // months
        return sum + tenure;
      }, 0);
      averageTenure = Math.round(totalTenure / employeeData.length);
    }

    // Hiring trends (last 12 months)
    const hiringTrends: Array<{ month: string; hires: number; terminations: number; netChange: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const hires = employeeData.filter(emp => {
        const hireDate = new Date(emp.employmentDetails.hireDate);
        return isWithinInterval(hireDate, { start: monthStart, end: monthEnd });
      }).length;
      
      // For terminations, we'd need termination date field - using status as proxy
      const terminations = 0; // Would need termination tracking
      
      hiringTrends.push({
        month: format(monthDate, 'MMM yyyy'),
        hires,
        terminations,
        netChange: hires - terminations
      });
    }

    // Department salary analysis
    const departmentSalaryAnalysis: Array<{
      department: string;
      averageSalary: number;
      minSalary: number;
      maxSalary: number;
      employeeCount: number;
    }> = [];
    
    Object.keys(departmentBreakdown).forEach(dept => {
      const deptEmployees = employeeData.filter(emp => emp.employmentDetails.department === dept);
      const salaries = deptEmployees.map(emp => emp.compensation.baseSalary);
      
      if (salaries.length > 0) {
        departmentSalaryAnalysis.push({
          department: dept,
          averageSalary: Math.round(salaries.reduce((sum, sal) => sum + sal, 0) / salaries.length),
          minSalary: Math.min(...salaries),
          maxSalary: Math.max(...salaries),
          employeeCount: deptEmployees.length
        });
      }
    });

    // Tenure analysis
    const tenureAnalysis: Array<{ range: string; count: number; percentage: number }> = [
      { range: '0-6 months', count: 0, percentage: 0 },
      { range: '6-12 months', count: 0, percentage: 0 },
      { range: '1-2 years', count: 0, percentage: 0 },
      { range: '2-5 years', count: 0, percentage: 0 },
      { range: '5+ years', count: 0, percentage: 0 }
    ];
    
    employeeData.forEach(emp => {
      const hireDate = new Date(emp.employmentDetails.hireDate);
      const tenureMonths = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      if (tenureMonths < 6) tenureAnalysis[0].count++;
      else if (tenureMonths < 12) tenureAnalysis[1].count++;
      else if (tenureMonths < 24) tenureAnalysis[2].count++;
      else if (tenureMonths < 60) tenureAnalysis[3].count++;
      else tenureAnalysis[4].count++;
    });
    
    tenureAnalysis.forEach(item => {
      item.percentage = totalEmployees > 0 ? Math.round((item.count / totalEmployees) * 100) : 0;
    });

    // Upcoming probation ends (next 30 days)
    const upcomingProbationEnds = employeeData.filter(emp => {
      if (!emp.employmentDetails.probationEndDate) return false;
      const probationEnd = new Date(emp.employmentDetails.probationEndDate);
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return probationEnd >= now && probationEnd <= thirtyDaysFromNow;
    });

    // Upcoming contract ends (next 60 days)
    const upcomingContractEnds = employeeData.filter(emp => {
      if (!emp.employmentDetails.contractEndDate) return false;
      const contractEnd = new Date(emp.employmentDetails.contractEndDate);
      const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      return contractEnd >= now && contractEnd <= sixtyDaysFromNow;
    });

    return {
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      newHiresThisMonth,
      departmentBreakdown,
      statusBreakdown,
      averageTenure,
      turnoverRate: 0, // Would need historical data
      employmentTypeBreakdown,
      workLocationBreakdown,
      genderBreakdown,
      ageGroupBreakdown,
      salaryRangeBreakdown,
      hiringTrends,
      departmentSalaryAnalysis,
      tenureAnalysis,
      upcomingProbationEnds,
      upcomingContractEnds
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    
    try {
      setLoading(true);
      
      let allEmployees: Employee[] = [];
      
      if (shouldShowCrossWorkspace) {
        // Owner - load cross-workspace data
        const workspaceData = await WorkspaceService.getUserAccessibleWorkspaces(user?.uid || '');
        const workspaces = [
          ...workspaceData.mainWorkspaces,
          ...Object.values(workspaceData.subWorkspaces).flat()
        ];
        setAllWorkspaces(workspaces);
        
        // Get employees from all workspaces
        const employeePromises = workspaces.map(workspace => 
          EmployeeService.getWorkspaceEmployees(workspace.id)
        );
        const employeeArrays = await Promise.all(employeePromises);
        allEmployees = employeeArrays.flat();
      } else {
        // Regular workspace-specific data
        allEmployees = await EmployeeService.getWorkspaceEmployees(currentWorkspace.id);
      }
      
      // Apply filters
      let filteredEmployees = allEmployees;
      
      if (dateFilters.department) {
        filteredEmployees = filteredEmployees.filter(emp => 
          emp.employmentDetails.department === dateFilters.department
        );
      }
      
      if (dateFilters.status) {
        filteredEmployees = filteredEmployees.filter(emp => emp.status === dateFilters.status);
      }
      
      setEmployees(filteredEmployees);
      
      // Calculate analytics
      const analyticsData = calculateAdvancedAnalytics(filteredEmployees);
      setAnalytics(analyticsData);
      
    } catch (error) {
      console.error('Error loading employee analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee analytics. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, shouldShowCrossWorkspace, user?.uid, dateFilters, calculateAdvancedAnalytics, toast]);

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadData();
    }
  }, [loadData, currentWorkspace?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(employees.map(emp => emp.employmentDetails.department));
    return Array.from(depts).sort();
  }, [employees]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-96 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-muted animate-pulse rounded"></div>
            <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentWorkspace?.id) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
          <p className="text-muted-foreground">Please select a workspace to view employee analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/hr/employees">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Employees
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {shouldShowCrossWorkspace ? 'Employee Analytics (All Workspaces)' : 'Employee Analytics'}
          </h1>
          <p className="text-muted-foreground">
            {shouldShowCrossWorkspace
              ? `Comprehensive analytics across ${allWorkspaces.length} workspace${allWorkspaces.length > 1 ? 's' : ''}`
              : 'Comprehensive insights into your workforce data and trends'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Cross-workspace info for owners */}
      {shouldShowCrossWorkspace && (
        <Alert>
          <Building className="h-4 w-4" />
          <AlertDescription>
            You&apos;re viewing aggregated employee analytics from {allWorkspaces.length} workspace{allWorkspaces.length > 1 ? 's' : ''}: {allWorkspaces.map(ws => ws.name).join(', ')}.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedPreset} onValueChange={(value: any) => setSelectedPreset(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-40">
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
        
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on-leave">On Leave</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="resigned">Resigned</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="ml-auto text-sm text-muted-foreground">
          Showing data for {format(dateFilters.dateRange.from, 'MMM dd, yyyy')} - {format(dateFilters.dateRange.to, 'MMM dd, yyyy')}
        </div>
      </div>

      {analytics && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="compensation">Compensation</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalEmployees}</div>
                  <p className="text-xs text-muted-foreground">
                    {shouldShowCrossWorkspace ? 'Across all workspaces' : 'Current workforce'}
                  </p>
                </CardContent>
              </Card>

              <Card className="stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{analytics.activeEmployees}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.totalEmployees > 0 ? Math.round((analytics.activeEmployees / analytics.totalEmployees) * 100) : 0}% of total
                  </p>
                </CardContent>
              </Card>

              <Card className="stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New Hires</CardTitle>
                  <UserPlus className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{analytics.newHiresThisMonth}</div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card className="stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Tenure</CardTitle>
                  <Award className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{analytics.averageTenure}</div>
                  <p className="text-xs text-muted-foreground">
                    Months
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Department and Status Overview */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle>Department Distribution</CardTitle>
                  <CardDescription>
                    Employee count by department
                    {shouldShowCrossWorkspace && ' (across all workspaces)'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.departmentBreakdown)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 8)
                      .map(([department, count]) => {
                        const percentage = analytics.totalEmployees > 0 ? (count / analytics.totalEmployees) * 100 : 0;
                        return (
                          <div key={department} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm font-medium truncate">{department}</span>
                              <div className="flex-1 mx-2">
                                <Progress value={percentage} className="h-2" />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{count}</Badge>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                </CardContent>
              </Card>

              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle>Employment Status</CardTitle>
                  <CardDescription>
                    Current status distribution
                    {shouldShowCrossWorkspace && ' (across all workspaces)'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.statusBreakdown).map(([status, count]) => {
                      const percentage = analytics.totalEmployees > 0 ? (count / analytics.totalEmployees) * 100 : 0;
                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'active': return 'text-green-600';
                          case 'on-leave': return 'text-yellow-600';
                          case 'suspended': return 'text-red-600';
                          case 'resigned': return 'text-gray-600';
                          case 'terminated': return 'text-red-800';
                          default: return 'text-gray-600';
                        }
                      };
                      
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm font-medium capitalize">{status.replace('-', ' ')}</span>
                            <div className="flex-1 mx-2">
                              <Progress value={percentage} className="h-2" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusColor(status)}>{count}</Badge>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Employment Type and Work Location */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle>Employment Type</CardTitle>
                  <CardDescription>Distribution by employment type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.employmentTypeBreakdown).map(([type, count]) => {
                      const percentage = analytics.totalEmployees > 0 ? (count / analytics.totalEmployees) * 100 : 0;
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm font-medium capitalize">{type.replace('-', ' ')}</span>
                            <div className="flex-1 mx-2">
                              <Progress value={percentage} className="h-2" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{count}</Badge>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle>Work Location</CardTitle>
                  <CardDescription>Distribution by work arrangement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.workLocationBreakdown).map(([location, count]) => {
                      const percentage = analytics.totalEmployees > 0 ? (count / analytics.totalEmployees) * 100 : 0;
                      return (
                        <div key={location} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm font-medium capitalize">{location}</span>
                            <div className="flex-1 mx-2">
                              <Progress value={percentage} className="h-2" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{count}</Badge>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="demographics" className="space-y-6">
            {/* Gender and Age Demographics */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle>Gender Distribution</CardTitle>
                  <CardDescription>Workforce gender breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.genderBreakdown).map(([gender, count]) => {
                      const percentage = analytics.totalEmployees > 0 ? (count / analytics.totalEmployees) * 100 : 0;
                      return (
                        <div key={gender} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm font-medium capitalize">{gender}</span>
                            <div className="flex-1 mx-2">
                              <Progress value={percentage} className="h-2" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{count}</Badge>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle>Age Groups</CardTitle>
                  <CardDescription>Employee age distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.ageGroupBreakdown).map(([ageGroup, count]) => {
                      const percentage = analytics.totalEmployees > 0 ? (count / analytics.totalEmployees) * 100 : 0;
                      return (
                        <div key={ageGroup} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm font-medium">{ageGroup}</span>
                            <div className="flex-1 mx-2">
                              <Progress value={percentage} className="h-2" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{count}</Badge>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tenure Analysis */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Tenure Analysis</CardTitle>
                <CardDescription>Employee tenure distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-5">
                  {analytics.tenureAnalysis.map((item, index) => (
                    <div key={index} className="text-center p-4 rounded-lg bg-muted/30">
                      <div className="text-2xl font-bold text-primary">{item.count}</div>
                      <div className="text-sm font-medium">{item.range}</div>
                      <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compensation" className="space-y-6">
            {/* Salary Range Distribution */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Salary Range Distribution</CardTitle>
                <CardDescription>Employee distribution by salary ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.salaryRangeBreakdown).map(([range, count]) => {
                    const percentage = analytics.totalEmployees > 0 ? (count / analytics.totalEmployees) * 100 : 0;
                    return (
                      <div key={range} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm font-medium">{range}</span>
                          <div className="flex-1 mx-2">
                            <Progress value={percentage} className="h-2" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{count}</Badge>
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Department Salary Analysis */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Department Salary Analysis</CardTitle>
                <CardDescription>Salary statistics by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Department</th>
                        <th className="text-right p-2 font-medium">Employees</th>
                        <th className="text-right p-2 font-medium">Avg Salary</th>
                        <th className="text-right p-2 font-medium">Min Salary</th>
                        <th className="text-right p-2 font-medium">Max Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.departmentSalaryAnalysis
                        .sort((a, b) => b.averageSalary - a.averageSalary)
                        .map((dept, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-medium">{dept.department}</td>
                          <td className="p-2 text-right">{dept.employeeCount}</td>
                          <td className="p-2 text-right font-medium">{formatAmount(dept.averageSalary)}</td>
                          <td className="p-2 text-right text-muted-foreground">{formatAmount(dept.minSalary)}</td>
                          <td className="p-2 text-right text-muted-foreground">{formatAmount(dept.maxSalary)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Hiring Trends */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Hiring Trends</CardTitle>
                <CardDescription>Monthly hiring activity over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-2 text-xs text-muted-foreground">
                    {analytics.hiringTrends.slice(-6).map((trend, index) => (
                      <div key={index} className="text-center">
                        <div className="font-medium">{trend.month}</div>
                        <div className="h-20 flex items-end justify-center mt-2">
                          <div 
                            className="w-6 bg-primary/70 rounded-t" 
                            style={{ height: `${Math.max((trend.hires / Math.max(...analytics.hiringTrends.map(t => t.hires), 1)) * 80, 4)}px` }}
                          ></div>
                        </div>
                        <div className="mt-1 text-primary font-medium">{trend.hires}</div>
                        <div className="text-xs">hires</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            {/* Upcoming Events */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    Upcoming Probation Ends
                  </CardTitle>
                  <CardDescription>Probation periods ending in the next 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.upcomingProbationEnds.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.upcomingProbationEnds.slice(0, 5).map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <div className="font-medium">
                              {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.employmentDetails.department}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {employee.employmentDetails.probationEndDate && 
                                format(new Date(employee.employmentDetails.probationEndDate), 'MMM dd, yyyy')
                              }
                            </div>
                            <Badge variant="outline" className="text-yellow-600">
                              Probation Ending
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {analytics.upcomingProbationEnds.length > 5 && (
                        <div className="text-center text-sm text-muted-foreground">
                          +{analytics.upcomingProbationEnds.length - 5} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No upcoming probation ends
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-red-500" />
                    Upcoming Contract Ends
                  </CardTitle>
                  <CardDescription>Contracts ending in the next 60 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.upcomingContractEnds.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.upcomingContractEnds.slice(0, 5).map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <div className="font-medium">
                              {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.employmentDetails.department}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {employee.employmentDetails.contractEndDate && 
                                format(new Date(employee.employmentDetails.contractEndDate), 'MMM dd, yyyy')
                              }
                            </div>
                            <Badge variant="outline" className="text-red-600">
                              Contract Ending
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {analytics.upcomingContractEnds.length > 5 && (
                        <div className="text-center text-sm text-muted-foreground">
                          +{analytics.upcomingContractEnds.length - 5} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No upcoming contract ends
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}