'use client';

import { useState } from 'react';
import { DeleteDialog, DeleteItem } from '@/components/ui/delete-dialog';
import { PayrollService, PayrollEmployee } from '@/lib/payroll-service';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';

interface DeletePayrollEmployeeDialogProps {
  employee: PayrollEmployee;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeletePayrollEmployeeDialog({ 
  employee, 
  onClose, 
  onSuccess 
}: DeletePayrollEmployeeDialogProps) {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await PayrollService.deletePayrollEmployee(employee.id);
      
      toast({
        title: 'Success',
        description: 'Payroll employee deleted successfully.',
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting payroll employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete payroll employee. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Convert PayrollEmployee to DeleteItem format
  const deleteItem: DeleteItem = {
    id: employee.id,
    name: employee.employeeName,
    type: 'Payroll Employee',
    status: employee.payrollStatus,
    email: employee.employeeEmail,
    department: employee.department,
    role: employee.role,
    baseSalary: employee.baseSalary,
    currency: employee.currency,
    netSalary: employee.netSalary,
  };

  // Define item details to display
  const itemDetails = [
    {
      label: 'Employee Name',
      value: employee.employeeName
    },
    {
      label: 'Email',
      value: employee.employeeEmail
    },
    {
      label: 'Department',
      value: employee.department || 'Unassigned'
    },
    {
      label: 'Role',
      value: employee.role
    },
    {
      label: 'Base Salary',
      value: formatAmount(employee.baseSalary, employee.currency)
    },
    {
      label: 'Net Salary',
      value: formatAmount(employee.netSalary, employee.currency)
    },
    {
      label: 'Status',
      value: employee.payrollStatus.charAt(0).toUpperCase() + employee.payrollStatus.slice(1)
    }
  ];

  // Define consequences of deletion
  const consequences = [
    'Remove all payroll records for this employee',
    'Delete associated payslips and payment history',
    'Cannot be recovered once deleted',
    'May affect payroll reports and analytics'
  ];

  return (
    <DeleteDialog
      isOpen={true}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Payroll Employee"
      description="You are about to permanently delete this payroll employee record. This action will remove all associated payroll data."
      item={deleteItem}
      itemDetails={itemDetails}
      consequences={consequences}
      confirmText="Delete Employee"
      cancelText="Cancel"
      isLoading={isLoading}
      showItemInfo={true}
      warningLevel="high"
    />
  );
} 