'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Clock, 
  MapPin, 
  Play, 
  Square, 
  Calendar as CalendarIcon,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Coffee,
  Home,
  Building,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  workHours: number;
  overtime: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'work-from-home';
  location: string;
  notes?: string;
}

interface AttendanceStats {
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  workFromHome: number;
  avgWorkHours: number;
  totalOvertime: number;
}

export default function AttendancePage() {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Clock in/out states
  const [isClocking, setIsClocking] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'out' | 'in' | 'break'>('out');
  const [currentSession, setCurrentSession] = useState<{
    clockIn: string;
    totalHours: number;
    onBreak: boolean;
  } | null>(null);

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls
      const mockRecords: AttendanceRecord[] = [
        {
          id: '1',
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          date: format(selectedDate, 'yyyy-MM-dd'),
          clockIn: '09:00',
          clockOut: '18:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          workHours: 8,
          overtime: 0,
          status: 'present',
          location: 'Office - Floor 3'
        },
        {
          id: '2',
          employeeId: 'EMP002',
          employeeName: 'Sarah Wilson',
          date: format(selectedDate, 'yyyy-MM-dd'),
          clockIn: '09:15',
          clockOut: null,
          breakStart: null,
          breakEnd: null,
          workHours: 0,
          overtime: 0,
          status: 'late',
          location: 'Remote - Home'
        },
        {
          id: '3',
          employeeId: 'EMP003',
          employeeName: 'David Chen',
          date: format(selectedDate, 'yyyy-MM-dd'),
          clockIn: null,
          clockOut: null,
          breakStart: null,
          breakEnd: null,
          workHours: 0,
          overtime: 0,
          status: 'absent',
          location: 'N/A'
        }
      ];

      const mockStats: AttendanceStats = {
        totalEmployees: 85,
        present: 78,
        absent: 4,
        late: 2,
        workFromHome: 15,
        avgWorkHours: 7.8,
        totalOvertime: 45
      };
      
      setAttendanceRecords(mockRecords);
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      setIsClocking(true);
      
      // Get current location (mock)
      const location = 'Office - Floor 3';
      const currentTime = format(new Date(), 'HH:mm');
      
      // TODO: Implement actual clock-in API call
      
      setCurrentStatus('in');
      setCurrentSession({
        clockIn: currentTime,
        totalHours: 0,
        onBreak: false
      });
      
      toast({
        title: 'Clocked In Successfully',
        description: `You clocked in at ${currentTime} from ${location}`,
      });
    } catch (error) {
      toast({
        title: 'Clock In Failed',
        description: 'Unable to clock in. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsClocking(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setIsClocking(true);
      
      const currentTime = format(new Date(), 'HH:mm');
      
      // TODO: Implement actual clock-out API call
      
      setCurrentStatus('out');
      setCurrentSession(null);
      
      toast({
        title: 'Clocked Out Successfully',
        description: `You clocked out at ${currentTime}`,
      });
    } catch (error) {
      toast({
        title: 'Clock Out Failed',
        description: 'Unable to clock out. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsClocking(false);
    }
  };

  const handleBreakToggle = async () => {
    try {
      setIsClocking(true);
      
      const newBreakStatus = !currentSession?.onBreak;
      const currentTime = format(new Date(), 'HH:mm');
      
      // TODO: Implement actual break toggle API call
      
      if (currentSession) {
        setCurrentSession({
          ...currentSession,
          onBreak: newBreakStatus
        });
      }
      
      toast({
        title: newBreakStatus ? 'Break Started' : 'Break Ended',
        description: `You ${newBreakStatus ? 'started' : 'ended'} your break at ${currentTime}`,
      });
    } catch (error) {
      toast({
        title: 'Break Toggle Failed',
        description: 'Unable to toggle break status. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsClocking(false);
    }
  };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Present</Badge>;
      case 'late':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Late</Badge>;
      case 'absent':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Absent</Badge>;
      case 'half-day':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200"><Timer className="w-3 h-3 mr-1" />Half Day</Badge>;
      case 'work-from-home':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200"><Home className="w-3 h-3 mr-1" />WFH</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="card-enhanced">
              <CardHeader>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
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
          <h1 className="text-3xl font-bold tracking-tight">Attendance & Time Tracking</h1>
          <p className="text-muted-foreground">
            Track employee attendance, work hours, and manage time-related activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {format(selectedDate, 'MMM dd, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Clock In/Out Section */}
      <Card className="card-enhanced border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Quick Clock In/Out
          </CardTitle>
          <CardDescription>
            Clock in and out for the day, manage breaks and track your work hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{format(new Date(), 'HH:mm')}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMM dd')}</p>
              </div>
              
              {currentSession && (
                <div className="text-center border-l pl-6">
                  <p className="text-lg font-semibold">Started: {currentSession.clockIn}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentSession.onBreak ? 'On Break' : 'Working'}
                  </p>
                </div>
              )}
              
              <div className="text-center border-l pl-6">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>Office - Floor 3</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Building className="w-3 h-3" />
                  <span>IP: 192.168.1.100</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {currentStatus === 'out' ? (
                <Button 
                  onClick={handleClockIn} 
                  disabled={isClocking}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isClocking ? (
                    <Timer className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Clock In
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline"
                    onClick={handleBreakToggle} 
                    disabled={isClocking}
                  >
                    <Coffee className="w-4 h-4 mr-2" />
                    {currentSession?.onBreak ? 'End Break' : 'Start Break'}
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleClockOut} 
                    disabled={isClocking}
                  >
                    {isClocking ? (
                      <Timer className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Square className="w-4 h-4 mr-2" />
                    )}
                    Clock Out
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.present}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.present && stats?.totalEmployees 
                ? `${((stats.present / stats.totalEmployees) * 100).toFixed(1)}% of total`
                : '0%'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.absent}</div>
            <p className="text-xs text-muted-foreground">employees</p>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.late}</div>
            <p className="text-xs text-muted-foreground">arrivals</p>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work From Home</CardTitle>
            <Home className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.workFromHome}</div>
            <p className="text-xs text-muted-foreground">remote workers</p>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Work Hours</CardTitle>
            <Timer className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.avgWorkHours}</div>
            <p className="text-xs text-muted-foreground">hours/day</p>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Overtime</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.totalOvertime}</div>
            <p className="text-xs text-muted-foreground">hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="half-day">Half Day</SelectItem>
                <SelectItem value="work-from-home">Work From Home</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle>Attendance Records - {format(selectedDate, 'MMMM dd, yyyy')}</CardTitle>
          <CardDescription>
            Daily attendance tracking for all employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{record.employeeName}</h3>
                      {getStatusBadge(record.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>ID: {record.employeeId}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {record.location}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-6 text-center">
                  <div>
                    <p className="text-sm font-medium">Clock In</p>
                    <p className="text-sm text-muted-foreground">
                      {record.clockIn || '--:--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Clock Out</p>
                    <p className="text-sm text-muted-foreground">
                      {record.clockOut || '--:--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Work Hours</p>
                    <p className="text-sm text-muted-foreground">
                      {record.workHours}h
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Overtime</p>
                    <p className="text-sm text-muted-foreground">
                      {record.overtime}h
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No attendance records found</h3>
              <p className="text-muted-foreground">
                No attendance data available for the selected date and filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 