'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { PermissionsService } from '@/lib/permissions-service';
import InvoiceForm from '@/components/financial/InvoiceForm';
import { ArrowLeft, FileText } from 'lucide-react';

export default function CreateInvoicePage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);

  // Check permissions
  const [canCreateInvoice, setCanCreateInvoice] = useState(false);

  useEffect(() => {
    async function checkPermissions() {
      if (user && userProfile && currentWorkspace) {
        if (userProfile.role === 'owner') {
          setCanCreateInvoice(true);
        } else {
          const hasPermission = await PermissionsService.hasPermission(
            user.uid, 
            currentWorkspace.id, 
            'invoices.create'
          );
          setCanCreateInvoice(hasPermission);
        }
      }
    }
    checkPermissions();
  }, [user, userProfile, currentWorkspace]);

  const handleSuccess = () => {
    router.push('/dashboard/financial/invoices');
  };

  const handleCancel = () => {
    router.back();
  };

  if (!user || !userProfile || !currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canCreateInvoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="text-xl">Access Denied</CardTitle>
                <CardDescription>
                  You don&apos;t have permission to create invoices
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Insufficient Permissions</h3>
              <p className="text-muted-foreground mb-6">
                You don&apos;t have permission to create invoices. Please contact your workspace administrator.
              </p>
              <Button onClick={() => router.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full">
        <InvoiceForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          isEdit={false}
        />
      </div>
    </div>
  );
}