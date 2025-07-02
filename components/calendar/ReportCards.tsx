'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText,
  Clock,
  AlertTriangle,
  Calendar,
  Building,
  Users,
  Eye,
  Edit,
  Play
} from 'lucide-react';

interface ReportItem {
  id: string;
  title: string;
  branch?: string;
  department?: string;
  region?: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'draft' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedBy?: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  canEdit?: boolean;
  canSubmit?: boolean;
  canView?: boolean;
}

interface ReportCardsProps {
  reports: ReportItem[];
  onSubmit?: (reportId: string) => void;
  onView?: (reportId: string) => void;
  onContinue?: (reportId: string) => void;
}

export function ReportCards({ reports, onSubmit, onView, onContinue }: ReportCardsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'submitted':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500';
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-orange-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent' || priority === 'high') {
      return <AlertTriangle className={`h-4 w-4 ${getPriorityColor(priority)}`} />;
    }
    return <Clock className={`h-4 w-4 ${getPriorityColor(priority)}`} />;
  };

  const formatDueDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  const getLocationInfo = (report: ReportItem) => {
    if (report.branch) return report.branch;
    if (report.department) return report.department;
    if (report.region) return report.region;
    return 'Corporate';
  };

  const getLocationIcon = (report: ReportItem) => {
    if (report.branch) return <Building className="h-4 w-4" />;
    if (report.department) return <Users className="h-4 w-4" />;
    return <Building className="h-4 w-4" />;
  };

  const getActionButton = (report: ReportItem) => {
    if (report.status === 'submitted') {
      return (
        <Button
          onClick={() => onView?.(report.id)}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white"
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      );
    } else if (report.status === 'draft') {
      return (
        <Button
          onClick={() => onContinue?.(report.id)}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white"
        >
          <Edit className="h-4 w-4 mr-2" />
          Continue
        </Button>
      );
    } else {
      return (
        <Button
          onClick={() => onSubmit?.(report.id)}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
        >
          <FileText className="h-4 w-4 mr-2" />
          Submit
        </Button>
      );
    }
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Reports Found</h3>
        <p className="text-sm text-muted-foreground">
          There are no reports matching your current criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => (
        <Card 
          key={report.id} 
          className={`card-interactive relative border-l-4 ${
            report.priority === 'urgent' || report.priority === 'high' 
              ? 'border-l-red-500' 
              : report.priority === 'medium'
              ? 'border-l-orange-500'
              : 'border-l-gray-300'
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight mb-2 truncate">
                  {report.title}
                </h3>
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  {getLocationIcon(report)}
                  <span className="ml-1">{getLocationInfo(report)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                {getPriorityIcon(report.priority)}
                <span className={`text-xs font-medium capitalize ${getPriorityColor(report.priority)}`}>
                  {report.priority}
                </span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-medium">{formatDueDate(report.dueDate)}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Status:</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(report.status)}`}
                >
                  {report.status}
                </Badge>
              </div>
              
              {report.submittedBy && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Submitted by:</span>
                  <span className="font-medium">{report.submittedBy}</span>
                </div>
              )}
            </div>
            
            {getActionButton(report)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 