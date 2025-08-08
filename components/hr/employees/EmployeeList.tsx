import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Plus, Users, AlertCircle, Building } from 'lucide-react';
import { Employee, EmployeeService, EmployeeFilters } from '@/lib/employee-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { EmployeeCard } from './EmployeeCard';
import { EmployeeLoadingSkeleton } from './EmployeeLoadingSkeleton';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EmployeeListProps {
  workspaceId: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
  filters?: EmployeeFilters;
  onDataChange?: () => Promise<void>;
}

export function EmployeeList({
  workspaceId,
  canEdit = false,
  canDelete = false,
  canCreate = false,
  filters,
  onDataChange
}: EmployeeListProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');
  const [workspaceFilter, setWorkspaceFilter] = useState('all');
  
  // Only deletion state needed now
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Derived data for filters
  const [departments, setDepartments] = useState<string[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  // Check if user is owner and should see cross-workspace data
  const isOwner = userProfile?.role === 'owner';
  const shouldShowCrossWorkspace = isOwner && currentWorkspace?.id === workspaceId;

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      
      let employeeData: Employee[] = [];
      let allWorkspaces: any[] = [];

      if (shouldShowCrossWorkspace) {
        // Owner in main workspace - load employees from all accessible workspaces
        const accessibleWorkspaceData = await WorkspaceService.getUserAccessibleWorkspaces(user?.uid || '');
        allWorkspaces = [
          ...accessibleWorkspaceData.mainWorkspaces,
          ...Object.values(accessibleWorkspaceData.subWorkspaces).flat()
        ];
        
        // Load employees from all workspaces
        employeeData = await EmployeeService.getAccessibleEmployees(
          allWorkspaces.map(ws => ws.id)
        );
      } else {
        // Regular workspace-specific loading
        const employeeFilters: EmployeeFilters = {
          workspaceId,
          searchTerm: searchTerm || undefined,
          department: departmentFilter !== 'all' ? departmentFilter : undefined,
          status: statusFilter !== 'all' ? (statusFilter as Employee['status']) : undefined,
          employmentType: employmentTypeFilter !== 'all' ? 
            (employmentTypeFilter as Employee['employmentDetails']['employmentType']) : undefined,
          ...filters
        };

        employeeData = await EmployeeService.getWorkspaceEmployees(workspaceId, employeeFilters);
        
        // For non-owners, just show current workspace
        if (currentWorkspace) {
          allWorkspaces = [currentWorkspace];
        }
      }

      setEmployees(employeeData);
      setWorkspaces(allWorkspaces);
      
      // Extract unique departments for filter
      const uniqueDepartments = Array.from(new Set(employeeData.map(emp => emp.employmentDetails.department)))
        .filter(Boolean)
        .sort();
      setDepartments(uniqueDepartments);

    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [
    workspaceId,
    filters,
    shouldShowCrossWorkspace,
    user?.uid,
    searchTerm,
    departmentFilter,
    statusFilter,
    employmentTypeFilter,
    currentWorkspace,
    toast
  ]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleCreateEmployee = () => {
    router.push('/dashboard/hr/employees/new');
  };

  const handleEditEmployee = (employee: Employee) => {
    router.push(`/dashboard/hr/employees/edit/${employee.id}`);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setDeletingEmployee(employee);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployee || !user?.uid) return;
    
    try {
      await EmployeeService.deleteEmployee(deletingEmployee.id, user.uid);
      
      toast({
        title: 'Employee Terminated',
        description: `${deletingEmployee.personalInfo.firstName} ${deletingEmployee.personalInfo.lastName} has been terminated.`,
      });
      
      setShowDeleteDialog(false);
      setDeletingEmployee(null);
      await loadEmployees();
      await onDataChange?.();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to terminate employee. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Helper function to get workspace name
  const getWorkspaceName = (workspaceId: string) => {
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    return workspace?.name || 'Unknown Workspace';
  };

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`.toLowerCase();
    const matchesSearch = !searchTerm || 
      fullName.includes(searchTerm.toLowerCase()) ||
      employee.personalInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employmentDetails.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employmentDetails.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || 
      employee.employmentDetails.department === departmentFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      employee.status === statusFilter;
    
    const matchesEmploymentType = employmentTypeFilter === 'all' || 
      employee.employmentDetails.employmentType === employmentTypeFilter;

    const matchesWorkspace = workspaceFilter === 'all' || 
      employee.workspaceId === workspaceFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesEmploymentType && matchesWorkspace;
  });

  if (loading) {
    return <EmployeeLoadingSkeleton showStats={false} />;
  }

  return (
    <div className="space-y-6">
      {/* Header - responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {shouldShowCrossWorkspace ? 'All Employees (Cross-Workspace)' : 'Employee Management'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {shouldShowCrossWorkspace 
              ? 'Manage employees across all your workspaces'
              : 'Manage employee profiles and information'
            }
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleCreateEmployee} className="w-full sm:w-auto touch-target">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Cross-workspace info banner for owners */}
      {shouldShowCrossWorkspace && (
        <Alert>
          <Building className="h-4 w-4" />
          <AlertDescription>
            You&apos;re viewing employees from all accessible workspaces. Use the workspace filter below to narrow down results.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters - mobile-first responsive design */}
      <Card className="card-enhanced">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Search input - full width on mobile */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 touch-target"
                />
              </div>
            </div>
            
            {/* Filter selects - stack on mobile, row on larger screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="h-11 touch-target">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 touch-target">
                  <SelectValue placeholder="Status" />
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
              
              <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
                <SelectTrigger className="h-11 touch-target">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Workspace filter for cross-workspace view */}
              {shouldShowCrossWorkspace && workspaces.length > 1 && (
                <Select value={workspaceFilter} onValueChange={setWorkspaceFilter}>
                  <SelectTrigger className="h-11 touch-target">
                    <SelectValue placeholder="Workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workspaces</SelectItem>
                    {workspaces.map(workspace => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {filteredEmployees.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredEmployees.length} of {employees.length} employees
          {shouldShowCrossWorkspace && ` across ${workspaces.length} workspace${workspaces.length > 1 ? 's' : ''}`}
        </div>
      )}

      {/* Employee List */}
      <div className="space-y-4">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="space-y-2">
            {/* Workspace label for cross-workspace view */}
            {shouldShowCrossWorkspace && (
              <div className="text-xs text-muted-foreground font-medium">
                <Building className="w-3 h-3 inline mr-1" />
                {getWorkspaceName(employee.workspaceId)}
              </div>
            )}
            <EmployeeCard
              employee={employee}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={handleEditEmployee}
              onDelete={handleDeleteEmployee}
            />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <Card className="card-enhanced">
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No employees found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || departmentFilter !== 'all' || statusFilter !== 'all' || employmentTypeFilter !== 'all' || workspaceFilter !== 'all'
                ? 'Try adjusting your search criteria.'
                : shouldShowCrossWorkspace 
                  ? 'No employees found across all workspaces.'
                  : 'Get started by adding your first employee.'}
            </p>
            {canCreate && (
              <Button onClick={handleCreateEmployee}>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Terminate Employee"
        description={
          deletingEmployee
            ? `Are you sure you want to terminate ${deletingEmployee.personalInfo.firstName} ${deletingEmployee.personalInfo.lastName}? This will mark them as terminated and they will no longer have access to the system.`
            : ''
        }
        confirmText="Terminate"
      />
    </div>
  );
}