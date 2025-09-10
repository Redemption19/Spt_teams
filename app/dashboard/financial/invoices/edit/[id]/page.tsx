'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { PermissionsService } from '@/lib/permissions-service';
import { InvoiceService } from '@/lib/invoice-service';
import InvoiceForm from '@/components/financial/InvoiceForm';
import { ArrowLeft, FileText } from 'lucide-react';
import type { Invoice } from '@/lib/types/financial-types';

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invoiceId = params?.id as string;

  // Check permissions
  const [canEditInvoice, setCanEditInvoice] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkPermissions() {
      // Wait for both auth and workspace contexts to finish loading
      if (authLoading || workspaceLoading) {
        return;
      }

      if (user && userProfile && currentWorkspace) {
        if (userProfile.role === 'owner') {
          setCanEditInvoice(true);
        } else {
          const hasPermission = await PermissionsService.hasPermission(
            user.uid, 
            currentWorkspace.id, 
            'invoices.edit'
          );
          setCanEditInvoice(hasPermission);
        }
      }
    }
    checkPermissions();
  }, [user, userProfile, currentWorkspace, authLoading, workspaceLoading]);

  // Fetch invoice data
  useEffect(() => {
    async function fetchInvoice() {
      // Wait for both auth and workspace contexts to finish loading
      if (authLoading || workspaceLoading) {
        return;
      }

      if (!invoiceId || !user || !userProfile || !currentWorkspace) {
        setError('Invalid invoice ID or missing authentication');
        setLoading(false);
        return;
      }

      // Wait for permission check to complete
      if (canEditInvoice === null) {
        return;
      }

      if (!canEditInvoice) {
        setError('You do not have permission to edit invoices');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const invoiceData = await InvoiceService.getInvoice(invoiceId);
        
        if (!invoiceData) {
          setError('Invoice not found');
          return;
        }

        // Check if user has access to this invoice's workspace
        if (invoiceData.workspaceId !== currentWorkspace.id && userProfile.role !== 'owner') {
          setError('You do not have access to this invoice');
          return;
        }

        setInvoice(invoiceData);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load invoice. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [invoiceId, user, userProfile, currentWorkspace, canEditInvoice, toast, authLoading, workspaceLoading]);

  const handleSuccess = () => {
    toast({
      title: 'Success',
      description: 'Invoice updated successfully'
    });
    router.push('/dashboard/financial/invoices');
  };

  const handleCancel = () => {
    router.push('/dashboard/financial/invoices');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/financial/invoices')}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <CardTitle className="text-xl">Edit Invoice</CardTitle>
                  <CardDescription>
                    Loading invoice details...
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading invoice...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/financial/invoices')}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <CardTitle className="text-xl">Edit Invoice</CardTitle>
                  <CardDescription>
                    {error || 'Invoice not found'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {error?.includes('permission') ? 'Access Denied' : 'Invoice Not Found'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {error || 'The invoice you are looking for does not exist or has been deleted.'}
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => router.push('/dashboard/financial/invoices')}>
                    Back to Invoices
                  </Button>
                  <Button onClick={() => router.push('/dashboard/financial/invoices')}>
                    View All Invoices
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Convert invoice data to form data format
  const initialFormData = {
    clientId: invoice.clientId || '',
    projectId: invoice.projectId || '',
    type: invoice.type,
    items: invoice.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })),
    taxRate: invoice.taxRate,
    discount: invoice.discount || 0,
    currency: invoice.currency,
    dueDate: invoice.dueDate instanceof Date ? invoice.dueDate : new Date(invoice.dueDate),
    notes: invoice.notes || '',
    terms: invoice.terms || ''
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full">
        <InvoiceForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          initialData={{ ...invoice, ...initialFormData }}
          isEdit={true}
        />
      </div>
    </div>
  );
}