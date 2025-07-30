'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { format } from 'date-fns';

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  role: string;
  baseSalary: number;
  allowances: {
    housing: number;
    transport: number;
    medical: number;
    other: number;
  };
  deductions: {
    tax: number;
    socialSecurity: number;
    pension: number;
    other: number;
  };
  overtime: number;
  bonus: number;
  netSalary: number;
  payrollStatus: 'pending' | 'processed' | 'paid';
}

interface PayrollSummary {
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  averageSalary: number;
  totalTax: number;
  pendingPayments: number;
}

interface PayslipData {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  baseSalary: number;
  allowances: number;
  overtime: number;
  bonus: number;
  grossPay: number;
  deductions: number;
  tax: number;
  netPay: number;
  status: 'draft' | 'sent' | 'acknowledged';
  generatedDate: string;
}

export default function PayrollPage() {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), 'yyyy-MM'));

  const loadPayrollData = useCallback(async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls
      const mockEmployees: Employee[] = [
        {
          id: '1',
          name: 'John Doe',
          employeeId: 'EMP001',
          department: 'Engineering',
          role: 'Senior Developer',
          baseSalary: 75000,
          allowances: { housing: 15000, transport: 3000, medical: 2000, other: 1000 },
          deductions: { tax: 18750, socialSecurity: 4500, pension: 3750, other: 500 },
          overtime: 2500,
          bonus: 5000,
          netSalary: 71500,
          payrollStatus: 'processed'
        },
        {
          id: '2',
          name: 'Sarah Wilson',
          employeeId: 'EMP002',
          department: 'Marketing',
          role: 'Marketing Manager',
          baseSalary: 68000,
          allowances: { housing: 13600, transport: 2500, medical: 2000, other: 800 },
          deductions: { tax: 17000, socialSecurity: 4080, pension: 3400, other: 400 },
          overtime: 1200,
          bonus: 3000,
          netSalary: 62720,
          payrollStatus: 'paid'
        },
        {
          id: '3',
          name: 'David Chen',
          employeeId: 'EMP003',
          department: 'Finance',
          role: 'Financial Analyst',
          baseSalary: 58000,
          allowances: { housing: 11600, transport: 2000, medical: 1500, other: 600 },
          deductions: { tax: 14500, socialSecurity: 3480, pension: 2900, other: 300 },
          overtime: 800,
          bonus: 2000,
          netSalary: 53120,
          payrollStatus: 'pending'
        }
      ];

      const mockSummary: PayrollSummary = {
        totalEmployees: 85,
        totalGrossPay: 6200000,
        totalDeductions: 1550000,
        totalNetPay: 4650000,
        averageSalary: 54705,
        totalTax: 1240000,
        pendingPayments: 12
      };

      const mockPayslips: PayslipData[] = [
        {
          id: '1',
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          period: selectedPeriod,
          baseSalary: 75000,
          allowances: 21000,
          overtime: 2500,
          bonus: 5000,
          grossPay: 103500,
          deductions: 27500,
          tax: 18750,
          netPay: 71500,
          status: 'sent',
          generatedDate: '2024-01-01'
        },
        {
          id: '2',
          employeeId: 'EMP002',
          employeeName: 'Sarah Wilson',
          period: selectedPeriod,
          baseSalary: 68000,
          allowances: 18900,
          overtime: 1200,
          bonus: 3000,
          grossPay: 91100,
          deductions: 24880,
          tax: 17000,
          netPay: 62720,
          status: 'acknowledged',
          generatedDate: '2024-01-01'
        }
      ];
      
      setEmployees(mockEmployees);
      setPayrollSummary(mockSummary);
      setPayslips(mockPayslips);
    } catch (error) {
      console.error('Error loading payroll data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payroll data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, toast]);

  useEffect(() => {
    loadPayrollData();
  }, [loadPayrollData]);

  const handleProcessPayroll = async () => {
    try {
      // TODO: Implement actual payroll processing
      toast({
        title: 'Payroll Processing Started',
        description: 'Payroll processing has been initiated for all pending employees.',
      });
    } catch (error) {
      toast({
        title: 'Processing Failed',
        description: 'Failed to process payroll. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleGeneratePayslips = async () => {
    try {
      // TODO: Implement payslip generation
      toast({
        title: 'Payslips Generated',
        description: 'Payslips have been generated and sent to employees.',
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate payslips. Please try again.',
        variant: 'destructive'
      });
    }
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

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || employee.payrollStatus === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = Array.from(new Set(employees.map(emp => emp.department)));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground">
            Manage salary structures, process payroll, and generate payslips
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-01">January 2024</SelectItem>
              <SelectItem value="2023-12">December 2023</SelectItem>
              <SelectItem value="2023-11">November 2023</SelectItem>
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
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollSummary?.totalEmployees}</div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(payrollSummary?.totalGrossPay || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatAmount(payrollSummary?.totalDeductions || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatAmount(payrollSummary?.totalNetPay || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatAmount(payrollSummary?.averageSalary || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {payrollSummary?.pendingPayments}
            </div>
          </CardContent>
        </Card>
      </div>

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
                    <Badge variant="secondary">{employees.filter(emp => emp.payrollStatus === 'pending').length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Processed</span>
                    <Badge variant="default">{employees.filter(emp => emp.payrollStatus === 'processed').length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Paid</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">{employees.filter(emp => emp.payrollStatus === 'paid').length}</Badge>
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
          {/* Filters */}
          <Card className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Employee Salary List */}
          <div className="space-y-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="card-enhanced">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{employee.name}</h3>
                        {getStatusBadge(employee.payrollStatus)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-2">
                        <span><strong>ID:</strong> {employee.employeeId}</span>
                        <span><strong>Department:</strong> {employee.department}</span>
                        <span><strong>Role:</strong> {employee.role}</span>
                        <span><strong>Base Salary:</strong> {formatAmount(employee.baseSalary)}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatAmount(employee.netSalary)}</p>
                      <p className="text-sm text-muted-foreground">Net Salary</p>
                    </div>
                  </div>
                  
                  {/* Salary Breakdown */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-green-600">Allowances</p>
                        <p className="text-muted-foreground">
                          {formatAmount(Object.values(employee.allowances).reduce((sum, val) => sum + val, 0))}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-red-600">Deductions</p>
                        <p className="text-muted-foreground">
                          {formatAmount(Object.values(employee.deductions).reduce((sum, val) => sum + val, 0))}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-blue-600">Overtime</p>
                        <p className="text-muted-foreground">{formatAmount(employee.overtime)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-purple-600">Bonus</p>
                        <p className="text-muted-foreground">{formatAmount(employee.bonus)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payslips" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Employee Payslips</h2>
            <Button onClick={handleGeneratePayslips}>
              <Plus className="w-4 h-4 mr-2" />
              Generate Payslips
            </Button>
          </div>

          <div className="space-y-4">
            {payslips.map((payslip) => (
              <Card key={payslip.id} className="card-enhanced">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{payslip.employeeName}</h3>
                        {getStatusBadge(payslip.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-2">
                        <span><strong>Period:</strong> {payslip.period}</span>
                        <span><strong>Gross Pay:</strong> {formatAmount(payslip.grossPay)}</span>
                        <span><strong>Deductions:</strong> {formatAmount(payslip.deductions)}</span>
                        <span><strong>Net Pay:</strong> {formatAmount(payslip.netPay)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Receipt className="w-4 h-4 mr-1" />
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="taxes" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Tax Reports & Compliance</CardTitle>
              <CardDescription>Tax calculations and filing reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tax Reports Coming Soon</h3>
                <p className="text-muted-foreground">
                  Comprehensive tax reports and compliance features will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Payroll Analytics</CardTitle>
              <CardDescription>Insights and trends in payroll data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Dashboard Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced payroll analytics and reporting will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}