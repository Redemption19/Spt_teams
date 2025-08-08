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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="stats-card">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 sm:h-5 sm:w-5 bg-muted rounded animate-pulse" />
                <div className="h-3 w-20 sm:h-4 sm:w-24 bg-muted rounded animate-pulse" />
              </div>
              <div className="mt-2">
                <div className="h-6 w-16 sm:h-8 sm:w-20 bg-muted rounded animate-pulse mb-2" />
                <div className="h-2 w-12 sm:h-3 sm:w-16 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="stats-card">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Employees</span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground">No employees found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {/* Total Employees */}
      <Card className="stats-card hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Employees</span>
            </div>
            <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">
              Active
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">On payroll</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Gross Pay */}
      <Card className="stats-card hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Gross Pay</span>
            </div>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-all">{formatAmount(stats.totalGrossPay)}</div>
            <p className="text-xs text-muted-foreground">Before deductions</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Net Pay */}
      <Card className="stats-card hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Net Pay</span>
            </div>
            <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-all">{formatAmount(stats.totalNetPay)}</div>
            <p className="text-xs text-muted-foreground">After deductions</p>
          </div>
        </CardContent>
      </Card>

      {/* Average Salary */}
      <Card className="stats-card hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Average Salary</span>
            </div>
            <PieChart className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-all">{formatAmount(stats.averageSalary)}</div>
            <p className="text-xs text-muted-foreground">Per employee</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Deductions */}
      <Card className="stats-card hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Deductions</span>
            </div>
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-all">{formatAmount(stats.totalDeductions)}</div>
            <p className="text-xs text-muted-foreground">Taxes & benefits</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Tax */}
      <Card className="stats-card hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Tax</span>
            </div>
            <Badge variant="destructive" className="text-xs flex-shrink-0 ml-2">
              Tax
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-all">{formatAmount(stats.totalTax)}</div>
            <p className="text-xs text-muted-foreground">Income tax</p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Payments */}
      <Card className="stats-card hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Pending</span>
            </div>
            <Badge variant="outline" className="text-xs text-yellow-600 flex-shrink-0 ml-2">
              {stats.pendingPayments}
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </div>
        </CardContent>
      </Card>

      {/* Processed Payments */}
      <Card className="stats-card hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Processed</span>
            </div>
            <Badge variant="outline" className="text-xs text-green-600 flex-shrink-0 ml-2">
              {stats.processedPayments}
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.processedPayments}</div>
            <p className="text-xs text-muted-foreground">Successfully paid</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}