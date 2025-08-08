'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, MapPin, Building, Coins, Calendar, ArrowRight, ExternalLink, Upload, X, FileText } from 'lucide-react';
import { JobPosting, RecruitmentService } from '@/lib/recruitment-service';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function CareersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
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

  const filteredJobs = jobPostings.filter(job => 
    job.status === 'active' && 
    (job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     job.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const loadActiveJobs = async () => {
      try {
        setLoading(true);
        console.log('Calling getPublicJobPostings...');
        const activeJobs = await RecruitmentService.getPublicJobPostings();
        console.log('Received job postings:', activeJobs);
        setJobPostings(activeJobs);
      } catch (error) {
        console.error('Error loading job postings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load job postings.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadActiveJobs();
  }, [toast]);

  const handleApply = (job: JobPosting) => {
    setSelectedJob(job);
    setShowApplicationDialog(true);
  };

  const handleSubmitApplication = async () => {
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

    try {
      await RecruitmentService.createCandidate({
        workspaceId: selectedJob!.workspaceId,
        jobId: selectedJob!.id,
        name: applicationForm.name,
        email: applicationForm.email,
        phone: applicationForm.phone,
        experience: applicationForm.experience,
        education: applicationForm.education,
        location: applicationForm.location,
        status: 'new',
        appliedDate: new Date(),
        notes: applicationForm.coverLetter,
        tags: [],
        createdBy: 'public-application',
        updatedBy: 'public-application'
      });

      // Increment job applications count
      await RecruitmentService.incrementJobApplications(selectedJob!.id);

      setShowApplicationDialog(false);
      setSelectedJob(null);
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
        title: 'Application Submitted',
        description: 'Your application has been submitted successfully!',
      });
    } catch (error) {
      toast({
        title: 'Application Failed',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Join Our Team
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-0">
          Discover exciting career opportunities and be part of our innovative team.
          We&apos;re always looking for talented individuals to help us grow.
        </p>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="relative max-w-full sm:max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle 
                className="text-lg sm:text-xl cursor-pointer hover:text-primary transition-colors line-clamp-2"
                onClick={() => router.push(`/careers/${job.id}`)}
              >
                {job.title}
              </CardTitle>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{job.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 pt-0 px-4 sm:px-6 overflow-hidden">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="font-medium">₵{job.salaryRange.min.toLocaleString()} - ₵{job.salaryRange.max.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>Posted {job.postedDate ? format(job.postedDate, 'MMM dd, yyyy') : format(job.createdAt, 'MMM dd, yyyy')}</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-3">
                {job.description}
              </p>
              
              <div className="flex flex-col xl:flex-row gap-2 xl:gap-3 min-w-0">
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/careers/${job.id}`)}
                  className="w-full xl:flex-1 h-10 text-xs sm:text-sm px-3 sm:px-4 min-w-0 flex-shrink-0"
                >
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">View Details</span>
                </Button>
                <Button 
                  onClick={() => handleApply(job)}
                  className="w-full xl:flex-1 h-10 text-xs sm:text-sm px-3 sm:px-4 min-w-0 flex-shrink-0 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  <span className="truncate">Apply Now</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Please fill out the application form below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={applicationForm.name}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, name: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={applicationForm.email}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, email: e.target.value }))}
                  className="h-11"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={applicationForm.phone}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={applicationForm.location}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, location: e.target.value }))}
                  className="h-11"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (years)</Label>
                <Input
                  id="experience"
                  type="number"
                  value={applicationForm.experience}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Input
                  id="education"
                  value={applicationForm.education}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, education: e.target.value }))}
                  className="h-11"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resume">Resume/CV *</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-6 text-center hover:border-primary/50 transition-colors">
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
                  <label htmlFor="resume" className="cursor-pointer block">
                    <Upload className="w-8 h-8 sm:w-6 sm:h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm sm:text-sm text-muted-foreground mb-1">
                      Click to upload your resume/CV
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, or DOCX files only (max 5MB)
                    </p>
                  </label>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{applicationForm.resume.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({(applicationForm.resume.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setApplicationForm(prev => ({ ...prev, resume: null }))}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter</Label>
              <Textarea
                id="coverLetter"
                value={applicationForm.coverLetter}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                rows={4}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowApplicationDialog(false)}
              className="w-full sm:w-auto h-11 sm:h-10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitApplication}
              className="w-full sm:w-auto h-11 sm:h-10"
            >
              Submit Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}