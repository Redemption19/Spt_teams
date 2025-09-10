'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Briefcase,
  MapPin,
  Wallet,
  FileText,
  Users,
  Clock,
  Globe,
  Building,
  GraduationCap,
  CheckCircle,
  Edit,
  Trash2,
  AlertTriangle,
  Calendar,
  Eye,
  ExternalLink,
  Copy,
  Share2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { JobPosting, RecruitmentService } from '@/lib/recruitment-service';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';

export default function ViewJobPostingPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);

  const employmentTypes = [
    { value: 'full-time', label: 'Full-time', icon: Users },
    { value: 'part-time', label: 'Part-time', icon: Clock },
    { value: 'contract', label: 'Contract', icon: FileText },
    { value: 'internship', label: 'Internship', icon: GraduationCap },
    { value: 'remote', label: 'Remote', icon: Globe },
    { value: 'hybrid', label: 'Hybrid', icon: Building }
  ];

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' },
    { value: 'GHS', label: 'GHS (₵)' }
  ];

  useEffect(() => {
    const loadJobPosting = async () => {
      if (!jobId) return;
      
      try {
        setLoading(true);
        const job = await RecruitmentService.getJobPosting(jobId);
        if (!job) {
          toast({
            title: 'Job Not Found',
            description: 'The job posting you are looking for does not exist.',
            variant: 'destructive'
          });
          router.push('/dashboard/hr/recruitment');
          return;
        }
        

        
        setJobPosting(job);
      } catch (error) {
        console.error('Error loading job posting:', error);
        toast({
          title: 'Error',
          description: 'Failed to load job posting. Please try again.',
          variant: 'destructive'
        });
        router.push('/dashboard/hr/recruitment');
      } finally {
        setLoading(false);
      }
    };

    loadJobPosting();
  }, [jobId, toast, router]);

  const getTypeLabel = (type: JobPosting['type']) => {
    const typeConfig = employmentTypes.find(t => t.value === type);
    return typeConfig?.label || type;
  };

  const getCurrencySymbol = (currency: string) => {
    const currencyConfig = currencies.find(c => c.value === currency);
    return currencyConfig?.label.split(' ')[1] || currency;
  };

  const getStatusBadge = (status: JobPosting['status']) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: FileText, label: 'Draft' },
      'published': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle, label: 'Published' },
      'active': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Active' },
      'paused': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Paused' },
      'closed': { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle, label: 'Closed' },
      'expired': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertTriangle, label: 'Expired' }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleEdit = () => {
    router.push(`/dashboard/hr/recruitment/jobs/${jobId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }

    try {
      await RecruitmentService.deleteJobPosting(jobId);
      toast({
        title: 'Job Deleted',
        description: 'The job posting has been deleted successfully.',
      });
      router.push('/dashboard/hr/recruitment');
    } catch (error) {
      console.error('Error deleting job posting:', error);
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete job posting. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/careers`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied',
      description: 'Careers page link copied to clipboard.',
    });
  };

  const handleViewPublic = () => {
    window.open('/careers', '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!jobPosting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
            <p className="text-muted-foreground mb-4">The job posting you are looking for does not exist.</p>
            <Button onClick={() => router.push('/dashboard/hr/recruitment')}>
              Back to Recruitment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/dashboard/hr/recruitment')}
                className="hover:bg-muted/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {jobPosting.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Job posting details and information
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleViewPublic}
                className="hover:bg-muted/50"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Public
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCopyLink}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button 
                variant="outline" 
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 space-y-6">
        {/* Job Overview */}
        <Card className="card-enhanced">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{jobPosting.title}</CardTitle>
                <CardDescription className="text-lg">
                  {jobPosting.department} • {jobPosting.location}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(jobPosting.status)}
                <Badge variant="secondary">
                  {getTypeLabel(jobPosting.type)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Wallet className="w-4 h-4 text-green-600" />
                <span className="font-medium">
                  {getCurrencySymbol(jobPosting.salaryRange.currency)}{jobPosting.salaryRange.min.toLocaleString()} - {getCurrencySymbol(jobPosting.salaryRange.currency)}{jobPosting.salaryRange.max.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Posted {jobPosting.postedDate ? format(jobPosting.postedDate, 'MMM dd, yyyy') : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{Array.isArray(jobPosting.applications) ? jobPosting.applications.length : jobPosting.applications || 0} applications</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>{jobPosting.views} views</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Job Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap">{jobPosting.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        {jobPosting.requirements.length > 0 && (
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Requirements
              </CardTitle>
              <CardDescription>
                Skills, experience, and qualifications required for this position
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {jobPosting.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Responsibilities */}
        {jobPosting.responsibilities.length > 0 && (
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Responsibilities
              </CardTitle>
              <CardDescription>
                Key duties and responsibilities for this role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {jobPosting.responsibilities.map((responsibility, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{responsibility}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Benefits & Perks */}
        {jobPosting.benefits.length > 0 && (
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Benefits & Perks
              </CardTitle>
              <CardDescription>
                What makes this position attractive to candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {jobPosting.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Job Details */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                  <p className="text-sm">{jobPosting.department}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                  <p className="text-sm">{jobPosting.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Employment Type</Label>
                  <p className="text-sm">{getTypeLabel(jobPosting.type)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(jobPosting.status)}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Salary Range</Label>
                  <p className="text-sm">
                    {getCurrencySymbol(jobPosting.salaryRange.currency)}{jobPosting.salaryRange.min.toLocaleString()} - {getCurrencySymbol(jobPosting.salaryRange.currency)}{jobPosting.salaryRange.max.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Posted Date</Label>
                  <p className="text-sm">{jobPosting.postedDate ? format(jobPosting.postedDate, 'MMMM dd, yyyy') : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Applications</Label>
                  <p className="text-sm">{Array.isArray(jobPosting.applications) ? jobPosting.applications.length : jobPosting.applications || 0} received</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Views</Label>
                  <p className="text-sm">{jobPosting.views} total views</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Public Visibility Notice */}
        {jobPosting.status === 'active' && (
          <Card className="card-enhanced border-green-200 bg-green-50/50 dark:bg-green-900/20 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-800 dark:text-green-200">Publicly Visible</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    This job posting is currently visible on the public careers page and accepting applications.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {jobPosting.status === 'draft' && (
          <Card className="card-enhanced border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Draft Status</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    This job posting is saved as a draft and is not visible to the public. Change the status to &quot;Active&quot; to make it public.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/hr/recruitment')}
            className="hover:bg-muted/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Recruitment
          </Button>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleViewPublic}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Public Page
            </Button>
            <Button 
              variant="outline" 
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Job
            </Button>
            <Button 
              onClick={() => router.push('/dashboard/hr/recruitment')}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Manage Applications
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}