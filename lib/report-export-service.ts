'use client';

import { EnhancedReport, ReportTemplate, User } from './types';
import { ReportService } from './report-service';
import { ExportService } from './export-service';
import { format as formatDate } from 'date-fns';

// Export-specific types
export interface ReportExportFilters {
  status: 'all' | 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'archived';
  department: string; // 'all' or specific department ID
  template: string; // 'all' or specific template ID
  user: string; // 'all' or specific user ID
  dateRange: {
    from: Date | null;
    to: Date | null;
    preset: 'week' | 'month' | 'quarter' | 'year' | 'custom' | null;
  };
  search: string;
  includeComments: boolean;
  includeAttachments: boolean;
}

export interface ReportExportOptions {
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
  customFields: string[]; // Field IDs to include in export
  fileName?: string;
}

export interface ExportProgress {
  id: string;
  status: 'preparing' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  totalItems: number;
  processedItems: number;
  startedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
}

export interface ExportPreview {
  totalRecords: number;
  estimatedFileSize: string;
  estimatedProcessingTime: string;
  includedFields: string[];
  sampleData: any[];
  warnings: string[];
}

export class ReportExportService {
  
  /**
   * Get the correct file extension for the export format
   */
  private static getFileExtension(format: 'pdf' | 'excel' | 'csv'): string {
    switch (format) {
      case 'excel':
        return 'csv'; // ExportService creates CSV files for Excel compatibility
      case 'csv':
        return 'csv';
      case 'pdf':
        return 'pdf';
      default:
        return format;
    }
  }

