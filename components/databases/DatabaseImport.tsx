// components/databases/DatabaseImport.tsx
'use client';
import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { FileUp, Upload, Loader2, AlertCircle, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { DatabaseImportExportService } from '@/lib/database-management/database-import-export';

interface ImportPreview {
  collections: string[];
  totalRecords: number;
  recordCounts: Record<string, number>;
  sampleData: Record<string, any[]>;
}

export default function DatabaseImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [format, setFormat] = useState('auto');
  const [conflictResolution, setConflictResolution] = useState('skip');
  const [validateBeforeImport, setValidateBeforeImport] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(null);
      setResult(null);
      setError(null);
      
      // Auto-detect format based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension) {
        switch (extension) {
          case 'json':
            setFormat('json');
            break;
          case 'csv':
            setFormat('csv');
            break;
          case 'xml':
            setFormat('xml');
            break;
          case 'sql':
            setFormat('sql');
            break;
          default:
            setFormat('auto');
        }
      }
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const content = await selectedFile.text();
      let previewData: Record<string, any[]>;

      // Parse based on detected format
      const detectedFormat = format === 'auto' ? detectFormat(content) : format;
      
      switch (detectedFormat) {
        case 'json':
          previewData = JSON.parse(content);
          break;
        case 'csv':
          previewData = parseCSVPreview(content);
          break;
        case 'xml':
          previewData = parseXMLPreview(content);
          break;
        case 'sql':
          previewData = parseSQLPreview(content);
          break;
        default:
          throw new Error('Unable to detect file format');
      }

      const collections = Object.keys(previewData);
      const totalRecords = Object.values(previewData).reduce((sum, collection) => sum + collection.length, 0);
      const recordCounts: Record<string, number> = {};
      const sampleData: Record<string, any[]> = {};

      collections.forEach(collection => {
        recordCounts[collection] = previewData[collection].length;
        sampleData[collection] = previewData[collection].slice(0, 3); // Show first 3 records
      });

      setPreview({
        collections,
        totalRecords,
        recordCounts,
        sampleData
      });

      toast({
        title: "Preview Generated",
        description: `Found ${totalRecords} records across ${collections.length} collections`,
        variant: "default"
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to preview file');
      toast({
        title: "Preview Failed",
        description: error instanceof Error ? error.message : 'Unable to preview file',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !currentWorkspace || !user) {
      toast({
        title: "Error",
        description: "Please select a file and ensure you're logged in",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      const importResult = await DatabaseImportExportService.importWorkspaceData(
        currentWorkspace.id,
        user.uid,
        selectedFile,
        {
          format: format === 'auto' ? detectFormat(await selectedFile.text()) : format as 'json' | 'csv' | 'xml' | 'sql',
          conflictResolution: conflictResolution as 'overwrite' | 'skip' | 'merge',
          validateBeforeImport,
          dryRun
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      setResult(importResult);

      if (importResult.success) {
        toast({
          title: dryRun ? "Dry Run Completed" : "Import Successful",
          description: `Imported ${importResult.importedRecords} records, skipped ${importResult.skippedRecords}`,
          variant: "default"
        });
      } else {
        setError(importResult.errors.join(', '));
        toast({
          title: "Import Failed",
          description: importResult.errors.join(', '),
          variant: "destructive"
        });
      }

      // Reset progress after a delay
      setTimeout(() => setProgress(0), 3000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Import failed');
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'An error occurred during import',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const detectFormat = (content: string): 'json' | 'csv' | 'xml' | 'sql' => {
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      return 'json';
    }
    if (content.includes('<?xml') || content.includes('<workspace-export>')) {
      return 'xml';
    }
    if (content.includes('INSERT INTO') || content.includes('CREATE TABLE')) {
      return 'sql';
    }
    if (content.includes(',') && content.includes('\n')) {
      return 'csv';
    }
    return 'json'; // Default fallback
  };

  const parseCSVPreview = (content: string): Record<string, any[]> => {
    const lines = content.split('\n');
    const data: Record<string, any[]> = {};
    let currentCollection = '';
    
    lines.forEach(line => {
      if (line.startsWith('# ')) {
        currentCollection = line.substring(2).toLowerCase();
        data[currentCollection] = [];
      } else if (line.trim() && currentCollection && !line.includes(',')) {
        // Skip header lines
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length > 1) {
          const record: any = {};
          values.forEach((value, index) => {
            record[`field_${index}`] = value;
          });
          data[currentCollection].push(record);
        }
      }
    });
    
    return data;
  };

  const parseXMLPreview = (content: string): Record<string, any[]> => {
    const data: Record<string, any[]> = {};
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    
    const collections = xmlDoc.getElementsByTagName('workspace-export')[0]?.children;
    if (collections) {
      Array.from(collections).forEach(collection => {
        const collectionName = collection.tagName;
        data[collectionName] = [];
        
        const records = collection.getElementsByTagName('record');
        Array.from(records).slice(0, 3).forEach(record => {
          const recordData: any = {};
          Array.from(record.children).forEach(field => {
            recordData[field.tagName] = field.textContent || '';
          });
          data[collectionName].push(recordData);
        });
      });
    }
    
    return data;
  };

  const parseSQLPreview = (content: string): Record<string, any[]> => {
    const data: Record<string, any[]> = {};
    const insertStatements = content.match(/INSERT INTO (\w+) \([^)]+\) VALUES \([^)]+\);/g);
    
    if (insertStatements) {
      insertStatements.slice(0, 10).forEach(statement => {
        const match = statement.match(/INSERT INTO (\w+) \(([^)]+)\) VALUES \(([^)]+)\);/);
        if (match) {
          const [, tableName, columnsStr, valuesStr] = match;
          const columns = columnsStr.split(',').map(c => c.trim());
          const values = valuesStr.split(',').map(v => v.trim().replace(/^'|'$/g, ''));
          
          if (!data[tableName]) {
            data[tableName] = [];
          }
          
          const record: any = {};
          columns.forEach((column, index) => {
            record[column] = values[index] || '';
          });
          data[tableName].push(record);
        }
      });
    }
    
    return data;
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'json': return 'JSON data format';
      case 'csv': return 'Comma-separated values';
      case 'xml': return 'XML data format';
      case 'sql': return 'SQL statements';
      case 'auto': return 'Auto-detect format';
      default: return '';
    }
  };

  const getConflictResolutionDescription = (resolution: string) => {
    switch (resolution) {
      case 'overwrite': return 'Replace existing records';
      case 'skip': return 'Skip conflicting records';
      case 'merge': return 'Merge with existing records';
      default: return '';
    }
  };

  return (
    <Card className="border border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileUp className="h-5 w-5 text-primary" />
          Import Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Select File</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.xml,.sql"
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <FileUp className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Size: {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    setResult(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Supports JSON, CSV, XML, and SQL files
                </p>
              </div>
            )}
          </div>
        </div>

        {selectedFile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>File Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getFormatDescription(format)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Conflict Resolution</Label>
              <Select value={conflictResolution} onValueChange={setConflictResolution}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Skip Conflicts</SelectItem>
                  <SelectItem value="overwrite">Overwrite Existing</SelectItem>
                  <SelectItem value="merge">Merge Records</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getConflictResolutionDescription(conflictResolution)}
              </p>
            </div>
          </div>
        )}

        {selectedFile && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="validate-before-import"
                checked={validateBeforeImport}
                onChange={(e) => setValidateBeforeImport(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="validate-before-import">Validate before import</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dry-run"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="dry-run">Dry run (preview only)</Label>
            </div>
          </div>
        )}

        {selectedFile && !preview && (
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={loading}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Data
          </Button>
        )}

        {preview && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">Data Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Records:</span>
                  <Badge variant="default">{preview.totalRecords}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Collections:</span>
                  <Badge variant="secondary">{preview.collections.length}</Badge>
                </div>
              </div>
              
              <div className="mt-3 space-y-1">
                {preview.collections.map(collection => (
                  <div key={collection} className="flex justify-between text-xs">
                    <span>{collection}:</span>
                    <span>{preview.recordCounts[collection]} records</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Import Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {result && (
          <Alert>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">
                  {result.success ? 'Import completed!' : 'Import failed'}
                </div>
                <div className="text-sm">
                  Imported: {result.importedRecords} • Skipped: {result.skippedRecords}
                </div>
                {result.errors.length > 0 && (
                  <div className="text-xs text-red-600">
                    Errors: {result.errors.join(', ')}
                  </div>
                )}
                {result.warnings.length > 0 && (
                  <div className="text-xs text-yellow-600">
                    Warnings: {result.warnings.join(', ')}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {selectedFile && (
          <Button
            className="bg-gradient-to-r from-accent to-primary text-white w-full"
            onClick={handleImport}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Importing...' : (dryRun ? 'Dry Run Import' : 'Import Data')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 