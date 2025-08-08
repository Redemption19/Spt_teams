import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Star,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  ExternalLink
} from 'lucide-react';
import { Candidate, Interview } from '@/lib/recruitment-service';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CandidatesListProps {
  candidates: Candidate[];
  interviews?: Interview[];
  loading?: boolean;
  onEdit?: (candidate: Candidate) => void;
  onDelete?: (candidateId: string) => void;
  onView?: (candidate: Candidate) => void;
  onStatusChange?: (candidateId: string, status: Candidate['status']) => void;
  onScheduleInterview?: (candidate: Candidate) => void;
}

export default function CandidatesList({ 
  candidates, 
  interviews = [],
  loading = false, 
  onEdit, 
  onDelete, 
  onView,
  onStatusChange,
  onScheduleInterview
}: CandidatesListProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);

  // Get interviews for a specific candidate
  const getCandidateInterviews = (candidateId: string) => {
    console.log('Getting interviews for candidate:', candidateId);
    console.log('Available interviews:', interviews);
    const candidateInterviews = interviews.filter(interview => interview.candidateId === candidateId);
    console.log('Filtered interviews for candidate:', candidateInterviews);
    return candidateInterviews;
  };

  // Get the next scheduled interview for a candidate
  const getNextInterview = (candidateId: string) => {
    const candidateInterviews = getCandidateInterviews(candidateId)
      .filter(interview => interview.status === 'scheduled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return candidateInterviews[0] || null;
  };

  const getStatusBadge = (status: Candidate['status']) => {
    const statusConfig = {
      'applied': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FileText, label: 'Applied' },
      'new': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FileText, label: 'New' },
      'in-review': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Search, label: 'In Review' },
      'screening': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Search, label: 'Screening' },
      'interview': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: MessageSquare, label: 'Interview' },
      'interview-scheduled': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Calendar, label: 'Interview Scheduled' },
      'interviewed': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: MessageSquare, label: 'Interviewed' },
      'offer': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Award, label: 'Offer' },
      'offered': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Award, label: 'Offered' },
      'hired': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Hired' },
      'rejected': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Rejected' },
      'withdrawn': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle, label: 'Withdrawn' }
    };
    
    const config = statusConfig[status] || statusConfig.applied;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getScoreBadge = (score?: number) => {
    if (!score) return null;
    
    let color = 'bg-gray-100 text-gray-800 border-gray-200';
    if (score >= 90) color = 'bg-green-100 text-green-800 border-green-200';
    else if (score >= 80) color = 'bg-blue-100 text-blue-800 border-blue-200';
    else if (score >= 70) color = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    else color = 'bg-red-100 text-red-800 border-red-200';
    
    return (
      <Badge variant="outline" className={color}>
        <Star className="w-3 h-3 mr-1" />
        {score}/100
      </Badge>
    );
  };

  const renderInterviewInfo = (candidateId: string) => {
    const candidateInterviews = getCandidateInterviews(candidateId);
    const nextInterview = getNextInterview(candidateId);
    
    if (candidateInterviews.length === 0) {
      return null;
    }

    return (
      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Interviews ({candidateInterviews.length})
          </span>
        </div>
        
        {nextInterview && (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-green-700 dark:text-green-300">Next Interview:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(nextInterview.date), 'MMM dd, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {nextInterview.time}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {nextInterview.interviewer}
              </span>
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {nextInterview.type}
                </Badge>
              </span>
            </div>
            {nextInterview.location && (
              <div className="text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {nextInterview.location}
                </span>
              </div>
            )}
          </div>
        )}
        
        {candidateInterviews.length > 1 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {candidateInterviews.filter(i => i.status === 'completed').length} completed, 
            {candidateInterviews.filter(i => i.status === 'scheduled').length} scheduled
          </div>
        )}
      </div>
    );
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Debug logging
  console.log('Candidates:', candidates.map(c => ({ id: c.id, name: c.name })));
  console.log('Interviews prop:', interviews);
  console.log('Filtered candidates:', filteredCandidates.map(c => ({ id: c.id, name: c.name })));

  const handleDelete = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (candidateToDelete && onDelete) {
      try {
        await onDelete(candidateToDelete.id);
        toast({
          title: 'Candidate Deleted',
          description: 'The candidate has been deleted successfully.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete candidate. Please try again.',
          variant: 'destructive'
        });
      }
    }
    setDeleteDialogOpen(false);
    setCandidateToDelete(null);
  };

  const handleStatusChange = async (candidateId: string, newStatus: Candidate['status']) => {
    if (onStatusChange) {
      try {
        await onStatusChange(candidateId, newStatus);
        toast({
          title: 'Status Updated',
          description: 'Candidate status has been updated successfully.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update candidate status. Please try again.',
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
      {/* Filters */}
      <Card className="card-enhanced">
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                <Input
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px] h-9 sm:h-10 text-sm">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredCandidates.length === 0 ? (
          <Card className="card-enhanced">
            <CardContent className="p-6 sm:p-8 md:p-12 text-center">
              <User className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No Candidates Found</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'No candidates have applied yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="card-enhanced hover:card-hover-enhanced transition-all duration-200">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-base sm:text-lg font-semibold truncate">{candidate.name}</h3>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {getStatusBadge(candidate.status)}
                        {getScoreBadge(candidate.score)}
                        {getNextInterview(candidate.id) && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Interview Scheduled</span>
                            <span className="sm:hidden">Scheduled</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1 sm:gap-2 truncate">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">{candidate.email}</span>
                      </span>
                      <span className="flex items-center gap-1 sm:gap-2 truncate">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">{candidate.phone}</span>
                      </span>
                      <span className="flex items-center gap-1 sm:gap-2 truncate">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">{candidate.location}</span>
                      </span>
                      <span className="flex items-center gap-1 sm:gap-2 truncate">
                        <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">{candidate.experience} years exp.</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm mb-3">
                      <span className="flex items-center gap-1 sm:gap-2 truncate">
                        <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">{candidate.education}</span>
                      </span>
                      <span className="flex items-center gap-1 sm:gap-2 truncate">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">Applied {format(candidate.appliedDate, 'MMM dd, yyyy')}</span>
                      </span>
                    </div>
                    
                    {candidate.notes && (
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
                        <strong>Notes:</strong> {candidate.notes}
                      </p>
                    )}
                    
                    {candidate.tags && candidate.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                        {candidate.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Interview Information */}
                    {renderInterviewInfo(candidate.id)}
                  </div>
                  
                  <div className="flex flex-col lg:items-end gap-3 lg:ml-6 shrink-0">
                    <div className="flex flex-wrap gap-2">
                      {onView && (
                        <Button variant="outline" size="sm" onClick={() => onView(candidate)} className="h-8 sm:h-9 text-xs sm:text-sm">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">View</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                      )}
                      {onEdit && (
                        <Button variant="outline" size="sm" onClick={() => onEdit(candidate)} className="h-8 sm:h-9 text-xs sm:text-sm">
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                          <span className="sm:hidden">Edit</span>
                        </Button>
                      )}
                      {onScheduleInterview && candidate.status !== 'hired' && candidate.status !== 'rejected' && (
                        <Button variant="outline" size="sm" onClick={() => onScheduleInterview(candidate)} className="h-8 sm:h-9 text-xs sm:text-sm">
                          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Interview</span>
                          <span className="sm:hidden">Interview</span>
                        </Button>
                      )}
                      {onDelete && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(candidate)}
                          className="h-8 sm:h-9 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Delete</span>
                          <span className="sm:hidden">Delete</span>
                        </Button>
                      )}
                    </div>
                    
                    {onStatusChange && (
                      <Select 
                        value={candidate.status} 
                        onValueChange={(value: Candidate['status']) => handleStatusChange(candidate.id, value)}
                      >
                        <SelectTrigger className="w-full sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="screening">Screening</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Candidate</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{candidateToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Candidate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}