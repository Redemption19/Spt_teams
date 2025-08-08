'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, TrendingUp } from 'lucide-react';
import { RecruitmentService } from '@/lib/recruitment-service';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';

interface RecruitmentStats {
  openPositions: number;
  totalApplications: number;
  inProgress: number;
  hired: number;
  changePercentage: number;
}

interface RecruitmentOverviewCardProps {
  shouldShowCrossWorkspace?: boolean;
  allWorkspaces?: any[];
  loading?: boolean;
}

export default function RecruitmentOverviewCard({ 
  shouldShowCrossWorkspace = false, 
  allWorkspaces = [], 
  loading: externalLoading = false 
}: RecruitmentOverviewCardProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RecruitmentStats>({
    openPositions: 0,
    totalApplications: 0,
    inProgress: 0,
    hired: 0,
    changePercentage: 0
  });

  useEffect(() => {
    const fetchRecruitmentStats = async () => {
      if (shouldShowCrossWorkspace) {
        if (!allWorkspaces.length) return;
      } else {
        if (!currentWorkspace?.id) return;
      }

      try {
        setLoading(true);
        
        let aggregatedStats = {
          openPositions: 0,
          totalApplications: 0,
          inProgress: 0,
          hired: 0,
          changePercentage: 0
        };
        
        if (shouldShowCrossWorkspace) {
          // Fetch recruitment data from all workspaces
          let allApplications: any[] = [];
          
          for (const workspace of allWorkspaces) {
            try {
              const recruitmentStats = await RecruitmentService.getRecruitmentStats(workspace.id);
              
              aggregatedStats.openPositions += recruitmentStats.openPositions;
              aggregatedStats.totalApplications += recruitmentStats.totalApplications;
              aggregatedStats.inProgress += recruitmentStats.inProgress;
              aggregatedStats.hired += recruitmentStats.hired;
              
              // Collect applications for change percentage calculation
              const applications = await RecruitmentService.getJobApplications(workspace.id);
              allApplications.push(...applications);
            } catch (error) {
              console.error(`Error fetching recruitment data for workspace ${workspace.id}:`, error);
            }
          }
          
          // Calculate change percentage across all workspaces
          const now = new Date();
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          
          const lastMonthCount = allApplications.filter(app => {
            const appDate = app.createdAt;
            return appDate >= lastMonth && appDate < now;
          }).length;
          
          const previousMonthCount = allApplications.filter(app => {
            const appDate = app.createdAt;
            return appDate >= twoMonthsAgo && appDate < lastMonth;
          }).length;
          
          aggregatedStats.changePercentage = previousMonthCount > 0 
            ? ((lastMonthCount - previousMonthCount) / previousMonthCount) * 100
            : lastMonthCount > 0 ? 100 : 0;
          
          setStats(aggregatedStats);
        } else {
          // Fetch recruitment statistics for current workspace only
          if (!currentWorkspace?.id) return;
          
          const recruitmentStats = await RecruitmentService.getRecruitmentStats(currentWorkspace.id);
          
          // Calculate change percentage based on recent vs older applications
          const now = new Date();
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          
          const recentApplications = await RecruitmentService.getJobApplications(currentWorkspace.id);
          const lastMonthCount = recentApplications.filter(app => {
            const appDate = app.createdAt;
            return appDate >= lastMonth && appDate < now;
          }).length;
          
          const previousMonthCount = recentApplications.filter(app => {
            const appDate = app.createdAt;
            return appDate >= twoMonthsAgo && appDate < lastMonth;
          }).length;
          
          const changePercentage = previousMonthCount > 0 
            ? ((lastMonthCount - previousMonthCount) / previousMonthCount) * 100
            : lastMonthCount > 0 ? 100 : 0;
          
          setStats({
            openPositions: recruitmentStats.openPositions,
            totalApplications: recruitmentStats.totalApplications,
            inProgress: recruitmentStats.inProgress,
            hired: recruitmentStats.hired,
            changePercentage
          });
        }
      } catch (error) {
        console.error('Error fetching recruitment stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load recruitment statistics',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecruitmentStats();
  }, [currentWorkspace?.id, shouldShowCrossWorkspace, allWorkspaces, toast]);

  const formatTrend = (percentage: number): string => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (percentage < 0) {
      return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    }
    return <TrendingUp className="w-4 h-4 text-gray-500" />;
  };

  if (loading || externalLoading) {
    return (
      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
          {shouldShowCrossWorkspace ? 'Recruitment (All Workspaces)' : 'Recruitment'}
        </CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex gap-2">
            <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalActivity = stats.openPositions + stats.totalApplications + stats.inProgress + stats.hired;

  return (
    <Card className="card-enhanced">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {shouldShowCrossWorkspace ? 'Recruitment (All Workspaces)' : 'Recruitment'}
        </CardTitle>
        <UserPlus className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.openPositions}</div>
        <div className="flex items-center text-xs text-muted-foreground mb-4">
          {getTrendIcon(stats.changePercentage)}
          <span className="ml-1">
            {totalActivity === 0 ? 'No recruitment activity' : `${formatTrend(stats.changePercentage)} from last month`}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {stats.totalApplications > 0 && (
            <Badge variant="secondary" className="text-xs">
              {stats.totalApplications} Applications
            </Badge>
          )}
          {stats.inProgress > 0 && (
            <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
              {stats.inProgress} In Progress
            </Badge>
          )}
          {stats.hired > 0 && (
            <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
              {stats.hired} Hired
            </Badge>
          )}
          {totalActivity === 0 && (
            <Badge variant="outline" className="text-xs">
              No Open Positions
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}