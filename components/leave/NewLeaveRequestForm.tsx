'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  User,
  Building,
  Loader2
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { LeaveService, CreateLeaveRequestData } from '@/lib/leave-service';
import { UserService } from '@/lib/user-service';

interface NewLeaveRequestFormProps {
  workspaceId?: string;
  allWorkspaces?: any[];
  shouldShowCrossWorkspace?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function NewLeaveRequestForm({
  workspaceId,
  allWorkspaces = [],
  shouldShowCrossWorkspace = false,
  onSuccess,
  onCancel
}: NewLeaveRequestFormProps) {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    reason: '',
    emergency: false
  });

  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');

  // Load employees and leave types
  useEffect(() => {
    const loadFormData = async () => {
      if (!workspaceId) return;

      try {
        setLoading(true);
        const targetWorkspaceId = shouldShowCrossWorkspace && selectedWorkspace ? selectedWorkspace : workspaceId;

        const [workspaceUsers, workspaceLeaveTypes] = await Promise.all([
          UserService.getUsersByWorkspace(targetWorkspaceId),
          LeaveService.getLeaveTypes(targetWorkspaceId)
        ]);

        setUsers(workspaceUsers);
        setLeaveTypes(workspaceLeaveTypes);
      } catch (error) {
        console.error('Error loading form data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load form data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [workspaceId, shouldShowCrossWorkspace, selectedWorkspace, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.leaveTypeId || !formData.startDate || !formData.endDate || !formData.reason) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);

      const selectedUser = users.find(user => user.id === formData.employeeId);
      const selectedLeaveType = leaveTypes.find(type => type.id === formData.leaveTypeId);

      if (!selectedUser || !selectedLeaveType) {
        toast({
          title: 'Error',
          description: 'Invalid user or leave type selected.',
          variant: 'destructive'
        });
        return;
      }

      const targetWorkspaceId = shouldShowCrossWorkspace && selectedWorkspace ? selectedWorkspace : workspaceId;

      const leaveRequestData: CreateLeaveRequestData = {
        employeeId: formData.employeeId,
        employeeName: `${selectedUser.firstName || selectedUser.name} ${selectedUser.lastName || ''}`,
        workspaceId: targetWorkspaceId!,
        leaveTypeId: formData.leaveTypeId,
        startDate: format(formData.startDate!, 'yyyy-MM-dd'),
        endDate: format(formData.endDate!, 'yyyy-MM-dd'),
        reason: formData.reason,
        emergency: formData.emergency
      };

      await LeaveService.createLeaveRequest(leaveRequestData);

      toast({
        title: 'Success',
        description: 'Leave request submitted successfully.',
      });

      setFormData({
        employeeId: '',
        leaveTypeId: '',
        startDate: undefined,
        endDate: undefined,
        reason: '',
        emergency: false
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit leave request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      return differenceInDays(formData.endDate, formData.startDate) + 1;
    }
    return 0;
  };

  if (loading) {
    return (
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 w-full bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-enhanced max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-foreground">New Leave Request</CardTitle>
        <CardDescription className="text-muted-foreground">
          Submit a new leave request for approval
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Workspace Selection */}
          {shouldShowCrossWorkspace && allWorkspaces.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="workspace">Workspace</Label>
              <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                <SelectTrigger className="border-border/50 focus:border-primary">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  {allWorkspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        {workspace.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Employee and Leave Type Selection - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select 
                value={formData.employeeId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger className="border-border/50 focus:border-primary">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{user.firstName || user.name} {user.lastName || ''}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select 
                value={formData.leaveTypeId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, leaveTypeId: value }))}
              >
                <SelectTrigger className="border-border/50 focus:border-primary">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {type.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ({type.maxDays} days max)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Selection - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-border/50 focus:border-primary"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-border/50 focus:border-primary"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                    initialFocus
                    disabled={(date) => 
                      date < new Date() || 
                      (formData.startDate ? date < formData.startDate : false)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Days calculation */}
          {calculateDays() > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Duration: {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Reason - Full Width */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Leave Request *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for your leave request..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="border-border/50 focus:border-primary min-h-[100px]"
              rows={4}
            />
          </div>

          {/* Emergency checkbox and Form Actions - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="emergency"
                checked={formData.emergency}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emergency: checked as boolean }))}
              />
              <Label htmlFor="emergency" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                Emergency leave request
              </Label>
            </div>

            <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="border-border/50 hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 