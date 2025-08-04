'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/hooks/use-currency';
import { PayrollService, Payslip } from '@/lib/payroll-service';
import { X, Download, FileText, Calendar, User, Building, Calculator, TrendingUp, CreditCard } from 'lucide-react';

interface ViewPayslipDialogProps {
  payslip: Payslip;
  onClose: () => void;
  onDownload?: () => void;
}

export default function ViewPayslipDialog({ 
  payslip, 
  onClose, 
  onDownload 
}: ViewPayslipDialogProps) {
  const { formatAmount } = useCurrency();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'processed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processed</Badge>;
      case 'sent':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Sent</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold">Payslip Details</h2>
              <p className="text-sm text-muted-foreground">
                {payslip.period} - {payslip.employeeName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid gap-6">
            {/* Header Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Period Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pay Period</p>
                    <p className="text-lg font-semibold">{payslip.period}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="text-lg font-semibold">{payslip.startDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="text-lg font-semibold">{payslip.endDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(payslip.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Currency</p>
                    <p className="text-lg font-semibold">{payslip.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Generated Date</p>
                    <p className="text-lg font-semibold">{payslip.generatedDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Employee Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employee Name</p>
                    <p className="text-lg font-semibold">{payslip.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                    <p className="text-lg font-semibold">{payslip.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Department</p>
                    <p className="text-lg font-semibold">{payslip.department}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Role</p>
                    <p className="text-lg font-semibold">{payslip.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Salary Breakdown */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Earnings
                  </CardTitle>
                  <CardDescription>
                    All earnings and allowances for this period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Base Salary</span>
                    <span className="font-semibold">
                      {formatAmount(payslip.baseSalary, payslip.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">+ Housing Allowance</span>
                    <span className="font-semibold">
                      {formatAmount(payslip.allowances.housing, payslip.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">+ Transport Allowance</span>
                    <span className="font-semibold">
                      {formatAmount(payslip.allowances.transport, payslip.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">+ Medical Allowance</span>
                    <span className="font-semibold">
                      {formatAmount(payslip.allowances.medical, payslip.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">+ Meal Allowance</span>
                    <span className="font-semibold">
                      {formatAmount(payslip.allowances.meal, payslip.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">+ Other Allowance</span>
                    <span className="font-semibold">
                      {formatAmount(payslip.allowances.other, payslip.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">+ Overtime</span>
                    <span className="font-semibold">
                      {formatAmount(payslip.overtime, payslip.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">+ Bonus</span>
                    <span className="font-semibold">
                      {formatAmount(payslip.bonus, payslip.currency)}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Gross Pay</span>
                      <span className="text-green-600">
                        {formatAmount(payslip.grossPay, payslip.currency)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Deductions
                  </CardTitle>
                  <CardDescription>
                    All deductions and taxes for this period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-sm">- Tax</span>
                    <span className="font-semibold">
                      {formatAmount(payslip.deductions.tax, payslip.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-sm">- Social Security</span>
                    <span className="font-semibold">
                      {formatAmount(payslip.deductions.socialSecurity, payslip.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-sm">- Pension</span>
                    <span className="font-semibold">
                      {formatAmount(payslip.deductions.pension, payslip.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-sm">- Insurance</span>
                    <span className="font-semibold">
                      {formatAmount(payslip.deductions.insurance, payslip.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-sm">- Other Deductions</span>
                    <span className="font-semibold">
                      {formatAmount(payslip.deductions.other, payslip.currency)}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total Deductions</span>
                      <span className="text-red-600">
                        {formatAmount(
                          Object.values(payslip.deductions).reduce((sum, value) => sum + value, 0),
                          payslip.currency
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Net Pay Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Net Pay Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Pay</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatAmount(payslip.netPay, payslip.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Pay Period</p>
                    <p className="font-semibold">{payslip.period}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          {onDownload && (
            <Button type="button" onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download Payslip
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 