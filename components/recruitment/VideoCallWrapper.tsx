'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamic import with SSR disabled
const InterviewVideoCall = dynamic(
  () => import('./InterviewVideoCall'),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading video call interface...</p>
        </div>
      </div>
    )
  }
);

interface VideoCallWrapperProps {
  interview: any;
  candidate: any;
  channelName: string;
  onCallEnd?: (callData: { duration: number; feedback?: string }) => void;
  isInterviewer?: boolean;
}

export default function VideoCallWrapper(props: VideoCallWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing video call...</p>
        </div>
      </div>
    );
  }

  return <InterviewVideoCall {...props} />;
}
