'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  RefreshCw,
  Building,
  Filter,
  Plus,
  Calculator,
  CheckSquare,
  Square
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { PayrollService, PayrollEmployee } from '@/lib/payroll-service';
import { UserService } from '@/lib/user-service';
import { DepartmentService } from '@/lib/department-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { downloadPayslipPDF } from '@/lib/utils/payslip-pdf-generator';
import PayrollEmployeeCard from './PayrollEmployeeCard';
import PayrollLoadingSkeleton from '@/components/payroll/PayrollLoadingSkeleton';
import CreatePayrollEmployeeForm from './CreatePayrollEmployeeForm';
import EditPayrollEmployeeForm from './EditPayrollEmployeeForm';
import DeletePayrollEmployeeDialog from './DeletePayrollEmployeeDialog';
import SalaryReviewDialog from './SalaryReviewDialog';

interface PayrollEmployeeListProps {
  workspaceId?: string;
  workspaceFilter?: 'current' | 'all';
  allWorkspaces?: any[];
  shouldShowCrossWorkspace?: boolean;
}

export default function PayrollEmployeeList({ 
  workspaceId, 
  workspaceFilter = 'current',
  allWorkspaces = [],
  shouldShowCrossWorkspace = false
}: PayrollEmployeeListProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payrollEmployees, setPayrollEmployees] = useState<PayrollEmployee[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployee | null>(null);
  
  // Bulk selection and processing state
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [processingEmployees, setProcessingEmployees] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  
  // Auto-processing and review state
  const [autoProcessing, setAutoProcessing] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [employeesNeedingReview, setEmployeesNeedingReview] = useState<PayrollEmployee[]>([]);
  const [reviewProcessing, setReviewProcessing] = useState(false);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      
      let employees: PayrollEmployee[] = [];
      let allUsers: any[] = [];
      let allDepartments: any[] = [];

      if (shouldShowCrossWorkspace && workspaceFilter === 'all') {
        // Load from all workspaces
        const workspaceIds = allWorkspaces.map(ws => {
          // Handle the structure: { workspace: { id: string, ... }, role: string }
          if (ws.workspace && ws.workspace.id) {
            return ws.workspace.id;
          }
          // Fallback for direct ID structure
          if (ws.id) {
            return ws.id;
          }
          return null;
        }).filter(id => id);
        
        if (workspaceIds.length === 0) {
          console.log('No valid workspace IDs in PayrollEmployeeList');
          setPayrollEmployees([]);
          setUsers([]);
          setDepartments([]);
          return;
        }
        
        const [allEmployees, allUsersData, allDepartmentsData] = await Promise.all([
          PayrollService.getMultiWorkspacePayrollEmployees(workspaceIds),
          Promise.all(workspaceIds.map(wsId => {
            if (!wsId) {
              console.warn('Attempting to fetch users with undefined workspace ID');
              return Promise.resolve([]);
            }
            return UserService.getUsersByWorkspace(wsId);
          })),
          Promise.all(workspaceIds.map(wsId => {
            if (!wsId) {
              console.warn('Attempting to fetch departments with undefined workspace ID');
              return Promise.resolve([]);
            }
            return DepartmentService.getWorkspaceDepartments(wsId);
          }))
        ]);
        
        employees = allEmployees;
        allUsers = allUsersData.flat();
        allDepartments = allDepartmentsData.flat();
      } else {
        // Load from current workspace
        const [workspaceEmployees, workspaceUsers, workspaceDepartments] = await Promise.all([
          PayrollService.getPayrollEmployees(workspaceId),
          UserService.getUsersByWorkspace(workspaceId),
          DepartmentService.getWorkspaceDepartments(workspaceId)
        ]);
        
        employees = workspaceEmployees;
        allUsers = workspaceUsers;
        allDepartments = workspaceDepartments;
      }

      setPayrollEmployees(employees);
      setUsers(allUsers);
      setDepartments(allDepartments);
    } catch (error) {
      console.error('Error loading payroll data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payroll data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, workspaceFilter, shouldShowCrossWorkspace, allWorkspaces, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleEditEmployee = (employee: PayrollEmployee) => {
    setSelectedEmployee(employee);
    setEditFormOpen(true);
    setDeleteDialogOpen(false);
  };

  const handleDeleteEmployee = async (employee: PayrollEmployee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
    setEditFormOpen(false);
  };

  const handleSendPayslip = async (employee: PayrollEmployee) => {
    try {
      // Find the latest payslip for this employee
      const payslips = await PayrollService.getPayslips(employee.workspaceId);
      const employeePayslip = payslips.find(p => p.employeeId === employee.employeeId);
      
      if (employeePayslip) {
        await PayrollService.sendPayslip(employeePayslip.id);
        toast({
          title: 'Success',
          description: 'Payslip sent successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'No payslip found for this employee.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error sending payslip:', error);
      toast({
        title: 'Error',
        description: 'Failed to send payslip. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadPayslip = async (employee: PayrollEmployee) => {
    try {
      // First try to get existing payslip for this employee
      const payslips = await PayrollService.getPayslips(workspaceId || '', undefined);
      const employeePayslip = payslips.find(p => p.employeeId === employee.employeeId);
      
      // Get actual workspace details
      let companyInfo = {
        name: 'Company Name',
        address: 'Business Address',
        city: 'City',
        state: 'State',
        zipCode: '12345',
        phone: '+1 (555) 123-4567',
        email: 'info@company.com',
        website: 'www.company.com'
      };
      
      try {
        const workspace = await WorkspaceService.getWorkspace(employee.workspaceId);
        if (workspace) {
          companyInfo = {
            name: workspace.name || 'Company Name',
            address: workspace.description || 'Business Address',
            city: 'City',
            state: 'State',
            zipCode: '12345',
            phone: '+1 (555) 123-4567',
            email: 'info@company.com',
            website: 'www.company.com'
          };
        }
      } catch (error) {
        console.error('Error fetching workspace details:', error);
        // Use fallback data if workspace fetch fails
      }
      
      if (employeePayslip) {
        // Download existing payslip
        downloadPayslipPDF(employeePayslip, companyInfo);
        toast({
          title: 'Success',
          description: 'Payslip downloaded successfully.',
        });
      } else {
        // Create a payslip from employee data if none exists
        const payslipData = {
          id: `temp-${employee.id}`,
          employeeId: employee.employeeId,
          employeeName: employee.employeeName,
          employeeEmail: employee.employeeEmail,
          workspaceId: employee.workspaceId,
          workspaceName: employee.workspaceName,
          period: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
          startDate: new Date().toISOString().slice(0, 10), // Current date
          endDate: new Date().toISOString().slice(0, 10), // Current date
          baseSalary: employee.baseSalary,
          allowances: employee.allowances,
          totalAllowances: Object.values(employee.allowances).reduce((sum, val) => sum + val, 0),
          overtime: employee.overtime,
          bonus: employee.bonus,
          grossPay: employee.baseSalary + Object.values(employee.allowances).reduce((sum, val) => sum + val, 0) + employee.overtime + employee.bonus,
          deductions: employee.deductions,
          totalDeductions: Object.values(employee.deductions).reduce((sum, val) => sum + val, 0),
          netPay: employee.netSalary,
          currency: employee.currency,
          status: 'draft' as const,
          generatedDate: new Date().toISOString(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        downloadPayslipPDF(payslipData, companyInfo);
        toast({
          title: 'Success',
          description: 'Employee payslip generated and downloaded successfully.',
        });
      }
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast({
        title: 'Error',
        description: 'Failed to download payslip. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Individual employee processing
  const handleProcessEmployee = async (employee: PayrollEmployee) => {
    if (!user?.uid) return;

    try {
      setProcessingEmployees(prev => new Set(prev).add(employee.id));
      
      await PayrollService.processIndividualEmployee(employee.id, user.uid);
      
      toast({
        title: 'Success',
        description: `${employee.employeeName} processed successfully.`,
      });
      
      loadData();
    } catch (error) {
      console.error('Error processing employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to process employee. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setProcessingEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(employee.id);
        return newSet;
      });
    }
  };

  // Bulk selection handlers
  const handleSelectionChange = (employeeId: string, selected: boolean) => {
    setSelectedEmployees(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(employeeId);
      } else {
        newSet.delete(employeeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const pendingEmployees = filteredEmployees.filter(emp => emp.payrollStatus === 'pending');
    if (selectedEmployees.size === pendingEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(pendingEmployees.map(emp => emp.id)));
    }
  };

  const handleBulkProcess = async () => {
    if (!user?.uid || selectedEmployees.size === 0) return;

    try {
      setBulkProcessing(true);
      
      const employeeIds = Array.from(selectedEmployees);
      await PayrollService.processSelectedEmployees(employeeIds, user.uid);
      
      toast({
        title: 'Success',
        description: `${employeeIds.length} employee(s) processed successfully.`,
      });
      
      setSelectedEmployees(new Set());
      loadData();
    } catch (error) {
      console.error('Error bulk processing employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to process employees. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  // Auto-process fixed salaries
  const handleAutoProcessFixedSalaries = async () => {
    if (!user?.uid || !workspaceId) return;

    try {
      setAutoProcessing(true);
      
      const result = await PayrollService.autoProcessFixedSalaries(workspaceId, user.uid);
      
      toast({
        title: 'Success',
        description: `Auto-processed ${result.processed} fixed salary employees. ${result.skipped} employees skipped (need review).`,
      });
      
      loadData();
    } catch (error) {
      console.error('Error auto-processing fixed salaries:', error);
      toast({
        title: 'Error',
        description: 'Failed to auto-process fixed salaries. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setAutoProcessing(false);
    }
  };

  // Load employees needing review
  const handleLoadEmployeesNeedingReview = async () => {
    if (!workspaceId) return;

    try {
      const employees = await PayrollService.getEmployeesNeedingReview(workspaceId);
      setEmployeesNeedingReview(employees);
      setReviewDialogOpen(true);
    } catch (error) {
      console.error('Error loading employees needing review:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees needing review.',
        variant: 'destructive'
      });
    }
  };

  // Handle salary review confirmation
  const handleSalaryReviewConfirm = async (reviewData: any) => {
    if (!user?.uid) return;

    try {
      setReviewProcessing(true);
      
      const employeeIds = employeesNeedingReview.map(emp => emp.id);
      await PayrollService.processWithReview(employeeIds, user.uid, reviewData);
      
      toast({
        title: 'Success',
        description: `${employeeIds.length} employee(s) processed with review successfully.`,
      });
      
      setReviewDialogOpen(false);
      setEmployeesNeedingReview([]);
      loadData();
    } catch (error) {
      console.error('Error processing with review:', error);
      toast({
        title: 'Error',
        description: 'Failed to process employees with review. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setReviewProcessing(false);
    }
  };

  // Filter employees
  const filteredEmployees = payrollEmployees.filter(employee => {
    const matchesSearch = !searchTerm || 
                         employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmployee = employeeFilter === 'all' || employee.employeeId === employeeFilter;
    
    const matchesStatus = statusFilter === 'all' || employee.payrollStatus === statusFilter;
    
    const matchesDepartment = departmentFilter === 'all' || 
                             (employee.department && employee.department === departmentFilter) ||
                             (!employee.department && departmentFilter === 'Unassigned');
    
    return matchesSearch && matchesEmployee && matchesStatus && matchesDepartment;
  });

  // Get unique departments from both payroll employees and department service
  const payrollDepartments = [...new Set(payrollEmployees.map(emp => emp.department))];
  const allAvailableDepartments = [...new Set([
    ...payrollDepartments,
    ...departments.map(dept => dept.name)
  ])].filter(Boolean).sort();
  
  // Add "Unassigned" option if there are employees without departments
  const hasUnassignedEmployees = payrollEmployees.some(emp => !emp.department);
  if (hasUnassignedEmployees && !allAvailableDepartments.includes('Unassigned')) {
    allAvailableDepartments.push('Unassigned');
  }

  // Get pending employees for bulk selection
  const pendingEmployees = filteredEmployees.filter(emp => emp.payrollStatus === 'pending');
  const allPendingSelected = pendingEmployees.length > 0 && 
                           pendingEmployees.every(emp => selectedEmployees.has(emp.id));

  if (loading) {
    return <PayrollLoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-border/50 focus:border-primary"
                />
              </div>
            </div>
            
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-[180px] border-border/50 focus:border-primary">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span>{user.firstName || user.name} {user.lastName || ''}</span>
                      {shouldShowCrossWorkspace && user.workspaceName && (
                        <Badge variant="outline" className="text-xs">
                          {user.workspaceName}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] border-border/50 focus:border-primary">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[160px] border-border/50 focus:border-primary">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {allAvailableDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    <div className="flex items-center gap-2">
                      <span>{dept}</span>
                      {shouldShowCrossWorkspace && departments.find(d => d.name === dept)?.workspaceName && (
                        <Badge variant="outline" className="text-xs">
                          {departments.find(d => d.name === dept)?.workspaceName}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-border/50 hover:bg-accent hover:text-accent-foreground"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button 
              onClick={() => setCreateFormOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Employee Payroll
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Processing Controls */}
      {pendingEmployees.length > 0 && (
        <Card className="card-enhanced">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSelection(!showSelection)}
                  className="flex items-center gap-2"
                >
                  {showSelection ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  {showSelection ? 'Hide Selection' : 'Bulk Process'}
                </Button>
                
                {showSelection && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="flex items-center gap-2"
                    >
                      {allPendingSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      {allPendingSelected ? 'Deselect All' : 'Select All Pending'}
                    </Button>
                    
                    <span className="text-sm text-muted-foreground">
                      {selectedEmployees.size} of {pendingEmployees.length} pending employees selected
                    </span>
                  </>
                )}
              </div>
              
              {showSelection && selectedEmployees.size > 0 && (
                <Button
                  onClick={handleBulkProcess}
                  disabled={bulkProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {bulkProcessing ? 'Processing...' : `Process ${selectedEmployees.size} Employee(s)`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-Processing Controls */}
      {pendingEmployees.length > 0 && (
        <Card className="card-enhanced">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium mb-2">Smart Processing Options</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically process fixed salaries and review variable components
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleAutoProcessFixedSalaries}
                  disabled={autoProcessing}
                  className="flex items-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  {autoProcessing ? 'Auto-Processing...' : 'Auto-Process Fixed Salaries'}
                </Button>
                
                <Button
                  variant="default"
                  onClick={handleLoadEmployeesNeedingReview}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Review Variable Salaries
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
          {pendingEmployees.length > 0 && (
            <span className="ml-2">
              • {pendingEmployees.length} pending processing
            </span>
          )}
        </p>
        {shouldShowCrossWorkspace && (
          <Badge variant="outline" className="text-xs">
            <Building className="w-3 h-3 mr-1" />
            Cross-Workspace View
          </Badge>
        )}
      </div>

      {/* Payroll Employees List */}
      <div className="space-y-4">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee) => (
            <PayrollEmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={handleEditEmployee}
              onDelete={handleDeleteEmployee}
              onSendPayslip={handleSendPayslip}
              onDownloadPayslip={handleDownloadPayslip}
              onProcess={handleProcessEmployee}
              showWorkspaceName={shouldShowCrossWorkspace}
              canEdit={true}
              canDelete={true}
              canSendPayslip={true}
              canProcess={true}
              isSelected={selectedEmployees.has(employee.id)}
              onSelectionChange={handleSelectionChange}
              showSelection={showSelection}
              isProcessing={processingEmployees.has(employee.id)}
            />
          ))
        ) : (
          <Card className="card-enhanced">
            <CardContent className="p-12 text-center">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payroll Employees Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || employeeFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'No employees have been added to payroll yet.'
                }
              </p>
              {(searchTerm || employeeFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setEmployeeFilter('all');
                    setStatusFilter('all');
                    setDepartmentFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Payroll Employee Form */}
      {workspaceId && (
        <CreatePayrollEmployeeForm
          isOpen={createFormOpen}
          onClose={() => setCreateFormOpen(false)}
          workspaceId={workspaceId}
          onSuccess={loadData}
          workspaceFilter={workspaceFilter}
          allWorkspaces={allWorkspaces}
          shouldShowCrossWorkspace={shouldShowCrossWorkspace}
        />
      )}

      {/* Edit Payroll Employee Form */}
      {selectedEmployee && editFormOpen && workspaceId && (
        <EditPayrollEmployeeForm
          employee={selectedEmployee}
          onClose={() => {
            setEditFormOpen(false);
            setDeleteDialogOpen(false);
            setSelectedEmployee(null);
          }}
          onSuccess={loadData}
          workspaceId={workspaceId}
        />
      )}

      {/* Delete Payroll Employee Dialog */}
      {selectedEmployee && deleteDialogOpen && (
        <DeletePayrollEmployeeDialog
          employee={selectedEmployee}
          onClose={() => {
            setEditFormOpen(false);
            setDeleteDialogOpen(false);
            setSelectedEmployee(null);
          }}
          onSuccess={loadData}
        />
      )}

      {/* Salary Review Dialog */}
      <SalaryReviewDialog
        isOpen={reviewDialogOpen}
        onClose={() => {
          setReviewDialogOpen(false);
          setEmployeesNeedingReview([]);
        }}
        employees={employeesNeedingReview}
        onConfirm={handleSalaryReviewConfirm}
        isLoading={reviewProcessing}
      />
    </div>
  );
} 