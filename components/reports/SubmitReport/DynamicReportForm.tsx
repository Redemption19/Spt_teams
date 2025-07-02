'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  FileIcon, 
  Trash2, 
  Upload, 
  Save, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  X,
  Download,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReportTemplate, ReportTemplateField, EnhancedReport } from '@/lib/types';
import { ReportService, ReportSubmissionData } from '@/lib/report-service';
import { formatFileSize } from '@/lib/utils';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';

interface DynamicReportFormProps {
  template: ReportTemplate;
  existingReport?: EnhancedReport;
  onSaveDraft?: (report: EnhancedReport) => void;
  onSubmit?: (report: EnhancedReport) => void;
  onCancel?: () => void;
  workspaceId: string;
  userId: string;
  autoSave?: boolean;
  autoSaveInterval?: number; // minutes
}

interface FieldError {
  fieldId: string;
  message: string;
}

interface FileUpload {
  file: File;
  fieldId: string;
  id: string;
  uploadProgress?: number;
  error?: string;
}

export function DynamicReportForm({
  template,
  existingReport,
  onSaveDraft,
  onSubmit,
  onCancel,
  workspaceId,
  userId,
  autoSave = true,
  autoSaveInterval = 2 // minutes
}: DynamicReportFormProps) {
  const { toast } = useToast();
  
  // Form state
  const [title, setTitle] = useState(existingReport?.title || '');
  const [fieldData, setFieldData] = useState<Record<string, any>>(existingReport?.fieldData || {});
  const [fileUploads, setFileUploads] = useState<Record<string, FileUpload[]>>({});
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(existingReport?.updatedAt || null);
  const [isDirty, setIsDirty] = useState(false);
  const [isDragOver, setIsDragOver] = useState<string | null>(null);

  // Helper functions
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getFieldValidationState = (field: ReportTemplateField) => {
    const value = fieldData[field.id];
    const hasError = errors.some(e => e.fieldId === field.id);
    const hasValue = value !== undefined && value !== null && value !== '';
    
    if (hasError) return 'error';
    if (hasValue && field.required) return 'success';
    if (hasValue) return 'filled';
    return 'empty';
  };

  // Calculate form completion percentage
  const completionPercentage = React.useMemo(() => {
    const totalFields = template.fields.length + 1; // +1 for title
    let completedFields = title.trim() ? 1 : 0;
    
    template.fields.forEach(field => {
      const value = fieldData[field.id];
      if (field.type === 'file') {
        const uploads = fileUploads[field.id] || [];
        if (uploads.length > 0 || (value && Array.isArray(value) && value.length > 0)) {
          completedFields++;
        }
      } else if (value !== undefined && value !== null && value !== '') {
        completedFields++;
      }
    });
    
    return Math.round((completedFields / totalFields) * 100);
  }, [title, fieldData, fileUploads, template.fields]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isDirty || !existingReport) return;

    const interval = setInterval(async () => {
      if (isDirty && existingReport) {
        try {
          setIsSaving(true);
          await ReportService.autoSaveDraft(workspaceId, existingReport.id, userId, fieldData);
          setLastSaved(new Date());
          setIsDirty(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, autoSaveInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, isDirty, existingReport, workspaceId, userId, fieldData]);

  // Handle field value changes
  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setFieldData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    setIsDirty(true);
    
    // Clear field errors
    setErrors(prev => prev.filter(error => error.fieldId !== fieldId));
  }, []);

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(fieldId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(null);
    
    const files = e.dataTransfer.files;
    if (files) {
      handleFileUpload(fieldId, files);
    }
  };

  // Handle file uploads
  const handleFileUpload = useCallback((fieldId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const field = template.fields.find(f => f.id === fieldId);
    if (!field || field.type !== 'file') return;

    const newFiles: FileUpload[] = [];
    const maxFiles = field.maxFiles || 1;
    const maxFileSize = field.maxFileSize || 10 * 1024 * 1024; // 10MB default
    const acceptedTypes = field.acceptedFileTypes || [];

    // Validate files
    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > maxFileSize) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the maximum file size of ${formatFileSize(maxFileSize)}`,
          variant: 'destructive',
        });
        continue;
      }

      // Check file type
      if (acceptedTypes.length > 0) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const mimeTypeCategory = file.type.split('/')[0];
        
        const isValidType = acceptedTypes.some(type => 
          type.toLowerCase() === fileExtension ||
          type.toLowerCase() === file.type ||
          type.toLowerCase() === mimeTypeCategory
        );

        if (!isValidType) {
          toast({
            title: 'Invalid file type',
            description: `${file.name} is not an accepted file type. Accepted: ${acceptedTypes.join(', ')}`,
            variant: 'destructive',
          });
          continue;
        }
      }

      newFiles.push({
        file,
        fieldId,
        id: `${fieldId}_${Date.now()}_${i}`,
        uploadProgress: 0
      });
    }

    setFileUploads(prev => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), ...newFiles]
    }));
    setIsDirty(true);
  }, [template.fields, toast]);

  // Remove file upload
  const removeFileUpload = useCallback((fieldId: string, fileId: string) => {
    setFileUploads(prev => ({
      ...prev,
      [fieldId]: prev[fieldId]?.filter(f => f.id !== fileId) || []
    }));
    setIsDirty(true);
  }, []);

  // Validate form
  const validateForm = useCallback((): FieldError[] => {
    const newErrors: FieldError[] = [];

    // Validate title
    if (!title.trim()) {
      newErrors.push({ fieldId: 'title', message: 'Report title is required' });
    }

    // Validate template fields
    template.fields.forEach(field => {
      const value = fieldData[field.id];

      // Check required fields
      if (field.required) {
        if (field.type === 'file') {
          const files = fileUploads[field.id] || [];
          if (files.length === 0 && (!value || (Array.isArray(value) && value.length === 0))) {
            newErrors.push({ fieldId: field.id, message: `${field.label} is required` });
          }
        } else if (value === undefined || value === null || value === '') {
          newErrors.push({ fieldId: field.id, message: `${field.label} is required` });
        }
      }

      // Type-specific validation
      if (value !== undefined && value !== null && value !== '') {
        switch (field.type) {
          case 'text':
          case 'textarea':
            if (field.validation) {
              if (field.validation.minLength && value.length < field.validation.minLength) {
                newErrors.push({ 
                  fieldId: field.id, 
                  message: `${field.label} must be at least ${field.validation.minLength} characters` 
                });
              }
              if (field.validation.maxLength && value.length > field.validation.maxLength) {
                newErrors.push({ 
                  fieldId: field.id, 
                  message: `${field.label} must be no more than ${field.validation.maxLength} characters` 
                });
              }
            }
            break;
          case 'number':
            const numValue = Number(value);
            if (isNaN(numValue)) {
              newErrors.push({ fieldId: field.id, message: `${field.label} must be a valid number` });
            } else if (field.validation) {
              if (field.validation.min !== undefined && numValue < field.validation.min) {
                newErrors.push({ 
                  fieldId: field.id, 
                  message: `${field.label} must be at least ${field.validation.min}` 
                });
              }
              if (field.validation.max !== undefined && numValue > field.validation.max) {
                newErrors.push({ 
                  fieldId: field.id, 
                  message: `${field.label} must be no more than ${field.validation.max}` 
                });
              }
            }
            break;
        }
      }
    });

    return newErrors;
  }, [title, fieldData, fileUploads, template.fields]);

  // Handle save as draft
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      
      const reportData: ReportSubmissionData = {
        templateId: template.id,
        templateVersion: template.version,
        title: title.trim(),
        fieldData
      };

      // Convert file uploads to File arrays by field
      const filesByField: Record<string, File[]> = {};
      Object.entries(fileUploads).forEach(([fieldId, uploads]) => {
        filesByField[fieldId] = uploads.map(upload => upload.file);
      });

      let report: EnhancedReport;
      
      if (existingReport) {
        await ReportService.updateReport(
          workspaceId,
          existingReport.id,
          userId,
          { title: title.trim(), fieldData, status: 'draft' },
          filesByField
        );
        report = { ...existingReport, title: title.trim(), fieldData, status: 'draft' };
      } else {
        report = await ReportService.createReport(
          workspaceId,
          userId,
          reportData,
          'draft',
          filesByField
        );
      }

      setLastSaved(new Date());
      setIsDirty(false);
      
      toast({
        title: '✅ Draft Saved',
        description: 'Your report has been saved as a draft',
        className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      });

      onSaveDraft?.(report);
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle submit report
  const handleSubmit = async () => {
    const formErrors = validateForm();
    if (formErrors.length > 0) {
      setErrors(formErrors);
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const reportData: ReportSubmissionData = {
        templateId: template.id,
        templateVersion: template.version,
        title: title.trim(),
        fieldData
      };

      // Convert file uploads to File arrays by field
      const filesByField: Record<string, File[]> = {};
      Object.entries(fileUploads).forEach(([fieldId, uploads]) => {
        filesByField[fieldId] = uploads.map(upload => upload.file);
      });

      let report: EnhancedReport;
      
      if (existingReport) {
        await ReportService.updateReport(
          workspaceId,
          existingReport.id,
          userId,
          { title: title.trim(), fieldData, status: 'submitted' },
          filesByField
        );
        report = { ...existingReport, title: title.trim(), fieldData, status: 'submitted' };
      } else {
        report = await ReportService.createReport(
          workspaceId,
          userId,
          reportData,
          'submitted',
          filesByField
        );
      }

      toast({
        title: '🎉 Report Submitted',
        description: 'Your report has been submitted successfully',
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });

      onSubmit?.(report);
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-resize textarea function
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, 100) + 'px';
  };

  // Enhanced file upload field renderer
  const renderFileUploadField = (field: ReportTemplateField) => {
    const uploads = fileUploads[field.id] || [];
    const maxFiles = field.maxFiles || 1;
    const validationState = getFieldValidationState(field);
    
    return (
      <div className="space-y-4">
        {/* Enhanced Drag & Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            isDragOver === field.id
              ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg' 
              : validationState === 'error'
              ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
              : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
          }`}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, field.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, field.id)}
        >
          <div className="space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              validationState === 'error' 
                ? 'bg-red-100 dark:bg-red-900/20' 
                : 'bg-gradient-to-r from-primary/10 to-accent/10'
            }`}>
              <Upload className={`h-8 w-8 ${
                validationState === 'error' ? 'text-red-500' : 'text-primary'
              }`} />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-lg font-medium text-foreground">
                Drop files here or click to browse
              </h4>
              <p className="text-sm text-muted-foreground">
                {field.acceptedFileTypes?.length 
                  ? `Accepted: ${field.acceptedFileTypes.join(', ')}` 
                  : 'All file types accepted'
                }
              </p>
              {field.maxFileSize && (
                <p className="text-xs text-muted-foreground">
                  Maximum size: {formatFileSize(field.maxFileSize)} per file
                </p>
              )}
              {maxFiles > 1 && (
                <p className="text-xs text-muted-foreground">
                  You can upload up to {maxFiles} files
                </p>
              )}
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white transition-colors min-h-[44px] touch-manipulation"
              onClick={() => document.getElementById(`file-${field.id}`)?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
          </div>
          
          <input
            id={`file-${field.id}`}
            type="file"
            multiple={maxFiles > 1}
            accept={field.acceptedFileTypes?.join(',')}
            onChange={(e) => handleFileUpload(field.id, e.target.files)}
            className="hidden"
          />
        </div>
        
        {/* Enhanced File List */}
        {uploads.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-foreground flex items-center gap-2">
              <FileIcon className="h-4 w-4" />
              Uploaded Files ({uploads.length}/{maxFiles > 1 ? maxFiles : '1'})
            </h5>
            <div className="space-y-2">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg border border-border/50 shadow-sm"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FileIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {upload.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(upload.file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {upload.uploadProgress !== undefined && upload.uploadProgress < 100 && (
                      <div className="w-20">
                        <Progress value={upload.uploadProgress} className="h-2" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFileUpload(field.id, upload.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 min-h-[44px] min-w-[44px] touch-manipulation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Enhanced field renderer
  const renderEnhancedField = (field: ReportTemplateField) => {
    const value = fieldData[field.id] || '';
    const validationState = getFieldValidationState(field);
    const hasError = validationState === 'error';

    const fieldClassName = `transition-all duration-200 min-h-[52px] text-base ${
      hasError 
        ? 'border-red-500 bg-red-50 dark:bg-red-950/20 focus:border-red-500 focus:ring-red-500/20' 
        : validationState === 'success'
        ? 'border-green-500 bg-green-50 dark:bg-green-950/20 focus:border-green-500 focus:ring-green-500/20'
        : 'focus:border-primary focus:ring-primary/20'
    }`;

    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={fieldClassName}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => {
              handleFieldChange(field.id, e.target.value);
              // Auto-resize on change
              autoResizeTextarea(e.target);
            }}
            onInput={(e) => {
              // Auto-resize on input (for better responsiveness)
              autoResizeTextarea(e.target as HTMLTextAreaElement);
            }}
            placeholder={field.placeholder}
            className={`${fieldClassName} min-h-[100px] resize-none overflow-hidden`}
            style={{ height: 'auto' }}
            ref={(el) => {
              // Auto-resize on initial render and when value changes
              if (el && value) {
                setTimeout(() => autoResizeTextarea(el), 0);
              }
            }}
          />
        );

      case 'number':
        return (
          <Input
            id={field.id}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={fieldClassName}
          />
        );

      case 'date':
        const dateValue = value ? new Date(value) : undefined;
        return (
          <EnhancedDatePicker
            date={dateValue}
            onDateChange={(date) => {
              const dateString = date ? date.toISOString().split('T')[0] : '';
              handleFieldChange(field.id, dateString);
            }}
            placeholder={field.placeholder || 'Select date...'}
            className={fieldClassName}
            showQuickSelection={true}
            allowClear={true}
          />
        );

      case 'dropdown':
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
            <SelectTrigger className={`${fieldClassName} min-h-[52px]`}>
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-3 py-3">
            <Checkbox
              id={field.id}
              checked={!!value}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
              className={`min-h-[24px] min-w-[24px] touch-manipulation ${hasError ? 'border-red-500' : ''}`}
            />
            <Label htmlFor={field.id} className="text-base font-medium cursor-pointer">
              {field.helpText || field.label}
            </Label>
          </div>
        );

      case 'file':
        return renderFileUploadField(field);

      default:
        return <Input id={field.id} value={value} disabled placeholder="Unsupported field type" className={fieldClassName} />;
    }
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Enhanced Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 rounded-xl p-6 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-50"></div>
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-md">
                  <FileIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{template.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {template.description || `Create your ${template.name.toLowerCase()} report`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {template.category && (
                  <Badge variant="secondary" className="text-xs font-medium">
                    📁 {template.category}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  ⏱️ Auto-save enabled
                </Badge>
              </div>
            </div>
            
            {/* Enhanced Progress Section */}
            <div className="text-right space-y-3">
              <div className="text-sm font-medium text-foreground">
                Progress: {completionPercentage}%
              </div>
              <Progress 
                value={completionPercentage} 
                className="w-full sm:w-48 h-3 shadow-sm"
              />
              {autoSave && (
                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Saved {formatRelativeTime(lastSaved)}</span>
                    </>
                  ) : isDirty ? (
                    <>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span>Unsaved changes</span>
                    </>
                  ) : (
                    <span>All changes saved</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Form Layout */}
      <div className="space-y-8">
        {/* Report Title Section */}
        <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm flex items-center justify-center font-bold shadow-sm">
                1
              </div>
              Report Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                📝 Report Title
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsDirty(true);
                  // Clear title errors
                  setErrors(prev => prev.filter(error => error.fieldId !== 'title'));
                }}
                placeholder="Enter a descriptive title for your report"
                className={`transition-all duration-200 min-h-[52px] text-base ${
                  errors.some(e => e.fieldId === 'title') 
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
                    : title.trim()
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'focus:border-primary focus:ring-primary/20'
                }`}
              />
              {errors.find(e => e.fieldId === 'title') && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {errors.find(e => e.fieldId === 'title')?.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Fields with Two-Column Layout */}
        {(() => {
          const sortedFields = template.fields.sort((a, b) => a.order - b.order);
          const result = [];
          
          for (let i = 0; i < sortedFields.length; i++) {
            const field = sortedFields[i];
            const nextField = sortedFields[i + 1];
            
            // Check if current and next field can be in same row
            const canBeInSameRow = (currentField: ReportTemplateField, nextField?: ReportTemplateField) => {
              if (!nextField) return false;
              // Put short fields together (text, number, date, dropdown)
              const shortFieldTypes = ['text', 'number', 'date', 'dropdown'];
              return shortFieldTypes.includes(currentField.type) && 
                     shortFieldTypes.includes(nextField.type) &&
                     !currentField.helpText && !nextField.helpText; // Avoid if they have help text
            };

            if (canBeInSameRow(field, nextField)) {
              // Two-column layout
              result.push(
                <Card key={`${field.id}-${nextField.id}`} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm flex items-center justify-center font-bold shadow-sm">
                        {i + 2}
                      </div>
                      Form Fields
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* First Field */}
                      <div className="space-y-3">
                        <Label htmlFor={field.id} className="text-sm font-medium flex items-center gap-2">
                          {field.label}
                          {field.required && <span className="text-red-500 text-sm">*</span>}
                        </Label>
                        {field.helpText && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            💡 {field.helpText}
                          </p>
                        )}
                        {renderEnhancedField(field)}
                        {errors.find(e => e.fieldId === field.id) && (
                          <Alert variant="destructive" className="py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              {errors.find(e => e.fieldId === field.id)?.message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {/* Second Field */}
                      <div className="space-y-3">
                        <Label htmlFor={nextField.id} className="text-sm font-medium flex items-center gap-2">
                          {nextField.label}
                          {nextField.required && <span className="text-red-500 text-sm">*</span>}
                        </Label>
                        {nextField.helpText && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            💡 {nextField.helpText}
                          </p>
                        )}
                        {renderEnhancedField(nextField)}
                        {errors.find(e => e.fieldId === nextField.id) && (
                          <Alert variant="destructive" className="py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              {errors.find(e => e.fieldId === nextField.id)?.message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
              i++; // Skip next field since we already processed it
            } else {
              // Single field layout
              result.push(
                <Card key={field.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm flex items-center justify-center font-bold shadow-sm">
                        {i + 2}
                      </div>
                      <div className="flex items-center gap-2">
                        {field.label}
                        {field.required && <span className="text-red-500 text-sm">*</span>}
                      </div>
                    </CardTitle>
                    {field.helpText && (
                      <p className="text-sm text-muted-foreground mt-2 ml-11 leading-relaxed">
                        💡 {field.helpText}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {renderEnhancedField(field)}
                      {errors.find(e => e.fieldId === field.id) && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {errors.find(e => e.fieldId === field.id)?.message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            }
          }
          
          return result;
        })()}
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg z-50">
        <div className="max-w-5xl mx-auto p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
            {/* Left side - Status */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {isDirty ? (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span>Unsaved changes</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>All changes saved</span>
                </>
              ) : null}
              <div className="hidden sm:block text-xs">
                {completionPercentage}% complete
              </div>
            </div>
            
            {/* Right side - Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="min-w-[100px] min-h-[44px] touch-manipulation"
                disabled={isSubmitting || isSaving}
              >
                Cancel
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving || isSubmitting || !title.trim()}
                className="min-w-[120px] min-h-[44px] border-primary text-primary hover:bg-primary hover:text-white touch-manipulation"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || isSaving || errors.length > 0 || !title.trim()}
                className="min-w-[140px] min-h-[44px] bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md touch-manipulation"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {errors.length > 0 && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please fix {errors.length} error{errors.length > 1 ? 's' : ''} before submitting.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
} 