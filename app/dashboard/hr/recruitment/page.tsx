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
  DollarSign,
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
        if (workspaceId) {
          const [statsData, jobsData, candidatesData, interviewsData, pipelinesData] = await Promise.all([
            RecruitmentService.getRecruitmentStats(workspaceId),
            RecruitmentService.getWorkspaceJobPostings(workspaceId),
            RecruitmentService.getWorkspaceCandidates(workspaceId),
            RecruitmentService.getWorkspaceInterviews(workspaceId),
            RecruitmentService.getWorkspaceHiringPipelines(workspaceId)
          ]);

          setStats(statsData);
          setJobPostings(jobsData);
          setCandidates(candidatesData);
          setInterviews(interviewsData);
          setPipelines(pipelinesData);
        }
      } else {
        // Member/Admin - load current workspace data
        const [statsData, jobsData, candidatesData, interviewsData, pipelinesData] = await Promise.all([
          RecruitmentService.getRecruitmentStats(currentWorkspace.id),
          RecruitmentService.getWorkspaceJobPostings(currentWorkspace.id),
          RecruitmentService.getWorkspaceCandidates(currentWorkspace.id),
          RecruitmentService.getWorkspaceInterviews(currentWorkspace.id),
          RecruitmentService.getWorkspaceHiringPipelines(currentWorkspace.id)
        ]);

        setStats(statsData);
        setJobPostings(jobsData);
        setCandidates(candidatesData);
        setInterviews(interviewsData);
        setPipelines(pipelinesData);
      }

      setInitialLoadComplete(true);
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
    try {
      await RecruitmentService.deleteCandidate(candidateId);
      await loadData();
      toast({
        title: 'Candidate Deleted',
        description: 'The candidate has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete candidate. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (loading && !initialLoadComplete) {
    return <RecruitmentSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Recruitment & Onboarding
          </h1>
          <p className="text-muted-foreground">
            Manage job postings, track applications, and handle the recruitment process
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
                    {canManageRecruitment && (
            <Button 
              onClick={() => router.push('/dashboard/hr/recruitment/create')}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post Job
            </Button>
          )}
          
        </div>
      </div>

      {/* Cross-workspace scope banner for owners */}
      {isOwner && shouldShowCrossWorkspace && allWorkspaces.length > 1 && (
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
          <p className="text-sm text-green-700 dark:text-green-400">
            🌐 <strong>Cross-Workspace Recruitment:</strong> Displaying recruitment data across all {allWorkspaces.length} accessible workspaces. Job postings, candidates, and interviews from all workspaces are aggregated for centralized management.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && <RecruitmentStatsComponent stats={stats} loading={loading} />}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="pipeline">Hiring Pipeline</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Recruitment Overview</CardTitle>
              <CardDescription>Quick overview of your recruitment activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{jobPostings.filter(job => job.status === 'active').length}</div>
                  <div className="text-sm text-muted-foreground">Active Job Postings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{candidates.length}</div>
                  <div className="text-sm text-muted-foreground">Total Candidates</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{interviews.filter(i => i.status === 'scheduled').length}</div>
                  <div className="text-sm text-muted-foreground">Scheduled Interviews</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <JobPostingsList
            jobPostings={jobPostings}
            loading={loading}
            onDelete={canManageRecruitment ? handleDeleteJob : undefined}
          />
        </TabsContent>

        <TabsContent value="candidates" className="space-y-4">
          <CandidatesList
            candidates={candidates}
            loading={loading}
            onStatusChange={canManageRecruitment ? handleUpdateCandidateStatus : undefined}
            onDelete={canManageRecruitment ? handleDeleteCandidate : undefined}
          />
        </TabsContent>

        <TabsContent value="interviews" className="space-y-4">
          <InterviewManagement
            interviews={interviews}
            candidates={candidates}
            jobPostings={jobPostings}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <HiringPipelineManagement
            pipelines={pipelines}
            candidates={candidates}
            jobPostings={jobPostings}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
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