"use client";
import * as React from "react";
import { Label, Pie, PieChart, Sector, Cell } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const desktopData = [
  { month: "january", desktop: 186, fill: "var(--brand-primary, #6366f1)" },
  { month: "february", desktop: 305, fill: "var(--brand-secondary, #22d3ee)" },
  { month: "march", desktop: 237, fill: "var(--brand-tertiary, #f59e42)" },
  { month: "april", desktop: 173, fill: "var(--brand-quaternary, #f43f5e)" },
  { month: "may", desktop: 209, fill: "var(--brand-quinary, #10b981)" },
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
  },
  mobile: {
    label: "Mobile",
  },
  january: {
    label: "January",
    color: "var(--brand-primary, #6366f1)",
  },
  february: {
    label: "February",
    color: "var(--brand-secondary, #22d3ee)",
  },
  march: {
    label: "March",
    color: "var(--brand-tertiary, #f59e42)",
  },
  april: {
    label: "April",
    color: "var(--brand-quaternary, #f43f5e)",
  },
  may: {
    label: "May",
    color: "var(--brand-quinary, #10b981)",
  },
} satisfies ChartConfig;

export function ChartPieInteractive({
  data,
  dataKey,
  nameKey,
  title,
  description,
  headerRight,
}: {
  data: any[];
  dataKey: string;
  nameKey: string;
  title: string;
  description?: string;
  headerRight?: React.ReactNode;
}) {
  const id = "pie-interactive";
  // Active index for highlighting (default to first slice)
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <Card data-chart={id} className="flex flex-col">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0 justify-between">
        <div className="grid gap-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {headerRight && <div className="ml-auto">{headerRight}</div>}
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
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex}
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
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
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
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
                          {data[activeIndex][dataKey]?.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {title}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 