'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  PieChart,
  LineChart,
  Filter,
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react';

// Mock financial report data
const mockReports = [
  {
    id: 'rpt-001',
    name: 'Monthly Budget vs Actual',
    type: 'budget_analysis',
    period: 'January 2024',
    generatedAt: new Date('2024-02-01'),
    generatedBy: 'Sarah Johnson',
    status: 'completed',
    fileSize: '2.4 MB',
    downloadUrl: '#'
  },
  {
    id: 'rpt-002',
    name: 'Expense Category Breakdown',
    type: 'expense_analysis',
    period: 'Q4 2023',
    generatedAt: new Date('2024-01-15'),
    generatedBy: 'David Wilson',
    status: 'completed',
    fileSize: '1.8 MB',
    downloadUrl: '#'
  },
  {
    id: 'rpt-003',
    name: 'Cost Center Performance',
    type: 'cost_center_analysis',
    period: 'December 2023',
    generatedAt: new Date('2024-01-05'),
    generatedBy: 'Emily Davis',
    status: 'completed',
    fileSize: '3.2 MB',
    downloadUrl: '#'
  },
  {
    id: 'rpt-004',
    name: 'Revenue and P&L Analysis',
    type: 'profit_loss',
    period: 'FY 2023',
    generatedAt: new Date('2024-01-02'),
    generatedBy: 'Michael Chen',
    status: 'completed',
    fileSize: '4.1 MB',
    downloadUrl: '#'
  }
];

const reportTemplates = [
  {
    id: 'budget_analysis',
    name: 'Budget Analysis Report',
    description: 'Compare budgets vs actual spending across departments and projects',
    category: 'Budget Management',
    estimatedTime: '2-3 minutes',
    dataPoints: ['Budget allocations', 'Actual expenses', 'Variance analysis', 'Forecasting']
  },
  {
    id: 'expense_analysis',
    name: 'Expense Analysis Report',
    description: 'Detailed breakdown of expenses by category, department, and time period',
    category: 'Expense Management',
    estimatedTime: '1-2 minutes',
    dataPoints: ['Expense categories', 'Department spending', 'Trend analysis', 'Top expenses']
  },
  {
    id: 'cost_center_analysis',
    name: 'Cost Center Performance',
    description: 'Performance analysis of all cost centers including budget utilization',
    category: 'Cost Management',
    estimatedTime: '3-4 minutes',
    dataPoints: ['Cost center budgets', 'Utilization rates', 'Performance metrics', 'Comparisons']
  },
  {
    id: 'profit_loss',
    name: 'Profit & Loss Statement',
    description: 'Comprehensive P&L statement with revenue, expenses, and net income',
    category: 'Financial Statements',
    estimatedTime: '4-5 minutes',
    dataPoints: ['Revenue streams', 'Operating expenses', 'Net income', 'Period comparisons']
  },
  {
    id: 'cash_flow',
    name: 'Cash Flow Report',
    description: 'Cash flow analysis including operating, investing, and financing activities',
    category: 'Financial Statements',
    estimatedTime: '3-4 minutes',
    dataPoints: ['Cash inflows', 'Cash outflows', 'Net cash flow', 'Cash position']
  },
  {
    id: 'invoice_aging',
    name: 'Invoice Aging Report',
    description: 'Analysis of outstanding invoices and payment patterns',
    category: 'Accounts Receivable',
    estimatedTime: '1-2 minutes',
    dataPoints: ['Outstanding invoices', 'Payment terms', 'Aging buckets', 'Collection metrics']
  }
];

const quickInsights = [
  {
    title: 'Budget Variance',
    value: '+$12,500',
    change: '+8.3%',
    trend: 'up',
    description: 'Over budget this month',
    color: 'text-red-600'
  },
  {
    title: 'Expense Growth',
    value: '$145,250',
    change: '-2.1%',
    trend: 'down',
    description: 'Compared to last month',
    color: 'text-green-600'
  },
  {
    title: 'Cost per Employee',
    value: '$2,847',
    change: '+1.2%',
    trend: 'up',
    description: 'Monthly average',
    color: 'text-blue-600'
  },
  {
    title: 'ROI',
    value: '24.5%',
    change: '+3.8%',
    trend: 'up',
    description: 'Return on investment',
    color: 'text-green-600'
  }
];

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async (templateId: string) => {
    setIsGenerating(true);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    // In real implementation, this would trigger the actual report generation
    console.log(`Generating report for template: ${templateId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive financial reports and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickInsights.map((insight, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
              {insight.trend === 'up' ? (
                <TrendingUp className={`h-4 w-4 ${insight.color}`} />
              ) : (
                <TrendingDown className={`h-4 w-4 ${insight.color}`} />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insight.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={insight.color}>{insight.change}</span> {insight.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Global Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Report Filters
              </CardTitle>
              <CardDescription>
                Configure global settings for all financial reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period">Reporting Period</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current-month">Current Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="current-quarter">Current Quarter</SelectItem>
                      <SelectItem value="last-quarter">Last Quarter</SelectItem>
                      <SelectItem value="current-year">Current Year</SelectItem>
                      <SelectItem value="last-year">Last Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD - US Dollar</SelectItem>
                      <SelectItem value="eur">EUR - Euro</SelectItem>
                      <SelectItem value="gbp">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Export Format</Label>
                  <Select defaultValue="pdf">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Most Used Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Most Used Reports</CardTitle>
              <CardDescription>
                Quick access to your frequently generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTemplates.slice(0, 4).map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>⏱️ {template.estimatedTime}</span>
                        <span>📊 {template.dataPoints.length} data points</span>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleGenerateReport(template.id)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-3 h-3 mr-2" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>
                Choose from predefined report templates or create custom reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportTemplates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{template.name}</h3>
                        <Badge variant="secondary">{template.category}</Badge>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        ⏱️ {template.estimatedTime}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Includes:</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {template.dataPoints.map((point, index) => (
                          <div key={index} className="text-xs text-muted-foreground flex items-center">
                            <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                            {point}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                      >
                        <Eye className="w-3 h-3 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleGenerateReport(template.id)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3 mr-2" />
                        )}
                        Generate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>
                View and download previously generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{report.name}</h3>
                          <Badge variant="outline">{report.type.replace('_', ' ')}</Badge>
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            {report.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Period: {report.period} • Generated by: {report.generatedBy}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {report.generatedAt.toLocaleString()} • {report.fileSize}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Financial Analytics</CardTitle>
              <CardDescription>
                Advanced financial analytics and trend analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 space-y-4">
                <div className="flex justify-center gap-4">
                  <LineChart className="w-12 h-12 text-blue-500" />
                  <BarChart3 className="w-12 h-12 text-green-500" />
                  <PieChart className="w-12 h-12 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Advanced Analytics Coming Soon</h3>
                  <p className="text-muted-foreground mt-2">
                    Interactive charts and advanced financial analytics will be available here
                  </p>
                </div>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
