import { useState } from 'react';
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
import { Candidate } from '@/lib/recruitment-service';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CandidatesListProps {
  candidates: Candidate[];
  loading?: boolean;
  onEdit?: (candidate: Candidate) => void;
  onDelete?: (candidateId: string) => void;
  onView?: (candidate: Candidate) => void;
  onStatusChange?: (candidateId: string, status: Candidate['status']) => void;
  onScheduleInterview?: (candidate: Candidate) => void;
}

export default function CandidatesList({ 
  candidates, 
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

  const getStatusBadge = (status: Candidate['status']) => {
    const statusConfig = {
      'applied': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FileText, label: 'Applied' },
      'screening': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Search, label: 'Screening' },
      'interview': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: MessageSquare, label: 'Interview' },
      'offer': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Award, label: 'Offer' },
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

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="ml-6">
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
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
      <div className="space-y-4">
        {filteredCandidates.length === 0 ? (
          <Card className="card-enhanced">
            <CardContent className="p-12 text-center">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Candidates Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'No candidates have applied yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="card-enhanced hover:card-hover-enhanced transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{candidate.name}</h3>
                      {getStatusBadge(candidate.status)}
                      {getScoreBadge(candidate.score)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {candidate.email}
                      </span>
                      <span className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {candidate.phone}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {candidate.location}
                      </span>
                      <span className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {candidate.experience} years exp.
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                      <span className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        {candidate.education}
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Applied {format(candidate.appliedDate, 'MMM dd, yyyy')}
                      </span>
                    </div>
                    
                    {candidate.notes && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        <strong>Notes:</strong> {candidate.notes}
                      </p>
                    )}
                    
                    {candidate.tags && candidate.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {candidate.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-6">
                    <div className="flex items-center gap-2">
                      {onView && (
                        <Button variant="outline" size="sm" onClick={() => onView(candidate)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      )}
                      {onEdit && (
                        <Button variant="outline" size="sm" onClick={() => onEdit(candidate)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {onScheduleInterview && candidate.status !== 'hired' && candidate.status !== 'rejected' && (
                        <Button variant="outline" size="sm" onClick={() => onScheduleInterview(candidate)}>
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Interview
                        </Button>
                      )}
                      {onDelete && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(candidate)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                    
                    {onStatusChange && (
                      <Select 
                        value={candidate.status} 
                        onValueChange={(value: Candidate['status']) => handleStatusChange(candidate.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
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
              Are you sure you want to delete "{candidateToDelete?.name}"? This action cannot be undone.
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