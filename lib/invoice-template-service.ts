import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { cleanFirestoreData, createUpdateData } from './firestore-utils';
import { convertTimestamps } from './utils';

export interface InvoiceTemplate {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  category: 'business' | 'service' | 'retail' | 'consulting' | 'freelance' | 'other';
  isDefault: boolean;
  isActive: boolean;
  
  // Branding settings
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  
  // Layout settings
  headerLayout: 'standard' | 'minimal' | 'detailed';
  footerLayout: 'minimal' | 'standard' | 'detailed';
  itemsLayout: 'simple' | 'detailed' | 'grouped';
  
  // Default values
  defaultTerms: string;
  defaultNotes: string;
  defaultDueDays: number;
  
  // Tax settings
  includeTax: boolean;
  defaultTaxRate: number;
  
  // Currency settings
  defaultCurrency: string;
  
  // Usage tracking
  usageCount: number;
  lastUsedAt?: Date;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceTemplateFormData {
  name: string;
  description: string;
  category: InvoiceTemplate['category'];
  isDefault: boolean;
  
  // Branding settings
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  
  // Layout settings
  headerLayout: InvoiceTemplate['headerLayout'];
  footerLayout: InvoiceTemplate['footerLayout'];
  itemsLayout: InvoiceTemplate['itemsLayout'];
  
  // Default values
  defaultTerms: string;
  defaultNotes: string;
  defaultDueDays: number;
  
  // Tax settings
  includeTax: boolean;
  defaultTaxRate: number;
  
  // Currency settings
  defaultCurrency: string;
}

export class InvoiceTemplateService {
  
