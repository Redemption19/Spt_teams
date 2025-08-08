'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  CheckCircle,
  Clock,
  Briefcase,
  Download,
  RefreshCw,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { Employee, EmployeeService, EmployeeStats } from '@/lib/employee-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { EmployeeList } from '@/components/hr/employees/EmployeeList';
import { EmployeeLoadingSkeleton } from '@/components/hr/employees/EmployeeLoadingSkeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function EmployeesPage() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);

  // Check if user is owner and in main workspace for cross-workspace functionality
  const isOwner = userProfile?.role === 'owner';
  const shouldShowCrossWorkspace = isOwner && currentWorkspace?.id;

  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    
    try {
      setLoading(true);
      
      if (shouldShowCrossWorkspace) {
        // Owner - load cross-workspace statistics
        const workspaceData = await WorkspaceService.getUserAccessibleWorkspaces(user?.uid || '');
        const allWorkspaces = [
          ...workspaceData.mainWorkspaces,
          ...Object.values(workspaceData.subWorkspaces).flat()
        ];
        setAllWorkspaces(allWorkspaces);
        
        // Aggregate statistics across all workspaces
        const allStats = await Promise.all(
          allWorkspaces.map(workspace => EmployeeService.getEmployeeStats(workspace.id))
        );
        
        // Combine statistics
        const combinedStats: EmployeeStats = {
          totalEmployees: allStats.reduce((sum, stat) => sum + stat.totalEmployees, 0),
          activeEmployees: allStats.reduce((sum, stat) => sum + stat.activeEmployees, 0),
          onLeaveEmployees: allStats.reduce((sum, stat) => sum + stat.onLeaveEmployees, 0),
          newHiresThisMonth: allStats.reduce((sum, stat) => sum + stat.newHiresThisMonth, 0),
          departmentBreakdown: {},
          statusBreakdown: {},
          averageTenure: 0,
          turnoverRate: 0
        };
        
        // Combine department breakdown
        allStats.forEach(stat => {
          Object.entries(stat.departmentBreakdown).forEach(([dept, count]) => {
            combinedStats.departmentBreakdown[dept] = (combinedStats.departmentBreakdown[dept] || 0) + count;
          });
        });
        
        // Combine status breakdown
        allStats.forEach(stat => {
          Object.entries(stat.statusBreakdown).forEach(([status, count]) => {
            combinedStats.statusBreakdown[status] = (combinedStats.statusBreakdown[status] || 0) + count;
          });
        });
        
        // Calculate average tenure (simplified average)
        const totalTenure = allStats.reduce((sum, stat) => sum + stat.averageTenure, 0);
        combinedStats.averageTenure = allStats.length > 0 ? Math.round(totalTenure / allStats.length) : 0;
        
        setStats(combinedStats);
      } else {
        // Regular workspace-specific statistics
        const employeeStats = await EmployeeService.getEmployeeStats(currentWorkspace.id);
        setStats(employeeStats);
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, shouldShowCrossWorkspace, user?.uid, toast]);

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadData();
    }
  }, [currentWorkspace?.id, shouldShowCrossWorkspace, loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDataChange = async () => {
    await loadData();
  };

  if (loading) {
    return <EmployeeLoadingSkeleton />;
  }

  if (!currentWorkspace?.id) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
          <p className="text-muted-foreground">Please select a workspace to view employees.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
            {shouldShowCrossWorkspace ? 'Employee Management (All Workspaces)' : 'Employee Management'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {shouldShowCrossWorkspace
              ? 'Manage employee profiles across all your accessible workspaces'
              : 'Manage employee profiles, personal information, and employment details'
            }
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full sm:w-auto h-11 touch-target"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild className="w-full sm:w-auto h-11 touch-target">
            <Link href="/dashboard/hr/employees/analytics">
              <Briefcase className="w-4 h-4 mr-2" />
              Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* Cross-workspace info for owners */}
      {shouldShowCrossWorkspace && (
        <Alert>
          <Building className="h-4 w-4" />
          <AlertDescription>
            You&apos;re viewing aggregated employee data from {allWorkspaces.length} workspace{allWorkspaces.length > 1 ? 's' : ''}: {allWorkspaces.map(ws => ws.name).join(', ')}.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                {shouldShowCrossWorkspace ? 'Across all workspaces' : 'Active workforce'}
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Employees</CardTitle>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.activeEmployees}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalEmployees > 0 ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">On Leave</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.onLeaveEmployees}</div>
              <p className="text-xs text-muted-foreground">
                Currently on leave
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">New Hires</CardTitle>
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.newHiresThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Department Breakdown */}
      {stats && Object.keys(stats.departmentBreakdown).length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Department Breakdown</CardTitle>
              <CardDescription>
                Employee distribution by department
                {shouldShowCrossWorkspace && ' (across all workspaces)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.departmentBreakdown).map(([department, count]) => (
                  <div key={department} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{department}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{count}</Badge>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${stats.totalEmployees > 0 ? (count / stats.totalEmployees) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
              <CardDescription>
                Employee status distribution
                {shouldShowCrossWorkspace && ' (across all workspaces)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{status.replace('-', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{count}</Badge>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${stats.totalEmployees > 0 ? (count / stats.totalEmployees) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Employee List */}
      <EmployeeList
        workspaceId={currentWorkspace.id}
        canEdit={true}  // TODO: Implement permissions
        canDelete={true}  // TODO: Implement permissions
        canCreate={true}  // TODO: Implement permissions
        onDataChange={handleDataChange}
      />
    </div>
  );
}