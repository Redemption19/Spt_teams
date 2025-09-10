'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Plus,
  X,
  Briefcase,
  MapPin,
  Wallet,
  Users,
  FileText,
  CheckCircle,
  Clock,
  Calendar,
  Building,
  Globe,
  GraduationCap,
  Target,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { RecruitmentService } from '@/lib/recruitment-service';
import { useRouter } from 'next/navigation';

export default function CreateJobPostingPage() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: 'full-time' as const,
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    status: 'active' as const
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

    if (!currentWorkspace?.id) {
      toast({
        title: 'Error',
        description: 'No workspace selected.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const jobData = {
        workspaceId: currentWorkspace.id,
        title: formData.title,
        department: formData.department,
        location: formData.location,
        type: formData.type,
        level: 'mid' as const, // Default level
        salaryRange: { 
          min: parseInt(formData.salaryMin) || 0, 
          max: parseInt(formData.salaryMax) || 0,
          currency: formData.currency
        },
        description: formData.description,
        requirements: requirements,
        responsibilities: responsibilities,
        benefits: benefits,
        status: formData.status,
        createdBy: user?.uid || '',
        updatedBy: user?.uid || ''
      };

      await RecruitmentService.createJobPosting(jobData);
      
      toast({
        title: 'Job Posted Successfully',
        description: 'The job posting has been created and is now live.',
      });
      
      router.push('/dashboard/hr/recruitment');
    } catch (error) {
      console.error('Error creating job posting:', error);
      toast({
        title: 'Creation Failed',
        description: 'Failed to create job posting. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!currentWorkspace?.id) {
      toast({
        title: 'Error',
        description: 'No workspace selected.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const jobData = {
        workspaceId: currentWorkspace.id,
        title: formData.title || 'Untitled Job Posting',
        department: formData.department || 'General',
        location: formData.location,
        type: formData.type,
        level: 'mid' as const, // Default level
        salaryRange: { 
          min: parseInt(formData.salaryMin) || 0, 
          max: parseInt(formData.salaryMax) || 0,
          currency: formData.currency
        },
        description: formData.description || 'Job description will be added later.',
        requirements: requirements,
        responsibilities: responsibilities,
        benefits: benefits,
        status: 'draft' as const, // Always save as draft when using Save Draft button
        createdBy: user?.uid || '',
        updatedBy: user?.uid || ''
      };

      await RecruitmentService.createJobPosting(jobData);
      
      toast({
        title: 'Draft Saved',
        description: 'Your job posting has been saved as a draft.',
      });
      
      router.push('/dashboard/hr/recruitment');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

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
                  Create Job Posting
                </h1>
                <p className="text-sm text-muted-foreground">
                  Fill in the details below to create a new job posting
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={loading}
              >
                <Clock className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : `Post Job ${formData.status === 'active' ? '(Public)' : '(Draft)'}`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
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
                <Wallet className="w-5 h-5 text-green-600" />
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
                    placeholder="60000"
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
                <FileText className="w-5 h-5 text-blue-600" />
                Job Description *
              </CardTitle>
              <CardDescription>
                Detailed description of the role and what you&apos;re looking for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the role, responsibilities, and what you're looking for in a candidate..."
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
                <Target className="w-5 h-5 text-orange-600" />
                Requirements
              </CardTitle>
              <CardDescription>
                Skills, experience, and qualifications required for the position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-sm font-medium">
                  Requirements (one per line)
                </Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => handleArrayFieldChange('requirements', e.target.value)}
                  placeholder="5+ years of experience&#10;Bachelor's degree in Computer Science&#10;Proficiency in React and Node.js&#10;Experience with cloud platforms (AWS/Azure)&#10;Strong communication skills"
                  rows={5}
                  className="resize-none"
                />
              </div>
              {requirements.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview:</Label>
                  <div className="flex flex-wrap gap-2">
                    {requirements.map((req, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Responsibilities */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Responsibilities
              </CardTitle>
              <CardDescription>
                Key duties and responsibilities for this role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="responsibilities" className="text-sm font-medium">
                  Responsibilities (one per line)
                </Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => handleArrayFieldChange('responsibilities', e.target.value)}
                  placeholder="Lead development team and mentor junior developers&#10;Architect and implement scalable solutions&#10;Collaborate with cross-functional teams&#10;Participate in code reviews and technical discussions&#10;Contribute to technical documentation"
                  rows={5}
                  className="resize-none"
                />
              </div>
              {responsibilities.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview:</Label>
                  <div className="flex flex-wrap gap-2">
                    {responsibilities.map((resp, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {resp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Benefits & Perks
              </CardTitle>
              <CardDescription>
                What you offer to attract top talent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="benefits" className="text-sm font-medium">
                  Benefits (one per line)
                </Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => handleArrayFieldChange('benefits', e.target.value)}
                  placeholder="Comprehensive health insurance&#10;401k matching up to 6%&#10;Flexible PTO policy&#10;Remote work options&#10;Professional development budget&#10;Stock options"
                  rows={5}
                  className="resize-none"
                />
              </div>
              {benefits.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview:</Label>
                  <div className="flex flex-wrap gap-2">
                    {benefits.map((benefit, index) => (
                      <Badge key={index} variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                        {benefit}
                      </Badge>
                    ))}
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
            onClick={() => router.push('/dashboard/hr/recruitment')}
            className="hover:bg-muted/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Recruitment
          </Button>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={loading}
            >
              <Clock className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : 'Post Job'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}