'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { ClientService, type ClientFormData } from '@/lib/client-service';
import { Loader2, User, Building, Mail, Phone, Globe, FileText, MapPin } from 'lucide-react';

interface CreateClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated?: (clientId: string) => void;
  initialData?: any;
  isEdit?: boolean;
}

export default function CreateClientModal({ open, onOpenChange, onClientCreated, initialData, isEdit = false }: CreateClientModalProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    company: '',
    address: '',
    phone: '',
    website: '',
    taxId: '',
    notes: ''
  });

  // Populate form with initial data when editing
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        company: initialData.company || '',
        address: initialData.address || '',
        phone: initialData.phone || '',
        website: initialData.website || '',
        taxId: initialData.taxId || '',
        notes: initialData.notes || ''
      });
    } else if (!isEdit) {
      // Reset form when switching to create mode
      setFormData({
        name: '',
        email: '',
        company: '',
        address: '',
        phone: '',
        website: '',
        taxId: '',
        notes: ''
      });
    }
  }, [isEdit, initialData, open]);

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
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

    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive"
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      let clientId: string;
      
      if (isEdit && initialData?.id) {
        // Update existing client
        await ClientService.updateClient(initialData.id, formData);
        clientId = initialData.id;
        
        toast({
          title: "Success",
          description: "Client updated successfully"
        });
      } else {
        // Create new client
        clientId = await ClientService.createClient(
          currentWorkspace.id,
          formData,
          user.uid
        );
        
        toast({
          title: "Success",
          description: "Client created successfully"
        });
      }
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        address: '',
        phone: '',
        website: '',
        taxId: '',
        notes: ''
      });
      
      onClientCreated?.(clientId);
      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} client:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? 'update' : 'create'} client. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      address: '',
      phone: '',
      website: '',
      taxId: '',
      notes: ''
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {isEdit ? 'Edit Client' : 'Create New Client'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update client information. Required fields are marked with *' : 'Add a new client to your workspace. Required fields are marked with *'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-1">
              <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter client name"
                className="mt-1.5"
                required
              />
            </div>
            
            {/* Email */}
            <div className="md:col-span-1">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                className="mt-1.5"
                required
              />
            </div>
            
            {/* Company */}
            <div className="md:col-span-1">
              <Label htmlFor="company" className="text-sm font-medium flex items-center gap-2">
                <Building className="w-4 h-4" />
                Company
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Enter company name"
                className="mt-1.5"
              />
            </div>
            
            {/* Phone */}
            <div className="md:col-span-1">
              <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className="mt-1.5"
              />
            </div>
            
            {/* Website */}
            <div className="md:col-span-1">
              <Label htmlFor="website" className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website
              </Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
                className="mt-1.5"
              />
            </div>
            
            {/* Tax ID */}
            <div className="md:col-span-1">
              <Label htmlFor="taxId" className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Tax ID
              </Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                placeholder="Enter tax ID"
                className="mt-1.5"
              />
            </div>
            
            {/* Address */}
            <div className="md:col-span-2">
              <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
                className="mt-1.5"
                rows={2}
              />
            </div>
            
            {/* Notes */}
            <div className="md:col-span-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about the client"
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Update Client' : 'Create Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}