'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign,
  FileText,
  Download,
  Calendar,
  User,
  Building,
  Calculator,
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Receipt,
  CreditCard,
  PieChart,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { useAuth } from '@/lib/auth-context';
import { PayrollService, PayrollEmployee, Payslip } from '@/lib/payroll-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { format } from 'date-fns';
import { downloadPayslipPDF } from '@/lib/utils/payslip-pdf-generator';

interface MemberPayrollDashboardProps {
  workspaceId: string;
}

export default function MemberPayrollDashboard({ workspaceId }: MemberPayrollDashboardProps) {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const { user, userProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payrollEmployee, setPayrollEmployee] = useState<PayrollEmployee | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), 'yyyy-MM'));

  const loadData = useCallback(async () => {
    if (!user?.uid || !workspaceId) return;

    try {
      setLoading(true);
      
      // Load payroll employee data for current user
      const employees = await PayrollService.getPayrollEmployees(workspaceId);
      const currentEmployee = employees.find(emp => emp.employeeId === user.uid);
      
      if (currentEmployee) {
        setPayrollEmployee(currentEmployee);
        
        // Load payslips for current employee
        const employeePayslips = await PayrollService.getPayslips(workspaceId);
        const userPayslips = employeePayslips.filter(payslip => payslip.employeeId === user.uid);
        setPayslips(userPayslips);
      } else {
        setPayrollEmployee(null);
        setPayslips([]);
      }
    } catch (error) {
      console.error('Error loading member payroll data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payroll information. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid, workspaceId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'processed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1" />Processed</Badge>;
      case 'sent':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><FileText className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><AlertCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateTotalAllowances = () => {
    if (!payrollEmployee) return 0;
    return Object.values(payrollEmployee.allowances).reduce((sum, value) => sum + value, 0);
  };

  const calculateTotalDeductions = () => {
    if (!payrollEmployee) return 0;
    return Object.values(payrollEmployee.deductions).reduce((sum, value) => sum + value, 0);
  };

  const getCurrentPeriodPayslip = () => {
    return payslips.find(payslip => payslip.period === selectedPeriod);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading your payroll information...</span>
        </div>
      </div>
    );
  }

  if (!payrollEmployee) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No payroll information found for your account. Please contact your administrator to set up your payroll details.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentPayslip = getCurrentPeriodPayslip();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">My Payroll Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            View your salary information, payslips, and payroll details
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="min-h-[40px] text-xs sm:text-sm px-3 sm:px-4"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Sync</span>
          </Button>
        </div>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Employee Name</p>
              <p className="text-sm sm:text-base lg:text-lg font-semibold truncate">{payrollEmployee.employeeName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Employee ID</p>
              <p className="text-sm sm:text-base lg:text-lg font-semibold truncate">{payrollEmployee.employeeId}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Department</p>
              <p className="text-sm sm:text-base lg:text-lg font-semibold truncate">{payrollEmployee.department}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Role</p>
              <p className="text-sm sm:text-base lg:text-lg font-semibold truncate">{payrollEmployee.role}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Payroll Status</p>
              <div className="mt-1">
                {getStatusBadge(payrollEmployee.payrollStatus)}
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Salary Type</p>
              <div className="mt-1">
                <Badge variant={payrollEmployee.isFixedSalary ? 'outline' : 'destructive'} className="text-xs">
                  <span className="hidden sm:inline">{payrollEmployee.isFixedSalary ? 'Fixed Salary' : 'Variable Salary'}</span>
                  <span className="sm:hidden">{payrollEmployee.isFixedSalary ? 'Fixed' : 'Variable'}</span>
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {payrollEmployee.isFixedSalary 
                  ? 'Your salary is fixed monthly with no variable components'
                  : 'Your salary may include variable components like overtime or bonuses'
                }
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Currency</p>
              <p className="text-sm sm:text-base lg:text-lg font-semibold">{payrollEmployee.currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Type Explanation */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
            Salary Type Information
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Understanding your salary structure and processing
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {payrollEmployee.isFixedSalary ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-600">Fixed Salary Employee</h4>
                  <p className="text-sm text-muted-foreground">
                    Your salary is processed automatically each month with consistent amounts. 
                    No manual review is required unless there are changes to your salary structure.
                  </p>
                </div>
              </div>
              <div className="bg-green-950/20 border border-green-800/30 rounded-lg p-3">
                <h5 className="font-medium text-green-400 mb-2">Benefits:</h5>
                <ul className="text-sm text-green-300 space-y-1">
                  <li>• Consistent monthly salary processing</li>
                  <li>• No monthly form filling required</li>
                  <li>• Automatic payslip generation</li>
                  <li>• Predictable salary amounts</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-600">Variable Salary Employee</h4>
                  <p className="text-sm text-muted-foreground">
                    Your salary may include variable components like overtime, bonuses, or other allowances 
                    that can change monthly. These require manual review before processing.
                  </p>
                </div>
              </div>
              <div className="bg-orange-950/20 border border-orange-800/30 rounded-lg p-3">
                <h5 className="font-medium text-orange-400 mb-2">What this means:</h5>
                <ul className="text-sm text-orange-300 space-y-1">
                  <li>• Monthly review of variable components</li>
                  <li>• Overtime and bonuses may vary</li>
                  <li>• Manual processing required</li>
                  <li>• Potential for performance-based increases</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Salary Overview Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Base Salary</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
              {formatAmount(payrollEmployee.baseSalary)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Allowances</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 truncate">
              {formatAmount(calculateTotalAllowances())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Deductions</CardTitle>
            <Calculator className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 truncate">
              {formatAmount(calculateTotalDeductions())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Net Salary</CardTitle>
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 truncate">
              {formatAmount(payrollEmployee.netSalary)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto min-h-[40px] bg-muted p-1 gap-1 overflow-x-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 min-h-[36px] truncate">
            <span className="hidden sm:inline">Salary Breakdown</span>
            <span className="sm:hidden">Salary</span>
          </TabsTrigger>
          <TabsTrigger value="payslips" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 min-h-[36px] truncate">
            <span className="hidden sm:inline">Payslips</span>
            <span className="sm:hidden">Payslips</span>
          </TabsTrigger>
          <TabsTrigger value="allowances" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 min-h-[36px] truncate">
            <span className="hidden sm:inline">Allowances</span>
            <span className="sm:hidden">Allow.</span>
          </TabsTrigger>
          <TabsTrigger value="deductions" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5 min-h-[36px] truncate">
            <span className="hidden sm:inline">Deductions</span>
            <span className="sm:hidden">Deduct.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Salary Breakdown */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />
                  Salary Breakdown
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Detailed breakdown of your salary components
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Base Salary</span>
                    <span className="font-semibold">
                      {formatAmount(payrollEmployee.baseSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">+ Allowances</span>
                    <span className="font-semibold">
                      {formatAmount(calculateTotalAllowances())}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">+ Overtime</span>
                    <span className="font-semibold">
                      {formatAmount(payrollEmployee.overtime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">+ Bonus</span>
                    <span className="font-semibold">
                      {formatAmount(payrollEmployee.bonus)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-sm">- Deductions</span>
                    <span className="font-semibold">
                      {formatAmount(calculateTotalDeductions())}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Net Salary</span>
                      <span className="text-blue-600">
                        {formatAmount(payrollEmployee.netSalary)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Period Summary */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="truncate">Current Period ({selectedPeriod})</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Summary for the selected pay period
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {currentPayslip ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Gross Pay</span>
                      <span className="font-semibold">
                        {formatAmount(currentPayslip.grossPay)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Net Pay</span>
                      <span className="font-semibold text-blue-600">
                        {formatAmount(currentPayslip.netPay)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Status</span>
                      <div>{getStatusBadge(currentPayslip.status)}</div>
                    </div>
                    <div className="pt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full min-h-[40px] text-xs sm:text-sm"
                        onClick={() => handleDownloadPayslip(currentPayslip)}
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Download Payslip</span>
                        <span className="sm:hidden">Download</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No payslip available for this period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payslips" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
                Payslip History
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                View all your payslips and download them
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {payslips.length > 0 ? (
                <div className="space-y-3">
                  {payslips.map((payslip) => (
                    <div key={payslip.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base truncate">{payslip.period}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {payslip.startDate} - {payslip.endDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-sm sm:text-base">
                            {formatAmount(payslip.netPay)}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Net Pay</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div>{getStatusBadge(payslip.status)}</div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="min-h-[36px] px-2 sm:px-3"
                            onClick={() => handleDownloadPayslip(payslip)}
                          >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No payslips available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allowances" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                Allowances Breakdown
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Detailed breakdown of your allowances
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="flex justify-between items-center p-3 sm:p-4 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-semibold text-sm sm:text-base truncate">Housing Allowance</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Accommodation support</p>
                    </div>
                    <span className="font-semibold text-green-600 text-sm sm:text-base flex-shrink-0">
                      {formatAmount(payrollEmployee.allowances.housing)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 sm:p-4 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-semibold text-sm sm:text-base truncate">Transport Allowance</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Commuting expenses</p>
                    </div>
                    <span className="font-semibold text-green-600 text-sm sm:text-base flex-shrink-0">
                      {formatAmount(payrollEmployee.allowances.transport)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 sm:p-4 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-semibold text-sm sm:text-base truncate">Medical Allowance</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Healthcare support</p>
                    </div>
                    <span className="font-semibold text-green-600 text-sm sm:text-base flex-shrink-0">
                      {formatAmount(payrollEmployee.allowances.medical)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 sm:p-4 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-semibold text-sm sm:text-base truncate">Meal Allowance</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Food expenses</p>
                    </div>
                    <span className="font-semibold text-green-600 text-sm sm:text-base flex-shrink-0">
                      {formatAmount(payrollEmployee.allowances.meal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 sm:p-4 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-semibold text-sm sm:text-base truncate">Other Allowance</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Additional benefits</p>
                    </div>
                    <span className="font-semibold text-green-600 text-sm sm:text-base flex-shrink-0">
                      {formatAmount(payrollEmployee.allowances.other)}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total Allowances</span>
                    <span className="text-green-600">
                      {formatAmount(calculateTotalAllowances())}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                Deductions Breakdown
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Detailed breakdown of your deductions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="flex justify-between items-center p-3 sm:p-4 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-semibold text-sm sm:text-base truncate">Tax</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Income tax</p>
                    </div>
                    <span className="font-semibold text-red-600 text-sm sm:text-base flex-shrink-0">
                      {formatAmount(payrollEmployee.deductions.tax)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 sm:p-4 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-semibold text-sm sm:text-base truncate">Social Security</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Social security contributions</p>
                    </div>
                    <span className="font-semibold text-red-600 text-sm sm:text-base flex-shrink-0">
                      {formatAmount(payrollEmployee.deductions.socialSecurity)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 sm:p-4 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-semibold text-sm sm:text-base truncate">Pension</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Pension contributions</p>
                    </div>
                    <span className="font-semibold text-red-600 text-sm sm:text-base flex-shrink-0">
                      {formatAmount(payrollEmployee.deductions.pension)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 sm:p-4 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-semibold text-sm sm:text-base truncate">Insurance</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Insurance premiums</p>
                    </div>
                    <span className="font-semibold text-red-600 text-sm sm:text-base flex-shrink-0">
                      {formatAmount(payrollEmployee.deductions.insurance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 sm:p-4 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-semibold text-sm sm:text-base truncate">Other Deductions</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Additional deductions</p>
                    </div>
                    <span className="font-semibold text-red-600 text-sm sm:text-base flex-shrink-0">
                      {formatAmount(payrollEmployee.deductions.other)}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total Deductions</span>
                    <span className="text-red-600">
                      {formatAmount(calculateTotalDeductions())}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}