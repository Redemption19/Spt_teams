'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Send,
  Download,
  Building,
  Calculator
} from 'lucide-react';
import { PayrollEmployee } from '@/lib/payroll-service';
import { useCurrency } from '@/hooks/use-currency';

interface PayrollEmployeeCardProps {
  employee: PayrollEmployee;
  onEdit?: (employee: PayrollEmployee) => void;
  onDelete?: (employee: PayrollEmployee) => void;
  onSendPayslip?: (employee: PayrollEmployee) => void;
  onDownloadPayslip?: (employee: PayrollEmployee) => void;
  onProcess?: (employee: PayrollEmployee) => void;
  showWorkspaceName?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canSendPayslip?: boolean;
  canProcess?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (employeeId: string, selected: boolean) => void;
  showSelection?: boolean;
  isProcessing?: boolean;
}

export default function PayrollEmployeeCard({
  employee,
  onEdit,
  onDelete,
  onSendPayslip,
  onDownloadPayslip,
  onProcess,
  showWorkspaceName = false,
  canEdit = false,
  canDelete = false,
  canSendPayslip = false,
  canProcess = false,
  isSelected = false,
  onSelectionChange,
  showSelection = false,
  isProcessing = false
}: PayrollEmployeeCardProps) {
  const { formatAmount } = useCurrency();

  const getStatusBadge = (status: PayrollEmployee['payrollStatus']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case 'processed':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Processed</Badge>;
      case 'paid':
        return <Badge variant="outline" className="text-green-600 border-green-600">Paid</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 border-red-600">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: PayrollEmployee['payrollStatus']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const totalAllowances = Object.values(employee.allowances).reduce((sum, val) => sum + val, 0);
  const totalDeductions = Object.values(employee.deductions).reduce((sum, val) => sum + val, 0);

  const handleSelectionChange = (checked: boolean) => {
    onSelectionChange?.(employee.id, checked);
  };

  return (
    <Card className={`card-enhanced hover:shadow-md transition-shadow duration-200 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {showSelection && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleSelectionChange}
                className="flex-shrink-0"
              />
            )}
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg truncate">{employee.employeeName}</CardTitle>
              <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="truncate">{employee.employeeId}</span>
                {showWorkspaceName && employee.workspaceName && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <Building className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{employee.workspaceName}</span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              {getStatusIcon(employee.payrollStatus)}
              <Badge variant={employee.payrollStatus === 'pending' ? 'secondary' : 'default'} className="text-xs">
                {employee.payrollStatus}
              </Badge>
            </div>
            <Badge variant={employee.isFixedSalary ? 'outline' : 'destructive'} className="text-xs">
              {employee.isFixedSalary ? 'Fixed' : 'Variable'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Employee Details */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h4 className="font-medium text-xs sm:text-sm text-muted-foreground">Department & Role</h4>
              <p className="text-sm break-words">{employee.department} • {employee.role}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-xs sm:text-sm text-muted-foreground">Base Salary</h4>
              <p className="text-base sm:text-lg font-semibold text-foreground break-all">
                {formatAmount(employee.baseSalary)} {employee.currency}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-xs sm:text-sm text-muted-foreground">Net Salary</h4>
              <p className="text-base sm:text-lg font-semibold text-green-600 break-all">
                {formatAmount(employee.netSalary)} {employee.currency}
              </p>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h4 className="font-medium text-xs sm:text-sm text-muted-foreground">Allowances</h4>
              <div className="text-xs sm:text-sm space-y-1">
                <div className="flex justify-between items-center">
                  <span className="truncate mr-2">Housing:</span>
                  <span className="font-medium break-all">{formatAmount(employee.allowances.housing)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate mr-2">Transport:</span>
                  <span className="font-medium break-all">{formatAmount(employee.allowances.transport)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate mr-2">Medical:</span>
                  <span className="font-medium break-all">{formatAmount(employee.allowances.medical)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate mr-2">Meal:</span>
                  <span className="font-medium break-all">{formatAmount(employee.allowances.meal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate mr-2">Other:</span>
                  <span className="font-medium break-all">{formatAmount(employee.allowances.other)}</span>
                </div>
                <div className="flex justify-between items-center font-medium border-t pt-1 mt-2">
                  <span className="truncate mr-2">Total:</span>
                  <span className="text-green-600 font-semibold break-all">{formatAmount(totalAllowances)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-xs sm:text-sm text-muted-foreground">Deductions</h4>
              <div className="text-xs sm:text-sm space-y-1">
                <div className="flex justify-between items-center">
                  <span className="truncate mr-2">Tax:</span>
                  <span className="font-medium break-all">{formatAmount(employee.deductions.tax)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate mr-2">Social Security:</span>
                  <span className="font-medium break-all">{formatAmount(employee.deductions.socialSecurity)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate mr-2">Pension:</span>
                  <span className="font-medium break-all">{formatAmount(employee.deductions.pension)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate mr-2">Insurance:</span>
                  <span className="font-medium break-all">{formatAmount(employee.deductions.insurance)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate mr-2">Other:</span>
                  <span className="font-medium break-all">{formatAmount(employee.deductions.other)}</span>
                </div>
                <div className="flex justify-between items-center font-medium border-t pt-1 mt-2">
                  <span className="truncate mr-2">Total:</span>
                  <span className="text-red-600 font-semibold break-all">{formatAmount(totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Earnings */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <h4 className="font-medium text-xs sm:text-sm text-muted-foreground">Overtime</h4>
              <p className="text-sm font-medium text-orange-600 break-all">
                {formatAmount(employee.overtime)} {employee.currency}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-xs sm:text-sm text-muted-foreground">Bonus</h4>
              <p className="text-sm font-medium text-purple-600 break-all">
                {formatAmount(employee.bonus)} {employee.currency}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
            {/* Process Button - Only show for pending employees */}
            {canProcess && employee.payrollStatus === 'pending' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onProcess?.(employee)}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 min-h-[40px] sm:min-h-[36px] text-sm"
              >
                <Calculator className="h-4 w-4" />
                <span className="truncate">{isProcessing ? 'Processing...' : 'Process'}</span>
              </Button>
            )}
            
            {canSendPayslip && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendPayslip?.(employee)}
                className="flex items-center justify-center gap-2 min-h-[40px] sm:min-h-[36px] text-sm"
              >
                <Send className="h-4 w-4" />
                <span className="truncate">Send Payslip</span>
              </Button>
            )}
            
            {onDownloadPayslip && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadPayslip?.(employee)}
                className="flex items-center justify-center gap-2 min-h-[40px] sm:min-h-[36px] text-sm"
              >
                <Download className="h-4 w-4" />
                <span className="truncate">Download</span>
              </Button>
            )}
            
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(employee)}
                className="flex items-center justify-center gap-2 min-h-[40px] sm:min-h-[36px] text-sm"
              >
                <Edit className="h-4 w-4" />
                <span className="truncate">Edit</span>
              </Button>
            )}
            
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete?.(employee)}
                className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 min-h-[40px] sm:min-h-[36px] text-sm"
              >
                <Trash2 className="h-4 w-4" />
                <span className="truncate">Delete</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}