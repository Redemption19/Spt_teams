'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Clock, 
  Calendar, 
  DollarSign, 
  UserPlus,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Plus,
  Filter,
  Search,
  Download,
  RefreshCw,
  Building,
  FileText,
  Info
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useCurrency } from '@/hooks/use-currency';
import { useToast } from '@/hooks/use-toast';
import { WorkspaceService } from '@/lib/workspace-service';
import Link from 'next/link';
import HROverview from '@/components/hr/overview/HROverview';
import HRActivityFeed from '@/components/hr/overview/HRActivityFeed';
import HRUpcomingEvents from '@/components/hr/overview/HRUpcomingEvents';
import EmployeesDataTable from '@/components/hr/tables/EmployeesDataTable';
import AttendanceDataTable from '@/components/hr/tables/AttendanceDataTable';
import LeavesDataTable from '@/components/hr/tables/LeavesDataTable';
import RecruitmentDataTable from '@/components/hr/tables/RecruitmentDataTable';

// Removed HROverviewData interface - now using individual component data

export default function HRManagementPage() {
  const { currentWorkspace } = useWorkspace();
  const { user, userProfile } = useAuth();
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);

  // Check if user is owner and in main workspace for cross-workspace functionality
  const isOwner = userProfile?.role === 'owner';
  const shouldShowCrossWorkspace = isOwner && !!currentWorkspace?.id;
  
  // Prepare workspace props for DataTables
  const workspaceId = currentWorkspace?.id;
  const workspaceIds = allWorkspaces.map(ws => ws.id);

  const loadWorkspaces = useCallback(async () => {
    if (!shouldShowCrossWorkspace || !user?.uid) return;
    
    try {
      setLoading(true);
      const workspaceData = await WorkspaceService.getUserAccessibleWorkspaces(user.uid);
      const allWorkspaces = [
        ...workspaceData.mainWorkspaces,
        ...Object.values(workspaceData.subWorkspaces).flat()
      ];
      setAllWorkspaces(allWorkspaces);
    } catch (error) {
      console.error('Error loading workspaces:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workspace data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [shouldShowCrossWorkspace, user?.uid, toast]);

  useEffect(() => {
    if (shouldShowCrossWorkspace) {
      loadWorkspaces();
    }
  }, [shouldShowCrossWorkspace, loadWorkspaces]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWorkspaces();
    setRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {shouldShowCrossWorkspace ? 'HR Management (All Workspaces)' : 'HR Management'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {shouldShowCrossWorkspace
                ? 'Manage HR operations across all your accessible workspaces'
                : 'Manage employees, attendance, leaves, payroll, and recruitment'
              }
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3">
          {shouldShowCrossWorkspace && (
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          {/* Quick Actions */}
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/hr/employees/new">
              <UserPlus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Employee</span>
              <span className="sm:hidden">Add Employee</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/hr/recruitment/jobs/new">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Post Job</span>
              <span className="sm:hidden">Post Job</span>
            </Link>
          </Button>
          <Button size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/hr/attendance">
              <Clock className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Clock In/Out</span>
              <span className="sm:hidden">Clock In/Out</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Cross-workspace info for owners */}
      {shouldShowCrossWorkspace && allWorkspaces.length > 0 && (
        <Alert>
          <Building className="h-4 w-4" />
          <AlertDescription>
            You&apos;re viewing aggregated HR data from {allWorkspaces.length} workspace{allWorkspaces.length > 1 ? 's' : ''}: {allWorkspaces.map(ws => ws.name).join(', ')}.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <HROverview 
        shouldShowCrossWorkspace={shouldShowCrossWorkspace}
        allWorkspaces={allWorkspaces}
        loading={loading}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-10 rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="employees" className="text-xs sm:text-sm">Employees</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs sm:text-sm">Attendance</TabsTrigger>
            <TabsTrigger value="leaves" className="text-xs sm:text-sm">Leaves</TabsTrigger>
            <TabsTrigger value="recruitment" className="text-xs sm:text-sm">Recruitment</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <HRActivityFeed />
            <HRUpcomingEvents />
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">Employee Management</h2>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/hr/employees/new">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Employee
              </Link>
            </Button>
          </div>
          <EmployeesDataTable 
            shouldShowCrossWorkspace={shouldShowCrossWorkspace}
            workspaceId={workspaceId}
            workspaceIds={workspaceIds}
          />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">Attendance & Time Tracking</h2>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/hr/attendance">
                <Clock className="w-4 h-4 mr-2" />
                Clock In/Out
              </Link>
            </Button>
          </div>
          <AttendanceDataTable 
            shouldShowCrossWorkspace={shouldShowCrossWorkspace}
            workspaceId={workspaceId}
            workspaceIds={workspaceIds}
          />
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">Leave Management</h2>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/hr/leaves/new">
                <Calendar className="w-4 h-4 mr-2" />
                Apply Leave
              </Link>
            </Button>
          </div>
          <LeavesDataTable 
            shouldShowCrossWorkspace={shouldShowCrossWorkspace}
            workspaceId={workspaceId}
            workspaceIds={workspaceIds}
          />
        </TabsContent>

        <TabsContent value="recruitment" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">Recruitment & Onboarding</h2>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/hr/recruitment/jobs/new">
                <Plus className="w-4 h-4 mr-2" />
                Post Job
              </Link>
            </Button>
          </div>
          <RecruitmentDataTable 
            shouldShowCrossWorkspace={shouldShowCrossWorkspace}
            workspaceId={workspaceId}
            workspaceIds={workspaceIds}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}