'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CalendarIcon,
  Upload,
  FileText,
  Type,
  AlignLeft,
  Hash,
  ChevronDown,
  CheckSquare,
  Info,
  Star,
  Clock,
  User,
  Building
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ReportTemplate, ReportTemplateField } from '@/lib/types';

interface TemplatePreviewProps {
  template: ReportTemplate;
  showInfo?: boolean;
  compact?: boolean;
}

export function TemplatePreview({ template, showInfo = true, compact = false }: TemplatePreviewProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [date, setDate] = useState<Date>();

  // Update form data
  const updateFormData = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Render field preview
  const renderFieldPreview = (field: ReportTemplateField) => {
    const fieldValue = formData[field.id];
    const fieldIcon = getFieldIcon(field.type);

    const baseClasses = cn(
      "space-y-2",
      field.columnSpan === 1 && "col-span-1",
      field.columnSpan === 2 && "col-span-2 md:col-span-2",
      field.columnSpan === 3 && "col-span-3"
    );

    return (
      <div key={field.id} className={baseClasses}>
        <Label htmlFor={`preview-${field.id}`} className="flex items-center gap-2">
          {fieldIcon}
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </Label>
        
        {field.helpText && (
          <p className="text-sm text-muted-foreground">{field.helpText}</p>
        )}

        {/* Render field based on type */}
        {field.type === 'text' && (
          <Input
            id={`preview-${field.id}`}
            placeholder={field.placeholder}
            value={fieldValue || ''}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            disabled={compact}
          />
        )}

        {field.type === 'textarea' && (
          <Textarea
            id={`preview-${field.id}`}
            placeholder={field.placeholder}
            value={fieldValue || ''}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            rows={3}
            disabled={compact}
          />
        )}

        {field.type === 'number' && (
          <Input
            id={`preview-${field.id}`}
            type="number"
            placeholder={field.placeholder}
            value={fieldValue || ''}
            onChange={(e) => updateFormData(field.id, Number(e.target.value))}
            min={field.validation?.min}
            max={field.validation?.max}
            disabled={compact}
          />
        )}

        {field.type === 'date' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !fieldValue && "text-muted-foreground"
                )}
                disabled={compact}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fieldValue ? format(fieldValue, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={fieldValue}
                onSelect={(date) => updateFormData(field.id, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}

        {field.type === 'dropdown' && (
          <Select 
            value={fieldValue || ''} 
            onValueChange={(value) => updateFormData(field.id, value)}
            disabled={compact}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.type === 'checkbox' && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`preview-${field.id}`}
              checked={fieldValue || false}
              onCheckedChange={(checked) => updateFormData(field.id, checked)}
              disabled={compact}
            />
            <Label 
              htmlFor={`preview-${field.id}`}
              className="text-sm font-normal cursor-pointer"
            >
              {field.placeholder || 'Check this option'}
            </Label>
          </div>
        )}

        {field.type === 'file' && (
          <div className="space-y-2">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {compact ? 'File upload field' : 'Drop files here or click to browse'}
              </p>
              {field.acceptedFileTypes && (
                <p className="text-xs text-muted-foreground mt-1">
                  Accepted types: {field.acceptedFileTypes.join(', ')}
                </p>
              )}
              {field.maxFiles && field.maxFiles > 1 && (
                <p className="text-xs text-muted-foreground">
                  Maximum {field.maxFiles} files
                </p>
              )}
              {field.maxFileSize && (
                <p className="text-xs text-muted-foreground">
                  Maximum size: {Math.round(field.maxFileSize / (1024 * 1024))}MB per file
                </p>
              )}
            </div>
            {!compact && (
              <Button variant="outline" size="sm" disabled>
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
            )}
          </div>
        )}

        {/* Validation info */}
        {field.validation && !compact && (
          <div className="text-xs text-muted-foreground">
            {field.type === 'text' || field.type === 'textarea' ? (
              <>
                {field.validation.minLength && `Min: ${field.validation.minLength} chars`}
                {field.validation.minLength && field.validation.maxLength && ' | '}
                {field.validation.maxLength && `Max: ${field.validation.maxLength} chars`}
              </>
            ) : field.type === 'number' ? (
              <>
                {field.validation.min !== undefined && `Min: ${field.validation.min}`}
                {field.validation.min !== undefined && field.validation.max !== undefined && ' | '}
                {field.validation.max !== undefined && `Max: ${field.validation.max}`}
              </>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  // Get field icon
  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'textarea':
        return <AlignLeft className="h-4 w-4" />;
      case 'number':
        return <Hash className="h-4 w-4" />;
      case 'date':
        return <CalendarIcon className="h-4 w-4" />;
      case 'dropdown':
        return <ChevronDown className="h-4 w-4" />;
      case 'checkbox':
        return <CheckSquare className="h-4 w-4" />;
      case 'file':
        return <Upload className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  // Sort fields by order
  const sortedFields = [...template.fields].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Template Information */}
      {showInfo && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {template.name}
                </CardTitle>
                {template.description && (
                  <p className="text-muted-foreground mt-1">
                    {template.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={template.status === 'active' ? 'default' : 'secondary'}
                  className={
                    template.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : template.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }
                >
                  {template.status}
                </Badge>
                {template.category && (
                  <Badge variant="outline">
                    {template.category}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created by:</span>
                <span>Template Creator</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Version:</span>
                <span>v{template.version}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Department:</span>
                <span>{template.department || 'General'}</span>
              </div>
            </div>

            {template.tags && template.tags.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">Tags</Label>
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Template Settings Summary */}
      {showInfo && !compact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Template Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">File Attachments:</span>
                <Badge variant={template.settings.allowFileAttachments ? 'default' : 'secondary'}>
                  {template.settings.allowFileAttachments ? 'Allowed' : 'Disabled'}
                </Badge>
              </div>
              
              {template.settings.allowFileAttachments && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Max Attachments:</span>
                  <span>{template.settings.maxFileAttachments}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Auto Save:</span>
                <Badge variant={template.settings.autoSave ? 'default' : 'secondary'}>
                  {template.settings.autoSave ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              
              {template.settings.autoSave && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Save Interval:</span>
                  <span>{template.settings.autoSaveInterval} min</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Requires Approval:</span>
                <Badge variant={template.settings.requiresApproval ? 'default' : 'secondary'}>
                  {template.settings.requiresApproval ? 'Yes' : 'No'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Visibility:</span>
                <Badge variant="outline">
                  {template.visibility === 'public' ? 'Public' : 'Restricted'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Form Preview</span>
            <Badge variant="outline">
              {template.fields.length} field{template.fields.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          {!compact && (
            <p className="text-sm text-muted-foreground">
              This is how the form will appear to users when they create reports using this template
            </p>
          )}
        </CardHeader>
        
        <CardContent>
          {template.fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No fields configured</p>
              <p className="text-sm">Add fields to see the form preview</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview Info Banner */}
              {!compact && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This is a live preview. You can interact with the form fields to see how they will behave for users.
                  </AlertDescription>
                </Alert>
              )}

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sortedFields.map(field => renderFieldPreview(field))}
              </div>

              {/* Form Actions Preview */}
              {!compact && (
                <div className="flex justify-between items-center pt-6 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4" />
                    <span>Required fields are marked with *</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" disabled>
                      Save Draft
                    </Button>
                    <Button disabled>
                      Submit Report
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Information */}
      {showInfo && !compact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{template.usage.totalReports}</div>
                <div className="text-sm text-muted-foreground">Total Reports</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{template.usage.drafts}</div>
                <div className="text-sm text-muted-foreground">Drafts</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{template.usage.submitted}</div>
                <div className="text-sm text-muted-foreground">Submitted</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{template.usage.approved}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 