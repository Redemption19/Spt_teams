'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  DollarSign, 
  Calculator,
  Loader2, 
  AlertCircle,
  Save,
  Building
} from 'lucide-react';
import { PayrollService, PayrollEmployee, UpdatePayrollEmployeeData } from '@/lib/payroll-service';
import { UserService } from '@/lib/user-service';
import { DepartmentService } from '@/lib/department-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { Badge } from '@/components/ui/badge';

interface EditPayrollEmployeeFormProps {
  employee: PayrollEmployee;
  onClose: () => void;
  onSuccess: () => void;
  workspaceId: string;
}

interface FormData {
  // Workspace Selection (for owners)
  selectedWorkspaceId: string;
  
  // Employee Selection
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  
  // Basic Information
  department: string;
  role: string;
  
  // Salary Information
  baseSalary: string;
  currency: string;
  isFixedSalary: boolean;
  
  // Allowances
  housingAllowance: string;
  transportAllowance: string;
  medicalAllowance: string;
  mealAllowance: string;
  otherAllowance: string;
  
  // Deductions
  tax: string;
  socialSecurity: string;
  pension: string;
  insurance: string;
  otherDeduction: string;
  
  // Additional
  overtime: string;
  bonus: string;
  
  // Status
  payrollStatus: 'pending' | 'processed' | 'paid' | 'cancelled';
}

const currencies = [
  { code: 'GHS', name: 'GHS - Ghana Cedi' },
  { code: 'USD', name: 'USD - US Dollar' },
  { code: 'EUR', name: 'EUR - Euro' },
  { code: 'GBP', name: 'GBP - British Pound' },
  { code: 'NGN', name: 'NGN - Nigerian Naira' },
  { code: 'KES', name: 'KES - Kenyan Shilling' },
  { code: 'ZAR', name: 'ZAR - South African Rand' },
  { code: 'EGP', name: 'EGP - Egyptian Pound' },
  { code: 'MAD', name: 'MAD - Moroccan Dirham' },
  { code: 'TND', name: 'TND - Tunisian Dinar' }
];

