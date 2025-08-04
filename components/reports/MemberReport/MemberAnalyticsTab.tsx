"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReportStatus } from "@/lib/types"

interface MemberAnalyticsTabProps {
  stats: {
    totalReports: number;
    submittedReports: number;
    approvedReports: number;
    rejectedReports: number;
    pendingReports: number;
    draftReports: number;
    statusBreakdown: {
      status: ReportStatus;
      count: number;
      percentage: number;
    }[];
  };
}

export function MemberAnalyticsTab({ stats }: MemberAnalyticsTabProps) {
  const id = "member-reports-pie-chart"
  
  // Helper function to get readable status labels
  const getStatusLabel = (status: ReportStatus): string => {
    switch (status) {
      case 'draft': return 'Draft'
      case 'submitted': return 'Submitted'
      case 'under_review': return 'Under Review'
      case 'approved': return 'Approved'
      case 'rejected': return 'Rejected'
      case 'archived': return 'Archived'
      default: return status
    }
  }

  // Helper function to get status color
  const getStatusColor = (status: ReportStatus): string => {
    switch (status) {
      case 'draft': return '#6b7280' // Gray
      case 'submitted': return '#3b82f6' // Blue
      case 'under_review': return '#f59e0b' // Amber
      case 'approved': return '#10b981' // Green
      case 'rejected': return '#ef4444' // Red
      case 'archived': return '#9ca3af' // Gray
      default: return '#6b7280' // Gray
    }
  }
  
  // Transform status breakdown data for the chart
  const chartData = React.useMemo(() => {
    return stats.statusBreakdown
      .filter(item => item.count > 0) // Only show statuses with data
      .map((item, index) => ({
        status: item.status,
        count: item.count,
        percentage: item.percentage,
        fill: getStatusColor(item.status), // Use direct color instead of CSS variable
      }))
  }, [stats.statusBreakdown])

  const [activeStatus, setActiveStatus] = React.useState(chartData[0]?.status || 'draft')

  const activeIndex = React.useMemo(
    () => chartData.findIndex((item) => item.status === activeStatus),
    [activeStatus, chartData]
  )

  const statuses = React.useMemo(() => chartData.map((item) => item.status), [chartData])

  // Chart configuration with brand colors
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    
    chartData.forEach((item, index) => {
      config[item.status] = {
        label: getStatusLabel(item.status),
        color: getStatusColor(item.status), // Use direct color instead of CSS variable
      }
    })
    
    return config
  }, [chartData])

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Status Analytics</CardTitle>
          <CardDescription>No report data available for visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No reports found to display analytics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pie Chart Card */}
      <Card data-chart={id} className="flex flex-col">
        <ChartStyle id={id} config={chartConfig} />
        <CardHeader className="flex-row items-start space-y-0 pb-0">
          <div className="grid gap-1">
            <CardTitle>Report Status Distribution</CardTitle>
            <CardDescription>Breakdown of your reports by status</CardDescription>
          </div>
          <Select value={activeStatus} onValueChange={(value) => setActiveStatus(value as ReportStatus)}>
            <SelectTrigger
              className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
              aria-label="Select a status"
            >
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-xl">
              {statuses.map((status) => {
                const config = chartConfig[status as keyof typeof chartConfig]
                const color = getStatusColor(status as ReportStatus)

                if (!config) {
                  return null
                }

                return (
                  <SelectItem
                    key={status}
                    value={status}
                    className="rounded-lg [&_span]:flex"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="flex h-3 w-3 shrink-0 rounded-xs"
                        style={{
                          backgroundColor: color,
                        }}
                      />
                      {config?.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex flex-1 justify-center pb-0">
          <ChartContainer
            id={id}
            config={chartConfig}
            className="mx-auto aspect-square w-full max-w-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                strokeWidth={5}
                activeIndex={activeIndex}
                activeShape={({
                  outerRadius = 0,
                  ...props
                }: PieSectorDataItem) => (
                  <g>
                    <Sector {...props} outerRadius={outerRadius + 10} />
                    <Sector
                      {...props}
                      outerRadius={outerRadius + 25}
                      innerRadius={outerRadius + 12}
                    />
                  </g>
                )}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      const activeData = chartData[activeIndex]
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {activeData?.count || 0}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            {activeData ? getStatusLabel(activeData.status) : 'Reports'}
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chartData.map((item) => (
          <Card key={item.status} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {getStatusLabel(item.status)}
                  </p>
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.percentage}% of total
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-full opacity-10"
                  style={{
                    backgroundColor: getStatusColor(item.status),
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 