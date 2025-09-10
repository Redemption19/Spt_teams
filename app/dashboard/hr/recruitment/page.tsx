'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Wallet,
  Star,
  UserPlus,
  Send,
  Phone,
  Mail,
  RefreshCw,
  Globe,
  ChevronDown,
  Building,
  TrendingUp,
  Target,
  Award,
  GraduationCap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { 
  RecruitmentService, 
  JobPosting, 
  Candidate, 
  Interview, 
  HiringPipeline, 
  RecruitmentStats 
} from '@/lib/recruitment-service';
import { WorkspaceService } from '@/lib/workspace-service';
import RecruitmentStatsComponent from '@/components/recruitment/RecruitmentStats';
import JobPostingsList from '@/components/recruitment/JobPostingsList';
import CandidatesList from '@/components/recruitment/CandidatesList';
import InterviewManagement from '@/components/recruitment/InterviewManagement';
import HiringPipelineManagement from '@/components/recruitment/HiringPipelineManagement';
import OnboardingManagement from '@/components/recruitment/OnboardingManagement';
import RecruitmentSkeleton from '@/components/recruitment/RecruitmentSkeleton';

export default function RecruitmentPage() {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [pipelines, setPipelines] = useState<HiringPipeline[]>([]);
  const [onboardingEmployees, setOnboardingEmployees] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Cross-workspace management
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [workspaceFilter, setWorkspaceFilter] = useState<'current' | 'all'>('current');
  const [shouldShowCrossWorkspace, setShouldShowCrossWorkspace] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const previousWorkspaceRef = useRef<string>('');

  // Check user role and permissions
  const isOwner = userProfile?.role === 'owner';
  const isAdmin = userProfile?.role === 'admin';
  const isMember = userProfile?.role === 'member';
  const canManageRecruitment = isOwner || isAdmin;

  const handleWorkspaceChange = (workspaceId: string) => {
    previousWorkspaceRef.current = selectedWorkspace;
    setSelectedWorkspace(workspaceId);
    if (shouldShowCrossWorkspace) {
      localStorage.setItem('recruitment-selected-workspace', workspaceId);
    }
  };

  // Cleanup localStorage when user is no longer an owner
  useEffect(() => {
    if (!shouldShowCrossWorkspace) {
      localStorage.removeItem('recruitment-selected-workspace');
    }
  }, [shouldShowCrossWorkspace]);

  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    try {
      setLoading(true);
      
      // Load saved workspace from localStorage first (for owners)
      const savedWorkspace = shouldShowCrossWorkspace ? localStorage.getItem('recruitment-selected-workspace') : null;
      if (savedWorkspace && !selectedWorkspace) {
        setSelectedWorkspace(savedWorkspace);
      }

      if (shouldShowCrossWorkspace) {
        // Owner - load cross-workspace statistics
        const workspaceData = await WorkspaceService.getUserAccessibleWorkspaces(user?.uid || '');
        const allWorkspacesData = [
          ...workspaceData.mainWorkspaces,
          ...Object.values(workspaceData.subWorkspaces).flat()
        ];
        setAllWorkspaces(allWorkspacesData);

        // Set default selected workspace if none is selected or if selected workspace doesn't exist
        if (allWorkspacesData.length > 0) {
          const currentSelectedWorkspace = selectedWorkspace || savedWorkspace;
          const workspaceExists = allWorkspacesData.some(w => w.id === currentSelectedWorkspace);
          
          if (!currentSelectedWorkspace || !workspaceExists) {
            const defaultWorkspace = allWorkspacesData[0];
            setSelectedWorkspace(defaultWorkspace.id);
            localStorage.setItem('recruitment-selected-workspace', defaultWorkspace.id);
          }
        }

        // Load data for selected workspace
        const workspaceId = selectedWorkspace || savedWorkspace || allWorkspacesData[0]?.id;
        console.log('🔍 [DEBUG] Loading data for workspace ID:', workspaceId);
        console.log('🔍 [DEBUG] Available workspaces:', allWorkspacesData.map(w => ({ id: w.id, name: w.name })));
        
        if (workspaceId) {
          try {
            console.log('🔍 [DEBUG] Starting parallel data fetch...');
            const [statsData, jobsData, candidatesData, jobApplicationsData, interviewsData, pipelinesData] = await Promise.all([
              RecruitmentService.getRecruitmentStats(workspaceId).catch(err => {
                console.error('❌ [ERROR] Failed to fetch recruitment stats:', err);
                return null;
              }),
              RecruitmentService.getWorkspaceJobPostings(workspaceId).catch(err => {
                console.error('❌ [ERROR] Failed to fetch job postings:', err);
                return [];
              }),
              RecruitmentService.getWorkspaceCandidates(workspaceId).catch(err => {
                console.error('❌ [ERROR] Failed to fetch candidates:', err);
                return [];
              }),
              RecruitmentService.getWorkspaceJobApplications(workspaceId).catch(err => {
                console.error('❌ [ERROR] Failed to fetch job applications:', err);
                return [];
              }),
              RecruitmentService.getWorkspaceInterviews(workspaceId).catch(err => {
                console.error('❌ [ERROR] Failed to fetch interviews:', err);
                return [];
              }),
              RecruitmentService.getWorkspaceHiringPipelines(workspaceId).catch(err => {
                console.error('❌ [ERROR] Failed to fetch hiring pipelines:', err);
                return [];
              })
            ]);
            
            console.log('📊 [DEBUG] Raw data fetched:');
            console.log('  - Stats Data:', statsData);
            console.log('  - Job Postings:', jobsData?.length || 0, 'items');
            console.log('  - Candidates:', candidatesData?.length || 0, 'items');
            console.log('  - Job Applications:', jobApplicationsData?.length || 0, 'items');
            console.log('  - Interviews:', interviewsData?.length || 0, 'items');
            console.log('  - Pipelines:', pipelinesData?.length || 0, 'items');

          // Use job applications as candidates if candidates collection is empty
          const finalCandidates = candidatesData.length > 0 ? candidatesData : jobApplicationsData.map(app => ({
          id: app.id,
          workspaceId: app.workspaceId,
          name: `${app.candidateInfo.firstName} ${app.candidateInfo.lastName}`,
          email: app.candidateInfo.email,
          phone: app.candidateInfo.phone || '',
          location: '',
            status: app.status as any,
            score: app.rating ? app.rating * 20 : undefined, // Convert 1-5 rating to 1-100 score
            experience: 0, // Default value
            education: '',
            appliedDate: app.createdAt,
            notes: app.notes?.join('; ') || '',
            tags: [],
            jobId: app.jobId,
            resume: app.candidateInfo.resume,
            coverLetter: app.candidateInfo.coverLetter,
            portfolio: app.candidateInfo.portfolio,
            linkedIn: app.candidateInfo.linkedIn,
            skills: [],
            expectedSalary: undefined,
            availabilityDate: undefined,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt,
            createdBy: '',
            updatedBy: ''
          }));

            console.log('✅ [DEBUG] Final candidates processed:', finalCandidates?.length || 0, 'items');
            console.log('📈 [DEBUG] Final stats object being set:', statsData);
            
            setStats(statsData);
            setJobPostings(jobsData);
            setCandidates(finalCandidates);
            setInterviews(interviewsData);
            setPipelines(pipelinesData);
          } catch (fetchError) {
            console.error('❌ [ERROR] Error in data fetching block:', fetchError);
          }
        }
      } else {
        // Member/Admin - load current workspace data
        console.log('🔍 [DEBUG] Loading data for current workspace (Member/Admin):', currentWorkspace.id);
        
        try {
          const [statsData, jobsData, candidatesData, jobApplicationsData, interviewsData, pipelinesData] = await Promise.all([
            RecruitmentService.getRecruitmentStats(currentWorkspace.id).catch(err => {
              console.error('❌ [ERROR] Failed to fetch recruitment stats (current workspace):', err);
              return null;
            }),
            RecruitmentService.getWorkspaceJobPostings(currentWorkspace.id).catch(err => {
              console.error('❌ [ERROR] Failed to fetch job postings (current workspace):', err);
              return [];
            }),
            RecruitmentService.getWorkspaceCandidates(currentWorkspace.id).catch(err => {
              console.error('❌ [ERROR] Failed to fetch candidates (current workspace):', err);
              return [];
            }),
            RecruitmentService.getWorkspaceJobApplications(currentWorkspace.id).catch(err => {
              console.error('❌ [ERROR] Failed to fetch job applications (current workspace):', err);
              return [];
            }),
            RecruitmentService.getWorkspaceInterviews(currentWorkspace.id).catch(err => {
              console.error('❌ [ERROR] Failed to fetch interviews (current workspace):', err);
              return [];
            }),
            RecruitmentService.getWorkspaceHiringPipelines(currentWorkspace.id).catch(err => {
              console.error('❌ [ERROR] Failed to fetch hiring pipelines (current workspace):', err);
              return [];
            })
          ]);
          
          console.log('📊 [DEBUG] Raw data fetched (current workspace):');
          console.log('  - Stats Data:', statsData);
          console.log('  - Job Postings:', jobsData?.length || 0, 'items');
          console.log('  - Candidates:', candidatesData?.length || 0, 'items');
          console.log('  - Job Applications:', jobApplicationsData?.length || 0, 'items');
          console.log('  - Interviews:', interviewsData?.length || 0, 'items');
          console.log('  - Pipelines:', pipelinesData?.length || 0, 'items');

        // Use job applications as candidates if candidates collection is empty
        const finalCandidates = candidatesData.length > 0 ? candidatesData : jobApplicationsData.map(app => ({
          id: app.id,
          workspaceId: app.workspaceId,
          name: `${app.candidateInfo.firstName} ${app.candidateInfo.lastName}`,
          email: app.candidateInfo.email,
          phone: app.candidateInfo.phone || '',
          location: '',
          status: app.status as any,
          score: app.rating ? app.rating * 20 : undefined, // Convert 1-5 rating to 1-100 score
          experience: 0, // Default value
          education: '',
          appliedDate: app.createdAt,
          notes: app.notes?.join('; ') || '',
          tags: [],
          jobId: app.jobId,
          resume: app.candidateInfo.resume,
          coverLetter: app.candidateInfo.coverLetter,
          portfolio: app.candidateInfo.portfolio,
          linkedIn: app.candidateInfo.linkedIn,
          skills: [],
          expectedSalary: undefined,
          availabilityDate: undefined,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          createdBy: '',
          updatedBy: ''
        }));

          console.log('✅ [DEBUG] Final candidates processed (current workspace):', finalCandidates?.length || 0, 'items');
          console.log('📈 [DEBUG] Final stats object being set (current workspace):', statsData);
          
          setStats(statsData);
          setJobPostings(jobsData);
          setCandidates(finalCandidates);
          setInterviews(interviewsData);
          setPipelines(pipelinesData);
        } catch (fetchError) {
          console.error('❌ [ERROR] Error in data fetching block (current workspace):', fetchError);
        }
      }

      setInitialLoadComplete(true);
      console.log('🎯 [DEBUG] Data loading completed successfully');
    } catch (error) {
      console.error('❌ [ERROR] Top-level error loading recruitment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recruitment data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, user?.uid, shouldShowCrossWorkspace, selectedWorkspace, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
      toast({
        title: 'Refreshed',
        description: 'Recruitment data has been refreshed.',
      });
    } catch (error) {
        toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh data. Please try again.',
          variant: 'destructive'
        });
    } finally {
      setRefreshing(false);
    }
  }, [loadData, toast]);





  const handleDeleteJob = async (jobId: string) => {
    try {
      await RecruitmentService.deleteJobPosting(jobId);
      await loadData();
      toast({
        title: 'Job Deleted',
        description: 'The job posting has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete job posting. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateCandidateStatus = async (candidateId: string, newStatus: Candidate['status']) => {
    try {
      await RecruitmentService.updateCandidate(candidateId, { status: newStatus });
      await loadData();
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

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm('Are you sure you want to delete this candidate? This action cannot be undone.')) {
      return;
    }

    try {
      await RecruitmentService.deleteCandidate(candidateId);
      toast({
        title: 'Candidate Deleted',
        description: 'The candidate has been deleted successfully.',
      });
      loadData();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete candidate. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleScheduleInterview = async (data: Partial<Interview>) => {
    if (!currentWorkspace?.id) {
      toast({
        title: 'Error',
        description: 'No workspace selected.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Combine date and time into a single Date object
      const interviewDate = new Date(data.date!);
      const [hours, minutes] = data.time!.split(':').map(Number);
      interviewDate.setHours(hours, minutes, 0, 0);

      const interviewId = await RecruitmentService.createInterview({
        workspaceId: currentWorkspace.id,
        candidateId: data.candidateId!,
        jobPostingId: data.jobPostingId!,
        title: `Interview with ${data.interviewer}`,
        type: data.type!,
        date: interviewDate,
        time: data.time!,
        duration: data.duration!,
        interviewer: data.interviewer!,
        location: data.location || '',
        meetingLink: data.meetingLink || '',
        status: 'scheduled',
        notes: '',
        feedback: '',
        rating: undefined,
        outcome: undefined,
        nextSteps: '',
        createdBy: user?.uid || 'unknown',
        updatedBy: user?.uid || 'unknown'
      });

      // Send interview invitation to candidate
      try {
        const candidate = await RecruitmentService.getCandidate(data.candidateId!);
        const jobPosting = await RecruitmentService.getJobPosting(data.jobPostingId!);
        
        if (candidate && jobPosting) {
          await RecruitmentService.sendInterviewInvitation(interviewId, {
            candidateEmail: candidate.email,
            candidateName: candidate.name,
            jobTitle: jobPosting.title,
            interviewDate: interviewDate,
            interviewTime: data.time!,
            interviewer: data.interviewer!
          });

          toast({
            title: 'Interview Scheduled',
            description: `Interview scheduled and invitation sent to ${candidate.name}`,
          });
        } else {
          toast({
            title: 'Interview Scheduled',
            description: 'Interview scheduled successfully',
          });
        }
      } catch (inviteError) {
        console.error('Error sending interview invitation:', inviteError);
        toast({
          title: 'Interview Scheduled',
          description: 'The interview has been scheduled successfully.',
        });
      }
      
      loadData();
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast({
        title: 'Scheduling Failed',
        description: 'Failed to schedule interview. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateInterview = async (interviewId: string, data: Partial<Interview>) => {
    try {
      // If both date and time are being updated, combine them
      let updateData = { ...data };
      if (data.date && data.time) {
        const interviewDate = new Date(data.date);
        const [hours, minutes] = data.time.split(':').map(Number);
        interviewDate.setHours(hours, minutes, 0, 0);
        updateData.date = interviewDate;
      }

      await RecruitmentService.updateInterview(interviewId, updateData);
      toast({
        title: 'Interview Updated',
        description: 'The interview has been updated successfully.',
      });
      loadData();
    } catch (error) {
      console.error('Error updating interview:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update interview. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    if (!confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      return;
    }

    try {
      await RecruitmentService.deleteInterview(interviewId);
      toast({
        title: 'Interview Deleted',
        description: 'The interview has been deleted successfully.',
      });
      loadData();
    } catch (error) {
      console.error('Error deleting interview:', error);
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete interview. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (loading && !initialLoadComplete) {
    return <RecruitmentSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
            Recruitment & Onboarding
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base mt-1 line-clamp-2">
            Manage job postings, track applications, and handle the recruitment process
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:gap-2 md:gap-3 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={refreshing} 
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="truncate">Refresh</span>
          </Button>
          {canManageRecruitment && (
            <Button 
              onClick={() => router.push('/dashboard/hr/recruitment/create')}
              className="w-full sm:w-auto h-9 sm:h-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-xs sm:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="truncate">Post Job</span>
            </Button>
          )}
        </div>
      </div>

      {/* Cross-workspace scope banner for owners */}
      {isOwner && shouldShowCrossWorkspace && allWorkspaces.length > 1 && (
        <div className="p-2 sm:p-3 md:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
          <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 leading-relaxed">
            <span className="inline-block mr-1">🌐</span>
            <strong className="font-semibold">Cross-Workspace Recruitment:</strong> 
            <span className="block sm:inline sm:ml-1">
              Displaying recruitment data across all {allWorkspaces.length} accessible workspaces. Job postings, candidates, and interviews from all workspaces are aggregated for centralized management.
            </span>
          </p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && <RecruitmentStatsComponent stats={stats} loading={loading} />}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto bg-muted p-0.5 sm:p-1 text-muted-foreground overflow-x-auto">
          <TabsTrigger 
            value="overview" 
            className="text-xs sm:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[40px] truncate data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <span className="truncate">Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="jobs" 
            className="text-xs sm:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[40px] truncate data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <span className="truncate sm:hidden">Jobs</span>
            <span className="hidden sm:inline truncate">Job Postings</span>
          </TabsTrigger>
          <TabsTrigger 
            value="candidates" 
            className="text-xs sm:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[40px] truncate data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <span className="truncate">Candidates</span>
          </TabsTrigger>
          <TabsTrigger 
            value="interviews" 
            className="text-xs sm:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[40px] truncate data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <span className="truncate">Interviews</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pipeline" 
            className="text-xs sm:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[40px] truncate data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <span className="truncate sm:hidden">Pipeline</span>
            <span className="hidden sm:inline truncate">Hiring Pipeline</span>
          </TabsTrigger>
          <TabsTrigger 
            value="onboarding" 
            className="text-xs sm:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[40px] truncate data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <span className="truncate">Onboarding</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3 sm:space-y-4">
          <Card className="card-enhanced">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-base sm:text-lg md:text-xl">Recruitment Overview</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Quick overview of your recruitment activities</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="text-center p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">
                    {jobPostings.filter(job => job.status === 'active').length}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground truncate">Active Job Postings</div>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1 sm:mb-2">
                    {candidates.length}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground truncate">Total Candidates</div>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 sm:col-span-2 lg:col-span-1">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">
                    {interviews.filter(i => i.status === 'scheduled').length}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground truncate">Scheduled Interviews</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-3 sm:space-y-4">
          <JobPostingsList
            jobPostings={jobPostings}
            loading={loading}
            onDelete={canManageRecruitment ? handleDeleteJob : undefined}
          />
        </TabsContent>

        <TabsContent value="candidates" className="space-y-3 sm:space-y-4">
          <CandidatesList
            candidates={candidates}
            interviews={interviews}
            loading={loading}
            onStatusChange={canManageRecruitment ? handleUpdateCandidateStatus : undefined}
            onDelete={canManageRecruitment ? handleDeleteCandidate : undefined}
          />
        </TabsContent>

        <TabsContent value="interviews" className="space-y-3 sm:space-y-4">
          <InterviewManagement
            interviews={interviews}
            candidates={candidates}
            jobPostings={jobPostings}
            loading={loading}
            onScheduleInterview={canManageRecruitment ? handleScheduleInterview : undefined}
            onUpdateInterview={canManageRecruitment ? handleUpdateInterview : undefined}
            onDeleteInterview={canManageRecruitment ? handleDeleteInterview : undefined}
          />
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-3 sm:space-y-4">
          <HiringPipelineManagement
            pipelines={pipelines}
            candidates={candidates}
            jobPostings={jobPostings}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-3 sm:space-y-4">
          <OnboardingManagement
            employees={onboardingEmployees}
            candidates={candidates}
            jobPostings={jobPostings}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}