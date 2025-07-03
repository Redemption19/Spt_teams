'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { UserSubmissionData } from '@/lib/types';
import { Users, Award, Clock } from 'lucide-react';

interface UserSubmissionChartProps {
  data: UserSubmissionData[];
  showAllWorkspaces?: boolean;
  workspaceCount?: number;
}

const chartConfig = {
  totalSubmissions: {
    label: "Total Submissions",
    color: "hsl(var(--chart-1))",
  },
  approvalRate: {
    label: "Approval Rate %",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function UserSubmissionChart({ data }: UserSubmissionChartProps) {
  const totalUsers = data.length;
  const topUser = data[0] || { userName: 'N/A', totalSubmissions: 0, approvalRate: 0 };
  const avgSubmissions = data.length > 0 ? data.reduce((sum, user) => sum + user.totalSubmissions, 0) / data.length : 0;

  // Prepare chart data (top 8 users for visibility)
  const chartData = data.slice(0, 8).map(user => ({
    name: user.userName.length > 12 ? user.userName.substring(0, 10) + '...' : user.userName,
    fullName: user.userName,
    totalSubmissions: user.totalSubmissions,
    approvalRate: user.approvalRate,
    department: user.department,
  }));

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          User Performance
        </CardTitle>
        <CardDescription>
          Top users by submission count and approval rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        <ChartContainer config={chartConfig} className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name"
                className="text-xs"
                tick={{ fontSize: 9 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                yAxisId="submissions"
                className="text-xs"
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                yAxisId="rate"
                orientation="right"
                className="text-xs"
                tick={{ fontSize: 10 }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                yAxisId="submissions"
                dataKey="totalSubmissions"
                fill="var(--color-totalSubmissions)"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="rate"
                type="monotone"
                dataKey="approvalRate"
                stroke="var(--color-approvalRate)"
                strokeWidth={2}
                dot={{ fill: "var(--color-approvalRate)", strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* User List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {data.slice(0, 6).map((user, index) => (
            <div 
              key={user.userId} 
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs font-medium">
                    {getInitials(user.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{user.userName}</div>
                  <div className="text-xs text-muted-foreground">{user.department}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">{user.totalSubmissions}</div>
                <div className="text-xs text-muted-foreground">{user.approvalRate.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{totalUsers}</div>
            <div className="text-xs text-muted-foreground">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{Math.round(avgSubmissions)}</div>
            <div className="text-xs text-muted-foreground">Avg Submissions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{Math.round(topUser.approvalRate)}%</div>
            <div className="text-xs text-muted-foreground">Top Approval Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}