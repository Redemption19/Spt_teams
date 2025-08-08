import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { VideoCallService } from '@/lib/video-call-service';
import { generateInterviewChannelName } from '@/lib/video-call-utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon,
  Clock,
  MessageSquare,
  Phone,
  Video,
  User,
  MapPin,
  Star,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Link2,
  Copy,
  Users,
  FileText,
  ExternalLink,
  Mail,
  PhoneCall,
  VideoIcon,
  Building,
  Award
} from 'lucide-react';
import { Interview, Candidate, JobPosting } from '@/lib/recruitment-service';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InterviewManagementProps {
  interviews: Interview[];
  candidates: Candidate[];
  jobPostings: JobPosting[];
  loading?: boolean;
  onScheduleInterview?: (data: Partial<Interview>) => void;
  onUpdateInterview?: (interviewId: string, data: Partial<Interview>) => void;
  onDeleteInterview?: (interviewId: string) => void;
}

export default function InterviewManagement({ 
  interviews, 
  candidates, 
  jobPostings, 
  loading = false,
  onScheduleInterview,
  onUpdateInterview,
  onDeleteInterview
}: InterviewManagementProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    candidateId: '',
    jobPostingId: '',
    type: 'video' as const,
    date: new Date(),
    time: '10:00',
    duration: 60,
    interviewer: '',
    location: '',
    meetingLink: ''
  });
  const [feedbackForm, setFeedbackForm] = useState({
    feedback: '',
    rating: 5,
    technicalScore: 5,
    culturalScore: 5,
    overallScore: 5,
    nextSteps: ''
  });

  const interviewTypes = [
    { value: 'phone', label: 'Phone Call', icon: Phone },
    { value: 'video', label: 'Video Call', icon: Video },
    { value: 'in-person', label: 'In-Person', icon: User },
    { value: 'technical', label: 'Technical', icon: Award },
    { value: 'panel', label: 'Panel Interview', icon: Users }
  ];

    // Start video interview function
  const startVideoInterview = (interview: Interview) => {
    try {
      // Generate unique channel name for this interview using utility function
      const channelName = generateInterviewChannelName(interview.id);
      
      // Get candidate details for URL
      const candidate = candidates.find(c => c.id === interview.candidateId);
      const candidateName = candidate?.name || 'Candidate';
      
      // Create interview call URL with parameters including names
      const params = new URLSearchParams({
        interview: interview.id,
        channel: channelName,
        candidate: interview.candidateId,
        candidateName: candidateName,
        interviewer: interview.interviewer
      });
      
      const callUrl = `/dashboard/hr/recruitment/interview-call?${params.toString()}`;
      
      // Open in new window for better experience
      window.open(callUrl, '_blank', 'width=1200,height=800,resizable=yes,scrollbars=yes');
      
      toast({
        title: 'Starting Video Interview',
        description: `Opening video call with ${candidateName}`,
      });
    } catch (error) {
      console.error('Error starting video interview:', error);
      toast({
        title: 'Error',
        description: 'Failed to start video interview. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: Interview['status']) => {
    const statusConfig = {
      'scheduled': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CalendarIcon, label: 'Scheduled' },
      'in-progress': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock, label: 'In Progress' },
      'completed': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Completed' },
      'cancelled': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Cancelled' },
      'rescheduled': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Rescheduled' },
      'no-show': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle, label: 'No Show' }
    };
    
    const config = statusConfig[status] || statusConfig.scheduled;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: Interview['type']) => {
    const typeConfig = interviewTypes.find(t => t.value === type);
    if (!typeConfig) return null;
    
    const Icon = typeConfig.icon;
    return (
      <Badge variant="secondary" className="text-xs">
        <Icon className="w-3 h-3 mr-1" />
        {typeConfig.label}
      </Badge>
    );
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-4 h-4",
          i < rating ? "text-yellow-500 fill-current" : "text-gray-300"
        )}
      />
    ));
  };

  const copyInterviewLink = (interviewId: string) => {
    const link = `${window.location.origin}/interview/${interviewId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link Copied',
      description: 'Interview link copied to clipboard. Share this with the candidate.',
    });
  };

  const filteredInterviews = interviews.filter(interview => {
    const candidate = candidates.find(c => c.id === interview.candidateId);
    const jobPosting = jobPostings.find(j => j.id === interview.jobPostingId);
    
    const matchesSearch = 
      candidate?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobPosting?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.interviewer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    const matchesType = typeFilter === 'all' || interview.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleScheduleInterview = async () => {
    if (!scheduleForm.candidateId || !scheduleForm.jobPostingId || !scheduleForm.interviewer) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    if (onScheduleInterview) {
      try {
        await onScheduleInterview(scheduleForm);
        setShowScheduleDialog(false);
        setScheduleForm({
          candidateId: '',
          jobPostingId: '',
          type: 'video',
          date: new Date(),
          time: '10:00',
          duration: 60,
          interviewer: '',
          location: '',
          meetingLink: ''
        });
        toast({
          title: 'Interview Scheduled',
          description: 'The interview has been scheduled successfully.',
        });
      } catch (error) {
        toast({
          title: 'Scheduling Failed',
          description: 'Failed to schedule interview. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleUpdateFeedback = async () => {
    if (!selectedInterview || !feedbackForm.feedback) {
      toast({
        title: 'Validation Error',
        description: 'Please provide feedback.',
        variant: 'destructive'
      });
      return;
    }

    if (onUpdateInterview) {
      try {
        await onUpdateInterview(selectedInterview.id, {
          status: 'completed',
          feedback: feedbackForm.feedback,
          rating: feedbackForm.rating,
          nextSteps: feedbackForm.nextSteps
        });
        setShowFeedbackDialog(false);
        setSelectedInterview(null);
        setFeedbackForm({
          feedback: '',
          rating: 5,
          technicalScore: 5,
          culturalScore: 5,
          overallScore: 5,
          nextSteps: ''
        });
        toast({
          title: 'Feedback Submitted',
          description: 'Interview feedback has been saved successfully.',
        });
      } catch (error) {
        toast({
          title: 'Submission Failed',
          description: 'Failed to submit feedback. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleDeleteInterview = async (interview: Interview) => {
    if (onDeleteInterview) {
      try {
        await onDeleteInterview(interview.id);
        toast({
          title: 'Interview Deleted',
          description: 'The interview has been deleted successfully.',
        });
      } catch (error) {
        toast({
          title: 'Deletion Failed',
          description: 'Failed to delete interview. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="card-enhanced">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex-1 space-y-2">
                  <div className="h-5 sm:h-6 w-32 sm:w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 sm:h-4 w-24 sm:w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 sm:h-4 w-48 sm:w-64 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex gap-2 sm:ml-6 sm:flex-col">
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold truncate">Interview Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Schedule, track, and manage candidate interviews
          </p>
        </div>
        <Button onClick={() => setShowScheduleDialog(true)} className="h-9 sm:h-10 text-sm shrink-0">
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Schedule Interview</span>
          <span className="sm:hidden">Schedule</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="card-enhanced">
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                <Input
                  placeholder="Search interviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-10 text-sm">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-10 text-sm">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {interviewTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interviews List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredInterviews.length === 0 ? (
          <Card className="card-enhanced">
            <CardContent className="p-6 sm:p-8 md:p-12 text-center">
              <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No Interviews Found</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by scheduling your first interview.'}
              </p>
              <Button onClick={() => setShowScheduleDialog(true)} className="h-9 sm:h-10 text-sm">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Schedule Interview</span>
                <span className="sm:hidden">Schedule</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredInterviews.map((interview) => {
            const candidate = candidates.find(c => c.id === interview.candidateId);
            const jobPosting = jobPostings.find(j => j.id === interview.jobPostingId);
            
            return (
              <Card key={interview.id} className="card-enhanced hover:card-hover-enhanced transition-all duration-200">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <h3 className="text-base sm:text-lg font-semibold truncate">{candidate?.name || 'Unknown Candidate'}</h3>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {getStatusBadge(interview.status)}
                          {getTypeBadge(interview.type)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1 sm:gap-2 truncate">
                          <Award className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                          <span className="truncate">{jobPosting?.title || 'Unknown Position'}</span>
                        </span>
                        <span className="flex items-center gap-1 sm:gap-2 truncate">
                          <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                          <span className="truncate">{format(interview.date, 'MMM dd, yyyy')}</span>
                        </span>
                        <span className="flex items-center gap-1 sm:gap-2 truncate">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                          <span className="truncate">{interview.time} ({interview.duration} min)</span>
                        </span>
                        <span className="flex items-center gap-1 sm:gap-2 truncate">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                          <span className="truncate">{interview.interviewer}</span>
                        </span>
                      </div>
                      
                      {interview.location && (
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                          <span className="truncate">{interview.location}</span>
                        </div>
                      )}
                      
                      {interview.type === 'video' && interview.status === 'scheduled' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Button
                            onClick={() => startVideoInterview(interview)}
                            size="sm"
                            className="h-8 sm:h-9 px-2 sm:px-3 bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm"
                          >
                            <Video className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="hidden sm:inline">Start Video Interview</span>
                            <span className="sm:hidden">Start Video</span>
                          </Button>
                        </div>
                      )}
                      
                      {interview.meetingLink && interview.type !== 'video' && (
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
                          <Video className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                          <a 
                            href={interview.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            Join Meeting
                          </a>
                        </div>
                      )}
                      
                      {interview.feedback && (
                        <div className="mt-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs sm:text-sm font-medium mb-1">Feedback:</p>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">{interview.feedback}</p>
                          {interview.rating && (
                            <div className="flex items-center gap-1 mt-2">
                              {getRatingStars(interview.rating)}
                              <span className="text-xs sm:text-sm text-muted-foreground ml-2">
                                {interview.rating}/5
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col lg:items-end gap-3 lg:ml-6 shrink-0">
                      <div className="flex flex-wrap gap-2">
                        {interview.status === 'scheduled' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyInterviewLink(interview.id)}
                              className="h-8 sm:h-9 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Copy Link</span>
                              <span className="sm:hidden">Copy</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedInterview(interview);
                                setShowFeedbackDialog(true);
                              }}
                              className="h-8 sm:h-9 text-xs sm:text-sm"
                            >
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Complete</span>
                              <span className="sm:hidden">Complete</span>
                            </Button>
                          </>
                        )}
                        <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                          <span className="sm:hidden">Edit</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteInterview(interview)}
                          className="h-8 sm:h-9 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Delete</span>
                          <span className="sm:hidden">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Schedule Interview Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Schedule Interview</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Schedule a new interview with a candidate
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="candidate" className="text-xs sm:text-sm">Candidate *</Label>
                <Select value={scheduleForm.candidateId} onValueChange={(value) => setScheduleForm(prev => ({ ...prev, candidateId: value }))}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                                     <SelectContent>
                     {candidates.map((candidate) => {
                       const jobPosting = jobPostings.find(j => j.id === candidate.jobId);
                       return (
                         <SelectItem key={candidate.id} value={candidate.id}>
                           {candidate.name} - {jobPosting?.title || 'Unknown Position'}
                         </SelectItem>
                       );
                     })}
                   </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobPosting" className="text-xs sm:text-sm">Position *</Label>
                <Select value={scheduleForm.jobPostingId} onValueChange={(value) => setScheduleForm(prev => ({ ...prev, jobPostingId: value }))}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobPostings.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs sm:text-sm">Interview Type</Label>
                <Select value={scheduleForm.type} onValueChange={(value: any) => setScheduleForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interviewTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interviewer" className="text-xs sm:text-sm">Interviewer *</Label>
                <Input
                  id="interviewer"
                  value={scheduleForm.interviewer}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, interviewer: e.target.value }))}
                  placeholder="Interviewer name"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs sm:text-sm">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9 sm:h-10 text-sm",
                        !scheduleForm.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      {scheduleForm.date ? format(scheduleForm.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduleForm.date}
                      onSelect={(date) => date && setScheduleForm(prev => ({ ...prev, date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-xs sm:text-sm">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-xs sm:text-sm">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={scheduleForm.duration}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                  placeholder="60"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs sm:text-sm">Location</Label>
                <Input
                  id="location"
                  value={scheduleForm.location}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Office, Conference Room, etc."
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meetingLink" className="text-xs sm:text-sm">
                Meeting Link
                {scheduleForm.type === 'video' && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Video interviews will use built-in video calling)
                  </span>
                )}
              </Label>
              {scheduleForm.type === 'video' ? (
                <div className="p-3 sm:p-4 bg-primary/5 border border-primary/10 rounded-md">
                  <div className="flex items-center gap-1 sm:gap-2 text-primary">
                    <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-sm sm:text-base font-medium">Built-in Video Interview</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    This interview will use our integrated video calling system. 
                    No external meeting link required.
                  </p>
                </div>
              ) : (
                <Input
                  id="meetingLink"
                  value={scheduleForm.meetingLink}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                  placeholder="https://meet.google.com/..."
                  className="h-9 sm:h-10 text-sm"
                />
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)} className="h-9 sm:h-10 text-sm order-2 sm:order-1">
              Cancel
            </Button>
            <Button onClick={handleScheduleInterview} className="h-9 sm:h-10 text-sm order-1 sm:order-2">
              Schedule Interview
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Interview Feedback</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Provide feedback for the completed interview
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-xs sm:text-sm">Feedback *</Label>
              <Textarea
                id="feedback"
                value={feedbackForm.feedback}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, feedback: e.target.value }))}
                placeholder="Provide detailed feedback about the candidate's performance..."
                rows={4}
                className="text-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Overall Rating</Label>
                <div className="flex items-center gap-2">
                  {getRatingStars(feedbackForm.rating)}
                  <Select value={feedbackForm.rating.toString()} onValueChange={(value) => setFeedbackForm(prev => ({ ...prev, rating: parseInt(value) }))}>
                    <SelectTrigger className="w-16 sm:w-20 h-9 sm:h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <SelectItem key={rating} value={rating.toString()}>
                          {rating}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Technical Score</Label>
                <Select value={feedbackForm.technicalScore.toString()} onValueChange={(value) => setFeedbackForm(prev => ({ ...prev, technicalScore: parseInt(value) }))}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <SelectItem key={score} value={score.toString()}>
                        {score}/5
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Cultural Score</Label>
                <Select value={feedbackForm.culturalScore.toString()} onValueChange={(value) => setFeedbackForm(prev => ({ ...prev, culturalScore: parseInt(value) }))}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <SelectItem key={score} value={score.toString()}>
                        {score}/5
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Overall Score</Label>
                <Select value={feedbackForm.overallScore.toString()} onValueChange={(value) => setFeedbackForm(prev => ({ ...prev, overallScore: parseInt(value) }))}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <SelectItem key={score} value={score.toString()}>
                        {score}/5
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nextSteps" className="text-xs sm:text-sm">Next Steps</Label>
              <Textarea
                id="nextSteps"
                value={feedbackForm.nextSteps}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, nextSteps: e.target.value }))}
                placeholder="Recommendations for next steps..."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => setShowFeedbackDialog(false)} className="h-9 sm:h-10 text-sm order-2 sm:order-1">
              Cancel
            </Button>
            <Button onClick={handleUpdateFeedback} className="h-9 sm:h-10 text-sm order-1 sm:order-2">
              Submit Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}