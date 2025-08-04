'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User,
  DollarSign,
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
    <Card className={`card-enhanced ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showSelection && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleSelectionChange}
                className="flex-shrink-0"
              />
            )}
            <User className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{employee.employeeName}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>{employee.employeeId}</span>
                {showWorkspaceName && employee.workspaceName && (
                  <>
                    <span>•</span>
                    <Building className="w-3 h-3" />
                    <span>{employee.workspaceName}</span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(employee.payrollStatus)}
            <Badge variant={employee.payrollStatus === 'pending' ? 'secondary' : 'default'}>
              {employee.payrollStatus}
            </Badge>
            <Badge variant={employee.isFixedSalary ? 'outline' : 'destructive'}>
              {employee.isFixedSalary ? 'Fixed Salary' : 'Variable Salary'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Employee Details */}
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Department & Role</h4>
              <p className="text-sm">{employee.department} • {employee.role}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Base Salary</h4>
              <p className="text-lg font-semibold text-foreground">
                {formatAmount(employee.baseSalary)} {employee.currency}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Net Salary</h4>
              <p className="text-lg font-semibold text-green-600">
                {formatAmount(employee.netSalary)} {employee.currency}
              </p>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Allowances</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Housing:</span>
                  <span>{formatAmount(employee.allowances.housing)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport:</span>
                  <span>{formatAmount(employee.allowances.transport)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medical:</span>
                  <span>{formatAmount(employee.allowances.medical)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Meal:</span>
                  <span>{formatAmount(employee.allowances.meal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other:</span>
                  <span>{formatAmount(employee.allowances.other)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total:</span>
                  <span className="text-green-600">{formatAmount(totalAllowances)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Deductions</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatAmount(employee.deductions.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Social Security:</span>
                  <span>{formatAmount(employee.deductions.socialSecurity)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pension:</span>
                  <span>{formatAmount(employee.deductions.pension)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Insurance:</span>
                  <span>{formatAmount(employee.deductions.insurance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other:</span>
                  <span>{formatAmount(employee.deductions.other)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total:</span>
                  <span className="text-red-600">{formatAmount(totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Earnings */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Overtime</h4>
              <p className="text-sm font-medium text-orange-600">
                {formatAmount(employee.overtime)} {employee.currency}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Bonus</h4>
              <p className="text-sm font-medium text-purple-600">
                {formatAmount(employee.bonus)} {employee.currency}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t flex items-center justify-end gap-2">
          {/* Process Button - Only show for pending employees */}
          {canProcess && employee.payrollStatus === 'pending' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onProcess?.(employee)}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Calculator className="h-4 w-4" />
              {isProcessing ? 'Processing...' : 'Process'}
            </Button>
          )}
          
          {canSendPayslip && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendPayslip?.(employee)}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send Payslip
            </Button>
          )}
          
          {onDownloadPayslip && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadPayslip?.(employee)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
          
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(employee)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
          
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete?.(employee)}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 