'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  Save,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { JobPosting, RecruitmentService } from '@/lib/recruitment-service';

export default function EditJobPostingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: 'full-time' as JobPosting['type'],
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    status: 'active' as JobPosting['status']
  });

  const [requirements, setRequirements] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);

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
        setFormData({
          title: job.title,
          department: job.department,
          location: job.location,
          type: job.type,
          salaryMin: job.salaryRange.min.toString(),
          salaryMax: job.salaryRange.max.toString(),
          currency: job.salaryRange.currency,
          description: job.description,
          requirements: job.requirements.join('\n'),
          responsibilities: job.responsibilities.join('\n'),
          benefits: job.benefits.join('\n'),
          status: job.status
        });
        
        setRequirements(job.requirements);
        setResponsibilities(job.responsibilities);
        setBenefits(job.benefits);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldChange = (field: 'requirements' | 'responsibilities' | 'benefits', value: string) => {
    const items = value.split('\n').filter(item => item.trim());
    setFormData(prev => ({ ...prev, [field]: value }));
    
    switch (field) {
      case 'requirements':
        setRequirements(items);
        break;
      case 'responsibilities':
        setResponsibilities(items);
        break;
      case 'benefits':
        setBenefits(items);
        break;
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.department || !formData.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Title, Department, and Description).',
        variant: 'destructive'
      });
      return;
    }

    if (!currentWorkspace?.id || !jobPosting) {
      toast({
        title: 'Error',
        description: 'No workspace selected or job posting not found.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        title: formData.title,
        department: formData.department,
        location: formData.location,
        type: formData.type,
        salaryRange: { 
          min: parseInt(formData.salaryMin) || 0, 
          max: parseInt(formData.salaryMax) || 0,
          currency: formData.currency
        },
        description: formData.description,
        requirements: requirements,
        responsibilities: responsibilities,
        benefits: benefits,
        status: formData.status
      };

      await RecruitmentService.updateJobPosting(jobId, updateData);
      
      toast({
        title: 'Job Updated Successfully',
        description: `The job posting has been updated and is now ${formData.status === 'active' ? 'live' : 'saved as draft'}.`,
      });
      
      router.push('/dashboard/hr/recruitment');
    } catch (error) {
      console.error('Error updating job posting:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update job posting. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
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
    } finally {
      setSaving(false);
    }
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
        <div className="space-y-6">
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
                onClick={() => router.push(`/dashboard/hr/recruitment/jobs/${jobId}/view`)}
                className="hover:bg-muted/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Edit Job Posting
                </h1>
                <p className="text-sm text-muted-foreground">
                  Update the details of your job posting
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleDelete}
                disabled={saving}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={saving}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : `Save Changes ${formData.status === 'active' ? '(Public)' : '(Draft)'}`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 space-y-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Essential details about the position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Job Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium">
                    Department *
                  </Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="e.g. Engineering"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Location
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="h-11 pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    Employment Type
                  </Label>
                  <Select value={formData.type} onValueChange={(value: any) => handleInputChange('type', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Job Status
                  </Label>
                  <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Draft (Not Public)
                        </div>
                      </SelectItem>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Active (Public)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary Information */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Salary Information
              </CardTitle>
              <CardDescription>
                Compensation details for the position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="salaryMin" className="text-sm font-medium">
                    Minimum Salary
                  </Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                    placeholder="50000"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryMax" className="text-sm font-medium">
                    Maximum Salary
                  </Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                    placeholder="80000"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-medium">
                    Currency
                  </Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <CardDescription>
                Detailed description of the role and responsibilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Job Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide a comprehensive description of the role, including key responsibilities, required skills, and what makes this position exciting..."
                  rows={6}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Requirements
              </CardTitle>
              <CardDescription>
                Skills, experience, and qualifications required for the position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-sm font-medium">
                  Requirements
                </Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => handleArrayFieldChange('requirements', e.target.value)}
                  placeholder="Enter each requirement on a new line:&#10;• 3+ years of experience in software development&#10;• Proficiency in JavaScript and React&#10;• Strong problem-solving skills&#10;• Bachelor's degree in Computer Science or related field"
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Enter each requirement on a separate line. They will be displayed as bullet points.
                </p>
              </div>
              
              {requirements.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview:</Label>
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <ul className="space-y-1">
                      {requirements.map((req, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Responsibilities */}
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
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="responsibilities" className="text-sm font-medium">
                  Responsibilities
                </Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => handleArrayFieldChange('responsibilities', e.target.value)}
                  placeholder="Enter each responsibility on a new line:&#10;• Develop and maintain web applications&#10;• Collaborate with cross-functional teams&#10;• Write clean, maintainable code&#10;• Participate in code reviews"
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Enter each responsibility on a separate line. They will be displayed as bullet points.
                </p>
              </div>
              
              {responsibilities.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview:</Label>
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <ul className="space-y-1">
                      {responsibilities.map((resp, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Benefits & Perks */}
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
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="benefits" className="text-sm font-medium">
                  Benefits & Perks
                </Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => handleArrayFieldChange('benefits', e.target.value)}
                  placeholder="Enter each benefit on a new line:&#10;• Competitive salary and equity package&#10;• Flexible work hours and remote work options&#10;• Health, dental, and vision insurance&#10;• Professional development opportunities"
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Enter each benefit on a separate line. They will be displayed as bullet points.
                </p>
              </div>
              
              {benefits.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview:</Label>
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <ul className="space-y-1">
                      {benefits.map((benefit, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/hr/recruitment/jobs/${jobId}/view`)}
            className="hover:bg-muted/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleDelete}
              disabled={saving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Job
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={saving}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : `Save Changes ${formData.status === 'active' ? '(Public)' : '(Draft)'}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}