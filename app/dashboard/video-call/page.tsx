'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import VideoCallRoom from '@/components/video-call/video-call-room';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';

interface VideoCallPageProps {
  searchParams: {
    channel?: string;
    title?: string;
    appId?: string;
    token?: string;
    interview?: string;
    team?: string;
    event?: string;
  };
}

function VideoCallContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { hasPermission } = usePermissions({ 
    userId: user?.uid, 
    workspaceId: currentWorkspace?.id 
  });
  const [error, setError] = useState<string | null>(null);

  // Extract parameters
  const channelName = searchParams.get('channel');
  const meetingTitle = searchParams.get('title');
  const token = searchParams.get('token');
  const interviewId = searchParams.get('interview');
  const teamId = searchParams.get('team');
  const eventId = searchParams.get('event');
  
  // Get Agora App ID from environment variables
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;

  useEffect(() => {
    // Validation
    if (!channelName) {
      setError('Missing channel name');
      return;
    }

    if (!appId) {
      setError('Video calling is not configured. Please contact your administrator.');
      return;
    }

    // Permission checks
    if (interviewId && !hasPermission('interview.manage')) {
      setError('You do not have permission to join interview calls');
      return;
    }

    if (teamId && !hasPermission('team.view')) {
      setError('You do not have permission to join team calls');
      return;
    }

    // Clear any previous errors
    setError(null);
  }, [channelName, appId, interviewId, teamId, hasPermission]);

  const handleCallEnd = () => {
    // Navigate back based on context
    if (interviewId) {
      router.push(`/dashboard/hr/recruitment/interviews/${interviewId}`);
    } else if (teamId) {
      router.push(`/dashboard/teams/${teamId}`);
    } else if (eventId) {
      router.push('/dashboard/calendar');
    } else {
      router.push('/dashboard');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Authentication Required</h3>
            <p className="text-sm text-muted-foreground">Please log in to join the video call</p>
          </div>
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Cannot Join Call</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => router.back()} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <VideoCallRoom
      channelName={channelName!}
      appId={appId!}
      token={token || undefined}
      meetingTitle={meetingTitle || undefined}
      onCallEnd={handleCallEnd}
      showControls={true}
      autoJoin={true}
    />
  );
}

export default function VideoCallPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <Card className="p-6 text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-32 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-24 mx-auto"></div>
            </div>
          </Card>
        </div>
      }
    >
      <VideoCallContent />
    </Suspense>
  );
}
