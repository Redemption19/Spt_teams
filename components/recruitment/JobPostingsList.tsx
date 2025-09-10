import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Briefcase,
  MapPin,
  Wallet,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  FileText
} from 'lucide-react';
import { JobPosting, RecruitmentService } from '@/lib/recruitment-service';
import { useCurrency } from '@/hooks/use-currency';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface JobPostingsListProps {
  jobPostings: JobPosting[];
  loading?: boolean;
  onDelete?: (jobId: string) => void;
}

export default function JobPostingsList({ 
  jobPostings, 
  loading = false, 
  onDelete
}: JobPostingsListProps) {
  const router = useRouter();
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobPosting | null>(null);

  const getStatusBadge = (status: JobPosting['status']) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: FileText, label: 'Draft' },
      'active': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Active' },
      'published': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Published' },
      'paused': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Paused' },
      'closed': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Closed' },
      'expired': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock, label: 'Expired' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: JobPosting['type']) => {
    const typeLabels = {
      'full-time': 'Full-time',
      'part-time': 'Part-time',
      'contract': 'Contract',
      'internship': 'Internship',
      'intern': 'Intern',
      'remote': 'Remote',
      'hybrid': 'Hybrid'
    };
    
    return (
      <Badge variant="secondary" className="text-xs">
        {typeLabels[type] || type}
      </Badge>
    );
  };

  const filteredJobs = jobPostings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || job.department === departmentFilter;
    const matchesType = typeFilter === 'all' || job.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesType;
  });

  const handleView = (job: JobPosting) => {
    router.push(`/dashboard/hr/recruitment/jobs/${job.id}/view`);
  };

  const handleEdit = (job: JobPosting) => {
    router.push(`/dashboard/hr/recruitment/jobs/${job.id}/edit`);
  };

  const handleDelete = (job: JobPosting) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (jobToDelete && onDelete) {
      try {
        await onDelete(jobToDelete.id);
        toast({
          title: 'Job Deleted',
          description: 'The job posting has been deleted successfully.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete job posting. Please try again.',
          variant: 'destructive'
        });
      }
    }
    setDeleteDialogOpen(false);
    setJobToDelete(null);
  };

  const departments = [...new Set(jobPostings.map(job => job.department))];
  const jobTypes = [...new Set(jobPostings.map(job => job.type))];

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="card-enhanced">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="h-5 sm:h-6 w-32 sm:w-48 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 sm:h-4 w-24 sm:w-32 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 sm:h-4 w-48 sm:w-64 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex gap-2 sm:ml-6">
                  <div className="h-8 sm:h-9 w-16 sm:w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 sm:h-9 w-16 sm:w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <Card className="card-enhanced">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                <Input
                  placeholder="Search job postings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 sm:h-11 text-xs sm:text-sm">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="h-10 sm:h-11 text-xs sm:text-sm">
                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-10 sm:h-11 text-xs sm:text-sm">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {jobTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Postings List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredJobs.length === 0 ? (
          <Card className="card-enhanced">
            <CardContent className="p-6 sm:p-12 text-center">
              <Briefcase className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No Job Postings Found</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first job posting.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="card-enhanced hover:card-hover-enhanced transition-all duration-200">
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-6">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-base sm:text-lg font-semibold truncate">{job.title}</h3>
                      <div className="flex gap-2 flex-wrap">
                        {getStatusBadge(job.status)}
                        {getTypeBadge(job.type)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{job.department}</span>
                      </span>
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </span>
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <Wallet className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{formatAmount(job.salaryRange.min)} - {formatAmount(job.salaryRange.max)}</span>
                      </span>
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">Posted {job.postedDate ? format(job.postedDate, 'MMM dd, yyyy') : format(job.createdAt, 'MMM dd, yyyy')}</span>
                      </span>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                      {job.description}
                    </p>
                    
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        <span className="font-medium text-blue-600">{job.applications?.length || 0}</span>
                        <span className="text-muted-foreground hidden sm:inline">applications</span>
                        <span className="text-muted-foreground sm:hidden">apps</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                        <span className="font-medium text-green-600">{job.views || 0}</span>
                        <span className="text-muted-foreground">views</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 lg:flex-col lg:gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(job)} className="flex-1 lg:flex-none h-9 sm:h-10 text-xs sm:text-sm">
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(job)} className="flex-1 lg:flex-none h-9 sm:h-10 text-xs sm:text-sm">
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    {onDelete && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(job)}
                        className="flex-1 lg:flex-none h-9 sm:h-10 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Delete Job Posting</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete &quot;{jobToDelete?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="h-10 sm:h-11 text-sm">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="h-10 sm:h-11 text-sm">
              Delete Job
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}