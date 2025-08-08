import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Calendar
} from 'lucide-react';
import { Employee, CreateEmployeeData, UpdateEmployeeData, EmployeeService } from '@/lib/employee-service';
import { DepartmentService } from '@/lib/department-service';
import { UserService } from '@/lib/user-service';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  workspaceId: string;
  onSuccess: () => void;
  mode: 'create' | 'edit';
}

interface FormData {
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

export function EmployeeForm({ 
  isOpen, 
  onClose, 
  employee, 
  workspaceId, 
  onSuccess, 
  mode 
}: EmployeeFormProps) {
  const { toast } = useToast();
  const { defaultCurrency } = useCurrency();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState<FormData>({
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

  const loadFormData = useCallback(async () => {
    try {
      const [departmentsData, managersData] = await Promise.all([
        DepartmentService.getWorkspaceDepartments(workspaceId),
        UserService.getUsersByWorkspace(workspaceId)
      ]);
      
      setDepartments(departmentsData);
      setManagers(managersData.filter(user => 
        ['admin', 'owner', 'manager'].includes(user.role || '')
      ));
    } catch (error) {
      console.error('Error loading form data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form data. Please try again.',
        variant: 'destructive'
      });
    }
  }, [workspaceId, toast]);

  const populateFormData = useCallback(() => {
    if (!employee) return;
    
    setFormData({
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

  const resetFormData = useCallback(() => {
    setFormData({
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
  }, [defaultCurrency?.code]);

  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen, workspaceId, loadFormData]);

  useEffect(() => {
    if (employee && mode === 'edit') {
      populateFormData();
    } else if (mode === 'create') {
      resetFormData();
    }
  }, [employee, mode, populateFormData, resetFormData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
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
      setLoading(true);
      
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
          workspaceId,
          createdBy: user?.uid || 'system'
        };
        await EmployeeService.createEmployee(createData);
      } else if (employee) {
        const updateData: UpdateEmployeeData = {
          personalInfo: employeeData.personalInfo,
          employmentDetails: employeeData.employmentDetails,
          compensation: employeeData.compensation,
          updatedBy: user?.uid || 'system'
        };
        await EmployeeService.updateEmployee(employee.id, updateData);
      }
      
      toast({
        title: mode === 'create' ? 'Employee Created' : 'Employee Updated',
        description: `Employee has been ${mode === 'create' ? 'created' : 'updated'} successfully.`
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        title: 'Error',
        description: `Failed to ${mode} employee. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[800px] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="text-lg sm:text-xl">
            {mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {mode === 'create' 
              ? 'Fill in the employee information to add them to your workspace.'
              : 'Update the employee information below.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 sm:h-10">
            <TabsTrigger value="personal" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 touch-manipulation">
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Personal</span>
              <span className="xs:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="employment" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 touch-manipulation">
              <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Employment</span>
              <span className="xs:hidden">Job</span>
            </TabsTrigger>
            <TabsTrigger value="compensation" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 touch-manipulation">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Compensation</span>
              <span className="xs:hidden">Pay</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Personal Information</CardTitle>
                <CardDescription className="text-sm">Basic personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="John"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Doe"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="john.doe@company.com"
                        className="pl-10 h-11 sm:h-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1234567890"
                        className="pl-10 h-11 sm:h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value: any) => handleInputChange('gender', value)}>
                      <SelectTrigger className="h-11 sm:h-10 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="street" className="text-sm font-medium">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    placeholder="123 Main Street"
                    className="h-11 sm:h-10 mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Accra"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-sm font-medium">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Accra"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="zipCode" className="text-sm font-medium">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="10001"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="Ghana"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Emergency Contact</CardTitle>
                <CardDescription className="text-sm">Contact information for emergencies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName" className="text-sm font-medium">Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                      placeholder="Jane Doe"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelationship" className="text-sm font-medium">Relationship</Label>
                    <Input
                      id="emergencyContactRelationship"
                      value={formData.emergencyContactRelationship}
                      onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                      placeholder="Spouse"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="emergencyContactPhone" className="text-sm font-medium">Contact Phone</Label>
                  <Input
                    id="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                    placeholder="+233547890123"
                    className="h-11 sm:h-10 mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Employment Details</CardTitle>
                <CardDescription className="text-sm">Job role, department, and employment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="role" className="text-sm font-medium">Job Title/Role *</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      placeholder="Software Engineer"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department" className="text-sm font-medium">Department *</Label>
                    <Select value={formData.department} onValueChange={handleDepartmentChange}>
                      <SelectTrigger className="h-11 sm:h-10 mt-1">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="manager" className="text-sm font-medium">Manager</Label>
                    <Select value={formData.manager} onValueChange={handleManagerChange}>
                      <SelectTrigger className="h-11 sm:h-10 mt-1">
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
                    <Label htmlFor="hireDate" className="text-sm font-medium">Hire Date *</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => handleInputChange('hireDate', e.target.value)}
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="employmentType" className="text-sm font-medium">Employment Type</Label>
                    <Select value={formData.employmentType} onValueChange={(value: any) => handleInputChange('employmentType', value)}>
                      <SelectTrigger className="h-11 sm:h-10 mt-1">
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
                    <Label htmlFor="workLocation" className="text-sm font-medium">Work Location</Label>
                    <Select value={formData.workLocation} onValueChange={(value: any) => handleInputChange('workLocation', value)}>
                      <SelectTrigger className="h-11 sm:h-10 mt-1">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="probationEndDate" className="text-sm font-medium">Probation End Date</Label>
                      <Input
                        id="probationEndDate"
                        type="date"
                        value={formData.probationEndDate}
                        onChange={(e) => handleInputChange('probationEndDate', e.target.value)}
                        className="h-11 sm:h-10 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contractEndDate" className="text-sm font-medium">Contract End Date</Label>
                      <Input
                        id="contractEndDate"
                        type="date"
                        value={formData.contractEndDate}
                        onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                        className="h-11 sm:h-10 mt-1"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compensation" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Salary & Compensation</CardTitle>
                <CardDescription className="text-sm">Base salary, allowances, and benefits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="baseSalary" className="text-sm font-medium">Base Salary *</Label>
                    <Input
                      id="baseSalary"
                      type="number"
                      value={formData.baseSalary}
                      onChange={(e) => handleInputChange('baseSalary', e.target.value)}
                      placeholder="50000"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
                    <Input
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      placeholder="USD"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="payFrequency" className="text-sm font-medium">Pay Frequency</Label>
                    <Select value={formData.payFrequency} onValueChange={(value: any) => handleInputChange('payFrequency', value)}>
                      <SelectTrigger className="h-11 sm:h-10 mt-1">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="housingAllowance" className="text-sm font-medium">Housing Allowance</Label>
                    <Input
                      id="housingAllowance"
                      type="number"
                      value={formData.housingAllowance}
                      onChange={(e) => handleInputChange('housingAllowance', e.target.value)}
                      placeholder="0"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="transportAllowance" className="text-sm font-medium">Transport Allowance</Label>
                    <Input
                      id="transportAllowance"
                      type="number"
                      value={formData.transportAllowance}
                      onChange={(e) => handleInputChange('transportAllowance', e.target.value)}
                      placeholder="0"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="medicalAllowance" className="text-sm font-medium">Medical Allowance</Label>
                    <Input
                      id="medicalAllowance"
                      type="number"
                      value={formData.medicalAllowance}
                      onChange={(e) => handleInputChange('medicalAllowance', e.target.value)}
                      placeholder="0"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="otherAllowance" className="text-sm font-medium">Other Allowance</Label>
                    <Input
                      id="otherAllowance"
                      type="number"
                      value={formData.otherAllowance}
                      onChange={(e) => handleInputChange('otherAllowance', e.target.value)}
                      placeholder="0"
                      className="h-11 sm:h-10 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="benefits" className="text-sm font-medium">Benefits (comma-separated)</Label>
                  <Textarea
                    id="benefits"
                    value={formData.benefits}
                    onChange={(e) => handleInputChange('benefits', e.target.value)}
                    placeholder="Health Insurance, Dental Coverage, Life Insurance"
                    rows={3}
                    className="mt-1 min-h-[80px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
            className="h-11 sm:h-10 w-full sm:w-auto touch-manipulation"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="h-11 sm:h-10 w-full sm:w-auto touch-manipulation"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'create' ? 'Create Employee' : 'Update Employee'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}