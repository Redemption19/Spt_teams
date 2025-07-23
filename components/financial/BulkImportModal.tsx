'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  X,
  FileText,
  Camera,
  Loader2
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { ExpenseImportService, ImportResult, ImportExpenseRow } from '@/lib/expense-import-service';
import { ReceiptScannerService, ReceiptScanResult } from '@/lib/receipt-scanner-service';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

interface BulkImportProps {
  onImportComplete: () => void;
  onClose: () => void;
}

export default function BulkImportModal({ onImportComplete, onClose }: BulkImportProps) {
  const [activeTab, setActiveTab] = useState('csv');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [scannedReceipts, setScannedReceipts] = useState<ReceiptScanResult[]>([]);
  const [csvData, setCsvData] = useState<ImportExpenseRow[]>([]);
  
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();

  // CSV/Excel Import
  const onDropCSV = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(10);

      const text = await file.text();
      setProgress(30);
      
      const parsedData = ExpenseImportService.parseCSV(text);
      setCsvData(parsedData);
      setProgress(100);
      
      toast({
        title: 'File Parsed',
        description: `Found ${parsedData.length} expense records to import.`
      });
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast({
        title: 'Error',
        description: 'Failed to parse CSV file. Please check the format.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [toast]);

  const { getRootProps: getRootPropsCSV, getInputProps: getInputPropsCSV, isDragActive: isDragActiveCSV } = useDropzone({
    onDrop: onDropCSV,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  // Receipt Scanning
  const onDropReceipts = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;

    try {
      setIsProcessing(true);
      setProgress(10);
      
      const results: ReceiptScanResult[] = [];
      
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        setProgress(10 + (i / acceptedFiles.length) * 80);
        
        const result = await ReceiptScannerService.scanReceipt(file);
        results.push(result);
        
        // Add filename for reference
        (result as any).fileName = file.name;
      }
      
      setScannedReceipts(results);
      setProgress(100);
      
      const successCount = results.filter(r => r.success).length;
      toast({
        title: 'Receipts Scanned',
        description: `Successfully processed ${successCount} of ${results.length} receipts.`
      });
    } catch (error) {
      console.error('Error scanning receipts:', error);
      toast({
        title: 'Error',
        description: 'Failed to scan receipts. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [toast]);

  const { getRootProps: getRootPropsReceipts, getInputProps: getInputPropsReceipts, isDragActive: isDragActiveReceipts } = useDropzone({
    onDrop: onDropReceipts,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true
  });

  // Import Functions
  const handleCSVImport = async () => {
    if (!csvData.length || !currentWorkspace?.id || !user?.uid) return;

    try {
      setIsProcessing(true);
      setProgress(10);

      const result = await ExpenseImportService.processImport(
        csvData,
        currentWorkspace.id,
        user.uid
      );

      setImportResult(result);
      setProgress(100);

      if (result.success) {
        toast({
          title: 'Import Successful',
          description: `Imported ${result.importedCount} expenses successfully.`
        });
        onImportComplete();
      } else {
        toast({
          title: 'Import Failed',
          description: `Failed to import expenses. Check the errors below.`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: 'Error',
        description: 'Failed to import expenses. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleReceiptImport = async () => {
    const validReceipts = scannedReceipts.filter(r => r.success && r.extractedData.amount);
    if (!validReceipts.length || !currentWorkspace?.id || !user?.uid) return;

    try {
      setIsProcessing(true);
      setProgress(10);

      // Convert receipt data to import format
      const importData: ImportExpenseRow[] = validReceipts.map(receipt => ({
        title: receipt.extractedData.title || 'Receipt Import',
        description: receipt.extractedData.description || '',
        amount: receipt.extractedData.amount || 0,
        currency: receipt.extractedData.currency || 'GHS',
        category: 'general', // Will be mapped during validation
        expenseDate: receipt.extractedData.expenseDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        vendor: receipt.extractedData.vendor,
        paymentMethod: receipt.extractedData.paymentMethod,
        tags: receipt.extractedData.tags?.join(','),
        notes: receipt.extractedData.notes || ''
      }));

      const result = await ExpenseImportService.processImport(
        importData,
        currentWorkspace.id,
        user.uid
      );

      setImportResult(result);
      setProgress(100);

      if (result.success) {
        toast({
          title: 'Import Successful',
          description: `Imported ${result.importedCount} expenses from receipts.`
        });
        onImportComplete();
      } else {
        toast({
          title: 'Import Failed',
          description: `Failed to import expenses. Check the errors below.`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error importing receipts:', error);
      toast({
        title: 'Error',
        description: 'Failed to import expenses. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadTemplate = () => {
    const template = ExpenseImportService.generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expense_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Bulk Import Expenses
            </CardTitle>
            <CardDescription>
              Import expenses from CSV/Excel files or scan receipts with AI
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="csv" className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                CSV/Excel Import
              </TabsTrigger>
              <TabsTrigger value="receipts" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Receipt Scanner
              </TabsTrigger>
            </TabsList>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="my-4">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-1 text-center">
                  Processing... {progress}%
                </p>
              </div>
            )}

            {/* CSV Import Tab */}
            <TabsContent value="csv" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                <Badge variant="secondary">
                  Supports CSV, XLS, XLSX files
                </Badge>
              </div>

              {!csvData.length ? (
                <div
                  {...getRootPropsCSV()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActiveCSV 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputPropsCSV()} />
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">
                    {isDragActiveCSV ? 'Drop your file here' : 'Upload CSV/Excel File'}
                  </h3>
                  <p className="text-muted-foreground">
                    Drag and drop your expense file here, or click to browse
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      Parsed {csvData.length} expense records. Review and import below.
                    </AlertDescription>
                  </Alert>

                  <div className="max-h-64 overflow-auto border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left">Title</th>
                          <th className="p-2 text-left">Amount</th>
                          <th className="p-2 text-left">Currency</th>
                          <th className="p-2 text-left">Category</th>
                          <th className="p-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{row.title}</td>
                            <td className="p-2">{row.amount}</td>
                            <td className="p-2">{row.currency}</td>
                            <td className="p-2">{row.category}</td>
                            <td className="p-2">{row.expenseDate}</td>
                          </tr>
                        ))}
                        {csvData.length > 10 && (
                          <tr className="border-t">
                            <td colSpan={5} className="p-2 text-center text-muted-foreground">
                              ... and {csvData.length - 10} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCSVImport} disabled={isProcessing}>
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Import {csvData.length} Expenses
                    </Button>
                    <Button variant="outline" onClick={() => setCsvData([])}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Receipt Scanner Tab */}
            <TabsContent value="receipts" className="space-y-4">
              <Alert>
                <Camera className="w-4 h-4" />
                <AlertDescription>
                  Upload receipt images (JPG, PNG, WebP). AI will automatically extract expense details.
                </AlertDescription>
              </Alert>

              {!scannedReceipts.length ? (
                <div
                  {...getRootPropsReceipts()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActiveReceipts 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputPropsReceipts()} />
                  <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">
                    {isDragActiveReceipts ? 'Drop receipt images here' : 'Upload Receipt Images'}
                  </h3>
                  <p className="text-muted-foreground">
                    Drag and drop receipt images, or click to browse. Supports multiple files.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      Scanned {scannedReceipts.length} receipts. Review extracted data below.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2 max-h-64 overflow-auto">
                    {scannedReceipts.map((result, index) => (
                      <div key={index} className={`p-3 border rounded ${
                        result.success 
                          ? 'bg-green-500/10 border-green-500/20 dark:bg-green-500/10 dark:border-green-500/30' 
                          : 'bg-red-500/10 border-red-500/20 dark:bg-red-500/10 dark:border-red-500/30'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{(result as any).fileName}</span>
                          <div className="flex items-center gap-2">
                            {result.success ? (
                              <Badge variant="default" className="bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300 border-green-500/30">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Success
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                            {result.confidence && (
                              <Badge variant="outline">
                                {Math.round(result.confidence * 100)}% confidence
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {result.success ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Amount:</span>
                              <div>{result.extractedData.currency} {result.extractedData.amount}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Vendor:</span>
                              <div>{result.extractedData.vendor || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Date:</span>
                              <div>{result.extractedData.expenseDate?.toLocaleDateString() || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Title:</span>
                              <div>{result.extractedData.title || 'N/A'}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-red-600 text-sm">
                            {result.errors?.join(', ') || 'Failed to process receipt'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleReceiptImport} disabled={isProcessing || !scannedReceipts.some(r => r.success)}>
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Import {scannedReceipts.filter(r => r.success).length} Receipts
                    </Button>
                    <Button variant="outline" onClick={() => setScannedReceipts([])}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Import Results */}
          {importResult && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">Import Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Imported</p>
                        <p className="text-2xl font-bold text-green-600">{importResult.importedCount}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Errors</p>
                        <p className="text-2xl font-bold text-red-600">{importResult.errorCount}</p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Warnings</p>
                        <p className="text-2xl font-bold text-yellow-600">{importResult.warnings.length}</p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {(importResult.errors.length > 0 || importResult.warnings.length > 0) && (
                <div className="space-y-2">
                  {importResult.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>Errors:</strong>
                        <ul className="mt-1 list-disc list-inside">
                          {importResult.errors.slice(0, 5).map((error, index) => (
                            <li key={index}>Row {error.row}: {error.message}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li>... and {importResult.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {importResult.warnings.length > 0 && (
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>Warnings:</strong>
                        <ul className="mt-1 list-disc list-inside">
                          {importResult.warnings.slice(0, 3).map((warning, index) => (
                            <li key={index}>Row {warning.row}: {warning.message}</li>
                          ))}
                          {importResult.warnings.length > 3 && (
                            <li>... and {importResult.warnings.length - 3} more warnings</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={onImportComplete}>
                  View Imported Expenses
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
