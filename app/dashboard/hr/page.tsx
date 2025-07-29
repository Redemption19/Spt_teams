'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Clock, 
  Calendar, 
  DollarSign, 
  UserPlus,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Plus,
  Filter,
  Search,
  Download
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useCurrency } from '@/hooks/use-currency';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface HROverviewData {
  employees: {
    total: number;
    active: number;
    onLeave: number;
    newHires: number;
    changePercentage: number;
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
    attendanceRate: number;
    changePercentage: number;
  };
  leaves: {
    pending: number;
    approved: number;
    rejected: number;
    totalDays: number;
    changePercentage: number;
  };
  payroll: {
    totalPayroll: number;
    averageSalary: number;
    pendingPayments: number;
    changePercentage: number;
  };
  recruitment: {
    openPositions: number;
    totalApplications: number;
    inProgress: number;
    hired: number;
    changePercentage: number;
  };
}

export default function HRManagementPage() {
  const { currentWorkspace } = useWorkspace();
  const { userProfile } = useAuth();
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [hrData, setHrData] = useState<HROverviewData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadHRData();
  }, [currentWorkspace?.id]);

  const loadHRData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      const mockData: HROverviewData = {
        employees: {
          total: 85,
          active: 82,
          onLeave: 3,
          newHires: 5,
          changePercentage: 8.5
        },
        attendance: {
          present: 78,
          absent: 4,
          late: 2,
          attendanceRate: 94.5,
          changePercentage: 2.1
        },
        leaves: {
          pending: 8,
          approved: 15,
          rejected: 2,
          totalDays: 127,
          changePercentage: -5.2
        },
        payroll: {
          totalPayroll: 485000,
          averageSalary: 5735,
          pendingPayments: 3,
          changePercentage: 6.8
        },
        recruitment: {
          openPositions: 12,
          totalApplications: 156,
          inProgress: 45,
          hired: 8,
          changePercentage: 15.3
        }
      };
      
      setHrData(mockData);
    } catch (error) {
      console.error('Error loading HR data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load HR data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTrend = (percentage: number): string => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (percentage < 0) {
      return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    }
    return <TrendingUp className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="card-enhanced">
              <CardHeader>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Management</h1>
          <p className="text-muted-foreground">
            Manage employees, attendance, leaves, payroll, and recruitment
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/hr/employees/new">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Employee
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/hr/recruitment/jobs/new">
              <Plus className="w-4 h-4 mr-2" />
              Post Job
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/hr/attendance">
              <Clock className="w-4 h-4 mr-2" />
              Clock In/Out
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {/* Employees Card */}
        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrData?.employees.total}</div>
            <p className="text-xs text-muted-foreground">
              {hrData?.employees.active} active, {hrData?.employees.onLeave} on leave
            </p>
            <div className="flex items-center mt-1">
              {getTrendIcon(hrData?.employees.changePercentage || 0)}
              <span className="text-xs ml-1">
                {formatTrend(hrData?.employees.changePercentage || 0)} from last month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Card */}
        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrData?.attendance.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {hrData?.attendance.present} present, {hrData?.attendance.absent} absent
            </p>
            <div className="flex items-center mt-1">
              {getTrendIcon(hrData?.attendance.changePercentage || 0)}
              <span className="text-xs ml-1">
                {formatTrend(hrData?.attendance.changePercentage || 0)} from last week
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Leave Requests Card */}
        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrData?.leaves.pending}</div>
            <p className="text-xs text-muted-foreground">
              Pending approval
            </p>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="text-xs">
                {hrData?.leaves.totalDays} days this month
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Card */}
        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(hrData?.payroll.totalPayroll || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Monthly payroll
            </p>
            <div className="flex items-center mt-1">
              {getTrendIcon(hrData?.payroll.changePercentage || 0)}
              <span className="text-xs ml-1">
                {formatTrend(hrData?.payroll.changePercentage || 0)} from last month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recruitment Card */}
        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recruitment</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrData?.recruitment.openPositions}</div>
            <p className="text-xs text-muted-foreground">
              Open positions
            </p>
            <div className="flex items-center mt-1">
              <Badge variant="secondary" className="text-xs">
                {hrData?.recruitment.totalApplications} applications
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest HR activities across all modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">John Doe clocked in</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Leave request approved for Sarah Smith</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New job application received</p>
                      <p className="text-xs text-muted-foreground">3 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payroll generated for December</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Important dates and deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Performance Reviews Due</p>
                      <p className="text-xs text-muted-foreground">In 3 days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payroll Processing</p>
                      <p className="text-xs text-muted-foreground">In 5 days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Team Building Event</p>
                      <p className="text-xs text-muted-foreground">Next week</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Contract Renewals</p>
                      <p className="text-xs text-muted-foreground">15 contracts expiring this month</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Employee Management</h2>
            <Button asChild>
              <Link href="/dashboard/hr/employees">
                <Users className="w-4 h-4 mr-2" />
                View All Employees
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground">
            Manage employee profiles, track employment details, and maintain personnel records.
          </p>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Attendance & Time Tracking</h2>
            <Button asChild>
              <Link href="/dashboard/hr/attendance">
                <Clock className="w-4 h-4 mr-2" />
                View Attendance
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground">
            Track employee attendance, work hours, and manage time-related activities.
          </p>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Leave Management</h2>
            <Button asChild>
              <Link href="/dashboard/hr/leaves">
                <Calendar className="w-4 h-4 mr-2" />
                Manage Leaves
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground">
            Handle leave requests, approve/reject applications, and track leave balances.
          </p>
        </TabsContent>

        <TabsContent value="recruitment" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recruitment & Onboarding</h2>
            <Button asChild>
              <Link href="/dashboard/hr/recruitment">
                <UserPlus className="w-4 h-4 mr-2" />
                View Recruitment
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground">
            Manage job postings, track applications, and handle the recruitment process.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
} 