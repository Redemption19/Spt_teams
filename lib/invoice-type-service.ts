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
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { cleanFirestoreData, createUpdateData } from './firestore-utils';
import { convertTimestamps } from './utils';

export interface InvoiceType {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  code: string; // Short code like 'SRV', 'PRJ', etc.
  category: 'service' | 'product' | 'subscription' | 'consulting' | 'other';
  defaultTerms?: string;
  defaultNotes?: string;
  defaultDueDays: number;
  defaultTaxRate?: number;
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceTypeFormData {
  name: string;
  description?: string;
  code: string;
  category: InvoiceType['category'];
  defaultTerms?: string;
  defaultNotes?: string;
  defaultDueDays: number;
  defaultTaxRate?: number;
  isDefault: boolean;
}

export class InvoiceTypeService {
  
  /**
   * Create a new invoice type
   */
  static async createInvoiceType(
    workspaceId: string, 
    typeData: InvoiceTypeFormData, 
    createdBy: string
  ): Promise<string> {
    try {
      const typeRef = doc(collection(db, 'invoiceTypes'));
      const typeId = typeRef.id;
      
      // If this is set as default, unset other defaults first
      if (typeData.isDefault) {
        await this.unsetDefaultTypes(workspaceId);
      }
      
      const invoiceType: InvoiceType = {
        id: typeId,
        workspaceId,
        name: typeData.name,
        description: typeData.description,
        code: typeData.code.toUpperCase(),
        category: typeData.category,
        defaultTerms: typeData.defaultTerms,
        defaultNotes: typeData.defaultNotes,
        defaultDueDays: typeData.defaultDueDays,
        defaultTaxRate: typeData.defaultTaxRate,
        isActive: true,
        isDefault: typeData.isDefault,
        usageCount: 0,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(typeRef, cleanFirestoreData(invoiceType));
      return typeId;
    } catch (error) {
      console.error('Error creating invoice type:', error);
      throw error;
    }
  }
  
  /**
   * Get invoice type by ID
   */
  static async getInvoiceType(typeId: string): Promise<InvoiceType | null> {
    try {
      const typeDoc = await getDoc(doc(db, 'invoiceTypes', typeId));
      
      if (!typeDoc.exists()) {
        return null;
      }
      
      const data = typeDoc.data();
      return convertTimestamps(data) as InvoiceType;
    } catch (error) {
      console.error('Error getting invoice type:', error);
      throw error;
    }
  }
  
  /**
   * Get all invoice types for a workspace
   */
  static async getWorkspaceInvoiceTypes(workspaceId: string): Promise<InvoiceType[]> {
    try {
      const q = query(
        collection(db, 'invoiceTypes'),
        where('workspaceId', '==', workspaceId),
        where('isActive', '==', true),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      const types: InvoiceType[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        types.push(convertTimestamps(data) as InvoiceType);
      });
      
      return types;
    } catch (error) {
      console.error('Error getting workspace invoice types:', error);
      throw error;
    }
  }
  
  /**
   * Get default invoice type for workspace
   */
  static async getDefaultInvoiceType(workspaceId: string): Promise<InvoiceType | null> {
    try {
      const q = query(
        collection(db, 'invoiceTypes'),
        where('workspaceId', '==', workspaceId),
        where('isDefault', '==', true),
        where('isActive', '==', true),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return convertTimestamps(data) as InvoiceType;
    } catch (error) {
      console.error('Error getting default invoice type:', error);
      throw error;
    }
  }
  
  /**
   * Update invoice type
   */
  static async updateInvoiceType(
    typeId: string, 
    updates: Partial<InvoiceTypeFormData>
  ): Promise<void> {
    try {
      const typeRef = doc(db, 'invoiceTypes', typeId);
      
      // If setting as default, unset other defaults first
      if (updates.isDefault) {
        const currentType = await this.getInvoiceType(typeId);
        if (currentType) {
          await this.unsetDefaultTypes(currentType.workspaceId);
        }
      }
      
      // Prepare update data and clean undefined values
      const cleanedUpdates = cleanFirestoreData({
        ...updates,
        code: updates.code ? updates.code.toUpperCase() : undefined,
        updatedAt: new Date()
      });
      
      const updateData = createUpdateData(cleanedUpdates);
      
      await updateDoc(typeRef, updateData);
    } catch (error) {
      console.error('Error updating invoice type:', error);
      throw error;
    }
  }
  
  /**
   * Delete invoice type (soft delete)
   */
  static async deleteInvoiceType(typeId: string): Promise<void> {
    try {
      const typeRef = doc(db, 'invoiceTypes', typeId);
      await updateDoc(typeRef, {
        isActive: false,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error deleting invoice type:', error);
      throw error;
    }
  }
  
  /**
   * Increment usage count
   */
  static async incrementUsageCount(typeId: string): Promise<void> {
    try {
      const typeRef = doc(db, 'invoiceTypes', typeId);
      const typeDoc = await getDoc(typeRef);
      
      if (typeDoc.exists()) {
        const currentCount = typeDoc.data().usageCount || 0;
        await updateDoc(typeRef, {
          usageCount: currentCount + 1,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      throw error;
    }
  }
  
  /**
   * Unset default types for workspace
   */
  private static async unsetDefaultTypes(workspaceId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'invoiceTypes'),
        where('workspaceId', '==', workspaceId),
        where('isDefault', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { isDefault: false });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error unsetting default types:', error);
      throw error;
    }
  }
  
  /**
   * Get invoice type analytics
   */
  static async getInvoiceTypeAnalytics(workspaceId: string) {
    try {
      const types = await this.getWorkspaceInvoiceTypes(workspaceId);
      
      const totalTypes = types.length;
      const activeTypes = types.filter(type => type.isActive).length;
      const defaultType = types.find(type => type.isDefault);
      
      // Most used type
      const mostUsedType = types.reduce((prev, current) => 
        (prev.usageCount > current.usageCount) ? prev : current
      );
      
      // Category breakdown
      const categoryBreakdown = types.reduce((acc, type) => {
        acc[type.category] = (acc[type.category] || 0) + 1;
        return acc;
      }, {} as { [category: string]: number });
      
      // Total usage
      const totalUsage = types.reduce((sum, type) => sum + type.usageCount, 0);
      
      return {
        totalTypes,
        activeTypes,
        defaultType: defaultType?.name || 'None',
        mostUsedType: mostUsedType?.name || 'None',
        categoryBreakdown,
        totalUsage,
        averageUsage: totalTypes > 0 ? totalUsage / totalTypes : 0
      };
    } catch (error) {
      console.error('Error getting invoice type analytics:', error);
      throw error;
    }
  }
}