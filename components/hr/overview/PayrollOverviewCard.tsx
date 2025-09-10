'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp } from 'lucide-react';
import { PayrollService } from '@/lib/payroll-service';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { format } from 'date-fns';

interface PayrollStats {
  totalPayroll: number;
  averageSalary: number;
  pendingPayments: number;
  changePercentage: number;
  totalEmployees: number;
}

interface PayrollOverviewCardProps {
  shouldShowCrossWorkspace?: boolean;
  allWorkspaces?: any[];
  loading?: boolean;
}

export default function PayrollOverviewCard({ 
  shouldShowCrossWorkspace = false, 
  allWorkspaces = [], 
  loading: externalLoading = false 
}: PayrollOverviewCardProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PayrollStats>({
    totalPayroll: 0,
    averageSalary: 0,
    pendingPayments: 0,
    changePercentage: 0,
    totalEmployees: 0
  });

  useEffect(() => {
    const fetchPayrollStats = async () => {
      if (shouldShowCrossWorkspace) {
        if (!allWorkspaces.length) return;
      } else {
        if (!currentWorkspace?.id) return;
      }

      try {
        setLoading(true);
        
        // Get current month period
        const currentPeriod = format(new Date(), 'yyyy-MM');
        
        let allPayrollEmployees: any[] = [];
        let aggregatedStats = {
          totalPayroll: 0,
          averageSalary: 0,
          pendingPayments: 0,
          changePercentage: 0,
          totalEmployees: 0
        };
        
        if (shouldShowCrossWorkspace) {
          // Fetch payroll data from all workspaces
          for (const workspace of allWorkspaces) {
            try {
              const payrollEmployees = await PayrollService.getPayrollEmployees(
                workspace.id
              );
              allPayrollEmployees.push(...payrollEmployees);
              
              // Try to get payroll summary for this workspace
              try {
                const summary = await PayrollService.getPayrollStats(workspace.id, currentPeriod);
                if (summary) {
                  aggregatedStats.totalPayroll += summary.totalNetPay;
                  aggregatedStats.pendingPayments += summary.pendingPayments;
                  aggregatedStats.totalEmployees += summary.totalEmployees;
                }
              } catch (summaryError) {
                // Fall back to calculated stats for this workspace
                const workspaceTotalPayroll = payrollEmployees.reduce((sum, emp) => sum + emp.netSalary, 0);
                const workspacePendingPayments = payrollEmployees.filter(
                  emp => emp.payrollStatus === 'pending'
                ).length;
                
                aggregatedStats.totalPayroll += workspaceTotalPayroll;
                aggregatedStats.pendingPayments += workspacePendingPayments;
                aggregatedStats.totalEmployees += payrollEmployees.length;
              }
            } catch (error) {
              console.error(`Error fetching payroll data for workspace ${workspace.id}:`, error);
            }
          }
          
          // Calculate average salary across all workspaces
          aggregatedStats.averageSalary = aggregatedStats.totalEmployees > 0 ? 
            aggregatedStats.totalPayroll / aggregatedStats.totalEmployees : 0;
          
          setStats(aggregatedStats);
        } else {
          // Fetch payroll employees for current workspace only
          if (!currentWorkspace?.id) return;
          
          const payrollEmployees = await PayrollService.getPayrollEmployees(
            currentWorkspace.id
          );
          
          // Calculate stats
          const totalEmployees = payrollEmployees.length;
          const totalPayroll = payrollEmployees.reduce((sum, emp) => sum + emp.netSalary, 0);
          const averageSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;
          const pendingPayments = payrollEmployees.filter(
            emp => emp.payrollStatus === 'pending'
          ).length;
          
          // Try to get payroll summary for more accurate data
          try {
            const summary = await PayrollService.getPayrollStats(currentWorkspace.id, currentPeriod);
            if (summary) {
              setStats({
                totalPayroll: summary.totalNetPay,
                averageSalary: summary.averageSalary,
                pendingPayments: summary.pendingPayments,
                changePercentage: 0, // Would need historical data to calculate
                totalEmployees: summary.totalEmployees
              });
              return;
            }
          } catch (summaryError) {
            // Fall back to calculated stats if summary is not available
            console.log('Payroll summary not available, using calculated stats');
          }
          
          // Calculate change percentage (comparing with last month)
          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          const lastMonthPeriod = format(lastMonth, 'yyyy-MM');
          
          try {
            const lastMonthSummary = await PayrollService.getPayrollStats(
              currentWorkspace.id, 
              lastMonthPeriod
            );
            
            const changePercentage = lastMonthSummary && lastMonthSummary.totalNetPay > 0 ? 
              ((totalPayroll - lastMonthSummary.totalNetPay) / lastMonthSummary.totalNetPay) * 100 : 0;
            
            setStats({
              totalPayroll,
              averageSalary,
              pendingPayments,
              changePercentage,
              totalEmployees
            });
          } catch (error) {
            // If we can't get last month data, set change to 0
            setStats({
              totalPayroll,
              averageSalary,
              pendingPayments,
              changePercentage: 0,
              totalEmployees
            });
          }
        }
      } catch (error) {
        console.error('Error fetching payroll stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payroll statistics',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollStats();
  }, [currentWorkspace?.id, shouldShowCrossWorkspace, allWorkspaces, toast]);

  const formatTrend = (percentage: number): string => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage > 0) {
      return <TrendingUp className="w-4 h-4 text-red-500" />; // Higher payroll = red (cost increase)
    } else if (percentage < 0) {
      return <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />; // Lower payroll = green (cost decrease)
    }
    return <TrendingUp className="w-4 h-4 text-gray-500" />;
  };

  if (loading || externalLoading) {
    return (
      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
          {shouldShowCrossWorkspace ? 'Payroll (All Workspaces)' : 'Payroll'}
        </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex gap-2">
            <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-enhanced">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {shouldShowCrossWorkspace ? 'Payroll (All Workspaces)' : 'Payroll'}
        </CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatAmount(stats.totalPayroll)}</div>
        <div className="flex items-center text-xs text-muted-foreground mb-4">
          {getTrendIcon(stats.changePercentage)}
          <span className="ml-1">{formatTrend(stats.changePercentage)} from last month</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            Avg: {formatAmount(stats.averageSalary)}
          </Badge>
          {stats.pendingPayments > 0 && (
            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
              {stats.pendingPayments} Pending
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {stats.totalEmployees} Employees
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}