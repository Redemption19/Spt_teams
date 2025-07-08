'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckSquare, 
  Users, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const statsData = [
  {
    title: 'Active Tasks',
    value: '124',
    change: '+12%',
    changeType: 'positive' as const,
    icon: CheckSquare,
    description: 'vs last month',
  },
  {
    title: 'Team Members',
    value: '32',
    change: '+3',
    changeType: 'positive' as const,
    icon: Users,
    description: 'new this month',
  },
  {
    title: 'Productivity',
    value: '89%',
    change: '+5%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    description: 'vs last month',
  },
  {
    title: 'Avg. Task Time',
    value: '2.4h',
    change: '-0.3h',
    changeType: 'positive' as const,
    icon: Clock,
    description: 'improvement',
  },
];

export function StatsCards() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="stats-card card-interactive hover:scale-105 transition-all duration-300 cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <Badge
                    variant="secondary"
                    className={`text-xs px-2 py-1 ${
                      stat.changeType === 'positive'
                        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                        : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                    }`}
                  >
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {stat.change}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}