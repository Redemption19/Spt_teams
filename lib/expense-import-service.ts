import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';
import { ExpenseManagementService } from './expense-management-service';
import { DepartmentService } from './department-service';
import { Expense, ExpenseFormData } from './types/financial-types';
import { cleanFirestoreData } from './firestore-utils';

export interface ImportExpenseRow {
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: string;
  expenseDate: string; // Date string in format YYYY-MM-DD
  departmentName?: string;
  costCenter?: string;
  projectName?: string;
  vendor?: string;
  paymentMethod?: string;
  tags?: string; // Comma-separated tags
  notes?: string;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    data: any;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
    data: any;
  }>;
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  processedData: ExpenseFormData[];
}

export class ExpenseImportService {
  
  /**
   * Parse CSV content to expense rows
   */
  static parseCSV(csvContent: string): ImportExpenseRow[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: ImportExpenseRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[this.mapHeaderToField(header)] = values[index]?.trim().replace(/"/g, '') || '';
        });
        
        // Convert amount to number
        if (row.amount) {
          row.amount = parseFloat(row.amount.toString().replace(/[^\d.-]/g, ''));
        }
        
        rows.push(row as ImportExpenseRow);
      }
    }
    
    return rows;
  }
  
  /**
   * Parse a single CSV line handling quoted values
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }
  
  /**
   * Map various header names to our field names
   */
  private static mapHeaderToField(header: string): string {
    const mapping: { [key: string]: string } = {
      'title': 'title',
      'expense title': 'title',
      'name': 'title',
      'description': 'description',
      'details': 'description',
      'amount': 'amount',
      'cost': 'amount',
      'price': 'amount',
      'currency': 'currency',
      'category': 'category',
      'expense category': 'category',
      'date': 'expenseDate',
      'expense date': 'expenseDate',
      'department': 'departmentName',
      'dept': 'departmentName',
      'cost center': 'costCenter',
      'project': 'projectName',
      'vendor': 'vendor',
      'supplier': 'vendor',
      'payment method': 'paymentMethod',
      'payment': 'paymentMethod',
      'tags': 'tags',
      'notes': 'notes',
      'remarks': 'notes'
    };
    
    const normalizedHeader = header.toLowerCase().trim();
    return mapping[normalizedHeader] || normalizedHeader;
  }
  
  /**
   * Generate CSV template for bulk import
   */
  static generateCSVTemplate(): string {
    const headers = [
      'title',
      'description',
      'amount',
      'currency',
      'category',
      'expenseDate',
      'departmentName',
      'costCenter',
      'projectName',
      'vendor',
      'paymentMethod',
      'tags',
      'notes'
    ];
    
    const sampleRow = [
      'Office Supplies',
      'Purchased stationery for Q1',
      '150.00',
      'GHS',
      'Office Supplies',
      '2025-01-15',
      'Administration',
      'ADM-001',
      'Office Setup',
      'Stationery Plus',
      'Company Card',
      'office,supplies,stationery',
      'Bulk purchase for new quarter'
    ];
    
    return [headers.join(','), sampleRow.join(',')].join('\n');
  }
  
  /**
   * Validate imported data before processing
   */
  static async validateImportData(
    rows: ImportExpenseRow[],
    workspaceId: string,
    userId: string
  ): Promise<ImportValidationResult> {
    const errors: Array<{ row: number; field: string; message: string; }> = [];
    const warnings: Array<{ row: number; field: string; message: string; }> = [];
    const processedData: ExpenseFormData[] = [];
    
    // Get departments and categories for validation
    const departments = await DepartmentService.getWorkspaceDepartments(workspaceId);
    const categories = await ExpenseManagementService.getWorkspaceExpenseCategories(workspaceId);
    
    const departmentMap = new Map(departments.map(d => [d.name.toLowerCase(), d.id]));
    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because of header row and 0-based index
      
      // Required field validations
      if (!row.title?.trim()) {
        errors.push({ row: rowNumber, field: 'title', message: 'Title is required' });
      }
      
      if (!row.amount || isNaN(row.amount) || row.amount <= 0) {
        errors.push({ row: rowNumber, field: 'amount', message: 'Valid amount is required' });
      }
      
      if (!row.currency?.trim()) {
        errors.push({ row: rowNumber, field: 'currency', message: 'Currency is required' });
      }
      
      if (!row.category?.trim()) {
        errors.push({ row: rowNumber, field: 'category', message: 'Category is required' });
      }
      
      if (!row.expenseDate?.trim()) {
        errors.push({ row: rowNumber, field: 'expenseDate', message: 'Expense date is required' });
      } else {
        // Validate date format
        const date = new Date(row.expenseDate);
        if (isNaN(date.getTime())) {
          errors.push({ row: rowNumber, field: 'expenseDate', message: 'Invalid date format. Use YYYY-MM-DD' });
        }
      }
      
      // Department validation
      let departmentId: string | undefined;
      if (row.departmentName?.trim()) {
        departmentId = departmentMap.get(row.departmentName.toLowerCase());
        if (!departmentId) {
          warnings.push({ 
            row: rowNumber, 
            field: 'departmentName', 
            message: `Department "${row.departmentName}" not found. Will be created or left empty.` 
          });
        }
      }
      
      // Category validation
      let categoryId: string | undefined;
      if (row.category?.trim()) {
        const category = categories.find(c => c.name.toLowerCase() === row.category.toLowerCase());
        if (category) {
          categoryId = category.id;
        } else {
          warnings.push({ 
            row: rowNumber, 
            field: 'category', 
            message: `Category "${row.category}" not found. Will use default category.` 
          });
        }
      }
      
      // Only process if no critical errors for this row
      if (!errors.some(e => e.row === rowNumber)) {
        const expenseData: ExpenseFormData = {
          title: row.title.trim(),
          description: row.description?.trim() || '',
          amount: row.amount,
          currency: row.currency.trim(),
          expenseDate: new Date(row.expenseDate),
          category: categoryId || categories[0]?.id || '', // Use first category as fallback
          departmentId: departmentId,
          costCenterId: row.costCenter?.trim(),
          projectId: row.projectName?.trim(), // This might need project lookup
          vendor: row.vendor?.trim(),
          paymentMethod: row.paymentMethod?.trim() || 'other',
          tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          notes: row.notes?.trim() || '',
          receipts: [], // Will be empty for bulk import
          billable: false, // Default value
          reimbursable: true // Default value
        };
        
        processedData.push(expenseData);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      processedData
    };
  }
  
  /**
   * Import validated expense data
   */
  static async importExpenses(
    expenseData: ExpenseFormData[],
    workspaceId: string,
    userId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      importedCount: 0,
      errorCount: 0,
      errors: [],
      warnings: []
    };
    
    try {
      // Use batch writing for better performance
      const batch = writeBatch(db);
      const importedIds: string[] = [];
      
      for (let i = 0; i < expenseData.length; i++) {
        try {
          const expense = expenseData[i];
          
          // Create expense document
          const expenseRef = doc(collection(db, 'expenses'));
          const expenseDoc: Omit<Expense, 'id'> = {
            title: expense.title,
            description: expense.description,
            amount: expense.amount,
            currency: expense.currency,
            amountInBaseCurrency: expense.amount, // For now, assume same currency
            expenseDate: expense.expenseDate,
            category: {
              id: expense.category,
              name: expense.category, // Will be resolved by the system
              code: expense.category,
              requiresApproval: false,
              isActive: true,
              workspaceId: workspaceId
            },
            departmentId: expense.departmentId,
            costCenterId: expense.costCenterId,
            projectId: expense.projectId,
            vendor: expense.vendor,
            paymentMethod: expense.paymentMethod as any,
            tags: expense.tags,
            notes: expense.notes,
            receipts: [],
            billable: expense.billable,
            reimbursable: expense.reimbursable,
            status: 'submitted',
            submittedBy: userId,
            workspaceId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Clean the data before adding to batch
          const cleanExpense = cleanFirestoreData(expenseDoc);
          batch.set(expenseRef, cleanExpense);
          importedIds.push(expenseRef.id);
          
        } catch (error) {
          result.errors.push({
            row: i + 2,
            field: 'general',
            message: error instanceof Error ? error.message : 'Unknown error',
            data: expenseData[i]
          });
          result.errorCount++;
        }
      }
      
      // Commit the batch
      await batch.commit();
      
      result.importedCount = importedIds.length;
      result.success = result.importedCount > 0;
      
      console.log(`Successfully imported ${result.importedCount} expenses with ${result.errorCount} errors`);
      
    } catch (error) {
      console.error('Error during bulk import:', error);
      result.errors.push({
        row: 0,
        field: 'system',
        message: error instanceof Error ? error.message : 'System error during import',
        data: null
      });
    }
    
    return result;
  }
  
  /**
   * Complete import process: validate and import
   */
  static async processImport(
    rows: ImportExpenseRow[],
    workspaceId: string,
    userId: string
  ): Promise<ImportResult> {
    // First validate the data
    const validation = await this.validateImportData(rows, workspaceId, userId);
    
    if (!validation.isValid) {
      return {
        success: false,
        importedCount: 0,
        errorCount: validation.errors.length,
        errors: validation.errors.map(e => ({
          row: e.row,
          field: e.field,
          message: e.message,
          data: null
        })),
        warnings: validation.warnings.map(w => ({
          row: w.row,
          field: w.field,
          message: w.message,
          data: null
        }))
      };
    }
    
    // If validation passes, proceed with import
    const importResult = await this.importExpenses(validation.processedData, workspaceId, userId);
    
    // Merge warnings from validation
    importResult.warnings = [
      ...importResult.warnings,
      ...validation.warnings.map(w => ({
        row: w.row,
        field: w.field,
        message: w.message,
        data: null
      }))
    ];
    
    return importResult;
  }
}
