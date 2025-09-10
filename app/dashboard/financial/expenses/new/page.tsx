'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ExpenseForm from '@/components/financial/ExpenseForm';
import { useToast } from '@/hooks/use-toast';

export default function NewExpensePage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleExpenseSubmitted = () => {
    toast({
      title: 'Success',
      description: 'Expense submitted successfully!'
    });
    router.push('/dashboard/financial/expenses');
  };

  const handleCancel = () => {
    router.push('/dashboard/financial/expenses');
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/dashboard/financial/expenses')}
          className="shrink-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Expense</h1>
          <p className="text-muted-foreground">
            Create a new expense report for reimbursement or record keeping
          </p>
        </div>
      </div>

      {/* Form Section - No wrapper card, let ExpenseForm handle its own styling */}
      <ExpenseForm 
        onSuccess={handleExpenseSubmitted}
        onCancel={handleCancel}
      />
    </div>
  );
}
