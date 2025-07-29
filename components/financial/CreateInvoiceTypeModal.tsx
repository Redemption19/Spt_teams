'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { InvoiceTypeService, type InvoiceTypeFormData } from '@/lib/invoice-type-service';
import { Loader2, FileText, Tag, Calendar, Percent } from 'lucide-react';

interface CreateInvoiceTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceTypeCreated?: (typeId: string) => void;
  initialData?: InvoiceTypeFormData & { id: string };
  isEdit?: boolean;
}

export default function CreateInvoiceTypeModal({ open, onOpenChange, onInvoiceTypeCreated, initialData, isEdit = false }: CreateInvoiceTypeModalProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<InvoiceTypeFormData>({
    name: '',
    description: '',
    code: '',
    category: 'service',
    defaultTerms: '',
    defaultNotes: '',
    defaultDueDays: 30,
    defaultTaxRate: 0,
    isDefault: false
  });

  // Populate form with initial data when editing
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        code: initialData.code || '',
        category: initialData.category || 'service',
        defaultTerms: initialData.defaultTerms || '',
        defaultNotes: initialData.defaultNotes || '',
        defaultDueDays: initialData.defaultDueDays || 30,
        defaultTaxRate: initialData.defaultTaxRate ?? 0,
        isDefault: initialData.isDefault || false
      });
    } else if (!isEdit) {
      // Reset form when not editing
      setFormData({
        name: '',
        description: '',
        code: '',
        category: 'service',
        defaultTerms: '',
        defaultNotes: '',
        defaultDueDays: 30,
        defaultTaxRate: 0,
        isDefault: false
      });
    }
  }, [isEdit, initialData]);

  const handleInputChange = (field: keyof InvoiceTypeFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !currentWorkspace) {
      toast({
        title: "Error",
        description: "User or workspace not found",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Error",
        description: "Name and code are required",
        variant: "destructive"
      });
      return;
    }

    // Validate code format (should be 2-5 characters, alphanumeric)
    const codeRegex = /^[A-Z0-9]{2,5}$/;
    if (!codeRegex.test(formData.code.toUpperCase())) {
      toast({
        title: "Error",
        description: "Code must be 2-5 alphanumeric characters",
        variant: "destructive"
      });
      return;
    }

    if (formData.defaultDueDays < 1 || formData.defaultDueDays > 365) {
      toast({
        title: "Error",
        description: "Due days must be between 1 and 365",
        variant: "destructive"
      });
      return;
    }

    if (formData.defaultTaxRate && (formData.defaultTaxRate < 0 || formData.defaultTaxRate > 100)) {
      toast({
        title: "Error",
        description: "Tax rate must be between 0 and 100",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      let typeId: string;
      
      // Prepare form data with proper handling of optional fields
      const cleanedFormData = {
        ...formData,
        description: formData.description?.trim() || undefined,
        defaultTerms: formData.defaultTerms?.trim() || undefined,
        defaultNotes: formData.defaultNotes?.trim() || undefined,
        defaultTaxRate: formData.defaultTaxRate || undefined
      };
      
      if (isEdit && initialData?.id) {
        // Update existing invoice type
        await InvoiceTypeService.updateInvoiceType(initialData.id, cleanedFormData);
        typeId = initialData.id;
        
        toast({
          title: "Success",
          description: "Invoice type updated successfully"
        });
      } else {
        // Create new invoice type
        typeId = await InvoiceTypeService.createInvoiceType(
          currentWorkspace.id,
          cleanedFormData,
          user.uid
        );
        
        toast({
          title: "Success",
          description: "Invoice type created successfully"
        });
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        code: '',
        category: 'service',
        defaultTerms: '',
        defaultNotes: '',
        defaultDueDays: 30,
        defaultTaxRate: 0,
        isDefault: false
      });
      
      onInvoiceTypeCreated?.(typeId);
      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} invoice type:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? 'update' : 'create'} invoice type. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      category: 'service',
      defaultTerms: '',
      defaultNotes: '',
      defaultDueDays: 30,
      defaultTaxRate: 0,
      isDefault: false
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {isEdit ? 'Edit Invoice Type' : 'Create New Invoice Type'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update invoice type information. Required fields are marked with *' : 'Create a custom invoice type for your workspace. Required fields are marked with *'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Name */}
            <div className="md:col-span-1">
              <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Consulting Service"
                className="mt-1.5"
                required
              />
            </div>
            
            {/* Code */}
            <div className="md:col-span-1">
              <Label htmlFor="code" className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Code *
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                placeholder="e.g., CONS"
                className="mt-1.5"
                maxLength={5}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">2-5 alphanumeric characters</p>
            </div>
            
            {/* Category */}
            <div className="md:col-span-1">
              <Label htmlFor="category" className="text-sm font-medium">
                Category *
              </Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Default Due Days */}
            <div className="md:col-span-1">
              <Label htmlFor="defaultDueDays" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Default Due Days *
              </Label>
              <Input
                id="defaultDueDays"
                type="number"
                min="1"
                max="365"
                value={formData.defaultDueDays}
                onChange={(e) => handleInputChange('defaultDueDays', parseInt(e.target.value) || 30)}
                className="mt-1.5"
                required
              />
            </div>
            
            {/* Default Tax Rate */}
            <div className="md:col-span-1">
              <Label htmlFor="defaultTaxRate" className="text-sm font-medium flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Default Tax Rate (%)
              </Label>
              <Input
                id="defaultTaxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.defaultTaxRate || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || value === null) {
                    handleInputChange('defaultTaxRate', 0);
                  } else {
                    const numValue = parseFloat(value);
                    handleInputChange('defaultTaxRate', isNaN(numValue) ? 0 : numValue);
                  }
                }}
                placeholder="0.00"
                className="mt-1.5"
              />
            </div>
            
            {/* Is Default */}
            <div className="md:col-span-1 flex items-center space-x-2 mt-6">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => handleInputChange('isDefault', checked as boolean)}
              />
              <Label htmlFor="isDefault" className="text-sm font-medium">
                Set as default type
              </Label>
            </div>
            
            {/* Description */}
            <div className="md:col-span-3">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of this invoice type"
                className="mt-1.5"
                rows={2}
              />
            </div>
            
            {/* Default Terms and Notes - Two column layout */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultTerms" className="text-sm font-medium">
                  Default Terms
                </Label>
                <Textarea
                  id="defaultTerms"
                  value={formData.defaultTerms}
                  onChange={(e) => handleInputChange('defaultTerms', e.target.value)}
                  placeholder="Default payment terms for this invoice type"
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="defaultNotes" className="text-sm font-medium">
                  Default Notes
                </Label>
                <Textarea
                  id="defaultNotes"
                  value={formData.defaultNotes}
                  onChange={(e) => handleInputChange('defaultNotes', e.target.value)}
                  placeholder="Default notes to include in invoices of this type"
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Update Invoice Type' : 'Create Invoice Type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}