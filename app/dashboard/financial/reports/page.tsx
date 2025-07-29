'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { 
  FinancialReportsService, 
  ReportTemplate,
  GeneratedReport,
  QuickInsight,
  ReportGenerationOptions
} from '@/lib/financial-reports-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { DepartmentService } from '@/lib/department-service';
import { ReportTemplates, QuickReportTemplates } from '@/components/financial/ReportTemplates';
import { ReportHistory } from '@/components/financial/ReportHistory';
import { FinancialReportsLoadingSkeleton, ReportTemplatesLoadingSkeleton, ReportHistoryLoadingSkeleton } from '@/components/financial/FinancialReportsLoadingSkeleton';
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
  Settings,
  AlertTriangle,
  Building
} from 'lucide-react';
import type { Department } from '@/components/financial/types';



export default function FinancialReportsPage() {
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { formatAmount, defaultCurrency } = useCurrency();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data state
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [reportHistory, setReportHistory] = useState<GeneratedReport[]>([]);
  const [quickInsights, setQuickInsights] = useState<QuickInsight[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [accessibleWorkspaces, setAccessibleWorkspaces] = useState<string[]>([]);
  
  // Filter state
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency?.code || 'GHS');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load accessible workspaces
  const loadAccessibleWorkspaces = useCallback(async () => {
    if (!userProfile?.id) return [];
    
    try {
      const { mainWorkspaces, subWorkspaces } = await WorkspaceService.getUserAccessibleWorkspaces(userProfile.id);
      const workspaceIds = [
        ...mainWorkspaces.map(ws => ws.id),
        ...Object.values(subWorkspaces).flat().map(ws => ws.id)
      ];
      setAccessibleWorkspaces(workspaceIds);
      return workspaceIds;
    } catch (error) {
      console.error('Error loading accessible workspaces:', error);
      return currentWorkspace?.id ? [currentWorkspace.id] : [];
    }
  }, [userProfile?.id, currentWorkspace?.id]);

  // Load all data
  const loadData = useCallback(async (forceRefresh = false) => {
    if (!currentWorkspace?.id || !userProfile?.id) return;
    
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Load accessible workspaces first
      const workspaceIds = await loadAccessibleWorkspaces();
      
      if (workspaceIds.length === 0) {
        setError('No accessible workspaces found.');
        return;
      }

      // Load templates first (not workspace dependent)
      const templates = await FinancialReportsService.getReportTemplates();
      setReportTemplates(templates);

      // Load workspace-dependent data in parallel
      const [history, insights, depts] = await Promise.all([
        FinancialReportsService.getReportHistory(workspaceIds),
        FinancialReportsService.getQuickInsights(workspaceIds, selectedPeriod),
        DepartmentService.getWorkspaceDepartments(currentWorkspace.id)
      ]);

      setReportHistory(history);
      setQuickInsights(insights);
      setDepartments(depts);
      
    } catch (err) {
      console.error('Error loading financial reports data:', err);
      setError('Failed to load reports data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load reports data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentWorkspace?.id, userProfile?.id, selectedPeriod, loadAccessibleWorkspaces, toast]);

  // Update selected currency when default currency loads
  useEffect(() => {
    if (defaultCurrency?.code && selectedCurrency !== defaultCurrency.code) {
      setSelectedCurrency(defaultCurrency.code);
    }
  }, [defaultCurrency?.code, selectedCurrency]);

  // Load templates immediately when component mounts (they don't require workspace)
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templates = await FinancialReportsService.getReportTemplates();
        setReportTemplates(templates);
      } catch (error) {
        console.error('Error loading report templates:', error);
        // This should not happen due to fallbacks in the service, but just in case
      }
    };
    
    loadTemplates();
  }, []);

  // Refresh data when period changes
  useEffect(() => {
    if (currentWorkspace?.id && userProfile?.id) {
      loadData();
    }
  }, [currentWorkspace?.id, userProfile?.id, selectedPeriod, loadData]);

  // Generate report
  const handleGenerateReport = useCallback(async (templateId: string) => {
    if (!userProfile?.id || accessibleWorkspaces.length === 0) {
      toast({
        title: 'Error',
        description: 'Unable to generate report. Please try again.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Build filters from current selections
      const filters = {
        dateRange: getDateRangeFromPeriod(selectedPeriod),
        workspaces: accessibleWorkspaces,
        departments: selectedDepartment !== 'all' ? [selectedDepartment] : undefined,
        currency: selectedCurrency
      };

      const options: ReportGenerationOptions = {
        format: selectedFormat,
        includeCharts: true,
        includeSummary: true,
        includeDetails: true
      };

      const report = await FinancialReportsService.generateReport(
        templateId,
        accessibleWorkspaces,
        filters,
        options,
        userProfile.id
      );

      // Refresh report history to show the new report
      const updatedHistory = await FinancialReportsService.getReportHistory(accessibleWorkspaces);
      setReportHistory(updatedHistory);

      toast({
        title: 'Report Generated',
        description: `${report.name} has been generated successfully.`
      });

      // Switch to history tab to show the generated report
      setActiveTab('history');
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [userProfile?.id, accessibleWorkspaces, selectedPeriod, selectedDepartment, selectedCurrency, selectedFormat, toast]);

  // Preview report (placeholder)
  const handlePreviewReport = useCallback((templateId: string) => {
    toast({
      title: 'Preview',
      description: 'Report preview will be available soon.'
    });
  }, [toast]);

  // View report
  const handleViewReport = useCallback((reportId: string) => {
    // Navigation is handled by ReportHistory component
  }, []);

  // Download report
  const handleDownloadReport = useCallback((reportId: string) => {
    toast({
      title: 'Download',
      description: 'Report download will be available soon.'
    });
  }, [toast]);

  // Delete report
  const handleDeleteReport = useCallback(async (reportId: string) => {
    try {
      // TODO: Implement actual deletion
      setReportHistory(prev => prev.filter(report => report.id !== reportId));
      
      toast({
        title: 'Report Deleted',
        description: 'Report has been deleted successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete report.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Share report
  const handleShareReport = useCallback((reportId: string) => {
    toast({
      title: 'Share Report',
      description: 'Report sharing will be available soon.'
    });
  }, [toast]);

  // Refresh all data
  const handleRefreshData = useCallback(() => {
    loadData(true);
  }, [loadData]);

  // Helper function to get date range from period
  const getDateRangeFromPeriod = (period: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'current-month':
        start.setDate(1);
        break;
      case 'last-month':
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        now.setDate(0); // Last day of previous month
        break;
      case 'current-quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        start.setMonth(quarterStart);
        start.setDate(1);
        break;
      case 'last-quarter':
        start.setMonth(start.getMonth() - 3);
        start.setDate(1);
        break;
      case 'current-year':
        start.setMonth(0);
        start.setDate(1);
        break;
      case 'last-year':
        start.setFullYear(start.getFullYear() - 1);
        start.setMonth(0);
        start.setDate(1);
        now.setFullYear(now.getFullYear() - 1);
        now.setMonth(11);
        now.setDate(31);
        break;
      default:
        start.setDate(1);
    }
    
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  };

  // Quick insights with proper icon mapping
  const insightsWithIcons = useMemo(() => {
    const iconMap: { [key: string]: any } = {
      'TrendingUp': TrendingUp,
      'DollarSign': DollarSign,
      'FileText': FileText,
      'BarChart3': BarChart3
    };

    return quickInsights.map(insight => ({
      ...insight,
      IconComponent: iconMap[insight.icon || 'TrendingUp'] || TrendingUp
    }));
  }, [quickInsights]);

  // Show loading state
  if (loading) {
    return <FinancialReportsLoadingSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
            <p className="text-muted-foreground">
              Generate comprehensive financial reports and analytics
            </p>
          </div>
        </div>
        
        <Card className="card-enhanced">
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Reports</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => loadData(true)} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <Button 
            variant="outline" 
            onClick={handleRefreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button onClick={() => setActiveTab('templates')}>
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {insightsWithIcons.map((insight, index) => {
          const IconComponent = insight.IconComponent;
          return (
            <Card key={index} className="stats-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
                <IconComponent className={`h-4 w-4 ${insight.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insight.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={insight.color}>{insight.change}</span> {insight.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Global Filters */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
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
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder={defaultCurrency ? `${defaultCurrency.symbol} ${defaultCurrency.code}` : 'Select currency'} />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultCurrency && (
                        <SelectItem value={defaultCurrency.code}>
                          {defaultCurrency.symbol} {defaultCurrency.code} - {defaultCurrency.name} (Default)
                        </SelectItem>
                      )}
                      <SelectItem value="USD">$ USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">€ EUR - Euro</SelectItem>
                      <SelectItem value="GBP">£ GBP - British Pound</SelectItem>
                      <SelectItem value="GHS">₵ GHS - Ghana Cedi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Export Format</Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
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
          <QuickReportTemplates
            templates={reportTemplates}
            isGenerating={isGenerating}
            onGenerateReport={handleGenerateReport}
            workspaceIds={accessibleWorkspaces}
            filters={{
              dateRange: getDateRangeFromPeriod(selectedPeriod),
              departments: selectedDepartment !== 'all' ? [selectedDepartment] : undefined,
              currency: selectedCurrency
            }}
          />
        </TabsContent>

        <TabsContent value="templates">
          <ReportTemplates
            templates={reportTemplates}
            isGenerating={isGenerating}
            onGenerateReport={handleGenerateReport}
            onPreviewReport={handlePreviewReport}
            workspaceIds={accessibleWorkspaces}
            filters={{
              dateRange: getDateRangeFromPeriod(selectedPeriod),
              departments: selectedDepartment !== 'all' ? [selectedDepartment] : undefined,
              currency: selectedCurrency
            }}
          />
        </TabsContent>

        <TabsContent value="history">
          <ReportHistory
            reports={reportHistory}
            loading={false}
            onViewReport={handleViewReport}
            onDownloadReport={handleDownloadReport}
            onDeleteReport={handleDeleteReport}
            onShareReport={handleShareReport}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Financial Analytics
              </CardTitle>
              <CardDescription>
                Advanced financial analytics and trend analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 space-y-6">
                <div className="flex justify-center gap-6">
                  <div className="p-4 rounded-full bg-blue-100">
                    <LineChart className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="p-4 rounded-full bg-green-100">
                    <BarChart3 className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="p-4 rounded-full bg-purple-100">
                    <PieChart className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-semibold mb-3">Advanced Analytics Coming Soon</h3>
                  <p className="text-muted-foreground mb-6">
                    Interactive charts, trend analysis, and advanced financial analytics will be available here. 
                    Get real-time insights into your financial performance.
                  </p>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Features in development:</div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Badge variant="outline">Interactive Charts</Badge>
                      <Badge variant="outline">Trend Analysis</Badge>
                      <Badge variant="outline">Forecasting</Badge>
                      <Badge variant="outline">Benchmarking</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="bg-primary/5 hover:bg-primary/10">
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
