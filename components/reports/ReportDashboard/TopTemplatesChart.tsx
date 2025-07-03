'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TopTemplatesData } from '@/lib/types';
import { FileText, Star, Calendar } from 'lucide-react';

interface TopTemplatesChartProps {
  data: TopTemplatesData[];
  showAllWorkspaces?: boolean;
  workspaceCount?: number;
}

const chartConfig = {
  usageCount: {
    label: "Usage Count",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function TopTemplatesChart({ data }: TopTemplatesChartProps) {
  const totalUsage = data.reduce((sum, template) => sum + template.usageCount, 0);
  const topTemplate = data[0] || { templateName: 'N/A', usageCount: 0 };

  // Prepare chart data (top 8 templates for better visibility)
  const chartData = data.slice(0, 8).map(template => ({
    name: template.templateName.length > 15 
      ? template.templateName.substring(0, 12) + '...' 
      : template.templateName,
    fullName: template.templateName,
    usageCount: template.usageCount,
    category: template.category,
    department: template.department,
    percentage: totalUsage > 0 ? (template.usageCount / totalUsage) * 100 : 0,
    lastUsed: template.lastUsed,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Top Templates
        </CardTitle>
        <CardDescription>
          Most frequently used report templates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number"
                className="text-xs"
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                type="category"
                dataKey="name"
                className="text-xs"
                tick={{ fontSize: 10 }}
                width={60}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number, name: string, props: any) => [
                  `${value} uses (${props.payload.percentage.toFixed(1)}%)`,
                  'Usage Count'
                ]}
                labelFormatter={(label: string, payload: any) => {
                  const data = payload?.[0]?.payload;
                  return data ? data.fullName : label;
                }}
              />
              <Bar 
                dataKey="usageCount" 
                fill="var(--color-usageCount)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Template List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Template Details</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.slice(0, 5).map((template, index) => (
              <div 
                key={template.templateId} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {template.templateName}
                    </span>
                    {index === 0 && (
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      {template.category}
                    </Badge>
                    <span>{template.department}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-lg font-bold text-primary">
                    {template.usageCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {totalUsage > 0 ? ((template.usageCount / totalUsage) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{data.length}</div>
            <div className="text-xs text-muted-foreground">Active Templates</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{totalUsage}</div>
            <div className="text-xs text-muted-foreground">Total Usage</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {topTemplate.usageCount}
            </div>
            <div className="text-xs text-muted-foreground">Most Used</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}