'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Receipt,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import { PayrollSummary } from '@/lib/payroll-service';
import { useCurrency } from '@/hooks/use-currency';

interface PayrollStatsProps {
  stats: PayrollSummary | null;
  loading: boolean;
}

export default function PayrollStats({ stats, loading }: PayrollStatsProps) {
  const { formatAmount } = useCurrency();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </div>
              <div className="mt-2">
                <div className="h-8 w-20 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Employees</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground">No employees found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Employees */}
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Employees</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Active
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">On payroll</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Gross Pay */}
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Gross Pay</span>
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">{formatAmount(stats.totalGrossPay)}</div>
            <p className="text-xs text-muted-foreground">Before deductions</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Net Pay */}
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Net Pay</span>
            </div>
            <Receipt className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">{formatAmount(stats.totalNetPay)}</div>
            <p className="text-xs text-muted-foreground">After deductions</p>
          </div>
        </CardContent>
      </Card>

      {/* Average Salary */}
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">Average Salary</span>
            </div>
            <PieChart className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">{formatAmount(stats.averageSalary)}</div>
            <p className="text-xs text-muted-foreground">Per employee</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Deductions */}
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Deductions</span>
            </div>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">{formatAmount(stats.totalDeductions)}</div>
            <p className="text-xs text-muted-foreground">Taxes & benefits</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Tax */}
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-muted-foreground">Total Tax</span>
            </div>
            <Badge variant="destructive" className="text-xs">
              Tax
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">{formatAmount(stats.totalTax)}</div>
            <p className="text-xs text-muted-foreground">Income tax</p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Payments */}
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-muted-foreground">Pending</span>
            </div>
            <Badge variant="outline" className="text-xs text-yellow-600">
              {stats.pendingPayments}
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </div>
        </CardContent>
      </Card>

      {/* Processed Payments */}
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Processed</span>
            </div>
            <Badge variant="outline" className="text-xs text-green-600">
              {stats.processedPayments}
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">{stats.processedPayments}</div>
            <p className="text-xs text-muted-foreground">Ready for payment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 