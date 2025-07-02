'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DepartmentReportsData } from '@/lib/types';
import { Building } from 'lucide-react';

interface DepartmentReportsChartProps {
  data: DepartmentReportsData[];
}

const chartConfig = {
  total: {
    label: "Total Reports",
    color: "hsl(var(--chart-1))",
  },
  approved: {
    label: "Approved",
    color: "hsl(var(--chart-2))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-3))",
  },
  rejected: {
    label: "Rejected",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export function DepartmentReportsChart({ data }: DepartmentReportsChartProps) {
  const totalReports = data.reduce((sum, dept) => sum + dept.total, 0);
  const topDepartment = data.reduce((prev, current) => 
    (prev.total > current.total) ? prev : current, 
    data[0] || { department: 'N/A', total: 0, approvalRate: 0 }
  );

  // Prepare data for pie chart (top 5 departments by total reports)
  const pieData = data
    .filter(dept => dept.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((dept, index) => ({
      name: dept.department,
      value: dept.total,
      percentage: totalReports > 0 ? (dept.total / totalReports) * 100 : 0,
      fill: `hsl(var(--chart-${(index % 4) + 1}))`
    }));

  // Prepare data for bar chart (approval rates) - mobile optimized
  const barData = data
    .filter(dept => dept.total > 0)
    .sort((a, b) => b.approvalRate - a.approvalRate)
    .slice(0, 4) // Reduced for mobile visibility
    .map(dept => ({
      department: dept.department.length > 8 ? dept.department.substring(0, 6) + '...' : dept.department,
      fullName: dept.department,
      approvalRate: dept.approvalRate,
      total: dept.total,
      approved: dept.approved,
      pending: dept.pending,
      rejected: dept.rejected
    }));

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Building className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Department Reports
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Report distribution and approval rates by department
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 pb-4">
        {/* Pie Chart - Report Distribution */}
        <div>
          <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Report Distribution</h4>
          <ChartContainer 
            config={chartConfig} 
            className="h-[160px] sm:h-[180px] md:h-[200px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  innerRadius="40%"
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={1}
                >
                  {pieData.map((entry, index) => (
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
        </div>

        {/* Bar Chart - Approval Rates */}
        <div>
          <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Approval Rates</h4>
          <ChartContainer 
            config={chartConfig} 
            className="h-[160px] sm:h-[180px] md:h-[200px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ 
                  top: 10, 
                  right: 10, 
                  left: 10, 
                  bottom: 40 
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="department"
                  className="text-xs"
                  tick={{ fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                  interval={0}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 9 }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  width={30}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number, name: string, props: any) => [
                    `${value.toFixed(1)}%`,
                    'Approval Rate'
                  ]}
                  labelFormatter={(label: string, payload: any) => {
                    const data = payload?.[0]?.payload;
                    return data ? `${data.fullName}: ${data.approved}/${data.total} approved` : label;
                  }}
                />
                <Bar 
                  dataKey="approvalRate" 
                  fill="var(--color-approved)"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Summary Stats - Responsive Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
          <div className="text-center p-2 rounded-lg bg-muted/20">
            <div className="text-base sm:text-lg font-bold text-primary">
              {data.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Active Departments
            </div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/20">
            <div className="text-base sm:text-lg font-bold text-green-600">
              {topDepartment.department !== 'N/A' ? Math.round(topDepartment.approvalRate) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">
              Best Approval Rate
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 