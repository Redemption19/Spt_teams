'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, Users, TrendingUp, ArrowLeft, Edit, Settings, Loader2, AlertTriangle, DollarSign, Briefcase, Mail, Crown, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useCurrency } from '@/hooks/use-currency';
import { DepartmentService, type Department, type DepartmentUser } from '@/lib/department-service';
import DepartmentProjectsManager from '@/components/departments/DepartmentProjectsManager';
import DepartmentBudgetManager from '@/components/departments/DepartmentBudgetManager';
import { safeFormatDate } from '@/lib/utils/date-utils';

export default function DepartmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const { formatAmount, getCurrencySymbol, loading: currencyLoading } = useCurrency();
  
  const [department, setDepartment] = useState<Department | null>(null);
  const [members, setMembers] = useState<DepartmentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departmentId = params.id as string;

  useEffect(() => {
    const fetchDepartmentMembers = async () => {
      if (!currentWorkspace?.id || !departmentId) return;

      try {
        setMembersLoading(true);
        const departmentMembers = await DepartmentService.getDepartmentMembers(currentWorkspace.id, departmentId);
        setMembers(departmentMembers);
      } catch (err: any) {
        console.error('Error fetching department members:', err);
        toast({
          title: 'Error',
          description: 'Failed to load department members',
          variant: 'destructive',
        });
      } finally {
        setMembersLoading(false);
      }
    };

    const fetchDepartment = async () => {
      // Wait for workspace to load before checking
      if (workspaceLoading) {
        return;
      }
      
      if (!currentWorkspace?.id || !departmentId) {
        setError('Missing workspace or department ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const dept = await DepartmentService.getDepartment(currentWorkspace.id, departmentId);
        setDepartment(dept);
        
        // Fetch members after department is loaded
        if (dept) {
          fetchDepartmentMembers();
        }
      } catch (err: any) {
        console.error('Error fetching department:', err);
        setError(err.message || 'Failed to load department details');
        toast({
          title: 'Error',
          description: 'Failed to load department details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [currentWorkspace?.id, departmentId, workspaceLoading, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Unknown';
    }
  };

  if (loading || workspaceLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading department details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard/departments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Error Loading Department</h3>
            <p className="text-muted-foreground mb-4">{error || 'Department not found'}</p>
            <Button onClick={() => router.push('/dashboard/departments')}>
              Back to Departments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/departments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Departments
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {department.name}
            </h1>
            <p className="text-muted-foreground">
              Department Details
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/dashboard/departments/${departmentId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/dashboard/departments/${departmentId}/settings`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department Head</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{department.headName || 'Not assigned'}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{department.memberCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(department.status)}>
              {getStatusLabel(department.status)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Information</CardTitle>
              <CardDescription>
                Basic information about this department
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department Name</label>
                  <p className="text-sm">{department.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department Head</label>
                  <p className="text-sm">{department.headName || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Members</label>
                  <p className="text-sm">{department.memberCount} members</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className={getStatusColor(department.status)}>
                    {getStatusLabel(department.status)}
                  </Badge>
                </div>
              </div>
              {department.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm mt-1">{department.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-4">
          <DepartmentProjectsManager 
            department={department} 
            onProjectsUpdated={() => {
              // Optionally refresh department data if needed
              console.log('Projects updated for department:', department.id);
            }}
          />
        </TabsContent>
        
        <TabsContent value="budget" className="space-y-4">
          <DepartmentBudgetManager 
            department={department}
            onBudgetUpdated={() => {
              // Optionally refresh department data if needed
              console.log('Budget updated for department:', department.id);
            }}
          />
        </TabsContent>
        
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Department Members</span>
                <Badge variant="secondary">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Employees assigned to this department
              </CardDescription>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading members...</span>
                  </div>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Members Found</h3>
                  <p className="text-muted-foreground mb-4">
                    This department doesn't have any members assigned yet.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/dashboard/departments/${departmentId}/settings`)}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Manage Members
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.userName}`} />
                            <AvatarFallback>
                              {member.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{member.userName}</h4>
                              {member.departmentRole === 'head' && (
                                <Badge variant="secondary" className="text-xs">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Head
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{member.userEmail}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {member.userRole}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Joined {safeFormatDate(member.joinedAt, undefined, 'Unknown')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center pt-4">
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/dashboard/departments/${departmentId}/settings`)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Members
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}