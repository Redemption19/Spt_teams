'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Briefcase, 
  DollarSign, 
  Loader2, 
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowLeft,
  Save,
  X,
  Building
} from 'lucide-react';
import { Employee, CreateEmployeeData, UpdateEmployeeData, EmployeeService } from '@/lib/employee-service';
import { DepartmentService } from '@/lib/department-service';
import { UserService } from '@/lib/user-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';

interface EmployeeFormPageProps {
  employee?: Employee | null;
  mode: 'create' | 'edit';
}

interface FormData {
  // Workspace Selection (for owners)
  workspaceId: string;
  
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  
  // Employment Details
  role: string;
  department: string;
  departmentId: string;
  manager: string;
  managerId: string;
  hireDate: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
  workLocation: 'office' | 'remote' | 'hybrid';
  probationEndDate: string;
  contractEndDate: string;
  
  // Compensation
  baseSalary: string;
  currency: string;
  payFrequency: 'monthly' | 'bi-weekly' | 'weekly';
  housingAllowance: string;
  transportAllowance: string;
  medicalAllowance: string;
  otherAllowance: string;
  benefits: string;
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
      const [departmentsData, managersData] = await Promise.all([
        DepartmentService.getWorkspaceDepartments(formData.workspaceId),
        UserService.getUsersByWorkspace(formData.workspaceId)
      ]);
      
      setDepartments(departmentsData);
      setManagers(managersData.filter(user => 
        ['admin', 'owner', 'manager'].includes(user.role || '')
      ));
    } catch (error) {
      console.error('Error loading workspace data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workspace data. Please try again.',
        variant: 'destructive'
      });
    }
  }, [formData.workspaceId, toast]);

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
                <DollarSign className="w-4 h-4" />
                Compensation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-6 space-y-6">
              {/* Workspace Selection (for owners) */}
              {isOwner && mode === 'create' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Workspace Selection
                    </CardTitle>
                    <CardDescription>Select the workspace where this employee will be assigned</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="workspaceId">Workspace *</Label>
                      <Select value={formData.workspaceId} onValueChange={handleWorkspaceChange}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select workspace" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableWorkspaces.map((workspace) => (
                            <SelectItem key={workspace.id} value={workspace.id}>
                              {workspace.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Personal details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="John"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Doe"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="john.doe@company.com"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+1234567890"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value: any) => handleInputChange('gender', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Address Information
                  </CardTitle>
                  <CardDescription>Residential address details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      placeholder="123 Main Street"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="New York"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="NY"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        placeholder="10001"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="United States"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                  <CardDescription>Contact information for emergencies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContactName">Contact Name</Label>
                      <Input
                        id="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                        placeholder="Jane Doe"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                      <Input
                        id="emergencyContactRelationship"
                        value={formData.emergencyContactRelationship}
                        onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                        placeholder="Spouse"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                      placeholder="+1234567890"
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons for Personal Tab */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'Create Employee' : 'Update Employee'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="employment" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Information</CardTitle>
                  <CardDescription>Role, department, and employment details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Job Title/Role *</Label>
                      <Input
                        id="role"
                        value={formData.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        placeholder="Software Engineer"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Select value={formData.department} onValueChange={handleDepartmentChange}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manager">Manager</Label>
                      <Select value={formData.manager} onValueChange={handleManagerChange}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.name}>
                              {manager.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="hireDate">Hire Date *</Label>
                      <Input
                        id="hireDate"
                        type="date"
                        value={formData.hireDate}
                        onChange={(e) => handleInputChange('hireDate', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employmentType">Employment Type</Label>
                      <Select value={formData.employmentType} onValueChange={(value: any) => handleInputChange('employmentType', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="intern">Intern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="workLocation">Work Location</Label>
                      <Select value={formData.workLocation} onValueChange={(value: any) => handleInputChange('workLocation', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.employmentType === 'contract' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="probationEndDate">Probation End Date</Label>
                        <Input
                          id="probationEndDate"
                          type="date"
                          value={formData.probationEndDate}
                          onChange={(e) => handleInputChange('probationEndDate', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contractEndDate">Contract End Date</Label>
                        <Input
                          id="contractEndDate"
                          type="date"
                          value={formData.contractEndDate}
                          onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons for Employment Tab */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'Create Employee' : 'Update Employee'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="compensation" className="mt-6 space-y-6">
              {/* Base Salary */}
              <Card>
                <CardHeader>
                  <CardTitle>Base Compensation</CardTitle>
                  <CardDescription>Primary salary and payment details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="baseSalary">Base Salary *</Label>
                      <Input
                        id="baseSalary"
                        type="number"
                        value={formData.baseSalary}
                        onChange={(e) => handleInputChange('baseSalary', e.target.value)}
                        placeholder="50000"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        value={formData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        placeholder="USD"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payFrequency">Pay Frequency</Label>
                      <Select value={formData.payFrequency} onValueChange={(value: any) => handleInputChange('payFrequency', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Allowances */}
              <Card>
                <CardHeader>
                  <CardTitle>Allowances</CardTitle>
                  <CardDescription>Additional compensation and allowances</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="housingAllowance">Housing Allowance</Label>
                      <Input
                        id="housingAllowance"
                        type="number"
                        value={formData.housingAllowance}
                        onChange={(e) => handleInputChange('housingAllowance', e.target.value)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="transportAllowance">Transport Allowance</Label>
                      <Input
                        id="transportAllowance"
                        type="number"
                        value={formData.transportAllowance}
                        onChange={(e) => handleInputChange('transportAllowance', e.target.value)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="medicalAllowance">Medical Allowance</Label>
                      <Input
                        id="medicalAllowance"
                        type="number"
                        value={formData.medicalAllowance}
                        onChange={(e) => handleInputChange('medicalAllowance', e.target.value)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="otherAllowance">Other Allowance</Label>
                      <Input
                        id="otherAllowance"
                        type="number"
                        value={formData.otherAllowance}
                        onChange={(e) => handleInputChange('otherAllowance', e.target.value)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle>Benefits</CardTitle>
                  <CardDescription>Employee benefits and perks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="benefits">Benefits (comma-separated)</Label>
                    <Textarea
                      id="benefits"
                      value={formData.benefits}
                      onChange={(e) => handleInputChange('benefits', e.target.value)}
                      placeholder="Health Insurance, Dental Coverage, Life Insurance"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons for Compensation Tab */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'Create Employee' : 'Update Employee'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 