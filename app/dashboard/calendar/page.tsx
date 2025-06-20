import { Calendar as CalendarIcon, Clock, Users, MapPin, Plus, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CalendarPage() {
  const upcomingEvents = [
    {
      id: 1,
      title: 'Team Meeting - Q1 Review',
      date: 'Today, 2:00 PM',
      location: 'Conference Room A',
      attendees: 8,
      type: 'meeting'
    },
    {
      id: 2,
      title: 'Branch Manager Training',
      date: 'Tomorrow, 10:00 AM',
      location: 'Training Center',
      attendees: 12,
      type: 'training'
    },
    {
      id: 3,
      title: 'Regional Performance Review',
      date: 'Friday, 3:00 PM',
      location: 'Virtual Meeting',
      attendees: 6,
      type: 'review'
    }
  ];

  const reportDeadlines = [
    {
      id: 1,
      title: 'Monthly Branch Performance Report',
      dueDate: 'Today, 11:59 PM',
      branch: 'Downtown Branch',
      status: 'pending',
      priority: 'high',
      submittedBy: null
    },
    {
      id: 2,
      title: 'Weekly Team Activity Report',
      dueDate: 'Tomorrow, 6:00 PM',
      branch: 'North Region',
      status: 'submitted',
      priority: 'medium',
      submittedBy: 'John Manager'
    },
    {
      id: 3,
      title: 'Quarterly Financial Summary',
      dueDate: 'Dec 31, 2024',
      branch: 'All Branches',
      status: 'pending',
      priority: 'high',
      submittedBy: null
    },
    {
      id: 4,
      title: 'Customer Satisfaction Survey Results',
      dueDate: 'Jan 5, 2025',
      branch: 'South Branch',
      status: 'draft',
      priority: 'medium',
      submittedBy: null
    },
    {
      id: 5,
      title: 'Annual Budget Review',
      dueDate: 'Jan 15, 2025',
      branch: 'Corporate',
      status: 'pending',
      priority: 'high',
      submittedBy: null
    }
  ];
  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'training': return 'bg-green-100 text-green-700 border-green-200';
      case 'review': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-red-100 text-red-700 border-red-200';
      case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-3 w-3" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      case 'low': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Manage your schedule and upcoming events
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Calendar View</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                <div className="text-center">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Calendar View</p>
                  <p className="text-sm">Interactive calendar component will be implemented here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your scheduled meetings and activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <Badge className={getEventColor(event.type)}>
                      {event.type}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{event.attendees} attendees</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Report Submission Deadlines Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Report Submission Deadlines</h2>
            <p className="text-muted-foreground">
              Track upcoming report deadlines and submission status
            </p>
          </div>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            View All Reports
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportDeadlines.map((report) => (
            <Card key={report.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <CardDescription className="text-sm">{report.branch}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`flex items-center space-x-1 ${getPriorityColor(report.priority)}`}>
                      {getPriorityIcon(report.priority)}
                      <span className="text-xs font-medium capitalize">{report.priority}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Due Date:</span>
                    <span className="text-sm text-muted-foreground">{report.dueDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge className={getReportStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </div>
                  {report.submittedBy && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Submitted by:</span>
                      <span className="text-sm text-muted-foreground">{report.submittedBy}</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 pt-2">
                  {report.status === 'pending' && (
                    <Button size="sm" className="flex-1">
                      <FileText className="h-3 w-3 mr-1" />
                      Submit
                    </Button>
                  )}
                  {report.status === 'draft' && (
                    <Button size="sm" variant="outline" className="flex-1">
                      <FileText className="h-3 w-3 mr-1" />
                      Continue
                    </Button>
                  )}
                  {report.status === 'submitted' && (
                    <Button size="sm" variant="outline" className="flex-1">
                      <FileText className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">meetings scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">awaiting submission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">1</div>
            <p className="text-xs text-muted-foreground">report deadline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">1</div>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
