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
  increment,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  ReportTemplate, 
  ReportTemplateField, 
  ReportFieldType,
  TemplateFieldDraft,
  EnhancedReport 
} from './types';
import { ActivityService } from './activity-service';
import { NotificationService } from './notification-service';

export class ReportTemplateService {
  private static COLLECTION = 'workspaces';

  // Get templates collection reference for a workspace
  private static getTemplatesCollection(workspaceId: string) {
    return collection(db, `${this.COLLECTION}/${workspaceId}/templates`);
  }

  // Get template document reference
  private static getTemplateDoc(workspaceId: string, templateId: string) {
    return doc(db, `${this.COLLECTION}/${workspaceId}/templates`, templateId);
  }

  // Validate template field
  private static validateField(field: TemplateFieldDraft): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!field.label?.trim()) {
      errors.push('Field label is required');
    }

    if (!field.type) {
      errors.push('Field type is required');
    }

    // Validate dropdown options
    if (field.type === 'dropdown' && (!field.options || field.options.length === 0)) {
      errors.push('Dropdown fields must have at least one option');
    }

    // Validate dropdown options for duplicates and empty values
    if (field.type === 'dropdown' && field.options) {
      const cleanOptions = field.options.filter(opt => opt?.trim());
      const uniqueOptions = new Set(cleanOptions.map(opt => opt.toLowerCase()));
      
      if (cleanOptions.length !== field.options.length) {
        errors.push('Dropdown options cannot be empty');
      }
      
      if (uniqueOptions.size !== cleanOptions.length) {
        errors.push('Dropdown options must be unique');
      }
    }

    // Validate file field settings
    if (field.type === 'file') {
      if (field.maxFiles && field.maxFiles < 1) {
        errors.push('Maximum files must be at least 1');
      }
      if (field.maxFileSize && field.maxFileSize < 1024) {
        errors.push('Maximum file size must be at least 1KB');
      }
    }

    // Validate number field constraints
    if (field.type === 'number' && field.validation) {
      if (field.validation.min !== undefined && field.validation.max !== undefined) {
        if (field.validation.min >= field.validation.max) {
          errors.push('Maximum value must be greater than minimum value');
        }
      }
    }

    // Validate text field length constraints
    if ((field.type === 'text' || field.type === 'textarea') && field.validation) {
      if (field.validation.minLength !== undefined && field.validation.maxLength !== undefined) {
        if (field.validation.minLength >= field.validation.maxLength) {
          errors.push('Maximum length must be greater than minimum length');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate entire template
  private static validateTemplate(template: Partial<ReportTemplate>, fields: TemplateFieldDraft[]): {
    isValid: boolean;
    templateErrors: Record<string, string>;
    fieldErrors: Record<string, string[]>;
  } {
    const templateErrors: Record<string, string> = {};
    const fieldErrors: Record<string, string[]> = {};

    // Validate template basic info
    if (!template.name?.trim()) {
      templateErrors.name = 'Template name is required';
    }

    if (template.name && template.name.length > 100) {
      templateErrors.name = 'Template name must be 100 characters or less';
    }

    if (template.description && template.description.length > 500) {
      templateErrors.description = 'Description must be 500 characters or less';
    }

    // Validate fields
    if (fields.length === 0) {
      templateErrors.fields = 'Template must have at least one field';
    }

    // Check for duplicate field labels
    const fieldLabels = fields.map(f => f.label?.trim().toLowerCase()).filter(Boolean);
    const uniqueLabels = new Set(fieldLabels);
    if (uniqueLabels.size !== fieldLabels.length) {
      templateErrors.fields = 'Field labels must be unique';
    }

    // Validate individual fields
    fields.forEach((field, index) => {
      const validation = this.validateField(field);
      if (!validation.isValid) {
        fieldErrors[field.id] = validation.errors;
      }
    });

    return {
      isValid: Object.keys(templateErrors).length === 0 && Object.keys(fieldErrors).length === 0,
      templateErrors,
      fieldErrors
    };
  }

  // Create a new template
  static async createTemplate(
    workspaceId: string,
    templateData: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'usage'>,
    createdBy: string
  ): Promise<ReportTemplate> {
    try {
      // Validate template before creating
      const validation = this.validateTemplate(templateData, templateData.fields);
      if (!validation.isValid) {
        throw new Error(`Template validation failed: ${JSON.stringify(validation)}`);
      }

      const templatesCollection = this.getTemplatesCollection(workspaceId);
      
      const newTemplate: Omit<ReportTemplate, 'id'> = {
        ...templateData,
        workspaceId,
        createdBy,
        version: 1,
        usage: {
          totalReports: 0,
          drafts: 0,
          submitted: 0,
          approved: 0,
          rejected: 0
        },
        status: templateData.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(templatesCollection, {
        ...newTemplate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Log activity
      try {
        await ActivityService.logActivity(
          'report_created',
          'report_template',
          docRef.id,
          { templateName: templateData.name },
          workspaceId,
          createdBy
        );
      } catch (error) {
        console.error('Failed to log template creation activity:', error);
      }

      return {
        ...newTemplate,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error creating report template:', error);
      throw new Error(`Failed to create report template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update an existing template
  static async updateTemplate(
    workspaceId: string,
    templateId: string,
    updates: Partial<ReportTemplate>,
    updatedBy: string
  ): Promise<void> {
    try {
      // Get current template first
      const currentTemplate = await this.getTemplate(workspaceId, templateId);
      if (!currentTemplate) {
        throw new Error('Template not found');
      }

      // Validate updates if fields are being changed
      if (updates.fields) {
        const validation = this.validateTemplate(
          { ...currentTemplate, ...updates }, 
          updates.fields
        );
        if (!validation.isValid) {
          throw new Error(`Template validation failed: ${JSON.stringify(validation)}`);
        }
      }

      const templateDoc = this.getTemplateDoc(workspaceId, templateId);
      
      const updateData: any = {
        ...updates,
        updatedBy,
        updatedAt: serverTimestamp()
      };

      // Increment version if significant changes
      if (updates.fields || updates.name || updates.settings) {
        updateData.version = increment(1);
        
        // Add to change log
        if (updates.fields && !arrayEquals(updates.fields, currentTemplate.fields)) {
          updateData.changeLog = [
            ...(currentTemplate.changeLog || []),
            {
              version: currentTemplate.version + 1,
              changes: 'Template fields updated',
              changedBy: updatedBy,
              changedAt: new Date()
            }
          ];
        }
      }

      await updateDoc(templateDoc, updateData);

      // Log activity
      try {
        await ActivityService.logActivity(
          'settings_changed',
          'report_template',
          templateId,
          { 
            templateName: updates.name || currentTemplate.name,
            changes: Object.keys(updates)
          },
          workspaceId,
          updatedBy
        );
      } catch (error) {
        console.error('Failed to log template update activity:', error);
      }
    } catch (error) {
      console.error('Error updating report template:', error);
      throw new Error(`Failed to update report template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete a template
  static async deleteTemplate(
    workspaceId: string,
    templateId: string,
    deletedBy: string
  ): Promise<void> {
    try {
      // Get template first to check if it's in use
      const template = await this.getTemplate(workspaceId, templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Check if template is in use
      if (template.usage.totalReports > 0) {
        // Archive instead of delete if in use
        await this.updateTemplate(workspaceId, templateId, {
          status: 'archived'
        }, deletedBy);
        return;
      }

      const templateDoc = this.getTemplateDoc(workspaceId, templateId);
      await deleteDoc(templateDoc);

      // Log activity
      try {
        await ActivityService.logActivity(
          'settings_changed',
          'report_template',
          templateId,
          { templateName: template.name, action: 'delete' },
          workspaceId,
          deletedBy
        );
      } catch (error) {
        console.error('Failed to log template deletion activity:', error);
      }
    } catch (error) {
      console.error('Error deleting report template:', error);
      throw new Error(`Failed to delete report template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get a single template
  static async getTemplate(workspaceId: string, templateId: string): Promise<ReportTemplate | null> {
    try {
      const templateDoc = this.getTemplateDoc(workspaceId, templateId);
      const docSnap = await getDoc(templateDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastUsedAt: data.lastUsedAt?.toDate(),
        } as ReportTemplate;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching report template:', error);
      throw new Error(`Failed to fetch report template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all templates for a workspace
  static async getWorkspaceTemplates(
    workspaceId: string,
    options: {
      status?: 'active' | 'draft' | 'archived' | 'deprecated';
      category?: string;
      limit?: number;
      orderBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastUsedAt';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<ReportTemplate[]> {
    try {
      const templatesCollection = this.getTemplatesCollection(workspaceId);
      let q = query(templatesCollection);

      // Add filters
      if (options.status) {
        q = query(q, where('status', '==', options.status));
      }

      if (options.category) {
        q = query(q, where('category', '==', options.category));
      }

      // Add ordering
      const orderField = options.orderBy || 'updatedAt';
      const orderDirection = options.orderDirection || 'desc';
      q = query(q, orderBy(orderField, orderDirection));

      // Add limit
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      
      const templates = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastUsedAt: data.lastUsedAt?.toDate(),
        } as ReportTemplate;
      });
      
      return templates;
    } catch (error) {
      console.error('Error fetching workspace templates:', error);
      throw new Error(`Failed to fetch workspace templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get templates filtered by user's department access
  static async getTemplatesForUser(
    workspaceId: string,
    userDepartment: string | undefined,
    userRole: 'owner' | 'admin' | 'member',
    options: {
      status?: 'active' | 'draft' | 'archived' | 'deprecated';
      category?: string;
      limit?: number;
      orderBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastUsedAt';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<ReportTemplate[]> {
    try {
      // Get all templates first, then filter by department access
      const allTemplates = await this.getWorkspaceTemplates(workspaceId, options);
      
      // Filter templates based on department access
      const filteredTemplates = allTemplates.filter(template => 
        this.canUserAccessTemplate(template, userDepartment, userRole)
      );
      
      return filteredTemplates;
    } catch (error) {
      console.error('Error fetching templates for user:', error);
      throw new Error(`Failed to fetch templates for user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check if user can access a template based on department
  static canUserAccessTemplate(
    template: ReportTemplate,
    userDepartment: string | undefined,
    userRole: 'owner' | 'admin' | 'member'
  ): boolean {
    // Owners and admins can access all templates
    if (userRole === 'owner' || userRole === 'admin') {
      return true;
    }

    // Handle legacy templates without departmentAccess
    if (!template.departmentAccess) {
      // Use legacy allowedDepartments field
      if (template.allowedDepartments && template.allowedDepartments.length > 0) {
        return userDepartment ? template.allowedDepartments.includes(userDepartment) : false;
      }
      // Default to public access for legacy templates
      return template.visibility === 'public';
    }

    const { departmentAccess } = template;

    // Check department access type
    switch (departmentAccess.type) {
      case 'global':
        return true; // Available to all departments

      case 'department_specific':
        // Only for the owner department
        return userDepartment === departmentAccess.ownerDepartment;

      case 'multi_department':
        // Available to selected departments
        return userDepartment && departmentAccess.allowedDepartments 
          ? departmentAccess.allowedDepartments.includes(userDepartment)
          : false;

      case 'custom':
        // Check allowed departments and excluded departments
        if (departmentAccess.restrictedDepartments && userDepartment) {
          if (departmentAccess.restrictedDepartments.includes(userDepartment)) {
            return false; // Explicitly denied
          }
        }
        
        if (departmentAccess.allowedDepartments && departmentAccess.allowedDepartments.length > 0) {
          return userDepartment ? departmentAccess.allowedDepartments.includes(userDepartment) : false;
        }
        
        return true; // No restrictions means global access

      default:
        return false;
    }
  }

  // Get available departments for template access control
  static async getAvailableDepartments(workspaceId: string): Promise<string[]> {
    try {
      // Import UserService to get departments from users
      const { UserService } = await import('./user-service');
      
      // Get all users in the workspace
      const users = await UserService.getUsersByWorkspace(workspaceId);
      
      // Extract unique departments from users
      const userDepartments = new Set<string>();
      users.forEach(user => {
        if (user.department && user.department.trim()) {
          userDepartments.add(user.department.trim());
        }
      });
      
      // Predefined common departments for immediate use
      const commonDepartments = [
        'Finance',
        'Human Resources',
        'Marketing', 
        'Operations',
        'Information Technology',
        'Sales',
        'Administration',
        'Legal',
        'Customer Service',
        'Research & Development',
        'Quality Assurance',
        'Project Management'
      ];
      
      // Combine user departments with common departments
      const allDepartments = new Set([
        ...Array.from(userDepartments),
        ...commonDepartments
      ]);
      
      // Return sorted array
      return Array.from(allDepartments).sort();
      
    } catch (error) {
      console.error('Error fetching available departments:', error);
      // Return fallback departments
      return [
        'Administration',
        'Customer Service', 
        'Finance',
        'Human Resources',
        'Information Technology',
        'Legal',
        'Marketing',
        'Operations',
        'Project Management',
        'Quality Assurance',
        'Research & Development',
        'Sales'
      ];
    }
  }

  // Update template department access
  static async updateTemplateDepartmentAccess(
    workspaceId: string,
    templateId: string,
    departmentAccess: ReportTemplate['departmentAccess'],
    updatedBy: string
  ): Promise<void> {
    try {
      const templateDoc = this.getTemplateDoc(workspaceId, templateId);
      
      await updateDoc(templateDoc, {
        departmentAccess,
        updatedBy,
        updatedAt: serverTimestamp()
      });

      // Log activity
      try {
        await ActivityService.logActivity(
          'settings_changed',
          'report_template',
          templateId,
          { 
            action: 'department_access_updated',
            accessType: departmentAccess.type,
            allowedDepartments: departmentAccess.allowedDepartments
          },
          workspaceId,
          updatedBy
        );
      } catch (error) {
        console.error('Failed to log department access update activity:', error);
      }
    } catch (error) {
      console.error('Error updating template department access:', error);
      throw new Error(`Failed to update template department access: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get department usage statistics for a template
  static async getDepartmentUsageStats(
    workspaceId: string,
    templateId: string
  ): Promise<{ department: string; totalReports: number; lastUsed?: Date }[]> {
    try {
      const template = await this.getTemplate(workspaceId, templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      return template.usage.departmentUsage || [];
    } catch (error) {
      console.error('Error fetching department usage stats:', error);
      return [];
    }
  }

  // Update department usage when a report is created
  static async updateDepartmentUsage(
    workspaceId: string,
    templateId: string,
    department: string,
    reportStatus: 'draft' | 'submitted' | 'approved' | 'rejected'
  ): Promise<void> {
    try {
      const template = await this.getTemplate(workspaceId, templateId);
      if (!template) {
        return; // Template not found, skip update
      }

      // Update or create department usage entry
      const departmentUsage = template.usage.departmentUsage || [];
      const existingIndex = departmentUsage.findIndex(d => d.department === department);
      
      if (existingIndex >= 0) {
        departmentUsage[existingIndex].totalReports += 1;
        departmentUsage[existingIndex].lastUsed = new Date();
      } else {
        departmentUsage.push({
          department,
          totalReports: 1,
          lastUsed: new Date()
        });
      }

      const templateDoc = this.getTemplateDoc(workspaceId, templateId);
      await updateDoc(templateDoc, {
        'usage.departmentUsage': departmentUsage,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating department usage:', error);
      // Don't throw error as this is not critical
    }
  }

  // Duplicate/Clone a template
  static async cloneTemplate(
    workspaceId: string,
    templateId: string,
    newName: string,
    clonedBy: string
  ): Promise<ReportTemplate> {
    try {
      const originalTemplate = await this.getTemplate(workspaceId, templateId);
      if (!originalTemplate) {
        throw new Error('Original template not found');
      }

      const clonedTemplate: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'usage'> = {
        ...originalTemplate,
        name: newName,
        status: 'draft', // New clones start as draft
        createdBy: clonedBy,
        updatedBy: undefined,
        changeLog: [],
        previousVersions: []
      };

      return await this.createTemplate(workspaceId, clonedTemplate, clonedBy);
    } catch (error) {
      console.error('Error cloning report template:', error);
      throw new Error(`Failed to clone report template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update template usage statistics
  static async updateTemplateUsage(
    workspaceId: string,
    templateId: string,
    reportStatus: 'draft' | 'submitted' | 'approved' | 'rejected'
  ): Promise<void> {
    try {
      const templateDoc = this.getTemplateDoc(workspaceId, templateId);
      
      const updates: any = {
        'usage.totalReports': increment(1),
        'usage.lastUsed': serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Update specific status counts
      switch (reportStatus) {
        case 'draft':
          updates['usage.drafts'] = increment(1);
          break;
        case 'submitted':
          updates['usage.submitted'] = increment(1);
          break;
        case 'approved':
          updates['usage.approved'] = increment(1);
          break;
        case 'rejected':
          updates['usage.rejected'] = increment(1);
          break;
      }

      await updateDoc(templateDoc, updates);
    } catch (error) {
      console.error('Error updating template usage:', error);
      // Don't throw error as this is not critical
    }
  }

  // Get template categories in workspace
  static async getTemplateCategories(workspaceId: string): Promise<string[]> {
    try {
      const templates = await this.getWorkspaceTemplates(workspaceId, { status: 'active' });
      const categories = new Set<string>();
      
      templates.forEach(template => {
        if (template.category) {
          categories.add(template.category);
        }
      });
      
      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error fetching template categories:', error);
      return [];
    }
  }

  // Get template statistics
  static async getTemplateStatistics(workspaceId: string): Promise<{
    totalTemplates: number;
    activeTemplates: number;
    draftTemplates: number;
    archivedTemplates: number;
    totalReports: number;
    recentlyUsed: ReportTemplate[];
    popularTemplates: ReportTemplate[];
  }> {
    try {
      const [allTemplates, recentlyUsedTemplates] = await Promise.all([
        this.getWorkspaceTemplates(workspaceId),
        this.getWorkspaceTemplates(workspaceId, { 
          orderBy: 'lastUsedAt', 
          orderDirection: 'desc', 
          limit: 5 
        })
      ]);

      const stats = {
        totalTemplates: allTemplates.length,
        activeTemplates: allTemplates.filter(t => t.status === 'active').length,
        draftTemplates: allTemplates.filter(t => t.status === 'draft').length,
        archivedTemplates: allTemplates.filter(t => t.status === 'archived').length,
        totalReports: allTemplates.reduce((sum, t) => sum + t.usage.totalReports, 0),
        recentlyUsed: recentlyUsedTemplates.filter(t => t.usage.lastUsed),
        popularTemplates: allTemplates
          .filter(t => t.usage.totalReports > 0)
          .sort((a, b) => b.usage.totalReports - a.usage.totalReports)
          .slice(0, 5)
      };

      return stats;
    } catch (error) {
      console.error('Error fetching template statistics:', error);
      throw new Error(`Failed to fetch template statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate field ID
  static generateFieldId(): string {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create default field
  static createDefaultField(type: ReportFieldType): TemplateFieldDraft {
    const baseField: TemplateFieldDraft = {
      id: this.generateFieldId(),
      label: '',
      type,
      required: false,
      order: 0,
      columnSpan: 1,
      isNew: true
    };

    // Set type-specific defaults
    switch (type) {
      case 'text':
        return {
          ...baseField,
          label: 'Text Field',
          placeholder: 'Enter text...'
        };
      case 'textarea':
        return {
          ...baseField,
          label: 'Long Text Field',
          placeholder: 'Enter detailed text...',
          columnSpan: 2
        };
      case 'number':
        return {
          ...baseField,
          label: 'Number Field',
          validation: { min: 0 }
        };
      case 'date':
        return {
          ...baseField,
          label: 'Date Field'
        };
      case 'dropdown':
        return {
          ...baseField,
          label: 'Dropdown Field',
          options: ['Option 1', 'Option 2']
        };
      case 'checkbox':
        return {
          ...baseField,
          label: 'Checkbox Field'
        };
      case 'file':
        return {
          ...baseField,
          label: 'File Upload',
          acceptedFileTypes: ['pdf', 'doc', 'docx'],
          maxFiles: 1,
          maxFileSize: 10 * 1024 * 1024 // 10MB
        };
      default:
        return baseField;
    }
  }
}

// Helper function to compare arrays
function arrayEquals(a: any[], b: any[]): boolean {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => JSON.stringify(val) === JSON.stringify(b[index]));
} 