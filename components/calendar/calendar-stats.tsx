'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

interface CalendarStatsProps {
  stats: {
    todayEvents: number;
    weekEvents: number;
    pendingDeadlines: number;
    completedThisWeek: number;
  };
}

export function CalendarStats({ stats }: CalendarStatsProps) {
  const statItems = [
    {
      title: "Today's Events",
      value: stats.todayEvents,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      description: 'scheduled for today'
    },
    {
      title: "This Week",
      value: stats.weekEvents,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      description: 'total events'
    },
    {
      title: "Pending Deadlines",
      value: stats.pendingDeadlines,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      description: 'require attention'
    },
    {
      title: "Completed",
      value: stats.completedThisWeek,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
      description: 'this week'
    }
  ];

  return (
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
  );
} 