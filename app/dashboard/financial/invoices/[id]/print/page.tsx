'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PrintableInvoice } from '@/components/financial/PrintableInvoice';
import { InvoiceService } from '@/lib/invoice-service';
import { ClientService, type Client } from '@/lib/client-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import type { Invoice } from '@/lib/types/financial-types';
import type { Workspace } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function PrintInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { userProfile, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invoiceId = params?.id as string;

  useEffect(() => {
    async function fetchInvoiceData() {
      // Wait for auth and workspace contexts to load
      if (authLoading || workspaceLoading) {
        return;
      }

      if (!invoiceId || !userProfile || !currentWorkspace) {
        setError('Invalid invoice ID or missing authentication');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch invoice
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

        // Fetch client data if clientId exists
        if (invoiceData.clientId) {
          try {
            const clientData = await ClientService.getClient(invoiceData.clientId);
            setClient(clientData);
          } catch (clientErr) {
            console.error('Error fetching client:', clientErr);
          }
        }

        // Fetch workspace data
        try {
          const workspaceData = await WorkspaceService.getWorkspace(invoiceData.workspaceId);
          setWorkspace(workspaceData);
        } catch (workspaceErr) {
          console.error('Error fetching workspace:', workspaceErr);
          // Use current workspace as fallback
          setWorkspace(currentWorkspace);
        }

      } catch (err) {
        console.error('Error fetching invoice data:', err);
        setError('Failed to load invoice data');
      } finally {
        setLoading(false);
      }
    }

    fetchInvoiceData();
  }, [invoiceId, userProfile, currentWorkspace, authLoading, workspaceLoading]);

  // Auto-trigger print dialog when page loads (after data is loaded)
  useEffect(() => {
    if (!loading && invoice && !error) {
      // Small delay to ensure the page is fully rendered
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loading, invoice, error]);

  if (loading || authLoading || workspaceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading invoice for printing...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Unable to Print Invoice</h2>
            <p className="text-gray-600 mb-6">
              {error || 'The invoice could not be loaded for printing.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push('/dashboard/financial/invoices')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Invoices
              </Button>
              <Button onClick={() => router.push('/dashboard/financial/invoices')}>
                View All Invoices
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="print-page">
      <style jsx global>{`
        @media print {
          /* Hide all page elements except the printable content */
          body * {
            visibility: hidden;
          }
          
          .print-page,
          .print-page *,
          .invoice-content,
          .invoice-content * {
            visibility: visible;
          }
          
          /* Position the print content to fill the page */
          .print-page {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
          }
          
          /* Hide any navigation, sidebars, or other UI elements */
          nav,
          .sidebar,
          .navigation,
          header,
          footer,
          .print-hide,
          [data-testid="sidebar"],
          aside {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Ensure the invoice content takes full width */
          .invoice-content {
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }
        }
      `}</style>
      
      <PrintableInvoice 
        invoice={invoice} 
        client={client} 
        workspace={workspace} 
      />
    </div>
  );
}