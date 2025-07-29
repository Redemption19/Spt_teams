'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { InvoiceService } from '@/lib/invoice-service';
import { PermissionsService } from '@/lib/permissions-service';
import { ClientService, type Client } from '@/lib/client-service';
import { DeleteDialog, useDeleteDialog } from '@/components/ui/delete-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Invoice } from '@/lib/types/financial-types';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Send, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  Calendar,
  DollarSign,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Hash,
  Printer,
  CreditCard,
  MessageSquare,
  Smartphone,
  Link,
  ChevronDown,
  Globe
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';
import { InvoiceDetailSkeleton } from '@/components/financial/InvoiceDetailSkeleton';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'paid':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'sent':
      return <Send className="w-4 h-4 text-blue-500" />;
    case 'overdue':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'draft':
      return <FileText className="w-4 h-4 text-gray-500" />;
    case 'cancelled':
      return <XCircle className="w-4 h-4 text-gray-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'sent':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Helper function to determine if invoice is overdue
const isInvoiceOverdue = (invoice: Invoice): boolean => {
  return invoice.status === 'sent' && new Date(invoice.dueDate) < new Date();
};

// Helper function to calculate overdue days
const getOverdueDays = (dueDate: Date): number => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function ViewInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { userProfile, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const { toast } = useToast();
  const { getCurrencySymbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const deleteDialog = useDeleteDialog();
  
  // Payment dialog state
  const [paymentDialog, setPaymentDialog] = useState({
    isOpen: false,
    loading: false
  });
  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date(),
    paymentMethod: ''
  });
  
  // Send invoice dialog state
  const [sendDialog, setSendDialog] = useState({
    isOpen: false,
    loading: false,
    method: '' as 'email' | 'whatsapp' | 'sms' | 'link' | ''
  });
  const [sendData, setSendData] = useState({
    recipientEmail: '',
    recipientPhone: '',
    message: ''
  });
  
  // Payment methods options
  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'other', label: 'Other' }
  ];

  const invoiceId = params?.id as string;

  // Fetch invoice data and check permissions
  useEffect(() => {
    async function fetchInvoiceAndPermissions() {
      // Wait for both auth and workspace contexts to finish loading
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
            // Don't fail the whole page if client fetch fails
          }
        }

        // Check permissions
        if (userProfile.role === 'owner') {
          setCanEdit(true);
          setCanDelete(true);
        } else {
          const editPermission = await PermissionsService.hasPermission(
            userProfile.id, 
            currentWorkspace.id, 
            'invoices.edit'
          );
          const deletePermission = await PermissionsService.hasPermission(
            userProfile.id, 
            currentWorkspace.id, 
            'invoices.delete'
          );
          setCanEdit(editPermission);
          setCanDelete(deletePermission);
        }
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

    fetchInvoiceAndPermissions();
  }, [invoiceId, userProfile, currentWorkspace, authLoading, workspaceLoading, toast]);

  const openSendDialog = (method: 'email' | 'whatsapp' | 'sms' | 'link') => {
    setSendData({
      recipientEmail: client?.email || '',
      recipientPhone: client?.phone || '',
      message: `Hi ${client?.name || 'there'}, please find your invoice ${invoice?.invoiceNumber} attached. Thank you for your business!`
    });
    setSendDialog({ isOpen: true, loading: false, method });
  };

  const handleSendInvoice = async () => {
    if (!invoice || !sendDialog.method) return;
    
    try {
      setSendDialog(prev => ({ ...prev, loading: true }));
      
      switch (sendDialog.method) {
        case 'email':
          await handleSendViaEmail();
          break;
        case 'whatsapp':
          await handleSendViaWhatsApp();
          break;
        case 'sms':
          await handleSendViaSMS();
          break;
        case 'link':
          await handleGenerateLink();
          break;
      }
      
      // Update invoice status to sent
      await InvoiceService.sendInvoice(invoice.id, sendData.recipientEmail);
      
      toast({
        title: 'Success',
        description: `Invoice sent via ${sendDialog.method} successfully`
      });
      
      // Close dialog and refresh data
      setSendDialog({ isOpen: false, loading: false, method: '' });
      const updatedInvoice = await InvoiceService.getInvoice(invoice.id);
      if (updatedInvoice) setInvoice(updatedInvoice);
    } catch (err) {
      console.error('Error sending invoice:', err);
      toast({
        title: 'Error',
        description: `Failed to send invoice via ${sendDialog.method}`,
        variant: 'destructive'
      });
      setSendDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSendViaEmail = async () => {
    if (!sendData.recipientEmail) {
      throw new Error('Email address is required');
    }
    // TODO: Integrate with email service
    console.log('Sending via email to:', sendData.recipientEmail);
  };

  const handleSendViaWhatsApp = async () => {
    if (!sendData.recipientPhone) {
      throw new Error('Phone number is required');
    }
    // Generate WhatsApp link
    const whatsappUrl = `https://wa.me/${sendData.recipientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(sendData.message + ' ' + window.location.origin + '/invoice/' + invoice?.id)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendViaSMS = async () => {
    if (!sendData.recipientPhone) {
      throw new Error('Phone number is required');
    }
    // Generate SMS link
    const smsUrl = `sms:${sendData.recipientPhone}?body=${encodeURIComponent(sendData.message + ' ' + window.location.origin + '/invoice/' + invoice?.id)}`;
    window.open(smsUrl, '_self');
  };

  const handleGenerateLink = async () => {
    // Generate shareable link
    const invoiceLink = `${window.location.origin}/invoice/${invoice?.id}`;
    await navigator.clipboard.writeText(invoiceLink);
    toast({
      title: 'Link Copied',
      description: 'Invoice link has been copied to clipboard'
    });
  };

  const openPaymentDialog = () => {
    setPaymentData({
      paymentDate: new Date(),
      paymentMethod: ''
    });
    setPaymentDialog({ isOpen: true, loading: false });
  };
  
  const handleMarkAsPaid = async () => {
    if (!paymentData.paymentMethod) {
      toast({
        title: 'Error',
        description: 'Please select a payment method',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setPaymentDialog(prev => ({ ...prev, loading: true }));
      
      await InvoiceService.updateInvoiceStatus(
        invoiceId,
        'paid',
        paymentData.paymentDate,
        paymentData.paymentMethod
      );
      
      toast({
        title: 'Success',
        description: 'Invoice marked as paid successfully'
      });
      
      // Close dialog and refresh data
      setPaymentDialog({ isOpen: false, loading: false });
      const updatedInvoice = await InvoiceService.getInvoice(invoiceId);
      if (updatedInvoice) setInvoice(updatedInvoice);
    } catch (err) {
      console.error('Error marking invoice as paid:', err);
      toast({
        title: 'Error',
        description: 'Failed to mark invoice as paid',
        variant: 'destructive'
      });
      setPaymentDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoice || !canDelete) return;

    deleteDialog.openDialog({
      id: invoice.id,
      name: invoice.invoiceNumber,
      type: invoice.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      status: invoice.status
    });
  };

  const confirmDeleteInvoice = async () => {
    try {
      await deleteDialog.handleConfirm(async (item) => {
        await InvoiceService.deleteInvoice(item.id);
        toast({
          title: 'Success',
          description: 'Invoice deleted successfully'
        });
        router.push('/dashboard/financial/invoices');
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoice) return;
    
    try {
      await InvoiceService.generateInvoicePDF(invoice.id);
      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive'
      });
    }
  };

  const handlePrintInvoice = () => {
    router.push(`/dashboard/financial/invoices/${invoiceId}/print`);
  };

  if (loading || authLoading || workspaceLoading) {
    return <InvoiceDetailSkeleton />;
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <CardTitle className="text-xl">Invoice Details</CardTitle>
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
                  <Button variant="outline" onClick={() => router.back()}>
                    Go Back
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

  const effectiveStatus = isInvoiceOverdue(invoice) ? 'overdue' : invoice.status;
  const overdueDays = isInvoiceOverdue(invoice) ? getOverdueDays(invoice.dueDate) : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl">{invoice.invoiceNumber}</CardTitle>
                    <Badge className={getStatusColor(effectiveStatus)}>
                      {getStatusIcon(effectiveStatus)}
                      <span className="ml-1 capitalize">{effectiveStatus}</span>
                    </Badge>
                  </div>
                  <CardDescription>
                    {invoice.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleDownloadInvoice}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={handlePrintInvoice}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                {invoice.status === 'draft' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white">
                        <Send className="w-4 h-4 mr-2" />
                        Send Invoice
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => openSendDialog('email')}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send via Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openSendDialog('whatsapp')}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Send via WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openSendDialog('sms')}>
                        <Smartphone className="w-4 h-4 mr-2" />
                        Send via SMS
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openSendDialog('link')}>
                        <Link className="w-4 h-4 mr-2" />
                        Generate Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {(invoice.status === 'sent' || isInvoiceOverdue(invoice)) && canEdit && (
                  <Button 
                    onClick={openPaymentDialog}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
                {canEdit && (
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/dashboard/financial/invoices/edit/${invoice.id}`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button variant="destructive" onClick={handleDeleteInvoice}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Overdue Warning */}
        {effectiveStatus === 'overdue' && overdueDays > 0 && (
          <Card className="border-red-400 bg-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-primary">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">This invoice is overdue by {overdueDays} days</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Invoice Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(invoice.issueDate)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(invoice.dueDate)}</span>
                    </div>
                  </div>
                  {invoice.paidDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Paid Date</label>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-600">{formatDate(invoice.paidDate)}</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Currency</label>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>{invoice.currency}</span>
                    </div>
                  </div>
                </div>
                
                {invoice.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="mt-1 text-sm">{invoice.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 py-3 border-b last:border-b-0">
                      <div className="col-span-6">
                        <div className="font-medium">{item.description}</div>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-muted-foreground">Qty: </span>
                        <span>{item.quantity}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-muted-foreground">@ </span>
                        <span>{getCurrencySymbol()}{formatNumber(item.unitPrice)}</span>
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        {getCurrencySymbol()}{formatNumber(item.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            {invoice.terms && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{invoice.terms}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{getCurrencySymbol()}{formatNumber(invoice.subtotal)}</span>
                </div>
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax ({invoice.taxRate}%):</span>
                    <span>{getCurrencySymbol()}{formatNumber(invoice.taxAmount)}</span>
                  </div>
                )}
                {(invoice.discount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount:</span>
                    <span>-{getCurrencySymbol()}{formatNumber(invoice.discount || 0)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{getCurrencySymbol()}{formatNumber(invoice.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            {invoice.clientId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {client ? (
                    <div className="space-y-3">
                      {/* Name */}
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs text-muted-foreground">Name *</div>
                        </div>
                      </div>
                      
                      {/* Email */}
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{client.email}</div>
                          <div className="text-xs text-muted-foreground">Email *</div>
                        </div>
                      </div>
                      
                      {/* Company */}
                      {client.company && (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{client.company}</div>
                            <div className="text-xs text-muted-foreground">Company</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Phone */}
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{client.phone}</div>
                            <div className="text-xs text-muted-foreground">Phone</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Tax ID */}
                      {client.taxId && (
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{client.taxId}</div>
                            <div className="text-xs text-muted-foreground">Tax ID</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Address */}
                      {client.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium text-sm leading-relaxed">{client.address}</div>
                            <div className="text-xs text-muted-foreground">Address</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Client ID: {invoice.clientId}
                      <div className="text-xs mt-1">Loading client details...</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Project Information */}
            {invoice.projectId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Project Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Project ID: {invoice.projectId}
                  </div>
                  {/* Note: In a real app, you would fetch and display actual project details */}
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <div>{formatDate(invoice.createdAt)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <div>{formatDate(invoice.updatedAt)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Created By:</span>
                  <div>{invoice.createdBy}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog.isOpen} onOpenChange={(open) => setPaymentDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
            <DialogDescription>
              Record payment details for invoice {invoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date *</Label>
              <DatePicker
                value={paymentData.paymentDate}
                onChange={(date) => setPaymentData(prev => ({ ...prev, paymentDate: date || new Date() }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method *</Label>
              <Select 
                value={paymentData.paymentMethod} 
                onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {invoice && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Invoice Total</div>
                <div className="text-lg font-semibold">
                  {getCurrencySymbol()}{formatNumber(invoice.total)}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPaymentDialog({ isOpen: false, loading: false })}
              disabled={paymentDialog.loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMarkAsPaid}
              disabled={paymentDialog.loading || !paymentData.paymentMethod}
              className="bg-primary hover:bg-primary/90"
            >
              {paymentDialog.loading ? 'Processing...' : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.closeDialog}
        onConfirm={confirmDeleteInvoice}
        title="Delete Invoice"
        description="You are about to permanently delete this invoice. This action cannot be undone."
        item={deleteDialog.item}
        itemDetails={[
          { label: 'Invoice Number', value: deleteDialog.item?.name || '' },
          { label: 'Type', value: deleteDialog.item?.type || '' },
          { label: 'Status', value: deleteDialog.item?.status || '' },
          { label: 'Total Amount', value: invoice ? `${getCurrencySymbol()}${formatNumber(invoice.total)}` : '' }
        ]}
        consequences={[
          'Permanently remove this invoice from the system',
          'Remove all associated payment records',
          'This invoice will no longer be accessible to anyone',
          'Any reports including this invoice will be affected'
        ]}
        confirmText="Delete Invoice"
        isLoading={deleteDialog.isLoading}
        warningLevel="high"
      />

      {/* Send Invoice Dialog */}
      <Dialog open={sendDialog.isOpen} onOpenChange={(open) => setSendDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {sendDialog.method === 'email' && <Mail className="h-5 w-5" />}
              {sendDialog.method === 'whatsapp' && <MessageSquare className="h-5 w-5" />}
              {sendDialog.method === 'sms' && <Smartphone className="h-5 w-5" />}
              {sendDialog.method === 'link' && <Link className="h-5 w-5" />}
              Send Invoice via {sendDialog.method?.charAt(0).toUpperCase() + sendDialog.method?.slice(1)}
            </DialogTitle>
            <DialogDescription>
              {sendDialog.method === 'email' && 'Send this invoice via email to your client.'}
              {sendDialog.method === 'whatsapp' && 'Send this invoice via WhatsApp to your client.'}
              {sendDialog.method === 'sms' && 'Send this invoice via SMS to your client.'}
              {sendDialog.method === 'link' && 'Generate a shareable link for this invoice.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {(sendDialog.method === 'email') && (
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Recipient Email</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={sendData.recipientEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSendData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
            )}
            
            {(sendDialog.method === 'whatsapp' || sendDialog.method === 'sms') && (
              <div className="space-y-2">
                <Label htmlFor="recipientPhone">Recipient Phone</Label>
                <Input
                  id="recipientPhone"
                  type="tel"
                  value={sendData.recipientPhone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSendData(prev => ({ ...prev, recipientPhone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
            )}
            
            {sendDialog.method !== 'link' && (
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={sendData.message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSendData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your message"
                  rows={3}
                />
              </div>
            )}
            
            {sendDialog.method === 'link' && (
              <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary font-medium mb-2">Invoice Link:</p>
                <p className="text-sm font-mono bg-white/80 backdrop-blur-sm p-3 rounded border border-primary/30 break-all text-primary/80">
                  {window.location.origin}/invoice/{invoice?.id}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendDialog({ isOpen: false, loading: false, method: '' })}
              disabled={sendDialog.loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvoice}
              disabled={sendDialog.loading}
              className="bg-primary hover:bg-primary/90"
            >
              {sendDialog.loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  {sendDialog.method === 'email' && <Mail className="h-4 w-4 mr-2" />}
                  {sendDialog.method === 'whatsapp' && <MessageSquare className="h-4 w-4 mr-2" />}
                  {sendDialog.method === 'sms' && <Smartphone className="h-4 w-4 mr-2" />}
                  {sendDialog.method === 'link' && <Link className="h-4 w-4 mr-2" />}
                  {sendDialog.method === 'link' ? 'Copy Link' : 'Send'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}