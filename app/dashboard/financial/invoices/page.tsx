'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  FileText, 
  Send, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Calendar,
  AlertCircle,
  Filter,
  Search,
  Star,
  Palette,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Check,
  Building2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { useIsOwner } from '@/lib/rbac-hooks';
import { InvoiceService } from '@/lib/invoice-service';
import { InvoiceTemplateService, InvoiceTemplate } from '@/lib/invoice-template-service';
import { PermissionsService } from '@/lib/permissions-service';
import type { Invoice } from '@/lib/types/financial-types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { DeleteDialog, useDeleteDialog } from '@/components/ui/delete-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { formatDate, formatNumber } from '@/lib/utils';
import InvoiceForm from '@/components/financial/InvoiceForm';
import ClientManagement from '@/components/financial/ClientManagement';
import InvoiceTypeManagement from '@/components/financial/InvoiceTypeManagement';
import HierarchicalInvoiceView from '@/components/financial/HierarchicalInvoiceView';

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

export default function InvoicesPage() {
  const { userProfile } = useAuth();
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  const { toast } = useToast();
  const { defaultCurrency, getCurrencySymbol } = useCurrency();
  const isOwner = useIsOwner();
  const router = useRouter();

  // State management
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cross-workspace management state for owners - persisted
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('invoices-showAllWorkspaces') === 'true';
    }
    return false;
  });

  // Permissions
  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canView, setCanView] = useState(false);
  const deleteDialog = useDeleteDialog();
  
  // Template state
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  
  // Bulk actions state
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [bulkPaymentDialog, setBulkPaymentDialog] = useState({
    isOpen: false,
    loading: false
  });
  const [bulkPaymentData, setBulkPaymentData] = useState({
    paymentDate: new Date(),
    paymentMethod: ''
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

  // Check permissions
  useEffect(() => {
    async function checkPermissions() {
      if (userProfile && currentWorkspace) {
        if (userProfile.role === 'owner') {
          setCanCreate(true);
          setCanEdit(true);
          setCanDelete(true);
          setCanView(true);
        } else {
          setCanCreate(await PermissionsService.hasPermission(userProfile.id, currentWorkspace.id, 'invoices.create'));
          setCanEdit(await PermissionsService.hasPermission(userProfile.id, currentWorkspace.id, 'invoices.edit'));
          setCanDelete(await PermissionsService.hasPermission(userProfile.id, currentWorkspace.id, 'invoices.delete'));
          setCanView(await PermissionsService.hasPermission(userProfile.id, currentWorkspace.id, 'invoices.view'));
        }
      }
    }
    checkPermissions();
  }, [userProfile, currentWorkspace]);

  // Handle workspace view toggle with persistence
  const handleWorkspaceViewToggle = useCallback((showAll: boolean) => {
    setShowAllWorkspaces(showAll);
    if (typeof window !== 'undefined') {
      localStorage.setItem('invoices-showAllWorkspaces', showAll.toString());
    }
  }, []);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    if (!currentWorkspace?.id || !userProfile?.id) {
      setError('No workspace selected or user not authenticated');
      setLoading(false);
      return;
    }

    if (!canView) {
      setError('You do not have permission to view invoices');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let allInvoices: Invoice[] = [];
      
      if (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) {
        // Fetch invoices from all accessible workspaces
        const invoicePromises = accessibleWorkspaces.map(ws => 
          InvoiceService.getWorkspaceInvoices(ws.id)
        );
        const results = await Promise.all(invoicePromises);
        allInvoices = results.flat();
      } else {
        allInvoices = await InvoiceService.getWorkspaceInvoices(currentWorkspace.id);
      }
      
      // Process invoices to add computed fields
      const processedInvoices = allInvoices.map(invoice => ({
        ...invoice,
        // Add computed status for overdue invoices
        computedStatus: isInvoiceOverdue(invoice) ? 'overdue' : invoice.status,
        overdueDays: isInvoiceOverdue(invoice) ? getOverdueDays(invoice.dueDate) : undefined
      }));
      
      setInvoices(processedInvoices);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load invoices. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, userProfile?.id, canView, isOwner, showAllWorkspaces, accessibleWorkspaces, toast]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    if (!currentWorkspace?.id || !userProfile?.id) {
      setTemplatesError('No workspace selected or user not authenticated');
      setTemplatesLoading(false);
      return;
    }

    try {
      setTemplatesLoading(true);
      setTemplatesError(null);
      
      let allTemplates: InvoiceTemplate[] = [];
      
      if (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) {
        // Fetch templates from all accessible workspaces
        const templatePromises = accessibleWorkspaces.map(ws => 
          InvoiceTemplateService.getWorkspaceTemplates(ws.id)
        );
        const results = await Promise.all(templatePromises);
        allTemplates = results.flat();
      } else {
        allTemplates = await InvoiceTemplateService.getWorkspaceTemplates(currentWorkspace.id);
      }
      
      setTemplates(allTemplates);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setTemplatesError('Failed to load templates. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load templates. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setTemplatesLoading(false);
    }
  }, [currentWorkspace?.id, userProfile?.id, isOwner, showAllWorkspaces, accessibleWorkspaces, toast]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    fetchInvoices();
    fetchTemplates();
  }, [fetchInvoices, fetchTemplates]);

  // Filter invoices based on search and filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = searchTerm === '' || 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.notes && invoice.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const effectiveStatus = isInvoiceOverdue(invoice) ? 'overdue' : invoice.status;
      const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
      
      let matchesDate = true;
      if (dateFilter === 'current-month') {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const invoiceDate = new Date(invoice.issueDate);
        matchesDate = invoiceDate.getMonth() === currentMonth && 
                     invoiceDate.getFullYear() === currentYear;
      } else if (dateFilter === 'last-month') {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const invoiceDate = new Date(invoice.issueDate);
        matchesDate = invoiceDate.getMonth() === lastMonth.getMonth() && 
                     invoiceDate.getFullYear() === lastMonth.getFullYear();
      } else if (dateFilter === 'last-quarter') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const invoiceDate = new Date(invoice.issueDate);
        matchesDate = invoiceDate >= threeMonthsAgo;
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [invoices, searchTerm, statusFilter, dateFilter]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const paidAmount = filteredInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0);
    const pendingAmount = filteredInvoices
      .filter(invoice => invoice.status === 'sent' && !isInvoiceOverdue(invoice))
      .reduce((sum, invoice) => sum + invoice.total, 0);
    const overdueAmount = filteredInvoices
      .filter(invoice => isInvoiceOverdue(invoice))
      .reduce((sum, invoice) => sum + invoice.total, 0);

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      totalCount: filteredInvoices.length,
      paidCount: filteredInvoices.filter(i => i.status === 'paid').length,
      pendingCount: filteredInvoices.filter(i => i.status === 'sent' && !isInvoiceOverdue(i)).length,
      overdueCount: filteredInvoices.filter(i => isInvoiceOverdue(i)).length
    };
  }, [filteredInvoices]);

  // Handle invoice actions
  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await InvoiceService.sendInvoice(invoiceId);
      toast({
        title: 'Success',
        description: 'Invoice sent successfully'
      });
      fetchInvoices(); // Refresh data
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to send invoice',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!canDelete) {
      toast({
        title: 'Error',
        description: 'You do not have permission to delete invoices',
        variant: 'destructive'
      });
      return;
    }

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
        fetchInvoices(); // Refresh data
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      await InvoiceService.generateInvoicePDF(invoiceId);
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

  const handleExportInvoices = async () => {
    try {
      // Create CSV content from filtered invoices
      const csvHeaders = [
        'Invoice Number',
        'Type',
        'Status',
        'Issue Date',
        'Due Date',
        'Paid Date',
        'Total Amount',
        'Currency',
        'Items Count',
        'Notes'
      ];
      
      const csvRows = filteredInvoices.map(invoice => [
        invoice.invoiceNumber,
        invoice.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        isInvoiceOverdue(invoice) ? 'overdue' : invoice.status,
        formatDate(invoice.issueDate),
        formatDate(invoice.dueDate),
        invoice.paidDate ? formatDate(invoice.paidDate) : '',
        invoice.total.toString(),
        invoice.currency,
        invoice.items.length.toString(),
        invoice.notes || ''
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Success',
        description: `Exported ${filteredInvoices.length} invoices to CSV`,
      });
    } catch (err) {
      console.error('Error exporting invoices:', err);
      toast({
        title: 'Error',
        description: 'Failed to export invoices',
        variant: 'destructive'
      });
    }
  };
  
  // Bulk selection handlers
  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    setSelectedInvoices(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(invoiceId);
      } else {
        newSet.delete(invoiceId);
      }
      return newSet;
    });
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const payableInvoices = filteredInvoices
        .filter(invoice => invoice.status === 'sent' || isInvoiceOverdue(invoice))
        .map(invoice => invoice.id);
      setSelectedInvoices(new Set(payableInvoices));
    } else {
      setSelectedInvoices(new Set());
    }
  };
  
  const openBulkPaymentDialog = () => {
    setBulkPaymentData({
      paymentDate: new Date(),
      paymentMethod: ''
    });
    setBulkPaymentDialog({ isOpen: true, loading: false });
  };
  
  const handleBulkMarkAsPaid = async () => {
    if (!bulkPaymentData.paymentMethod) {
      toast({
        title: 'Error',
        description: 'Please select a payment method',
        variant: 'destructive'
      });
      return;
    }
    
    if (selectedInvoices.size === 0) {
      toast({
        title: 'Error',
        description: 'No invoices selected',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setBulkPaymentDialog(prev => ({ ...prev, loading: true }));
      
      // Update all selected invoices
      const updatePromises = Array.from(selectedInvoices).map(invoiceId =>
        InvoiceService.updateInvoiceStatus(
          invoiceId,
          'paid',
          bulkPaymentData.paymentDate,
          bulkPaymentData.paymentMethod
        )
      );
      
      await Promise.all(updatePromises);
      
      toast({
        title: 'Success',
        description: `${selectedInvoices.size} invoice(s) marked as paid successfully`
      });
      
      // Close dialog, clear selection, and refresh data
      setBulkPaymentDialog({ isOpen: false, loading: false });
      setSelectedInvoices(new Set());
      fetchInvoices();
    } catch (err) {
      console.error('Error marking invoices as paid:', err);
      toast({
        title: 'Error',
        description: 'Failed to mark some invoices as paid',
        variant: 'destructive'
      });
      setBulkPaymentDialog(prev => ({ ...prev, loading: false }));
    }
  };
  
  // Get payable invoices (sent or overdue)
  const payableInvoices = useMemo(() => {
    return filteredInvoices.filter(invoice => 
      invoice.status === 'sent' || isInvoiceOverdue(invoice)
    );
  }, [filteredInvoices]);
  
  const selectedPayableInvoices = useMemo(() => {
    return payableInvoices.filter(invoice => selectedInvoices.has(invoice.id));
  }, [payableInvoices, selectedInvoices]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Show loading state when user or workspace data is not yet available
  if (loading || !userProfile || !currentWorkspace) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice Management</h1>
            <p className="text-muted-foreground">
              Create, send, and track your business invoices
            </p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <LoadingSkeleton />
      </div>
    );
  }

  // Show access denied only after we've confirmed user and workspace are loaded
  if (!canView) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice Management</h1>
            <p className="text-muted-foreground">
              Create, send, and track your business invoices
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground mb-4">
                You don't have permission to view invoices.
              </p>
              <p className="text-sm text-muted-foreground">
                Contact your workspace administrator for access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice Management</h1>
            <p className="text-muted-foreground">
              Create, send, and track your business invoices
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Invoices</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchInvoices}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Invoice Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Create, send, and track your business invoices
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Cross-workspace toggle for owners */}
          {isOwner && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
            <Select value={showAllWorkspaces ? 'all' : 'current'} onValueChange={(value) => handleWorkspaceViewToggle(value === 'all')}>
              <SelectTrigger className="w-full sm:w-48 min-h-[40px] text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Workspace</SelectItem>
                <SelectItem value="all">All Workspaces</SelectItem>
              </SelectContent>
            </Select>
          )}
          {canCreate && (
            <Button onClick={() => router.push('/dashboard/financial/invoices/create')} className="min-h-[40px] text-xs sm:text-sm">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Invoice</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Amount</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold break-all">
              {getCurrencySymbol()}{formatNumber(summaryStats.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.totalCount} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Paid</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-green-600 break-all">
              {getCurrencySymbol()}{formatNumber(summaryStats.paidAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.paidCount} paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Pending</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-blue-600 break-all">
              {getCurrencySymbol()}{formatNumber(summaryStats.pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.pendingCount} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Overdue</CardTitle>
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-red-600 break-all">
              {getCurrencySymbol()}{formatNumber(summaryStats.overdueAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.overdueCount} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-6 min-w-[600px] sm:min-w-0">
            <TabsTrigger value="list" className="text-xs sm:text-sm">Invoice List</TabsTrigger>
            <TabsTrigger value="create" className="text-xs sm:text-sm">Create Invoice</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs sm:text-sm">Templates</TabsTrigger>
            <TabsTrigger value="clients" className="text-xs sm:text-sm">Clients</TabsTrigger>
            <TabsTrigger value="invoice-types" className="text-xs sm:text-sm">Invoice Types</TabsTrigger>
            <TabsTrigger value="hierarchy" className="text-xs sm:text-sm">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Hierarchy</span>
              <span className="sm:hidden">Hier</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="space-y-4 sm:space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-10 min-h-[40px] text-sm"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="min-h-[40px] text-sm">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="min-h-[40px] text-sm">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="current-month">Current Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="last-quarter">Last Quarter</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={handleExportInvoices} className="min-h-[40px] text-xs sm:text-sm sm:col-span-2 lg:col-span-1">
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoice List */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Invoices</CardTitle>
                  <CardDescription className="text-sm">
                    {filteredInvoices.length} invoices found
                  </CardDescription>
                </div>
                {payableInvoices.length > 0 && canEdit && (
                  <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedInvoices.size > 0 && selectedInvoices.size === payableInvoices.length}
                        onCheckedChange={handleSelectAll}
                        className="min-h-[20px] min-w-[20px]"
                      />
                      <Label htmlFor="select-all" className="text-xs sm:text-sm">
                        Select all payable ({payableInvoices.length})
                      </Label>
                    </div>
                    {selectedInvoices.size > 0 && (
                      <Button
                        onClick={openBulkPaymentDialog}
                        className="bg-primary hover:bg-primary/90 min-h-[40px] text-xs sm:text-sm"
                        size="sm"
                      >
                        <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Mark {selectedInvoices.size} as Paid</span>
                        <span className="sm:hidden">Pay ({selectedInvoices.size})</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 sm:space-y-4">
                {filteredInvoices.map((invoice) => {
                  const effectiveStatus = isInvoiceOverdue(invoice) ? 'overdue' : invoice.status;
                  const overdueDays = isInvoiceOverdue(invoice) ? getOverdueDays(invoice.dueDate) : 0;
                  const isPayable = invoice.status === 'sent' || isInvoiceOverdue(invoice);
                  
                  return (
                    <div key={invoice.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        {isPayable && canEdit && (
                          <div className="flex items-center mr-2 sm:mr-3 mt-1">
                            <Checkbox
                              id={`select-${invoice.id}`}
                              checked={selectedInvoices.has(invoice.id)}
                              onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                              className="min-h-[20px] min-w-[20px]"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                           <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between">
                             <div className="space-y-1 flex-1">
                               <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:items-center sm:gap-2">
                                 <h3 className="font-medium text-sm sm:text-base">{invoice.invoiceNumber}</h3>
                                 <Badge className={`${getStatusColor(effectiveStatus)} text-xs`}>
                                   {getStatusIcon(effectiveStatus)}
                                   <span className="ml-1 capitalize">{effectiveStatus}</span>
                                 </Badge>
                               </div>
                               <p className="text-xs sm:text-sm text-muted-foreground">
                                 {invoice.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                               </p>
                               {invoice.notes && (
                                 <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{invoice.notes}</p>
                               )}
                             </div>
                             <div className="text-left sm:text-right space-y-1 sm:ml-4">
                               <div className="text-base sm:text-lg font-bold">
                                 {getCurrencySymbol()}{formatNumber(invoice.total)}
                               </div>
                               <div className="text-xs sm:text-sm text-muted-foreground">{invoice.currency}</div>
                             </div>
                           </div>
                         </div>
                       </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="text-muted-foreground">Issue Date:</span>
                          <div className="font-medium">{formatDate(invoice.issueDate)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Due Date:</span>
                          <div className="font-medium">{formatDate(invoice.dueDate)}</div>
                        </div>
                        {invoice.paidDate && (
                          <div>
                            <span className="text-muted-foreground">Paid Date:</span>
                            <div className="font-medium text-green-600">{formatDate(invoice.paidDate)}</div>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Items:</span>
                          <div className="font-medium">{invoice.items.length} line items</div>
                        </div>
                      </div>

                      {effectiveStatus === 'overdue' && overdueDays > 0 && (
                        <div className="bg-transparent border border-primary rounded p-2 sm:p-3">
                          <p className="text-xs sm:text-sm text-primary flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <strong>Overdue by {overdueDays} days</strong>
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between pt-2 border-t">
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Created {formatDate(invoice.createdAt)}
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/dashboard/financial/invoices/${invoice.id}`)}
                            className="min-h-[36px] min-w-[36px] p-2"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          {canEdit && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push(`/dashboard/financial/invoices/edit/${invoice.id}`)}
                              className="min-h-[36px] min-w-[36px] p-2"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            className="min-h-[36px] min-w-[36px] p-2"
                          >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          {invoice.status === 'draft' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-700 min-h-[36px] min-w-[36px] p-2"
                              onClick={() => handleSendInvoice(invoice.id)}
                            >
                              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 min-h-[36px] min-w-[36px] p-2"
                              onClick={() => handleDeleteInvoice(invoice)}
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredInvoices.length === 0 && (
                  <div className="text-center py-6 sm:py-8">
                    <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 px-4">
                      {invoices.length === 0 
                        ? 'No invoices found. Create your first invoice to get started.' 
                        : 'No invoices found matching your filters.'}
                    </p>
                    {canCreate && invoices.length === 0 && (
                      <Button 
                        onClick={() => router.push('/dashboard/financial/invoices/create')}
                        className="min-h-[40px] text-sm"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Create First Invoice
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          {canCreate ? (
            <InvoiceForm
              onSuccess={() => {
                setActiveTab('list');
                fetchInvoices();
              }}
              onCancel={() => setActiveTab('list')}
              isEdit={false}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Create New Invoice</CardTitle>
                <CardDescription>
                  Generate professional invoices for your clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    You don&apos;t have permission to create invoices.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Contact your workspace administrator for access.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-lg p-6 border border-primary/20 dark:border-primary/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-primary dark:text-primary-foreground">Invoice Templates</h3>
                <p className="text-primary/80 dark:text-primary-foreground/80">
                  Create professional, customizable invoice templates for your business
                </p>
              </div>
              <Button 
                onClick={() => router.push('/dashboard/financial/invoices/templates/create')}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Templates</p>
                    <p className="text-2xl font-bold text-primary">{templates.filter(t => t.isActive).length}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-accent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
                    <p className="text-2xl font-bold text-accent">{templates.length}</p>
                  </div>
                  <div className="p-2 bg-accent/10 rounded-full">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-primary/70">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Default Template</p>
                    <p className="text-lg font-semibold text-primary/70 truncate">
                      {templates.find(t => t.isDefault)?.name || 'None set'}
                    </p>
                  </div>
                  <div className="p-2 bg-primary/5 rounded-full">
                    <Star className="w-5 h-5 text-primary/70" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Template */}
            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-dashed border-2 hover:border-primary/50" 
                  onClick={() => router.push('/dashboard/financial/invoices/templates/create')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Create New Template</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Design a custom invoice template from scratch
                </p>
                <Button variant="outline" size="sm" className="w-full border-primary/30 hover:bg-primary/5">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Browse Templates */}
            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-accent/50" 
                  onClick={() => router.push('/dashboard/financial/invoices/templates')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <h4 className="font-semibold mb-2">Browse Templates</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  View and manage all your existing templates
                </p>
                <Button variant="outline" size="sm" className="w-full border-accent/30 hover:bg-accent/5">
                  View All
                </Button>
              </CardContent>
            </Card>

            {/* Template Library */}
            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-primary/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                  <Palette className="w-6 h-6 text-primary/70" />
                </div>
                <h4 className="font-semibold mb-2">Template Library</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose from pre-designed professional templates
                </p>
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Templates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Templates</CardTitle>
                  <CardDescription>
                    Your most recently used invoice templates
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/financial/invoices/templates')}>
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : templatesError ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">{templatesError}</p>
                  <Button onClick={fetchTemplates} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No templates found. Create your first template to get started.
                  </p>
                  <Button onClick={() => router.push('/dashboard/financial/invoices/templates/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Template
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.slice(0, 3).map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {template.description || 'No description'} • 
                            {template.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {template.isDefault && (
                          <Badge className="bg-primary/10 text-primary border-primary/20">Default</Badge>
                        )}
                        {!template.isActive && (
                          <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">Inactive</Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/dashboard/financial/invoices/templates/${template.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {templates.length > 3 && (
                    <div className="text-center pt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.push('/dashboard/financial/invoices/templates')}
                      >
                        View {templates.length - 3} more templates
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <ClientManagement />
        </TabsContent>

        <TabsContent value="invoice-types">
          <InvoiceTypeManagement />
        </TabsContent>

        <TabsContent value="hierarchy">
          {currentWorkspace && (
            <HierarchicalInvoiceView 
              workspaceId={currentWorkspace.id}
              className="mt-6"
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Bulk Payment Dialog */}
      <Dialog open={bulkPaymentDialog.isOpen} onOpenChange={(open) => setBulkPaymentDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Invoices as Paid</DialogTitle>
            <DialogDescription>
              Record payment for {selectedInvoices.size} selected invoice(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-payment-date">Payment Date</Label>
              <DatePicker
                id="bulk-payment-date"
                value={bulkPaymentData.paymentDate}
                onChange={(date: Date | undefined) => setBulkPaymentData(prev => ({ ...prev, paymentDate: date || new Date() }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-payment-method">Payment Method</Label>
              <Select
                value={bulkPaymentData.paymentMethod}
                onValueChange={(value) => setBulkPaymentData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger id="bulk-payment-method">
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
            {selectedPayableInvoices.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Invoices</Label>
                <div className="max-h-32 overflow-y-auto space-y-1 text-sm">
                  {selectedPayableInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>{invoice.invoiceNumber}</span>
                      <span className="font-medium">
                        {getCurrencySymbol()}{formatNumber(invoice.total)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t font-medium">
                  <span>Total Amount:</span>
                  <span>
                    {getCurrencySymbol()}{formatNumber(
                      selectedPayableInvoices.reduce((sum, invoice) => sum + invoice.total, 0)
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkPaymentDialog({ isOpen: false, loading: false })}
              disabled={bulkPaymentDialog.loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkMarkAsPaid}
              disabled={bulkPaymentDialog.loading || !bulkPaymentData.paymentMethod}
              className="bg-primary hover:bg-primary/90"
            >
              {bulkPaymentDialog.loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Paid
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
           { label: 'Status', value: deleteDialog.item?.status || '' }
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
    </div>
  );
}
