'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Clock, 
  MapPin, 
  User, 
  Building2, 
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { Interview, Candidate, JobPosting, RecruitmentService } from '@/lib/recruitment-service';
import { useToast } from '@/hooks/use-toast';
import InterviewVideoCall from '@/components/recruitment/InterviewVideoCall';

export default function CandidateInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const interviewId = params.interviewId as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const loadInterviewData = async () => {
      try {
        if (!interviewId) {
          setError('Invalid interview link');
          return;
        }

        // Load interview details
        const interviewData = await RecruitmentService.getInterview(interviewId);
        if (!interviewData) {
          setError('Interview not found or expired');
          return;
        }

        setInterview(interviewData);

        // Load candidate details
        const candidateData = await RecruitmentService.getCandidate(interviewData.candidateId);
        if (candidateData) {
          setCandidate(candidateData);
        }

        // Load job posting details
        const jobData = await RecruitmentService.getJobPosting(interviewData.jobPostingId);
        if (jobData) {
          setJobPosting(jobData);
        }

      } catch (err: any) {
        console.error('Error loading interview data:', err);
        setError('Failed to load interview details');
      } finally {
        setLoading(false);
      }
    };

    loadInterviewData();
  }, [interviewId]);

  const formatDateTime = (date: Date, time?: string) => {
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (time) {
      return `${dateStr} at ${time}`;
    }
    
    return dateStr;
  };

  const isInterviewTime = () => {
    if (!interview) return false;
    
    const now = new Date();
    const interviewDate = new Date(interview.date);
    
    // Allow joining 15 minutes before scheduled time
    const joinTimeBuffer = 15 * 60 * 1000; // 15 minutes in milliseconds
    const joinTime = new Date(interviewDate.getTime() - joinTimeBuffer);
    
    // Allow joining up to 2 hours after scheduled time
    const endTimeBuffer = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    const endTime = new Date(interviewDate.getTime() + endTimeBuffer);
    
    return now >= joinTime && now <= endTime;
  };

  const getTimeUntilInterview = () => {
    if (!interview) return '';
    
    const now = new Date();
    const interviewDate = new Date(interview.date);
    const diff = interviewDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Interview time has passed';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const handleJoinInterview = () => {
    if (!isInterviewTime()) {
      toast({
        title: 'Interview Not Available',
        description: 'You can join 15 minutes before the scheduled time.',
        variant: 'destructive'
      });
      return;
    }
    
    setHasJoined(true);
  };

  const handleCallEnd = (callData: { duration: number; feedback?: string }) => {
    console.log('Interview ended:', callData);
    setHasJoined(false);
    
    toast({
      title: 'Interview Completed',
      description: 'Thank you for your time. We will be in touch soon.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (error || !interview || !candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md card-enhanced border-destructive/20">
          <CardContent className="p-8 text-center">
            <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto mb-4">
              <AlertCircle className="w-16 h-16 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Interview Not Found</h3>
            <p className="text-muted-foreground mb-6">
              {error || 'This interview link is invalid or has expired.'}
            </p>
            <Button 
              onClick={() => router.push('/careers')} 
              variant="outline"
              className="border-primary/20 hover:bg-primary/5"
            >
              Browse Open Positions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show video call interface if joined
  if (hasJoined) {
    return (
      <InterviewVideoCall
        interview={interview}
        candidate={candidate}
        channelName={`interview-${interviewId}`}
        onCallEnd={handleCallEnd}
        isInterviewer={false}
      />
    );
  }

  // Show interview lobby/waiting room
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Interview Ready
          </h1>
          <p className="text-muted-foreground">
            You're about to join your interview. Please review the details below.
          </p>
        </div>

        {/* Interview Details Card */}
        <Card className="mb-6 card-enhanced border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl text-foreground">
                  {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Duration: {interview.duration} minutes
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            
            {/* Job Information */}
            {jobPosting && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg">
                <div className="p-2 rounded-md bg-primary/10">
                  <Building2 className="w-5 h-5 text-primary mt-0.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{jobPosting.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {jobPosting.department} • {jobPosting.location}
                  </p>
                </div>
              </div>
            )}

            {/* Interview Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(interview.date, interview.time)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Interviewer</p>
                  <p className="text-sm text-muted-foreground">
                    {interview.interviewer}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {interview.duration} minutes
                  </p>
                </div>
              </div>

              {interview.location && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {interview.location}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Candidate Information */}
            <div className="border-t border-primary/20 pt-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Candidate:</span> {candidate.name} ({candidate.email})
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status and Join Button */}
        <Card className="mb-6 card-enhanced">
          <CardContent className="p-6">
            {isInterviewTime() ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="p-2 rounded-full bg-emerald-500/10">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-semibold text-emerald-600">Ready to Join</span>
                </div>
                <p className="text-muted-foreground">
                  Your interview is ready. Click below to join the video call.
                </p>
                <Button 
                  onClick={handleJoinInterview}
                  size="lg"
                  className="w-full md:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Join Interview
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="p-2 rounded-full bg-orange-500/10">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="font-semibold text-orange-600">Interview Scheduled</span>
                </div>
                <p className="text-muted-foreground">
                  You can join 15 minutes before the scheduled time.
                </p>
                <p className="text-sm text-muted-foreground">
                  Time until interview: <span className="font-semibold text-foreground">{getTimeUntilInterview()}</span>
                </p>
                <Button 
                  disabled
                  size="lg"
                  variant="outline"
                  className="w-full md:w-auto border-primary/20 text-muted-foreground"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Join Available Soon
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preparation Tips */}
        <Alert className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            <span className="font-semibold">Before joining:</span> Please ensure you have a stable internet connection, 
            your camera and microphone are working, and you're in a quiet environment.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}