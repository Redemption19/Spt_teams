import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  MapPin, 
  Coffee,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { AttendanceRecord, AttendanceService } from '@/lib/attendance-service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { format } from 'date-fns';

interface ClockInOutProps {
  employeeId: string;
  employeeName: string;
  onAttendanceChange?: () => Promise<void>;
}

export function ClockInOut({ employeeId, employeeName, onAttendanceChange }: ClockInOutProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadTodayRecord = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    
    try {
      setLoading(true);
      const record = await AttendanceService.getTodayAttendance(employeeId, currentWorkspace.id);
      setTodayRecord(record);
      
      if (record?.location) {
        setLocation(record.location);
      }
      if (record?.notes) {
        setNotes(record.notes);
      }
    } catch (error) {
      console.error('Error loading today record:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance record. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [employeeId, currentWorkspace?.id, toast]);

  useEffect(() => {
    loadTodayRecord();
  }, [loadTodayRecord]);

  const handleClockIn = async () => {
    if (!currentWorkspace?.id || !user?.uid) return;
    
    if (!location.trim()) {
      toast({
        title: 'Location Required',
        description: 'Please enter your location before clocking in.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      
      await AttendanceService.clockIn({
        employeeId,
        employeeName,
        workspaceId: currentWorkspace.id,
        location: location.trim(),
        notes: notes.trim(),
        createdBy: user.uid
      });

      toast({
        title: 'Success',
        description: 'Successfully clocked in!',
      });

      await loadTodayRecord();
      if (onAttendanceChange) {
        await onAttendanceChange();
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      toast({
        title: 'Error',
        description: 'Failed to clock in. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentWorkspace?.id || !user?.uid || !todayRecord) return;

    try {
      setSubmitting(true);
      
      await AttendanceService.clockOut(employeeId, currentWorkspace.id, {
        location: location.trim(),
        notes: notes.trim(),
        updatedBy: user.uid
      });

      toast({
        title: 'Success',
        description: 'Successfully clocked out!',
      });

      await loadTodayRecord();
      if (onAttendanceChange) {
        await onAttendanceChange();
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      toast({
        title: 'Error',
        description: 'Failed to clock out. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartBreak = async () => {
    if (!currentWorkspace?.id || !user?.uid || !todayRecord) return;

    try {
      setSubmitting(true);
      
      await AttendanceService.startBreak(employeeId, currentWorkspace.id, {
        updatedBy: user.uid
      });

      toast({
        title: 'Success',
        description: 'Break started!',
      });

      await loadTodayRecord();
      if (onAttendanceChange) {
        await onAttendanceChange();
      }
    } catch (error) {
      console.error('Error starting break:', error);
      toast({
        title: 'Error',
        description: 'Failed to start break. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndBreak = async () => {
    if (!currentWorkspace?.id || !user?.uid || !todayRecord) return;

    try {
      setSubmitting(true);
      
      await AttendanceService.endBreak(employeeId, currentWorkspace.id, {
        updatedBy: user.uid
      });

      toast({
        title: 'Success',
        description: 'Break ended!',
      });

      await loadTodayRecord();
      if (onAttendanceChange) {
        await onAttendanceChange();
      }
    } catch (error) {
      console.error('Error ending break:', error);
      toast({
        title: 'Error',
        description: 'Failed to end break. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = () => {
    if (!todayRecord) {
      return {
        status: 'Not Clocked In',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        icon: <Clock className="h-5 w-5" />
      };
    }

    if (todayRecord.clockIn && !todayRecord.clockOut) {
      if (todayRecord.breakStart && !todayRecord.breakEnd) {
        return {
          status: 'On Break',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20',
          icon: <Coffee className="h-5 w-5" />
        };
      }
      return {
        status: 'Clocked In',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        icon: <CheckCircle className="h-5 w-5" />
      };
    }

    return {
      status: 'Clocked Out',
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      icon: <Square className="h-5 w-5" />
    };
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <Card className="card-enhanced">
        <CardContent className="p-4 sm:p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-6"></div>
            <div className="space-y-3">
              <div className="h-11 sm:h-10 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-11 sm:h-10 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-enhanced">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center space-x-2 text-foreground text-lg sm:text-xl">
          <Clock className="h-5 w-5 text-primary" />
          <span>Clock In/Out</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Current Status */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-3 sm:p-4 rounded-lg border border-border/50">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
              <div className={statusInfo.color}>
                {statusInfo.icon}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">Current Status</p>
              <p className={`text-base sm:text-lg font-semibold ${statusInfo.color} truncate`}>{statusInfo.status}</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-muted-foreground">Current Time</p>
            <p className="text-base sm:text-lg font-mono font-semibold text-foreground">
              {format(currentTime, 'HH:mm:ss')}
            </p>
          </div>
        </div>

        {/* Employee Info */}
        <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/30">
          <p className="text-sm text-muted-foreground mb-1">Employee</p>
          <p className="text-base sm:text-lg font-semibold text-foreground break-words">{employeeName}</p>
          <p className="text-sm text-muted-foreground">
            {format(currentTime, 'EEEE, MMMM dd, yyyy')}
          </p>
        </div>

        {/* Location Input */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-foreground text-sm sm:text-base">
            <MapPin className="h-4 w-4 inline mr-2 text-primary" />
            Location
          </Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter your current location"
            className="border-border/50 focus:border-primary h-11 sm:h-10 text-base sm:text-sm"
          />
        </div>

        {/* Notes Input */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-foreground text-sm sm:text-base">
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about your work..."
            className="border-border/50 focus:border-primary text-base sm:text-sm min-h-[80px] sm:min-h-[60px]"
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!todayRecord ? (
            <Button
              onClick={handleClockIn}
              disabled={submitting || !location.trim()}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors h-11 sm:h-10 text-base sm:text-sm"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Clock In
            </Button>
          ) : todayRecord.clockIn && !todayRecord.clockOut ? (
            <>
              {todayRecord.breakStart && !todayRecord.breakEnd ? (
                <Button
                  onClick={handleEndBreak}
                  disabled={submitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white transition-colors h-11 sm:h-10 text-base sm:text-sm"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4 mr-2" />
                  )}
                  End Break
                </Button>
              ) : (
                <Button
                  onClick={handleStartBreak}
                  disabled={submitting}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white transition-colors h-11 sm:h-10 text-base sm:text-sm"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Coffee className="h-4 w-4 mr-2" />
                  )}
                  Start Break
                </Button>
              )}
              <Button
                onClick={handleClockOut}
                disabled={submitting}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground transition-colors h-11 sm:h-10 text-base sm:text-sm"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                Clock Out
              </Button>
            </>
          ) : (
            <div className="flex-1 text-center p-4 rounded-lg bg-muted/30">
              <p className="text-muted-foreground text-sm sm:text-base">Already clocked out for today</p>
            </div>
          )}
        </div>

        {/* Today's Record Summary */}
        {todayRecord && (
          <div className="p-3 sm:p-4 rounded-lg bg-muted/20 border border-border/30">
            <p className="text-sm font-medium text-foreground mb-3">Today&apos;s Record Summary</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Clock In</p>
                <p className="font-semibold text-foreground">
                  {todayRecord.clockIn || '--:--'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Clock Out</p>
                <p className="font-semibold text-foreground">
                  {todayRecord.clockOut || '--:--'}
                </p>
              </div>
              {todayRecord.breakStart && (
                <>
                  <div>
                    <p className="text-muted-foreground">Break Start</p>
                    <p className="font-semibold text-foreground">
                      {todayRecord.breakStart}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Break End</p>
                    <p className="font-semibold text-foreground">
                      {todayRecord.breakEnd || '--:--'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}