"use client";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
  ChartLegend,
  ChartLegendContent,
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
import { ExpenseManagementService } from '@/lib/expense-management-service';
import { BudgetTrackingService } from '@/lib/budget-tracking-service';

const chartConfig = {
  expenses: {
    label: "Expenses",
    color: "var(--brand-primary, #6366f1)",
  },
  budget: {
    label: "Budget",
    color: "var(--brand-secondary, #22d3ee)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive({ workspaceIds }: { workspaceIds: string[] }) {
  const [timeRange, setTimeRange] = React.useState("90d");
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch all expenses and budgets for the workspaceIds
        const [expenses, budgets] = await Promise.all([
          ExpenseManagementService.getExpensesForWorkspaces(workspaceIds),
          BudgetTrackingService.getBudgetsForWorkspaces(workspaceIds),
        ]);
        // 2. Determine date range
        const referenceDate = new Date();
        let daysToSubtract = 90;
        if (timeRange === "30d") daysToSubtract = 30;
        else if (timeRange === "7d") daysToSubtract = 7;
        const startDate = new Date(referenceDate);
        startDate.setDate(startDate.getDate() - daysToSubtract);
        // 3. Aggregate expenses by day
        const expenseMap: Record<string, number> = {};
        expenses.forEach(e => {
          if (!e.expenseDate) return;
          const d = new Date(e.expenseDate);
          if (d < startDate || d > referenceDate) return;
          const key = d.toISOString().slice(0, 10);
          expenseMap[key] = (expenseMap[key] || 0) + (e.amountInBaseCurrency || 0);
        });
        // 4. For each day, sum budgets active on that day
        const budgetMap: Record<string, number> = {};
        for (let d = new Date(startDate); d <= referenceDate; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().slice(0, 10);
          let totalBudget = 0;
          budgets.forEach(b => {
            if (!b.isActive) return;
            const bStart = new Date(b.startDate);
            const bEnd = new Date(b.endDate);
            if (d >= bStart && d <= bEnd) {
              totalBudget += b.amount;
            }
          });
          budgetMap[key] = totalBudget;
        }
        // 5. Build chart data array
        const chartData: any[] = [];
        for (let d = new Date(startDate); d <= referenceDate; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().slice(0, 10);
          chartData.push({
            date: key,
            expenses: expenseMap[key] || 0,
            budget: budgetMap[key] || 0,
          });
        }
        setData(chartData);
      } catch (err) {
        setError('Failed to load chart data.');
      } finally {
        setLoading(false);
      }
    }
    if (workspaceIds && workspaceIds.length > 0) fetchData();
  }, [workspaceIds, timeRange]);

  if (loading) {
    return <Card className="pt-0"><CardHeader><CardTitle>Area Chart - Interactive</CardTitle></CardHeader><CardContent>Loading chart...</CardContent></Card>;
  }
  if (error) {
    return <Card className="pt-0"><CardHeader><CardTitle>Area Chart - Interactive</CardTitle></CardHeader><CardContent className="text-red-500">{error}</CardContent></Card>;
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Area Chart - Interactive</CardTitle>
          <CardDescription>
            Daily Expenses vs. Budget ({timeRange === '90d' ? 'Last 3 months' : timeRange === '30d' ? 'Last 30 days' : 'Last 7 days'})
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--brand-primary, #6366f1)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--brand-primary, #6366f1)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillBudget" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--brand-secondary, #22d3ee)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--brand-secondary, #22d3ee)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="expenses"
              type="natural"
              fill="url(#fillExpenses)"
              stroke="var(--brand-primary, #6366f1)"
              stackId="a"
            />
            <Area
              dataKey="budget"
              type="natural"
              fill="url(#fillBudget)"
              stroke="var(--brand-secondary, #22d3ee)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 