import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen, workspaceId]);

  useEffect(() => {
    if (employee && mode === 'edit') {
      populateFormData();
    } else if (mode === 'create') {
      resetFormData();
    }
  }, [employee, mode]);

  const loadFormData = async () => {
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
  };

  const populateFormData = () => {
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
  };

  const resetFormData = () => {
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
  };

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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Fill in the employee information to add them to your workspace.'
              : 'Update the employee information below.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="employment" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Employment
            </TabsTrigger>
            <TabsTrigger value="compensation" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Compensation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
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
                    <div className="relative">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value: any) => handleInputChange('gender', value)}>
                      <SelectTrigger>
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

                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="NY"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="10001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
                <CardDescription>Contact information for emergencies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                    <Input
                      id="emergencyContactRelationship"
                      value={formData.emergencyContactRelationship}
                      onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                      placeholder="Spouse"
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
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
                <CardDescription>Job role, department, and employment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Job Title/Role *</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Select value={formData.department} onValueChange={handleDepartmentChange}>
                      <SelectTrigger>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manager">Manager</Label>
                    <Select value={formData.manager} onValueChange={handleManagerChange}>
                      <SelectTrigger>
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
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select value={formData.employmentType} onValueChange={(value: any) => handleInputChange('employmentType', value)}>
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="probationEndDate">Probation End Date</Label>
                      <Input
                        id="probationEndDate"
                        type="date"
                        value={formData.probationEndDate}
                        onChange={(e) => handleInputChange('probationEndDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contractEndDate">Contract End Date</Label>
                      <Input
                        id="contractEndDate"
                        type="date"
                        value={formData.contractEndDate}
                        onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compensation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Salary & Compensation</CardTitle>
                <CardDescription>Base salary, allowances, and benefits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="baseSalary">Base Salary *</Label>
                    <Input
                      id="baseSalary"
                      type="number"
                      value={formData.baseSalary}
                      onChange={(e) => handleInputChange('baseSalary', e.target.value)}
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      placeholder="USD"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payFrequency">Pay Frequency</Label>
                    <Select value={formData.payFrequency} onValueChange={(value: any) => handleInputChange('payFrequency', value)}>
                      <SelectTrigger>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="housingAllowance">Housing Allowance</Label>
                    <Input
                      id="housingAllowance"
                      type="number"
                      value={formData.housingAllowance}
                      onChange={(e) => handleInputChange('housingAllowance', e.target.value)}
                      placeholder="0"
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
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="medicalAllowance">Medical Allowance</Label>
                    <Input
                      id="medicalAllowance"
                      type="number"
                      value={formData.medicalAllowance}
                      onChange={(e) => handleInputChange('medicalAllowance', e.target.value)}
                      placeholder="0"
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
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="benefits">Benefits (comma-separated)</Label>
                  <Textarea
                    id="benefits"
                    value={formData.benefits}
                    onChange={(e) => handleInputChange('benefits', e.target.value)}
                    placeholder="Health Insurance, Dental Coverage, Life Insurance"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'create' ? 'Create Employee' : 'Update Employee'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 