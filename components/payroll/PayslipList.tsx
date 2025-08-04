'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  RefreshCw,
  Building,
  FileText,
  Download,
  Send,
  Eye,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PayrollService, Payslip } from '@/lib/payroll-service';
import { useCurrency } from '@/hooks/use-currency';
import { WorkspaceService } from '@/lib/workspace-service';
import { downloadPayslipPDF } from '@/lib/utils/payslip-pdf-generator';

interface PayslipListProps {
  workspaceId?: string;
  workspaceFilter?: 'current' | 'all';
  allWorkspaces?: any[];
  shouldShowCrossWorkspace?: boolean;
}

export default function PayslipList({ 
  workspaceId, 
  workspaceFilter = 'current',
  allWorkspaces = [],
  shouldShowCrossWorkspace = false
}: PayslipListProps) {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [generatingSamples, setGeneratingSamples] = useState(false);
  const [generatingFromEmployees, setGeneratingFromEmployees] = useState(false);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      
      let allPayslips: Payslip[] = [];

      if (shouldShowCrossWorkspace && workspaceFilter === 'all') {
        // Load from all workspaces
        const workspaceIds = allWorkspaces.map(ws => {
          // Handle the structure: { workspace: { id: string, ... }, role: string }
          if (ws.workspace && ws.workspace.id) {
            return ws.workspace.id;
          }
          // Fallback for direct ID structure
          if (ws.id) {
            return ws.id;
          }
          return null;
        }).filter(id => id);
        
        if (workspaceIds.length === 0) {
          console.log('No valid workspace IDs in PayslipList');
          setPayslips([]);
          return;
        }
        
        allPayslips = await PayrollService.getMultiWorkspacePayslips(workspaceIds);
      } else {
        // Load from current workspace
        allPayslips = await PayrollService.getPayslips(workspaceId);
      }

      setPayslips(allPayslips);
    } catch (error) {
      console.error('Error loading payslips:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payslips. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, workspaceFilter, shouldShowCrossWorkspace, allWorkspaces, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSendPayslip = async (payslip: Payslip) => {
    try {
      await PayrollService.sendPayslip(payslip.id);
      toast({
        title: 'Success',
        description: 'Payslip sent successfully.',
        variant: 'default'
      });
      loadData();
    } catch (error) {
      console.error('Error sending payslip:', error);
      toast({
        title: 'Error',
        description: 'Failed to send payslip. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadPayslip = async (payslip: Payslip) => {
    try {
      // Get actual workspace details
      let companyInfo = {
        name: 'Company Name',
        address: 'Business Address',
        city: 'City',
        state: 'State',
        zipCode: '12345',
        phone: '+1 (555) 123-4567',
        email: 'info@company.com',
        website: 'www.company.com'
      };
      
      try {
        const workspace = await WorkspaceService.getWorkspace(payslip.workspaceId);
        if (workspace) {
          companyInfo = {
            name: workspace.name || 'Company Name',
            address: workspace.description || 'Business Address',
            city: 'City',
            state: 'State',
            zipCode: '12345',
            phone: '+1 (555) 123-4567',
            email: 'info@company.com',
            website: 'www.company.com'
          };
        }
      } catch (error) {
        console.error('Error fetching workspace details:', error);
        // Use fallback data if workspace fetch fails
      }
      
      downloadPayslipPDF(payslip, companyInfo);
      toast({
        title: 'Success',
        description: 'Payslip downloaded successfully.',
      });
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast({
        title: 'Error',
        description: 'Failed to download payslip. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleViewPayslip = (payslip: Payslip) => {
    router.push(`/dashboard/hr/payroll/payslip/${payslip.id}`);
  };

  // Filter payslips
  const filteredPayslips = payslips.filter(payslip => {
    const matchesSearch = payslip.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payslip.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmployee = employeeFilter === 'all' || payslip.employeeId === employeeFilter;
    const matchesStatus = statusFilter === 'all' || payslip.status === statusFilter;
    const matchesPeriod = periodFilter === 'all' || payslip.period === periodFilter;
    
    return matchesSearch && matchesEmployee && matchesStatus && matchesPeriod;
  });

  // Get unique employees and periods
  const employees = [...new Set(payslips.map(p => ({ id: p.employeeId, name: p.employeeName })))];
  const periods = [...new Set(payslips.map(p => p.period))].sort().reverse();

  const getStatusBadge = (status: Payslip['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Draft</Badge>;
      case 'sent':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Sent</Badge>;
      case 'acknowledged':
        return <Badge variant="outline" className="text-green-600 border-green-600">Acknowledged</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 border-red-600">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 w-[180px] bg-muted rounded animate-pulse" />
              <div className="h-10 w-[140px] bg-muted rounded animate-pulse" />
              <div className="h-10 w-[140px] bg-muted rounded animate-pulse" />
              <div className="h-10 w-[100px] bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="card-enhanced">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search payslips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-border/50 focus:border-primary"
                />
              </div>
            </div>
            
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-[180px] border-border/50 focus:border-primary">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] border-border/50 focus:border-primary">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[140px] border-border/50 focus:border-primary">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                {periods.map((period) => (
                  <SelectItem key={period} value={period}>
                    {period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-border/50 hover:bg-accent hover:text-accent-foreground"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredPayslips.length} payslip{filteredPayslips.length !== 1 ? 's' : ''} found
        </p>
        {shouldShowCrossWorkspace && (
          <Badge variant="outline" className="text-xs">
            <Building className="w-3 h-3 mr-1" />
            Cross-Workspace View
          </Badge>
        )}
      </div>

      {/* Payslips List */}
      <div className="space-y-4">
        {filteredPayslips.length > 0 ? (
          filteredPayslips.map((payslip) => (
            <Card key={payslip.id} className="card-enhanced">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{payslip.employeeName}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>{payslip.employeeId}</span>
                        {shouldShowCrossWorkspace && payslip.workspaceName && (
                          <>
                            <span>•</span>
                            <Building className="w-3 h-3" />
                            <span>{payslip.workspaceName}</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(payslip.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Period</h4>
                    <p className="text-sm flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {payslip.period}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Gross Pay</h4>
                    <p className="text-lg font-semibold text-foreground">
                      {formatAmount(payslip.grossPay)} {payslip.currency}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Net Pay</h4>
                    <p className="text-lg font-semibold text-green-600">
                      {formatAmount(payslip.netPay)} {payslip.currency}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewPayslip(payslip)}
                    className="flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPayslip(payslip)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  
                  {payslip.status === 'draft' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendPayslip(payslip)}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="card-enhanced">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payslips Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || employeeFilter !== 'all' || statusFilter !== 'all' || periodFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'No payslips have been generated yet.'
                }
              </p>
              {(searchTerm || employeeFilter !== 'all' || statusFilter !== 'all' || periodFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setEmployeeFilter('all');
                    setStatusFilter('all');
                    setPeriodFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 