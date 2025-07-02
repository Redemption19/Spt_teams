'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ReportsOverTimeData } from '@/lib/types';
import { TrendingUp, Calendar } from 'lucide-react';

interface ReportsOverTimeChartProps {
  data: ReportsOverTimeData[];
}

const chartConfig = {
  submitted: {
    label: "Submitted",
    color: "hsl(var(--chart-1))",
  },
  approved: {
    label: "Approved", 
    color: "hsl(var(--chart-2))",
  },
  rejected: {
    label: "Rejected",
    color: "hsl(var(--chart-3))",
  },
  drafts: {
    label: "Drafts",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export function ReportsOverTimeChart({ data }: ReportsOverTimeChartProps) {
  // Calculate trend
  const totalSubmissions = data.reduce((sum, item) => sum + item.submitted, 0);
  const avgDaily = data.length > 0 ? totalSubmissions / data.length : 0;
  
  // Get recent trend (last 7 days vs previous 7 days)
  const recentData = data.slice(-7);
  const previousData = data.slice(-14, -7);
  const recentAvg = recentData.reduce((sum, item) => sum + item.submitted, 0) / recentData.length;
  const previousAvg = previousData.reduce((sum, item) => sum + item.submitted, 0) / previousData.length;
  const trendPercentage = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

  // Format data for display
  const chartData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Reports Over Time
            </CardTitle>
            <CardDescription>
              Daily report submissions and status changes
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{Math.round(avgDaily)}</div>
            <div className="text-sm text-muted-foreground">avg/day</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="formattedDate" 
                className="text-sm"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis className="text-sm" tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                labelFormatter={(value) => `Date: ${value}`}
              />
              <Line
                type="monotone"
                dataKey="submitted"
                stroke="var(--color-submitted)"
                strokeWidth={2}
                dot={{ fill: "var(--color-submitted)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="approved"
                stroke="var(--color-approved)"
                strokeWidth={2}
                dot={{ fill: "var(--color-approved)", strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="rejected"
                stroke="var(--color-rejected)"
                strokeWidth={2}
                dot={{ fill: "var(--color-rejected)", strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="drafts"
                stroke="var(--color-drafts)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "var(--color-drafts)", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Trend Indicator */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>7-day trend:</span>
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trendPercentage > 0 ? 'text-green-600' : trendPercentage < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            <TrendingUp className={`h-4 w-4 ${trendPercentage < 0 ? 'rotate-180' : ''}`} />
            <span>
              {Math.abs(trendPercentage).toFixed(1)}% 
              {trendPercentage > 0 ? ' increase' : trendPercentage < 0 ? ' decrease' : ' no change'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 