import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, Edit, Trash2, Users, CheckCircle, Clock, UserPlus, 
  Search, Filter, Calendar, FileText, Building, Award, 
  Target, TrendingUp, UserCheck, Eye
} from 'lucide-react';
import { Candidate, JobPosting } from '@/lib/recruitment-service';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface OnboardingEmployee {
  id: string;
  candidateId: string;
  employeeId: string;
  name: string;
  email: string;
  position: string;
  department: string;
  startDate: Date;
  status: 'pending' | 'active' | 'completed' | 'on-hold';
  progress: number;
  mentor?: string;
  buddy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OnboardingManagementProps {
  employees: OnboardingEmployee[];
  candidates: Candidate[];
  jobPostings: JobPosting[];
  loading?: boolean;
  onCreateOnboarding?: (data: Partial<OnboardingEmployee>) => void;
  onUpdateOnboarding?: (employeeId: string, data: Partial<OnboardingEmployee>) => void;
  onDeleteOnboarding?: (employeeId: string) => void;
}

export default function OnboardingManagement({ 
  employees, 
  candidates, 
  jobPostings, 
  loading = false,
  onCreateOnboarding,
  onUpdateOnboarding,
  onDeleteOnboarding
}: OnboardingManagementProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({
    candidateId: '',
    employeeId: '',
    startDate: new Date(),
    mentor: '',
    buddy: '',
    notes: ''
  });

  const statusConfig = {
    'pending': { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Pending' },
    'active': { color: 'bg-blue-100 text-blue-800', icon: UserCheck, label: 'Active' },
    'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
    'on-hold': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'On Hold' }
  };

  const getStatusBadge = (status: OnboardingEmployee['status']) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateOnboarding = async () => {
    if (!onboardingForm.candidateId || !onboardingForm.employeeId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    if (onCreateOnboarding) {
      try {
        await onCreateOnboarding(onboardingForm);
        setShowCreateDialog(false);
        setOnboardingForm({
          candidateId: '',
          employeeId: '',
          startDate: new Date(),
          mentor: '',
          buddy: '',
          notes: ''
        });
        toast({
          title: 'Onboarding Created',
          description: 'Employee onboarding has been created successfully.',
        });
      } catch (error) {
        toast({
          title: 'Creation Failed',
          description: 'Failed to create onboarding. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

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
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-2 w-full bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Onboarding Management</h2>
          <p className="text-muted-foreground">
            Track and manage new employee onboarding processes
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Start Onboarding
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Onboarding</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {employees.filter(e => e.status === 'active').length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {employees.filter(e => e.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">
                  {employees.length > 0 
                    ? Math.round(employees.reduce((sum, e) => sum + e.progress, 0) / employees.length)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employees List */}
      <div className="space-y-4">
        {filteredEmployees.length === 0 ? (
          <Card className="card-enhanced">
            <CardContent className="p-12 text-center">
              <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Onboarding Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first onboarding process.'}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Start Onboarding
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredEmployees.map((employee) => (
            <Card key={employee.id} className="card-enhanced hover:card-hover-enhanced transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{employee.name}</h3>
                      {getStatusBadge(employee.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        {employee.position}
                      </span>
                      <span className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        {employee.department}
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(employee.startDate, 'MMM dd, yyyy')}
                      </span>
                      <span className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        {employee.employeeId}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Onboarding Progress</span>
                        <span className="text-sm text-muted-foreground">{employee.progress}%</span>
                      </div>
                      <Progress value={employee.progress} className="h-2" />
                    </div>
                    
                    {employee.mentor && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Mentor:</span> {employee.mentor}
                        {employee.buddy && (
                          <span className="ml-4">
                            <span className="font-medium">Buddy:</span> {employee.buddy}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-6">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Onboarding Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Start Employee Onboarding</DialogTitle>
            <DialogDescription>
              Create a new onboarding process for a hired candidate
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="candidate">Hired Candidate *</Label>
                <Select value={onboardingForm.candidateId} onValueChange={(value) => setOnboardingForm(prev => ({ ...prev, candidateId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.filter(c => c.status === 'hired').map((candidate) => {
                      const jobPosting = jobPostings.find(j => j.id === candidate.jobId);
                      return (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {candidate.name} - {jobPosting?.title || 'Unknown Position'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input
                  id="employeeId"
                  value={onboardingForm.employeeId}
                  onChange={(e) => setOnboardingForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  placeholder="e.g., EMP001"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={format(onboardingForm.startDate, 'yyyy-MM-dd')}
                onChange={(e) => setOnboardingForm(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mentor">Mentor</Label>
                <Input
                  id="mentor"
                  value={onboardingForm.mentor}
                  onChange={(e) => setOnboardingForm(prev => ({ ...prev, mentor: e.target.value }))}
                  placeholder="Mentor name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buddy">Buddy</Label>
                <Input
                  id="buddy"
                  value={onboardingForm.buddy}
                  onChange={(e) => setOnboardingForm(prev => ({ ...prev, buddy: e.target.value }))}
                  placeholder="Buddy name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={onboardingForm.notes}
                onChange={(e) => setOnboardingForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes for onboarding..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOnboarding}>
              Start Onboarding
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}