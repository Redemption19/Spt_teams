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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Payroll Dashboard</h1>
          <p className="text-muted-foreground">
            View your salary information, payslips, and payroll details
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Employee Name</p>
              <p className="text-lg font-semibold">{payrollEmployee.employeeName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
              <p className="text-lg font-semibold">{payrollEmployee.employeeId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Department</p>
              <p className="text-lg font-semibold">{payrollEmployee.department}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="text-lg font-semibold">{payrollEmployee.role}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payroll Status</p>
              <div className="mt-1">
                {getStatusBadge(payrollEmployee.payrollStatus)}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Salary Type</p>
              <div className="mt-1">
                <Badge variant={payrollEmployee.isFixedSalary ? 'outline' : 'destructive'}>
                  {payrollEmployee.isFixedSalary ? 'Fixed Salary' : 'Variable Salary'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {payrollEmployee.isFixedSalary 
                  ? 'Your salary is fixed monthly with no variable components'
                  : 'Your salary may include variable components like overtime or bonuses'
                }
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Currency</p>
              <p className="text-lg font-semibold">{payrollEmployee.currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Type Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Salary Type Information
          </CardTitle>
          <CardDescription>
            Understanding your salary structure and processing
          </CardDescription>
        </CardHeader>
        <CardContent>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(payrollEmployee.baseSalary)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allowances</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(calculateTotalAllowances())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatAmount(calculateTotalDeductions())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Salary</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatAmount(payrollEmployee.netSalary)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="overview">Salary Breakdown</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="allowances">Allowances</TabsTrigger>
          <TabsTrigger value="deductions">Deductions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Salary Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Salary Breakdown
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of your salary components
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Current Period ({selectedPeriod})
                </CardTitle>
                <CardDescription>
                  Summary for the selected pay period
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                        className="w-full"
                        onClick={() => handleDownloadPayslip(currentPayslip)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Payslip
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Payslip History
              </CardTitle>
              <CardDescription>
                View all your payslips and download them
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payslips.length > 0 ? (
                <div className="space-y-3">
                  {payslips.map((payslip) => (
                    <div key={payslip.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold">{payslip.period}</p>
                          <p className="text-sm text-muted-foreground">
                            {payslip.startDate} - {payslip.endDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatAmount(payslip.netPay)}
                          </p>
                          <p className="text-sm text-muted-foreground">Net Pay</p>
                        </div>
                        <div>{getStatusBadge(payslip.status)}</div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadPayslip(payslip)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Allowances Breakdown
              </CardTitle>
              <CardDescription>
                Detailed breakdown of your allowances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">Housing Allowance</p>
                      <p className="text-sm text-muted-foreground">Accommodation support</p>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatAmount(payrollEmployee.allowances.housing)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">Transport Allowance</p>
                      <p className="text-sm text-muted-foreground">Commuting expenses</p>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatAmount(payrollEmployee.allowances.transport)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">Medical Allowance</p>
                      <p className="text-sm text-muted-foreground">Healthcare support</p>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatAmount(payrollEmployee.allowances.medical)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">Meal Allowance</p>
                      <p className="text-sm text-muted-foreground">Food expenses</p>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatAmount(payrollEmployee.allowances.meal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">Other Allowance</p>
                      <p className="text-sm text-muted-foreground">Additional benefits</p>
                    </div>
                    <span className="font-semibold text-green-600">
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Deductions Breakdown
              </CardTitle>
              <CardDescription>
                Detailed breakdown of your deductions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">Tax</p>
                      <p className="text-sm text-muted-foreground">Income tax</p>
                    </div>
                    <span className="font-semibold text-red-600">
                      {formatAmount(payrollEmployee.deductions.tax)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">Social Security</p>
                      <p className="text-sm text-muted-foreground">Social security contributions</p>
                    </div>
                    <span className="font-semibold text-red-600">
                      {formatAmount(payrollEmployee.deductions.socialSecurity)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">Pension</p>
                      <p className="text-sm text-muted-foreground">Pension contributions</p>
                    </div>
                    <span className="font-semibold text-red-600">
                      {formatAmount(payrollEmployee.deductions.pension)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">Insurance</p>
                      <p className="text-sm text-muted-foreground">Insurance premiums</p>
                    </div>
                    <span className="font-semibold text-red-600">
                      {formatAmount(payrollEmployee.deductions.insurance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">Other Deductions</p>
                      <p className="text-sm text-muted-foreground">Additional deductions</p>
                    </div>
                    <span className="font-semibold text-red-600">
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