'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LeaveService, LeaveType } from '@/lib/leave-service';
import { EmployeeService } from '@/lib/employee-service';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';

interface EmployeeLeaveRequestFormProps {
  workspaceId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EmployeeLeaveRequestForm({
  workspaceId,
  employeeId,
  employeeName,
  employeeEmail,
  onSuccess,
  onCancel
}: EmployeeLeaveRequestFormProps) {
  // Debug logging
  console.log('EmployeeLeaveRequestForm props:', {
    workspaceId,
    employeeId,
    employeeName,
    employeeEmail
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [emergency, setEmergency] = useState(false);
  const [days, setDays] = useState<number>(0);
  const [leaveBalance, setLeaveBalance] = useState<number>(0);

  // Load leave types and employee data
  useEffect(() => {
    const loadData = async () => {
      try {
        const types = await LeaveService.getLeaveTypes(workspaceId);
        setLeaveTypes(types.filter(type => type.isActive));
      } catch (error) {
        console.error('Error loading leave types:', error);
        toast({
          title: 'Error',
          description: 'Failed to load leave types. Please try again.',
          variant: 'destructive'
        });
      }
    };

    loadData();
  }, [workspaceId, toast]);

  // Calculate days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const calculatedDays = differenceInDays(end, start) + 1;
      setDays(Math.max(0, calculatedDays));
    } else {
      setDays(0);
    }
  }, [startDate, endDate]);

  // Set minimum end date based on start date
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    if (endDate && date > endDate) {
      setEndDate(date);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLeaveType || !startDate || !endDate || !reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    if (days <= 0) {
      toast({
        title: 'Validation Error',
        description: 'End date must be after start date.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const leaveType = leaveTypes.find(lt => lt.id === selectedLeaveType);
      if (!leaveType) {
        throw new Error('Selected leave type not found');
      }

      await LeaveService.createLeaveRequest({
        employeeId,
        employeeName,
        workspaceId,
        leaveTypeId: selectedLeaveType,
        startDate,
        endDate,
        reason: reason.trim(),
        emergency
      });

      toast({
        title: 'Success',
        description: `Leave request submitted successfully for ${days} days.`,
        variant: 'default'
      });

      // Reset form
      setSelectedLeaveType('');
      setStartDate('');
      setEndDate('');
      setReason('');
      setEmergency(false);
      setDays(0);

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit leave request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedType = leaveTypes.find(lt => lt.id === selectedLeaveType);

  return (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          <span>Request Leave</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Submit a new leave request for approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee-name">Your Name</Label>
              <Input
                id="employee-name"
                value={employeeName}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="employee-email">Your Email</Label>
              <Input
                id="employee-email"
                value={employeeEmail}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* Leave Type Selection */}
          <div>
            <Label htmlFor="leave-type">Leave Type *</Label>
            <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
              <SelectTrigger className="border-border/50 focus:border-primary">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={type.color}
                        variant="outline"
                      >
                        {type.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ({type.maxDays} days max)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedType.description}
              </p>
            )}
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date *</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="border-border/50 focus:border-primary"
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date *</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || format(new Date(), 'yyyy-MM-dd')}
                className="border-border/50 focus:border-primary"
              />
            </div>
          </div>

          {/* Days Calculation */}
          {days > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Total Days: {days} {days === 1 ? 'day' : 'days'}
              </span>
              {selectedType && days > selectedType.maxDays && (
                <Badge variant="destructive" className="ml-auto">
                  Exceeds limit ({selectedType.maxDays} days)
                </Badge>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason for Leave *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a detailed reason for your leave request..."
              className="border-border/50 focus:border-primary min-h-[100px]"
              maxLength={500}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {reason.length}/500 characters
            </p>
          </div>

          {/* Emergency Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="emergency"
              checked={emergency}
              onCheckedChange={setEmergency}
            />
            <Label htmlFor="emergency" className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span>Emergency Leave</span>
            </Label>
          </div>

          {emergency && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Emergency leave requests will be prioritized for faster processing.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || !selectedLeaveType || !startDate || !endDate || !reason.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 