'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Users, 
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { getInvoicesAcrossHierarchy, getInvoicesByWorkspaceType, type HierarchyInvoiceResult, type WorkspaceInvoiceSummary } from '@/lib/utils/invoice-hierarchy-utils';
import { InvoiceService } from '@/lib/invoice-service';
import { WorkspaceService } from '@/lib/workspace-service';
import type { Invoice } from '@/lib/types/financial-types';
import type { Workspace } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatNumber } from '@/lib/utils';

interface HierarchicalInvoiceViewProps {
  workspaceId: string;
  className?: string;
}

export default function HierarchicalInvoiceView({ workspaceId, className }: HierarchicalInvoiceViewProps) {
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { defaultCurrency, getCurrencySymbol } = useCurrency();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [hierarchyData, setHierarchyData] = useState<HierarchyInvoiceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeSubWorkspaces, setIncludeSubWorkspaces] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | 'all'>('all');
  const [workspaceTypeFilter, setWorkspaceTypeFilter] = useState<'main' | 'sub' | 'both'>('both');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('all');

  // Fetch hierarchical invoice data
  const fetchHierarchyData = useCallback(async () => {
    if (!workspaceId || !userProfile?.id) {
      setError('No workspace selected or user not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await getInvoicesAcrossHierarchy(workspaceId, {
        includeSubWorkspaces,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      
      setHierarchyData(result);
    } catch (err) {
      console.error('Error fetching hierarchy data:', err);
      setError('Failed to load invoice hierarchy data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load invoice hierarchy data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, userProfile?.id, includeSubWorkspaces, statusFilter, toast]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    fetchHierarchyData();
  }, [fetchHierarchyData]);

  // Filter invoices based on workspace type and selected workspace
  const filteredInvoices = useMemo(() => {
    if (!hierarchyData) return [];
    
    let invoices = hierarchyData.invoices;
    
    // Filter by workspace type
    if (workspaceTypeFilter !== 'both') {
      invoices = invoices.filter(invoice => {
        const workspaceSummary = hierarchyData.workspaceSummaries.find(
          ws => ws.workspaceId === invoice.workspaceId
        );
        return workspaceSummary?.workspaceType === workspaceTypeFilter;
      });
    }
    
    // Filter by specific workspace
    if (selectedWorkspace !== 'all') {
      invoices = invoices.filter(invoice => invoice.workspaceId === selectedWorkspace);
    }
    
    return invoices;
  }, [hierarchyData, workspaceTypeFilter, selectedWorkspace]);

  // Calculate filtered summary
  const filteredSummary = useMemo(() => {
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = filteredInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    const pendingAmount = filteredInvoices
      .filter(inv => inv.status === 'sent' || inv.status === 'draft')
      .reduce((sum, inv) => sum + inv.total, 0);
    const overdueAmount = filteredInvoices
      .filter(inv => {
        const dueDate = new Date(inv.dueDate);
        return inv.status !== 'paid' && dueDate < new Date();
      })
      .reduce((sum, inv) => sum + inv.total, 0);
    
    return {
      totalInvoices: filteredInvoices.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      collectionRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
    };
  }, [filteredInvoices]);

  // Get workspace options for filter
  const workspaceOptions = useMemo(() => {
    if (!hierarchyData) return [];
    
    const options = [{ value: 'all', label: 'All Workspaces' }];
    
    if (hierarchyData.mainWorkspace) {
      options.push({
        value: hierarchyData.mainWorkspace.id,
        label: `${hierarchyData.mainWorkspace.name} (Main)`
      });
    }
    
    hierarchyData.subWorkspaces.forEach(workspace => {
      options.push({
        value: workspace.id,
        label: `${workspace.name} (Sub)`
      });
    });
    
    return options;
  }, [hierarchyData]);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={fetchHierarchyData} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hierarchyData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            <p>No invoice data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header with Controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-200">Invoice Hierarchy</h2>
            <p className="text-gray-300">
              {hierarchyData.mainWorkspace?.name} and {hierarchyData.subWorkspaces.length} sub-workspaces
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="include-sub"
                checked={includeSubWorkspaces}
                onCheckedChange={setIncludeSubWorkspaces}
              />
              <Label htmlFor="include-sub">Include Sub-workspaces</Label>
            </div>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={workspaceTypeFilter} onValueChange={(value: any) => setWorkspaceTypeFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Workspace Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">All Types</SelectItem>
              <SelectItem value="main">Main Only</SelectItem>
              <SelectItem value="sub">Sub Only</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaceOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workspaces">By Workspace</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="invoices">Invoice List</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Invoices</p>
                    <p className="text-2xl font-bold">{filteredSummary.totalInvoices}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Across {hierarchyData.workspaceSummaries.length} workspaces
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray 400">Total Amount</p>
                    <p className="text-2xl font-bold">
                      {getCurrencySymbol()}{formatNumber(filteredSummary.totalAmount)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {filteredSummary.collectionRate.toFixed(1)}% collection rate
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Paid Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      {getCurrencySymbol()}{formatNumber(filteredSummary.paidAmount)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {filteredSummary.totalAmount > 0 ? ((filteredSummary.paidAmount / filteredSummary.totalAmount) * 100).toFixed(1) : 0}% of total
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Pending Amount</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {getCurrencySymbol()}{formatNumber(filteredSummary.pendingAmount + filteredSummary.overdueAmount)}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {getCurrencySymbol()}{formatNumber(filteredSummary.overdueAmount)} overdue
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workspaces Tab */}
        <TabsContent value="workspaces" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hierarchyData.workspaceSummaries.map((workspace) => (
              <Card key={workspace.workspaceId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        {workspace.workspaceName}
                      </CardTitle>
                      <CardDescription>
                        {workspace.workspaceType === 'main' ? 'Main Workspace' : 'Sub-workspace'}
                      </CardDescription>
                    </div>
                    <Badge variant={workspace.workspaceType === 'main' ? 'default' : 'secondary'}>
                      {workspace.workspaceType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-100">Invoices</p>
                        <p className="text-lg font-semibold">{workspace.invoiceCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-100">Total Amount</p>
                        <p className="text-lg font-semibold">
                          {getCurrencySymbol()}{formatNumber(workspace.totalAmount)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 rounded stats-card text-green-600">
                        <p className="font-medium">
                          {getCurrencySymbol()}{formatNumber(workspace.paidAmount)}
                        </p>
                        <p className="text-xs">Paid</p>
                      </div>
                      <div className="text-center p-2 rounded stats-card text-orange-600">
                        <p className="font-medium">
                          {getCurrencySymbol()}{formatNumber(workspace.pendingAmount)}
                        </p>
                        <p className="text-xs">Pending</p>
                      </div>
                      <div className="text-center p-2 rounded stats-card text-destructive">
                        <p className="font-medium">
                          {getCurrencySymbol()}{formatNumber(workspace.overdueAmount)}
                        </p>
                        <p className="text-xs">Overdue</p>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Collection Rate</span>
                        <span className="font-medium">{workspace.collectionRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(workspace.collectionRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>Compare workspace performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hierarchyData.workspaceSummaries
                    .sort((a, b) => b.totalAmount - a.totalAmount)
                    .map((workspace, index) => (
                    <div key={workspace.workspaceId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-green-500' : 
                          index === 1 ? 'bg-blue-500' : 
                          index === 2 ? 'bg-orange-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <p className="font-medium">{workspace.workspaceName}</p>
                          <p className="text-sm text-blue-200">
                            {workspace.invoiceCount} invoices
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {getCurrencySymbol()}{formatNumber(workspace.totalAmount)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {workspace.collectionRate.toFixed(1)}% collected
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Collection Efficiency</CardTitle>
                <CardDescription>Payment collection rates by workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hierarchyData.workspaceSummaries
                    .sort((a, b) => b.collectionRate - a.collectionRate)
                    .map((workspace) => (
                    <div key={workspace.workspaceId} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{workspace.workspaceName}</span>
                        <span className="text-sm font-medium">
                          {workspace.collectionRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            workspace.collectionRate >= 80 ? 'bg-green-500' :
                            workspace.collectionRate >= 60 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(workspace.collectionRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invoice List Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtered Invoices ({filteredInvoices.length})</CardTitle>
              <CardDescription>
                Showing invoices based on current filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInvoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No invoices match the current filters</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredInvoices.slice(0, 10).map((invoice) => {
                      const workspace = hierarchyData.workspaceSummaries.find(
                        ws => ws.workspaceId === invoice.workspaceId
                      );
                      
                      return (
                        <div key={invoice.id} className="border rounded-lg p-4 hover-muted-enhanced">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{invoice.invoiceNumber}</p>
                                <Badge variant="outline" className="text-xs">
                                  {workspace?.workspaceName}
                                </Badge>
                                <Badge variant={workspace?.workspaceType === 'main' ? 'default' : 'secondary'} className="text-xs">
                                  {workspace?.workspaceType}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                Due: {formatDate(invoice.dueDate)}
                              </p>
                              {invoice.notes && (
                                <p className="text-sm text-gray-500 truncate max-w-md">
                                  {invoice.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right space-y-1">
                              <p className="font-semibold">
                                {getCurrencySymbol()}{formatNumber(invoice.total)}
                              </p>
                              <Badge 
                                variant={invoice.status === 'paid' ? 'default' : 
                                        invoice.status === 'sent' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {invoice.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {filteredInvoices.length > 10 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">
                          Showing 10 of {filteredInvoices.length} invoices
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          View All Invoices
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}