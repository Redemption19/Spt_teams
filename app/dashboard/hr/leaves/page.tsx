'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Download,
  Building,
  Users,
  Clock,
  RefreshCw,
  Globe,
  ChevronDown,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { LeaveService, LeaveStats } from '@/lib/leave-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { EmployeeService } from '@/lib/employee-service';
import Link from 'next/link';
import { format } from 'date-fns';
import LeaveStatsComponent from '@/components/leave/LeaveStats';
import LeaveList from '@/components/leave/LeaveList';
import LeaveBalances from '@/components/leave/LeaveBalances';
import LeaveTypes from '@/components/leave/LeaveTypes';
import TeamCalendar from '@/components/leave/TeamCalendar';
import EmployeeLeaveDashboard from '@/components/leave/EmployeeLeaveDashboard';
import AnnualLeaveApplicationsList from '@/components/leave/AnnualLeaveApplicationsList';
import { Label } from '@/components/ui/label';

export default function LeavesPage() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const prevSelectedWorkspaceRef = useRef<string>('');
  const [activeTab, setActiveTab] = useState('requests');
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);

  // Check user role and permissions
  const isOwner = userProfile?.role === 'owner';
  const isAdmin = userProfile?.role === 'admin';
  const isMember = userProfile?.role === 'member';
  const shouldShowCrossWorkspace = isOwner && currentWorkspace?.id;
  const canManageLeave = isOwner || isAdmin;
  const isEmployee = isMember;
  


  const handleWorkspaceChange = (workspaceId: string) => {
    prevSelectedWorkspaceRef.current = selectedWorkspace;
    setSelectedWorkspace(workspaceId);
    if (shouldShowCrossWorkspace) {
      localStorage.setItem('leave-selected-workspace', workspaceId);
    }
  };

  // Cleanup localStorage when user is no longer an owner
  useEffect(() => {
    if (!shouldShowCrossWorkspace) {
      localStorage.removeItem('leave-selected-workspace');
    }
  }, [shouldShowCrossWorkspace]);

  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    try {
      setLoading(true);

      // Load saved workspace from localStorage first (for owners)
      const savedWorkspace = shouldShowCrossWorkspace ? localStorage.getItem('leave-selected-workspace') : null;
      if (savedWorkspace && !selectedWorkspace) {
        setSelectedWorkspace(savedWorkspace);
      }

      if (shouldShowCrossWorkspace) {
        // Owner - load cross-workspace statistics
        const workspaceData = await WorkspaceService.getUserAccessibleWorkspaces(user?.uid || '');
        const allWorkspacesData = [
          ...workspaceData.mainWorkspaces,
          ...Object.values(workspaceData.subWorkspaces).flat()
        ];
        setAllWorkspaces(allWorkspacesData);

        // Set default selected workspace if none is selected or if selected workspace doesn't exist
        if (allWorkspacesData.length > 0) {
          const currentSelectedWorkspace = selectedWorkspace || savedWorkspace;
          const workspaceExists = allWorkspacesData.some(ws => ws.id === currentSelectedWorkspace);
          if (!currentSelectedWorkspace || !workspaceExists) {
            const defaultWorkspaceId = currentWorkspace.id;
            setSelectedWorkspace(defaultWorkspaceId);
            if (shouldShowCrossWorkspace) {
              localStorage.setItem('leave-selected-workspace', defaultWorkspaceId);
            }
          }
        }

        // Load stats for selected workspace or current workspace
        const currentSelectedWorkspace = selectedWorkspace || savedWorkspace;

        if (currentSelectedWorkspace) {
          const leaveStats = await LeaveService.getLeaveStats(currentSelectedWorkspace);
          setStats(leaveStats);
        }
      } else {
        // Regular workspace-specific statistics
        const leaveStats = await LeaveService.getLeaveStats(currentWorkspace.id);
        setStats(leaveStats);
      }

      // Try to find current user as employee for employee view
      if (user?.uid && isEmployee) {
        console.log('🔍 Starting employee lookup for user:', { uid: user.uid, email: user.email });
        try {
          const employees = await EmployeeService.getWorkspaceEmployees(currentWorkspace.id);
          console.log('📋 Found employees:', employees.length, 'employees in workspace');
          
          // Try multiple ways to find the current user's employee record
          console.log('🔍 Looking for employee with email:', user.email);
          let employee = employees.find(emp => 
            emp.personalInfo.email === user.email
          );
          
          if (employee) {
            console.log('✅ Found employee by email:', employee.personalInfo.firstName, employee.personalInfo.lastName);
          } else {
            console.log('❌ No employee found by email, trying createdBy...');
            // If not found by email, try by createdBy
            employee = employees.find(emp => emp.createdBy === user.uid);
            if (employee) {
              console.log('✅ Found employee by createdBy:', employee.personalInfo.firstName, employee.personalInfo.lastName);
            } else {
              console.log('❌ No employee found by createdBy, trying user ID...');
              // If still not found, try by user ID (some systems might store user ID in employee records)
              employee = employees.find(emp => emp.id === user.uid);
              if (employee) {
                console.log('✅ Found employee by user ID:', employee.personalInfo.firstName, employee.personalInfo.lastName);
              } else {
                console.log('❌ No employee found by any method');
                // Log all employees for debugging
                console.log('📋 All employees in workspace:', employees.map(emp => ({
                  id: emp.id,
                  email: emp.personalInfo.email,
                  name: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
                  createdBy: emp.createdBy
                })));
              }
            }
          }
          
          // Log for debugging
          console.log('Current user:', { uid: user.uid, email: user.email });
          console.log('Found employees:', employees.length);
          console.log('Found employee:', employee);
          
          // If no employee record found, create a fallback using user profile
          if (!employee && userProfile) {
            console.log('⚠️ No employee record found, creating fallback from user profile');
            employee = {
              id: user.uid,
              employeeId: user.uid,
              workspaceId: currentWorkspace.id,
              personalInfo: {
                firstName: userProfile.firstName || userProfile.name?.split(' ')[0] || 'User',
                lastName: userProfile.lastName || userProfile.name?.split(' ').slice(1).join(' ') || '',
                email: user.email || '',
                phone: userProfile.phone || '',
                dateOfBirth: '',
                gender: 'other' as const,
                address: {
                  street: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  country: ''
                },
                emergencyContact: {
                  name: '',
                  relationship: '',
                  phone: ''
                }
              },
              employmentDetails: {
                role: userProfile.role || 'member',
                department: userProfile.department || '',
                departmentId: '',
                manager: '',
                hireDate: new Date().toISOString().split('T')[0],
                employmentType: 'full-time' as const,
                workLocation: 'office' as const
              },
              compensation: {
                baseSalary: 0,
                currency: 'USD',
                payFrequency: 'monthly' as const,
                allowances: {
                  housing: 0,
                  transport: 0,
                  medical: 0,
                  other: 0
                },
                benefits: []
              },
              status: 'active' as const,
              documents: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: user.uid,
              updatedBy: user.uid
            };
            console.log('✅ Created fallback employee record:', employee.personalInfo.firstName, employee.personalInfo.lastName);
          }
          
          setCurrentEmployee(employee || null);
          
          // Debug logging
          console.log('Setting currentEmployee:', employee);
          if (employee) {
            console.log('Employee name:', `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`);
            console.log('Employee email:', employee.personalInfo.email);
          }
        } catch (error) {
          console.warn('Could not find current employee:', error);
          setCurrentEmployee(null);
        }
      }

    } catch (error) {
      console.error('Error loading leave data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leave data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, [currentWorkspace?.id, shouldShowCrossWorkspace, user?.uid, user?.email, userProfile, isEmployee, toast, selectedWorkspace]);



  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle workspace change and reload data
  useEffect(() => {
    if (selectedWorkspace && shouldShowCrossWorkspace && initialLoadComplete) {
      const prevSelected = prevSelectedWorkspaceRef.current;
      if (prevSelected !== selectedWorkspace) {
        prevSelectedWorkspaceRef.current = selectedWorkspace;
        // Reload data when workspace changes
        const reloadData = async () => {
          try {
            setLoading(true);
            const leaveStats = await LeaveService.getLeaveStats(selectedWorkspace);
            setStats(leaveStats);
          } catch (error) {
            console.error('Error reloading leave data:', error);
            toast({
              title: 'Error',
              description: 'Failed to reload leave data. Please try again.',
              variant: 'destructive'
            });
          } finally {
            setLoading(false);
          }
        };
        reloadData();
      }
    }
  }, [selectedWorkspace, shouldShowCrossWorkspace, initialLoadComplete, toast]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleNewLeaveSuccess = () => {
    loadData();
  };



  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="stats-card">
              <CardHeader className="space-y-0 pb-2 p-4 sm:p-6">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="h-8 w-20 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
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
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
            {isEmployee ? 'My Leave Dashboard' : 'Leave Management'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base leading-relaxed">
            {isEmployee 
              ? `Manage your leave requests and view balances for ${format(new Date(), 'MMMM dd, yyyy')}`
              : `Manage leave requests, track balances, and handle approvals for ${format(new Date(), 'MMMM dd, yyyy')}`
            }
          </p>
        </div>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 lg:flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center space-x-2 h-11 w-full sm:w-auto min-w-[120px] hover:bg-accent hover:text-accent-foreground transition-colors touch-manipulation"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
          {/* Annual Leave Application Form Button */}
          <Link href="/dashboard/hr/leaves/application" className="w-full sm:w-auto">
            <Button className="flex items-center justify-center space-x-2 h-11 w-full sm:min-w-[160px] bg-primary hover:bg-primary/90 text-primary-foreground transition-colors touch-manipulation">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">{!isEmployee ? 'New Annual Form' : 'Request Annual Leave'}</span>
              <span className="sm:hidden truncate">{!isEmployee ? 'New Form' : 'Request Leave'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Cross-workspace info for owners */}
      {shouldShowCrossWorkspace && (
        <Card className="card-enhanced">
          <CardHeader className="pb-4">
            <CardTitle className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 text-foreground">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-base sm:text-lg">Cross-Workspace Management</span>
              </div>
              <Badge variant="outline" className="self-start sm:self-center">
                <Globe className="h-3 w-3 mr-1" />
                Owner View
              </Badge>
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm leading-relaxed">
              <div className="space-y-1">
                <div>Select a workspace to view and manage its leave data</div>
                {selectedWorkspace && allWorkspaces.length > 0 && (
                  <div className="font-medium text-foreground text-xs sm:text-sm">
                    Currently viewing: <span className="text-primary">{allWorkspaces.find(ws => ws.id === selectedWorkspace)?.name || 'Unknown'}</span>
                  </div>
                )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
              <div className="flex-1 min-w-0">
                <Select value={selectedWorkspace} onValueChange={handleWorkspaceChange}>
                  <SelectTrigger className="w-full h-11 border-border/50 focus:border-primary">
                    <SelectValue placeholder="Select a workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {allWorkspaces.map(workspace => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        <div className="flex items-center space-x-2 w-full">
                          <Building className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate flex-1">{workspace.name}</span>
                          {workspace.type && (
                            <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">
                              {workspace.type}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground text-center lg:text-right lg:flex-shrink-0">
                <span className="font-medium">Total Workspaces:</span> 
                <span className="ml-1 text-foreground font-semibold">{allWorkspaces.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show Employee Dashboard for Members */}
      {isEmployee && currentEmployee ? (
        <EmployeeLeaveDashboard
          workspaceId={currentWorkspace?.id || ''}
          employeeId={currentEmployee.id}
          employeeName={`${currentEmployee.personalInfo.firstName} ${currentEmployee.personalInfo.lastName}`}
          employeeEmail={currentEmployee.personalInfo.email}
        />
      ) : (
        <>


          {/* Stats Cards */}
          <LeaveStatsComponent stats={stats} loading={loading} />

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto bg-muted p-1 text-muted-foreground rounded-lg">
          <TabsTrigger value="requests" className="text-xs sm:text-sm px-2 py-3 sm:py-2 lg:py-1.5 min-h-[44px] sm:min-h-[40px] lg:min-h-[36px] touch-manipulation">
            <span className="truncate">Leave Requests</span>
          </TabsTrigger>
          <TabsTrigger value="balances" className="text-xs sm:text-sm px-2 py-3 sm:py-2 lg:py-1.5 min-h-[44px] sm:min-h-[40px] lg:min-h-[36px] touch-manipulation">
            <span className="truncate">Leave Balances</span>
          </TabsTrigger>
          <TabsTrigger value="types" className="text-xs sm:text-sm px-2 py-3 sm:py-2 lg:py-1.5 min-h-[44px] sm:min-h-[40px] lg:min-h-[36px] touch-manipulation">
            <span className="truncate">Leave Types</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs sm:text-sm px-2 py-3 sm:py-2 lg:py-1.5 min-h-[44px] sm:min-h-[40px] lg:min-h-[36px] touch-manipulation">
            <span className="truncate">Team Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="text-xs sm:text-sm px-2 py-3 sm:py-2 lg:py-1.5 min-h-[44px] sm:min-h-[40px] lg:min-h-[36px] touch-manipulation col-span-2 sm:col-span-1">
            <span className="truncate">Annual Applications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <LeaveList
            workspaceId={selectedWorkspace || currentWorkspace?.id}
            workspaceFilter="current"
            allWorkspaces={allWorkspaces}
            shouldShowCrossWorkspace={!!shouldShowCrossWorkspace}
          />
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <LeaveBalances
            workspaceId={selectedWorkspace || currentWorkspace?.id}
            workspaceFilter="current"
            allWorkspaces={allWorkspaces}
            shouldShowCrossWorkspace={!!shouldShowCrossWorkspace}
          />
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <LeaveTypes
            workspaceId={selectedWorkspace || currentWorkspace?.id}
            workspaceFilter="current"
            allWorkspaces={allWorkspaces}
            shouldShowCrossWorkspace={!!shouldShowCrossWorkspace}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <TeamCalendar
            workspaceId={selectedWorkspace || currentWorkspace?.id}
            workspaceFilter="current"
            allWorkspaces={allWorkspaces}
            shouldShowCrossWorkspace={!!shouldShowCrossWorkspace}
          />
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <AnnualLeaveApplicationsList
            workspaceId={selectedWorkspace || currentWorkspace?.id || ''}
            isAdminOrOwner={canManageLeave}
          />
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}