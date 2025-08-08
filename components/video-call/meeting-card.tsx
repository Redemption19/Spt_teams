'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Users, 
  Video, 
  Download, 
  Play, 
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Share2,
  Copy
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Meeting } from '@/lib/video-call-data-service';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

interface MeetingCardProps {
  meeting: Meeting;
  onJoin?: (meeting: Meeting) => void;
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (meeting: Meeting) => void;
  onViewRecording?: (meeting: Meeting) => void;
  onDownloadRecording?: (meeting: Meeting) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function MeetingCard({
  meeting,
  onJoin,
  onEdit,
  onDelete,
  onViewRecording,
  onDownloadRecording,
  showActions = true,
  compact = false
}: MeetingCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const getStatusColor = (status: Meeting['status']) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-500 text-white';
      case 'completed':
        return 'bg-blue-500 text-white';
      case 'scheduled':
        return 'bg-yellow-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeColor = (type: Meeting['meetingType']) => {
    switch (type) {
      case 'instant':
        return 'bg-purple-100 text-purple-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-green-100 text-green-800';
      case 'team':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatRecordingSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return mb < 1024 ? `${Math.round(mb)} MB` : `${(mb / 1024).toFixed(1)} GB`;
  };

  const handleCopyMeetingLink = async () => {
    const meetingLink = `${window.location.origin}/dashboard/video-call/join?meeting=${meeting.id}`;
    try {
      await navigator.clipboard.writeText(meetingLink);
      toast({
        title: 'Success',
        description: 'Meeting link copied to clipboard'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy meeting link',
        variant: 'destructive'
      });
    }
  };

  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  const canJoin = meeting.status === 'ongoing' || meeting.status === 'scheduled';
  const canEdit = meeting.status === 'scheduled';
  const canDelete = meeting.status !== 'ongoing';

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium truncate">{meeting.title}</h3>
                <Badge className={getStatusColor(meeting.status)} variant="secondary">
                  {meeting.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(meeting.scheduledAt || meeting.createdAt, 'MMM d, HH:mm')}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {meeting.participants.length}
                </div>
                {meeting.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(meeting.duration)}
                  </div>
                )}
              </div>
            </div>
            {showActions && (
              <div className="flex items-center gap-2">
                {canJoin && onJoin && (
                  <Button
                    size="sm"
                    onClick={() => handleAction(() => onJoin(meeting))}
                    disabled={isLoading}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Join
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleCopyMeetingLink}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    {meeting.hasRecording && onViewRecording && (
                      <DropdownMenuItem onClick={() => onViewRecording(meeting)}>
                        <Play className="h-4 w-4 mr-2" />
                        View Recording
                      </DropdownMenuItem>
                    )}
                    {meeting.hasRecording && onDownloadRecording && (
                      <DropdownMenuItem onClick={() => onDownloadRecording(meeting)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Recording
                      </DropdownMenuItem>
                    )}
                    {canEdit && onEdit && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(meeting)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      </>
                    )}
                    {canDelete && onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(meeting)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="truncate">{meeting.title}</CardTitle>
              <Badge className={getStatusColor(meeting.status)} variant="secondary">
                {meeting.status}
              </Badge>
              <Badge className={getTypeColor(meeting.meetingType)} variant="outline">
                {meeting.meetingType}
              </Badge>
            </div>
            {meeting.description && (
              <CardDescription className="line-clamp-2">
                {meeting.description}
              </CardDescription>
            )}
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyMeetingLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                {meeting.hasRecording && onViewRecording && (
                  <DropdownMenuItem onClick={() => onViewRecording(meeting)}>
                    <Play className="h-4 w-4 mr-2" />
                    View Recording
                  </DropdownMenuItem>
                )}
                {meeting.hasRecording && onDownloadRecording && (
                  <DropdownMenuItem onClick={() => onDownloadRecording(meeting)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Recording
                  </DropdownMenuItem>
                )}
                {canEdit && onEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(meeting)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  </>
                )}
                {canDelete && onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(meeting)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">
                {format(meeting.scheduledAt || meeting.createdAt, 'MMM d, yyyy')}
              </div>
              <div className="text-muted-foreground">
                {format(meeting.scheduledAt || meeting.createdAt, 'HH:mm')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{meeting.participants.length} participants</div>
              <div className="text-muted-foreground">Max: {meeting.maxParticipants}</div>
            </div>
          </div>
          {meeting.duration && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{formatDuration(meeting.duration)}</div>
                <div className="text-muted-foreground">Duration</div>
              </div>
            </div>
          )}
          {meeting.hasRecording && (
            <div className="flex items-center gap-2 text-sm">
              <Video className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Recording</div>
                <div className="text-muted-foreground">
                  {formatRecordingSize(meeting.recordingSize)}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hosted by <span className="font-medium">{meeting.hostName}</span>
            {meeting.createdAt && (
              <span className="ml-2">
                • {formatDistanceToNow(meeting.createdAt, { addSuffix: true })}
              </span>
            )}
          </div>
          
          {showActions && (
            <div className="flex items-center gap-2">
              {meeting.hasRecording && onViewRecording && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(() => onViewRecording!(meeting))}
                  disabled={isLoading}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              )}
              {canJoin && onJoin && (
                <Button
                  onClick={() => handleAction(() => onJoin(meeting))}
                  disabled={isLoading}
                  size="sm"
                >
                  <Video className="h-4 w-4 mr-1" />
                  {meeting.status === 'ongoing' ? 'Join' : 'Start'}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}