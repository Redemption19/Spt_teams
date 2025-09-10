'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Calendar,
  Eye,
  Send,
  ExternalLink,
  Mail,
  Phone,
  GraduationCap as EducationIcon,
  MapPin as LocationIcon,
  Upload,
  X
} from 'lucide-react';
import { JobPosting, RecruitmentService } from '@/lib/recruitment-service';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function JobDetailPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    name: '',
    email: '',
    phone: '',
    experience: 0,
    education: '',
    location: '',
    coverLetter: '',
    resume: null as File | null
  });
  const [submitting, setSubmitting] = useState(false);

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
          router.push('/careers');
          return;
        }

        // Check if job is active
        if (job.status !== 'active') {
          toast({
            title: 'Job Not Available',
            description: 'This job posting is not currently available.',
            variant: 'destructive'
          });
          router.push('/careers');
          return;
        }
        
        setJobPosting(job);
        
        // Increment view count
        await RecruitmentService.incrementJobViews(jobId);
      } catch (error) {
        console.error('Error loading job posting:', error);
        toast({
          title: 'Error',
          description: 'Failed to load job posting. Please try again.',
          variant: 'destructive'
        });
        router.push('/careers');
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

  const handleApply = () => {
    setShowApplicationDialog(true);
  };

  const handleSubmitApplication = async () => {
    if (!jobPosting) return;

    if (!applicationForm.name || !applicationForm.email || !applicationForm.phone || !applicationForm.resume) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Name, Email, Phone, Resume).',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (5MB limit)
    if (applicationForm.resume && applicationForm.resume.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Resume file must be less than 5MB.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      // For now, we'll store the resume info without actual file upload
      // In a production environment, you'd want to upload to Firebase Storage
      const candidateData = {
        workspaceId: jobPosting.workspaceId,
        jobPostingId: jobPosting.id,
        name: applicationForm.name,
        email: applicationForm.email,
        phone: applicationForm.phone,
        experience: applicationForm.experience,
        education: applicationForm.education,
        location: applicationForm.location,
        status: 'new' as const,
        appliedDate: new Date(),
        notes: applicationForm.coverLetter,
        resumeFileName: applicationForm.resume?.name || '',
        tags: [],
        createdBy: 'public-application',
        updatedBy: 'public-application'
      };

      await RecruitmentService.createCandidate(candidateData);

      // Increment job applications count
      await RecruitmentService.incrementJobApplications(jobPosting.id);

      setShowApplicationDialog(false);
      setApplicationForm({
        name: '',
        email: '',
        phone: '',
        experience: 0,
        education: '',
        location: '',
        coverLetter: '',
        resume: null
      });

      toast({
        title: 'Application Submitted Successfully!',
        description: 'Thank you for your application. We will review it and get back to you soon.',
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Application Failed',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
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
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
            <p className="text-muted-foreground mb-4">The job posting you are looking for does not exist.</p>
            <Button onClick={() => router.push('/careers')}>
              Back to Careers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/careers')}
                className="hover:bg-muted/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Careers
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {jobPosting.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {jobPosting.department} • {jobPosting.location}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleApply}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Send className="w-4 h-4 mr-2" />
              Apply Now
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Job Overview */}
        <Card className="card-enhanced">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{jobPosting.title}</CardTitle>
                <CardDescription className="text-lg">
                  {jobPosting.department} • {jobPosting.location}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
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
                <span>Posted {jobPosting.postedDate ? format(jobPosting.postedDate, 'MMM dd, yyyy') : format(jobPosting.createdAt, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{jobPosting.applications?.length || 0} applications</span>
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
          <CardContent className="space-y-6">
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
            <CardContent className="space-y-6">
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
            <CardContent className="space-y-6">
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
            <CardContent className="space-y-6">
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
          <CardContent className="space-y-6">
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
                  <p className="text-sm">{jobPosting.postedDate ? format(jobPosting.postedDate, 'MMMM dd, yyyy') : format(jobPosting.createdAt, 'MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Applications</Label>
                  <p className="text-sm">{jobPosting.applications?.length || 0} received</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="card-enhanced border-primary/20 bg-primary/5">
          <CardContent className="p-8 text-center space-y-6">
            <h3 className="text-2xl font-bold">Ready to Apply?</h3>
            <p className="text-muted-foreground">
              Join our team and take the next step in your career. We&apos;re excited to review your application!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleApply}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <Send className="w-4 h-4 mr-2" />
                Apply for This Position
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => router.push('/careers')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Other Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for {jobPosting.title}</DialogTitle>
            <DialogDescription>
              Please fill out the application form below. We&apos;ll review your application and get back to you soon.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={applicationForm.name}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={applicationForm.email}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  value={applicationForm.phone}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Current Location
                </Label>
                <Input
                  id="location"
                  value={applicationForm.location}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter your current location"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience" className="text-sm font-medium">
                  Years of Experience
                </Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={applicationForm.experience}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                  placeholder="Enter years of experience"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education" className="text-sm font-medium">
                  Education Level
                </Label>
                <Input
                  id="education"
                  value={applicationForm.education}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, education: e.target.value }))}
                  placeholder="e.g., Bachelor's Degree, Master's, etc."
                />
              </div>
            </div>

                         <div className="space-y-2">
               <Label htmlFor="resume" className="text-sm font-medium">
                 Resume/CV *
               </Label>
               <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                 <input
                   type="file"
                   id="resume"
                   accept=".pdf,.doc,.docx"
                   onChange={(e) => {
                     const file = e.target.files?.[0] || null;
                     setApplicationForm(prev => ({ ...prev, resume: file }));
                   }}
                   className="hidden"
                 />
                 {!applicationForm.resume ? (
                   <label htmlFor="resume" className="cursor-pointer">
                     <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                     <p className="text-sm text-muted-foreground mb-1">
                       Click to upload your resume/CV
                     </p>
                     <p className="text-xs text-muted-foreground">
                       PDF, DOC, or DOCX files only (max 5MB)
                     </p>
                   </label>
                 ) : (
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <FileText className="w-5 h-5 text-primary" />
                       <span className="text-sm font-medium">{applicationForm.resume.name}</span>
                       <span className="text-xs text-muted-foreground">
                         ({(applicationForm.resume.size / 1024 / 1024).toFixed(2)} MB)
                       </span>
                     </div>
                     <Button
                       type="button"
                       variant="ghost"
                       size="sm"
                       onClick={() => setApplicationForm(prev => ({ ...prev, resume: null }))}
                     >
                       <X className="w-4 h-4" />
                     </Button>
                   </div>
                 )}
               </div>
             </div>

             <div className="space-y-2">
               <Label htmlFor="coverLetter" className="text-sm font-medium">
                 Cover Letter
               </Label>
               <Textarea
                 id="coverLetter"
                 value={applicationForm.coverLetter}
                 onChange={(e) => setApplicationForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                 placeholder="Tell us why you're interested in this position and why you'd be a great fit..."
                 rows={6}
                 className="resize-none"
               />
             </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowApplicationDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitApplication}
                disabled={submitting}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}