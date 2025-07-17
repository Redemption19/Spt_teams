// components/databases/DatabaseAnalytics.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Database, 
  Activity, 
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
  DatabaseAnalyticsService, 
  type DatabaseMetrics, 
  type PerformanceMetrics,
  type GrowthTrends,
  type UsagePatterns,
  type AnalyticsReport
} from '@/lib/database-management/database-analytics';

export default function DatabaseAnalytics() {
  const [metrics, setMetrics] = useState<DatabaseMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [growthTrends, setGrowthTrends] = useState<GrowthTrends[]>([]);
  const [usagePatterns, setUsagePatterns] = useState<UsagePatterns | null>(null);
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [reportType, setReportType] = useState('overview');
  const [trendPeriod, setTrendPeriod] = useState('month');

  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();

  const loadAnalytics = useCallback(async () => {
    if (!currentWorkspace) return;

    setLoading(true);
    try {
      const [
        metricsData,
        performanceData,
        trendsData,
        usageData,
        reportsData
      ] = await Promise.all([
        DatabaseAnalyticsService.getDatabaseMetrics(currentWorkspace.id),
        DatabaseAnalyticsService.getPerformanceMetrics(currentWorkspace.id),
        DatabaseAnalyticsService.getGrowthTrends(currentWorkspace.id, trendPeriod as 'week' | 'month' | 'quarter'),
        DatabaseAnalyticsService.getUsagePatterns(currentWorkspace.id),
        DatabaseAnalyticsService.getAnalyticsReports(currentWorkspace.id)
      ]);

      setMetrics(metricsData);
      setPerformanceMetrics(performanceData);
      setGrowthTrends(trendsData);
      setUsagePatterns(usageData);
      setReports(reportsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, trendPeriod, toast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const generateReport = async () => {
    if (!currentWorkspace || !user) return;

    setLoading(true);
    try {
      const report = await DatabaseAnalyticsService.generateAnalyticsReport(
        currentWorkspace.id,
        user.uid,
        {
          reportType: reportType as 'overview' | 'performance' | 'growth' | 'usage' | 'custom',
          includeInsights: true,
          includeRecommendations: true
        }
      );

      setReports(prev => [report, ...prev]);
      
      toast({
        title: "Report Generated",
        description: `Analytics report "${report.reportType}" has been generated successfully`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate analytics report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceStatus = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Analytics</h2>
          <p className="text-muted-foreground">
            Advanced analytics and reporting for your workspace
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadAnalytics}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={generateReport}
            disabled={loading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="growth">Growth Trends</TabsTrigger>
          <TabsTrigger value="usage">Usage Patterns</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {metrics && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold">{metrics.totalUsers}</p>
                        <p className="text-xs text-muted-foreground">
                          {metrics.activeUsers} active
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                        <p className="text-2xl font-bold">{metrics.totalProjects}</p>
                      </div>
                      <Database className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                        <p className="text-2xl font-bold">{metrics.totalTasks}</p>
                        <p className="text-xs text-muted-foreground">
                          {metrics.completedTasks} completed
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Performance Score</p>
                        <p className={`text-2xl font-bold ${getPerformanceColor(metrics.performanceScore)}`}>
                          {metrics.performanceScore.toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getPerformanceStatus(metrics.performanceScore)}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Task Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Task Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Completed</span>
                        <Badge variant="default">{metrics.completedTasks}</Badge>
                      </div>
                      <Progress 
                        value={(metrics.completedTasks / Math.max(metrics.totalTasks, 1)) * 100} 
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Pending</span>
                        <Badge variant="secondary">{metrics.pendingTasks}</Badge>
                      </div>
                      <Progress 
                        value={(metrics.pendingTasks / Math.max(metrics.totalTasks, 1)) * 100} 
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Overdue</span>
                        <Badge variant="destructive">{metrics.overdueTasks}</Badge>
                      </div>
                      <Progress 
                        value={(metrics.overdueTasks / Math.max(metrics.totalTasks, 1)) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Storage Usage</span>
                        <span className="text-sm text-muted-foreground">
                          {formatBytes(metrics.storageUsage)}
                        </span>
                      </div>
                      <Progress value={Math.min((metrics.storageUsage / (1024 * 1024 * 100)) * 100, 100)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Data Growth Rate</span>
                        <span className="text-sm text-muted-foreground">
                          {formatPercentage(metrics.dataGrowthRate)}
                        </span>
                      </div>
                      <Progress value={Math.min(Math.abs(metrics.dataGrowthRate), 100)} />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Backups: {metrics.backupCount}</span>
                    </div>
                    {metrics.lastBackupDate && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">
                          Last backup: {metrics.lastBackupDate.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {performanceMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {performanceMetrics.responseTime.toFixed(0)}ms
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Average response time for database queries
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Error Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {performanceMetrics.errorRate.toFixed(2)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Percentage of failed operations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {performanceMetrics.uptime.toFixed(2)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    System availability
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Concurrent Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {performanceMetrics.concurrentUsers}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Average concurrent users
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Growth Trends</h3>
            <Select value={trendPeriod} onValueChange={setTrendPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {growthTrends.map((trend, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-sm">{trend.period}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Users</span>
                    <span className={`text-sm font-medium ${trend.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trend.userGrowth >= 0 ? '+' : ''}{formatPercentage(trend.userGrowth)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Projects</span>
                    <span className={`text-sm font-medium ${trend.projectGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trend.projectGrowth >= 0 ? '+' : ''}{formatPercentage(trend.projectGrowth)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Tasks</span>
                    <span className={`text-sm font-medium ${trend.taskGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trend.taskGrowth >= 0 ? '+' : ''}{formatPercentage(trend.taskGrowth)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {usagePatterns && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Popular Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {usagePatterns.popularFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{feature.feature}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={feature.percentage} className="w-24 h-2" />
                          <span className="text-sm text-muted-foreground">
                            {feature.usageCount} uses
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {usagePatterns.userEngagement.daily}
                      </div>
                      <p className="text-sm text-muted-foreground">Daily Active Users</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {usagePatterns.userEngagement.weekly}
                      </div>
                      <p className="text-sm text-muted-foreground">Weekly Active Users</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {usagePatterns.userEngagement.monthly}
                      </div>
                      <p className="text-sm text-muted-foreground">Monthly Active Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Analytics Reports</h3>
            <div className="flex gap-2">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="usage">Usage</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={generateReport} disabled={loading}>
                <FileText className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg capitalize">{report.reportType} Report</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Generated on {report.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {report.metrics.totalUsers} users, {report.metrics.totalProjects} projects
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {report.insights.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Key Insights</h4>
                      <ul className="space-y-1">
                        {report.insights.map((insight, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {report.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {report.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {reports.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reports generated yet</p>
                  <p className="text-sm text-muted-foreground">
                    Generate your first analytics report to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 