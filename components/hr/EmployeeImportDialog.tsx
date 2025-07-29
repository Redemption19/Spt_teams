'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';
import { EmployeeImportService, ImportResult, ImportedEmployee } from '@/lib/employee-import-service';
import { useToast } from '@/hooks/use-toast';

interface EmployeeImportDialogProps {
  onImport: (employees: ImportedEmployee[]) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeImportDialog({ onImport, isOpen, onOpenChange }: EmployeeImportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      let result: ImportResult;
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        result = await EmployeeImportService.parseCSV(file);
      } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        result = await EmployeeImportService.parseExcel(file);
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }
      
      setImportResult(result);
      
      if (result.invalidRows > 0) {
        toast({
          title: 'Import Completed with Warnings',
          description: `${result.validRows} valid rows, ${result.invalidRows} invalid rows found.`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Import Successful',
          description: `${result.validRows} employees imported successfully.`,
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to process file.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = EmployeeImportService.generateCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (importResult && importResult.validRows > 0) {
      const validEmployees = importResult.employees.filter(emp => emp.isValid);
      onImport(validEmployees);
      onOpenChange(false);
      setImportResult(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    setImportResult(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import Employees
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple employees at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Choose File
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile && (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/20">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing State */}
          {isProcessing && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing file...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle>Import Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{importResult.totalRows}</div>
                    <div className="text-sm text-muted-foreground">Total Rows</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg bg-green-50">
                    <div className="text-2xl font-bold text-green-600">{importResult.validRows}</div>
                    <div className="text-sm text-muted-foreground">Valid Rows</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg bg-red-50">
                    <div className="text-2xl font-bold text-red-600">{importResult.invalidRows}</div>
                    <div className="text-sm text-muted-foreground">Invalid Rows</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {importResult.totalRows > 0 ? Math.round((importResult.validRows / importResult.totalRows) * 100) : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>

                {/* Error Summary */}
                {importResult.invalidRows > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {importResult.invalidRows} rows have validation errors. Please review and fix them before importing.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Employee Preview */}
                <div className="space-y-3">
                  <h4 className="font-medium">Employee Preview</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {importResult.employees.slice(0, 5).map((employee, index) => (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg ${
                          employee.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {employee.isValid ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </span>
                            <Badge variant={employee.isValid ? 'default' : 'destructive'}>
                              {employee.isValid ? 'Valid' : 'Invalid'}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {employee.email}
                          </span>
                        </div>
                        
                        {!employee.isValid && employee.errors && (
                          <div className="mt-2 text-sm text-red-600">
                            <div className="font-medium">Errors:</div>
                            <ul className="list-disc list-inside space-y-1">
                              {employee.errors.map((error, errorIndex) => (
                                <li key={errorIndex}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {importResult.employees.length > 5 && (
                      <div className="text-center text-sm text-muted-foreground py-2">
                        ... and {importResult.employees.length - 5} more employees
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            {importResult && importResult.validRows > 0 && (
              <Button onClick={handleImport}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Import {importResult.validRows} Employees
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 