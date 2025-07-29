"use client";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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

function getMonthKey(date: Date) {
  return date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
}

export function ChartBarMultiple({ workspaceIds }: { workspaceIds: string[] }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // 1. Get last 6 months
        const now = new Date();
        const months: string[] = [];
        const monthDates: Date[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(getMonthKey(d));
          monthDates.push(d);
        }
        // 2. Fetch all expenses and budgets
        const [expenses, budgets] = await Promise.all([
          ExpenseManagementService.getExpensesForWorkspaces(workspaceIds),
          BudgetTrackingService.getBudgetsForWorkspaces(workspaceIds),
        ]);
        // 3. Aggregate expenses by month
        const expenseMap: Record<string, number> = {};
        expenses.forEach(e => {
          if (!e.expenseDate) return;
          const d = new Date(e.expenseDate);
          const key = getMonthKey(new Date(d.getFullYear(), d.getMonth(), 1));
          if (months.includes(key)) {
            expenseMap[key] = (expenseMap[key] || 0) + (e.amountInBaseCurrency || 0);
          }
        });
        // 4. Aggregate budgets by month (sum of budgets active in each month)
        const budgetMap: Record<string, number> = {};
        monthDates.forEach((monthDate, idx) => {
          const key = months[idx];
          let totalBudget = 0;
          budgets.forEach(b => {
            if (!b.isActive) return;
            const bStart = new Date(b.startDate);
            const bEnd = new Date(b.endDate);
            // If budget is active at any point in the month
            if (
              bStart <= new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0) &&
              bEnd >= new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
            ) {
              totalBudget += b.amount;
            }
          });
          budgetMap[key] = totalBudget;
        });
        // 5. Build chart data
        const chartData = months.map(month => ({
          month,
          expenses: expenseMap[month] || 0,
          budget: budgetMap[month] || 0,
        }));
        setData(chartData);
      } catch (err) {
        setError('Failed to load chart data.');
      } finally {
        setLoading(false);
      }
    }
    if (workspaceIds && workspaceIds.length > 0) fetchData();
  }, [workspaceIds]);

  if (loading) {
    return <Card><CardHeader><CardTitle>Bar Chart - Multiple</CardTitle></CardHeader><CardContent>Loading chart...</CardContent></Card>;
  }
  if (error) {
    return <Card><CardHeader><CardTitle>Bar Chart - Multiple</CardTitle></CardHeader><CardContent className="text-red-500">{error}</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses vs. Budgets (Last 6 Months)</CardTitle>
        <CardDescription>Monthly comparison of total expenses and allocated budgets</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="expenses" fill="#6366f1" radius={4} />
            <Bar dataKey="budget" fill="#22d3ee" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing expenses vs. budgets for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
} 