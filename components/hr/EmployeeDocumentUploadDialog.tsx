'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload,
  FileText,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { EmployeeDocument } from '@/lib/employee-service';
import { useToast } from '@/hooks/use-toast';

interface EmployeeDocumentUploadDialogProps {
  employeeId: string;
  onUpload: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeDocumentUploadDialog({ 
  employeeId, 
  onUpload, 
  isOpen, 
  onOpenChange 
}: EmployeeDocumentUploadDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState<EmployeeDocument['type']>('other');
  const [notes, setNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const documentTypes = [
    { value: 'contract', label: 'Employment Contract' },
    { value: 'identification', label: 'ID Document' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'resume', label: 'Resume/CV' },
    { value: 'other', label: 'Other' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 10MB.',
          variant: 'destructive'
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a PDF, Word document, image, or text file.',
          variant: 'destructive'
        });
        return;
      }

      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please select a file and provide a document name.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);

      // Import the service dynamically to avoid circular dependencies
      const { EmployeeService } = await import('@/lib/employee-service');
      
      await EmployeeService.addEmployeeDocument(
        employeeId,
        selectedFile,
        {
          name: documentName.trim(),
          type: documentType,
          notes: notes.trim() || undefined,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined
        },
        'system' // TODO: Get actual user ID
      );

      toast({
        title: 'Document uploaded successfully',
        description: 'The document has been added to the employee profile.',
      });

      // Reset form
      setSelectedFile(null);
      setDocumentName('');
      setDocumentType('other');
      setNotes('');
      setExpiryDate('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Close dialog and refresh
      onOpenChange(false);
      onUpload();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload document. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setDocumentName('');
    setDocumentType('other');
    setNotes('');
    setExpiryDate('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Upload Employee Document</DialogTitle>
          <DialogDescription>
            Upload a document for this employee. Supported formats: PDF, Word documents, images, and text files (max 10MB).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select File</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium">Click to select a file</p>
                  <p className="text-xs text-muted-foreground">
                    or drag and drop here
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2"
              >
                Choose File
              </Button>
            </div>
          </div>

          {/* Document Details - Two Column Layout */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Document Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document-name">Document Name *</Label>
                  <Input
                    id="document-name"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Enter document name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-type">Document Type *</Label>
                  <Select value={documentType} onValueChange={(value: EmployeeDocument['type']) => setDocumentType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes about this document"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File Info */}
          {selectedFile && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">File ready for upload</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {selectedFile.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || !documentName.trim() || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 