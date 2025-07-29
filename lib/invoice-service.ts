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
      if (!docSnap.exists()) return null;
      
      const data = { id: docSnap.id, ...docSnap.data() } as Invoice;
      
      // Convert Firestore timestamps to Date objects
      const convertTimestamp = (timestamp: any): Date => {
        if (!timestamp) return new Date();
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        if (timestamp instanceof Date) {
          return timestamp;
        }
        return new Date(timestamp);
      };
      
      return {
        ...data,
        issueDate: convertTimestamp(data.issueDate),
        dueDate: convertTimestamp(data.dueDate),
        paidDate: data.paidDate ? convertTimestamp(data.paidDate) : undefined,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      };
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }
  
  /**
   * Get invoices from all sub-workspaces under a main workspace
   */
  static async getSubWorkspaceInvoices(
    mainWorkspaceId: string,
    options?: {
      status?: Invoice['status'];
      clientId?: string;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Invoice[]> {
    try {
      // Import WorkspaceService to get sub-workspaces
      const { WorkspaceService } = await import('./workspace-service');
      
      // Get all sub-workspaces under the main workspace
      const subWorkspaces = await WorkspaceService.getSubWorkspaces(mainWorkspaceId);
      
      if (subWorkspaces.length === 0) {
        return [];
      }
      
      // Get invoices from all sub-workspaces
      const invoicePromises = subWorkspaces.map(subWorkspace => 
        this.getWorkspaceInvoices(subWorkspace.id, options)
      );
      
      const results = await Promise.all(invoicePromises);
      const allInvoices = results.flat();
      
      // Sort by issue date descending
      allInvoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
      
      // Apply limit if specified
      if (options?.limit) {
        return allInvoices.slice(0, options.limit);
      }
      
      return allInvoices;
    } catch (error) {
      console.error('Error fetching sub-workspace invoices:', error);
      throw error;
    }
  }
  
  /**
   * Get invoices from entire workspace hierarchy (main + all sub-workspaces)
   */
  static async getHierarchicalInvoices(
    workspaceId: string,
    options?: {
      status?: Invoice['status'];
      clientId?: string;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      includeSubWorkspaces?: boolean;
    }
  ): Promise<{
    invoices: Invoice[];
    workspaceBreakdown: { [workspaceId: string]: { name: string; count: number; total: number } };
  }> {
    try {
      const { WorkspaceService } = await import('./workspace-service');
      
      // Get the current workspace
      const currentWorkspace = await WorkspaceService.getWorkspace(workspaceId);
      if (!currentWorkspace) {
        throw new Error('Workspace not found');
      }
      
      let allInvoices: Invoice[] = [];
      const workspaceBreakdown: { [workspaceId: string]: { name: string; count: number; total: number } } = {};
      
      // Determine the main workspace ID
      let mainWorkspaceId = workspaceId;
      if (currentWorkspace.workspaceType === 'sub' && currentWorkspace.parentWorkspaceId) {
        mainWorkspaceId = currentWorkspace.parentWorkspaceId;
      }
      
      // Get invoices from main workspace
      const mainWorkspaceInvoices = await this.getWorkspaceInvoices(mainWorkspaceId, options);
      allInvoices.push(...mainWorkspaceInvoices);
      
      // Add to breakdown
      const mainWorkspace = await WorkspaceService.getWorkspace(mainWorkspaceId);
      if (mainWorkspace) {
        workspaceBreakdown[mainWorkspaceId] = {
          name: mainWorkspace.name,
          count: mainWorkspaceInvoices.length,
          total: mainWorkspaceInvoices.reduce((sum, inv) => sum + inv.total, 0)
        };
      }
      
      // Get invoices from sub-workspaces if requested
      if (options?.includeSubWorkspaces !== false) {
        const subWorkspaces = await WorkspaceService.getSubWorkspaces(mainWorkspaceId);
        
        for (const subWorkspace of subWorkspaces) {
          const subWorkspaceInvoices = await this.getWorkspaceInvoices(subWorkspace.id, options);
          allInvoices.push(...subWorkspaceInvoices);
          
          workspaceBreakdown[subWorkspace.id] = {
            name: subWorkspace.name,
            count: subWorkspaceInvoices.length,
            total: subWorkspaceInvoices.reduce((sum, inv) => sum + inv.total, 0)
          };
        }
      }
      
      // Sort by issue date descending
      allInvoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
      
      // Apply limit if specified
      if (options?.limit) {
        allInvoices = allInvoices.slice(0, options.limit);
      }
      
      return {
        invoices: allInvoices,
        workspaceBreakdown
      };
    } catch (error) {
      console.error('Error fetching hierarchical invoices:', error);
      throw error;
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
      
      // Convert Firestore timestamps to Date objects
      const convertTimestamp = (timestamp: any): Date => {
        if (!timestamp) return new Date();
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        if (timestamp instanceof Date) {
          return timestamp;
        }
        return new Date(timestamp);
      };
      
      return snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() } as Invoice;
        
        return {
          ...data,
          issueDate: convertTimestamp(data.issueDate),
          dueDate: convertTimestamp(data.dueDate),
          paidDate: data.paidDate ? convertTimestamp(data.paidDate) : undefined,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        };
      });
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
   * Get hierarchical invoice analytics (main workspace + all sub-workspaces)
   */
  static async getHierarchicalInvoiceAnalytics(
    workspaceId: string, 
    dateRange?: { start: Date; end: Date },
    includeSubWorkspaces: boolean = true
  ): Promise<{
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    statusBreakdown: { [status: string]: number };
    monthlyTrend: { month: string; amount: number; count: number }[];
    averageInvoiceValue: number;
    paymentTimeAverage: number;
    workspaceBreakdown: { [workspaceId: string]: {
      name: string;
      totalInvoices: number;
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
    } };
  }> {
    try {
      const { WorkspaceService } = await import('./workspace-service');
      
      // Get the current workspace
      const currentWorkspace = await WorkspaceService.getWorkspace(workspaceId);
      if (!currentWorkspace) {
        throw new Error('Workspace not found');
      }
      
      // Determine the main workspace ID
      let mainWorkspaceId = workspaceId;
      if (currentWorkspace.workspaceType === 'sub' && currentWorkspace.parentWorkspaceId) {
        mainWorkspaceId = currentWorkspace.parentWorkspaceId;
      }
      
      const workspaceBreakdown: { [workspaceId: string]: {
        name: string;
        totalInvoices: number;
        totalAmount: number;
        paidAmount: number;
        pendingAmount: number;
      } } = {};
      
      let allInvoices: Invoice[] = [];
      
      // Get invoices from main workspace
      const mainWorkspaceInvoices = await this.getWorkspaceInvoices(mainWorkspaceId, {
        startDate: dateRange?.start,
        endDate: dateRange?.end
      });
      allInvoices.push(...mainWorkspaceInvoices);
      
      // Add main workspace to breakdown
      const mainWorkspace = await WorkspaceService.getWorkspace(mainWorkspaceId);
      if (mainWorkspace) {
        const mainPaidAmount = mainWorkspaceInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.total, 0);
        const mainPendingAmount = mainWorkspaceInvoices
          .filter(inv => inv.status === 'sent' || inv.status === 'draft')
          .reduce((sum, inv) => sum + inv.total, 0);
          
        workspaceBreakdown[mainWorkspaceId] = {
          name: mainWorkspace.name,
          totalInvoices: mainWorkspaceInvoices.length,
          totalAmount: mainWorkspaceInvoices.reduce((sum, inv) => sum + inv.total, 0),
          paidAmount: mainPaidAmount,
          pendingAmount: mainPendingAmount
        };
      }
      
      // Get invoices from sub-workspaces if requested
      if (includeSubWorkspaces) {
        const subWorkspaces = await WorkspaceService.getSubWorkspaces(mainWorkspaceId);
        
        for (const subWorkspace of subWorkspaces) {
          const subWorkspaceInvoices = await this.getWorkspaceInvoices(subWorkspace.id, {
            startDate: dateRange?.start,
            endDate: dateRange?.end
          });
          allInvoices.push(...subWorkspaceInvoices);
          
          const subPaidAmount = subWorkspaceInvoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);
          const subPendingAmount = subWorkspaceInvoices
            .filter(inv => inv.status === 'sent' || inv.status === 'draft')
            .reduce((sum, inv) => sum + inv.total, 0);
            
          workspaceBreakdown[subWorkspace.id] = {
            name: subWorkspace.name,
            totalInvoices: subWorkspaceInvoices.length,
            totalAmount: subWorkspaceInvoices.reduce((sum, inv) => sum + inv.total, 0),
            paidAmount: subPaidAmount,
            pendingAmount: subPendingAmount
          };
        }
      }
      
      // Calculate analytics from all invoices
      const totalInvoices = allInvoices.length;
      const totalAmount = allInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
      const paidAmount = allInvoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.total, 0);
      const pendingAmount = allInvoices
        .filter(invoice => invoice.status === 'sent' || invoice.status === 'draft')
        .reduce((sum, invoice) => sum + invoice.total, 0);
      
      const now = new Date();
      const overdueAmount = allInvoices
        .filter(invoice => {
          const convertTimestamp = (timestamp: any): Date => {
            if (!timestamp) return new Date();
            if (timestamp.toDate && typeof timestamp.toDate === 'function') {
              return timestamp.toDate();
            }
            if (timestamp instanceof Date) {
              return timestamp;
            }
            return new Date(timestamp);
          };
          
          const dueDate = convertTimestamp(invoice.dueDate);
          return invoice.status !== 'paid' && dueDate < now;
        })
        .reduce((sum, invoice) => sum + invoice.total, 0);
      
      // Status breakdown
      const statusBreakdown = allInvoices.reduce((acc, invoice) => {
        const convertTimestamp = (timestamp: any): Date => {
          if (!timestamp) return new Date();
          if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
          }
          if (timestamp instanceof Date) {
            return timestamp;
          }
          return new Date(timestamp);
        };
        
        const dueDate = convertTimestamp(invoice.dueDate);
        const status = invoice.status !== 'paid' && dueDate < now ? 'overdue' : invoice.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as { [status: string]: number });
      
      // Monthly trend
      const monthlyData = allInvoices.reduce((acc, invoice) => {
        const convertTimestamp = (timestamp: any): Date => {
          if (!timestamp) return new Date();
          if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
          }
          if (timestamp instanceof Date) {
            return timestamp;
          }
          return new Date(timestamp);
        };
        
        const issueDate = convertTimestamp(invoice.issueDate);
        const monthKey = `${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = { amount: 0, count: 0 };
        }
        
        acc[monthKey].amount += invoice.total;
        acc[monthKey].count += 1;
        
        return acc;
      }, {} as { [month: string]: { amount: number; count: number } });
      
      const monthlyTrend = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));
      
      // Calculate averages
      const averageInvoiceValue = totalInvoices > 0 ? totalAmount / totalInvoices : 0;
      
      // Payment time average (for paid invoices)
      const paidInvoices = allInvoices.filter(invoice => invoice.status === 'paid' && invoice.paidDate);
      const paymentTimeAverage = paidInvoices.length > 0 
        ? paidInvoices.reduce((sum, invoice) => {
            const convertTimestamp = (timestamp: any): Date => {
              if (!timestamp) return new Date();
              if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                return timestamp.toDate();
              }
              if (timestamp instanceof Date) {
                return timestamp;
              }
              return new Date(timestamp);
            };
            
            const issueDate = convertTimestamp(invoice.issueDate);
            const paidDate = convertTimestamp(invoice.paidDate!);
            const daysDiff = Math.ceil((paidDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
          }, 0) / paidInvoices.length
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
        paymentTimeAverage,
        workspaceBreakdown
      };
    } catch (error) {
      console.error('Error fetching hierarchical invoice analytics:', error);
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
      
      // Convert Firestore timestamps to Date objects
      const convertTimestamp = (timestamp: any): Date => {
        if (!timestamp) return new Date();
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        if (timestamp instanceof Date) {
          return timestamp;
        }
        return new Date(timestamp);
      };
      
      const invoices = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() } as Invoice;
        
        return {
          ...data,
          issueDate: convertTimestamp(data.issueDate),
          dueDate: convertTimestamp(data.dueDate),
          paidDate: data.paidDate ? convertTimestamp(data.paidDate) : undefined,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        };
      });
      
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
   * Generate invoice PDF using jsPDF and html2canvas
   */
  static async generateInvoicePDF(invoiceId: string): Promise<void> {
    try {
      // Dynamic imports to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      // Get the invoice data
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Get client data if clientId exists
      let client = null;
      if (invoice.clientId) {
        const { ClientService } = await import('./client-service');
        client = await ClientService.getClient(invoice.clientId);
      }

      // Create a temporary container for the invoice content
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.background = 'white';
      tempContainer.style.padding = '20mm';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Generate HTML content for the invoice
      tempContainer.innerHTML = this.generateInvoiceHTML(invoice, client);
      document.body.appendChild(tempContainer);

      try {
        // Convert HTML to canvas
        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 794, // A4 width in pixels at 96 DPI
          height: 1123 // A4 height in pixels at 96 DPI
        });

        // Create PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Save the PDF
        const fileName = `invoice-${invoice.invoiceNumber || invoiceId}.pdf`;
        pdf.save(fileName);

      } finally {
        // Clean up temporary container
        document.body.removeChild(tempContainer);
      }

    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw new Error('Failed to generate PDF. Please try again.');
    }
  }

  /**
   * Generate HTML content for PDF
   */
  private static generateInvoiceHTML(invoice: Invoice, client?: any): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: invoice.currency || 'USD'
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(new Date(date));
    };

    const itemsHTML = invoice.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(item.amount)}</td>
      </tr>
    `).join('');

    return `
      <div style="max-width: 800px; margin: 0 auto; background: white; font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #3b82f6;">
          <h1 style="font-size: 32px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">ABC Company</h1>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">123 Business Street, Accra, Ghana</p>
        </div>

        <!-- Invoice Title -->
        <div style="text-align: right; margin-bottom: 40px;">
          <h2 style="font-size: 36px; font-weight: bold; color: #3b82f6; margin: 0;">INVOICE</h2>
        </div>

        <!-- Invoice Details and Bill To -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div style="flex: 1;">
            <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">Bill To:</h3>
            <div style="color: #4b5563;">
              <p style="margin: 0 0 4px 0; font-weight: 600;">${client?.name || 'Client Name'}</p>
              ${client?.company ? `<p style="margin: 0 0 4px 0;">${client.company}</p>` : ''}
              <p style="margin: 0 0 4px 0;">${client?.email || 'client@example.com'}</p>
              ${client?.phone ? `<p style="margin: 0 0 4px 0;">${client.phone}</p>` : '<p style="margin: 0 0 4px 0;">+233 XX XXX XXXX</p>'}
              ${client?.address ? `<p style="margin: 0;">${client.address}</p>` : ''}
            </div>
          </div>
          <div style="flex: 1; text-align: right;">
            <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">Invoice Details:</h3>
            <div style="color: #4b5563;">
              <p style="margin: 0 0 8px 0;"><span style="font-weight: 600;">Invoice #:</span> ${invoice.invoiceNumber}</p>
              <p style="margin: 0 0 8px 0;"><span style="font-weight: 600;">Date:</span> ${formatDate(invoice.issueDate)}</p>
              <p style="margin: 0 0 8px 0;"><span style="font-weight: 600;">Due Date:</span> ${formatDate(invoice.dueDate)}</p>
              <p style="margin: 0;"><span style="font-weight: 600;">Currency:</span> ${invoice.currency}</p>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div style="margin-bottom: 40px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">Items:</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 16px 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">DESCRIPTION</th>
                <th style="padding: 16px 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">QTY</th>
                <th style="padding: 16px 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">UNIT PRICE</th>
                <th style="padding: 16px 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
          <div style="width: 300px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280;">Subtotal:</span>
              <span style="font-weight: 600;">${formatCurrency(invoice.subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280;">Tax (${invoice.taxRate}%):</span>
              <span style="font-weight: 600;">${formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 2px solid #3b82f6; font-size: 18px;">
              <span style="font-weight: 600; color: #1f2937;">Total:</span>
              <span style="font-weight: bold; color: #3b82f6;">${formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        ${invoice.notes ? `
        <!-- Notes -->
        <div style="margin-bottom: 40px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">Notes:</h3>
          <p style="color: #4b5563; margin: 0; padding: 16px; background-color: #f9fafb; border-left: 4px solid #3b82f6;">${invoice.notes}</p>
        </div>
        ` : ''}

        <!-- Terms & Conditions -->
        <div style="margin-top: 60px; padding: 30px 0; border-top: 2px solid #e5e7eb;">
          <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 20px 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Terms & Conditions</h3>
          <div style="color: #4b5563; font-size: 14px; line-height: 1.8;">
            <p style="margin: 0 0 16px 0;"><strong>Payment Terms:</strong> Payment is due within 30 days of invoice date. Late payments may incur additional charges of 1.5% per month on the outstanding balance.</p>
            
            <p style="margin: 0 0 16px 0;"><strong>Payment Methods:</strong> We accept bank transfers, checks, and online payments. Please include the invoice number with your payment for proper processing.</p>
            
            <p style="margin: 0 0 16px 0;"><strong>Dispute Resolution:</strong> Any disputes regarding this invoice must be raised within 7 days of receipt. After this period, the invoice will be considered accepted.</p>
            
            <p style="margin: 0 0 16px 0;"><strong>Late Payment:</strong> Accounts not paid within the specified terms may be subject to collection proceedings and additional legal fees.</p>
            
            <p style="margin: 0 0 16px 0;"><strong>Cancellation Policy:</strong> Services rendered cannot be cancelled once completed. Any cancellations must be made in writing before work commences.</p>
            
            <p style="margin: 0 0 16px 0;"><strong>Liability:</strong> Our liability is limited to the amount of this invoice. We are not responsible for any consequential or indirect damages.</p>
            
            <p style="margin: 0 0 20px 0;"><strong>Governing Law:</strong> This invoice and all related matters shall be governed by the laws of Ghana. Any legal proceedings shall be conducted in the courts of Accra, Ghana.</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 0 0 4px 0;">Thank you for your business!</p>
            <p style="margin: 0;">For questions about this invoice, please contact us at info@abccompany.com</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Print invoice
   */
  static printInvoice(invoiceId: string): void {
    // Open the print page in a new window
    const printUrl = `/dashboard/financial/invoices/${invoiceId}/print`;
    const printWindow = window.open(printUrl, '_blank', 'width=800,height=600');
    
    if (printWindow) {
      // Focus the new window
      printWindow.focus();
    } else {
      // Fallback: navigate to print page in current window
      window.location.href = printUrl;
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
