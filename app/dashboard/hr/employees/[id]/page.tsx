'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Edit, 
  Trash2, 
  FileText, 
  User, 
  Briefcase, 
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  Building,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Upload
} from 'lucide-react';
import { Employee, EmployeeDocument, EmployeeService } from '@/lib/employee-service';
import { EmployeeDetailSkeleton } from '@/components/hr/employees/EmployeeLoadingSkeleton';
import { EmployeeDocumentUploadDialog } from '@/components/hr/employees/EmployeeDocumentUploadDialog';
import { EmployeeDocumentDeleteDialog } from '@/components/hr/employees/EmployeeDocumentDeleteDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { format } from 'date-fns';
import Link from 'next/link';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<EmployeeDocument | null>(null);

  const loadEmployee = useCallback(async () => {
    try {
      setLoading(true);
      const employeeData = await EmployeeService.getEmployee(params.id as string);
      setEmployee(employeeData);
    } catch (error) {
      console.error('Error loading employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee details. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  useEffect(() => {
    if (params.id) {
      loadEmployee();
    }
  }, [params.id, loadEmployee]);

  const getStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'on-leave':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            On Leave
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Suspended
          </Badge>
        );
      case 'resigned':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            <XCircle className="w-3 h-3 mr-1" />
            Resigned
          </Badge>
        );
      case 'terminated':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Terminated
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return <EmployeeDetailSkeleton />;
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Employee Not Found</h2>
          <p className="text-muted-foreground mb-4">The employee you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild>
            <Link href="/dashboard/hr/employees">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Employees
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const fullName = `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`;
  const tenure = Math.floor(
    (new Date().getTime() - new Date(employee.employmentDetails.hireDate).getTime()) 
    / (1000 * 60 * 60 * 24 * 365)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/hr/employees">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`} alt={fullName} />
              <AvatarFallback className="text-lg">
                {employee.personalInfo.firstName[0]}{employee.personalInfo.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{fullName}</h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(employee.status)}
                <Badge variant="outline" className="text-xs">
                  {employee.employeeId}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/hr/employees/edit/${employee.id}`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Role</span>
            </div>
            <p className="font-semibold">{employee.employmentDetails.role}</p>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Department</span>
            </div>
            <p className="font-semibold">{employee.employmentDetails.department}</p>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tenure</span>
            </div>
            <p className="font-semibold">{tenure} years</p>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Salary</span>
            </div>
            <p className="font-semibold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: employee.compensation.currency
              }).format(employee.compensation.baseSalary)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Information */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="font-medium">{employee.personalInfo.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="font-medium">{employee.personalInfo.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <span className="font-medium text-right">
                    {employee.personalInfo.address.street}, {employee.personalInfo.address.city}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Employment Summary */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Employment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hire Date</span>
                  <span className="font-medium">
                    {format(new Date(employee.employmentDetails.hireDate), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Employment Type</span>
                  <span className="font-medium capitalize">
                    {employee.employmentDetails.employmentType.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Work Location</span>
                  <span className="font-medium capitalize">{employee.employmentDetails.workLocation}</span>
                </div>
                {employee.employmentDetails.manager && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Manager</span>
                    <span className="font-medium">{employee.employmentDetails.manager}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personal" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Full Name</span>
                  <span className="font-medium">{fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date of Birth</span>
                  <span className="font-medium">
                    {format(new Date(employee.personalInfo.dateOfBirth), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gender</span>
                  <span className="font-medium capitalize">{employee.personalInfo.gender}</span>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Name</span>
                  <span className="font-medium">{employee.personalInfo.emergencyContact.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Relationship</span>
                  <span className="font-medium">{employee.personalInfo.emergencyContact.relationship}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="font-medium">{employee.personalInfo.emergencyContact.phone}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employment" className="space-y-6">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Employee ID</label>
                  <p className="font-medium">{employee.employeeId}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(employee.status)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Job Title</label>
                  <p className="font-medium">{employee.employmentDetails.role}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Department</label>
                  <p className="font-medium">{employee.employmentDetails.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Employment Type</label>
                  <p className="font-medium capitalize">
                    {employee.employmentDetails.employmentType.replace('-', ' ')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Work Location</label>
                  <p className="font-medium capitalize">{employee.employmentDetails.workLocation}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Hire Date</label>
                  <p className="font-medium">
                    {format(new Date(employee.employmentDetails.hireDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Tenure</label>
                  <p className="font-medium">{tenure} years</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compensation" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Base Salary */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Base Compensation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Base Salary</span>
                  <span className="font-medium text-lg">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: employee.compensation.currency
                    }).format(employee.compensation.baseSalary)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pay Frequency</span>
                  <span className="font-medium capitalize">{employee.compensation.payFrequency}</span>
                </div>
              </CardContent>
            </Card>

            {/* Allowances */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Allowances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Housing</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: employee.compensation.currency
                    }).format(employee.compensation.allowances.housing)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Transport</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: employee.compensation.currency
                    }).format(employee.compensation.allowances.transport)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Medical</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: employee.compensation.currency
                    }).format(employee.compensation.allowances.medical)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits */}
          {employee.compensation.benefits.length > 0 && (
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {employee.compensation.benefits.map((benefit, index) => (
                    <Badge key={index} variant="outline">{benefit}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card className="card-enhanced">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Documents</CardTitle>
                <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {employee.documents.length > 0 ? (
                <div className="space-y-3">
                  {employee.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {format(doc.uploadDate, 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={doc.status === 'uploaded' ? 'default' : 'secondary'}>
                          {doc.status}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setDocumentToDelete(doc);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No documents uploaded</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload employment documents like contracts, certificates, etc.
                  </p>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload First Document
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Upload Dialog */}
      {employee && (
        <EmployeeDocumentUploadDialog
          employeeId={employee.id}
          onUpload={loadEmployee}
          isOpen={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
        />
      )}

      {/* Document Delete Dialog */}
      {employee && documentToDelete && deleteDialogOpen && (
        <EmployeeDocumentDeleteDialog
          document={documentToDelete}
          employeeId={employee.id}
          employeeName={`${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`}
          onClose={() => {
            setDeleteDialogOpen(false);
            setDocumentToDelete(null);
          }}
          onSuccess={loadEmployee}
        />
      )}
    </div>
  );
}