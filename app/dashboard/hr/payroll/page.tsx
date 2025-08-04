'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DollarSign,
  FileText,
  Calculator,
  Download,
  Upload,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Receipt,
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw,
  Globe,
  ChevronDown,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { useAuth } from '@/lib/auth-context';
import { format } from 'date-fns';
import { PayrollService, PayrollEmployee, PayrollSummary, Payslip } from '@/lib/payroll-service';
import { WorkspaceService } from '@/lib/workspace-service';
import PayrollStats from '@/components/payroll/PayrollStats';
import PayrollEmployeeList from '@/components/payroll/PayrollEmployeeList';
import PayslipList from '@/components/payroll/PayslipList';
import MemberPayrollDashboard from '@/components/payroll/MemberPayrollDashboard';

export default function PayrollPage() {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const { user, userProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payrollEmployees, setPayrollEmployees] = useState<PayrollEmployee[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), 'yyyy-MM'));
  
  // Cross-workspace management
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [workspaceFilter, setWorkspaceFilter] = useState<'current' | 'all'>('current');
  const [shouldShowCrossWorkspace, setShouldShowCrossWorkspace] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const previousWorkspaceRef = useRef<string>('');

  // Generate available periods dynamically
  const generateAvailablePeriods = useCallback(() => {
    const periods = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Generate periods for the last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const periodValue = `${year}-${String(month + 1).padStart(2, '0')}`;
      const periodLabel = format(date, 'MMMM yyyy');
      
      periods.push({
        value: periodValue,
        label: periodLabel,
        isCurrent: i === 0,
        isPast: i > 0
      });
    }
    
    return periods;
  }, []);

  const availablePeriods = generateAvailablePeriods();

  // Get current workspace ID
  const workspaceId = userProfile?.workspaceId || '';

  // Check user roles
  const isOwner = userProfile?.role === 'owner';
  const isAdmin = userProfile?.role === 'admin';
  const isMember = userProfile?.role === 'member';

  // Load workspaces for cross-workspace management
  const loadWorkspaces = useCallback(async () => {
    if (!userProfile?.role || userProfile.role !== 'owner') return;

    try {
      const workspaces = await WorkspaceService.getUserWorkspaces(user?.uid || '');
      
      // Filter out any workspaces that might be null or undefined
      const validWorkspaces = workspaces.filter(ws => ws && ws.workspace && ws.workspace.id);
      
      if (validWorkspaces.length > 0) {
        setAllWorkspaces(validWorkspaces);
        setShouldShowCrossWorkspace(true);
        console.log('Successfully loaded workspaces for cross-workspace view:', validWorkspaces.length);
      } else {
        console.log('No valid workspaces found for cross-workspace view');
        setAllWorkspaces([]);
        setShouldShowCrossWorkspace(false);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
      // Fallback to single workspace view
      setAllWorkspaces([]);
      setShouldShowCrossWorkspace(false);
    }
  }, [user?.uid, userProfile?.role]);

  // Load payroll data
  const loadData = useCallback(async () => {
    if (!workspaceId) {
      console.log('WorkspaceId not available yet, skipping data load');
      return;
    }

    try {
      setLoading(true);
      
      let employees: PayrollEmployee[] = [];
      let summary: PayrollSummary;
      let allPayslips: Payslip[] = [];

      // Check if we should load cross-workspace data
      const shouldLoadCrossWorkspace = shouldShowCrossWorkspace && workspaceFilter === 'all' && allWorkspaces.length > 0;
      
      if (shouldLoadCrossWorkspace) {
        // Load from all workspaces
        console.log('allWorkspaces structure:', allWorkspaces);
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
        }).filter(id => id); // Filter out null values
        
        if (workspaceIds.length === 0) {
          console.log('No valid workspace IDs available for cross-workspace load, falling back to single workspace');
          // Fallback to single workspace
          const [workspaceEmployees, workspaceSummary, workspacePayslips] = await Promise.all([
            PayrollService.getPayrollEmployees(workspaceId),
            PayrollService.getPayrollStats(workspaceId, selectedPeriod),
            PayrollService.getPayslips(workspaceId, selectedPeriod)
          ]);

          employees = workspaceEmployees;
          summary = workspaceSummary;
          allPayslips = workspacePayslips;
        } else {
          console.log('Loading cross-workspace data from:', workspaceIds);
          console.log('Workspace IDs type:', typeof workspaceIds, 'Length:', workspaceIds.length);
          
          const [allEmployees, allSummary, allPayslipsData] = await Promise.all([
            PayrollService.getMultiWorkspacePayrollEmployees(workspaceIds),
            PayrollService.getMultiWorkspacePayrollStats(workspaceIds, selectedPeriod),
            PayrollService.getMultiWorkspacePayslips(workspaceIds, selectedPeriod)
          ]);

          employees = allEmployees;
          summary = allSummary;
          allPayslips = allPayslipsData;
        }
      } else {
        // Load from current workspace
        console.log('Loading single workspace data from:', workspaceId);
        const [workspaceEmployees, workspaceSummary, workspacePayslips] = await Promise.all([
          PayrollService.getPayrollEmployees(workspaceId),
          PayrollService.getPayrollStats(workspaceId, selectedPeriod),
          PayrollService.getPayslips(workspaceId, selectedPeriod)
        ]);

        employees = workspaceEmployees;
        summary = workspaceSummary;
        allPayslips = workspacePayslips;
      }

      setPayrollEmployees(employees);
      setPayrollSummary(summary);
      setPayslips(allPayslips);
    } catch (error) {
      console.error('Error loading payroll data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payroll data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, workspaceFilter, shouldShowCrossWorkspace, allWorkspaces, selectedPeriod, toast]);

  // Initialize data loading
  useEffect(() => {
    const initializeData = async () => {
      await loadWorkspaces();
      
      // Load selected workspace from localStorage
      const savedWorkspace = localStorage.getItem('payroll-selected-workspace');
      if (savedWorkspace && shouldShowCrossWorkspace) {
        setSelectedWorkspace(savedWorkspace);
        setWorkspaceFilter(savedWorkspace === 'all' ? 'all' : 'current');
      } else {
        setSelectedWorkspace(workspaceId);
        setWorkspaceFilter('current');
      }
      
      setInitialLoadComplete(true);
    };

    initializeData();
  }, [loadWorkspaces, shouldShowCrossWorkspace, workspaceId]);

  // Load data when dependencies change
  useEffect(() => {
    if (!initialLoadComplete || !workspaceId) return;

    const currentWorkspace = workspaceFilter === 'all' ? 'all' : workspaceId;
    if (previousWorkspaceRef.current !== currentWorkspace) {
      previousWorkspaceRef.current = currentWorkspace;
      loadData();
    } else {
      loadData();
    }
  }, [loadData, initialLoadComplete, workspaceFilter, workspaceId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleProcessPayroll = async () => {
    try {
      if (!workspaceId || !user?.uid) return;

      await PayrollService.processPayroll(workspaceId, selectedPeriod, user.uid);
      
      toast({
        title: 'Success',
        description: 'Payroll processing completed successfully.',
        variant: 'default'
      });
      
      loadData();
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payroll. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleGeneratePayslips = async () => {
    try {
      if (!workspaceId || !user?.uid) return;

      await PayrollService.generatePayslips(workspaceId, selectedPeriod, user.uid);
      
      toast({
        title: 'Success',
        description: 'Payslips generated successfully.',
        variant: 'default'
      });
      
      loadData();
    } catch (error) {
      console.error('Error generating payslips:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate payslips. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleWorkspaceChange = (value: string) => {
    setSelectedWorkspace(value);
    setWorkspaceFilter(value === 'all' ? 'all' : 'current');
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    // Reload data for the selected period
    loadData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'processed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200"><Calculator className="w-3 h-3 mr-1" />Processed</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200"><FileText className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200"><Receipt className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'acknowledged':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Acknowledged</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredEmployees = payrollEmployees.filter(employee => {
    const matchesSearch = employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || employee.payrollStatus === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = Array.from(new Set(payrollEmployees.map(emp => emp.department)));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="card-enhanced">
              <CardHeader>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show member dashboard for members
  if (isMember) {
    return <MemberPayrollDashboard workspaceId={workspaceId} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground">
            Manage salary structures, process payroll, and generate payslips
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {availablePeriods.find(p => p.value === selectedPeriod)?.label || 'Select Period'}
            </Badge>
            {selectedPeriod === format(new Date(), 'yyyy-MM') && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                Current Period
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Cross-Workspace Management */}
          {shouldShowCrossWorkspace && allWorkspaces.length > 0 && (
            <div className="flex items-center gap-2">
              <Select value={selectedWorkspace} onValueChange={handleWorkspaceChange}>
                <SelectTrigger className="w-[220px] border-border/50 focus:border-primary bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={workspaceId}>
                    <div className="flex items-center gap-2">
                      <Building className="w-3 h-3" />
                      <span>Current Workspace</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3" />
                      <span>All Workspaces</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[220px] border-border/50 focus:border-primary bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Select period" />
                <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>
            </SelectTrigger>
            <SelectContent className="min-w-[220px]">
              <div className="p-2 border-b border-border/50">
                <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Quick Select</div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handlePeriodChange(format(new Date(), 'yyyy-MM'))}
                  >
                    Current
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      const lastMonth = new Date();
                      lastMonth.setMonth(lastMonth.getMonth() - 1);
                      handlePeriodChange(format(lastMonth, 'yyyy-MM'));
                    }}
                  >
                    Last Month
                  </Button>
                </div>
              </div>
              <div className="p-1">
                <div className="text-xs font-medium text-muted-foreground mb-2 px-2">All Periods</div>
                {availablePeriods.map(period => (
                  <SelectItem
                    key={period.value}
                    value={period.value}
                    className={`flex items-center gap-2 ${
                      period.isCurrent 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : period.isPast 
                          ? 'text-muted-foreground/60' 
                          : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {period.isCurrent && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                      <span className={period.isCurrent ? 'font-semibold' : ''}>
                        {period.label}
                      </span>
                      {period.isCurrent && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          
          <Button onClick={handleProcessPayroll}>
            <Calculator className="w-4 h-4 mr-2" />
            Process Payroll
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <PayrollStats stats={payrollSummary} loading={loading} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employee Salaries</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="taxes">Tax Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Payroll Processing Status</CardTitle>
                <CardDescription>Current month payroll progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending Processing</span>
                    <Badge variant="secondary">{payrollEmployees.filter(emp => emp.payrollStatus === 'pending').length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Processed</span>
                    <Badge variant="default">{payrollEmployees.filter(emp => emp.payrollStatus === 'processed').length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Paid</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">{payrollEmployees.filter(emp => emp.payrollStatus === 'paid').length}</Badge>
                  </div>
                  <div className="pt-4">
                    <Button onClick={handleProcessPayroll} className="w-full">
                      <Calculator className="w-4 h-4 mr-2" />
                      Process Remaining Payroll
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common payroll operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={handleGeneratePayslips}>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Payslips
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Attendance Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Receipt className="w-4 h-4 mr-2" />
                    Tax Filing Reports
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Export Payroll Summary
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <PayrollEmployeeList
            workspaceId={workspaceId}
            workspaceFilter={workspaceFilter}
            allWorkspaces={allWorkspaces}
            shouldShowCrossWorkspace={shouldShowCrossWorkspace}
          />
        </TabsContent>

        <TabsContent value="payslips" className="space-y-4">
          <PayslipList
            workspaceId={workspaceId}
            workspaceFilter={workspaceFilter}
            allWorkspaces={allWorkspaces}
            shouldShowCrossWorkspace={shouldShowCrossWorkspace}
          />
        </TabsContent>

        <TabsContent value="taxes" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Tax Reports</CardTitle>
              <CardDescription>Tax filing and compliance reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Total Tax Collected</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {formatAmount(payrollSummary?.totalTax || 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">For {selectedPeriod}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tax Reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="w-4 h-4 mr-2" />
                          Download Tax Summary
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Receipt className="w-4 h-4 mr-2" />
                          Generate Tax Filing
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Payroll Analytics</CardTitle>
              <CardDescription>Detailed payroll analysis and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Salary Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Average Salary</span>
                          <span className="font-medium">{formatAmount(payrollSummary?.averageSalary || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Total Gross Pay</span>
                          <span className="font-medium">{formatAmount(payrollSummary?.totalGrossPay || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Total Net Pay</span>
                          <span className="font-medium">{formatAmount(payrollSummary?.totalNetPay || 0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Allowances & Deductions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Allowances</span>
                          <span className="font-medium text-green-600">{formatAmount(payrollSummary?.totalAllowances || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Total Deductions</span>
                          <span className="font-medium text-red-600">{formatAmount(payrollSummary?.totalDeductions || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Overtime & Bonus</span>
                          <span className="font-medium text-blue-600">{formatAmount((payrollSummary?.totalOvertime || 0) + (payrollSummary?.totalBonus || 0))}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Processing Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Pending</span>
                          <Badge variant="outline">{payrollSummary?.pendingPayments || 0}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Processed</span>
                          <Badge variant="outline">{payrollSummary?.processedPayments || 0}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Paid</span>
                          <Badge variant="outline">{payrollSummary?.paidPayments || 0}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}