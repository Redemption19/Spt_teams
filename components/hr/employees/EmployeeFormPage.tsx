'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Briefcase, 
  Wallet, 
  Loader2, 
  ArrowLeft,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { Employee, CreateEmployeeData, UpdateEmployeeData, EmployeeService } from '@/lib/employee-service';
import { DepartmentService } from '@/lib/department-service';
import { UserService } from '@/lib/user-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { FormData } from './types';
import { EmployeePersonalInfoTab } from './EmployeePersonalInfoTab';
import { EmployeeEmploymentTab } from './EmployeeEmploymentTab';
import { EmployeeCompensationTab } from './EmployeeCompensationTab';
import { EmployeeImportDialog } from './EmployeeImportDialog';
import { ImportedEmployee } from '@/lib/employee-import-service';

interface EmployeeFormPageProps {
  employee?: Employee | null;
  mode: 'create' | 'edit';
}

export function EmployeeFormPage({ employee, mode }: EmployeeFormPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  const { defaultCurrency } = useCurrency();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('personal');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    workspaceId: currentWorkspace?.id || '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    role: '',
    department: '',
    departmentId: '',
    manager: '',
    managerId: '',
    hireDate: '',
    employmentType: 'full-time',
    workLocation: 'office',
    probationEndDate: '',
    contractEndDate: '',
    baseSalary: '',
    currency: defaultCurrency?.code || 'USD',
    payFrequency: 'monthly',
    housingAllowance: '0',
    transportAllowance: '0',
    medicalAllowance: '0',
    otherAllowance: '0',
    benefits: ''
  });

  // Check if user is owner
  const isOwner = userProfile?.role === 'owner';

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load workspaces for owners
      if (isOwner) {
        const workspaceData = await WorkspaceService.getUserAccessibleWorkspaces(user?.uid || '');
        const allWorkspaces = [
          ...workspaceData.mainWorkspaces,
          ...Object.values(workspaceData.subWorkspaces).flat()
        ];
        setAvailableWorkspaces(allWorkspaces);
      } else if (currentWorkspace) {
        setAvailableWorkspaces([currentWorkspace]);
        setFormData(prev => ({ ...prev, workspaceId: currentWorkspace.id }));
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workspace data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [isOwner, user?.uid, currentWorkspace, toast]);

  const loadWorkspaceData = useCallback(async () => {
    if (!formData.workspaceId) return;
    
    try {
      let departmentsData: any[] = [];
      let managersData: any[] = [];

      // For owners, load from all accessible workspaces
      if (isOwner && accessibleWorkspaces?.length > 0) {
        // Load departments and managers from all accessible workspaces in parallel
        const workspacePromises = accessibleWorkspaces.map(async (workspace) => {
          try {
            const [depts, users] = await Promise.all([
              DepartmentService.getWorkspaceDepartments(workspace.id),
              UserService.getUsersByWorkspace(workspace.id)
            ]);

            // Add workspace metadata to departments
            const departmentsWithMeta = depts.map(dept => ({
              ...dept,
              _workspaceName: workspace.name,
              _workspaceId: workspace.id
            }));

            // Filter managers and add workspace metadata
            const workspaceManagers = users.filter(user => 
              ['admin', 'owner', 'manager'].includes(user.role || '')
            ).map(manager => ({
              ...manager,
              _workspaceName: workspace.name,
              _workspaceId: workspace.id
            }));

            return {
              departments: departmentsWithMeta,
              managers: workspaceManagers
            };
          } catch (error) {
            console.warn(`Failed to load data for workspace ${workspace.name}:`, error);
            return {
              departments: [],
              managers: []
            };
          }
        });

        const workspaceResults = await Promise.all(workspacePromises);
        
        // Combine results and remove duplicates
        const departmentIdSet = new Set<string>();
        const managerIdSet = new Set<string>();

        workspaceResults.forEach(({ departments, managers }) => {
          departments.forEach(dept => {
            if (!departmentIdSet.has(dept.id)) {
              departmentIdSet.add(dept.id);
              departmentsData.push(dept);
            }
          });
          
          managers.forEach(manager => {
            if (!managerIdSet.has(manager.id)) {
              managerIdSet.add(manager.id);
              managersData.push(manager);
            }
          });
        });
      } else {
        // For non-owners or when no accessible workspaces, load from single workspace
        const [departmentsDataSingle, managersDataSingle] = await Promise.all([
          DepartmentService.getWorkspaceDepartments(formData.workspaceId),
          UserService.getUsersByWorkspace(formData.workspaceId)
        ]);
        
        departmentsData = departmentsDataSingle;
        managersData = managersDataSingle.filter(user => 
          ['admin', 'owner', 'manager'].includes(user.role || '')
        );
      }
      
      setDepartments(departmentsData);
      setManagers(managersData);
    } catch (error) {
      console.error('Error loading workspace data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workspace data. Please try again.',
        variant: 'destructive'
      });
    }
  }, [formData.workspaceId, isOwner, accessibleWorkspaces, toast]);

  const populateFormData = useCallback(() => {
    if (!employee) return;
    
    setFormData({
      workspaceId: employee.workspaceId,
      firstName: employee.personalInfo.firstName,
      lastName: employee.personalInfo.lastName,
      email: employee.personalInfo.email,
      phone: employee.personalInfo.phone,
      dateOfBirth: employee.personalInfo.dateOfBirth,
      gender: employee.personalInfo.gender,
      street: employee.personalInfo.address.street,
      city: employee.personalInfo.address.city,
      state: employee.personalInfo.address.state,
      zipCode: employee.personalInfo.address.zipCode,
      country: employee.personalInfo.address.country,
      emergencyContactName: employee.personalInfo.emergencyContact.name,
      emergencyContactRelationship: employee.personalInfo.emergencyContact.relationship,
      emergencyContactPhone: employee.personalInfo.emergencyContact.phone,
      role: employee.employmentDetails.role,
      department: employee.employmentDetails.department,
      departmentId: employee.employmentDetails.departmentId,
      manager: employee.employmentDetails.manager,
      managerId: employee.employmentDetails.managerId || '',
      hireDate: employee.employmentDetails.hireDate,
      employmentType: employee.employmentDetails.employmentType,
      workLocation: employee.employmentDetails.workLocation,
      probationEndDate: employee.employmentDetails.probationEndDate || '',
      contractEndDate: employee.employmentDetails.contractEndDate || '',
      baseSalary: employee.compensation.baseSalary.toString(),
      currency: employee.compensation.currency,
      payFrequency: employee.compensation.payFrequency,
      housingAllowance: employee.compensation.allowances.housing.toString(),
      transportAllowance: employee.compensation.allowances.transport.toString(),
      medicalAllowance: employee.compensation.allowances.medical.toString(),
      otherAllowance: employee.compensation.allowances.other.toString(),
      benefits: employee.compensation.benefits.join(', ')
    });
  }, [employee]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (formData.workspaceId) {
      loadWorkspaceData();
    }
  }, [formData.workspaceId, loadWorkspaceData]);

  useEffect(() => {
    if (employee && mode === 'edit') {
      populateFormData();
    }
  }, [employee, mode, populateFormData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkspaceChange = (workspaceId: string) => {
    setFormData(prev => ({
      ...prev,
      workspaceId,
      department: '',
      departmentId: '',
      manager: '',
      managerId: ''
    }));
  };

  const handleDepartmentChange = (departmentName: string) => {
    const department = departments.find(dept => dept.name === departmentName);
    setFormData(prev => ({
      ...prev,
      department: departmentName,
      departmentId: department?.id || ''
    }));
  };

  const handleManagerChange = (managerName: string) => {
    const manager = managers.find(mgr => mgr.name === managerName);
    setFormData(prev => ({
      ...prev,
      manager: managerName,
      managerId: manager?.id || ''
    }));
  };

  const validateForm = (): boolean => {
    const requiredFields = [
      'workspaceId', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
      'role', 'department', 'hireDate', 'baseSalary'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof FormData]) {
        toast({
          title: 'Validation Error',
          description: `Please fill in all required fields. Missing: ${field}`,
          variant: 'destructive'
        });
        return false;
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
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
      
      const employeeData = {
        personalInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country
          },
          emergencyContact: {
            name: formData.emergencyContactName,
            relationship: formData.emergencyContactRelationship,
            phone: formData.emergencyContactPhone
          }
        },
        employmentDetails: {
          role: formData.role,
          department: formData.department,
          departmentId: formData.departmentId,
          manager: formData.manager,
          managerId: formData.managerId || undefined,
          hireDate: formData.hireDate,
          employmentType: formData.employmentType,
          workLocation: formData.workLocation,
          probationEndDate: formData.probationEndDate || undefined,
          contractEndDate: formData.contractEndDate || undefined
        },
        compensation: {
          baseSalary: parseFloat(formData.baseSalary),
          currency: formData.currency,
          payFrequency: formData.payFrequency,
          allowances: {
            housing: parseFloat(formData.housingAllowance),
            transport: parseFloat(formData.transportAllowance),
            medical: parseFloat(formData.medicalAllowance),
            other: parseFloat(formData.otherAllowance)
          },
          benefits: formData.benefits ? formData.benefits.split(',').map(b => b.trim()) : []
        }
      };

      if (mode === 'create') {
        const createData: CreateEmployeeData = {
          ...employeeData,
          workspaceId: formData.workspaceId,
          createdBy: user?.uid || 'system'
        };
        const newEmployeeId = await EmployeeService.createEmployee(createData);
        
        toast({
          title: 'Employee Created',
          description: 'Employee has been created successfully.'
        });
        
        router.push(`/dashboard/hr/employees/${newEmployeeId}`);
      } else if (employee) {
        const updateData: UpdateEmployeeData = {
          personalInfo: employeeData.personalInfo,
          employmentDetails: employeeData.employmentDetails,
          compensation: employeeData.compensation,
          updatedBy: user?.uid || 'system'
        };
        await EmployeeService.updateEmployee(employee.id, updateData);
        
        toast({
          title: 'Employee Updated',
          description: 'Employee has been updated successfully.'
        });
        
        router.push(`/dashboard/hr/employees/${employee.id}`);
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        title: 'Error',
        description: `Failed to ${mode} employee. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (mode === 'edit' && employee) {
      router.push(`/dashboard/hr/employees/${employee.id}`);
    } else {
      router.push('/dashboard/hr/employees');
    }
  };

  const handleImportEmployees = async (importedEmployees: ImportedEmployee[]) => {
    try {
      setSaving(true);
      let successCount = 0;
      let errorCount = 0;

      for (const importedEmployee of importedEmployees) {
        try {
          const employeeData = {
            personalInfo: {
              firstName: importedEmployee.firstName,
              lastName: importedEmployee.lastName,
              email: importedEmployee.email,
              phone: importedEmployee.phone,
              dateOfBirth: importedEmployee.dateOfBirth,
              gender: importedEmployee.gender,
              address: {
                street: importedEmployee.street,
                city: importedEmployee.city,
                state: importedEmployee.state,
                zipCode: importedEmployee.zipCode,
                country: importedEmployee.country
              },
              emergencyContact: {
                name: importedEmployee.emergencyContactName,
                relationship: importedEmployee.emergencyContactRelationship,
                phone: importedEmployee.emergencyContactPhone
              }
            },
            employmentDetails: {
              role: importedEmployee.role,
              department: importedEmployee.department,
              departmentId: '',
              manager: importedEmployee.manager,
              managerId: '',
              hireDate: importedEmployee.hireDate,
              employmentType: importedEmployee.employmentType,
              workLocation: importedEmployee.workLocation,
              probationEndDate: importedEmployee.probationEndDate || undefined,
              contractEndDate: importedEmployee.contractEndDate || undefined
            },
            compensation: {
              baseSalary: parseFloat(importedEmployee.baseSalary),
              currency: importedEmployee.currency,
              payFrequency: importedEmployee.payFrequency,
              allowances: {
                housing: parseFloat(importedEmployee.housingAllowance),
                transport: parseFloat(importedEmployee.transportAllowance),
                medical: parseFloat(importedEmployee.medicalAllowance),
                other: parseFloat(importedEmployee.otherAllowance)
              },
              benefits: importedEmployee.benefits ? importedEmployee.benefits.split(',').map(b => b.trim()) : []
            }
          };

          const createData: CreateEmployeeData = {
            ...employeeData,
            workspaceId: formData.workspaceId,
            createdBy: user?.uid || 'system'
          };
          
          await EmployeeService.createEmployee(createData);
          successCount++;
        } catch (error) {
          console.error(`Failed to create employee ${importedEmployee.firstName} ${importedEmployee.lastName}:`, error);
          errorCount++;
        }
      }

      toast({
        title: 'Bulk Import Completed',
        description: `Successfully imported ${successCount} employees. ${errorCount} failed.`,
        variant: errorCount > 0 ? 'default' : 'default'
      });

      // Redirect to employees list
      router.push('/dashboard/hr/employees');
    } catch (error) {
      console.error('Error during bulk import:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import employees. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" disabled>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'create' 
                ? 'Fill in the employee information to add them to your workspace.'
                : 'Update the employee information below.'
              }
            </p>
          </div>
        </div>
        
        {/* Import Button (only for create mode) */}
        {mode === 'create' && (
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Employees
          </Button>
        )}
      </div>

      {/* Form Content */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Personal Information
              </TabsTrigger>
              <TabsTrigger value="employment" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Employment Details
              </TabsTrigger>
              <TabsTrigger value="compensation" className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Compensation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-6">
              <EmployeePersonalInfoTab
                formData={formData}
                onInputChange={handleInputChange}
                onWorkspaceChange={handleWorkspaceChange}
                onCancel={handleCancel}
                onSubmit={handleSubmit}
                saving={saving}
                isOwner={isOwner}
                mode={mode}
                availableWorkspaces={availableWorkspaces}
              />
            </TabsContent>

            <TabsContent value="employment" className="mt-6">
              <EmployeeEmploymentTab
                formData={formData}
                onInputChange={handleInputChange}
                onDepartmentChange={handleDepartmentChange}
                onManagerChange={handleManagerChange}
                onCancel={handleCancel}
                onSubmit={handleSubmit}
                saving={saving}
                mode={mode}
                departments={departments}
                managers={managers}
              />
            </TabsContent>

            <TabsContent value="compensation" className="mt-6">
              <EmployeeCompensationTab
                formData={formData}
                onInputChange={handleInputChange}
                onCancel={handleCancel}
                onSubmit={handleSubmit}
                saving={saving}
                mode={mode}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <EmployeeImportDialog
        onImport={handleImportEmployees}
        isOpen={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  );
} 