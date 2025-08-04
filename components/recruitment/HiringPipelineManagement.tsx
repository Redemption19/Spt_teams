import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Plus,
  Edit,
  Trash2,
  Users,
  ArrowRight,
  Settings,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  UserPlus,
  Filter,
  Search,
  MoreHorizontal,
  GripVertical,
  Palette,
  Hash,
  FileText,
  Calendar,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { HiringPipeline, PipelineStage, Candidate, JobPosting } from '@/lib/recruitment-service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface HiringPipelineManagementProps {
  pipelines: HiringPipeline[];
  candidates: Candidate[];
  jobPostings: JobPosting[];
  loading?: boolean;
  onCreatePipeline?: (data: Partial<HiringPipeline>) => void;
  onUpdatePipeline?: (pipelineId: string, data: Partial<HiringPipeline>) => void;
  onDeletePipeline?: (pipelineId: string) => void;
  onUpdateCandidateStatus?: (candidateId: string, newStatus: string) => void;
}

export default function HiringPipelineManagement({ 
  pipelines, 
  candidates, 
  jobPostings, 
  loading = false,
  onCreatePipeline,
  onUpdatePipeline,
  onDeletePipeline,
  onUpdateCandidateStatus
}: HiringPipelineManagementProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPipeline, setSelectedPipeline] = useState<HiringPipeline | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [pipelineForm, setPipelineForm] = useState({
    name: '',
    stages: [] as PipelineStage[],
    isDefault: false
  });

  const defaultStages: PipelineStage[] = [
    { id: 'applied', name: 'Applied', order: 1, color: '#3B82F6', description: 'Candidates who have applied' },
    { id: 'screening', name: 'Screening', order: 2, color: '#F59E0B', description: 'Initial screening phase' },
    { id: 'interview', name: 'Interview', order: 3, color: '#8B5CF6', description: 'Interview process' },
    { id: 'offer', name: 'Offer', order: 4, color: '#10B981', description: 'Offer extended' },
    { id: 'hired', name: 'Hired', order: 5, color: '#059669', description: 'Successfully hired' },
    { id: 'rejected', name: 'Rejected', order: 6, color: '#EF4444', description: 'Not selected' }
  ];

  const getStatusBadge = (status: Candidate['status']) => {
    const statusConfig = {
      'applied': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FileText, label: 'Applied' },
      'screening': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Screening' },
      'interview': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Users, label: 'Interview' },
      'offer': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Offer' },
      'hired': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: UserPlus, label: 'Hired' },
      'rejected': { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, label: 'Rejected' },
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

  const getCandidatesByStatus = (status: string) => {
    return candidates.filter(candidate => candidate.status === status);
  };

  const handleCreatePipeline = async () => {
    if (!pipelineForm.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a pipeline name.',
        variant: 'destructive'
      });
      return;
    }

    if (onCreatePipeline) {
      try {
        await onCreatePipeline({
          ...pipelineForm,
          stages: pipelineForm.stages.length > 0 ? pipelineForm.stages : defaultStages
        });
        setShowCreateDialog(false);
        setPipelineForm({ name: '', stages: [], isDefault: false });
        toast({
          title: 'Pipeline Created',
          description: 'The hiring pipeline has been created successfully.',
        });
      } catch (error) {
        toast({
          title: 'Creation Failed',
          description: 'Failed to create pipeline. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleUpdatePipeline = async () => {
    if (!selectedPipeline || !pipelineForm.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a pipeline name.',
        variant: 'destructive'
      });
      return;
    }

    if (onUpdatePipeline) {
      try {
        await onUpdatePipeline(selectedPipeline.id, pipelineForm);
        setShowEditDialog(false);
        setSelectedPipeline(null);
        setPipelineForm({ name: '', stages: [], isDefault: false });
        toast({
          title: 'Pipeline Updated',
          description: 'The hiring pipeline has been updated successfully.',
        });
      } catch (error) {
        toast({
          title: 'Update Failed',
          description: 'Failed to update pipeline. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleDeletePipeline = async (pipeline: HiringPipeline) => {
    if (onDeletePipeline) {
      try {
        await onDeletePipeline(pipeline.id);
        toast({
          title: 'Pipeline Deleted',
          description: 'The hiring pipeline has been deleted successfully.',
        });
      } catch (error) {
        toast({
          title: 'Deletion Failed',
          description: 'Failed to delete pipeline. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleMoveCandidate = async (candidateId: string, newStatus: string) => {
    if (onUpdateCandidateStatus) {
      try {
        await onUpdateCandidateStatus(candidateId, newStatus);
        toast({
          title: 'Candidate Moved',
          description: 'Candidate has been moved to the new stage.',
        });
      } catch (error) {
        toast({
          title: 'Move Failed',
          description: 'Failed to move candidate. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const jobPosting = jobPostings.find(j => j.id === candidate.jobPostingId);
    return (
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobPosting?.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="card-enhanced">
              <CardContent className="p-6">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-16 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activePipeline = selectedPipeline || pipelines.find(p => p.isDefault) || pipelines[0];
  const pipelineStages = activePipeline?.stages || defaultStages;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hiring Pipeline</h2>
          <p className="text-muted-foreground">
            Manage candidate progression through your hiring process
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select 
            value={activePipeline?.id || ''} 
            onValueChange={(value) => {
              const pipeline = pipelines.find(p => p.id === value);
              setSelectedPipeline(pipeline || null);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <Settings className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.name} {pipeline.isDefault && '(Default)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Pipeline
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
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
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Stages */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {pipelineStages.map((stage) => {
          const stageCandidates = getCandidatesByStatus(stage.id);
          const filteredStageCandidates = stageCandidates.filter(candidate => {
            const jobPosting = jobPostings.find(j => j.id === candidate.jobPostingId);
            return (
              candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
              jobPosting?.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
          });

          return (
            <Card key={stage.id} className="card-enhanced">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: stage.color }}
                    />
                    {stage.name}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {filteredStageCandidates.length}
                  </Badge>
                </div>
                {stage.description && (
                  <CardDescription className="text-xs">
                    {stage.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {filteredStageCandidates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No candidates</p>
                    </div>
                  ) : (
                    filteredStageCandidates.map((candidate) => {
                      const jobPosting = jobPostings.find(j => j.id === candidate.jobPostingId);
                      const nextStage = pipelineStages.find(s => s.order === stage.order + 1);
                      
                      return (
                        <Card key={candidate.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium truncate">{candidate.name}</h4>
                                <p className="text-xs text-muted-foreground truncate">{candidate.email}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {jobPosting?.title || 'Unknown Position'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {candidate.score && (
                                  <Badge variant="outline" className="text-xs">
                                    {candidate.score}/10
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{format(candidate.appliedDate, 'MMM dd')}</span>
                              {nextStage && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleMoveCandidate(candidate.id, nextStage.id)}
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Pipeline Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Hiring Pipeline</DialogTitle>
            <DialogDescription>
              Create a new hiring pipeline with custom stages
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pipeline Name *</Label>
              <Input
                id="name"
                value={pipelineForm.name}
                onChange={(e) => setPipelineForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Software Engineer Pipeline"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Default Stages</Label>
              <div className="space-y-2">
                {defaultStages.map((stage) => (
                  <div key={stage.id} className="flex items-center gap-3 p-2 border rounded">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-sm font-medium">{stage.name}</span>
                    <span className="text-xs text-muted-foreground">{stage.description}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={pipelineForm.isDefault}
                onChange={(e) => setPipelineForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isDefault" className="text-sm">
                Set as default pipeline
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePipeline}>
              Create Pipeline
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Pipeline Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Hiring Pipeline</DialogTitle>
            <DialogDescription>
              Modify the hiring pipeline settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Pipeline Name *</Label>
              <Input
                id="editName"
                value={pipelineForm.name}
                onChange={(e) => setPipelineForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Software Engineer Pipeline"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Pipeline Stages</Label>
              <div className="space-y-2">
                {pipelineForm.stages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center gap-3 p-2 border rounded">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-sm font-medium">{stage.name}</span>
                    <span className="text-xs text-muted-foreground">{stage.description}</span>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsDefault"
                checked={pipelineForm.isDefault}
                onChange={(e) => setPipelineForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="editIsDefault" className="text-sm">
                Set as default pipeline
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePipeline}>
              Update Pipeline
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 