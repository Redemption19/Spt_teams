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
import { 
  Invoice, 
  InvoiceItem, 
  InvoiceFormData,
  Expense
} from './types/financial-types';
import { cleanFirestoreData, createUpdateData } from './firestore-utils';

export class InvoiceService {
  
  /**
   * Create a new invoice
   */
  static async createInvoice(
    workspaceId: string, 
    invoiceData: InvoiceFormData, 
    createdBy: string
  ): Promise<string> {
    try {
      const invoiceRef = doc(collection(db, 'invoices'));
      const invoiceId = invoiceRef.id;
      
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(workspaceId);
      
      // Calculate totals
      const subtotal = invoiceData.items.reduce((sum, item) => 
        sum + (item.quantity * item.unitPrice), 0
      );
      const taxAmount = subtotal * (invoiceData.taxRate / 100);
      const discount = invoiceData.discount || 0;
      const total = subtotal + taxAmount - discount;
      
      // Create invoice items with IDs
      const items: InvoiceItem[] = invoiceData.items.map((item, index) => ({
        id: `${invoiceId}_item_${index}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice
      }));
      
      const invoice: Invoice = {
        id: invoiceId,
        invoiceNumber,
        workspaceId,
        clientId: invoiceData.clientId,
        projectId: invoiceData.projectId,
        type: invoiceData.type,
        status: 'draft',
        items,
        subtotal,
        taxRate: invoiceData.taxRate,
        taxAmount,
        discount,
        total,
        currency: invoiceData.currency,
        issueDate: new Date(),
        dueDate: invoiceData.dueDate,
        notes: invoiceData.notes,
        terms: invoiceData.terms,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(invoiceRef, cleanFirestoreData(invoice));
      return invoiceId;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }
  
  /**
   * Create invoice from expenses
   */
  static async createInvoiceFromExpenses(
    workspaceId: string,
    expenseIds: string[],
    clientId: string,
    createdBy: string,
    additionalData?: Partial<InvoiceFormData>
  ): Promise<string> {
    try {
      // Get expense details
      const expenses = await Promise.all(
        expenseIds.map(id => this.getExpense(id))
      );
      
      const validExpenses = expenses.filter(expense => 
        expense && expense.billable && expense.status === 'approved'
      ) as Expense[];
      
      if (validExpenses.length === 0) {
        throw new Error('No valid billable expenses found');
      }
      
      // Create invoice items from expenses
      const items = validExpenses.map(expense => ({
        description: expense.title + (expense.description ? ` - ${expense.description}` : ''),
        quantity: 1,
        unitPrice: expense.amountInBaseCurrency
      }));
      
      const invoiceData: InvoiceFormData = {
        clientId,
        type: 'expense_reimbursement',
        items,
        taxRate: additionalData?.taxRate || 0,
        discount: additionalData?.discount,
        currency: 'USD', // Base currency
        dueDate: additionalData?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        notes: additionalData?.notes,
        terms: additionalData?.terms
      };
      
      const invoiceId = await this.createInvoice(workspaceId, invoiceData, createdBy);
      
      // Update expenses with invoice reference
      const batch = writeBatch(db);
      validExpenses.forEach(expense => {
        batch.update(doc(db, 'expenses', expense.id), {
          invoiceId,
          updatedAt: new Date()
        });
      });
      await batch.commit();
      
      return invoiceId;
    } catch (error) {
      console.error('Error creating invoice from expenses:', error);
      throw error;
    }
  }
  
  /**
   * Get invoice by ID
   */
  static async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const docSnap = await getDoc(doc(db, 'invoices', invoiceId));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Invoice : null;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }
  
  /**
   * Get workspace invoices
   */
  static async getWorkspaceInvoices(
    workspaceId: string, 
    options?: {
      status?: Invoice['status'];
      clientId?: string;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Invoice[]> {
    try {
      let q = query(
        collection(db, 'invoices'),
        where('workspaceId', '==', workspaceId)
      );
      
      if (options?.status) {
        q = query(q, where('status', '==', options.status));
      }
      
      if (options?.clientId) {
        q = query(q, where('clientId', '==', options.clientId));
      }
      
      if (options?.startDate) {
        q = query(q, where('issueDate', '>=', options.startDate));
      }
      
      if (options?.endDate) {
        q = query(q, where('issueDate', '<=', options.endDate));
      }
      
      q = query(q, orderBy('issueDate', 'desc'));
      
      if (options?.limit) {
        q = query(q, limit(options.limit));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
    } catch (error) {
      console.error('Error fetching workspace invoices:', error);
      throw error;
    }
  }
  
  /**
   * Update invoice
   */
  static async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<void> {
    try {
      const updateData = createUpdateData(cleanFirestoreData(updates));
      await updateDoc(doc(db, 'invoices', invoiceId), updateData);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }
  
  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(
    invoiceId: string, 
    status: Invoice['status'],
    paymentDate?: Date,
    paymentMethod?: string
  ): Promise<void> {
    try {
      const updates: any = {
        status,
        updatedAt: new Date()
      };
      
      if (status === 'paid' && paymentDate) {
        updates.paidDate = paymentDate;
        updates.paymentMethod = paymentMethod;
      }
      
      await updateDoc(doc(db, 'invoices', invoiceId), updates);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  }
  
  /**
   * Send invoice to client
   */
  static async sendInvoice(invoiceId: string, recipientEmail?: string): Promise<void> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      // Update status to sent
      await this.updateInvoiceStatus(invoiceId, 'sent');
      
      // TODO: Integrate with email service to send invoice
      // For now, just log the action
      console.log(`Invoice ${invoice.invoiceNumber} sent to ${recipientEmail || 'client'}`);
      
      // Record activity
      await this.recordInvoiceActivity(invoiceId, 'sent', `Invoice sent to ${recipientEmail || 'client'}`);
    } catch (error) {
      console.error('Error sending invoice:', error);
      throw error;
    }
  }
  
  /**
   * Delete invoice
   */
  static async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'invoices', invoiceId));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }
  
  /**
   * Get invoice analytics
   */
  static async getInvoiceAnalytics(workspaceId: string, dateRange?: { start: Date; end: Date }): Promise<{
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    statusBreakdown: { [status: string]: number };
    monthlyTrend: { month: string; amount: number; count: number }[];
    averageInvoiceValue: number;
    paymentTimeAverage: number; // Days
  }> {
    try {
      let q = query(
        collection(db, 'invoices'),
        where('workspaceId', '==', workspaceId)
      );
      
      if (dateRange) {
        q = query(q, 
          where('issueDate', '>=', dateRange.start),
          where('issueDate', '<=', dateRange.end)
        );
      }
      
      const snapshot = await getDocs(q);
      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
      
      const totalInvoices = invoices.length;
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
      
      const now = new Date();
      const pendingInvoices = invoices.filter(inv => 
        ['draft', 'sent'].includes(inv.status) && inv.dueDate > now
      );
      const overdueInvoices = invoices.filter(inv => 
        ['sent'].includes(inv.status) && inv.dueDate <= now
      );
      
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);
      
      // Status breakdown
      const statusBreakdown = invoices.reduce((acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      }, {} as { [status: string]: number });
      
      // Monthly trend (simplified)
      const monthlyTrend: { month: string; amount: number; count: number }[] = [];
      
      // Average values
      const averageInvoiceValue = totalInvoices > 0 ? totalAmount / totalInvoices : 0;
      
      // Payment time average
      const paymentTimes = paidInvoices
        .filter(inv => inv.paidDate && inv.issueDate)
        .map(inv => {
          const diffTime = inv.paidDate!.getTime() - inv.issueDate.getTime();
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
        });
      
      const paymentTimeAverage = paymentTimes.length > 0 
        ? paymentTimes.reduce((sum, days) => sum + days, 0) / paymentTimes.length 
        : 0;
      
      return {
        totalInvoices,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        statusBreakdown,
        monthlyTrend,
        averageInvoiceValue,
        paymentTimeAverage
      };
    } catch (error) {
      console.error('Error getting invoice analytics:', error);
      throw error;
    }
  }
  
  /**
   * Generate invoice PDF (placeholder)
   */
  static async generateInvoicePDF(invoiceId: string): Promise<string> {
    try {
      // TODO: Implement PDF generation
      // For now, return a placeholder URL
      return `https://api.yourplatform.com/invoices/${invoiceId}/pdf`;
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw error;
    }
  }
  
  // ===== HELPER METHODS =====
  
  /**
   * Generate unique invoice number
   */
  private static async generateInvoiceNumber(workspaceId: string): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Get count of invoices this month
      const startOfMonth = new Date(year, new Date().getMonth(), 1);
      const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);
      
      const q = query(
        collection(db, 'invoices'),
        where('workspaceId', '==', workspaceId),
        where('issueDate', '>=', startOfMonth),
        where('issueDate', '<=', endOfMonth)
      );
      
      const snapshot = await getDocs(q);
      const invoiceCount = snapshot.size + 1;
      
      return `INV-${year}${month}-${String(invoiceCount).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      return `INV-${Date.now()}`;
    }
  }
  
  /**
   * Get expense by ID (placeholder - should use ExpenseService)
   */
  private static async getExpense(expenseId: string): Promise<Expense | null> {
    try {
      const docSnap = await getDoc(doc(db, 'expenses', expenseId));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Expense : null;
    } catch (error) {
      console.error('Error fetching expense:', error);
      return null;
    }
  }
  
  /**
   * Record invoice activity
   */
  private static async recordInvoiceActivity(
    invoiceId: string, 
    action: string, 
    details: string
  ): Promise<void> {
    try {
      // TODO: Integrate with activity service
      console.log(`Invoice ${invoiceId}: ${action} - ${details}`);
    } catch (error) {
      console.error('Error recording invoice activity:', error);
    }
  }
}
