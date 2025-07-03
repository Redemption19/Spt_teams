'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileEdit, 
  Calendar,
  TrendingUp,
  Trophy,
  Timer
} from 'lucide-react';
import { DashboardSummaryData } from '@/lib/types';

interface SummaryCardsProps {
  data?: DashboardSummaryData;
  showAllWorkspaces?: boolean;
  workspaceCount?: number;
}

export function SummaryCards({ 
  data, 
  showAllWorkspaces, 
  workspaceCount 
}: SummaryCardsProps) {
  if (!data) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-3 sm:h-4 bg-muted rounded w-16 sm:w-24"></div>
              <div className="h-3 w-3 sm:h-4 sm:w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 sm:h-8 bg-muted rounded w-12 sm:w-16 mb-1 sm:mb-2"></div>
              <div className="h-2 sm:h-3 bg-muted rounded w-20 sm:w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Reports',
      value: data.totalReports,
      description: 'All reports in selected period',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: null,
    },
    {
      title: 'Approved',
      value: data.approvedReports,
      description: `${data.totalReports > 0 ? Math.round((data.approvedReports / data.totalReports) * 100) : 0}% approval rate`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: 'positive',
    },
    {
      title: 'Pending Review',
      value: data.pendingReports,
      description: 'Awaiting approval',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: null,
    },
    {
      title: 'Rejected',
      value: data.rejectedReports,
      description: `${data.totalReports > 0 ? Math.round((data.rejectedReports / data.totalReports) * 100) : 0}% rejection rate`,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: 'negative',
    },
    {
      title: 'Drafts',
      value: data.draftReports,
      description: 'Unsubmitted reports',
      icon: FileEdit,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      trend: null,
    },
    {
      title: 'Monthly Submissions',
      value: data.monthlySubmissions,
      description: 'Last 30 days',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'positive',
    },
    {
      title: 'Avg. Approval Time',
      value: `${Math.round(data.avgApprovalTime)}h`,
      description: 'Time to approval',
      icon: Timer,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: 'neutral',
    },
    {
      title: 'Top Department',
      value: data.topPerformingDepartment || 'N/A',
      description: 'Highest approval rate',
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      trend: 'positive',
      isText: true,
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <Card 
            key={index} 
            className="relative overflow-hidden transition-all duration-200 hover:shadow-md hover:scale-[1.02] touch-manipulation"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">
                {card.title}
              </CardTitle>
              <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-lg ${card.bgColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pb-3 sm:pb-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className={`${card.isText ? 'text-sm sm:text-lg' : 'text-lg sm:text-2xl'} font-bold ${card.color} truncate`}>
                  {card.value}
                </div>
                {card.trend && (
                  <Badge
                    variant={
                      card.trend === 'positive' 
                        ? 'default' 
                        : card.trend === 'negative' 
                        ? 'destructive' 
                        : 'secondary'
                    }
                    className="h-4 sm:h-5 px-1 sm:px-1.5 text-xs flex-shrink-0"
                  >
                    <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3" />
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {card.description}
              </p>
            </CardContent>
            
            {/* Subtle background pattern - hidden on mobile for better performance */}
            <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 opacity-5 hidden sm:block">
              <Icon className="w-full h-full" />
            </div>
          </Card>
        );
      })}
    </div>
  );
} 