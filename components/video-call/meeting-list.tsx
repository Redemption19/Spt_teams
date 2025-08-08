'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Calendar,
  Users,
  Clock,
  Video,
  Grid3X3,
  List
} from 'lucide-react';
import { Meeting } from '@/lib/video-call-data-service';
import { MeetingCard } from './meeting-card';
import { Skeleton } from '@/components/ui/skeleton';

type SortField = 'date' | 'title' | 'duration' | 'participants';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

interface MeetingListProps {
  meetings: Meeting[];
  loading?: boolean;
  onJoin?: (meeting: Meeting) => void;
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (meeting: Meeting) => void;
  onViewRecording?: (meeting: Meeting) => void;
  onDownloadRecording?: (meeting: Meeting) => void;
  showActions?: boolean;
  allowFiltering?: boolean;
  allowSorting?: boolean;
  allowSearch?: boolean;
  defaultViewMode?: ViewMode;
  emptyMessage?: string;
  emptyDescription?: string;
}

export function MeetingList({
  meetings,
  loading = false,
  onJoin,
  onEdit,
  onDelete,
  onViewRecording,
  onDownloadRecording,
  showActions = true,
  allowFiltering = true,
  allowSorting = true,
  allowSearch = true,
  defaultViewMode = 'grid',
  emptyMessage = 'No meetings found',
  emptyDescription = 'There are no meetings to display at the moment.'
}: MeetingListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);

  const filteredAndSortedMeetings = useMemo(() => {
    let filtered = meetings;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(meeting => 
        meeting.title.toLowerCase().includes(query) ||
        meeting.description?.toLowerCase().includes(query) ||
        meeting.hostName.toLowerCase().includes(query) ||
        meeting.participants.some(p => p.userName.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(meeting => meeting.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(meeting => meeting.meetingType === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'date':
          aValue = a.scheduledAt || a.createdAt;
          bValue = b.scheduledAt || b.createdAt;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'participants':
          aValue = a.participants.length;
          bValue = b.participants.length;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [meetings, searchQuery, statusFilter, typeFilter, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  const getStatusCounts = () => {
    const counts = meetings.reduce((acc, meeting) => {
      acc[meeting.status] = (acc[meeting.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return counts;
  };

  const getTypeCounts = () => {
    const counts = meetings.reduce((acc, meeting) => {
      acc[meeting.meetingType] = (acc[meeting.meetingType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return counts;
  };

  const statusCounts = getStatusCounts();
  const typeCounts = getTypeCounts();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        {allowSearch && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          {allowFiltering && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ongoing">
                  <div className="flex items-center justify-between w-full">
                    <span>Ongoing</span>
                    {statusCounts.ongoing && (
                      <Badge variant="secondary" className="ml-2">
                        {statusCounts.ongoing}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="scheduled">
                  <div className="flex items-center justify-between w-full">
                    <span>Scheduled</span>
                    {statusCounts.scheduled && (
                      <Badge variant="secondary" className="ml-2">
                        {statusCounts.scheduled}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center justify-between w-full">
                    <span>Completed</span>
                    {statusCounts.completed && (
                      <Badge variant="secondary" className="ml-2">
                        {statusCounts.completed}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center justify-between w-full">
                    <span>Cancelled</span>
                    {statusCounts.cancelled && (
                      <Badge variant="secondary" className="ml-2">
                        {statusCounts.cancelled}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Type Filter */}
          {allowFiltering && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <Video className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="instant">
                  <div className="flex items-center justify-between w-full">
                    <span>Instant</span>
                    {typeCounts.instant && (
                      <Badge variant="secondary" className="ml-2">
                        {typeCounts.instant}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="scheduled">
                  <div className="flex items-center justify-between w-full">
                    <span>Scheduled</span>
                    {typeCounts.scheduled && (
                      <Badge variant="secondary" className="ml-2">
                        {typeCounts.scheduled}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="interview">
                  <div className="flex items-center justify-between w-full">
                    <span>Interview</span>
                    {typeCounts.interview && (
                      <Badge variant="secondary" className="ml-2">
                        {typeCounts.interview}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="team">
                  <div className="flex items-center justify-between w-full">
                    <span>Team</span>
                    {typeCounts.team && (
                      <Badge variant="secondary" className="ml-2">
                        {typeCounts.team}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Sort */}
          {allowSorting && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {getSortIcon(sortField) || <SortAsc className="h-4 w-4" />}
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toggleSort('date')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Date
                  {getSortIcon('date')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('title')}>
                  <span className="h-4 w-4 mr-2 flex items-center justify-center text-xs font-bold">A</span>
                  Title
                  {getSortIcon('title')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('duration')}>
                  <Clock className="h-4 w-4 mr-2" />
                  Duration
                  {getSortIcon('duration')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('participants')}>
                  <Users className="h-4 w-4 mr-2" />
                  Participants
                  {getSortIcon('participants')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing {filteredAndSortedMeetings.length} of {meetings.length} meetings</span>
          {searchQuery && (
            <Badge variant="outline">Search: "{searchQuery}"</Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="outline">Status: {statusFilter}</Badge>
          )}
          {typeFilter !== 'all' && (
            <Badge variant="outline">Type: {typeFilter}</Badge>
          )}
        </div>
      )}

      {/* Meeting List */}
      {filteredAndSortedMeetings.length === 0 ? (
        <div className="text-center py-12">
          <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground">{emptyDescription}</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
          : 'space-y-4'
        }>
          {filteredAndSortedMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onJoin={onJoin}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewRecording={onViewRecording}
              onDownloadRecording={onDownloadRecording}
              showActions={showActions}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
}