'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/lib/workspace-context';
import { BillingService } from '@/lib/billing-service';
import { ExpenseManagementService } from '@/lib/expense-management-service';
import { DepartmentService } from '@/lib/department-service';
import { BudgetTrackingService } from '@/lib/budget-tracking-service';
import { TrendingDown, ArrowUpRight, ArrowDownRight, Calendar, DollarSign, Download, FileText, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ChartAreaInteractive } from '@/components/ui/ChartAreaInteractive';
import { ChartPieInteractive } from '@/components/ui/ChartPieInteractive';
import { ChartBarMultiple } from '@/components/ui/ChartBarMultiple';
import { ChartLineMultiple } from '@/components/ui/ChartLineMultiple';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdvancedAnalyticsLoadingSkeleton from '@/components/financial/AdvancedAnalyticsLoadingSkeleton';

export default function AdvancedAnalyticsPage() {
  const { accessibleWorkspaces } = useWorkspace();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [forecastedCash, setForecastedCash] = useState(0);
  const [pieBudgetData, setPieBudgetData] = useState<any[]>([]);
  const [pieExpenseData, setPieExpenseData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [months, setMonths] = useState<string[]>([]);
  const [lineChartData, setLineChartData] = useState<any[]>([]);
  const [lineChartConfig, setLineChartConfig] = useState<any>({});
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Calculate last 6 months for dropdown
    const now = new Date();
    const monthList: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthList.push(d.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
    }
    setMonths(monthList);
    setSelectedMonth(monthList[monthList.length - 1]); // Default to most recent
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const workspaceIds = accessibleWorkspaces.map(ws => ws.id);
        // --- Shared variables ---
        const now = new Date();
        // 1. Fetch all expenses once
        const allExpensesFull = await ExpenseManagementService.getExpensesForWorkspaces(workspaceIds);
        // Revenue
        const totalRevenue = await BillingService.getTotalMonthlyRevenueForWorkspaces(workspaceIds);
        setRevenue(totalRevenue);
        // Expenses
        const totalExpenses = allExpensesFull.reduce((sum, e) => sum + (e.amountInBaseCurrency || 0), 0);
        setExpenses(totalExpenses);
        // Net Profit
        setNetProfit(totalRevenue - totalExpenses);
        // Forecasted Cash (simple: last net profit + revenue)
        setForecastedCash(totalRevenue - totalExpenses + 100000); // Placeholder for current cash balance

        // --- Pie Chart Data ---
        // 1. Fetch all departments for all workspaces
        const allDepartments: any[] = [];
        for (const ws of accessibleWorkspaces) {
          const depts = await DepartmentService.getWorkspaceDepartments(ws.id);
          allDepartments.push(...depts.map(d => ({ ...d, workspaceId: ws.id })));
        }
        // 2. Fetch all budgets
        const allBudgets = await BudgetTrackingService.getBudgetsForWorkspaces(workspaceIds);
        // 3. Prepare color palette
        const palette = [
          '#6366f1', // Indigo
          '#22d3ee', // Cyan
          '#f59e42', // Orange
          '#f43f5e', // Rose
          '#10b981', // Emerald
          '#eab308', // Amber
          '#a21caf', // Purple
          '#0ea5e9', // Sky
          '#f472b6', // Pink
          '#84cc16', // Lime
        ];
        // 4. Build department/workspace map for color and name
        const deptMap: Record<string, { name: string; color: string }> = {};
        allDepartments.forEach((d, idx) => {
          deptMap[d.id] = {
            name: d.name,
            color: d.color || palette[idx % palette.length],
          };
        });
        // Add workspaces to map
        accessibleWorkspaces.forEach((ws, idx) => {
          deptMap[ws.id] = {
            name: ws.name,
            color: palette[(allDepartments.length + idx) % palette.length],
          };
        });
        // 5. Filter budgets and expenses by selected month
        let monthIdx = months.findIndex(m => m === selectedMonth);
        if (monthIdx === -1) monthIdx = months.length - 1;
        const monthDate = new Date(now.getFullYear(), now.getMonth() - (months.length - 1 - monthIdx), 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
        // Budgets: active during this month
        const filteredBudgets = allBudgets.filter(b => {
          const bStart = new Date(b.startDate);
          const bEnd = new Date(b.endDate);
          return bStart <= monthEnd && bEnd >= monthStart;
        });
        // Expenses: expenseDate in this month
        const filteredExpenses = allExpensesFull.filter(e => {
          if (!e.expenseDate) return false;
          const d = new Date(e.expenseDate);
          return d >= monthStart && d <= monthEnd;
        });
        // 6. Aggregate budgets by department and workspace
        const budgetAgg: Record<string, number> = {};
        filteredBudgets.forEach(b => {
          if (b.type === 'department' && b.entityId) {
            budgetAgg[b.entityId] = (budgetAgg[b.entityId] || 0) + b.amount;
          } else if (b.type === 'workspace' && b.entityId) {
            budgetAgg[b.entityId] = (budgetAgg[b.entityId] || 0) + b.amount;
          }
        });
        // 7. Aggregate expenses by department and workspace
        const expenseAgg: Record<string, number> = {};
        filteredExpenses.forEach(e => {
          if (e.departmentId) {
            expenseAgg[e.departmentId] = (expenseAgg[e.departmentId] || 0) + (e.amountInBaseCurrency || 0);
          } else if (e.workspaceId) {
            expenseAgg[e.workspaceId] = (expenseAgg[e.workspaceId] || 0) + (e.amountInBaseCurrency || 0);
          }
        });
        // 8. Build pie data arrays (departments + workspaces with any budget/expense)
        const allKeys = Array.from(new Set([
          ...Object.keys(budgetAgg),
          ...Object.keys(expenseAgg),
        ]));
        const pieBudget = allKeys.map((id) => ({
          id,
          name: deptMap[id]?.name || 'Unknown',
          budget: budgetAgg[id] || 0,
          fill: deptMap[id]?.color || '#6366f1',
        })).filter(d => d.budget > 0);
        const pieExpense = allKeys.map((id) => ({
          id,
          name: deptMap[id]?.name || 'Unknown',
          expenses: expenseAgg[id] || 0,
          fill: deptMap[id]?.color || '#6366f1',
        })).filter(d => d.expenses > 0);
        setPieBudgetData(pieBudget);
        setPieExpenseData(pieExpense);

        // --- Custom Metrics for Line Chart ---
        // 1. Get last 6 months
        const monthsArr: string[] = [];
        const monthDates: Date[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthsArr.push(d.toLocaleString('en-US', { month: 'short' }));
          monthDates.push(d);
        }
        // 2. Aggregate by month and status
        const metricsByMonth: Record<string, { transactions: number; approved: number; rejected: number }> = {};
        monthsArr.forEach(month => {
          metricsByMonth[month] = { transactions: 0, approved: 0, rejected: 0 };
        });
        allExpensesFull.forEach(e => {
          if (!e.expenseDate) return;
          const d = new Date(e.expenseDate);
          const key = d.toLocaleString('en-US', { month: 'short' });
          if (metricsByMonth[key]) {
            metricsByMonth[key].transactions += 1;
            if (e.status === 'approved') metricsByMonth[key].approved += 1;
            if (e.status === 'rejected') metricsByMonth[key].rejected += 1;
          }
        });
        // 3. Build chart data
        const lineData = monthsArr.map(month => ({
          month,
          transactions: metricsByMonth[month].transactions,
          approved: metricsByMonth[month].approved,
          rejected: metricsByMonth[month].rejected,
        }));
        setLineChartData(lineData);
        setLineChartConfig({
          transactions: { label: 'Transactions', color: '#6366f1' },
          approved: { label: 'Approved', color: '#10b981' },
          rejected: { label: 'Rejected', color: '#f43f5e' },
        });
      } catch (err) {
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    }
    if (selectedMonth && months.length > 0) fetchData();
  }, [accessibleWorkspaces, selectedMonth, months]);

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Revenue', revenue],
      ['Total Expenses', expenses],
      ['Net Profit', netProfit],
      ['Forecasted Cash (30-Day)', forecastedCash],
    ];
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'advanced-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    // To enable PDF export, install jspdf and html2canvas:
    // npm install jspdf html2canvas
    // Then uncomment and use the code below:
    /*
    const jsPDF = (await import('jspdf')).default;
    const html2canvas = (await import('html2canvas')).default;
    if (cardsRef.current) {
      const canvas = await html2canvas(cardsRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape' });
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 10, width, height);
      pdf.save('advanced-analytics.pdf');
    }
    */
    alert('PDF export requires jspdf and html2canvas. See code comments for instructions.');
  };

  if (loading) {
    return <AdvancedAnalyticsLoadingSkeleton />;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  const isProfit = netProfit >= 0;

  // Month dropdown as a reusable element
  const monthDropdown = (
    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
      <SelectTrigger className="w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {months.map((month) => (
          <SelectItem key={month} value={month}>
            {month}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      {/* Header with Back Button and Export Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Advanced Budget Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive financial insights and advanced analytics
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Export CSV
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>
      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>All sources this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold text-green-600">
              <DollarSign className="w-6 h-6" />₵{revenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        {/* Total Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
            <CardDescription>All outgoing this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold text-red-600">
              <TrendingDown className="w-6 h-6" />₵{expenses.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        {/* Net Profit */}
        <Card>
          <CardHeader>
            <CardTitle>Net Profit (MTD)</CardTitle>
            <CardDescription>Revenue - Expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-2 text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {isProfit ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
              ₵{netProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        {/* Forecasted Cash */}
        <Card>
          <CardHeader>
            <CardTitle>Forecasted Cash (30-Day)</CardTitle>
            <CardDescription>Projected balance in 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold text-blue-600">
              <Calendar className="w-6 h-6" />₵{forecastedCash.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <ChartAreaInteractive workspaceIds={accessibleWorkspaces.map(ws => ws.id)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <ChartPieInteractive
          data={pieBudgetData}
          dataKey="budget"
          nameKey="name"
          title="Budgets by Department & Workspace"
          description={`Distribution of total budgets for ${selectedMonth}`}
          headerRight={monthDropdown}
        />
        <ChartPieInteractive
          data={pieExpenseData}
          dataKey="expenses"
          nameKey="name"
          title="Expenditure by Department & Workspace"
          description={`Distribution of total expenditure for ${selectedMonth}`}
          headerRight={monthDropdown}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <ChartBarMultiple workspaceIds={accessibleWorkspaces.map(ws => ws.id)} />
        <ChartLineMultiple
          data={lineChartData}
          config={lineChartConfig}
          title="Operational Analytics"
          description="Transactions, Approved, and Rejected Expenses (Last 6 Months)"
        />
      </div>
    </div>
  );
}