'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ApprovalTrendData } from '@/lib/types';
import { TrendingUp, Clock, CheckCircle, AlertTriangle, Award, Target } from 'lucide-react';

interface MonthlyApprovalTrendChartProps {
  data: ApprovalTrendData[];
  showAllWorkspaces?: boolean;
  workspaceCount?: number;
}

const chartConfig = {
  approvedCount: {
    label: "Approved",
    color: "hsl(var(--chart-2))",
  },
  rejectedCount: {
    label: "Rejected",
    color: "hsl(var(--chart-3))",
  },
  approvalRate: {
    label: "Approval Rate %",
    color: "hsl(var(--chart-1))",
  },
  avgProcessingTime: {
    label: "Avg Processing Time (days)",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

// Utility function to safely calculate monthly change
const calculateSafeMonthlyChange = (latest: any, previous: any) => {
  if (!latest || !previous) return null;
  
  const currentRate = latest.approvalRate;
  const prevRate = previous.approvalRate;
  
  // Check for valid numbers
  if (typeof currentRate !== 'number' || typeof prevRate !== 'number' || 
      isNaN(currentRate) || isNaN(prevRate)) {
    return null;
  }
  
  // Avoid division by zero
  if (prevRate === 0) {
    return currentRate > 0 ? 100 : 0;
  }
  
  const change = ((currentRate - prevRate) / prevRate) * 100;
  return isNaN(change) || !isFinite(change) ? null : change;
};

export function MonthlyApprovalTrendChart({ data }: MonthlyApprovalTrendChartProps) {
  const totalSubmissions = data.reduce((sum, month) => sum + month.totalSubmissions, 0);
  const totalApproved = data.reduce((sum, month) => sum + month.approvedCount, 0);
  const overallApprovalRate = totalSubmissions > 0 ? (totalApproved / totalSubmissions) * 100 : 0;
  
  // Calculate trend
  const recentRate = data.slice(-3).reduce((sum, month) => sum + month.approvalRate, 0) / 3;
  const previousRate = data.slice(-6, -3).reduce((sum, month) => sum + month.approvalRate, 0) / 3;
  const trendDirection = recentRate > previousRate ? 'up' : recentRate < previousRate ? 'down' : 'stable';
  const trendPercentage = previousRate > 0 ? ((recentRate - previousRate) / previousRate) * 100 : 0;

  // Performance analysis
  const bestMonth = data.reduce((best, month) => 
    month.approvalRate > best.approvalRate ? month : best, data[0] || { month: 'N/A', approvalRate: 0 });
  const worstMonth = data.reduce((worst, month) => 
    month.approvalRate < worst.approvalRate ? month : worst, data[0] || { month: 'N/A', approvalRate: 100 });
  const fastestMonth = data.reduce((fastest, month) => 
    month.avgProcessingTime < fastest.avgProcessingTime ? month : fastest, data[0] || { month: 'N/A', avgProcessingTime: 999 });

  // Recent performance with safe calculation
  const latestMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  const monthlyChange = calculateSafeMonthlyChange(latestMonth, previousMonth);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Monthly Approval Trends
            </CardTitle>
            <CardDescription>
              Approval rates and processing times over the last 6 months
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{Math.round(overallApprovalRate)}%</div>
            <div className="text-sm text-muted-foreground">Overall Rate</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stacked Area Chart - Approved vs Rejected */}
            <div>
              <h4 className="text-sm font-medium mb-3">Approval vs Rejection Volume</h4>
              <ChartContainer config={chartConfig} className="h-[200px] sm:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month"
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number, name: string, props: any) => {
                        const payload = props.payload;
                        if (name === 'approvedCount') {
                          return [`${value} approved (${payload.approvalRate.toFixed(1)}%)`, 'Approved'];
                        }
                        return [`${value} rejected`, 'Rejected'];
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="approvedCount"
                      stackId="1"
                      stroke="var(--color-approvedCount)"
                      fill="var(--color-approvedCount)"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="rejectedCount"
                      stackId="1"
                      stroke="var(--color-rejectedCount)"
                      fill="var(--color-rejectedCount)"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Line Chart - Approval Rate and Processing Time */}
            <div>
              <h4 className="text-sm font-medium mb-3">Approval Rate & Processing Time</h4>
              <ChartContainer config={chartConfig} className="h-[180px] sm:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month"
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      yAxisId="rate"
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis 
                      yAxisId="time"
                      orientation="right"
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => `${value}d`}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number, name: string) => {
                        if (name === 'approvalRate') {
                          return [`${value.toFixed(1)}%`, 'Approval Rate'];
                        }
                        return [`${value.toFixed(1)} days`, 'Avg Processing Time'];
                      }}
                    />
                    <Line
                      yAxisId="rate"
                      type="monotone"
                      dataKey="approvalRate"
                      stroke="var(--color-approvalRate)"
                      strokeWidth={3}
                      dot={{ fill: "var(--color-approvalRate)", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="time"
                      type="monotone"
                      dataKey="avgProcessingTime"
                      stroke="var(--color-avgProcessingTime)"
                      strokeWidth={2}
                      strokeDasharray="8 8"
                      dot={{ fill: "var(--color-avgProcessingTime)", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>

          {/* Right Column - Insights & Analytics */}
          <div className="space-y-4">
            {/* Performance Highlights */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Performance Highlights
              </h4>
              
              <div className="space-y-2">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">Best Month</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400">
                      {bestMonth?.month}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {bestMonth?.approvalRate.toFixed(1)}%
                  </div>
                </div>

                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-300">Fastest Processing</span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400">
                      {fastestMonth?.month}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {fastestMonth?.avgProcessingTime.toFixed(1)}d
                  </div>
                </div>
              </div>
            </div>

            {/* Month-over-Month Analysis */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Recent Performance
              </h4>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Monthly Change</span>
                  {monthlyChange !== null ? (
                    <div className={`flex items-center gap-1 ${
                      monthlyChange > 0 ? 'text-green-600' : monthlyChange < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      <span className="text-sm font-medium">
                        {monthlyChange > 0 ? '↗' : monthlyChange < 0 ? '↘' : '→'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <span className="text-sm">–</span>
                    </div>
                  )}
                </div>
                <div className={`text-lg font-bold ${
                  monthlyChange === null ? 'text-gray-400' :
                  monthlyChange > 0 ? 'text-green-600' : monthlyChange < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {monthlyChange === null ? 'N/A' : 
                   `${monthlyChange > 0 ? '+' : ''}${monthlyChange.toFixed(1)}%`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {latestMonth?.month || 'N/A'} vs {previousMonth?.month || 'N/A'}
                </div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-300">3-Month Trend</span>
                  <div className={`flex items-center gap-1 ${
                    trendDirection === 'up' ? 'text-green-600' : trendDirection === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    <span className="text-sm font-medium">
                      {trendDirection === 'up' ? '↗' : trendDirection === 'down' ? '↘' : '→'}
                    </span>
                  </div>
                </div>
                <div className={`text-lg font-bold ${
                  trendDirection === 'up' ? 'text-green-600' : trendDirection === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {Math.abs(trendPercentage).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Overall direction
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Key Insights
              </h4>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                {trendDirection === 'up' && (
                  <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Approval rates are trending upward over the last 3 months</span>
                  </div>
                )}
                
                {trendDirection === 'down' && (
                  <div className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>Approval rates have declined in recent months</span>
                  </div>
                )}

                {overallApprovalRate >= 80 && (
                  <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Overall approval rate is above 80% - excellent performance</span>
                  </div>
                )}

                {data.length > 0 && (data.reduce((sum, month) => sum + month.avgProcessingTime, 0) / data.length) <= 2 && (
                  <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <Clock className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Processing times are efficient (under 2 days average)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{totalSubmissions}</div>
            <div className="text-xs text-muted-foreground">Total Reports</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{totalApproved}</div>
            <div className="text-xs text-muted-foreground">Total Approved</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${
              trendDirection === 'up' ? 'text-green-600' : trendDirection === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {Math.abs(trendPercentage).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              3-Month Trend {trendDirection === 'up' ? '↗' : trendDirection === 'down' ? '↘' : '→'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {data.length > 0 ? (data.reduce((sum, month) => sum + month.avgProcessingTime, 0) / data.length).toFixed(1) : 0}d
            </div>
            <div className="text-xs text-muted-foreground">Avg Processing</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 