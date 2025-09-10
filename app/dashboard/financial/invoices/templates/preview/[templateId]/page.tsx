'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Printer, Eye } from 'lucide-react';
import { InvoiceTemplateService, InvoiceTemplate } from '@/lib/invoice-template-service';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import Image from 'next/image';

// Mock invoice data for preview
const mockInvoiceData = {
  invoiceNumber: 'INV-2024-001',
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  client: {
    name: 'Acme Corporation',
    email: 'billing@acme.com',
    address: '123 Business Street\nSuite 100\nNew York, NY 10001',
    phone: '+1 (555) 123-4567'
  },
  company: {
    name: 'Your Company Name',
    email: 'hello@yourcompany.com',
    address: '456 Company Ave\nFloor 2\nSan Francisco, CA 94102',
    phone: '+1 (555) 987-6543',
    website: 'www.yourcompany.com'
  },
  items: [
    {
      description: 'Web Development Services',
      quantity: 40,
      unitPrice: 125.00,
      total: 5000.00
    },
    {
      description: 'UI/UX Design',
      quantity: 20,
      unitPrice: 100.00,
      total: 2000.00
    },
    {
      description: 'Project Management',
      quantity: 10,
      unitPrice: 150.00,
      total: 1500.00
    }
  ],
  subtotal: 8500.00,
  taxRate: 8.5,
  taxAmount: 722.50,
  total: 9222.50,
  currency: 'USD'
};

export default function InvoiceTemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const templateId = params.templateId as string;
  const [template, setTemplate] = useState<InvoiceTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        
        // Handle temporary preview from create page
        if (templateId === 'temp') {
          const previewData = sessionStorage.getItem('template-preview-data');
          if (previewData) {
            const parsedData = JSON.parse(previewData);
            setTemplate(parsedData);
          } else {
            setError('Preview data not found');
          }
          return;
        }
        
        // Load existing template
        const fetchedTemplate = await InvoiceTemplateService.getTemplate(templateId);
        
        if (!fetchedTemplate) {
          setError('Template not found');
          return;
        }
        
        setTemplate(fetchedTemplate);
      } catch (err) {
        console.error('Error loading template:', err);
        setError('Failed to load template');
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast({
      title: 'Download',
      description: 'PDF download functionality would be implemented here'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4 no-print">
            <Skeleton className="h-10 w-20" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4 no-print">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/financial/invoices/templates')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Template Preview</h1>
              <p className="text-muted-foreground">Preview your invoice template</p>
            </div>
          </div>
          
          <Card>
            <CardContent className="text-center py-8">
              <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Template Not Found</h3>
              <p className="text-muted-foreground mb-6">
                {error || 'The template you are looking for does not exist.'}
              </p>
              <Button onClick={() => router.push('/dashboard/financial/invoices/templates')}>Back to Templates</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header - Hidden when printing */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/financial/invoices/templates')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Template Preview</h1>
              <p className="text-muted-foreground">
                Preview of {template.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Invoice Preview */}
        <Card className="bg-white shadow-lg invoice-printable">
          <CardContent className="p-8">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                {template.logoUrl && (
                  <Image 
                    src={template.logoUrl} 
                    alt="Company Logo" 
                    width={64}
                    height={64}
                    className="h-16 w-auto mb-4"
                  />
                )}
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold" style={{ color: template.primaryColor }}>
                    {mockInvoiceData.company.name}
                  </h2>
                  <p className="text-sm text-gray-600">{mockInvoiceData.company.email}</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {mockInvoiceData.company.address}
                  </p>
                  <p className="text-sm text-gray-600">{mockInvoiceData.company.phone}</p>
                  {mockInvoiceData.company.website && (
                    <p className="text-sm text-gray-600">{mockInvoiceData.company.website}</p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <h1 className="text-4xl font-bold mb-2" style={{ color: template.primaryColor }}>
                  INVOICE
                </h1>
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Invoice #:</span> {mockInvoiceData.invoiceNumber}</p>
                  <p><span className="font-semibold">Issue Date:</span> {mockInvoiceData.issueDate.toLocaleDateString()}</p>
                  <p><span className="font-semibold">Due Date:</span> {mockInvoiceData.dueDate.toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3" style={{ color: template.secondaryColor }}>
                Bill To:
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">{mockInvoiceData.client.name}</p>
                <p className="text-sm text-gray-600">{mockInvoiceData.client.email}</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {mockInvoiceData.client.address}
                </p>
                <p className="text-sm text-gray-600">{mockInvoiceData.client.phone}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: template.primaryColor + '10' }}>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                      Description
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                      Qty
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold">
                      Unit Price
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockInvoiceData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-3">
                        {item.description}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                        ${item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-8">
              <div className="w-64">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${mockInvoiceData.subtotal.toFixed(2)}</span>
                  </div>
                  {template.includeTax && (
                    <div className="flex justify-between">
                      <span>Tax ({mockInvoiceData.taxRate}%):</span>
                      <span>${mockInvoiceData.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg" style={{ color: template.primaryColor }}>
                      <span>Total:</span>
                      <span>${mockInvoiceData.total.toFixed(2)} {mockInvoiceData.currency}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Notes */}
            {(template.defaultTerms || template.defaultNotes) && (
              <div className="border-t pt-6 space-y-4">
                {template.defaultTerms && (
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: template.secondaryColor }}>
                      Terms & Conditions:
                    </h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {template.defaultTerms}
                    </p>
                  </div>
                )}
                
                {template.defaultNotes && (
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: template.secondaryColor }}>
                      Notes:
                    </h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {template.defaultNotes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t text-sm text-gray-500">
              <p>Thank you for your business!</p>
              <p>Payment is due within {template.defaultDueDays} days of invoice date.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything except the invoice content */
          body * {
            visibility: hidden;
          }
          
          /* Show only the invoice card and its contents */
          .invoice-printable,
          .invoice-printable * {
            visibility: visible;
          }
          
          /* Position the invoice content properly */
          .invoice-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          /* Remove margins and padding from body */
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          /* Remove card styling for print */
          .invoice-printable .bg-white {
            box-shadow: none !important;
            border: none !important;
          }
          
          /* Ensure backgrounds are white */
          .bg-gray-50 {
            background: white !important;
          }
          
          /* Hide any buttons or interactive elements */
          button {
            display: none !important;
          }
          
          /* Ensure proper page breaks */
          .invoice-printable {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}