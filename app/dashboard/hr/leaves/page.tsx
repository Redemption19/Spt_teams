'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon,
  Plus,
  Check,
  X,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Filter,
  Download,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, differenceInDays } from 'date-fns';

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  emergency: boolean;
}

interface LeaveBalance {
  employeeId: string;
  employeeName: string;
  annual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
  casual: { total: number; used: number; remaining: number };
  maternity: { total: number; used: number; remaining: number };
  paternity: { total: number; used: number; remaining: number };
}

interface LeaveType {
  id: string;
  name: string;
  description: string;
  maxDays: number;
  carryForward: boolean;
  requiresApproval: boolean;
  color: string;
}

export default function LeavesPage() {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('requests');
  
  // New leave request form
  const [showNewLeaveDialog, setShowNewLeaveDialog] = useState(false);
  const [newLeaveForm, setNewLeaveForm] = useState({
    employeeId: '',
    leaveType: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    reason: '',
    emergency: false
  });

  const loadLeaveData = useCallback(async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls
      const mockLeaveTypes: LeaveType[] = [
        { id: 'annual', name: 'Annual Leave', description: 'Yearly vacation days', maxDays: 25, carryForward: true, requiresApproval: true, color: 'bg-blue-100 text-blue-800' },
        { id: 'sick', name: 'Sick Leave', description: 'Medical leave', maxDays: 10, carryForward: false, requiresApproval: false, color: 'bg-red-100 text-red-800' },
        { id: 'casual', name: 'Casual Leave', description: 'Personal time off', maxDays: 12, carryForward: false, requiresApproval: true, color: 'bg-green-100 text-green-800' },
        { id: 'maternity', name: 'Maternity Leave', description: 'Maternity leave', maxDays: 90, carryForward: false, requiresApproval: true, color: 'bg-pink-100 text-pink-800' },
        { id: 'paternity', name: 'Paternity Leave', description: 'Paternity leave', maxDays: 14, carryForward: false, requiresApproval: true, color: 'bg-purple-100 text-purple-800' }
      ];

      const mockRequests: LeaveRequest[] = [
        {
          id: '1',
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          leaveType: 'Annual Leave',
          startDate: '2024-01-15',
          endDate: '2024-01-19',
          days: 5,
          reason: 'Family vacation',
          status: 'pending',
          appliedDate: '2024-01-01',
          emergency: false
        },
        {
          id: '2',
          employeeId: 'EMP002',
          employeeName: 'Sarah Wilson',
          leaveType: 'Sick Leave',
          startDate: '2024-01-10',
          endDate: '2024-01-12',
          days: 3,
          reason: 'Medical appointment and recovery',
          status: 'approved',
          appliedDate: '2024-01-08',
          approvedBy: 'Mike Johnson',
          approvedDate: '2024-01-09',
          emergency: true
        },
        {
          id: '3',
          employeeId: 'EMP003',
          employeeName: 'David Chen',
          leaveType: 'Casual Leave',
          startDate: '2024-01-20',
          endDate: '2024-01-20',
          days: 1,
          reason: 'Personal work',
          status: 'rejected',
          appliedDate: '2024-01-18',
          approvedBy: 'Lisa Brown',
          approvedDate: '2024-01-19',
          rejectionReason: 'Insufficient casual leave balance',
          emergency: false
        }
      ];

      const mockBalances: LeaveBalance[] = [
        {
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          annual: { total: 25, used: 8, remaining: 17 },
          sick: { total: 10, used: 2, remaining: 8 },
          casual: { total: 12, used: 4, remaining: 8 },
          maternity: { total: 90, used: 0, remaining: 90 },
          paternity: { total: 14, used: 0, remaining: 14 }
        },
        {
          employeeId: 'EMP002',
          employeeName: 'Sarah Wilson',
          annual: { total: 25, used: 15, remaining: 10 },
          sick: { total: 10, used: 5, remaining: 5 },
          casual: { total: 12, used: 7, remaining: 5 },
          maternity: { total: 90, used: 0, remaining: 90 },
          paternity: { total: 14, used: 0, remaining: 14 }
        }
      ];
      
      setLeaveRequests(mockRequests);
      setLeaveBalances(mockBalances);
      setLeaveTypes(mockLeaveTypes);
    } catch (error) {
      console.error('Error loading leave data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leave data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLeaveData();
  }, [loadLeaveData]);

  const handleApproveLeave = async (requestId: string) => {
    try {
      // TODO: Implement actual approval API call
      
      setLeaveRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'approved' as const, approvedBy: 'Current User', approvedDate: format(new Date(), 'yyyy-MM-dd') }
            : req
        )
      );
      
      toast({
        title: 'Leave Approved',
        description: 'The leave request has been approved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Approval Failed',
        description: 'Failed to approve leave request. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleRejectLeave = async (requestId: string, reason: string) => {
    try {
      // TODO: Implement actual rejection API call
      
      setLeaveRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'rejected' as const, approvedBy: 'Current User', approvedDate: format(new Date(), 'yyyy-MM-dd'), rejectionReason: reason }
            : req
        )
      );
      
      toast({
        title: 'Leave Rejected',
        description: 'The leave request has been rejected.',
      });
    } catch (error) {
      toast({
        title: 'Rejection Failed',
        description: 'Failed to reject leave request. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSubmitLeaveRequest = async () => {
    try {
      if (!newLeaveForm.startDate || !newLeaveForm.endDate || !newLeaveForm.leaveType || !newLeaveForm.reason) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields.',
          variant: 'destructive'
        });
        return;
      }

      const days = differenceInDays(newLeaveForm.endDate, newLeaveForm.startDate) + 1;
      
      const newRequest: LeaveRequest = {
        id: Date.now().toString(),
        employeeId: 'CURRENT_USER', // TODO: Get from auth context
        employeeName: 'Current User', // TODO: Get from auth context
        leaveType: newLeaveForm.leaveType,
        startDate: format(newLeaveForm.startDate, 'yyyy-MM-dd'),
        endDate: format(newLeaveForm.endDate, 'yyyy-MM-dd'),
        days,
        reason: newLeaveForm.reason,
        status: 'pending',
        appliedDate: format(new Date(), 'yyyy-MM-dd'),
        emergency: newLeaveForm.emergency
      };

      // TODO: Submit to API
      
      setLeaveRequests(prev => [newRequest, ...prev]);
      setShowNewLeaveDialog(false);
      setNewLeaveForm({
        employeeId: '',
        leaveType: '',
        startDate: undefined,
        endDate: undefined,
        reason: '',
        emergency: false
      });
      
      toast({
        title: 'Leave Request Submitted',
        description: 'Your leave request has been submitted for approval.',
      });
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit leave request. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.leaveType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
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
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">
            Manage leave requests, track balances, and handle approvals
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={showNewLeaveDialog} onOpenChange={setShowNewLeaveDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Request Leave</DialogTitle>
                <DialogDescription>
                  Submit a new leave request for approval.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select value={newLeaveForm.leaveType} onValueChange={(value) => setNewLeaveForm(prev => ({ ...prev, leaveType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map(type => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name} ({type.maxDays} days max)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newLeaveForm.startDate ? format(newLeaveForm.startDate, 'MMM dd, yyyy') : 'Pick date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newLeaveForm.startDate}
                          onSelect={(date) => setNewLeaveForm(prev => ({ ...prev, startDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newLeaveForm.endDate ? format(newLeaveForm.endDate, 'MMM dd, yyyy') : 'Pick date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newLeaveForm.endDate}
                          onSelect={(date) => setNewLeaveForm(prev => ({ ...prev, endDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {newLeaveForm.startDate && newLeaveForm.endDate && (
                  <div className="text-sm text-muted-foreground">
                    Total days: {differenceInDays(newLeaveForm.endDate, newLeaveForm.startDate) + 1}
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Provide a reason for your leave request..."
                    value={newLeaveForm.reason}
                    onChange={(e) => setNewLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowNewLeaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitLeaveRequest}>
                  Submit Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {leaveRequests.filter(req => req.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {leaveRequests.filter(req => req.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {leaveRequests.filter(req => req.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency Leaves</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {leaveRequests.filter(req => req.emergency).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="types">Leave Types</TabsTrigger>
          <TabsTrigger value="calendar">Team Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {/* Filters */}
          <Card className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search leave requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Leave Requests List */}
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="card-enhanced">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{request.employeeName}</h3>
                          {getStatusBadge(request.status)}
                          {request.emergency && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Emergency
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-2">
                          <span><strong>Type:</strong> {request.leaveType}</span>
                          <span><strong>Duration:</strong> {request.days} day(s)</span>
                          <span><strong>From:</strong> {format(new Date(request.startDate), 'MMM dd')}</span>
                          <span><strong>To:</strong> {format(new Date(request.endDate), 'MMM dd')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          <strong>Reason:</strong> {request.reason}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {request.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => handleApproveLeave(request.id)}>
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleRejectLeave(request.id, 'Rejected by manager')}>
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {request.status === 'approved' && request.approvedBy && (
                        <div className="text-right text-xs text-muted-foreground">
                          <p>Approved by {request.approvedBy}</p>
                          <p>{request.approvedDate && format(new Date(request.approvedDate), 'MMM dd, yyyy')}</p>
                        </div>
                      )}
                      {request.status === 'rejected' && (
                        <div className="text-right text-xs text-muted-foreground">
                          <p className="text-red-600">Rejected</p>
                          {request.rejectionReason && <p>{request.rejectionReason}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Leave Balances</CardTitle>
              <CardDescription>Current leave balances for all employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {leaveBalances.map((balance) => (
                  <div key={balance.employeeId} className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-4">{balance.employeeName}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {Object.entries(balance).slice(2).map(([type, data]) => (
                        <div key={type} className="text-center">
                          <p className="text-sm font-medium capitalize">{type}</p>
                          <div className="mt-1">
                            <p className="text-lg font-bold">{data.remaining}</p>
                            <p className="text-xs text-muted-foreground">
                              {data.used}/{data.total} used
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className="bg-primary h-1.5 rounded-full" 
                                style={{ width: `${((data.total - data.remaining) / data.total) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Leave Types</CardTitle>
              <CardDescription>Configure available leave types and policies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {leaveTypes.map((type) => (
                  <Card key={type.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{type.name}</h3>
                        <Badge className={type.color}>{type.maxDays} days</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                      <div className="flex gap-2">
                        {type.carryForward && (
                          <Badge variant="outline" className="text-xs">Carry Forward</Badge>
                        )}
                        {type.requiresApproval && (
                          <Badge variant="outline" className="text-xs">Requires Approval</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Team Leave Calendar</CardTitle>
              <CardDescription>Visual overview of team leave schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Team Calendar Coming Soon</h3>
                <p className="text-muted-foreground">
                  Interactive team calendar view will be available here to visualize leave schedules.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}