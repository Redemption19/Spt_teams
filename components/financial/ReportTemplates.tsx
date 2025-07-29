'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Download, 
  RefreshCw,
  Clock,
  BarChart3,
  FileText,
  TrendingUp,
  Building,
  CreditCard,
  PieChart
} from 'lucide-react';
import { ReportTemplate } from '@/lib/financial-reports-service';
import { ReportPreview } from './ReportPreview';

interface ReportTemplatesProps {
  templates: ReportTemplate[];
  isGenerating: boolean;
  onGenerateReport: (templateId: string) => Promise<void>;
  onPreviewReport: (templateId: string) => void;
  workspaceIds?: string[];
  filters?: {
    dateRange: { start: Date; end: Date };
    departments?: string[];
    currency?: string;
  };
}

const templateIcons: { [key: string]: any } = {
  'budget_analysis': BarChart3,
  'expense_analysis': TrendingUp,
  'cost_center_analysis': Building,
  'profit_loss': FileText,
  'cash_flow': CreditCard,
  'invoice_aging': PieChart
};

const categoryColors: { [key: string]: string } = {
  'Budget Management': 'bg-blue-100 text-blue-800 border-blue-300',
  'Expense Management': 'bg-green-100 text-green-800 border-green-300',
  'Cost Management': 'bg-purple-100 text-purple-800 border-purple-300',
  'Financial Statements': 'bg-orange-100 text-orange-800 border-orange-300',
  'Accounts Receivable': 'bg-cyan-100 text-cyan-800 border-cyan-300'
};

export function ReportTemplates({ 
  templates, 
  isGenerating, 
  onGenerateReport, 
  onPreviewReport,
  workspaceIds = [],
  filters
}: ReportTemplatesProps) {
  const [generatingTemplate, setGeneratingTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ReportTemplate | null>(null);

  const handleGenerateReport = async (templateId: string) => {
    setGeneratingTemplate(templateId);
    try {
      await onGenerateReport(templateId);
    } finally {
      setGeneratingTemplate(null);
    }
  };

  const getTemplateIcon = (templateId: string) => {
    const IconComponent = templateIcons[templateId] || FileText;
    return <IconComponent className="w-5 h-5 text-primary" />;
  };

  const getCategoryBadgeClass = (category: string) => {
    return categoryColors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const handlePreviewReport = (template: ReportTemplate) => {
    setPreviewTemplate(template);
    onPreviewReport(template.id);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  const handleGenerateFromPreview = () => {
    if (previewTemplate) {
      handleGenerateReport(previewTemplate.id);
      setPreviewTemplate(null);
    }
  };

  // Default filters if not provided
  const defaultFilters = filters || {
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date()
    },
    currency: 'GHS'
  };

  return (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Report Templates
        </CardTitle>
        <CardDescription>
          Choose from predefined report templates or create custom reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => {
            const isCurrentlyGenerating = generatingTemplate === template.id || 
              (isGenerating && generatingTemplate === null);
            
            return (
              <div 
                key={template.id} 
                className="border rounded-xl p-6 space-y-4 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-background to-muted/20"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      {getTemplateIcon(template.id)}
                      <h3 className="font-semibold text-lg leading-tight">{template.name}</h3>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getCategoryBadgeClass(template.category)}
                    >
                      {template.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="whitespace-nowrap">{template.estimatedTime}</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {template.description}
                </p>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Includes:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {template.dataPoints.map((point, index) => (
                      <div key={index} className="text-xs text-muted-foreground flex items-center">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2 flex-shrink-0"></div>
                        <span className="truncate">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-3 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 hover:bg-muted"
                    onClick={() => handlePreviewReport(template)}
                    disabled={isCurrentlyGenerating}
                  >
                    <Eye className="w-3 h-3 mr-2" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => handleGenerateReport(template.id)}
                    disabled={isCurrentlyGenerating}
                  >
                    {isCurrentlyGenerating ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Templates Available</h3>
            <p className="text-muted-foreground">
              Report templates will appear here once they are configured.
            </p>
          </div>
        )}
      </CardContent>

      {/* Report Preview Modal */}
      {previewTemplate && (
        <ReportPreview
          template={previewTemplate}
          isOpen={!!previewTemplate}
          onClose={handleClosePreview}
          onGenerate={handleGenerateFromPreview}
          workspaceIds={workspaceIds}
          filters={defaultFilters}
        />
      )}
    </Card>
  );
}

export function QuickReportTemplates({ 
  templates, 
  isGenerating, 
  onGenerateReport,
  workspaceIds = [],
  filters
}: Omit<ReportTemplatesProps, 'onPreviewReport'> & {
  workspaceIds?: string[];
  filters?: { dateRange: { start: Date; end: Date }; departments?: string[]; currency?: string; };
}) {
  const [generatingTemplate, setGeneratingTemplate] = useState<string | null>(null);

  const handleGenerateReport = async (templateId: string) => {
    setGeneratingTemplate(templateId);
    try {
      await onGenerateReport(templateId);
    } finally {
      setGeneratingTemplate(null);
    }
  };

  const getTemplateIcon = (templateId: string) => {
    const IconComponent = templateIcons[templateId] || FileText;
    return <IconComponent className="w-4 h-4 text-primary" />;
  };

  const getCategoryBadgeClass = (category: string) => {
    return categoryColors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Show only first 4 templates for quick access
  const quickTemplates = templates.slice(0, 4);

  return (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Most Used Reports
        </CardTitle>
        <CardDescription>
          Quick access to your frequently generated reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickTemplates.map((template) => {
            const isCurrentlyGenerating = generatingTemplate === template.id || 
              (isGenerating && generatingTemplate === null);
            
            return (
              <div key={template.id} className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getTemplateIcon(template.id)}
                      <h3 className="font-medium">{template.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${getCategoryBadgeClass(template.category)} text-xs ml-2 flex-shrink-0`}
                  >
                    {template.category}
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{template.estimatedTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>{template.dataPoints.length} data points</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => handleGenerateReport(template.id)}
                  disabled={isCurrentlyGenerating}
                >
                  {isCurrentlyGenerating ? (
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
            );
          })}
        </div>

        {quickTemplates.length === 0 && (
          <div className="text-center py-8">
            <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">No Templates Available</h3>
            <p className="text-sm text-muted-foreground">
              Report templates will appear here once they are configured.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 