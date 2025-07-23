'use client';

import { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';

// Mock invoice data for demonstration
const mockInvoices = [
  {
    id: 'INV-2024-001',
    clientName: 'Acme Corporation',
    clientEmail: 'billing@acme.com',
    amount: 15750.00,
    currency: 'USD',
    status: 'paid' as const,
    issueDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-14'),
    paidDate: new Date('2024-02-10'),
    description: 'Q1 2024 Consulting Services',
    items: [
      { description: 'Strategy Consulting', quantity: 40, rate: 250.00, total: 10000.00 },
      { description: 'Implementation Support', quantity: 30, rate: 150.00, total: 4500.00 },
      { description: 'Training Sessions', quantity: 25, rate: 50.00, total: 1250.00 }
    ],
    taxRate: 0,
    taxAmount: 0,
    subtotal: 15750.00,
    total: 15750.00,
    notes: 'Thank you for your business'
  },
  {
    id: 'INV-2024-002',
    clientName: 'Tech Solutions Ltd',
    clientEmail: 'accounts@techsolutions.com',
    amount: 8950.00,
    currency: 'USD',
    status: 'sent' as const,
    issueDate: new Date('2024-01-20'),
    dueDate: new Date('2024-02-19'),
    description: 'Web Development Project - Phase 1',
    items: [
      { description: 'Frontend Development', quantity: 50, rate: 120.00, total: 6000.00 },
      { description: 'Backend API Development', quantity: 30, rate: 150.00, total: 4500.00 },
      { description: 'Database Setup', quantity: 8, rate: 180.00, total: 1440.00 }
    ],
    taxRate: 0.1,
    taxAmount: 1194.00,
    subtotal: 11940.00,
    total: 8950.00,
    notes: 'Payment due within 30 days'
  },
  {
    id: 'INV-2024-003',
    clientName: 'Global Enterprises',
    clientEmail: 'finance@globalent.com',
    amount: 22500.00,
    currency: 'USD',
    status: 'overdue' as const,
    issueDate: new Date('2024-01-05'),
    dueDate: new Date('2024-01-20'),
    description: 'Monthly Retainer - January 2024',
    items: [
      { description: 'Monthly Retainer Fee', quantity: 1, rate: 22500.00, total: 22500.00 }
    ],
    taxRate: 0,
    taxAmount: 0,
    subtotal: 22500.00,
    total: 22500.00,
    notes: 'Retainer for ongoing support services',
    overdueBy: 15
  },
  {
    id: 'INV-2024-004',
    clientName: 'Startup Inc',
    clientEmail: 'billing@startup.com',
    amount: 5280.00,
    currency: 'USD',
    status: 'draft' as const,
    issueDate: new Date('2024-01-25'),
    dueDate: new Date('2024-02-24'),
    description: 'Logo Design & Brand Identity',
    items: [
      { description: 'Logo Design', quantity: 1, rate: 3500.00, total: 3500.00 },
      { description: 'Brand Guidelines', quantity: 1, rate: 1200.00, total: 1200.00 },
      { description: 'Business Card Design', quantity: 1, rate: 580.00, total: 580.00 }
    ],
    taxRate: 0,
    taxAmount: 0,
    subtotal: 5280.00,
    total: 5280.00,
    notes: 'Draft - ready for review'
  }
];

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
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter === 'current-month') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      matchesDate = invoice.issueDate.getMonth() === currentMonth && 
                   invoice.issueDate.getFullYear() === currentYear;
    } else if (dateFilter === 'last-month') {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      matchesDate = invoice.issueDate.getMonth() === lastMonth.getMonth() && 
                   invoice.issueDate.getFullYear() === lastMonth.getFullYear();
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = filteredInvoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = filteredInvoices
    .filter(invoice => invoice.status === 'sent')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueAmount = filteredInvoices
    .filter(invoice => invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoice Management</h1>
          <p className="text-muted-foreground">
            Create, send, and track your business invoices
          </p>
        </div>
        <Button className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.length} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${paidAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.filter(i => i.status === 'paid').length} paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.filter(i => i.status === 'sent').length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${overdueAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.filter(i => i.status === 'overdue').length} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Invoice List</TabsTrigger>
          <TabsTrigger value="create">Create Invoice</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="current-month">Current Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="last-quarter">Last Quarter</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoice List */}
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                {filteredInvoices.length} invoices found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{invoice.id}</h3>
                          <Badge className={getStatusColor(invoice.status)}>
                            {getStatusIcon(invoice.status)}
                            <span className="ml-1 capitalize">{invoice.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
                        <p className="text-sm text-muted-foreground">{invoice.description}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold">${invoice.amount.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{invoice.currency}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Issue Date:</span>
                        <div className="font-medium">{invoice.issueDate.toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Due Date:</span>
                        <div className="font-medium">{invoice.dueDate.toLocaleDateString()}</div>
                      </div>
                      {invoice.paidDate && (
                        <div>
                          <span className="text-muted-foreground">Paid Date:</span>
                          <div className="font-medium text-green-600">{invoice.paidDate.toLocaleDateString()}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Client Email:</span>
                        <div className="font-medium">{invoice.clientEmail}</div>
                      </div>
                    </div>

                    {invoice.status === 'overdue' && invoice.overdueBy && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-700 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          <strong>Overdue by {invoice.overdueBy} days</strong>
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        {invoice.items.length} line items
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        {invoice.status === 'draft' && (
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredInvoices.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No invoices found matching your filters.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
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
                  Invoice creation form coming soon...
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Start Creating Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Templates</CardTitle>
              <CardDescription>
                Manage and customize your invoice templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Template management coming soon...
                </p>
                <p className="text-sm text-muted-foreground">
                  Create custom templates with your branding and default settings
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
