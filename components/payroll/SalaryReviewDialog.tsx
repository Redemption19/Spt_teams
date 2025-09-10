'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator,
  Loader2,
  User,
  Wallet,
  Clock,
  Gift,
  FileText
} from 'lucide-react';
import { PayrollEmployee } from '@/lib/payroll-service';
import { useCurrency } from '@/hooks/use-currency';

interface SalaryReviewData {
  [employeeId: string]: {
    overtime?: number;
    bonus?: number;
    otherAllowance?: number;
    notes?: string;
  };
}

interface SalaryReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employees: PayrollEmployee[];
  onConfirm: (reviewData: SalaryReviewData) => void;
  isLoading?: boolean;
}

export default function SalaryReviewDialog({
  isOpen,
  onClose,
  employees,
  onConfirm,
  isLoading = false
}: SalaryReviewDialogProps) {
  const { formatAmount } = useCurrency();
  const [reviewData, setReviewData] = useState<SalaryReviewData>({});
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState(0);

  // Initialize review data when dialog opens
  useEffect(() => {
    if (isOpen && employees.length > 0) {
      const initialData: SalaryReviewData = {};
      employees.forEach(employee => {
        initialData[employee.id] = {
          overtime: employee.overtime,
          bonus: employee.bonus,
          otherAllowance: employee.allowances.other,
          notes: ''
        };
      });
      setReviewData(initialData);
      setCurrentEmployeeIndex(0);
    }
  }, [isOpen, employees]);

  const handleInputChange = (employeeId: string, field: string, value: string | number) => {
    setReviewData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: typeof value === 'string' ? value : Number(value) || 0
      }
    }));
  };

  const handleNext = () => {
    if (currentEmployeeIndex < employees.length - 1) {
      setCurrentEmployeeIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentEmployeeIndex > 0) {
      setCurrentEmployeeIndex(prev => prev - 1);
    }
  };

  const handleConfirm = () => {
    onConfirm(reviewData);
  };

  const currentEmployee = employees[currentEmployeeIndex];
  const currentReview = reviewData[currentEmployee?.id] || {};

  const calculateNetSalary = (employee: PayrollEmployee, review: any) => {
    const baseSalary = employee.baseSalary;
    const allowances = {
      ...employee.allowances,
      other: review.otherAllowance || employee.allowances.other
    };
    const deductions = employee.deductions;
    const overtime = review.overtime || employee.overtime;
    const bonus = review.bonus || employee.bonus;

    const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + val, 0);
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
    
    return baseSalary + totalAllowances + overtime + bonus - totalDeductions;
  };

  const originalNetSalary = currentEmployee ? currentEmployee.netSalary : 0;
  const newNetSalary = currentEmployee ? calculateNetSalary(currentEmployee, currentReview) : 0;
  const salaryDifference = newNetSalary - originalNetSalary;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Salary Review & Processing
          </DialogTitle>
          <DialogDescription>
            Review and update variable salary components for {employees.length} employee(s)
          </DialogDescription>
        </DialogHeader>

        {employees.length > 0 && currentEmployee && (
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Employee {currentEmployeeIndex + 1} of {employees.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentEmployeeIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentEmployeeIndex === employees.length - 1}
                >
                  Next
                </Button>
              </div>
            </div>

            {/* Employee Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {currentEmployee.employeeName}
                </CardTitle>
                <CardDescription>
                  {currentEmployee.department} • {currentEmployee.role}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Base Salary Display */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Base Salary</Label>
                    <p className="text-lg font-semibold">
                      {formatAmount(currentEmployee.baseSalary)} {currentEmployee.currency}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Current Net Salary</Label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatAmount(originalNetSalary)} {currentEmployee.currency}
                    </p>
                  </div>
                </div>

                {/* Variable Components */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Variable Components</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`overtime-${currentEmployee.id}`} className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Overtime
                      </Label>
                      <Input
                        id={`overtime-${currentEmployee.id}`}
                        type="number"
                        placeholder="0.00"
                        value={currentReview.overtime || 0}
                        onChange={(e) => handleInputChange(currentEmployee.id, 'overtime', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`bonus-${currentEmployee.id}`} className="flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Bonus
                      </Label>
                      <Input
                        id={`bonus-${currentEmployee.id}`}
                        type="number"
                        placeholder="0.00"
                        value={currentReview.bonus || 0}
                        onChange={(e) => handleInputChange(currentEmployee.id, 'bonus', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`other-allowance-${currentEmployee.id}`} className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Other Allowance
                    </Label>
                    <Input
                      id={`other-allowance-${currentEmployee.id}`}
                      type="number"
                      placeholder="0.00"
                      value={currentReview.otherAllowance || 0}
                      onChange={(e) => handleInputChange(currentEmployee.id, 'otherAllowance', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${currentEmployee.id}`} className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Notes (Optional)
                    </Label>
                    <Textarea
                      id={`notes-${currentEmployee.id}`}
                      placeholder="Add any notes about this month's salary..."
                      value={currentReview.notes || ''}
                      onChange={(e) => handleInputChange(currentEmployee.id, 'notes', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Salary Summary */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">New Net Salary:</span>
                      <span className="text-lg font-semibold text-green-600">
                        {formatAmount(newNetSalary)} {currentEmployee.currency}
                      </span>
                    </div>
                    {salaryDifference !== 0 && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-muted-foreground">Difference:</span>
                        <Badge variant={salaryDifference > 0 ? "default" : "destructive"}>
                          {salaryDifference > 0 ? '+' : ''}{formatAmount(salaryDifference)} {currentEmployee.currency}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Process {employees.length} Employee(s)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 