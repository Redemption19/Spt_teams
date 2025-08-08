'use client';

import { useState } from 'react';
import { useVideoCallData } from '@/hooks/use-video-call-data';
import { MeetingList } from '@/components/video-call/meeting-list';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Meeting } from '@/lib/video-call-data-service';

export default function VideoCallHistoryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { meetings, loading, deleteMeeting } = useVideoCallData();

  // Filter to show only completed and cancelled meetings
  const historyMeetings = meetings.filter(meeting => 
    meeting.status === 'completed' || meeting.status === 'cancelled'
  );

  const handleViewRecording = async (meeting: Meeting) => {
    if (!meeting.hasRecording) {
      toast({
        title: 'No Recording',
        description: 'This meeting does not have a recording available.',
        variant: 'destructive'
      });
      return;
    }

    // In a real implementation, this would open the recording viewer
    // For now, we'll show a placeholder
    toast({
      title: 'Opening Recording',
      description: `Opening recording for "${meeting.title}"...`
    });
  };

  const handleDownloadRecording = async (meeting: Meeting) => {
    if (!meeting.hasRecording) {
      toast({
        title: 'No Recording',
        description: 'This meeting does not have a recording available.',
        variant: 'destructive'
      });
      return;
    }

    // In a real implementation, this would trigger the download
    toast({
      title: 'Download Started',
      description: `Downloading recording for "${meeting.title}"...`
    });
  };

  const handleDeleteMeeting = async (meeting: Meeting) => {
    try {
      await deleteMeeting(meeting.id);
      toast({
        title: 'Meeting Deleted',
        description: `"${meeting.title}" has been deleted from your history.`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete meeting. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Meeting History</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          View and manage your past video calls and recordings
        </p>
      </div>

      <div className="w-full">
        <MeetingList
          meetings={historyMeetings}
          loading={loading}
          onViewRecording={handleViewRecording}
          onDownloadRecording={handleDownloadRecording}
          onDelete={handleDeleteMeeting}
          showActions={true}
          allowFiltering={true}
          allowSorting={true}
          allowSearch={true}
          defaultViewMode="list"
          emptyMessage="No meeting history"
          emptyDescription="Your completed and cancelled meetings will appear here."
        />
      </div>
    </div>
  );
}