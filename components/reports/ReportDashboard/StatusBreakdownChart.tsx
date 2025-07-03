'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { StatusBreakdownData } from '@/lib/types';
import { PieChart as PieChartIcon, Activity } from 'lucide-react';

interface StatusBreakdownChartProps {
  data: StatusBreakdownData[];
  showAllWorkspaces?: boolean;
  workspaceCount?: number;
}

const chartConfig = {
  approved: {
    label: "Approved",
    color: "hsl(var(--chart-1))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-2))",
  },
  rejected: {
    label: "Rejected",
    color: "hsl(var(--chart-3))",
  },
  draft: {
    label: "Draft",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export function StatusBreakdownChart({ data }: StatusBreakdownChartProps) {
  const totalReports = data.reduce((sum, item) => sum + item.value, 0);
  
  const chartData = data.map(item => ({
    ...item,
    fill: item.color,
  }));

  const renderCustomizedLabel = (entry: any) => {
    if (entry.percentage < 5) return ''; // Don't show labels for very small slices
    return `${entry.percentage.toFixed(1)}%`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Status Breakdown
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Distribution of report statuses
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Responsive Chart */}
        <ChartContainer 
          config={chartConfig} 
          className="h-[200px] sm:h-[240px] md:h-[280px] lg:h-[300px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius="65%"
                innerRadius="35%"
                fill="#8884d8"
                dataKey="value"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number, name: string) => [
                  `${value} reports (${((value / totalReports) * 100).toFixed(1)}%)`,
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Responsive Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4">
          {data.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-foreground truncate">
                  {item.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.value} ({item.percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary with responsive text */}
        <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Total Reports:</span>
            <span className="xs:hidden">Total:</span>
          </div>
          <div className="text-sm sm:text-base font-medium">
            {totalReports.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}