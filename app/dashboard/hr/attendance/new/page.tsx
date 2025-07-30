'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Save,
  ArrowLeft,
  Loader2,
  Building,
  AlertCircle,
  CheckCircle,
  Coffee,
  Home,
  Timer,
  ChevronUp,
  ChevronDown,
  Globe,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { AttendanceService, CreateAttendanceData } from '@/lib/attendance-service';
import { EmployeeService } from '@/lib/employee-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AttendanceFormData {
  employeeId: string;
  date: Date;
  clockIn: string;
  clockOut: string;
  breakStart: string;
  breakEnd: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'work-from-home';
  location: string;
  notes: string;
}

const statusOptions = [
  { value: 'present', label: 'Present', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' },
  { value: 'absent', label: 'Absent', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' },
  { value: 'late', label: 'Late', icon: Timer, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' },
  { value: 'half-day', label: 'Half Day', icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/20' },
  { value: 'work-from-home', label: 'Work from Home', icon: Home, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/20' }
];

const locationOptions = [
  { value: 'office', label: 'Office', icon: Building },
  { value: 'home', label: 'Home Office', icon: Home },
  { value: 'client-site', label: 'Client Site', icon: MapPin },
  { value: 'traveling', label: 'Traveling', icon: MapPin },
  { value: 'other', label: 'Other Location', icon: MapPin }
];

// Time picker component
interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  icon?: React.ReactNode;
  error?: string;
}

function TimePicker({ value, onChange, placeholder = "Select time", label, icon, error }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse current time or use current time
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hours: 0, minutes: 0, period: 'AM' };
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    return { hours, minutes, period: period || 'AM' };
  };

  const formatTime = (hours: number, minutes: number, period: string) => {
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes} ${period}`;
  };

  const currentTime = parseTime(value);
  
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ['AM', 'PM'];

  const handleTimeChange = (type: 'hours' | 'minutes' | 'period', newValue: number | string) => {
    const newTime = { ...currentTime, [type]: newValue };
    onChange(formatTime(newTime.hours, newTime.minutes, newTime.period));
  };

  const setCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    onChange(formatTime(displayHours, minutes, period));
  };

  return (
    <div className="space-y-2">
      <Label className="text-foreground flex items-center space-x-2">
        {icon}
        <span>{label}</span>
      </Label>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal border-border/50 focus:border-primary',
              !value && 'text-muted-foreground',
              error && 'border-red-500 focus:border-red-500'
            )}
          >
            <Clock className="mr-2 h-4 w-4" />
            {value || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-foreground">Select Time</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={setCurrentTime}
                className="h-6 px-2 text-xs hover:bg-accent hover:text-accent-foreground"
              >
                Now
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-1">
              {/* Hours */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hour</Label>
                <div className="border rounded-md p-1 max-h-24 overflow-y-auto">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      onClick={() => handleTimeChange('hours', hour)}
                      className={cn(
                        'w-full text-center py-1 px-1 text-xs rounded hover:bg-accent hover:text-accent-foreground transition-colors',
                        currentTime.hours === hour && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {hour.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Minute</Label>
                <div className="border rounded-md p-1 max-h-24 overflow-y-auto">
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      onClick={() => handleTimeChange('minutes', minute)}
                      className={cn(
                        'w-full text-center py-1 px-1 text-xs rounded hover:bg-accent hover:text-accent-foreground transition-colors',
                        currentTime.minutes === minute && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {minute.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Period</Label>
                <div className="border rounded-md p-1">
                  {periods.map((period) => (
                    <button
                      key={period}
                      onClick={() => handleTimeChange('period', period)}
                      className={cn(
                        'w-full text-center py-1 px-1 text-xs rounded hover:bg-accent hover:text-accent-foreground transition-colors',
                        currentTime.period === period && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-2 pt-2 border-t">
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default function NewAttendanceRecordPage() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [formData, setFormData] = useState<AttendanceFormData>({
    employeeId: '',
    date: new Date(),
    clockIn: '',
    clockOut: '',
    breakStart: '',
    breakEnd: '',
    status: 'present',
    location: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Determine if user is an owner
  const isOwner = userProfile?.role === 'owner';
  const shouldShowCrossWorkspace = isOwner && accessibleWorkspaces.length > 0;

  const loadWorkspaces = useCallback(async () => {
    if (!shouldShowCrossWorkspace) return;
    
    try {
      const workspaceData = await WorkspaceService.getUserAccessibleWorkspaces(user?.uid || '');
      const workspaces = [
        ...workspaceData.mainWorkspaces,
        ...Object.values(workspaceData.subWorkspaces).flat()
      ];
      setAllWorkspaces(workspaces);
      
      // Set default workspace to current workspace or first available
      if (currentWorkspace) {
        setSelectedWorkspace(currentWorkspace.id);
      } else if (workspaces.length > 0) {
        setSelectedWorkspace(workspaces[0].id);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  }, [shouldShowCrossWorkspace, user?.uid, currentWorkspace]);

  const loadEmployees = useCallback(async () => {
    const targetWorkspaceId = selectedWorkspace || currentWorkspace?.id;
    if (!targetWorkspaceId) return;
    
    try {
      setLoading(true);
      let employeeData: any[] = [];
      
      if (shouldShowCrossWorkspace && !selectedWorkspace) {
        // Owner in main workspace - load employees from all accessible workspaces
        const workspaceData = await WorkspaceService.getUserAccessibleWorkspaces(user?.uid || '');
        const allWorkspaces = [
          ...workspaceData.mainWorkspaces,
          ...Object.values(workspaceData.subWorkspaces).flat()
        ];
        
        // Load employees from all workspaces
        const allEmployees = await Promise.all(
          allWorkspaces.map(ws => 
            EmployeeService.getWorkspaceEmployees(ws.id).catch(err => {
              console.log(`Failed to load employees from workspace ${ws.id}:`, err);
              return [];
            })
          )
        );
        
        // Flatten and add workspace info to each employee
        employeeData = allEmployees.flat().map(emp => ({
          ...emp,
          workspaceName: allWorkspaces.find(ws => ws.id === emp.workspaceId)?.name || 'Unknown Workspace'
        }));
      } else {
        // Regular workspace or specific workspace selected
        employeeData = await EmployeeService.getWorkspaceEmployees(targetWorkspaceId);
      }
      
      console.log('Loaded employees:', employeeData.length, employeeData);
      setEmployees(employeeData);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace, currentWorkspace?.id, shouldShowCrossWorkspace, user?.uid, toast]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }

    // Location is now optional but encouraged
    // No validation error for empty location

    if (formData.status !== 'absent') {
      if (!formData.clockIn) {
        newErrors.clockIn = 'Clock in time is required for non-absent status';
      }

      // Validate clock out time is after clock in time
      if (formData.clockIn && formData.clockOut) {
        const clockInTime = new Date(`2000-01-01T${formData.clockIn}`);
        const clockOutTime = new Date(`2000-01-01T${formData.clockOut}`);
        
        if (clockOutTime <= clockInTime) {
          newErrors.clockOut = 'Clock out time must be after clock in time';
        }
      }

      // Validate break times
      if (formData.breakStart && formData.clockIn) {
        const clockInTime = new Date(`2000-01-01T${formData.clockIn}`);
        const breakStartTime = new Date(`2000-01-01T${formData.breakStart}`);
        
        if (breakStartTime < clockInTime) {
          newErrors.breakStart = 'Break start time must be after clock in time';
        }
      }

      if (formData.breakStart && formData.breakEnd) {
        const breakStartTime = new Date(`2000-01-01T${formData.breakStart}`);
        const breakEndTime = new Date(`2000-01-01T${formData.breakEnd}`);
        
        if (breakEndTime <= breakStartTime) {
          newErrors.breakEnd = 'Break end time must be after break start time';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const targetWorkspaceId = selectedWorkspace || currentWorkspace?.id;
    if (!targetWorkspaceId || !user?.uid) return;

    try {
      setSubmitting(true);
      
      const selectedEmployee = employees.find(emp => emp.id === formData.employeeId);
      if (!selectedEmployee) {
        toast({
          title: 'Error',
          description: 'Selected employee not found.',
          variant: 'destructive'
        });
        return;
      }

      // Determine the correct workspace ID for the attendance record
      const employeeWorkspaceId = selectedEmployee.workspaceId || targetWorkspaceId;
      
      // Prepare attendance data, filtering out empty strings and undefined values
      const formattedDate = format(formData.date, 'yyyy-MM-dd');
      console.log('Form date:', formData.date);
      console.log('Formatted date:', formattedDate);
      
      const attendanceData: CreateAttendanceData = {
        employeeId: formData.employeeId,
        employeeName: `${selectedEmployee.personalInfo.firstName} ${selectedEmployee.personalInfo.lastName}`,
        workspaceId: employeeWorkspaceId,
        date: formattedDate,
        status: formData.status,
        location: formData.location.trim(),
        createdBy: user.uid
      };

      // Only add time fields if they have values
      if (formData.clockIn && formData.clockIn.trim()) {
        attendanceData.clockIn = formData.clockIn.trim();
      }
      if (formData.clockOut && formData.clockOut.trim()) {
        attendanceData.clockOut = formData.clockOut.trim();
      }
      if (formData.breakStart && formData.breakStart.trim()) {
        attendanceData.breakStart = formData.breakStart.trim();
      }
      if (formData.breakEnd && formData.breakEnd.trim()) {
        attendanceData.breakEnd = formData.breakEnd.trim();
      }
      if (formData.notes && formData.notes.trim()) {
        attendanceData.notes = formData.notes.trim();
      }

      console.log('Creating attendance record with data:', attendanceData);
      await AttendanceService.createAttendance(attendanceData);
      
      toast({
        title: 'Success',
        description: 'Attendance record created successfully.',
      });
      
      router.push('/dashboard/hr/attendance');
    } catch (error) {
      console.error('Error creating attendance record:', error);
      toast({
        title: 'Error',
        description: 'Failed to create attendance record. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof AttendanceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspace(workspaceId);
    // Reset form when workspace changes
    setFormData(prev => ({
      ...prev,
      employeeId: ''
    }));
  };

  const getCurrentWorkspaceName = () => {
    const workspace = allWorkspaces.find(ws => ws.id === selectedWorkspace) || currentWorkspace;
    return workspace?.name || 'Unknown Workspace';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/hr/attendance">
            <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Attendance
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Attendance Record</h1>
            <p className="text-muted-foreground mt-1">Add a new attendance record for an employee</p>
          </div>
        </div>
        
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="flex justify-end space-x-3">
                <div className="h-10 bg-muted rounded w-20"></div>
                <div className="h-10 bg-muted rounded w-32"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/hr/attendance">
          <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Attendance
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Attendance Record</h1>
          <p className="text-muted-foreground mt-1">Add a new attendance record for an employee</p>
        </div>
      </div>

      {/* Workspace Selection for Owners */}
      {shouldShowCrossWorkspace && (
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <Globe className="h-5 w-5 text-primary" />
              <span>Workspace Selection</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Select the workspace where you want to create the attendance record
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label className="text-foreground">
                <Building className="h-4 w-4 inline mr-2 text-primary" />
                Target Workspace *
              </Label>
              <Select value={selectedWorkspace} onValueChange={handleWorkspaceChange}>
                <SelectTrigger className="border-border/50 focus:border-primary">
                  <SelectValue placeholder="Select a workspace" />
                </SelectTrigger>
                <SelectContent>
                  {allWorkspaces.map(workspace => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span>{workspace.name}</span>
                        {workspace.type && (
                          <Badge variant="outline" className="text-xs">
                            {workspace.type}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workspace Info */}
      <div className="flex items-center space-x-2 p-4 rounded-lg bg-muted/30 border border-border/30">
        <Building className="h-4 w-4 text-primary" />
        <span className="text-sm text-muted-foreground">Workspace:</span>
        <span className="text-sm font-medium text-foreground">{getCurrentWorkspaceName()}</span>
        {shouldShowCrossWorkspace && (
          <Badge variant="outline" className="ml-2">
            <Globe className="h-3 w-3 mr-1" />
            Cross-Workspace
          </Badge>
        )}
        {formData.employeeId && shouldShowCrossWorkspace && !selectedWorkspace && (
          <>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">Employee Workspace:</span>
            <span className="text-sm font-medium text-foreground">
              {employees.find(emp => emp.id === formData.employeeId)?.workspaceName || 'Unknown'}
            </span>
          </>
        )}
      </div>

      {/* Main Form */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            <span>Attendance Information</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Fill in the attendance information for the selected employee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee and Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee Selection */}
              <div className="space-y-2">
                <Label htmlFor="employee" className="text-foreground">
                  <User className="h-4 w-4 inline mr-2 text-primary" />
                  Employee *
                </Label>
                <Select value={formData.employeeId} onValueChange={(value) => handleInputChange('employeeId', value)}>
                  <SelectTrigger className={cn(
                    "border-border/50 focus:border-primary",
                    errors.employeeId && 'border-red-500 focus:border-red-500'
                  )}>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{employee.personalInfo.firstName} {employee.personalInfo.lastName}</span>
                          <Badge variant="outline" className="text-xs">
                            {employee.employeeId}
                          </Badge>
                          {shouldShowCrossWorkspace && !selectedWorkspace && employee.workspaceName && (
                            <Badge variant="secondary" className="text-xs">
                              {employee.workspaceName}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employeeId && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.employeeId}</span>
                  </p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="text-foreground">
                  <CalendarIcon className="h-4 w-4 inline mr-2 text-primary" />
                  Date *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal border-border/50 focus:border-primary',
                        !formData.date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && handleInputChange('date', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Status Selection */}
            <div className="space-y-3">
              <Label className="text-foreground">Status *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('status', option.value)}
                      className={cn(
                        'flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200',
                        formData.status === option.value
                          ? `${option.bgColor} border-primary ring-2 ring-primary/20`
                          : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'
                      )}
                    >
                      <Icon className={cn('h-4 w-4', option.color)} />
                      <span className="text-sm font-medium text-foreground">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-foreground">
                  <MapPin className="h-4 w-4 inline mr-2 text-primary" />
                  Location (Optional)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Adding your location helps with compliance and workplace management. You can select a preset option or enter a custom location.
                </p>
              </div>
              
              {/* Quick Location Options */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Quick Options</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {locationOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange('location', option.label)}
                        className={cn(
                          'flex items-center space-x-2 p-2 rounded-lg border text-sm transition-all duration-200',
                          formData.location === option.label
                            ? 'bg-primary/10 border-primary text-primary ring-2 ring-primary/20'
                            : 'border-border/50 hover:border-primary/50 hover:bg-muted/30 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        <span className="truncate">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Custom Location Input */}
              <div className="space-y-2">
                <Label htmlFor="customLocation" className="text-sm font-medium text-muted-foreground">Custom Location</Label>
                <Input
                  id="customLocation"
                  placeholder="e.g., Office - Floor 2, Coffee Shop, Airport Terminal 3"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="border-border/50 focus:border-primary"
                />
              </div>
            </div>

            {/* Time Information - Only show for non-absent status */}
            {formData.status !== 'absent' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Timer className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Time Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Clock In */}
                  <TimePicker
                    value={formData.clockIn}
                    onChange={(value) => handleInputChange('clockIn', value)}
                    label="Clock In Time"
                    icon={<Clock className="h-4 w-4 text-green-600" />}
                    error={errors.clockIn}
                  />

                  {/* Clock Out */}
                  <TimePicker
                    value={formData.clockOut}
                    onChange={(value) => handleInputChange('clockOut', value)}
                    label="Clock Out Time"
                    icon={<Clock className="h-4 w-4 text-red-600" />}
                    error={errors.clockOut}
                  />

                  {/* Break Start */}
                  <TimePicker
                    value={formData.breakStart}
                    onChange={(value) => handleInputChange('breakStart', value)}
                    label="Break Start"
                    icon={<Coffee className="h-4 w-4 text-orange-600" />}
                    error={errors.breakStart}
                  />

                  {/* Break End */}
                  <TimePicker
                    value={formData.breakEnd}
                    onChange={(value) => handleInputChange('breakEnd', value)}
                    label="Break End"
                    icon={<Coffee className="h-4 w-4 text-orange-600" />}
                    error={errors.breakEnd}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-foreground">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this attendance record"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="border-border/50 focus:border-primary"
                rows={3}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-border/30">
              <Link href="/dashboard/hr/attendance">
                <Button type="button" variant="outline" className="hover:bg-accent hover:text-accent-foreground transition-colors">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Create Record
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}