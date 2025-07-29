'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import BudgetCreate from '@/components/financial/BudgetCreate';
import { useToast } from '@/hooks/use-toast';
import { PermissionsService } from '@/lib/permissions-service';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useEffect, useState } from 'react';

export default function BudgetCreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    async function checkPermission() {
      if (user && currentWorkspace && userProfile) {
        if (userProfile.role === 'owner') {
          setCanCreate(true);
        } else if (user.uid && currentWorkspace.id) {
          setCanCreate(await PermissionsService.hasPermission(user.uid, currentWorkspace.id, 'budgets.create'));
        }
      }
    }
    checkPermission();
  }, [user, currentWorkspace, userProfile]);

  if (!canCreate) {
    return <div className="p-8 text-center text-muted-foreground">You do not have permission to create budgets.</div>;
  }

  const handleBudgetCreated = () => {
    toast({
      title: 'Success',
      description: 'Budget created successfully!'
    });
    router.push('/dashboard/financial/budgets');
  };

  const handleCancel = () => {
    router.push('/dashboard/financial/budgets');
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Budget</h1>
          <p className="text-muted-foreground">
            Create a new budget for your workspace, department, project, or team
          </p>
        </div>
      </div>

      {/* Form Section */}
      <BudgetCreate 
        onSuccess={handleBudgetCreated}
        onCancel={handleCancel}
      />
    </div>
  );
}