  /**
   * Get filtered reports for export
   */
  static async getFilteredReports(
    workspaceId: string,
    filters: ReportExportFilters
  ): Promise<EnhancedReport[]> {
    try {
      const options: any = {};
      
      // Apply filters
      if (filters.status !== 'all') {
        options.status = filters.status;
      }
      
      if (filters.user !== 'all') {
        options.authorId = filters.user;
      }
      
      if (filters.template !== 'all') {
        options.templateId = filters.template;
      }
      
      if (filters.dateRange.from) {
        options.startDate = filters.dateRange.from;
      }
      
      if (filters.dateRange.to) {
        options.endDate = filters.dateRange.to;
      }
      
      // Get reports from ReportService
      let reports = await ReportService.getWorkspaceReports(workspaceId, {
        ...options,
        limit: 1000, // Set a reasonable limit
        orderBy: 'submittedAt',
        orderDirection: 'desc'
      });
      
      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        reports = reports.filter(report => 
          report.title.toLowerCase().includes(searchLower) ||
          (report.fieldData && Object.values(report.fieldData).some(value => 
            typeof value === 'string' && value.toLowerCase().includes(searchLower)
          ))
        );
      }
      
      return reports;
    } catch (error) {
      console.error('Error getting filtered reports:', error);
      throw new Error('Failed to fetch reports for export');
    }
  }

  /**
   * Generate export preview
   */
  static async generateExportPreview(
    workspaceId: string,
    filters: ReportExportFilters,
    options: ReportExportOptions
  ): Promise<ExportPreview> {
    try {
      const reports = await this.getFilteredReports(workspaceId, filters);
      
      // Estimate file size based on format and content
      const baseSize = reports.length * 1024; // 1KB per report base
      const contentMultiplier = options.includeComments ? 1.5 : 1;
      const attachmentMultiplier = options.includeAttachments ? 3 : 1;
      const formatMultiplier = options.format === 'pdf' ? 2 : options.format === 'excel' ? 1.5 : 1;
      
      const estimatedBytes = baseSize * contentMultiplier * attachmentMultiplier * formatMultiplier;
      const estimatedFileSize = this.formatFileSize(estimatedBytes);
      
      // Estimate processing time (rough calculation)
      const baseTime = Math.max(1, Math.ceil(reports.length / 100)); // 1 second per 100 reports minimum
      const processingMultiplier = options.format === 'pdf' ? 3 : 1;
      const estimatedSeconds = baseTime * processingMultiplier;
      const estimatedProcessingTime = `${estimatedSeconds} second${estimatedSeconds !== 1 ? 's' : ''}`;
      
      // Get sample data (first 3 reports)
      const sampleData = reports.slice(0, 3).map(report => ({
        id: report.id,
        title: report.title,
        status: report.status,
        submittedAt: report.submittedAt,
        fieldCount: Object.keys(report.fieldData || {}).length,
        commentCount: report.comments?.length || 0,
        attachmentCount: report.attachments?.length || 0
      }));
      
      // Generate warnings
      const warnings: string[] = [];
      if (reports.length > 500) {
        warnings.push('Large export - this may take several minutes to process');
      }
      if (options.includeAttachments && reports.some(r => r.attachments?.length)) {
        warnings.push('Including attachments will significantly increase file size and processing time');
      }
      if (estimatedBytes > 50 * 1024 * 1024) { // 50MB
        warnings.push('Estimated file size is very large - consider filtering your data further');
      }
      
      // Get included fields
      const includedFields = this.getIncludedFields(options);
      
      return {
        totalRecords: reports.length,
        estimatedFileSize,
        estimatedProcessingTime,
        includedFields,
        sampleData,
        warnings
      };
    } catch (error) {
      console.error('Error generating export preview:', error);
      throw new Error('Failed to generate export preview');
    }
  }

  /**
   * Export reports with enhanced data
   */
  static async exportReports(
    workspaceId: string,
    filters: ReportExportFilters,
    options: ReportExportOptions,
    users: User[] = [],
    templates: ReportTemplate[] = [],
    departments: any[] = [],
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    const progressId = `export_${Date.now()}`;
    let progress: ExportProgress = {
      id: progressId,
      status: 'preparing',
      progress: 0,
      totalItems: 0,
      processedItems: 0,
      startedAt: new Date()
    };

    try {
      // Notify progress start
      if (onProgress) onProgress(progress);

      // Get filtered reports
      progress = { ...progress, status: 'processing', progress: 10 };
      if (onProgress) onProgress(progress);

      const reports = await this.getFilteredReports(workspaceId, filters);
      progress = { ...progress, totalItems: reports.length, progress: 20 };
      if (onProgress) onProgress(progress);

      // Enhance reports with additional data
      const enhancedReports = reports.map((report, index) => {
        // Update progress
        const currentProgress = 20 + Math.floor((index / reports.length) * 60);
        progress = { ...progress, processedItems: index + 1, progress: currentProgress };
        if (onProgress) onProgress(progress);

        // Find associated data
        const author = users.find(u => u.id === report.authorId);
        const template = templates.find(t => t.id === report.templateId);
        const authorDepartment = author?.department ? 
          departments.find(d => d.id === author.department)?.name || author.department 
          : 'Not specified';

        return {
          ...report,
          // Enhanced author info
          authorName: author?.name || 
                      (author?.firstName && author?.lastName ? `${author.firstName} ${author.lastName}` : null) ||
                      author?.email || 'Unknown User',
          authorEmail: author?.email || 'No email',
          authorDepartment,
          authorJobTitle: author?.jobTitle || 'Not specified',
          
          // Enhanced template info
          templateName: template?.name || 'Unknown Template',
          templateCategory: template?.category || 'Uncategorized',
          templateDepartment: template?.department || 'Not specified',
          
          // Enhanced dates
          submittedAtFormatted: report.submittedAt ? formatDate(report.submittedAt, 'yyyy-MM-dd HH:mm:ss') : 'Not submitted',
          createdAtFormatted: formatDate(report.createdAt, 'yyyy-MM-dd HH:mm:ss'),
          updatedAtFormatted: formatDate(report.updatedAt, 'yyyy-MM-dd HH:mm:ss'),
          
          // Enhanced field data
          fieldDataFlattened: this.flattenFieldData(report.fieldData, template),
          
          // Enhanced workflow info
          approvalStatus: this.getApprovalStatus(report),
          processingTime: this.calculateProcessingTime(report),
          
          // Enhanced comments
          commentsText: options.includeComments ? 
            report.comments?.map(c => `${c.authorName}: ${c.content}`).join(' | ') || 'No comments' 
            : '',
          commentCount: report.comments?.length || 0,
          
          // Enhanced attachments
          attachmentsText: options.includeAttachments ? 
            report.attachments?.map(a => a.fileName).join(', ') || 'No attachments'
            : '',
          attachmentCount: report.attachments?.length || 0,
        };
      });

      // Sort reports
      const sortedReports = this.sortReports(enhancedReports, options);

      // Update progress before export
      progress = { ...progress, progress: 85 };
      if (onProgress) onProgress(progress);

      // Generate filename
      const timestamp = formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const filename = options.fileName || `reports_export_${timestamp}`;

      // Export based on format using existing ExportService
      await ExportService.exportData({
        format: options.format as any,
        type: 'reports',
        data: sortedReports,
        filename
      });

      // Complete progress
      progress = { 
        ...progress, 
        status: 'completed', 
        progress: 100, 
        completedAt: new Date(),
        fileName: `${filename}.${this.getFileExtension(options.format)}`
      };
      if (onProgress) onProgress(progress);

    } catch (error) {
      console.error('Error exporting reports:', error);
      progress = {
        ...progress,
        status: 'failed',
        failedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
      if (onProgress) onProgress(progress);
      throw error;
    }
  }

  /**
   * Batch export individual reports
   */
  static async batchExportReports(
    workspaceId: string,
    reportIds: string[],
    format: 'pdf' | 'excel' | 'csv',
    options: { includeAttachments: boolean; includeComments: boolean },
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    const progressId = `batch_export_${Date.now()}`;
    let progress: ExportProgress = {
      id: progressId,
      status: 'preparing',
      progress: 0,
      totalItems: reportIds.length,
      processedItems: 0,
      startedAt: new Date()
    };

    try {
      if (onProgress) onProgress(progress);

      // Get individual reports
      const reports: EnhancedReport[] = [];
      for (let i = 0; i < reportIds.length; i++) {
        const reportId = reportIds[i];
        const report = await ReportService.getReport(workspaceId, reportId);
        if (report) {
          reports.push(report);
        }
        
        progress = { ...progress, processedItems: i + 1, progress: Math.floor((i / reportIds.length) * 80) };
        if (onProgress) onProgress(progress);
      }

      progress = { ...progress, status: 'processing', progress: 85 };
      if (onProgress) onProgress(progress);

      // Export all reports
      const timestamp = formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      await ExportService.exportData({
        format,
        type: 'reports',
        data: reports,
        filename: `batch_reports_${timestamp}`
      });

      progress = { 
        ...progress, 
        status: 'completed', 
        progress: 100, 
        completedAt: new Date() 
      };
      if (onProgress) onProgress(progress);

    } catch (error) {
      progress = {
        ...progress,
        status: 'failed',
        failedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
      if (onProgress) onProgress(progress);
      throw error;
    }
  }

  // Helper methods

  private static flattenFieldData(fieldData: Record<string, any>, template?: ReportTemplate): string {
    if (!fieldData) return '';
    
    const entries = Object.entries(fieldData).map(([fieldId, value]) => {
      const field = template?.fields.find(f => f.id === fieldId);
      const label = field?.label || fieldId;
      const displayValue = Array.isArray(value) ? value.join(', ') : String(value || '');
      return `${label}: ${displayValue}`;
    });
    
    return entries.join(' | ');
  }

  private static getApprovalStatus(report: EnhancedReport): string {
    if (!report.approvalWorkflow) return report.status;
    
    const { currentStep, steps, finalStatus } = report.approvalWorkflow;
    if (finalStatus) return finalStatus;
    
    const currentStepInfo = steps[currentStep - 1];
    return currentStepInfo ? `Step ${currentStep}: ${currentStepInfo.status}` : report.status;
  }

  private static calculateProcessingTime(report: EnhancedReport): string {
    if (!report.submittedAt || !report.updatedAt) return 'N/A';
    
    const diffMs = report.updatedAt.getTime() - report.submittedAt.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return '< 1h';
  }

  private static sortReports(reports: any[], options: ReportExportOptions): any[] {
    return reports.sort((a, b) => {
      let aValue, bValue;
      
      switch (options.sortBy) {
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'department':
          aValue = a.authorDepartment || '';
          bValue = b.authorDepartment || '';
          break;
        case 'submittedAt':
          aValue = a.submittedAt?.getTime() || 0;
          bValue = b.submittedAt?.getTime() || 0;
          break;
        case 'updatedAt':
        default:
          aValue = a.updatedAt?.getTime() || 0;
          bValue = b.updatedAt?.getTime() || 0;
          break;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return options.sortDirection === 'desc' ? -result : result;
    });
  }

  private static getIncludedFields(options: ReportExportOptions): string[] {
    const baseFields = ['ID', 'Title', 'Status', 'Author', 'Department', 'Created At', 'Updated At'];
    
    if (options.includeTemplateInfo) {
      baseFields.push('Template', 'Template Category');
    }
    
    if (options.includeApprovalWorkflow) {
      baseFields.push('Approval Status', 'Processing Time');
    }
    
    if (options.includeComments) {
      baseFields.push('Comments', 'Comment Count');
    }
    
    if (options.includeAttachments) {
      baseFields.push('Attachments', 'Attachment Count');
    }
    
    baseFields.push('Field Data');
    
    return baseFields;
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 