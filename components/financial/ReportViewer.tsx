'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
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
  LineChart
} from 'lucide-react';
import { GeneratedReport } from '@/lib/financial-reports-service';
import { useCurrency } from '@/hooks/use-currency';

interface ReportViewerProps {
  report: GeneratedReport;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
}

interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'chart' | 'table' | 'analysis' | 'recommendations';
  content: any;
  order: number;
}

export function ReportViewer({ 
  report, 
  isOpen, 
  onClose, 
  onDownload, 
  onShare 
}: ReportViewerProps) {
  const { formatAmount, defaultCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const generateReportSections = useCallback((report: GeneratedReport): ReportSection[] => {
    const sections: ReportSection[] = [];

    // Executive Summary
    sections.push({
      id: 'executive-summary',
      title: 'Executive Summary',
      type: 'summary',
      order: 1,
      content: {
        keyFindings: [
          'Total expenses increased by 12.5% compared to last period',
          'Budget utilization is at 78%, within acceptable range',
          'Top spending category: Office Supplies (32% of total)',
          'Cost per employee has remained stable at ₵2,847'
        ],
        metrics: [
          { label: 'Total Amount', value: formatAmount(125000), change: '+12.5%', trend: 'up' },
          { label: 'Transaction Count', value: '1,247', change: '+8.3%', trend: 'up' },
          { label: 'Average Amount', value: formatAmount(100), change: '-2.1%', trend: 'down' },
          { label: 'Budget Variance', value: formatAmount(15000), change: '+5.2%', trend: 'up' }
        ]
      }
    });

    // Charts and Visualizations
    if (report.type === 'expense' || report.type === 'budget') {
      sections.push({
        id: 'visualizations',
        title: 'Charts & Visualizations',
        type: 'chart',
        order: 2,
        content: {
          charts: [
            {
              id: 'trend-chart',
              title: 'Monthly Trend Analysis',
              type: 'line',
              data: generateTrendData()
            },
            {
              id: 'category-chart',
              title: 'Expense by Category',
              type: 'pie',
              data: generateCategoryData()
            },
            {
              id: 'comparison-chart',
              title: 'Budget vs Actual',
              type: 'bar',
              data: generateComparisonData()
            }
          ]
        }
      });
    }

    // Detailed Analysis
    sections.push({
      id: 'detailed-analysis',
      title: 'Detailed Analysis',
      type: 'table',
      order: 3,
      content: {
        tables: [
          {
            title: 'Top Expenses by Category',
            headers: ['Category', 'Amount', 'Count', 'Average', 'Change'],
            data: [
              ['Office Supplies', formatAmount(40000), '156', formatAmount(256), '+15.2%'],
              ['Travel & Transport', formatAmount(32000), '89', formatAmount(360), '+8.7%'],
              ['Software & Tools', formatAmount(28000), '45', formatAmount(622), '-3.1%'],
              ['Marketing', formatAmount(15000), '67', formatAmount(224), '+22.4%'],
              ['Utilities', formatAmount(10000), '23', formatAmount(435), '+5.8%']
            ]
          },
          {
            title: 'Department Breakdown',
            headers: ['Department', 'Budget', 'Spent', 'Remaining', 'Utilization'],
            data: [
              ['IT Department', formatAmount(50000), formatAmount(42000), formatAmount(8000), '84%'],
              ['Marketing', formatAmount(35000), formatAmount(28000), formatAmount(7000), '80%'],
              ['Sales', formatAmount(40000), formatAmount(31000), formatAmount(9000), '78%'],
              ['HR', formatAmount(25000), formatAmount(18000), formatAmount(7000), '72%'],
              ['Operations', formatAmount(30000), formatAmount(21000), formatAmount(9000), '70%']
            ]
          }
        ]
      }
    });

    // Key Insights
    sections.push({
      id: 'key-insights',
      title: 'Key Insights & Analysis',
      type: 'analysis',
      order: 4,
      content: {
        insights: [
          {
            title: 'Expense Growth Trend',
            description: 'Expenses have shown a consistent upward trend over the past 6 months, primarily driven by increased office supplies and travel costs.',
            impact: 'Medium',
            category: 'Trend Analysis'
          },
          {
            title: 'Budget Variance Analysis',
            description: 'Most departments are operating within budget, with IT showing the highest utilization at 84%.',
            impact: 'Low',
            category: 'Budget Management'
          },
          {
            title: 'Cost Optimization Opportunities',
            description: 'Software subscriptions could be consolidated to reduce costs by an estimated 15-20%.',
            impact: 'High',
            category: 'Cost Savings'
          }
        ]
      }
    });

    // Recommendations
    sections.push({
      id: 'recommendations',
      title: 'Recommendations & Action Items',
      type: 'recommendations',
      order: 5,
      content: {
        recommendations: [
          {
            priority: 'High',
            title: 'Implement Expense Approval Workflow',
            description: 'Establish a multi-level approval process for expenses over ₵1,000 to improve cost control.',
            expectedImpact: '10-15% reduction in unauthorized expenses',
            timeline: '2-3 weeks',
            owner: 'Finance Team'
          },
          {
            priority: 'Medium',
            title: 'Negotiate Vendor Contracts',
            description: 'Review and renegotiate contracts with top 5 vendors to secure better rates.',
            expectedImpact: '5-8% cost reduction',
            timeline: '1-2 months',
            owner: 'Procurement Team'
          },
          {
            priority: 'Low',
            title: 'Regular Budget Reviews',
            description: 'Implement monthly budget review meetings with department heads.',
            expectedImpact: 'Improved budget awareness',
            timeline: 'Ongoing',
            owner: 'Department Heads'
          }
        ]
      }
    });

    return sections.sort((a, b) => a.order - b.order);
  }, [formatAmount]);

  const loadReportContent = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate loading report content
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const sections = generateReportSections(report);
      setReportSections(sections);
      
      // Expand first few sections by default
      setExpandedSections(new Set(sections.slice(0, 3).map(s => s.id)));
    } catch (error) {
      console.error('Error loading report content:', error);
    } finally {
      setLoading(false);
    }
  }, [report, generateReportSections]);

  useEffect(() => {
    if (isOpen && report) {
      loadReportContent();
    }
  }, [isOpen, report, loadReportContent]);

  const generateTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      budget: Math.floor(Math.random() * 50000) + 30000,
      actual: Math.floor(Math.random() * 45000) + 25000
    }));
  };

  const generateCategoryData = () => {
    return [
      { category: 'Office Supplies', amount: 40000, percentage: 32 },
      { category: 'Travel', amount: 32000, percentage: 26 },
      { category: 'Software', amount: 28000, percentage: 22 },
      { category: 'Marketing', amount: 15000, percentage: 12 },
      { category: 'Other', amount: 10000, percentage: 8 }
    ];
  };

  const generateComparisonData = () => {
    const departments = ['IT', 'Marketing', 'Sales', 'HR', 'Operations'];
    return departments.map(dept => ({
      department: dept,
      budget: Math.floor(Math.random() * 40000) + 20000,
      actual: Math.floor(Math.random() * 35000) + 15000
    }));
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl max-h-[95vh] bg-background border shadow-2xl">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-accent/5 sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <FileText className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-xl">{report.name}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-1">
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
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={onDownload} className="bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r bg-muted/30 p-4">
            <h3 className="font-semibold mb-3">Report Sections</h3>
            <div className="space-y-1">
              {reportSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveTab('content');
                    const element = document.getElementById(section.id);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-background transition-colors"
                >
                  {section.title}
                </button>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">Report Details</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Type: {report.type.replace('_', ' ').toUpperCase()}</div>
                  <div>Generated: {formatDate(report.generatedAt)}</div>
                  <div>Size: {report.fileSize}</div>
                  {report.filters && (
                    <div>
                      Period: {new Date(report.filters.dateRange.start).toLocaleDateString()} - {new Date(report.filters.dateRange.end).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger value="content">Report Content</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="filters">Applied Filters</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[calc(100%-48px)]">
                <TabsContent value="content" className="p-6 mt-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                        <div>
                          <h3 className="font-medium">Loading Report Content</h3>
                          <p className="text-sm text-muted-foreground">Processing report data...</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {reportSections.map((section) => (
                        <div key={section.id} id={section.id} className="scroll-mt-6">
                          <Card className="card-enhanced">
                            <CardHeader 
                              className="cursor-pointer"
                              onClick={() => toggleSection(section.id)}
                            >
                              <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                  {section.type === 'summary' && <Target className="w-5 h-5 text-blue-600" />}
                                  {section.type === 'chart' && <BarChart3 className="w-5 h-5 text-green-600" />}
                                  {section.type === 'table' && <FileText className="w-5 h-5 text-purple-600" />}
                                  {section.type === 'analysis' && <Eye className="w-5 h-5 text-orange-600" />}
                                  {section.type === 'recommendations' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                                  {section.title}
                                </CardTitle>
                                {expandedSections.has(section.id) ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </CardHeader>
                            
                            {expandedSections.has(section.id) && (
                              <CardContent>
                                {/* Summary Section */}
                                {section.type === 'summary' && (
                                  <div className="space-y-6">
                                    <div>
                                      <h4 className="font-semibold mb-3">Key Findings:</h4>
                                      <ul className="space-y-2">
                                        {section.content.keyFindings.map((finding: string, index: number) => (
                                          <li key={index} className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                            <span className="text-sm">{finding}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-semibold mb-3">Key Metrics:</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {section.content.metrics.map((metric: any, index: number) => (
                                          <div key={index} className="text-center p-4 rounded-lg bg-muted/30">
                                            <div className="font-medium text-sm text-muted-foreground mb-1">
                                              {metric.label}
                                            </div>
                                            <div className="text-xl font-bold">
                                              {metric.value}
                                            </div>
                                            <div className={`text-xs flex items-center justify-center gap-1 ${
                                              metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                              {metric.trend === 'up' ? (
                                                <TrendingUp className="w-3 h-3" />
                                              ) : (
                                                <TrendingDown className="w-3 h-3" />
                                              )}
                                              {metric.change}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Chart Section */}
                                {section.type === 'chart' && (
                                  <div className="space-y-6">
                                    {section.content.charts.map((chart: any, index: number) => (
                                      <div key={index} className="border rounded-lg p-4">
                                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                                          {chart.type === 'line' && <LineChart className="w-4 h-4" />}
                                          {chart.type === 'pie' && <PieChart className="w-4 h-4" />}
                                          {chart.type === 'bar' && <BarChart3 className="w-4 h-4" />}
                                          {chart.title}
                                        </h4>
                                        <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                                          <div className="text-center">
                                            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                              {chart.title} visualization would appear here
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Table Section */}
                                {section.type === 'table' && (
                                  <div className="space-y-6">
                                    {section.content.tables.map((table: any, index: number) => (
                                      <div key={index}>
                                        <h4 className="font-semibold mb-3">{table.title}</h4>
                                        <div className="overflow-x-auto">
                                          <table className="w-full border rounded-lg">
                                            <thead>
                                              <tr className="bg-muted">
                                                {table.headers.map((header: string, i: number) => (
                                                  <th key={i} className="text-left p-3 font-medium">
                                                    {header}
                                                  </th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {table.data.map((row: string[], i: number) => (
                                                <tr key={i} className="border-t">
                                                  {row.map((cell: string, j: number) => (
                                                    <td key={j} className="p-3">
                                                      {cell}
                                                    </td>
                                                  ))}
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Analysis Section */}
                                {section.type === 'analysis' && (
                                  <div className="space-y-4">
                                    {section.content.insights.map((insight: any, index: number) => (
                                      <div key={index} className="border rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                          <h4 className="font-semibold">{insight.title}</h4>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline">{insight.category}</Badge>
                                            <Badge variant="outline" className={getImpactColor(insight.impact)}>
                                              {insight.impact} Impact
                                            </Badge>
                                          </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          {insight.description}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Recommendations Section */}
                                {section.type === 'recommendations' && (
                                  <div className="space-y-4">
                                    {section.content.recommendations.map((rec: any, index: number) => (
                                      <div key={index} className="border rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-3">
                                          <h4 className="font-semibold">{rec.title}</h4>
                                          <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                                            {rec.priority} Priority
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">
                                          {rec.description}
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                          <div>
                                            <span className="font-medium">Expected Impact:</span>
                                            <div className="text-muted-foreground">{rec.expectedImpact}</div>
                                          </div>
                                          <div>
                                            <span className="font-medium">Timeline:</span>
                                            <div className="text-muted-foreground">{rec.timeline}</div>
                                          </div>
                                          <div>
                                            <span className="font-medium">Owner:</span>
                                            <div className="text-muted-foreground">{rec.owner}</div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            )}
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="metadata" className="p-6 mt-0">
                  <Card className="card-enhanced">
                    <CardHeader>
                      <CardTitle>Report Metadata</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="font-medium">Report ID</label>
                            <div className="text-sm text-muted-foreground font-mono">{report.id}</div>
                          </div>
                          <div>
                            <label className="font-medium">Report Name</label>
                            <div className="text-sm text-muted-foreground">{report.name}</div>
                          </div>
                          <div>
                            <label className="font-medium">Report Type</label>
                            <div className="text-sm text-muted-foreground">
                              {report.type.replace('_', ' ').toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <label className="font-medium">Generated By</label>
                            <div className="text-sm text-muted-foreground">{report.generatedBy}</div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="font-medium">Generated At</label>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(report.generatedAt)}
                            </div>
                          </div>
                          <div>
                            <label className="font-medium">File Size</label>
                            <div className="text-sm text-muted-foreground">{report.fileSize}</div>
                          </div>
                          <div>
                            <label className="font-medium">Status</label>
                            <div>
                              <Badge variant="outline" className={getStatusColor(report.status)}>
                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <label className="font-medium">Workspace ID</label>
                            <div className="text-sm text-muted-foreground font-mono">
                              {report.workspaceId}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="filters" className="p-6 mt-0">
                  <Card className="card-enhanced">
                    <CardHeader>
                      <CardTitle>Applied Filters</CardTitle>
                      <CardDescription>
                        Filters that were applied when generating this report
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {report.filters ? (
                        <div className="space-y-4">
                          <div>
                            <label className="font-medium">Date Range</label>
                            <div className="text-sm text-muted-foreground">
                              {new Date(report.filters.dateRange.start).toLocaleDateString()} - {new Date(report.filters.dateRange.end).toLocaleDateString()}
                            </div>
                          </div>
                          {report.filters.workspaces && (
                            <div>
                              <label className="font-medium">Workspaces</label>
                              <div className="text-sm text-muted-foreground">
                                {report.filters.workspaces.length} workspace(s) selected
                              </div>
                            </div>
                          )}
                          {report.filters.departments && (
                            <div>
                              <label className="font-medium">Departments</label>
                              <div className="text-sm text-muted-foreground">
                                {report.filters.departments.length} department(s) selected
                              </div>
                            </div>
                          )}
                          {report.filters.currency && (
                            <div>
                              <label className="font-medium">Currency</label>
                              <div className="text-sm text-muted-foreground">
                                {report.filters.currency}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No filter information available.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </Card>
    </div>
  );
}