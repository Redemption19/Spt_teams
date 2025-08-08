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
    <Card className="card-enhanced w-full max-w-4xl mx-auto">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-foreground text-lg sm:text-xl">
          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <span className="truncate">Request Leave</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm sm:text-base">
          Submit a new leave request for approval
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Employee Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee-name" className="text-sm font-medium">Your Name</Label>
              <Input
                id="employee-name"
                value={employeeName}
                disabled
                className="bg-muted h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-email" className="text-sm font-medium">Your Email</Label>
              <Input
                id="employee-email"
                value={employeeEmail}
                disabled
                className="bg-muted h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Leave Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="leave-type" className="text-sm font-medium">Leave Type *</Label>
            <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
              <SelectTrigger className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium">Start Date *</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium">End Date *</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || format(new Date(), 'yyyy-MM-dd')}
                className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Days Calculation */}
          {days > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm sm:text-base font-medium">
                  Total Days: {days} {days === 1 ? 'day' : 'days'}
                </span>
              </div>
              {selectedType && days > selectedType.maxDays && (
                <Badge variant="destructive" className="w-fit">
                  Exceeds limit ({selectedType.maxDays} days)
                </Badge>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">Reason for Leave *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a detailed reason for your leave request..."
              className="border-border/50 focus:border-primary min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-none"
              maxLength={500}
            />
            <p className="text-xs sm:text-sm text-muted-foreground">
              {reason.length}/500 characters
            </p>
          </div>

          {/* Emergency Toggle */}
          <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border border-border/50">
            <Switch
              id="emergency"
              checked={emergency}
              onCheckedChange={setEmergency}
              className="data-[state=checked]:bg-orange-500"
            />
            <Label htmlFor="emergency" className="flex items-center gap-2 cursor-pointer">
              <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <span className="text-sm sm:text-base font-medium">Emergency Leave</span>
            </Label>
          </div>

          {emergency && (
            <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-sm sm:text-base text-orange-800 dark:text-orange-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Emergency leave requests will be prioritized for faster processing.</span>
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-border/50">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="h-10 sm:h-11 text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || !selectedLeaveType || !startDate || !endDate || !reason.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 sm:h-11 text-sm sm:text-base order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="hidden sm:inline">Submitting...</span>
                  <span className="sm:hidden">Submit</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">Submit Request</span>
                  <span className="sm:hidden">Submit</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}