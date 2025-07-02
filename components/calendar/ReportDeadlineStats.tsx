'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface ReportDeadlineStatsProps {
  stats: {
    dueToday: number;
    dueThisWeek: number;
    overdue: number;
    submitted: number;
  };
  onViewAllReports?: () => void;
}

export function ReportDeadlineStats({ stats, onViewAllReports }: ReportDeadlineStatsProps) {
  const statItems = [
    {
      title: "Due Today",
      value: stats.dueToday,
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      description: 'reports deadline today'
    },
    {
      title: "Due This Week", 
      value: stats.dueThisWeek,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      description: 'upcoming deadlines'
    },
    {
      title: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      description: 'require immediate action'
    },
    {
      title: "Submitted",
      value: stats.submitted,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      description: 'this week'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Report Submission Deadlines</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track upcoming reports deadlines and submission status
          </p>
        </div>
        {onViewAllReports && (
          <Button
            variant="outline"
            onClick={onViewAllReports}
            className="flex items-center space-x-2 hover:bg-primary/5"
          >
            <FileText className="h-4 w-4" />
            <span>View All Reports</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item, index) => (
          <Card key={index} className="card-interactive">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 