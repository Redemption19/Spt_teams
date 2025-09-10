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
  Wallet, 
  Calculator,
  Loader2, 
  AlertCircle,
  Plus,
  Building
} from 'lucide-react';
import { PayrollService, CreatePayrollEmployeeData } from '@/lib/payroll-service';
import { UserService } from '@/lib/user-service';
import { DepartmentService } from '@/lib/department-service';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { Badge } from '@/components/ui/badge';

interface CreatePayrollEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: () => void;
  workspaceFilter?: 'current' | 'all';
  allWorkspaces?: any[];
  shouldShowCrossWorkspace?: boolean;
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
  
  // Fixed Salary Configuration
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
  
  // Additional (Variable Components)
  overtime: string;
  bonus: string;
}

export default function CreatePayrollEmployeeForm({ 
  isOpen, 
  onClose, 
  workspaceId, 
  onSuccess,
  workspaceFilter = 'current',
  allWorkspaces = [],
  shouldShowCrossWorkspace = false
}: CreatePayrollEmployeeFormProps) {
  const { toast } = useToast();
  const { defaultCurrency } = useCurrency();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<FormData>({
    selectedWorkspaceId: workspaceId,
    employeeId: '',
    employeeName: '',
    employeeEmail: '',
    department: '',
    role: '',
    baseSalary: '',
    currency: defaultCurrency?.code || 'GHS',
    isFixedSalary: false,
    housingAllowance: '0',
    transportAllowance: '0',
    medicalAllowance: '0',
    mealAllowance: '0',
    otherAllowance: '0',
    tax: '0',
    socialSecurity: '0',
    pension: '0',
    insurance: '0',
    otherDeduction: '0',
    overtime: '0',
    bonus: '0'
  });

  const loadFormData = useCallback(async () => {
    try {
      setLoading(true);
      
      let allUsers: any[] = [];
      let allDepartments: any[] = [];

      if (shouldShowCrossWorkspace && workspaceFilter === 'all') {
        // Load from all workspaces
        const workspaceIds = allWorkspaces.map(ws => {
          if (ws.workspace && ws.workspace.id) {
            return ws.workspace.id;
          }
          if (ws.id) {
            return ws.id;
          }
          return null;
        }).filter(id => id);
        
        if (workspaceIds.length > 0) {
          const [usersData, departmentsData] = await Promise.all([
            Promise.all(workspaceIds.map(wsId => {
              if (!wsId) return Promise.resolve([]);
              return UserService.getUsersByWorkspace(wsId);
            })),
            Promise.all(workspaceIds.map(wsId => {
              if (!wsId) return Promise.resolve([]);
              return DepartmentService.getWorkspaceDepartments(wsId);
            }))
          ]);

          allUsers = usersData.flat().map(user => ({
            ...user,
            workspaceName: allWorkspaces.find(ws => {
              const wsId = ws.workspace?.id || ws.id;
              return wsId === user.workspaceId;
            })?.workspace?.name || allWorkspaces.find(ws => ws.id === user.workspaceId)?.name || 'Unknown'
          }));
          
          allDepartments = departmentsData.flat().map(dept => ({
            ...dept,
            workspaceName: allWorkspaces.find(ws => {
              const wsId = ws.workspace?.id || ws.id;
              return wsId === dept.workspaceId;
            })?.workspace?.name || allWorkspaces.find(ws => ws.id === dept.workspaceId)?.name || 'Unknown'
          }));
        }
      } else {
        // Load from current workspace
        const [usersData, departmentsData] = await Promise.all([
          UserService.getUsersByWorkspace(workspaceId),
          DepartmentService.getWorkspaceDepartments(workspaceId)
        ]);

        allUsers = usersData;
        allDepartments = departmentsData;
      }

      setUsers(allUsers);
      setDepartments(allDepartments);
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
  }, [workspaceId, workspaceFilter, shouldShowCrossWorkspace, allWorkspaces, toast]);

  const resetFormData = useCallback(() => {
    setFormData({
      selectedWorkspaceId: workspaceId,
      employeeId: '',
      employeeName: '',
      employeeEmail: '',
      department: '',
      role: '',
      baseSalary: '',
      currency: defaultCurrency?.code || 'GHS',
      isFixedSalary: false,
      housingAllowance: '0',
      transportAllowance: '0',
      medicalAllowance: '0',
      mealAllowance: '0',
      otherAllowance: '0',
      tax: '0',
      socialSecurity: '0',
      pension: '0',
      insurance: '0',
      otherDeduction: '0',
      overtime: '0',
      bonus: '0'
    });
  }, [defaultCurrency?.code, workspaceId]);

  useEffect(() => {
    if (isOpen) {
      loadFormData();
      resetFormData();
    }
  }, [isOpen, loadFormData, resetFormData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmployeeChange = (userId: string) => {
    const selectedUser = users.find(user => user.id === userId);
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        employeeId: userId,
        employeeName: `${selectedUser.firstName || selectedUser.name} ${selectedUser.lastName || ''}`.trim(),
        employeeEmail: selectedUser.email || ''
      }));
    }
  };

  const handleWorkspaceChange = async (workspaceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedWorkspaceId: workspaceId,
      employeeId: '', // Reset employee selection when workspace changes
      employeeName: '',
      employeeEmail: '',
      department: '' // Reset department selection when workspace changes
    }));

    // Load users and departments for the selected workspace
    try {
      const [usersData, departmentsData] = await Promise.all([
        UserService.getUsersByWorkspace(workspaceId),
        DepartmentService.getWorkspaceDepartments(workspaceId)
      ]);

      setUsers(usersData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error loading workspace data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workspace data. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const validateForm = (): boolean => {
    if (shouldShowCrossWorkspace && !formData.selectedWorkspaceId) {
      toast({
        title: 'Error',
        description: 'Please select a workspace.',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.employeeId) {
      toast({
        title: 'Error',
        description: 'Please select an employee.',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.department) {
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

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      const payrollData: CreatePayrollEmployeeData = {
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        employeeEmail: formData.employeeEmail,
        workspaceId: formData.selectedWorkspaceId,
        department: formData.department,
        role: formData.role,
        baseSalary: parseFloat(formData.baseSalary),
        currency: formData.currency,
        isFixedSalary: formData.isFixedSalary,
        allowances: {
          housing: parseFloat(formData.housingAllowance) || 0,
          transport: parseFloat(formData.transportAllowance) || 0,
          medical: parseFloat(formData.medicalAllowance) || 0,
          meal: parseFloat(formData.mealAllowance) || 0,
          other: parseFloat(formData.otherAllowance) || 0
        },
        deductions: {
          tax: parseFloat(formData.tax) || 0,
          socialSecurity: parseFloat(formData.socialSecurity) || 0,
          pension: parseFloat(formData.pension) || 0,
          insurance: parseFloat(formData.insurance) || 0,
          other: parseFloat(formData.otherDeduction) || 0
        },
        overtime: parseFloat(formData.overtime) || 0,
        bonus: parseFloat(formData.bonus) || 0
      };

      await PayrollService.createPayrollEmployee(payrollData);
      
      toast({
        title: 'Success',
        description: 'Payroll employee created successfully.',
        variant: 'default'
      });
      
      onSuccess();
      onClose();
      resetFormData();
    } catch (error) {
      console.error('Error creating payroll employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to create payroll employee. Please try again.',
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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Payroll Employee</DialogTitle>
            <DialogDescription>
              Add a new employee to the payroll system
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading form data...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl">Create Payroll Employee</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Add a new employee to the payroll system with salary, allowances, and deductions
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 sm:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-3 h-auto min-h-[40px] bg-muted p-1 gap-1">
              <TabsTrigger value="basic" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 min-h-[36px] truncate">
                <span className="hidden sm:inline">Basic Info</span>
                <span className="sm:hidden">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="salary" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 min-h-[36px] truncate">
                <span className="hidden sm:inline">Salary & Allowances</span>
                <span className="sm:hidden">Salary</span>
              </TabsTrigger>
              <TabsTrigger value="deductions" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 min-h-[36px] truncate">
                Deductions
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="basic" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  Employee Information
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Select an employee and assign their basic payroll information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {shouldShowCrossWorkspace && (
                    <div className="space-y-2 sm:col-span-2">
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
                    <Label htmlFor="department" className="text-sm sm:text-base font-medium">Department *</Label>
                    <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                      <SelectTrigger className="min-h-[40px] text-sm sm:text-base">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
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
                      placeholder="Enter role"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="min-h-[40px] text-sm sm:text-base"
                    />
                  </div>

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
                        <SelectItem value="GHS">GHS - Ghana Cedi</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                        <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                        <SelectItem value="EGP">EGP - Egyptian Pound</SelectItem>
                        <SelectItem value="MAD">MAD - Moroccan Dirham</SelectItem>
                        <SelectItem value="TND">TND - Tunisian Dinar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between p-3 sm:p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="isFixedSalary" className="text-sm sm:text-base font-medium">Fixed Salary</Label>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  Salary & Allowances
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Set up base salary, currency, and various allowances
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

                <div className="space-y-4 sm:space-y-6">
                  <h4 className="font-medium text-sm sm:text-base">Allowances</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                      <div className="space-y-2 sm:col-span-2">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deductions" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calculator className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  Deductions
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Set up tax and other deductions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                  <AlertDescription className="text-sm sm:text-base">
                    <strong>Calculated Net Salary:</strong> {formData.currency} {calculateNetSalary().toFixed(2)}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 pt-4 sm:pt-6">
          <Button variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto min-h-[40px] order-2 sm:order-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="w-full sm:w-auto min-h-[40px] order-1 sm:order-2">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                <span className="truncate">Creating...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Create Employee</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}