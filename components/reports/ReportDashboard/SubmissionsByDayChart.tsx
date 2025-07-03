'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { SubmissionsByDayData } from '@/lib/types';
import { Calendar, Activity } from 'lucide-react';

interface SubmissionsByDayChartProps {
  data: SubmissionsByDayData[];
  showAllWorkspaces?: boolean;
  workspaceCount?: number;
}

const chartConfig = {
  submissions: {
    label: "Submissions",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function SubmissionsByDayChart({ data }: SubmissionsByDayChartProps) {
  const totalSubmissions = data.reduce((sum, day) => sum + day.submissions, 0);
  const busiestDay = data.reduce((prev, current) => 
    (prev.submissions > current.submissions) ? prev : current, 
    data[0] || { day: 'N/A', submissions: 0 }
  );

  // Prepare chart data with color intensity based on submission count
  const chartData = data.map(day => {
    const intensity = day.intensity;
    const alpha = Math.max(0.2, intensity); // Minimum 20% opacity
    
    return {
      ...day,
      dayShort: day.day.substring(0, 3), // Mon, Tue, etc.
      fill: `hsl(var(--chart-1) / ${alpha})`,
      strokeColor: intensity > 0.7 ? 'hsl(var(--chart-1))' : 'hsl(var(--border))'
    };
  });

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-muted';
    if (intensity < 0.3) return 'bg-blue-100 dark:bg-blue-900/30';
    if (intensity < 0.6) return 'bg-blue-300 dark:bg-blue-700/50';
    if (intensity < 0.8) return 'bg-blue-500 dark:bg-blue-600/70';
    return 'bg-blue-700 dark:bg-blue-500';
  };

  const getTextColor = (intensity: number) => {
    if (intensity > 0.6) return 'text-white';
    return 'text-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Submissions by Day
        </CardTitle>
        <CardDescription>
          Report submission patterns throughout the week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Heatmap Grid */}
        <div>
          <h4 className="text-sm font-medium mb-3">Weekly Heatmap</h4>
          <div className="grid grid-cols-7 gap-2">
            {chartData.map((day) => (
              <div
                key={day.day}
                className={`
                  relative p-3 rounded-lg border transition-all duration-200 hover:scale-105 cursor-pointer
                  ${getIntensityColor(day.intensity)}
                  ${getTextColor(day.intensity)}
                `}
                title={`${day.day}: ${day.submissions} submissions`}
              >
                <div className="text-center">
                  <div className="text-xs font-medium mb-1">
                    {day.dayShort}
                  </div>
                  <div className="text-lg font-bold">
                    {day.submissions}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted border"></div>
              <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30 border"></div>
              <div className="w-3 h-3 rounded bg-blue-300 dark:bg-blue-700/50 border"></div>
              <div className="w-3 h-3 rounded bg-blue-500 dark:bg-blue-600/70 border"></div>
              <div className="w-3 h-3 rounded bg-blue-700 dark:bg-blue-500 border"></div>
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Daily Breakdown</h4>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="dayShort"
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} submissions`,
                    props.payload.day
                  ]}
                />
                <Bar 
                  dataKey="submissions" 
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.strokeColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{totalSubmissions}</div>
            <div className="text-xs text-muted-foreground">Total Weekly</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{busiestDay.day}</div>
            <div className="text-xs text-muted-foreground">Busiest Day</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {Math.round((totalSubmissions / 7) * 10) / 10}
            </div>
            <div className="text-xs text-muted-foreground">Daily Average</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}