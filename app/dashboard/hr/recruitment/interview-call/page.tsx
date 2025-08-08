'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import VideoCallWrapper from '@/components/recruitment/VideoCallWrapper';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { Interview, Candidate } from '@/lib/recruitment-service';
import { Skeleton } from '@/components/ui/skeleton';

export default function InterviewVideoCallPage() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [interview, setInterview] = useState<Interview | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const interviewId = searchParams.get('interview');
  const channelName = searchParams.get('channel');
  const candidateId = searchParams.get('candidate');
  const candidateName = searchParams.get('candidateName');
  const interviewerName = searchParams.get('interviewer');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!interviewId || !channelName || !candidateId) {
      setError('Missing required parameters for interview call');
      setLoading(false);
      return;
    }

    // Use workspace ID from currentWorkspace or fallback to a default
    const workspaceId = currentWorkspace?.id || 'default-workspace';

    // In a real implementation, you would fetch the interview and candidate data
    // For now, we'll create mock data based on the parameters
    const mockInterview: Interview = {
      id: interviewId,
      workspaceId: workspaceId,
      candidateId: candidateId,
      jobPostingId: 'mock-job-id',
      title: 'Video Interview',
      type: 'video',
      date: new Date(),
      time: '10:00',
      duration: 60,
      interviewer: interviewerName || user.displayName || user.email || 'Interviewer',
      location: '',
      meetingLink: `${window.location.origin}/dashboard/hr/recruitment/interview-call?interview=${interviewId}&channel=${channelName}&candidate=${candidateId}`,
      status: 'scheduled',
      feedback: '',
      rating: 0,
      createdBy: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: user.uid
    };

    const mockCandidate: Candidate = {
      id: candidateId,
      workspaceId: workspaceId,
      jobId: 'mock-job-id',
      name: candidateName || 'Interview Candidate',
      email: 'candidate@example.com',
      phone: '+1234567890',
      experience: 3,
      education: "Bachelor's Degree",
      location: 'Remote',
      status: 'interview-scheduled',
      appliedDate: new Date(),
      notes: '',
      tags: [],
      createdBy: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: user.uid
    };

    setInterview(mockInterview);
    setCandidate(mockCandidate);
    setLoading(false);
  }, [user, router, interviewId, channelName, candidateId, candidateName, interviewerName, currentWorkspace]);

  const handleCallEnd = (callData: { duration: number; feedback?: string }) => {
    // Here you would update the interview record with call data
    
    // Navigate back to recruitment dashboard
    router.push('/dashboard/hr/recruitment');
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <div className="grid grid-cols-2 gap-4 mt-8">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
              <div className="flex justify-center gap-4 mt-6">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !interview || !candidate) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Join Interview</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'Interview data could not be loaded'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => router.push('/dashboard/hr/recruitment')}>
                Return to Recruitment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For now, assume the user has interviewer permissions
  // In a real implementation, you would check actual permissions
  const isInterviewer = true;

  return (
    <VideoCallWrapper
      interview={interview}
      candidate={candidate}
      channelName={channelName!}
      onCallEnd={handleCallEnd}
      isInterviewer={isInterviewer}
    />
  );
}