  /**
   * Create a new invoice template
   */
  static async createTemplate(
    templateData: InvoiceTemplateFormData & { workspaceId: string; createdBy: string }
  ): Promise<string> {
    try {
      const templateRef = doc(collection(db, 'invoiceTemplates'));
      const templateId = templateRef.id;
      
      // If this is set as default, unset other defaults first
      if (templateData.isDefault) {
        await this.unsetDefaultTemplates(templateData.workspaceId);
      }
      
      const template: InvoiceTemplate = {
        id: templateId,
        workspaceId: templateData.workspaceId,
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        isDefault: templateData.isDefault,
        isActive: true,
        logoUrl: templateData.logoUrl,
        primaryColor: templateData.primaryColor,
        secondaryColor: templateData.secondaryColor,
        fontFamily: templateData.fontFamily,
        headerLayout: templateData.headerLayout,
        footerLayout: templateData.footerLayout,
        itemsLayout: templateData.itemsLayout,
        defaultTerms: templateData.defaultTerms,
        defaultNotes: templateData.defaultNotes,
        defaultDueDays: templateData.defaultDueDays,
        includeTax: templateData.includeTax,
        defaultTaxRate: templateData.defaultTaxRate,
        defaultCurrency: templateData.defaultCurrency,
        usageCount: 0,
        createdBy: templateData.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(templateRef, cleanFirestoreData(template));
      return templateId;
    } catch (error) {
      console.error('Error creating invoice template:', error);
      throw error;
    }
  }
  
  /**
   * Get template by ID
   */
  static async getTemplate(templateId: string): Promise<InvoiceTemplate | null> {
    try {
      const docSnap = await getDoc(doc(db, 'invoiceTemplates', templateId));
      if (!docSnap.exists()) return null;
      
      const data = { id: docSnap.id, ...docSnap.data() };
      return convertTimestamps(data) as InvoiceTemplate;
    } catch (error) {
      console.error('Error fetching invoice template:', error);
      return null;
    }
  }
  
  /**
   * Get workspace templates
   */
  static async getWorkspaceTemplates(
    workspaceId: string,
    options?: {
      category?: InvoiceTemplate['category'];
      isActive?: boolean;
      isDefault?: boolean;
      limit?: number;
    }
  ): Promise<InvoiceTemplate[]> {
    try {
      let q = query(
        collection(db, 'invoiceTemplates'),
        where('workspaceId', '==', workspaceId)
      );
      
      if (options?.category) {
        q = query(q, where('category', '==', options.category));
      }
      
      if (options?.isActive !== undefined) {
        q = query(q, where('isActive', '==', options.isActive));
      }
      
      if (options?.isDefault !== undefined) {
        q = query(q, where('isDefault', '==', options.isDefault));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (options?.limit) {
        q = query(q, limit(options.limit));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        return convertTimestamps(data) as InvoiceTemplate;
      });
    } catch (error) {
      console.error('Error fetching workspace templates:', error);
      throw error;
    }
  }
  
  /**
   * Update template
   */
  static async updateTemplate(
    templateId: string, 
    updates: Partial<InvoiceTemplateFormData>
  ): Promise<void> {
    try {
      // If setting as default, unset other defaults first
      if (updates.isDefault) {
        const template = await this.getTemplate(templateId);
        if (template) {
          await this.unsetDefaultTemplates(template.workspaceId, templateId);
        }
      }
      
      const updateData = createUpdateData(cleanFirestoreData({
        ...updates,
        updatedAt: new Date()
      }));
      
      await updateDoc(doc(db, 'invoiceTemplates', templateId), updateData);
    } catch (error) {
      console.error('Error updating invoice template:', error);
      throw error;
    }
  }
  
  /**
   * Delete template
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    try {
      const template = await this.getTemplate(templateId);
      if (template?.isDefault) {
        throw new Error('Cannot delete default template');
      }
      
      await deleteDoc(doc(db, 'invoiceTemplates', templateId));
    } catch (error) {
      console.error('Error deleting invoice template:', error);
      throw error;
    }
  }
  
  /**
   * Set template as default
   */
  static async setDefaultTemplate(templateId: string): Promise<void> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Unset other defaults first
      await this.unsetDefaultTemplates(template.workspaceId, templateId);
      
      // Set this template as default
      await updateDoc(doc(db, 'invoiceTemplates', templateId), {
        isDefault: true,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error setting default template:', error);
      throw error;
    }
  }
  
  /**
   * Duplicate template
   */
  static async duplicateTemplate(
    templateId: string, 
    newName: string,
    createdBy: string
  ): Promise<string> {
    try {
      const originalTemplate = await this.getTemplate(templateId);
      if (!originalTemplate) {
        throw new Error('Template not found');
      }
      
      const templateData: InvoiceTemplateFormData = {
        name: newName,
        description: originalTemplate.description,
        category: originalTemplate.category,
        isDefault: false, // Duplicates are never default
        logoUrl: originalTemplate.logoUrl,
        primaryColor: originalTemplate.primaryColor,
        secondaryColor: originalTemplate.secondaryColor,
        fontFamily: originalTemplate.fontFamily,
        headerLayout: originalTemplate.headerLayout,
        footerLayout: originalTemplate.footerLayout,
        itemsLayout: originalTemplate.itemsLayout,
        defaultTerms: originalTemplate.defaultTerms,
        defaultNotes: originalTemplate.defaultNotes,
        defaultDueDays: originalTemplate.defaultDueDays,
        includeTax: originalTemplate.includeTax,
        defaultTaxRate: originalTemplate.defaultTaxRate,
        defaultCurrency: originalTemplate.defaultCurrency
      };
      
      return await this.createTemplate({
        ...templateData,
        workspaceId: originalTemplate.workspaceId,
        createdBy
      });
    } catch (error) {
      console.error('Error duplicating template:', error);
      throw error;
    }
  }
  
  /**
   * Increment template usage count
   */
  static async incrementUsageCount(templateId: string): Promise<void> {
    try {
      const template = await this.getTemplate(templateId);
      if (template) {
        await updateDoc(doc(db, 'invoiceTemplates', templateId), {
          usageCount: template.usageCount + 1,
          lastUsedAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      // Don't throw error for usage tracking failures
    }
  }
  
  /**
   * Get default template for workspace
   */
  static async getDefaultTemplate(workspaceId: string): Promise<InvoiceTemplate | null> {
    try {
      const templates = await this.getWorkspaceTemplates(workspaceId, {
        isDefault: true,
        isActive: true,
        limit: 1
      });
      
      return templates.length > 0 ? templates[0] : null;
    } catch (error) {
      console.error('Error fetching default template:', error);
      return null;
    }
  }
  
  /**
   * Get template analytics
   */
  static async getTemplateAnalytics(workspaceId: string): Promise<{
    totalTemplates: number;
    activeTemplates: number;
    mostUsedTemplate: { template: InvoiceTemplate; usageCount: number } | null;
    categoryBreakdown: { category: string; count: number }[];
    averageUsage: number;
  }> {
    try {
      const templates = await this.getWorkspaceTemplates(workspaceId);
      
      const totalTemplates = templates.length;
      const activeTemplates = templates.filter(t => t.isActive).length;
      
      // Most used template
      const sortedByUsage = templates
        .filter(t => t.isActive)
        .sort((a, b) => b.usageCount - a.usageCount);
      const mostUsedTemplate = sortedByUsage.length > 0 
        ? { template: sortedByUsage[0], usageCount: sortedByUsage[0].usageCount }
        : null;
      
      // Category breakdown
      const categoryMap = templates.reduce((acc, template) => {
        acc[template.category] = (acc[template.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({
        category,
        count
      }));
      
      // Average usage
      const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
      const averageUsage = activeTemplates > 0 ? totalUsage / activeTemplates : 0;
      
      return {
        totalTemplates,
        activeTemplates,
        mostUsedTemplate,
        categoryBreakdown,
        averageUsage
      };
    } catch (error) {
      console.error('Error getting template analytics:', error);
      throw error;
    }
  }
  
  // ===== HELPER METHODS =====
  
  /**
   * Unset default templates for workspace
   */
  private static async unsetDefaultTemplates(
    workspaceId: string, 
    excludeTemplateId?: string
  ): Promise<void> {
    try {
      const defaultTemplates = await this.getWorkspaceTemplates(workspaceId, {
        isDefault: true
      });
      
      const batch = writeBatch(db);
      
      defaultTemplates
        .filter(template => template.id !== excludeTemplateId)
        .forEach(template => {
          batch.update(doc(db, 'invoiceTemplates', template.id), {
            isDefault: false,
            updatedAt: new Date()
          });
        });
      
      if (defaultTemplates.length > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error unsetting default templates:', error);
      throw error;
    }
  }
}