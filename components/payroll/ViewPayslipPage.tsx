'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Receipt, 
  DollarSign, 
  User, 
  Calendar, 
  TrendingUp, 
  Calculator, 
  CreditCard, 
  Printer, 
  Download, 
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Building,
  FileText
} from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { Payslip } from '@/lib/payroll-service';

interface ViewPayslipPageProps {
  payslip: Payslip;
  onDownload?: () => void;
  onSend?: () => void;
}

export function ViewPayslipPage({ payslip, onDownload, onSend }: ViewPayslipPageProps) {
  const router = useRouter();
  const { formatAmount } = useCurrency();

  // Add print class to body when printing
  const handlePrint = () => {
    document.body.classList.add('printing-payslip');
    window.print();
    // Remove the class after printing
    setTimeout(() => {
      document.body.classList.remove('printing-payslip');
    }, 1000);
  };

  // Calculate totals
  const totalAllowances = useMemo(() => {
    return Object.values(payslip.allowances).reduce((sum, value) => sum + (value || 0), 0);
  }, [payslip.allowances]);

  const totalDeductions = useMemo(() => {
    return Object.values(payslip.deductions).reduce((sum, value) => sum + (value || 0), 0);
  }, [payslip.deductions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 print:bg-gray-200 print:text-gray-800">
            <Clock className="w-3 h-3" />
            Draft
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="default" className="flex items-center gap-1 print:bg-blue-100 print:text-blue-800">
            <CheckCircle className="w-3 h-3" />
            Sent
          </Badge>
        );
      case 'acknowledged':
        return (
          <Badge variant="default" className="flex items-center gap-1 print:bg-green-100 print:text-green-800">
            <CheckCircle className="w-3 h-3" />
            Acknowledged
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive" className="flex items-center gap-1 print:bg-red-100 print:text-red-800">
            <XCircle className="w-3 h-3" />
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 print:bg-white print:min-h-0 payslip-page">
      {/* Header - Hidden in Print */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/hr/payroll')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Payroll
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Payslip Details</h1>
                  <p className="text-sm text-muted-foreground">
                    {payslip.period} • {payslip.employeeName}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {payslip.status === 'draft' && onSend && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSend}
                  className="flex items-center gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                >
                  <Send className="w-4 h-4" />
                  Send Payslip
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
              {onDownload && (
                <Button
                  size="sm"
                  onClick={onDownload}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Header - Only Visible in Print */}
      <div className="hidden print:block print:py-6 print:px-6 print:border-b print:border-gray-300 print:mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payslip</h1>
              <p className="text-gray-600">
                {payslip.period} • {payslip.employeeName}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Generated: {payslip.generatedDate || 'N/A'}</p>
            {getStatusBadge(payslip.status)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 print:px-0 print:py-0 print:max-w-none print:container-none">
        <div className="max-w-6xl mx-auto space-y-8 print:space-y-6 print:max-w-none">
          {/* Status Banner - Hidden in Print */}
          <Card className="card-enhanced print:hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Payslip for {payslip.period}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Generated on {payslip.generatedDate || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(payslip.status)}
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Net Pay</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {formatAmount(payslip.netPay)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee & Period Info */}
          <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
            {/* Employee Information */}
            <Card className="card-enhanced print:shadow-none print:border print:border-gray-300 print:bg-white">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 print:bg-gray-50 print:border-gray-300">
                <CardTitle className="flex items-center gap-2 text-primary print:text-gray-900">
                  <User className="w-5 h-5" />
                  Employee Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 print:p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg print:bg-gray-50">
                    <span className="text-sm font-medium text-muted-foreground print:text-gray-600">Employee Name</span>
                    <span className="font-semibold text-foreground print:text-gray-900">{payslip.employeeName}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg print:bg-gray-50">
                    <span className="text-sm font-medium text-muted-foreground print:text-gray-600">Employee ID</span>
                    <span className="font-semibold text-foreground print:text-gray-900">{payslip.employeeId}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg print:bg-gray-50">
                    <span className="text-sm font-medium text-muted-foreground print:text-gray-600">Email</span>
                    <span className="font-semibold text-foreground print:text-gray-900">{payslip.employeeEmail}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Period Information */}
            <Card className="card-enhanced print:shadow-none print:border print:border-gray-300 print:bg-white">
              <CardHeader className="bg-gradient-to-r from-accent/5 to-transparent border-b border-border/50 print:bg-gray-50 print:border-gray-300">
                <CardTitle className="flex items-center gap-2 text-accent print:text-gray-900">
                  <Calendar className="w-5 h-5" />
                  Period Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 print:p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg print:bg-gray-50">
                    <span className="text-sm font-medium text-muted-foreground print:text-gray-600">Pay Period</span>
                    <span className="font-semibold text-foreground print:text-gray-900">{payslip.period}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg print:bg-gray-50">
                    <span className="text-sm font-medium text-muted-foreground print:text-gray-600">Start Date</span>
                    <span className="font-semibold text-foreground print:text-gray-900">{payslip.startDate}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg print:bg-gray-50">
                    <span className="text-sm font-medium text-muted-foreground print:text-gray-600">End Date</span>
                    <span className="font-semibold text-foreground print:text-gray-900">{payslip.endDate}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg print:bg-gray-50">
                    <span className="text-sm font-medium text-muted-foreground print:text-gray-600">Currency</span>
                    <span className="font-semibold text-foreground print:text-gray-900">{payslip.currency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Salary Breakdown */}
          <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
            {/* Earnings */}
            <Card className="card-enhanced print:shadow-none print:border print:border-gray-300 print:bg-white">
              <CardHeader className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-b border-border/50 print:bg-emerald-50 print:border-gray-300">
                <CardTitle className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 print:text-emerald-800">
                  <TrendingUp className="w-5 h-5" />
                  Earnings & Allowances
                </CardTitle>
                <CardDescription className="text-emerald-600/80 dark:text-emerald-400/80 print:text-emerald-700">
                  All earnings and allowances for this period
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 print:p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg print:bg-emerald-50">
                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200 print:text-emerald-800">Base Salary</span>
                    <span className="font-semibold text-emerald-800 dark:text-emerald-200 print:text-emerald-800">
                      {formatAmount(payslip.baseSalary)}
                    </span>
                  </div>
                  
                  {payslip.allowances.housing > 0 && (
                    <div className="flex justify-between items-center p-2 bg-emerald-50/50 dark:bg-emerald-900/20 rounded print:bg-emerald-50">
                      <span className="text-sm text-emerald-700 dark:text-emerald-300 print:text-emerald-700">+ Housing Allowance</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 print:text-emerald-700">
                        {formatAmount(payslip.allowances.housing)}
                      </span>
                    </div>
                  )}
                  
                  {payslip.allowances.transport > 0 && (
                    <div className="flex justify-between items-center p-2 bg-emerald-50/50 dark:bg-emerald-900/20 rounded print:bg-emerald-50">
                      <span className="text-sm text-emerald-700 dark:text-emerald-300 print:text-emerald-700">+ Transport Allowance</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 print:text-emerald-700">
                        {formatAmount(payslip.allowances.transport)}
                      </span>
                    </div>
                  )}
                  
                  {payslip.allowances.medical > 0 && (
                    <div className="flex justify-between items-center p-2 bg-emerald-50/50 dark:bg-emerald-900/20 rounded print:bg-emerald-50">
                      <span className="text-sm text-emerald-700 dark:text-emerald-300 print:text-emerald-700">+ Medical Allowance</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 print:text-emerald-700">
                        {formatAmount(payslip.allowances.medical)}
                      </span>
                    </div>
                  )}
                  
                  {payslip.allowances.meal > 0 && (
                    <div className="flex justify-between items-center p-2 bg-emerald-50/50 dark:bg-emerald-900/20 rounded print:bg-emerald-50">
                      <span className="text-sm text-emerald-700 dark:text-emerald-300 print:text-emerald-700">+ Meal Allowance</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 print:text-emerald-700">
                        {formatAmount(payslip.allowances.meal)}
                      </span>
                    </div>
                  )}
                  
                  {payslip.allowances.other > 0 && (
                    <div className="flex justify-between items-center p-2 bg-emerald-50/50 dark:bg-emerald-900/20 rounded print:bg-emerald-50">
                      <span className="text-sm text-emerald-700 dark:text-emerald-300 print:text-emerald-700">+ Other Allowance</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 print:text-emerald-700">
                        {formatAmount(payslip.allowances.other)}
                      </span>
                    </div>
                  )}
                  
                  {payslip.overtime > 0 && (
                    <div className="flex justify-between items-center p-2 bg-emerald-50/50 dark:bg-emerald-900/20 rounded print:bg-emerald-50">
                      <span className="text-sm text-emerald-700 dark:text-emerald-300 print:text-emerald-700">+ Overtime</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 print:text-emerald-700">
                        {formatAmount(payslip.overtime)}
                      </span>
                    </div>
                  )}
                  
                  {payslip.bonus > 0 && (
                    <div className="flex justify-between items-center p-2 bg-emerald-50/50 dark:bg-emerald-900/20 rounded print:bg-emerald-50">
                      <span className="text-sm text-emerald-700 dark:text-emerald-300 print:text-emerald-700">+ Bonus</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 print:text-emerald-700">
                        {formatAmount(payslip.bonus)}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-emerald-200 dark:border-emerald-700 pt-3 mt-4 print:border-emerald-300">
                    <div className="flex justify-between items-center p-3 bg-emerald-100/70 dark:bg-emerald-900/40 rounded-lg print:bg-emerald-100">
                      <span className="font-bold text-emerald-800 dark:text-emerald-200">Total Allowances</span>
                      <span className="font-bold text-emerald-800 dark:text-emerald-200">
                        {formatAmount(totalAllowances)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-emerald-200 dark:border-emerald-700 pt-3 print:border-emerald-300">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 dark:from-emerald-900/50 dark:to-emerald-800/50 rounded-lg print:bg-emerald-100">
                      <span className="font-bold text-lg text-emerald-800 dark:text-emerald-200">Gross Pay</span>
                      <span className="font-bold text-lg text-emerald-800 dark:text-emerald-200">
                        {formatAmount(payslip.grossPay)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card className="card-enhanced print:shadow-none print:border print:border-gray-300 print:bg-white">
              <CardHeader className="bg-gradient-to-r from-red-500/20 to-red-600/10 border-b border-border/50 print:bg-red-50 print:border-gray-300">
                <CardTitle className="flex items-center gap-2 text-red-500 dark:text-red-400 print:text-red-800">
                  <Calculator className="w-5 h-5" />
                  Deductions & Taxes
                </CardTitle>
                <CardDescription className="text-red-600/80 dark:text-red-400/80 print:text-red-700">
                  All deductions and taxes for this period
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 print:p-4">
                <div className="space-y-3">
                  {payslip.deductions.tax > 0 && (
                    <div className="flex justify-between items-center p-2 bg-red-50/50 dark:bg-red-900/20 rounded print:bg-red-50">
                      <span className="text-sm text-red-700 dark:text-red-300 print:text-red-700">- Tax</span>
                      <span className="font-semibold text-red-700 dark:text-red-300 print:text-red-700">
                        {formatAmount(payslip.deductions.tax)}
                      </span>
                    </div>
                  )}
                  
                  {payslip.deductions.socialSecurity > 0 && (
                    <div className="flex justify-between items-center p-2 bg-red-50/50 dark:bg-red-900/20 rounded print:bg-red-50">
                      <span className="text-sm text-red-700 dark:text-red-300 print:text-red-700">- Social Security</span>
                      <span className="font-semibold text-red-700 dark:text-red-300 print:text-red-700">
                        {formatAmount(payslip.deductions.socialSecurity)}
                      </span>
                    </div>
                  )}
                  
                  {payslip.deductions.pension > 0 && (
                    <div className="flex justify-between items-center p-2 bg-red-50/50 dark:bg-red-900/20 rounded print:bg-red-50">
                      <span className="text-sm text-red-700 dark:text-red-300 print:text-red-700">- Pension</span>
                      <span className="font-semibold text-red-700 dark:text-red-300 print:text-red-700">
                        {formatAmount(payslip.deductions.pension)}
                      </span>
                    </div>
                  )}
                  
                  {payslip.deductions.insurance > 0 && (
                    <div className="flex justify-between items-center p-2 bg-red-50/50 dark:bg-red-900/20 rounded print:bg-red-50">
                      <span className="text-sm text-red-700 dark:text-red-300 print:text-red-700">- Insurance</span>
                      <span className="font-semibold text-red-700 dark:text-red-300 print:text-red-700">
                        {formatAmount(payslip.deductions.insurance)}
                      </span>
                    </div>
                  )}
                  
                  {payslip.deductions.other > 0 && (
                    <div className="flex justify-between items-center p-2 bg-red-50/50 dark:bg-red-900/20 rounded print:bg-red-50">
                      <span className="text-sm text-red-700 dark:text-red-300 print:text-red-700">- Other Deductions</span>
                      <span className="font-semibold text-red-700 dark:text-red-300 print:text-red-700">
                        {formatAmount(payslip.deductions.other)}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-red-200 dark:border-red-700 pt-3 mt-4 print:border-red-300">
                    <div className="flex justify-between items-center p-3 bg-red-100/70 dark:bg-red-900/40 rounded-lg print:bg-red-100">
                      <span className="font-bold text-red-800 dark:text-red-200">Total Deductions</span>
                      <span className="font-bold text-red-800 dark:text-red-200">
                        {formatAmount(totalDeductions)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Net Pay Summary */}
          <Card className="card-enhanced print:shadow-none print:border print:border-gray-300 print:bg-white">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/50 print:bg-gray-50 print:border-gray-300">
              <CardTitle className="flex items-center gap-2 text-primary print:text-gray-900">
                <CreditCard className="w-5 h-5" />
                Net Pay Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 print:p-6">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20 print:bg-gray-50 print:border-gray-300">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 print:text-gray-600">Net Pay for {payslip.period}</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent print:text-gray-900">
                    {formatAmount(payslip.netPay)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 print:text-gray-600">
                    Gross: {formatAmount(payslip.grossPay)} • Deductions: {formatAmount(totalDeductions)}
                  </p>
                </div>
                <div className="text-right print:hidden">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}