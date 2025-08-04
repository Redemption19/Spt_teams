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
import { Search, MapPin, Building, DollarSign, Calendar, ArrowRight, ExternalLink, Upload, X, FileText } from 'lucide-react';
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
        // This would need to be implemented in the service
        const activeJobs = await RecruitmentService.getPublicJobPostings();
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
        jobPostingId: selectedJob!.id,
        name: applicationForm.name,
        email: applicationForm.email,
        phone: applicationForm.phone,
        experience: applicationForm.experience,
        education: applicationForm.education,
        location: applicationForm.location,
        status: 'applied',
        appliedDate: new Date(),
        notes: applicationForm.coverLetter,
        tags: [],
        createdBy: 'public-application'
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
    <div className="container mx-auto space-y-6 px-10 py-8">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Join Our Team</h1>
        <p className="text-xl text-muted-foreground">
          Discover exciting opportunities and be part of our growing team.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle 
                className="text-lg cursor-pointer hover:text-primary transition-colors"
                onClick={() => router.push(`/careers/${job.id}`)}
              >
                {job.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="w-4 h-4" />
                {job.department}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {job.location}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Posted {format(job.postedDate, 'MMM dd, yyyy')}</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-3">
                {job.description}
              </p>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/careers/${job.id}`)}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                <Button 
                  onClick={() => handleApply(job)}
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Please fill out the application form below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={applicationForm.name}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={applicationForm.email}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={applicationForm.phone}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={applicationForm.location}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (years)</Label>
                <Input
                  id="experience"
                  type="number"
                  value={applicationForm.experience}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Input
                  id="education"
                  value={applicationForm.education}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, education: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resume">Resume/CV *</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
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
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
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
                      <FileText className="w-4 h-4 text-primary" />
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
              <Label htmlFor="coverLetter">Cover Letter</Label>
              <Textarea
                id="coverLetter"
                value={applicationForm.coverLetter}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitApplication}>
              Submit Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 