export default function EditPayrollEmployeeForm({ 
  employee, 
  onClose, 
  onSuccess, 
  workspaceId 
}: EditPayrollEmployeeFormProps) {
  const { toast } = useToast();
  const { defaultCurrency } = useCurrency();
  const { userProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState<FormData>({
    selectedWorkspaceId: employee.workspaceId,
    employeeId: employee.employeeId,
    employeeName: employee.employeeName,
    employeeEmail: employee.employeeEmail,
    department: employee.department || 'unassigned',
    role: employee.role,
    baseSalary: employee.baseSalary.toString(),
    currency: employee.currency,
    isFixedSalary: employee.isFixedSalary,
    housingAllowance: employee.allowances.housing.toString(),
    transportAllowance: employee.allowances.transport.toString(),
    medicalAllowance: employee.allowances.medical.toString(),
    mealAllowance: employee.allowances.meal.toString(),
    otherAllowance: employee.allowances.other.toString(),
    tax: employee.deductions.tax.toString(),
    socialSecurity: employee.deductions.socialSecurity.toString(),
    pension: employee.deductions.pension.toString(),
    insurance: employee.deductions.insurance.toString(),
    otherDeduction: employee.deductions.other.toString(),
    overtime: employee.overtime.toString(),
    bonus: employee.bonus.toString(),
    payrollStatus: employee.payrollStatus,
  });

  const shouldShowCrossWorkspace = userProfile?.role === 'owner';

  // Load users and departments
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (shouldShowCrossWorkspace && allWorkspaces.length > 0) {
        // Load users and departments for the selected workspace
        const [workspaceUsers, workspaceDepartments] = await Promise.all([
          UserService.getUsersByWorkspace(formData.selectedWorkspaceId),
          DepartmentService.getWorkspaceDepartments(formData.selectedWorkspaceId)
        ]);
        setUsers(workspaceUsers);
        setDepartments(workspaceDepartments);
      } else {
        // Load for current workspace
        const [workspaceUsers, workspaceDepartments] = await Promise.all([
          UserService.getUsersByWorkspace(workspaceId),
          DepartmentService.getWorkspaceDepartments(workspaceId)
        ]);
        setUsers(workspaceUsers);
        setDepartments(workspaceDepartments);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [formData.selectedWorkspaceId, workspaceId, shouldShowCrossWorkspace, allWorkspaces.length, toast]);

  // Load workspaces for owners
  const loadWorkspaces = useCallback(async () => {
    if (!shouldShowCrossWorkspace) return;

    try {
      const workspaces = await WorkspaceService.getUserWorkspaces(userProfile?.id || '');
      const validWorkspaces = workspaces.filter(ws => ws && ws.workspace && ws.workspace.id);
      setAllWorkspaces(validWorkspaces);
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  }, [shouldShowCrossWorkspace, userProfile?.id]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWorkspaceChange = async (workspaceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedWorkspaceId: workspaceId,
      employeeId: '',
      employeeName: '',
      employeeEmail: '',
      department: ''
    }));

    try {
      const [workspaceUsers, workspaceDepartments] = await Promise.all([
        UserService.getUsersByWorkspace(workspaceId),
        DepartmentService.getWorkspaceDepartments(workspaceId)
      ]);
      setUsers(workspaceUsers);
      setDepartments(workspaceDepartments);
    } catch (error) {
      console.error('Error loading workspace data:', error);
    }
  };

  const handleEmployeeChange = (userId: string) => {
    const selectedUser = users.find(user => user.id === userId);
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        employeeId: selectedUser.id,
        employeeName: selectedUser.name || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim(),
        employeeEmail: selectedUser.email
      }));
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.employeeId) {
      toast({
        title: 'Error',
        description: 'Please select an employee.',
        variant: 'destructive'
      });
      return false;
    }
    if (!formData.department || formData.department === 'unassigned') {
      toast({
        title: 'Error',
        description: 'Please select a department.',
        variant: 'destructive'
      });
      return false;
    }
    if (!formData.role) {
      toast({
        title: 'Error',
        description: 'Please enter a role.',
        variant: 'destructive'
      });
      return false;
    }
    if (!formData.baseSalary || parseFloat(formData.baseSalary) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid base salary.',
        variant: 'destructive'
      });
      return false;
    }
    if (shouldShowCrossWorkspace && !formData.selectedWorkspaceId) {
      toast({
        title: 'Error',
        description: 'Please select a workspace.',
        variant: 'destructive'
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      const updateData: UpdatePayrollEmployeeData = {
        department: formData.department === 'unassigned' ? '' : formData.department,
        role: formData.role,
        baseSalary: parseFloat(formData.baseSalary),
        currency: formData.currency,
        isFixedSalary: formData.isFixedSalary,
        allowances: {
          housing: parseFloat(formData.housingAllowance) || 0,
          transport: parseFloat(formData.transportAllowance) || 0,
          medical: parseFloat(formData.medicalAllowance) || 0,
          meal: parseFloat(formData.mealAllowance) || 0,
          other: parseFloat(formData.otherAllowance) || 0,
        },
        deductions: {
          tax: parseFloat(formData.tax) || 0,
          socialSecurity: parseFloat(formData.socialSecurity) || 0,
          pension: parseFloat(formData.pension) || 0,
          insurance: parseFloat(formData.insurance) || 0,
          other: parseFloat(formData.otherDeduction) || 0,
        },
        overtime: parseFloat(formData.overtime) || 0,
        bonus: parseFloat(formData.bonus) || 0,
        payrollStatus: formData.payrollStatus,
      };

      await PayrollService.updatePayrollEmployee(employee.id, updateData);

      toast({
        title: 'Success',
        description: 'Payroll employee updated successfully.',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating payroll employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payroll employee. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateNetSalary = () => {
    const baseSalary = parseFloat(formData.baseSalary) || 0;
    const allowances = 
      (parseFloat(formData.housingAllowance) || 0) +
      (parseFloat(formData.transportAllowance) || 0) +
      (parseFloat(formData.medicalAllowance) || 0) +
      (parseFloat(formData.mealAllowance) || 0) +
      (parseFloat(formData.otherAllowance) || 0);
    const deductions = 
      (parseFloat(formData.tax) || 0) +
      (parseFloat(formData.socialSecurity) || 0) +
      (parseFloat(formData.pension) || 0) +
      (parseFloat(formData.insurance) || 0) +
      (parseFloat(formData.otherDeduction) || 0);
    const overtime = parseFloat(formData.overtime) || 0;
    const bonus = parseFloat(formData.bonus) || 0;
    
    return baseSalary + allowances + overtime + bonus - deductions;
  };

  // Get unique departments
  const availableDepartments = [...new Set(departments.map(dept => dept.name))].sort();

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="space-y-1 sm:space-y-3">
          <DialogTitle className="text-base sm:text-lg lg:text-xl font-semibold">Edit Payroll Employee</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm lg:text-base">
            Update payroll information for {employee.employeeName}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-6 sm:py-8">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
          <span className="ml-2 text-xs sm:text-sm lg:text-base">Loading form data...</span>
        </div>
      </DialogContent>
    </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="space-y-1 sm:space-y-3">
          <DialogTitle className="text-base sm:text-lg lg:text-xl font-semibold">Edit Payroll Employee</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm lg:text-base">
            Update payroll information for {employee.employeeName} with salary, allowances, and deductions
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-3 sm:space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-3 h-auto min-h-[40px] bg-muted p-1 gap-1">
              <TabsTrigger value="basic" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 min-h-[36px] truncate touch-manipulation">
                <span className="hidden sm:inline">Basic Info</span>
                <span className="sm:hidden">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="salary" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 min-h-[36px] truncate touch-manipulation">
                <span className="hidden sm:inline">Salary & Allowances</span>
                <span className="sm:hidden">Salary</span>
              </TabsTrigger>
              <TabsTrigger value="deductions" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 min-h-[36px] truncate touch-manipulation">
                Deductions
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="basic" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  Employee Information
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm lg:text-base">
                  Update employee details and basic payroll information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {shouldShowCrossWorkspace && (
                    <div className="space-y-2">
                      <Label htmlFor="workspace" className="text-sm sm:text-base font-medium">Workspace *</Label>
                      <Select value={formData.selectedWorkspaceId} onValueChange={handleWorkspaceChange}>
                        <SelectTrigger className="min-h-[40px] text-sm sm:text-base">
                          <SelectValue placeholder="Select workspace" />
                        </SelectTrigger>
                        <SelectContent>
                          {allWorkspaces.map((ws) => {
                            const wsId = ws.workspace?.id || ws.id;
                            const wsName = ws.workspace?.name || ws.name;
                            return (
                              <SelectItem key={wsId} value={wsId}>
                                <div className="flex items-center gap-2">
                                  <Building className="w-3 h-3" />
                                  <span>{wsName}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="employee" className="text-sm sm:text-base font-medium">Employee *</Label>
                    <Select value={formData.employeeId} onValueChange={handleEmployeeChange}>
                      <SelectTrigger className="min-h-[40px] text-sm sm:text-base">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employeeName" className="text-sm sm:text-base font-medium">Employee Name</Label>
                    <Input
                      id="employeeName"
                      value={formData.employeeName}
                      onChange={(e) => handleInputChange('employeeName', e.target.value)}
                      placeholder="Employee name"
                      className="min-h-[40px] text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employeeEmail" className="text-sm sm:text-base font-medium">Employee Email</Label>
                    <Input
                      id="employeeEmail"
                      type="email"
                      value={formData.employeeEmail}
                      onChange={(e) => handleInputChange('employeeEmail', e.target.value)}
                      placeholder="Employee email"
                      className="min-h-[40px] text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm sm:text-base font-medium">Department *</Label>
                    <Select 
                      value={formData.department || 'unassigned'} 
                      onValueChange={(value) => handleInputChange('department', value)}
                    >
                      <SelectTrigger className="min-h-[40px] text-sm sm:text-base">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {availableDepartments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm sm:text-base font-medium">Role *</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      placeholder="Employee role"
                      className="min-h-[40px] text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payrollStatus" className="text-sm sm:text-base font-medium">Payroll Status</Label>
                    <Select 
                        value={formData.payrollStatus} 
                        onValueChange={(value) => handleInputChange('payrollStatus', value as any)}
                      >
                        <SelectTrigger className="min-h-[40px] text-sm sm:text-base">
                          <SelectValue />
                        </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processed">Processed</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  Salary & Allowances
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm lg:text-base">
                  Set up base salary, currency, and various allowances
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseSalary" className="text-sm sm:text-base font-medium">Base Salary *</Label>
                    <Input
                      id="baseSalary"
                      type="number"
                      placeholder="0.00"
                      value={formData.baseSalary}
                      onChange={(e) => handleInputChange('baseSalary', e.target.value)}
                      className="min-h-[40px] text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm sm:text-base font-medium">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger className="min-h-[40px] text-sm sm:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between p-3 sm:p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="isFixedSalary" className="text-xs sm:text-sm lg:text-base font-medium">Fixed Salary</Label>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {formData.isFixedSalary 
                            ? "This employee has a fixed monthly salary with no variable components."
                            : "This employee may have variable components like overtime or bonuses."
                          }
                        </p>
                      </div>
                      <Switch
                        id="isFixedSalary"
                        checked={formData.isFixedSalary}
                        onCheckedChange={(checked) => handleInputChange('isFixedSalary', checked.toString())}
                        className="flex-shrink-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-medium text-xs sm:text-sm lg:text-base">Allowances</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="housingAllowance" className="text-sm sm:text-base font-medium">Housing Allowance</Label>
                      <Input
                        id="housingAllowance"
                        type="number"
                        placeholder="0.00"
                        value={formData.housingAllowance}
                        onChange={(e) => handleInputChange('housingAllowance', e.target.value)}
                        className="min-h-[40px] text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transportAllowance" className="text-sm sm:text-base font-medium">Transport Allowance</Label>
                      <Input
                        id="transportAllowance"
                        type="number"
                        placeholder="0.00"
                        value={formData.transportAllowance}
                        onChange={(e) => handleInputChange('transportAllowance', e.target.value)}
                        className="min-h-[40px] text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medicalAllowance" className="text-sm sm:text-base font-medium">Medical Allowance</Label>
                      <Input
                        id="medicalAllowance"
                        type="number"
                        placeholder="0.00"
                        value={formData.medicalAllowance}
                        onChange={(e) => handleInputChange('medicalAllowance', e.target.value)}
                        className="min-h-[40px] text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mealAllowance" className="text-sm sm:text-base font-medium">Meal Allowance</Label>
                      <Input
                        id="mealAllowance"
                        type="number"
                        placeholder="0.00"
                        value={formData.mealAllowance}
                        onChange={(e) => handleInputChange('mealAllowance', e.target.value)}
                        className="min-h-[40px] text-sm sm:text-base"
                      />
                    </div>

                    {!formData.isFixedSalary && (
                      <div className="space-y-2">
                        <Label htmlFor="otherAllowance" className="text-sm sm:text-base font-medium">Other Allowance (Variable)</Label>
                        <Input
                          id="otherAllowance"
                          type="number"
                          placeholder="0.00"
                          value={formData.otherAllowance}
                          onChange={(e) => handleInputChange('otherAllowance', e.target.value)}
                          className="min-h-[40px] text-sm sm:text-base"
                        />
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Variable allowance that may change monthly
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-medium text-xs sm:text-sm lg:text-base">Variable Components</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="overtime" className="text-sm sm:text-base font-medium">Overtime Rate</Label>
                      <Input
                        id="overtime"
                        type="number"
                        placeholder="0.00"
                        value={formData.overtime}
                        onChange={(e) => handleInputChange('overtime', e.target.value)}
                        disabled={formData.isFixedSalary}
                        className="min-h-[40px] text-sm sm:text-base"
                      />
                      {formData.isFixedSalary && (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Disabled for fixed salary employees
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bonus" className="text-sm sm:text-base font-medium">Bonus</Label>
                      <Input
                        id="bonus"
                        type="number"
                        placeholder="0.00"
                        value={formData.bonus}
                        onChange={(e) => handleInputChange('bonus', e.target.value)}
                        disabled={formData.isFixedSalary}
                        className="min-h-[40px] text-sm sm:text-base"
                      />
                      {formData.isFixedSalary && (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Disabled for fixed salary employees
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deductions" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                  <Calculator className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  Deductions
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm lg:text-base">
                  Set up tax and other deductions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax" className="text-sm sm:text-base font-medium">Tax</Label>
                    <Input
                      id="tax"
                      type="number"
                      placeholder="0.00"
                      value={formData.tax}
                      onChange={(e) => handleInputChange('tax', e.target.value)}
                      className="min-h-[40px] text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="socialSecurity" className="text-sm sm:text-base font-medium">Social Security</Label>
                    <Input
                      id="socialSecurity"
                      type="number"
                      placeholder="0.00"
                      value={formData.socialSecurity}
                      onChange={(e) => handleInputChange('socialSecurity', e.target.value)}
                      className="min-h-[40px] text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pension" className="text-sm sm:text-base font-medium">Pension</Label>
                    <Input
                      id="pension"
                      type="number"
                      placeholder="0.00"
                      value={formData.pension}
                      onChange={(e) => handleInputChange('pension', e.target.value)}
                      className="min-h-[40px] text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance" className="text-sm sm:text-base font-medium">Insurance</Label>
                    <Input
                      id="insurance"
                      type="number"
                      placeholder="0.00"
                      value={formData.insurance}
                      onChange={(e) => handleInputChange('insurance', e.target.value)}
                      className="min-h-[40px] text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otherDeduction" className="text-sm sm:text-base font-medium">Other Deductions</Label>
                    <Input
                      id="otherDeduction"
                      type="number"
                      placeholder="0.00"
                      value={formData.otherDeduction}
                      onChange={(e) => handleInputChange('otherDeduction', e.target.value)}
                      className="min-h-[40px] text-sm sm:text-base"
                    />
                  </div>
                </div>

                <Alert className="p-3 sm:p-4">
                  <Calculator className="h-4 w-4 flex-shrink-0" />
                  <AlertDescription className="text-xs sm:text-sm lg:text-base">
                    <strong>Calculated Net Salary:</strong> {formData.currency} {calculateNetSalary().toFixed(2)}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 pt-3 sm:pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={saving}
            className="w-full sm:w-auto min-h-[40px] text-xs sm:text-sm lg:text-base order-2 sm:order-1 touch-manipulation"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={saving}
            className="w-full sm:w-auto min-h-[40px] text-xs sm:text-sm lg:text-base order-1 sm:order-2 touch-manipulation"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                <span className="truncate">Updating...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Update Employee</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}