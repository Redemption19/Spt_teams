'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Employee, EmployeeService } from '@/lib/employee-service';
import { EmployeeFormPage } from '@/components/hr/EmployeeFormPage';
import { EmployeeDetailSkeleton } from '@/components/hr/EmployeeLoadingSkeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditEmployeePage() {
  const params = useParams();
  const { toast } = useToast();
  const employeeId = params?.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      setError(null);
      try {
        const emp = await EmployeeService.getEmployee(employeeId);
        if (!emp) {
          setError('Employee not found');
          return;
        }
        setEmployee(emp);
      } catch (err) {
        console.error('Error loading employee:', err);
        setError('Failed to load employee for editing.');
        toast({
          title: 'Error',
          description: 'Failed to load employee details. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId, toast]);

  if (loading) {
    return <EmployeeDetailSkeleton />;
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/hr/employees">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Employees
            </Link>
          </Button>
        </div>
        
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Employee Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error || 'The employee you\'re trying to edit doesn\'t exist.'}
          </p>
          <Button asChild>
            <Link href="/dashboard/hr/employees">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Employees
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <EmployeeFormPage employee={employee} mode="edit" />;
} 