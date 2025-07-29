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
  Loader2
} from 'lucide-react';
import { ReportTemplate } from '@/lib/financial-reports-service';
import { useCurrency } from '@/hooks/use-currency';

interface ReportPreviewProps {
  template: ReportTemplate;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
  workspaceIds: string[];
  filters: {
    dateRange: { start: Date; end: Date };
    departments?: string[];
    currency?: string;
  };
}

interface PreviewData {
  summary: {
    totalRecords: number;
    dateRange: string;
    workspaces: number;
    estimatedSize: string;
  };
  sampleData: {
    chartData: any[];
    tableData: any[];
    metrics: any[];
  };
  structure: {
    sections: string[];
    pages: number;
    charts: number;
    tables: number;
  };
}

export function ReportPreview({ 
  template, 
  isOpen, 
  onClose, 
  onGenerate, 
  workspaceIds, 
  filters 
}: ReportPreviewProps) {
  const { formatAmount, defaultCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const generateChartData = useCallback(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      amount: Math.floor(Math.random() * 50000) + 10000,
      budget: Math.floor(Math.random() * 60000) + 15000
    }));
  }, []);

  const generateTableData = useCallback(() => {
    const categories = ['Office Supplies', 'Travel', 'Software', 'Marketing', 'Equipment'];
    return categories.map(category => ({
      category,
      amount: Math.floor(Math.random() * 25000) + 5000,
      count: Math.floor(Math.random() * 50) + 10,
      percentage: Math.floor(Math.random() * 30) + 5
    }));
  }, []);

  const generateMetrics = useCallback(() => {
    return [
      {
        title: 'Total Amount',
        value: formatAmount(Math.floor(Math.random() * 100000) + 50000),
        change: '+12.5%',
        trend: 'up'
      },
      {
        title: 'Average Transaction',
        value: formatAmount(Math.floor(Math.random() * 5000) + 1000),
        change: '-3.2%',
        trend: 'down'
      },
      {
        title: 'Transaction Count',
        value: Math.floor(Math.random() * 500) + 200,
        change: '+8.7%',
        trend: 'up'
      },
      {
        title: 'Budget Utilization',
        value: `${Math.floor(Math.random() * 30) + 70}%`,
        change: '+2.1%',
        trend: 'up'
      }
    ];
  }, [formatAmount]);

  const getReportStructure = useCallback((templateType: string) => {
    const structures = {
      'expense_analysis': {
        sections: ['Executive Summary', 'Expense Overview', 'Category Analysis', 'Trend Analysis', 'Recommendations'],
        pages: 8,
        charts: 6,
        tables: 4
      },
      'budget_analysis': {
        sections: ['Budget Summary', 'Variance Analysis', 'Department Breakdown', 'Cost Center Performance', 'Forecasting'],
        pages: 10,
        charts: 8,
        tables: 5
      },
      'cost_center_analysis': {
        sections: ['Cost Center Overview', 'Performance Metrics', 'Allocation Analysis', 'Efficiency Trends', 'Optimization'],
        pages: 12,
        charts: 10,
        tables: 6
      }
    };
    return structures[templateType as keyof typeof structures] || structures['expense_analysis'];
  }, []);

  const generateMockPreviewData = useCallback((): PreviewData => {
    const dateRange = `${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`;
    
    return {
      summary: {
        totalRecords: Math.floor(Math.random() * 500) + 100,
        dateRange,
        workspaces: workspaceIds.length,
        estimatedSize: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)}MB`
      },
      sampleData: {
        chartData: generateChartData(),
        tableData: generateTableData(),
        metrics: generateMetrics()
      },
      structure: getReportStructure(template.type)
    };
  }, [filters.dateRange.start, filters.dateRange.end, workspaceIds.length, template.type, generateChartData, generateTableData, generateMetrics, getReportStructure]);

  const loadPreviewData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate loading preview data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockData = generateMockPreviewData();
      setPreviewData(mockData);
    } catch (error) {
      console.error('Error loading preview data:', error);
    } finally {
      setLoading(false);
    }
  }, [generateMockPreviewData]);

  useEffect(() => {
    if (isOpen) {
      loadPreviewData();
    }
  }, [isOpen, template.id, loadPreviewData]);



  const getTemplateIcon = () => {
    const icons = {
      'budget_analysis': BarChart3,
      'expense_analysis': TrendingUp,
      'cost_center_analysis': Building,
      'profit_loss': FileText,
      'cash_flow': DollarSign,
      'invoice_aging': Clock
    };
    const IconComponent = icons[template.type] || FileText;
    return <IconComponent className="w-5 h-5 text-primary" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] bg-background border shadow-2xl">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getTemplateIcon()}
              <div>
                <CardTitle className="text-xl">{template.name} - Preview</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-1">
                  <span>{template.category}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {template.estimatedTime}
                  </span>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={onGenerate}
                className="bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <div>
                  <h3 className="font-medium">Loading Preview</h3>
                  <p className="text-sm text-muted-foreground">Analyzing data structure...</p>
                </div>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-4 m-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="structure">Structure</TabsTrigger>
                <TabsTrigger value="sample">Sample Data</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[60vh]">
                <div className="p-4 pt-0">
                  <TabsContent value="overview" className="mt-0 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="stats-card">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">Records</span>
                          </div>
                          <div className="text-2xl font-bold mt-1">
                            {(previewData?.summary.totalRecords ?? 0).toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="stats-card">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">Workspaces</span>
                          </div>
                          <div className="text-2xl font-bold mt-1">
                            {previewData?.summary.workspaces}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="stats-card">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium">Period</span>
                          </div>
                          <div className="text-sm font-medium mt-1">
                            {previewData?.summary.dateRange}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="stats-card">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Download className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium">Est. Size</span>
                          </div>
                          <div className="text-2xl font-bold mt-1">
                            {previewData?.summary.estimatedSize}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Key Metrics Preview */}
                    <Card className="card-enhanced">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary" />
                          Key Metrics Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {previewData?.sampleData.metrics.map((metric, index) => (
                            <div key={index} className="text-center p-4 rounded-lg bg-muted/30">
                              <div className="flex items-center justify-center mb-2">
                                {metric.trend === 'up' ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                              <div className="font-medium text-sm text-muted-foreground">
                                {metric.title}
                              </div>
                              <div className="text-xl font-bold">
                                {metric.value}
                              </div>
                              <div className={`text-xs ${
                                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {metric.change}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Report Description */}
                    <Card className="card-enhanced">
                      <CardHeader>
                        <CardTitle>What&apos;s Included</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-muted-foreground">
                            {template.description}
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Data Points:</h4>
                              <div className="space-y-1">
                                {template.dataPoints.map((point, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                    {point}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Analysis Features:</h4>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="w-3 h-3" />
                                  Interactive Charts & Graphs
                                </div>
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-3 h-3" />
                                  Trend Analysis
                                </div>
                                <div className="flex items-center gap-2">
                                  <Target className="w-3 h-3" />
                                  Key Performance Indicators
                                </div>
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-3 h-3" />
                                  Actionable Insights
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="structure" className="mt-0 space-y-6">
                    <Card className="card-enhanced">
                      <CardHeader>
                        <CardTitle>Report Structure</CardTitle>
                        <CardDescription>
                          Overview of sections and content organization
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="text-center p-4 rounded-lg bg-blue-50">
                            <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <div className="font-bold text-2xl text-blue-600">
                              {previewData?.structure.pages}
                            </div>
                            <div className="text-sm text-blue-600">Pages</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-green-50">
                            <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <div className="font-bold text-2xl text-green-600">
                              {previewData?.structure.charts}
                            </div>
                            <div className="text-sm text-green-600">Charts</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-purple-50">
                            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <div className="font-bold text-2xl text-purple-600">
                              {previewData?.structure.tables}
                            </div>
                            <div className="text-sm text-purple-600">Tables</div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">Report Sections:</h4>
                          <div className="space-y-2">
                            {previewData?.structure.sections.map((section, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                  {index + 1}
                                </div>
                                <span className="font-medium">{section}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="sample" className="mt-0 space-y-6">
                    {/* Sample Chart */}
                    <Card className="card-enhanced">
                      <CardHeader>
                        <CardTitle>Sample Chart Data</CardTitle>
                        <CardDescription>
                          Preview of chart visualizations in your report
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-6 gap-2 text-xs text-muted-foreground">
                            {previewData?.sampleData.chartData.map((data, index) => (
                              <div key={index} className="text-center">
                                <div className="font-medium">{data.month}</div>
                                <div className="h-20 flex items-end justify-center mt-2">
                                  <div 
                                    className="w-6 bg-primary/70 rounded-t" 
                                    style={{ height: `${(data.amount / 60000) * 80}px` }}
                                  ></div>
                                </div>
                                <div className="mt-1">{formatAmount(data.amount)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sample Table */}
                    <Card className="card-enhanced">
                      <CardHeader>
                        <CardTitle>Sample Table Data</CardTitle>
                        <CardDescription>
                          Preview of tabular data in your report
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Category</th>
                                <th className="text-right p-2">Amount</th>
                                <th className="text-right p-2">Count</th>
                                <th className="text-right p-2">%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData?.sampleData.tableData.map((row, index) => (
                                <tr key={index} className="border-b">
                                  <td className="p-2 font-medium">{row.category}</td>
                                  <td className="p-2 text-right">{formatAmount(row.amount)}</td>
                                  <td className="p-2 text-right">{row.count}</td>
                                  <td className="p-2 text-right">{row.percentage}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="settings" className="mt-0 space-y-6">
                    <Card className="card-enhanced">
                      <CardHeader>
                        <CardTitle>Current Settings</CardTitle>
                        <CardDescription>
                          Review your report configuration
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Date Range</label>
                              <div className="text-sm text-muted-foreground mt-1">
                                {filters.dateRange.start.toLocaleDateString()} - {filters.dateRange.end.toLocaleDateString()}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Workspaces</label>
                              <div className="text-sm text-muted-foreground mt-1">
                                {workspaceIds.length} workspace{workspaceIds.length !== 1 ? 's' : ''} selected
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Currency</label>
                              <div className="text-sm text-muted-foreground mt-1">
                                {defaultCurrency?.symbol} {defaultCurrency?.code} - {defaultCurrency?.name}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Estimated Generation Time</label>
                              <div className="text-sm text-muted-foreground mt-1">
                                {template.estimatedTime}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Template Category</label>
                              <div className="text-sm text-muted-foreground mt-1">
                                {template.category}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Output Format</label>
                              <div className="text-sm text-muted-foreground mt-1">
                                PDF (Default)
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}