'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Users,
  Plus,
  Search,
  Filter,
  Calendar,
  FileText,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  MapPin,
  DollarSign,
  Star,
  UserPlus,
  Send,
  Phone,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { format } from 'date-fns';
import Link from 'next/link';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryRange: { min: number; max: number };
  description: string;
  requirements: string[];
  status: 'active' | 'paused' | 'closed';
  postedDate: string;
  applications: number;
  views: number;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience: number;
  education: string;
  location: string;
  resume: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  appliedDate: string;
  jobId: string;
  jobTitle: string;
  score: number;
  notes: string;
}

interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  type: 'phone' | 'video' | 'in-person';
  date: string;
  time: string;
  interviewer: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  feedback?: string;
  rating?: number;
}

export default function RecruitmentPage() {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  
  const [loading, setLoading] = useState(true);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('jobs');
  
  // New job posting form
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [newJobForm, setNewJobForm] = useState({
    title: '',
    department: '',
    location: '',
    type: 'full-time' as const,
    salaryMin: '',
    salaryMax: '',
    description: '',
    requirements: ''
  });

  const loadRecruitmentData = useCallback(async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls
      const mockJobs: JobPosting[] = [
        {
          id: '1',
          title: 'Senior Software Engineer',
          department: 'Engineering',
          location: 'San Francisco, CA',
          type: 'full-time',
          salaryRange: { min: 120000, max: 150000 },
          description: 'We are looking for an experienced software engineer to join our team...',
          requirements: ['5+ years experience', 'React expertise', 'Node.js knowledge'],
          status: 'active',
          postedDate: '2024-01-01',
          applications: 45,
          views: 320
        },
        {
          id: '2',
          title: 'Marketing Manager',
          department: 'Marketing',
          location: 'New York, NY',
          type: 'full-time',
          salaryRange: { min: 80000, max: 100000 },
          description: 'Lead our marketing initiatives and grow our brand presence...',
          requirements: ['3+ years marketing experience', 'Digital marketing skills', 'Team leadership'],
          status: 'active',
          postedDate: '2024-01-05',
          applications: 28,
          views: 180
        },
        {
          id: '3',
          title: 'UX Designer',
          department: 'Design',
          location: 'Remote',
          type: 'contract',
          salaryRange: { min: 70000, max: 90000 },
          description: 'Create intuitive and beautiful user experiences for our products...',
          requirements: ['UX/UI design experience', 'Figma proficiency', 'User research skills'],
          status: 'paused',
          postedDate: '2023-12-20',
          applications: 62,
          views: 450
        }
      ];

      const mockCandidates: Candidate[] = [
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice.johnson@email.com',
          phone: '+1234567890',
          experience: 6,
          education: 'BS Computer Science',
          location: 'San Francisco, CA',
          resume: 'alice_johnson_resume.pdf',
          status: 'interview',
          appliedDate: '2024-01-10',
          jobId: '1',
          jobTitle: 'Senior Software Engineer',
          score: 95,
          notes: 'Strong technical background, excellent communication skills'
        },
        {
          id: '2',
          name: 'Bob Smith',
          email: 'bob.smith@email.com',
          phone: '+1234567891',
          experience: 4,
          education: 'MBA Marketing',
          location: 'New York, NY',
          resume: 'bob_smith_resume.pdf',
          status: 'screening',
          appliedDate: '2024-01-12',
          jobId: '2',
          jobTitle: 'Marketing Manager',
          score: 82,
          notes: 'Good marketing experience, needs to demonstrate leadership skills'
        },
        {
          id: '3',
          name: 'Carol Davis',
          email: 'carol.davis@email.com',
          phone: '+1234567892',
          experience: 5,
          education: 'BFA Design',
          location: 'Los Angeles, CA',
          resume: 'carol_davis_resume.pdf',
          status: 'offer',
          appliedDate: '2024-01-08',
          jobId: '3',
          jobTitle: 'UX Designer',
          score: 88,
          notes: 'Excellent portfolio, great cultural fit'
        }
      ];

      const mockInterviews: Interview[] = [
        {
          id: '1',
          candidateId: '1',
          candidateName: 'Alice Johnson',
          jobTitle: 'Senior Software Engineer',
          type: 'video',
          date: '2024-01-20',
          time: '14:00',
          interviewer: 'John Doe',
          status: 'scheduled'
        },
        {
          id: '2',
          candidateId: '2',
          candidateName: 'Bob Smith',
          jobTitle: 'Marketing Manager',
          type: 'phone',
          date: '2024-01-18',
          time: '10:00',
          interviewer: 'Sarah Wilson',
          status: 'completed',
          feedback: 'Good candidate, strong marketing background',
          rating: 4
        }
      ];
      
      setJobPostings(mockJobs);
      setCandidates(mockCandidates);
      setInterviews(mockInterviews);
    } catch (error) {
      console.error('Error loading recruitment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recruitment data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRecruitmentData();
  }, [loadRecruitmentData]);

  const handleCreateJob = async () => {
    try {
      if (!newJobForm.title || !newJobForm.department || !newJobForm.description) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields.',
          variant: 'destructive'
        });
        return;
      }

      const newJob: JobPosting = {
        id: Date.now().toString(),
        title: newJobForm.title,
        department: newJobForm.department,
        location: newJobForm.location,
        type: newJobForm.type,
        salaryRange: { 
          min: parseInt(newJobForm.salaryMin) || 0, 
          max: parseInt(newJobForm.salaryMax) || 0 
        },
        description: newJobForm.description,
        requirements: newJobForm.requirements.split('\n').filter(req => req.trim()),
        status: 'active',
        postedDate: format(new Date(), 'yyyy-MM-dd'),
        applications: 0,
        views: 0
      };

      // TODO: Submit to API
      
      setJobPostings(prev => [newJob, ...prev]);
      setShowNewJobDialog(false);
      setNewJobForm({
        title: '',
        department: '',
        location: '',
        type: 'full-time',
        salaryMin: '',
        salaryMax: '',
        description: '',
        requirements: ''
      });
      
      toast({
        title: 'Job Posted',
        description: 'The job posting has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create job posting. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateCandidateStatus = async (candidateId: string, newStatus: Candidate['status']) => {
    try {
      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === candidateId 
            ? { ...candidate, status: newStatus }
            : candidate
        )
      );
      
      toast({
        title: 'Status Updated',
        description: 'Candidate status has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update candidate status. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getJobStatusBadge = (status: JobPosting['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'paused':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Paused</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Closed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCandidateStatusBadge = (status: Candidate['status']) => {
    const statusConfig = {
      'applied': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FileText },
      'screening': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Search },
      'interview': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: MessageSquare },
      'offer': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Star },
      'hired': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      'rejected': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getInterviewStatusBadge = (status: Interview['status']) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200"><Calendar className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredJobs = jobPostings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="card-enhanced">
              <CardHeader>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment & Onboarding</h1>
          <p className="text-muted-foreground">
            Manage job postings, track applications, and handle the recruitment process
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Post Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Job Posting</DialogTitle>
                <DialogDescription>
                  Create a new job posting to attract candidates.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={newJobForm.title}
                      onChange={(e) => setNewJobForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input
                      id="department"
                      value={newJobForm.department}
                      onChange={(e) => setNewJobForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g. Engineering"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newJobForm.location}
                      onChange={(e) => setNewJobForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Employment Type</Label>
                    <Select value={newJobForm.type} onValueChange={(value: any) => setNewJobForm(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="salaryMin">Salary Min</Label>
                    <Input
                      id="salaryMin"
                      type="number"
                      value={newJobForm.salaryMin}
                      onChange={(e) => setNewJobForm(prev => ({ ...prev, salaryMin: e.target.value }))}
                      placeholder="60000"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="salaryMax">Salary Max</Label>
                    <Input
                      id="salaryMax"
                      type="number"
                      value={newJobForm.salaryMax}
                      onChange={(e) => setNewJobForm(prev => ({ ...prev, salaryMax: e.target.value }))}
                      placeholder="80000"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    value={newJobForm.description}
                    onChange={(e) => setNewJobForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the role, responsibilities, and what you're looking for..."
                    rows={4}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="requirements">Requirements (one per line)</Label>
                  <Textarea
                    id="requirements"
                    value={newJobForm.requirements}
                    onChange={(e) => setNewJobForm(prev => ({ ...prev, requirements: e.target.value }))}
                    placeholder="5+ years experience&#10;Bachelor's degree&#10;React expertise"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowNewJobDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateJob}>
                  Post Job
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {jobPostings.filter(job => job.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {jobPostings.reduce((sum, job) => sum + job.applications, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <Search className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {candidates.filter(c => ['screening', 'interview'].includes(c.status)).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offers Sent</CardTitle>
            <Star className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {candidates.filter(c => c.status === 'offer').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hired</CardTitle>
            <UserPlus className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {candidates.filter(c => c.status === 'hired').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="pipeline">Hiring Pipeline</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          {/* Filters */}
          <Card className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search job postings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Job Postings List */}
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="card-enhanced">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        {getJobStatusBadge(job.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatAmount(job.salaryRange.min)} - {formatAmount(job.salaryRange.max)}
                        </span>
                        <span className="capitalize">{job.type.replace('-', ' ')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                    
                    <div className="text-right ml-6">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{job.applications}</p>
                          <p className="text-xs text-muted-foreground">Applications</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{job.views}</p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="candidates" className="space-y-4">
          {/* Filters */}
          <Card className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search candidates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Candidates List */}
          <div className="space-y-4">
            {filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className="card-enhanced">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{candidate.name}</h3>
                        {getCandidateStatusBadge(candidate.status)}
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">{candidate.score}/100</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {candidate.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {candidate.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {candidate.location}
                        </span>
                        <span>{candidate.experience} years exp.</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm"><strong>Applied for:</strong> {candidate.jobTitle}</p>
                        <p className="text-sm text-muted-foreground">{candidate.notes}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-1" />
                        Resume
                      </Button>
                      <Select value={candidate.status} onValueChange={(value: Candidate['status']) => handleUpdateCandidateStatus(candidate.id, value)}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="screening">Screening</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Scheduled Interviews</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Interview
            </Button>
          </div>

          <div className="space-y-4">
            {interviews.map((interview) => (
              <Card key={interview.id} className="card-enhanced">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{interview.candidateName}</h3>
                        {getInterviewStatusBadge(interview.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-2">
                        <span><strong>Position:</strong> {interview.jobTitle}</span>
                        <span><strong>Type:</strong> {interview.type}</span>
                        <span><strong>Date:</strong> {format(new Date(interview.date), 'MMM dd, yyyy')}</span>
                        <span><strong>Time:</strong> {interview.time}</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm"><strong>Interviewer:</strong> {interview.interviewer}</p>
                        {interview.feedback && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <strong>Feedback:</strong> {interview.feedback}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {interview.rating && (
                        <div className="text-right mr-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium">{interview.rating}/5</span>
                          </div>
                        </div>
                      )}
                      <Button variant="outline" size="sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        Reschedule
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Feedback
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Hiring Pipeline</CardTitle>
              <CardDescription>Visual overview of candidates in different stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Hiring Pipeline Coming Soon</h3>
                <p className="text-muted-foreground">
                  Interactive pipeline view to track candidates through different hiring stages.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Onboarding Process</CardTitle>
              <CardDescription>Manage new hire documentation and checklists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Onboarding System Coming Soon</h3>
                <p className="text-muted-foreground">
                  Streamlined onboarding process with checklists and document management.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}