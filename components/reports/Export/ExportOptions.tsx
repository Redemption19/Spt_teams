import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileSpreadsheet, 
  FileText, 
  File,
  Settings,
  SortAsc,
  SortDesc,
  Info,
  Download
} from 'lucide-react';

interface ReportExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeComments: boolean;
  includeAttachments: boolean;
  includeFieldLabels: boolean;
  includeTemplateInfo: boolean;
  includeApprovalWorkflow: boolean;
  groupByTemplate: boolean;
  groupByDepartment: boolean;
  sortBy: 'submittedAt' | 'updatedAt' | 'title' | 'status' | 'department';
  sortDirection: 'asc' | 'desc';
  customFields: string[];
  fileName?: string;
}

interface ExportOptionsProps {
  options: ReportExportOptions;
  onOptionsChange: (options: Partial<ReportExportOptions>) => void;
  previewData?: any;
}

export function ExportOptions({
  options,
  onOptionsChange,
  previewData,
}: ExportOptionsProps) {
  const formatOptions = [
    {
      value: 'excel',
      label: 'Excel (.xlsx)',
      icon: FileSpreadsheet,
      description: 'Spreadsheet format with multiple sheets and formatting',
      benefits: ['Best for data analysis', 'Supports multiple sheets', 'Formula support']
    },
    {
      value: 'csv',
      label: 'CSV (.csv)',
      icon: FileText,
      description: 'Comma-separated values for maximum compatibility',
      benefits: ['Universal compatibility', 'Smallest file size', 'Easy to import']
    },
    {
      value: 'pdf',
      label: 'PDF (.pdf)',
      icon: File,
      description: 'Formatted document for viewing and printing',
      benefits: ['Professional presentation', 'Preserves formatting', 'Print-ready']
    }
  ];

  const sortOptions = [
    { value: 'submittedAt', label: 'Submission Date' },
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'title', label: 'Report Title' },
    { value: 'status', label: 'Status' },
    { value: 'department', label: 'Department' }
  ];

  const handleFormatChange = (format: string) => {
    onOptionsChange({ format: format as any });
    
    // Auto-adjust options based on format
    if (format === 'csv') {
      onOptionsChange({
        format: format as any,
        groupByTemplate: false,
        groupByDepartment: false
      });
    }
  };

  const generateFileName = () => {
    const date = new Date().toISOString().split('T')[0];
    const status = options.groupByTemplate ? 'by-template' : 
                  options.groupByDepartment ? 'by-department' : 'all';
    return `reports-export-${status}-${date}`;
  };

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Format
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formatOptions.map((format) => {
              const Icon = format.icon;
              const isSelected = options.format === format.value;
              
              return (
                <div
                  key={format.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                    isSelected 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => handleFormatChange(format.value)}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-6 w-6 mt-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="space-y-2 flex-1">
                      <div className="font-medium">{format.label}</div>
                      <p className="text-sm text-muted-foreground">{format.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {format.benefits.map((benefit, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {options.format === 'csv' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                CSV format has limitations: grouping and advanced formatting are not available.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Content Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Content Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Content */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Basic Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeFieldLabels"
                  checked={options.includeFieldLabels}
                  onCheckedChange={(checked) => onOptionsChange({ includeFieldLabels: checked })}
                />
                <Label htmlFor="includeFieldLabels" className="text-sm">
                  Include field labels
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeTemplateInfo"
                  checked={options.includeTemplateInfo}
                  onCheckedChange={(checked) => onOptionsChange({ includeTemplateInfo: checked })}
                />
                <Label htmlFor="includeTemplateInfo" className="text-sm">
                  Include template information
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Content */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Additional Content</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeComments"
                  checked={options.includeComments}
                  onCheckedChange={(checked) => onOptionsChange({ includeComments: checked })}
                />
                <Label htmlFor="includeComments" className="text-sm">
                  Include comments and reviews
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeAttachments"
                  checked={options.includeAttachments}
                  onCheckedChange={(checked) => onOptionsChange({ includeAttachments: checked })}
                />
                <Label htmlFor="includeAttachments" className="text-sm">
                  Include attachment information
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeApprovalWorkflow"
                  checked={options.includeApprovalWorkflow}
                  onCheckedChange={(checked) => onOptionsChange({ includeApprovalWorkflow: checked })}
                />
                <Label htmlFor="includeApprovalWorkflow" className="text-sm">
                  Include approval workflow
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Organization Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Organization Options</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="groupByTemplate"
                  checked={options.groupByTemplate}
                  onCheckedChange={(checked) => onOptionsChange({ 
                    groupByTemplate: checked,
                    groupByDepartment: checked ? false : options.groupByDepartment
                  })}
                  disabled={options.format === 'csv'}
                />
                <Label htmlFor="groupByTemplate" className="text-sm">
                  Group by template
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="groupByDepartment"
                  checked={options.groupByDepartment}
                  onCheckedChange={(checked) => onOptionsChange({ 
                    groupByDepartment: checked,
                    groupByTemplate: checked ? false : options.groupByTemplate
                  })}
                  disabled={options.format === 'csv'}
                />
                <Label htmlFor="groupByDepartment" className="text-sm">
                  Group by department
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sorting Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {options.sortDirection === 'asc' ? <SortAsc className="h-5 w-5" /> : <SortDesc className="h-5 w-5" />}
            Sorting Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sort by</Label>
              <Select value={options.sortBy} onValueChange={(value) => onOptionsChange({ sortBy: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sort field" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sort direction</Label>
              <Select value={options.sortDirection} onValueChange={(value) => onOptionsChange({ sortDirection: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest first</SelectItem>
                  <SelectItem value="asc">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            File Name
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fileName" className="text-sm font-medium">
              Custom file name (optional)
            </Label>
            <Input
              id="fileName"
              placeholder={generateFileName()}
              value={options.fileName || ''}
              onChange={(e) => onOptionsChange({ fileName: e.target.value })}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use auto-generated name. Extension will be added automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export Summary */}
      {previewData && (
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Info className="h-5 w-5" />
              Export Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Records</div>
                <div className="text-xl font-bold">{previewData.totalRecords}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Format</div>
                <div className="text-xl font-bold uppercase">{options.format}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Est. Size</div>
                <div className="text-xl font-bold">{previewData.estimatedFileSize}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Est. Time</div>
                <div className="text-xl font-bold">{previewData.estimatedProcessingTime}</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {options.includeComments && (
                <Badge variant="secondary">+ Comments</Badge>
              )}
              {options.includeAttachments && (
                <Badge variant="secondary">+ Attachments</Badge>
              )}
              {options.includeApprovalWorkflow && (
                <Badge variant="secondary">+ Approval Workflow</Badge>
              )}
              {options.groupByTemplate && (
                <Badge variant="secondary">Grouped by Template</Badge>
              )}
              {options.groupByDepartment && (
                <Badge variant="secondary">Grouped by Department</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 