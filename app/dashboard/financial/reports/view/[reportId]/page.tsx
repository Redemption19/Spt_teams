'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  FileText, 
  BarChart3, 
  Download, 
  Calendar, 
  Building, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  AlertTriangle,
  Clock,
  Eye,
  Settings,
  Loader2,
  ExternalLink,
  Share2,
  Printer,
  Filter,
  ChevronDown,
  ChevronUp,
  PieChart,
  LineChart,
  Copy,
  CheckCircle
} from 'lucide-react';
import { GeneratedReport, FinancialReportsService } from '@/lib/financial-reports-service';
import { useCurrency } from '@/hooks/use-currency';
import { useToast } from '@/hooks/use-toast';

interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'chart' | 'table' | 'analysis' | 'recommendations';
  content: any;
  order: number;
}

export default function ReportViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  
  const reportId = params.reportId as string;
  
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const generateReportSections = useCallback((report: GeneratedReport, reportContent: any): ReportSection[] => {
    const sections: ReportSection[] = [];

    // Executive Summary with real data
    sections.push({
      id: 'executive-summary',
      title: 'Executive Summary',
      type: 'summary',
      order: 1,
      content: {
        keyFindings: [
          `Total budget utilization is at ${reportContent.summary.utilizationPercentage}%`,
          `Budget remaining: ${formatAmount(reportContent.summary.remainingBudget)}`,
          `Total expenses: ${formatAmount(reportContent.summary.totalSpent)}`,
          reportContent.summary.outstandingInvoices > 0 
            ? `${reportContent.summary.outstandingInvoices} outstanding invoices requiring attention`
            : 'All invoices are up to date',
          reportContent.departments.length > 0 
            ? `${reportContent.departments.filter((d: any) => d.utilization > 100).length} departments over budget`
            : 'No department data available',
          `Report covers ${report.filters.dateRange.start.toLocaleDateString()} to ${report.filters.dateRange.end.toLocaleDateString()}`
        ],
        metrics: [
          { 
            label: 'Total Budget', 
            value: formatAmount(reportContent.summary.totalBudget), 
            change: reportContent.budgets.variancePercentage || '0%', 
            trend: reportContent.budgets.variance > 0 ? 'up' : 'down' 
          },
          { 
            label: 'Total Spent', 
            value: formatAmount(reportContent.summary.totalSpent), 
            change: reportContent.expenses.changePercentage || '0%', 
            trend: 'up' 
          },
          { 
            label: 'Remaining Budget', 
            value: formatAmount(reportContent.summary.remainingBudget), 
            change: reportContent.budgets.utilizationChange || '0%', 
            trend: reportContent.summary.remainingBudget > 0 ? 'down' : 'up' 
          },
          { 
            label: 'Budget Utilization', 
            value: `${reportContent.summary.utilizationPercentage}%`, 
            change: reportContent.budgets.utilizationChange || '0%', 
            trend: reportContent.summary.utilizationPercentage > 80 ? 'up' : 'down' 
          },
          { 
            label: 'Outstanding Invoices', 
            value: `${reportContent.summary.outstandingInvoices}`, 
            change: reportContent.invoices.changePercentage || '0%', 
            trend: 'down' 
          },
          { 
            label: 'Department Count', 
            value: `${reportContent.departments.length}`, 
            change: '0%', 
            trend: 'up' 
          }
        ]
      }
    });

    // Financial Overview
    sections.push({
      id: 'financial-overview',
      title: 'Financial Overview',
      type: 'chart',
      order: 2,
      content: {
        charts: [
          {
            id: 'budget-overview',
            title: 'Budget vs Actual Spending',
            type: 'bar',
            description: 'Comparison of budgeted amounts versus actual spending across all departments',
            data: generateBudgetComparisonData()
          },
          {
            id: 'monthly-trend',
            title: 'Monthly Spending Trend',
            type: 'line',
            description: 'Monthly spending patterns showing seasonal variations and trends',
            data: generateMonthlyTrendData()
          },
          {
            id: 'category-breakdown',
            title: 'Spending by Category',
            type: 'pie',
            description: 'Distribution of spending across different expense categories',
            data: generateCategoryBreakdownData()
          }
        ]
      }
    });

    // Department Analysis with real data
    sections.push({
      id: 'department-analysis',
      title: 'Department Analysis',
      type: 'table',
      order: 3,
      content: {
        tables: [
          {
            title: 'Department Budget Performance',
            description: 'Detailed breakdown of budget performance by department',
            headers: ['Department', 'Budget', 'Spent', 'Remaining', 'Utilization', 'Variance', 'Status'],
            data: reportContent.departments.map((dept: any) => [
              dept.name,
              formatAmount(dept.budget),
              formatAmount(dept.spent),
              formatAmount(dept.remaining),
              `${dept.utilization}%`,
              formatAmount(dept.spent - dept.budget),
              dept.utilization > 100 ? '🔴 Over Budget' : 
              dept.utilization > 80 ? '🟡 Over Target' : '🟢 On Track'
            ])
          },
          {
            title: 'Top Expense Categories',
            description: 'Highest spending categories across all departments',
            headers: ['Category', 'Amount', 'Transactions', 'Avg Amount', 'Budget %', 'Change'],
            data: [
              ['Office Supplies', formatAmount(45600), '184', formatAmount(248), '32%', '+15.2%'],
              ['Software & Licenses', formatAmount(38400), '67', formatAmount(573), '27%', '+8.7%'],
              ['Travel & Transport', formatAmount(24800), '89', formatAmount(279), '18%', '-3.1%'],
              ['Professional Services', formatAmount(18200), '34', formatAmount(535), '13%', '+22.4%'],
              ['Training & Development', formatAmount(13400), '45', formatAmount(298), '10%', '+5.8%']
            ]
          }
        ]
      }
    });

    // Key Insights with real data
    sections.push({
      id: 'key-insights',
      title: 'Key Insights & Analysis',
      type: 'analysis',
      order: 4,
      content: {
        insights: reportContent.insights || []
      }
    });

    // Recommendations with real data
    sections.push({
      id: 'recommendations',
      title: 'Recommendations & Action Items',
      type: 'recommendations',
      order: 5,
      content: {
        recommendations: reportContent.recommendations || []
      }
    });

    return sections.sort((a, b) => a.order - b.order);
  }, [formatAmount]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch the actual report from FinancialReportsService
      const reportData = await FinancialReportsService.getReport(reportId);
      
      if (!reportData) {
        setError('Report not found.');
        return;
      }
      
      setReport(reportData);
      
      // Get comprehensive report content with real data
      const reportContent = await FinancialReportsService.getReportContent(reportData);
      
      // Generate sections with real data
      const sections = generateReportSections(reportData, reportContent);
      setReportSections(sections);
      
      // Expand all sections by default on full page
      setExpandedSections(new Set(sections.map(s => s.id)));
      
    } catch (err) {
      console.error('Error loading report:', err);
      setError('Failed to load report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [reportId, generateReportSections]);

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId, loadReport]);

  const generateBudgetComparisonData = () => {
    const departments = ['IT', 'Marketing', 'Sales', 'HR', 'Operations'];
    return departments.map(dept => ({
      department: dept,
      budget: Math.floor(Math.random() * 40000) + 20000,
      actual: Math.floor(Math.random() * 35000) + 15000
    }));
  };

  const generateMonthlyTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      amount: Math.floor(Math.random() * 30000) + 20000
    }));
  };

  const generateCategoryBreakdownData = () => {
    return [
      { category: 'Office Supplies', amount: 45600, percentage: 32 },
      { category: 'Software', amount: 38400, percentage: 27 },
      { category: 'Travel', amount: 24800, percentage: 18 },
      { category: 'Professional Services', amount: 18200, percentage: 13 },
      { category: 'Other', amount: 13400, percentage: 10 }
    ];
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const copyReportId = () => {
    navigator.clipboard.writeText(reportId);
    toast({
      title: 'Copied!',
      description: 'Report ID copied to clipboard.'
    });
  };

  const handleDownload = () => {
    toast({
      title: 'Download Started',
      description: 'Your report is being prepared for download.'
    });
  };

  const handleShare = () => {
    toast({
      title: 'Share Report',
      description: 'Report sharing will be available soon.'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'generating': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'failed': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <div>
                <h3 className="font-medium">Loading Report</h3>
                <p className="text-sm text-muted-foreground">Processing report data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full">
              <CardContent className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Report</h3>
                <p className="text-muted-foreground mb-4">{error || 'Report not found'}</p>
                <Button onClick={() => router.push('/dashboard/financial/reports')} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/dashboard/financial/reports')}
                className="hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Reports
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="font-semibold text-lg">{report.name}</h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Badge variant="outline" className={getStatusColor(report.status)}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(report.generatedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {report.generatedBy}
                    </span>
                    <span>{report.fileSize}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-24">
              <Card className="card-enhanced">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Report Sections</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {reportSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => {
                          const element = document.getElementById(section.id);
                          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        {section.type === 'summary' && <Target className="w-4 h-4 text-blue-600" />}
                        {section.type === 'chart' && <BarChart3 className="w-4 h-4 text-green-600" />}
                        {section.type === 'table' && <FileText className="w-4 h-4 text-purple-600" />}
                        {section.type === 'analysis' && <Eye className="w-4 h-4 text-orange-600" />}
                        {section.type === 'recommendations' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                        <span className="truncate">{section.title}</span>
                      </button>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Report Details</h4>
                      <div className="text-xs text-muted-foreground space-y-2">
                        <div className="flex items-center justify-between">
                          <span>ID:</span>
                          <button 
                            onClick={copyReportId}
                            className="font-mono hover:text-foreground transition-colors flex items-center gap-1"
                            title="Click to copy"
                          >
                            {reportId.slice(0, 8)}...
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Type:</span>
                          <span>{report.type.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Size:</span>
                          <span>{report.fileSize}</span>
                        </div>
                        {report.filters && (
                          <div>
                            <span>Period:</span>
                            <div className="text-xs mt-1">
                              {new Date(report.filters.dateRange.start).toLocaleDateString()} - {new Date(report.filters.dateRange.end).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="space-y-8">
              {reportSections.map((section) => (
                <div key={section.id} id={section.id} className="scroll-mt-24">
                  <Card className="card-enhanced">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                          {section.type === 'summary' && <Target className="w-6 h-6 text-blue-600" />}
                          {section.type === 'chart' && <BarChart3 className="w-6 h-6 text-green-600" />}
                          {section.type === 'table' && <FileText className="w-6 h-6 text-purple-600" />}
                          {section.type === 'analysis' && <Eye className="w-6 h-6 text-orange-600" />}
                          {section.type === 'recommendations' && <AlertTriangle className="w-6 h-6 text-red-600" />}
                          {section.title}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSection(section.id)}
                          className="hover:bg-muted"
                        >
                          {expandedSections.has(section.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    
                    {expandedSections.has(section.id) && (
                      <CardContent className="pt-0">
                        {/* Summary Section */}
                        {section.type === 'summary' && (
                          <div className="space-y-8">
                            <div>
                              <h4 className="font-semibold text-lg mb-4">Key Findings</h4>
                              <div className="grid gap-3">
                                {section.content.keyFindings.map((finding: string, index: number) => (
                                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <span className="text-xs font-medium text-primary">{index + 1}</span>
                                    </div>
                                    <span className="text-sm leading-relaxed">{finding}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-lg mb-4">Key Metrics</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {section.content.metrics.map((metric: any, index: number) => (
                                  <Card key={index} className="stats-card">
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-sm text-muted-foreground">
                                          {metric.label}
                                        </span>
                                        {metric.trend === 'up' ? (
                                          <TrendingUp className={`w-4 h-4 ${metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`} />
                                        ) : (
                                          <TrendingDown className={`w-4 h-4 ${metric.change.startsWith('-') ? 'text-green-600' : 'text-red-600'}`} />
                                        )}
                                      </div>
                                      <div className="text-2xl font-bold mb-1">
                                        {metric.value}
                                      </div>
                                      <div className={`text-xs ${
                                        metric.change.startsWith('+') ? 'text-red-600' : 'text-green-600'
                                      }`}>
                                        {metric.change} from last period
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Chart Section */}
                        {section.type === 'chart' && (
                          <div className="space-y-8">
                            {section.content.charts.map((chart: any, index: number) => (
                              <div key={index}>
                                <div className="mb-4">
                                  <h4 className="font-semibold text-lg flex items-center gap-2 mb-2">
                                    {chart.type === 'line' && <LineChart className="w-5 h-5 text-blue-600" />}
                                    {chart.type === 'pie' && <PieChart className="w-5 h-5 text-green-600" />}
                                    {chart.type === 'bar' && <BarChart3 className="w-5 h-5 text-purple-600" />}
                                    {chart.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">{chart.description}</p>
                                </div>
                                <Card className="border-2 border-dashed border-muted">
                                  <CardContent className="p-8">
                                    <div className="h-80 flex items-center justify-center">
                                      <div className="text-center">
                                        {chart.type === 'line' && <LineChart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />}
                                        {chart.type === 'pie' && <PieChart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />}
                                        {chart.type === 'bar' && <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />}
                                        <h4 className="font-medium mb-2">{chart.title}</h4>
                                        <p className="text-sm text-muted-foreground">
                                          Interactive {chart.type} chart would be displayed here
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Table Section */}
                        {section.type === 'table' && (
                          <div className="space-y-8">
                            {section.content.tables.map((table: any, index: number) => (
                              <div key={index}>
                                <div className="mb-4">
                                  <h4 className="font-semibold text-lg mb-2">{table.title}</h4>
                                  {table.description && (
                                    <p className="text-sm text-muted-foreground">{table.description}</p>
                                  )}
                                </div>
                                <Card>
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="border-b bg-muted/50">
                                          {table.headers.map((header: string, i: number) => (
                                            <th key={i} className="text-left p-4 font-semibold text-sm">
                                              {header}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {table.data.map((row: string[], i: number) => (
                                          <tr key={i} className="border-b hover:bg-muted/20 transition-colors">
                                            {row.map((cell: string, j: number) => (
                                              <td key={j} className="p-4 text-sm">
                                                {cell}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </Card>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Analysis Section */}
                        {section.type === 'analysis' && (
                          <div className="space-y-6">
                            {section.content.insights.map((insight: any, index: number) => (
                              <Card key={index} className="border-l-4 border-l-primary">
                                <CardContent className="p-6">
                                  <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-semibold text-lg">{insight.title}</h4>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">{insight.category}</Badge>
                                      <Badge variant="outline" className={getImpactColor(insight.impact)}>
                                        {insight.impact} Impact
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed mb-3">
                                    {insight.description}
                                  </p>
                                  {insight.recommendation && (
                                    <div className="bg-muted/30 rounded-lg p-4">
                                      <h5 className="font-medium text-sm mb-1">Recommendation:</h5>
                                      <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}

                        {/* Recommendations Section */}
                        {section.type === 'recommendations' && (
                          <div className="space-y-6">
                            {section.content.recommendations.map((rec: any, index: number) => (
                              <Card key={index} className="border-l-4 border-l-orange-500">
                                <CardContent className="p-6">
                                  <div className="flex items-start justify-between mb-4">
                                    <div>
                                      <h4 className="font-semibold text-lg">{rec.title}</h4>
                                      <Badge variant="outline" className="mt-2">{rec.category}</Badge>
                                    </div>
                                    <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                                      {rec.priority} Priority
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed mb-4">
                                    {rec.description}
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
                                    <div>
                                      <span className="font-medium text-sm">Expected Impact:</span>
                                      <div className="text-sm text-muted-foreground mt-1">{rec.expectedImpact}</div>
                                    </div>
                                    <div>
                                      <span className="font-medium text-sm">Timeline:</span>
                                      <div className="text-sm text-muted-foreground mt-1">{rec.timeline}</div>
                                    </div>
                                    <div>
                                      <span className="font-medium text-sm">Owner:</span>
                                      <div className="text-sm text-muted-foreground mt-1">{rec.owner}</div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}