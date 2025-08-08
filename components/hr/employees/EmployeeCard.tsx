import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Briefcase, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Employee, EmployeeDocument } from '@/lib/employee-service';
import Link from 'next/link';
import { format } from 'date-fns';

interface EmployeeCardProps {
  employee: Employee;
  canEdit?: boolean;
  canDelete?: boolean;
  canViewDetails?: boolean;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
}

export function EmployeeCard({ 
  employee, 
  canEdit = false, 
  canDelete = false, 
  canViewDetails = true,
  onEdit, 
  onDelete 
}: EmployeeCardProps) {
  
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

  const getDocumentStatusBadge = (status: EmployeeDocument['status']) => {
    switch (status) {
      case 'uploaded':
        return <Badge variant="default" className="text-xs bg-green-100 text-green-800">Uploaded</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="text-xs bg-red-100 text-red-800">Expired</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-xs bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const getEmploymentTypeBadge = (type: string) => {
    const typeMap = {
      'full-time': { color: 'bg-blue-100 text-blue-800', label: 'Full-time' },
      'part-time': { color: 'bg-purple-100 text-purple-800', label: 'Part-time' },
      'contract': { color: 'bg-orange-100 text-orange-800', label: 'Contract' },
      'intern': { color: 'bg-pink-100 text-pink-800', label: 'Intern' }
    };
    
    const config = typeMap[type as keyof typeof typeMap] || { color: 'bg-gray-100 text-gray-800', label: type };
    
    return (
      <Badge variant="outline" className={`text-xs ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const fullName = `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`;
  const uploadedDocs = employee.documents.filter(doc => doc.status === 'uploaded').length;
  const totalDocs = employee.documents.length;

  return (
    <Card className="card-enhanced hover:shadow-lg transition-shadow">
      <CardContent className="p-4 sm:p-6">
        {/* Mobile-first layout: stack vertically on small screens */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Main content section */}
          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`} alt={fullName} />
              <AvatarFallback>
                {employee.personalInfo.firstName[0]}{employee.personalInfo.lastName[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              {/* Name and badges */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h3 className="text-base sm:text-lg font-semibold truncate">{fullName}</h3>
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(employee.status)}
                  {getEmploymentTypeBadge(employee.employmentDetails.employmentType)}
                </div>
              </div>
              
              {/* Employee details - stack on mobile */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1 truncate">
                  <Briefcase className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{employee.employmentDetails.role} • {employee.employmentDetails.department}</span>
                </span>
                <span className="flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{employee.personalInfo.email}</span>
                </span>
                <span className="flex items-center gap-1 truncate">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Hired {format(new Date(employee.employmentDetails.hireDate), 'MMM dd, yyyy')}</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1 truncate">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{employee.personalInfo.phone}</span>
                </span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {employee.employmentDetails.workLocation === 'office' ? 'Office' : 
                     employee.employmentDetails.workLocation === 'remote' ? 'Remote' : 'Hybrid'}
                  </span>
                </span>
                {employee.employmentDetails.manager && (
                  <span className="truncate">Manager: {employee.employmentDetails.manager}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions section - stack on mobile */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
            <div className="text-left sm:text-right">
              <p className="text-sm font-medium">ID: {employee.employeeId}</p>
              <p className="text-xs text-muted-foreground">
                {uploadedDocs}/{totalDocs} docs uploaded
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 p-0 touch-target">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canViewDetails && (
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/hr/employees/${employee.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Profile
                    </Link>
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit?.(employee)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Employee
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <FileText className="w-4 h-4 mr-2" />
                  Manage Documents
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="w-4 h-4 mr-2" />
                  View Attendance
                </DropdownMenuItem>
                {canDelete && (
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => onDelete?.(employee)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Terminate Employee
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Quick Document Status */}
        {employee.documents.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Documents:</span>
              <div className="flex gap-2 flex-wrap">
                {employee.documents.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="flex items-center gap-1">
                    <span className="text-xs">{doc.name}</span>
                    {getDocumentStatusBadge(doc.status)}
                  </div>
                ))}
                {employee.documents.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{employee.documents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Quick Stats - responsive grid */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center sm:text-center">
            <div className="flex justify-between sm:block">
              <p className="text-sm font-medium text-green-600">Salary</p>
              <p className="text-xs text-muted-foreground">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: employee.compensation.currency
                }).format(employee.compensation.baseSalary)}
              </p>
            </div>
            <div className="flex justify-between sm:block">
              <p className="text-sm font-medium text-blue-600">Tenure</p>
              <p className="text-xs text-muted-foreground">
                {Math.floor(
                  (new Date().getTime() - new Date(employee.employmentDetails.hireDate).getTime()) 
                  / (1000 * 60 * 60 * 24 * 365)
                )} years
              </p>
            </div>
            <div className="flex justify-between sm:block">
              <p className="text-sm font-medium text-purple-600">Department</p>
              <p className="text-xs text-muted-foreground truncate">{employee.employmentDetails.department}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}