import { GoogleGenAI } from '@google/genai';
import { ExpenseFormData } from './types/financial-types';

// Initialize Gemini AI
const genAI = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
});

export interface ReceiptScanResult {
  success: boolean;
  extractedData: Partial<ExpenseFormData>;
  confidence: number;
  rawText?: string;
  errors?: string[];
}

export interface ReceiptAnalysis {
  vendor?: string;
  amount?: number;
  currency?: string;
  date?: Date;
  category?: string;
  description?: string;
  items?: Array<{
    name: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
  taxAmount?: number;
  paymentMethod?: string;
  receiptNumber?: string;
}

export class ReceiptScannerService {
  
  /**
   * Convert file to base64 for AI processing
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (data:image/jpeg;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Validate if file is a supported image format
   */
  static validateReceiptFile(file: File): { valid: boolean; error?: string } {
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!supportedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Unsupported file type. Please use JPEG, PNG, or WebP images.'
      };
    }
    
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File too large. Please use images smaller than 10MB.'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Scan receipt using Google Gemini AI
   */
  static async scanReceipt(file: File): Promise<ReceiptScanResult> {
    try {
      // Validate file
      const validation = this.validateReceiptFile(file);
      if (!validation.valid) {
        return {
          success: false,
          extractedData: {},
          confidence: 0,
          errors: [validation.error!]
        };
      }
      
      // Convert to base64
      const base64Image = await this.fileToBase64(file);
      
      // Prepare the prompt for receipt analysis
      const prompt = `
        Analyze this receipt image and extract the following information in JSON format:
        
        {
          "vendor": "Company/store name",
          "amount": "Total amount as number",
          "currency": "Currency code (GHS, USD, EUR, etc.)",
          "date": "Date in YYYY-MM-DD format",
          "category": "Expense category (Office Supplies, Meals, Travel, Fuel, etc.)",
          "description": "Brief description of the purchase",
          "items": [
            {
              "name": "Item name",
              "quantity": "Number of items",
              "unitPrice": "Price per unit",
              "totalPrice": "Total for this item"
            }
          ],
          "taxAmount": "Tax amount if visible",
          "paymentMethod": "Payment method if visible (cash, card, etc.)",
          "receiptNumber": "Receipt number if visible",
          "confidence": "Confidence level from 0 to 1"
        }
        
        Guidelines:
        - Extract only information that is clearly visible
        - Use Ghana Cedis (GHS) as default currency if not specified
        - For category, use common business expense categories
        - If amount includes tax, use the total amount
        - Set confidence based on text clarity and completeness
        - If information is unclear, set it as null or empty string
        
        Return only the JSON object, no additional text.
      `;
      
      // Configure the model with thinking capabilities
      const config = {
        thinkingConfig: {
          thinkingBudget: -1, // Use all available thinking budget
        },
        responseMimeType: 'application/json', // Ensure JSON response
      };
      
      const model = 'gemini-2.5-pro';
      
      // Prepare the contents with image data
      const contents = [
        {
          role: 'user' as const,
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                data: base64Image,
                mimeType: file.type
              }
            }
          ],
        },
      ];
      
      // Generate content using the new API
      const response = await genAI.models.generateContent({
        model,
        config,
        contents,
      });
      
      const text = response.text || '';
      
      // Parse the JSON response
      let analysisData: ReceiptAnalysis & { confidence: number };
      try {
        // Clean the response text (remove markdown formatting if present)
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        if (!cleanText) {
          throw new Error('Empty response from AI');
        }
        
        analysisData = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', text);
        return {
          success: false,
          extractedData: {},
          confidence: 0,
          rawText: text,
          errors: ['Failed to parse AI response. Please try again.']
        };
      }
      
      // Convert to ExpenseFormData format
      const extractedData: Partial<ExpenseFormData> = {
        title: analysisData.description || `${analysisData.vendor} Purchase` || 'Receipt Import',
        description: this.buildDescription(analysisData),
        amount: analysisData.amount,
        currency: analysisData.currency || 'GHS',
        expenseDate: analysisData.date ? new Date(analysisData.date) : new Date(),
        vendor: analysisData.vendor,
        paymentMethod: this.mapPaymentMethod(analysisData.paymentMethod),
        notes: this.buildNotes(analysisData),
        tags: this.generateTags(analysisData)
      };
      
      return {
        success: true,
        extractedData,
        confidence: analysisData.confidence || 0.8,
        rawText: text
      };
      
    } catch (error) {
      console.error('Error scanning receipt:', error);
      return {
        success: false,
        extractedData: {},
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }
  
  /**
   * Build description from receipt data
   */
  private static buildDescription(data: ReceiptAnalysis): string {
    let description = '';
    
    if (data.vendor) {
      description += `Purchase from ${data.vendor}`;
    }
    
    if (data.items && data.items.length > 0) {
      if (description) description += ' - ';
      if (data.items.length === 1) {
        description += data.items[0].name;
      } else {
        description += `${data.items.length} items`;
      }
    }
    
    return description || 'Receipt import';
  }
  
  /**
   * Build notes from receipt data
   */
  private static buildNotes(data: ReceiptAnalysis): string {
    const notes: string[] = [];
    
    if (data.receiptNumber) {
      notes.push(`Receipt #: ${data.receiptNumber}`);
    }
    
    if (data.taxAmount) {
      notes.push(`Tax: ${data.taxAmount}`);
    }
    
    if (data.items && data.items.length > 1) {
      notes.push('Items:');
      data.items.forEach(item => {
        let itemNote = `- ${item.name}`;
        if (item.quantity) itemNote += ` (${item.quantity})`;
        if (item.totalPrice) itemNote += ` - ${item.totalPrice}`;
        notes.push(itemNote);
      });
    }
    
    return notes.join('\n');
  }
  
  /**
   * Generate tags based on receipt data
   */
  private static generateTags(data: ReceiptAnalysis): string[] {
    const tags: string[] = [];
    
    if (data.vendor) {
      tags.push(data.vendor.toLowerCase());
    }
    
    if (data.category) {
      tags.push(data.category.toLowerCase().replace(/\s+/g, '-'));
    }
    
    tags.push('receipt-scan');
    
    return tags.filter(Boolean);
  }
  
  /**
   * Map payment method to standard values
   */
  private static mapPaymentMethod(method?: string): string {
    if (!method) return 'other';
    
    const normalized = method.toLowerCase();
    
    if (normalized.includes('cash')) return 'cash';
    if (normalized.includes('card') || normalized.includes('credit') || normalized.includes('debit')) return 'company_card';
    if (normalized.includes('mobile') || normalized.includes('momo')) return 'mobile_money';
    if (normalized.includes('bank') || normalized.includes('transfer')) return 'bank_transfer';
    if (normalized.includes('check') || normalized.includes('cheque')) return 'check';
    
    return 'other';
  }
  
  /**
   * Suggest expense category based on vendor and items
   */
  static suggestCategory(vendor?: string, items?: ReceiptAnalysis['items']): string {
    if (!vendor && !items?.length) return 'general';
    
    const text = `${vendor || ''} ${items?.map(i => i.name).join(' ') || ''}`.toLowerCase();
    
    // Office supplies
    if (text.match(/office|stationery|paper|pen|supplies|printer|computer/)) {
      return 'office_supplies';
    }
    
    // Meals & Entertainment
    if (text.match(/restaurant|food|meal|coffee|lunch|dinner|catering/)) {
      return 'meals';
    }
    
    // Travel
    if (text.match(/hotel|flight|taxi|uber|transport|accommodation|airline/)) {
      return 'travel';
    }
    
    // Fuel
    if (text.match(/fuel|petrol|gas|station|shell|total|goil/)) {
      return 'fuel';
    }
    
    // Marketing
    if (text.match(/advertising|marketing|promotion|print|banner/)) {
      return 'marketing';
    }
    
    // Utilities
    if (text.match(/electricity|water|internet|phone|utilities/)) {
      return 'utilities';
    }
    
    return 'general';
  }
  
  /**
   * Process multiple receipts in batch
   */
  static async scanMultipleReceipts(files: File[]): Promise<ReceiptScanResult[]> {
    const results: ReceiptScanResult[] = [];
    
    // Process files sequentially to avoid API rate limits
    for (const file of files) {
      try {
        const result = await this.scanReceipt(file);
        results.push(result);
        
        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          success: false,
          extractedData: {},
          confidence: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }
    
    return results;
  }
}
