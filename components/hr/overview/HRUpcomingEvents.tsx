'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  AlertCircle, 
  Clock,
  UserPlus,
  FileText,
  CheckCircle
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { LeaveService } from '@/lib/leave-service';
import { PayrollService } from '@/lib/payroll-service';
import { EmployeeService } from '@/lib/employee-service';
import { addDays, format, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';

interface UpcomingEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: 'leave' | 'payroll' | 'contract' | 'review' | 'meeting' | 'deadline';
  priority: 'low' | 'medium' | 'high' | 'critical';
  icon: React.ReactNode;
  actionRequired?: boolean;
  count?: number;
}

export default function HRUpcomingEvents() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      if (!currentWorkspace?.id) return;

      try {
        setLoading(true);
        const upcomingEvents: UpcomingEvent[] = [];
        const today = new Date();
        const nextMonth = addDays(today, 30);

        // Fetch pending leave requests
        try {
          const pendingLeaves = await LeaveService.getLeaveRequests({
            workspaceId: currentWorkspace.id,
            status: 'pending'
          });

          if (pendingLeaves.length > 0) {
            upcomingEvents.push({
              id: 'pending-leaves',
              title: 'Pending Leave Requests',
              description: `${pendingLeaves.length} leave request${pendingLeaves.length > 1 ? 's' : ''} awaiting approval`,
              date: today,
              type: 'leave',
              priority: 'medium',
              icon: <Calendar className="w-4 h-4 text-blue-500" />,
              actionRequired: true,
              count: pendingLeaves.length
            });
          }
        } catch (error) {
          console.log('Could not fetch leave requests:', error);
        }

        // Check for upcoming payroll processing
        try {
          const currentMonth = format(today, 'yyyy-MM');
          const payrollDay = 25; // Assume payroll is processed on 25th of each month
          const payrollDate = new Date(today.getFullYear(), today.getMonth(), payrollDay);
          
          // If payroll day has passed this month, use next month
          if (isBefore(payrollDate, today)) {
            payrollDate.setMonth(payrollDate.getMonth() + 1);
          }

          // If payroll is within next 7 days
          if (isBefore(payrollDate, addDays(today, 7))) {
            const payrollEmployees = await PayrollService.getPayrollEmployees(currentWorkspace.id);
            
            upcomingEvents.push({
              id: 'payroll-processing',
              title: 'Payroll Processing',
              description: `Process payroll for ${payrollEmployees.length} employee${payrollEmployees.length > 1 ? 's' : ''}`,
              date: payrollDate,
              type: 'payroll',
              priority: 'high',
              icon: <DollarSign className="w-4 h-4 text-green-500" />,
              actionRequired: true,
              count: payrollEmployees.length
            });
          }
        } catch (error) {
          console.log('Could not fetch payroll data:', error);
        }

        // Check for contract renewals/expirations
        try {
          const employees = await EmployeeService.getWorkspaceEmployees(currentWorkspace.id);
          const contractsExpiring = employees.filter(emp => {
            if (!emp.employmentDetails.contractEndDate) return false;
            const contractEnd = new Date(emp.employmentDetails.contractEndDate);
            return isAfter(contractEnd, today) && isBefore(contractEnd, nextMonth);
          });

          if (contractsExpiring.length > 0) {
            const soonestExpiry = contractsExpiring.reduce((earliest, emp) => {
              const contractEnd = new Date(emp.employmentDetails.contractEndDate!);
              const earliestEnd = new Date(earliest.employmentDetails.contractEndDate!);
              return contractEnd < earliestEnd ? emp : earliest;
            });

            upcomingEvents.push({
              id: 'contract-renewals',
              title: 'Contract Renewals',
              description: `${contractsExpiring.length} contract${contractsExpiring.length > 1 ? 's' : ''} expiring this month`,
              date: new Date(soonestExpiry.employmentDetails.contractEndDate!),
              type: 'contract',
              priority: 'high',
              icon: <AlertCircle className="w-4 h-4 text-red-500" />,
              actionRequired: true,
              count: contractsExpiring.length
            });
          }
        } catch (error) {
          console.log('Could not fetch employee contracts:', error);
        }

        // Check for probation end dates
        try {
          const employees = await EmployeeService.getWorkspaceEmployees(currentWorkspace.id);
          const probationEnding = employees.filter(emp => {
            if (!emp.employmentDetails.probationEndDate) return false;
            const probationEnd = new Date(emp.employmentDetails.probationEndDate);
            return isAfter(probationEnd, today) && isBefore(probationEnd, addDays(today, 14));
          });

          if (probationEnding.length > 0) {
            const soonestReview = probationEnding.reduce((earliest, emp) => {
              const probationEnd = new Date(emp.employmentDetails.probationEndDate!);
              const earliestEnd = new Date(earliest.employmentDetails.probationEndDate!);
              return probationEnd < earliestEnd ? emp : earliest;
            });

            upcomingEvents.push({
              id: 'probation-reviews',
              title: 'Probation Reviews Due',
              description: `${probationEnding.length} employee${probationEnding.length > 1 ? 's' : ''} completing probation`,
              date: new Date(soonestReview.employmentDetails.probationEndDate!),
              type: 'review',
              priority: 'medium',
              icon: <CheckCircle className="w-4 h-4 text-orange-500" />,
              actionRequired: true,
              count: probationEnding.length
            });
          }
        } catch (error) {
          console.log('Could not fetch probation data:', error);
        }

        // Add some general HR reminders if no specific events
        if (upcomingEvents.length === 0) {
          const monthlyReview = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          upcomingEvents.push(
            {
              id: 'monthly-review',
              title: 'Monthly HR Review',
              description: 'Review attendance, performance, and department metrics',
              date: monthlyReview,
              type: 'review',
              priority: 'low',
              icon: <FileText className="w-4 h-4 text-purple-500" />,
              actionRequired: false
            },
            {
              id: 'team-meeting',
              title: 'HR Team Meeting',
              description: 'Weekly HR team sync meeting',
              date: addDays(today, 7 - today.getDay()), // Next Monday
              type: 'meeting',
              priority: 'low',
              icon: <Users className="w-4 h-4 text-blue-500" />,
              actionRequired: false
            }
          );
        }

        // Sort events by date and priority
        upcomingEvents.sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          if (a.actionRequired !== b.actionRequired) {
            return a.actionRequired ? -1 : 1;
          }
          if (a.priority !== b.priority) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return a.date.getTime() - b.date.getTime();
        });

        setEvents(upcomingEvents.slice(0, 6)); // Show max 6 events
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
        toast({
          title: 'Error',
          description: 'Failed to load upcoming events',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, [currentWorkspace?.id, toast]);

  const formatEventDate = (date: Date) => {
    const today = startOfDay(new Date());
    const eventDate = startOfDay(date);
    const diffInDays = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Tomorrow';
    if (diffInDays < 7) return `In ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
    if (diffInDays < 14) return `In ${Math.ceil(diffInDays / 7)} week${Math.ceil(diffInDays / 7) > 1 ? 's' : ''}`;
    return format(date, 'MMM dd');
  };

  const getPriorityBadge = (priority: UpcomingEvent['priority'], actionRequired: boolean) => {
    if (actionRequired) {
      return (
        <Badge variant="destructive" className="text-xs">
          Action Required
        </Badge>
      );
    }
    
    if (priority === 'high' || priority === 'critical') {
      return (
        <Badge variant="outline" className="text-xs border-orange-500 text-orange-700">
          {priority}
        </Badge>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Important dates and deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
        <CardDescription>Important dates and deadlines</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-3 hover-muted-enhanced p-2 rounded-lg transition-colors">
              {event.icon}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium leading-none truncate">
                    {event.title}
                  </p>
                  {getPriorityBadge(event.priority, event.actionRequired || false)}
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {event.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatEventDate(event.date)}
                </p>
              </div>
            </div>
          ))}
          
          {events.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming events</p>
              <p className="text-sm text-muted-foreground mt-2">
                Important HR deadlines and events will appear here
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}