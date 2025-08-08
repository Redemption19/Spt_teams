import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch,
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  getMetadata 
} from 'firebase/storage';
import { db, storage } from './firebase';
import { EnhancedReport, ReportTemplate, ReportTemplateField, ReportStatus } from './types';
import { ActivityService } from './activity-service';
import { NotificationService } from './notification-service';

export interface ReportSubmissionData {
  templateId: string;
  templateVersion: number;
  title: string;
  fieldData: Record<string, any>;
  attachments?: File[];
}

export interface ReportFieldValue {
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  value: any;
  fileUrls?: string[]; // For file fields
}

export interface ReportDraft {
  id: string;
  templateId: string;
  templateVersion: number;
  title: string;
  fieldData: Record<string, any>;
  attachments: {
    fieldId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    uploadedAt: Date;
  }[];
  userId: string;
  workspaceId: string;
  status: 'draft';
  createdAt: Date;
  updatedAt: Date;
  lastAutoSave?: Date;
}

export class ReportService {
  private static COLLECTION = 'workspaces';
  
  // Get reports collection reference for a workspace
  private static getReportsCollection(workspaceId: string) {
    return collection(db, `${this.COLLECTION}/${workspaceId}/reports`);
  }

  // Get report document reference
  private static getReportDoc(workspaceId: string, reportId: string) {
    return doc(db, `${this.COLLECTION}/${workspaceId}/reports`, reportId);
  }

  // Generate unique file path for storage
  private static generateFilePath(workspaceId: string, reportId: string, fieldId: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `reports/${workspaceId}/${reportId}/${fieldId}/${timestamp}_${sanitizedFileName}`;
  }

