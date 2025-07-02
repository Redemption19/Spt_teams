// ===== REPORT EXPORT TYPES =====

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

export interface ExportJob {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  type: 'reports' | 'users' | 'projects' | 'tasks' | 'dashboard';
  filters: ReportExportFilters;
  options: ReportExportOptions;
  progress: ExportProgress;
  createdAt: Date;
  completedAt?: Date;
}

export interface ExportHistory {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  type: 'reports' | 'users' | 'projects' | 'tasks' | 'dashboard';
  format: 'pdf' | 'excel' | 'csv';
  fileName: string;
  fileSize: number;
  totalRecords: number;
  filters: ReportExportFilters;
  options: ReportExportOptions;
  status: 'completed' | 'failed' | 'expired';
  downloadUrl?: string;
  expiresAt: Date;
  createdAt: Date;
  downloadCount: number;
  lastDownloadedAt?: Date;
}

export interface BatchExportRequest {
  reportIds: string[];
  format: 'pdf' | 'excel' | 'csv';
  includeAttachments: boolean;
  includeComments: boolean;
  zipFileName?: string;
}

export interface ExportPreview {
  totalRecords: number;
  estimatedFileSize: string;
  estimatedProcessingTime: string;
  includedFields: string[];
  sampleData: any[];
  warnings: string[];
} 