  // Upload file to Firebase Storage
  private static async uploadFile(
    file: File, 
    workspaceId: string, 
    reportId: string, 
    fieldId: string
  ): Promise<{
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    storagePath: string;
  }> {
    try {
      const filePath = this.generateFilePath(workspaceId, reportId, fieldId, file.name);
      const storageRef = ref(storage, filePath);
      
      // Upload file
      const uploadResult = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      return {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: downloadURL,
        storagePath: filePath
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete file from Firebase Storage
  private static async deleteFile(storagePath: string): Promise<void> {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw error for file deletion failures
    }
  }

  // Upload multiple files for a field
  private static async uploadFieldFiles(
    files: File[], 
    workspaceId: string, 
    reportId: string, 
    fieldId: string
  ): Promise<{
    fieldId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    storagePath: string;
    uploadedAt: Date;
  }[]> {
    const uploadPromises = files.map(file => 
      this.uploadFile(file, workspaceId, reportId, fieldId)
    );
    
    const uploadResults = await Promise.all(uploadPromises);
    
    return uploadResults.map(result => ({
      fieldId,
      fileName: result.fileName,
      fileSize: result.fileSize,
      fileType: result.fileType,
      fileUrl: result.fileUrl,
      storagePath: result.storagePath,
      uploadedAt: new Date()
    }));
  }

  // Validate field data against template
  private static validateFieldData(
    fieldData: Record<string, any>, 
    template: ReportTemplate
  ): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    
    for (const field of template.fields) {
      const value = fieldData[field.id];
      
      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        errors[field.id] = `${field.label} is required`;
        continue;
      }
      
      // Skip validation for empty non-required fields
      if (!value && !field.required) continue;
      
      // Type-specific validation
      switch (field.type) {
        case 'text':
        case 'textarea':
          if (typeof value !== 'string') {
            errors[field.id] = `${field.label} must be text`;
          } else if (field.validation) {
            if (field.validation.minLength && value.length < field.validation.minLength) {
              errors[field.id] = `${field.label} must be at least ${field.validation.minLength} characters`;
            }
            if (field.validation.maxLength && value.length > field.validation.maxLength) {
              errors[field.id] = `${field.label} must be no more than ${field.validation.maxLength} characters`;
            }
            if (field.validation.pattern) {
              const regex = new RegExp(field.validation.pattern);
              if (!regex.test(value)) {
                errors[field.id] = field.validation.customMessage || `${field.label} format is invalid`;
              }
            }
          }
          break;
          
        case 'number':
          const numValue = Number(value);
          if (isNaN(numValue)) {
            errors[field.id] = `${field.label} must be a valid number`;
          } else if (field.validation) {
            if (field.validation.min !== undefined && numValue < field.validation.min) {
              errors[field.id] = `${field.label} must be at least ${field.validation.min}`;
            }
            if (field.validation.max !== undefined && numValue > field.validation.max) {
              errors[field.id] = `${field.label} must be no more than ${field.validation.max}`;
            }
          }
          break;
          
        case 'date':
          if (!(value instanceof Date) && isNaN(Date.parse(value))) {
            errors[field.id] = `${field.label} must be a valid date`;
          }
          break;
          
        case 'dropdown':
          if (field.options && !field.options.includes(value)) {
            errors[field.id] = `${field.label} must be one of the available options`;
          }
          break;
          
        case 'checkbox':
          if (typeof value !== 'boolean') {
            errors[field.id] = `${field.label} must be true or false`;
          }
          break;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Create a new report (draft or submitted)
  static async createReport(
    workspaceId: string,
    userId: string,
    reportData: ReportSubmissionData,
    status: ReportStatus = 'draft',
    filesByField: Record<string, File[]> = {}
  ): Promise<EnhancedReport> {
    try {
      // First, create the report document to get an ID
      const reportsCollection = this.getReportsCollection(workspaceId);
      const reportDoc = doc(reportsCollection);
      const reportId = reportDoc.id;
      
      // Process file uploads
      const allAttachments: EnhancedReport['attachments'] = [];
      
      for (const [fieldId, files] of Object.entries(filesByField)) {
        if (files && files.length > 0) {
          const uploadedFiles = await this.uploadFieldFiles(files, workspaceId, reportId, fieldId);
          
          uploadedFiles.forEach(file => {
            allAttachments.push({
              fieldId,
              fileId: `${reportId}_${fieldId}_${Date.now()}`,
              fileName: file.fileName,
              fileSize: file.fileSize,
              fileType: file.fileType,
              uploadedAt: file.uploadedAt
            });
            
            // Add file URL to field data
            if (!reportData.fieldData[fieldId]) {
              reportData.fieldData[fieldId] = [];
            }
            if (Array.isArray(reportData.fieldData[fieldId])) {
              reportData.fieldData[fieldId].push(file.fileUrl);
            } else {
              reportData.fieldData[fieldId] = [file.fileUrl];
            }
          });
        }
      }
      
      // Create report document
      const newReport: Omit<EnhancedReport, 'id'> = {
        title: reportData.title,
        templateId: reportData.templateId,
        templateVersion: reportData.templateVersion,
        workspaceId,
        authorId: userId,
        fieldData: reportData.fieldData,
        attachments: allAttachments,
        status,
        comments: [],
        revisions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(status === 'submitted' && { submittedAt: new Date() })
      };
      
      // Save to Firestore
      await addDoc(reportsCollection, {
        ...newReport,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(status === 'submitted' && { submittedAt: serverTimestamp() })
      });
      
      // Update template usage statistics
      try {
        await this.updateTemplateUsage(workspaceId, reportData.templateId, status);
      } catch (error) {
        console.error('Failed to update template usage:', error);
      }
      
      // Log activity
      try {
        await ActivityService.logActivity(
          status === 'draft' ? 'report_created' : 'report_submitted',
          'report',
          reportId,
          { 
            title: reportData.title,
            templateId: reportData.templateId,
            status 
          },
          workspaceId,
          userId
        );
      } catch (error) {
        console.error('Failed to log report activity:', error);
      }
      
      return {
        ...newReport,
        id: reportId
      };
    } catch (error) {
      console.error('Error creating report:', error);
      throw new Error(`Failed to create report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update an existing report
  static async updateReport(
    workspaceId: string,
    reportId: string,
    userId: string,
    updates: Partial<EnhancedReport>,
    newFilesByField: Record<string, File[]> = {}
  ): Promise<void> {
    try {
      const reportDoc = this.getReportDoc(workspaceId, reportId);
      
      // Get current report to check ownership
      const currentReport = await this.getReport(workspaceId, reportId);
      if (!currentReport) {
        throw new Error('Report not found');
      }
      
      // Check permissions
      if (currentReport.authorId !== userId) {
        throw new Error('You can only update your own reports');
      }
      
      // Process new file uploads
      const newAttachments: EnhancedReport['attachments'] = [...(currentReport.attachments || [])];
      
      for (const [fieldId, files] of Object.entries(newFilesByField)) {
        if (files && files.length > 0) {
          const uploadedFiles = await this.uploadFieldFiles(files, workspaceId, reportId, fieldId);
          
          uploadedFiles.forEach(file => {
            newAttachments.push({
              fieldId,
              fileId: `${reportId}_${fieldId}_${Date.now()}`,
              fileName: file.fileName,
              fileSize: file.fileSize,
              fileType: file.fileType,
              uploadedAt: file.uploadedAt
            });
            
            // Add file URL to field data
            if (!updates.fieldData) updates.fieldData = { ...currentReport.fieldData };
            if (!updates.fieldData[fieldId]) {
              updates.fieldData[fieldId] = [];
            }
            if (Array.isArray(updates.fieldData[fieldId])) {
              updates.fieldData[fieldId].push(file.fileUrl);
            } else {
              updates.fieldData[fieldId] = [file.fileUrl];
            }
          });
        }
      }
      
      // Create revision history entry
      const revisionEntry = {
        version: (currentReport.revisions?.length || 0) + 1,
        changedBy: userId,
        changedAt: new Date(),
        changes: [],
        comment: updates.status === 'submitted' ? 'Report submitted' : 'Report updated'
      };
      
      // Update document
      const updateData: any = {
        ...updates,
        attachments: newAttachments,
        revisions: [...(currentReport.revisions || []), revisionEntry],
        updatedAt: serverTimestamp()
      };
      
      if (updates.status === 'submitted' && currentReport.status === 'draft') {
        updateData.submittedAt = serverTimestamp();
      }
      
      await updateDoc(reportDoc, updateData);
      
      // Update template usage if status changed
      if (updates.status && updates.status !== currentReport.status && currentReport.templateId) {
        try {
          await this.updateTemplateUsage(workspaceId, currentReport.templateId, updates.status);
        } catch (error) {
          console.error('Failed to update template usage:', error);
        }
      }
      
      // Log activity
      try {
        await ActivityService.logActivity(
          updates.status === 'submitted' ? 'report_submitted' : 'report_updated',
          'report',
          reportId,
          { 
            title: currentReport.title,
            status: updates.status || currentReport.status 
          },
          workspaceId,
          userId
        );
      } catch (error) {
        console.error('Failed to log report activity:', error);
      }
      
    } catch (error) {
      console.error('Error updating report:', error);
      throw new Error(`Failed to update report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get a single report
  static async getReport(workspaceId: string, reportId: string): Promise<EnhancedReport | null> {
    try {
      const reportDoc = this.getReportDoc(workspaceId, reportId);
      const docSnap = await getDoc(reportDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          submittedAt: data.submittedAt?.toDate(),
          lastAccessedAt: data.lastAccessedAt?.toDate(),
        } as unknown as EnhancedReport;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw new Error(`Failed to fetch report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user's reports
  static async getUserReports(
    workspaceId: string,
    userId: string,
    options: {
      status?: ReportStatus;
      limit?: number;
      orderBy?: 'createdAt' | 'updatedAt' | 'submittedAt';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<EnhancedReport[]> {
    try {
      const reportsCollection = this.getReportsCollection(workspaceId);
      let q = query(reportsCollection, where('authorId', '==', userId));
      
      if (options.status) {
        q = query(q, where('status', '==', options.status));
      }
      
      const orderField = options.orderBy || 'updatedAt';
      const orderDirection = options.orderDirection || 'desc';
      q = query(q, orderBy(orderField, orderDirection));
      
      if (options.limit) {
        q = query(q, limit(options.limit));
      }
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          submittedAt: data.submittedAt?.toDate(),
          lastAccessedAt: data.lastAccessedAt?.toDate(),
        } as EnhancedReport;
      });
    } catch (error) {
      console.error('Error fetching user reports:', error);
      throw new Error(`Failed to fetch user reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete a report
  static async deleteReport(
    workspaceId: string,
    reportId: string,
    userId: string
  ): Promise<void> {
    try {
      // Get report first to check ownership and get file paths
      const report = await this.getReport(workspaceId, reportId);
      if (!report) {
        throw new Error('Report not found');
      }
      
      if (report.authorId !== userId) {
        throw new Error('You can only delete your own reports');
      }
      
      // Delete associated files from storage
      if (report.attachments && report.attachments.length > 0) {
        // Note: We don't have storagePath in the current structure, 
        // so we'll need to construct it or store it in the attachment
        // For now, we'll skip file deletion and rely on cleanup jobs
      }
      
      // Delete the report document
      const reportDoc = this.getReportDoc(workspaceId, reportId);
      await deleteDoc(reportDoc);
      
      // Log activity
      try {
        await ActivityService.logActivity(
          'report_deleted',
          'report',
          reportId,
          { title: report.title },
          workspaceId,
          userId
        );
      } catch (error) {
        console.error('Failed to log report deletion activity:', error);
      }
      
    } catch (error) {
      console.error('Error deleting report:', error);
      throw new Error(`Failed to delete report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Auto-save draft report
  static async autoSaveDraft(
    workspaceId: string,
    reportId: string,
    userId: string,
    fieldData: Record<string, any>
  ): Promise<void> {
    try {
      const reportDoc = this.getReportDoc(workspaceId, reportId);
      
      await updateDoc(reportDoc, {
        fieldData,
        updatedAt: serverTimestamp(),
        lastAutoSave: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error auto-saving draft:', error);
      // Don't throw error for auto-save failures
    }
  }

  // Get all workspace reports (admin/owner access)
  static async getWorkspaceReports(
    workspaceId: string,
    options: {
      status?: ReportStatus;
      authorId?: string;
      templateId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      orderBy?: 'createdAt' | 'updatedAt' | 'submittedAt';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<EnhancedReport[]> {
    try {
      const reportsCollection = this.getReportsCollection(workspaceId);
      let q = query(reportsCollection);
      
      // Apply filters
      if (options.status) {
        q = query(q, where('status', '==', options.status));
      }
      
      if (options.authorId) {
        q = query(q, where('authorId', '==', options.authorId));
      }
      
      if (options.templateId) {
        q = query(q, where('templateId', '==', options.templateId));
      }
      
      if (options.startDate) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(options.startDate)));
      }
      
      if (options.endDate) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(options.endDate)));
      }
      
      // Apply ordering
      const orderField = options.orderBy || 'updatedAt';
      const orderDirection = options.orderDirection || 'desc';
      q = query(q, orderBy(orderField, orderDirection));
      
      if (options.limit) {
        q = query(q, limit(options.limit));
      }
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          submittedAt: data.submittedAt?.toDate(),
          lastAccessedAt: data.lastAccessedAt?.toDate(),
        } as EnhancedReport;
      });
    } catch (error) {
      console.error('Error fetching workspace reports:', error);
      throw new Error(`Failed to fetch workspace reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update report status (admin/owner access)
  static async updateReportStatus(
    workspaceId: string,
    reportId: string,
    newStatus: ReportStatus,
    reviewerId: string,
    feedback?: string
  ): Promise<void> {
    try {
      const reportDoc = this.getReportDoc(workspaceId, reportId);
      
      // Get current report
      const currentReport = await this.getReport(workspaceId, reportId);
      if (!currentReport) {
        throw new Error('Report not found');
      }
      
      // Create revision history entry
      const revisionEntry = {
        version: (currentReport.revisions?.length || 0) + 1,
        changedBy: reviewerId,
        changedAt: new Date(),
        changes: [`Status changed from ${currentReport.status} to ${newStatus}`],
        comment: feedback || `Status changed to ${newStatus}`
      };
      
      // Update document
      const updateData: any = {
        status: newStatus,
        reviewedBy: reviewerId,
        reviewedAt: serverTimestamp(),
        feedback: feedback || null,
        revisions: [...(currentReport.revisions || []), revisionEntry],
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(reportDoc, updateData);
      
      // Update template usage statistics
      if (currentReport.templateId) {
        try {
          await this.updateTemplateUsage(workspaceId, currentReport.templateId, newStatus);
        } catch (error) {
          console.error('Failed to update template usage:', error);
        }
      }
      
      // Log activity
      try {
        await ActivityService.logActivity(
          'report_status_changed' as any,
          'report',
          reportId,
          { 
            title: currentReport.title,
            oldStatus: currentReport.status,
            newStatus,
            feedback
          },
          workspaceId,
          reviewerId
        );
      } catch (error) {
        console.error('Failed to log report status change activity:', error);
      }
      
    } catch (error) {
      console.error('Error updating report status:', error);
      throw new Error(`Failed to update report status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update template usage statistics
  private static async updateTemplateUsage(
    workspaceId: string,
    templateId: string,
    reportStatus: ReportStatus
  ): Promise<void> {
    try {
      // This would typically be in the ReportTemplateService
      // but we'll implement it here for completeness
      const templateDoc = doc(db, `${this.COLLECTION}/${workspaceId}/templates`, templateId);
      
      const updateData: any = {
        'usage.totalReports': 1,
        'lastUsedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Update specific status counters
      switch (reportStatus) {
        case 'draft':
          updateData['usage.drafts'] = 1;
          break;
        case 'submitted':
          updateData['usage.submitted'] = 1;
          break;
        case 'approved':
          updateData['usage.approved'] = 1;
          break;
        case 'rejected':
          updateData['usage.rejected'] = 1;
          break;
        case 'archived':
          updateData['usage.archived'] = 1;
          break;
      }
      
      await updateDoc(templateDoc, updateData);
      
    } catch (error) {
      console.error('Error updating template usage:', error);
      // Don't throw error for usage update failures
    }
  }

  /**
   * Get pending reports for approval (admin/owner only)
   */
  static async getPendingReports(
    workspaceId: string,
    options: {
      department?: string;
      template?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
      limit?: number;
      orderBy?: 'submittedAt' | 'updatedAt';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<EnhancedReport[]> {
    try {
      const {
        department = '',
        template = '',
        dateFrom = '',
        dateTo = '',
        search = '',
        limit: limitCount = 50,
        orderBy: orderField = 'submittedAt',
        orderDirection = 'desc'
      } = options;

      const reportsCollection = this.getReportsCollection(workspaceId);
      let q = query(reportsCollection, where('status', '==', 'submitted'));

      // Add filters
      if (department && department !== 'all') {
        q = query(q, where('authorDepartment', '==', department));
      }

      if (template && template !== 'all') {
        q = query(q, where('templateId', '==', template));
      }

      // Add date range filters
      if (dateFrom) {
        const fromDate = Timestamp.fromDate(new Date(dateFrom));
        q = query(q, where('submittedAt', '>=', fromDate));
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        q = query(q, where('submittedAt', '<=', Timestamp.fromDate(toDate)));
      }

      // Add ordering
      q = query(q, orderBy(orderField, orderDirection));

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      let reports = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          submittedAt: data.submittedAt?.toDate(),
          reviewedAt: data.reviewedAt?.toDate(),
        } as unknown as EnhancedReport;
      });

      // Apply search filter (client-side for flexibility)
      if (search) {
        const searchLower = search.toLowerCase();
        reports = reports.filter(report =>
          report.title.toLowerCase().includes(searchLower) ||
          (report as any).authorName?.toLowerCase().includes(searchLower) ||
          (report as any).authorEmail?.toLowerCase().includes(searchLower)
        );
      }

      return reports;
    } catch (error) {
      console.error('Error getting pending reports:', error);
      throw new Error('Failed to fetch pending reports');
    }
  }

  /**
   * Approve a report (admin/owner only)
   */
  static async approveReport(
    workspaceId: string,
    reportId: string,
    reviewerId: string,
    reviewComment?: string
  ): Promise<void> {
    try {
      const reportDoc = this.getReportDoc(workspaceId, reportId);
      
      // Get the current report data to access author information
      const reportSnap = await getDoc(reportDoc);
      if (!reportSnap.exists()) {
        throw new Error('Report not found');
      }
      const report = reportSnap.data() as EnhancedReport;

      const updateData: any = {
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (reviewComment?.trim()) {
        updateData.reviewComment = reviewComment.trim();
      }

      await updateDoc(reportDoc, updateData);

      // Log activity
      try {
        await ActivityService.logActivity(
          'report_approved' as any,
          'report',
          reportId,
          { reviewComment: reviewComment || 'Report approved' },
          workspaceId,
          reviewerId
        );
      } catch (error) {
        console.error('Error logging approval activity:', error);
      }

      // Create notification for report author
      if (report.authorId && report.authorId !== reviewerId) {
        try {
          await NotificationService.createNotification({
            userId: report.authorId,
            workspaceId,
            type: 'report_approved',
            title: 'Report Approved',
            message: `Your report "${report.title}" has been approved.${reviewComment ? ` Comment: ${reviewComment}` : ''}`,
            icon: '✅',
            priority: 'medium',
            actionUrl: `/dashboard/reports/view/${reportId}`,
            actionLabel: 'View Report',
            metadata: {
              reportId,
              reportTitle: report.title,
              reviewComment: reviewComment || null
            }
          });
        } catch (error) {
          console.error('Error creating approval notification:', error);
          // Don't throw error as this is not critical to the main operation
        }
      }

    } catch (error) {
      console.error('Error approving report:', error);
      throw new Error('Failed to approve report');
    }
  }

  /**
   * Reject a report (admin/owner only)
   */
  static async rejectReport(
    workspaceId: string,
    reportId: string,
    reviewerId: string,
    reviewComment: string
  ): Promise<void> {
    try {
      if (!reviewComment?.trim()) {
        throw new Error('Rejection reason is required');
      }

      const reportDoc = this.getReportDoc(workspaceId, reportId);
      
      // Get the current report data to access author information
      const reportSnap = await getDoc(reportDoc);
      if (!reportSnap.exists()) {
        throw new Error('Report not found');
      }
      const report = reportSnap.data() as EnhancedReport;

      await updateDoc(reportDoc, {
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: serverTimestamp(),
        reviewComment: reviewComment.trim(),
        updatedAt: serverTimestamp(),
      });

      // Log activity
      try {
        await ActivityService.logActivity(
          'report_rejected' as any,
          'report',
          reportId,
          { reviewComment },
          workspaceId,
          reviewerId
        );
      } catch (error) {
        console.error('Error logging rejection activity:', error);
      }

      // Create notification for report author
      if (report.authorId && report.authorId !== reviewerId) {
        try {
          await NotificationService.createNotification({
            userId: report.authorId,
            workspaceId,
            type: 'report_rejected',
            title: 'Report Rejected',
            message: `Your report "${report.title}" has been rejected. Reason: ${reviewComment.trim()}`,
            icon: '❌',
            priority: 'high',
            actionUrl: `/dashboard/reports/view/${reportId}`,
            actionLabel: 'View Report',
            metadata: {
              reportId,
              reportTitle: report.title,
              rejectionReason: reviewComment.trim()
            }
          });
        } catch (error) {
          console.error('Error creating rejection notification:', error);
          // Don't throw error as this is not critical to the main operation
        }
      }

    } catch (error) {
      console.error('Error rejecting report:', error);
      throw new Error('Failed to reject report');
    }
  }

  // Add a comment to a report
  static async addReportComment(
    workspaceId: string,
    reportId: string,
    content: string,
    authorId: string,
    authorName?: string,
    authorRole?: string
  ) {
    try {
      const reportDoc = this.getReportDoc(workspaceId, reportId);
      const reportSnap = await getDoc(reportDoc);
      if (!reportSnap.exists()) throw new Error('Report not found');
      const report = reportSnap.data() as EnhancedReport;
      const newComment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: content.trim(),
        authorId,
        authorName,
        authorRole,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'general',
        isInternal: false,
      };
      await updateDoc(reportDoc, {
        comments: arrayUnion(newComment),
        updatedAt: serverTimestamp(),
      });
      // Log activity
      await ActivityService.logActivity(
        'report_updated',
        'report',
        reportId,
        {
          reportTitle: report.title,
          commentId: newComment.id,
          commentAuthor: authorName || authorId,
          commentPreview: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
        },
        workspaceId,
        authorId
      );
      // Notify report author (if not self)
      if (report.authorId && report.authorId !== authorId) {
        await NotificationService.createNotification({
          userId: report.authorId,
          workspaceId,
          type: 'system_alert',
          title: 'New Comment on Your Report',
          message: `${authorName || 'A reviewer'} commented on your report: "${report.title}"`,
          icon: '💬',
          priority: 'medium',
          actionUrl: `/dashboard/reports/view/${reportId}`,
          actionLabel: 'View Report',
          metadata: { reportId, commentId: newComment.id },
        });
      }
      return newComment;
    } catch (error) {
      console.error('Error adding report comment:', error);
      throw new Error('Failed to add comment to report');
    }
  }
}