'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { CurrencySelector } from '@/components/financial/CurrencySelector';
import { InvoiceService } from '@/lib/invoice-service';
import { ClientService, type Client } from '@/lib/client-service';
import { InvoiceTypeService, type InvoiceType } from '@/lib/invoice-type-service';
import CreateClientModal from '@/components/financial/CreateClientModal';
import CreateInvoiceTypeModal from '@/components/financial/CreateInvoiceTypeModal';
import type { InvoiceFormData, Invoice } from '@/lib/types/financial-types';
import { FileText, DollarSign, Settings, Users, Save, Plus, Minus, ArrowLeft, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  clientId?: string;
  status: string;
}

interface InvoiceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
  isEdit?: boolean;
}

export default function InvoiceForm({ onSuccess, onCancel, initialData, isEdit = false }: InvoiceFormProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [invoiceTypes, setInvoiceTypes] = useState<InvoiceType[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [typesLoading, setTypesLoading] = useState(true);
  
  // Modal states
  const [showClientModal, setShowClientModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  
  const [projects] = useState<Project[]>([
    { id: '1', name: 'Website Redesign', clientId: '1', status: 'active' },
    { id: '2', name: 'Mobile App Development', clientId: '2', status: 'active' },
    { id: '3', name: 'Marketing Campaign', clientId: '3', status: 'completed' }
  ]);

  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: '',
    projectId: '',
    type: 'service',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    taxRate: 0,
    discount: 0,
    currency: 'GHS',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    notes: '',
    terms: 'Payment is due within 30 days of invoice date. Late payments may incur additional charges.'
  });

  // Fetch clients and invoice types
  useEffect(() => {
    const fetchData = async () => {
      if (!currentWorkspace) return;
      
      try {
        // Fetch clients
        setClientsLoading(true);
        const clientsData = await ClientService.getWorkspaceClients(currentWorkspace.id);
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast({
          title: "Error",
          description: "Failed to load clients",
          variant: "destructive"
        });
      } finally {
        setClientsLoading(false);
      }
      
      try {
        // Fetch invoice types
        setTypesLoading(true);
        const typesData = await InvoiceTypeService.getWorkspaceInvoiceTypes(currentWorkspace.id);
        setInvoiceTypes(typesData);
      } catch (error) {
        console.error('Error fetching invoice types:', error);
        toast({
          title: "Error",
          description: "Failed to load invoice types",
          variant: "destructive"
        });
      } finally {
        setTypesLoading(false);
      }
    };
    
    fetchData();
  }, [currentWorkspace, toast]);

  // Load initial data if editing
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        clientId: initialData.clientId || '',
        projectId: initialData.projectId || '',
        type: initialData.type || 'service',
        items: initialData.items || [{ description: '', quantity: 1, unitPrice: 0 }],
        taxRate: initialData.taxRate || 0,
        discount: initialData.discount || 0,
        currency: initialData.currency || 'GHS',
        dueDate: initialData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: initialData.notes || '',
        terms: initialData.terms || 'Payment is due within 30 days of invoice date. Late payments may incur additional charges.'
      });
    }
  }, [isEdit, initialData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  // Handle client creation
  const handleClientCreated = async (clientId: string) => {
    try {
      // Refresh clients list
      const clientsData = await ClientService.getWorkspaceClients(currentWorkspace!.id);
      setClients(clientsData);
      
      // Select the newly created client
      setFormData(prev => ({ ...prev, clientId }));
      
      toast({
        title: "Success",
        description: "Client created and selected"
      });
    } catch (error) {
      console.error('Error refreshing clients:', error);
    }
  };

  // Handle invoice type creation
  const handleInvoiceTypeCreated = async (typeId: string) => {
    try {
      // Refresh invoice types list
      const typesData = await InvoiceTypeService.getWorkspaceInvoiceTypes(currentWorkspace!.id);
      setInvoiceTypes(typesData);
      
      // Find the created type and select it
      const createdType = typesData.find(type => type.id === typeId);
      if (createdType) {
        // Map custom type to form type
        const mappedType = createdType.category === 'service' ? 'service' :
                          createdType.category === 'subscription' ? 'subscription' :
                          createdType.category === 'consulting' ? 'project_billing' :
                          'service';
        
        setFormData(prev => ({ 
          ...prev, 
          type: mappedType,
          taxRate: createdType.defaultTaxRate || 0,
          dueDate: new Date(Date.now() + createdType.defaultDueDays * 24 * 60 * 60 * 1000),
          terms: createdType.defaultTerms || prev.terms,
          notes: createdType.defaultNotes || prev.notes
        }));
      }
      
      toast({
        title: "Success",
        description: "Invoice type created and applied"
      });
    } catch (error) {
      console.error('Error refreshing invoice types:', error);
    }
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (formData.taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - (formData.discount || 0);
  };

  const filteredProjects = projects.filter(project => 
    !formData.clientId || project.clientId === formData.clientId
  );

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

    // Validation
    if (!formData.items.some(item => item.description && item.quantity > 0 && item.unitPrice > 0)) {
      toast({
        title: "Error",
        description: "Please add at least one valid item",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Convert special "no selection" values back to empty strings
      const processedFormData = {
        ...formData,
        projectId: formData.projectId === 'no-project' ? '' : formData.projectId
      };
      
      if (isEdit && initialData?.id) {
        // Convert form data to proper Invoice format for update
        const updateData: Partial<Invoice> = {
          ...processedFormData,
          items: processedFormData.items.map((item, index) => ({
            id: `${initialData.id}_item_${index}`,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice
          })),
          discount: processedFormData.discount || 0
        };
        // Update existing invoice
        await InvoiceService.updateInvoice(initialData.id, updateData);
        toast({
          title: "Success",
          description: "Invoice updated successfully"
        });
      } else {
        // Create new invoice
        await InvoiceService.createInvoice(currentWorkspace.id, processedFormData, user.uid);
        toast({
          title: "Success",
          description: "Invoice created successfully"
        });
        
        // Reset form
        setFormData({
          clientId: '',
          projectId: '',
          type: 'service',
          items: [{ description: '', quantity: 1, unitPrice: 0 }],
          taxRate: 0,
          discount: 0,
          currency: 'GHS',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes: '',
          terms: 'Payment is due within 30 days of invoice date. Late payments may incur additional charges.'
        });
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? 'update' : 'create'} invoice. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex items-center gap-2 sm:gap-4">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Back</span>
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg sm:text-xl truncate">
              {isEdit ? 'Edit Invoice' : 'Create New Invoice'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {isEdit ? 'Update invoice details' : 'Generate professional invoices for your clients'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-9 sm:h-10">
              <TabsTrigger value="basic" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                <FileText className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden sm:inline">Basic Info</span>
                <span className="sm:hidden">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="items" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                <DollarSign className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden sm:inline">Items</span>
                <span className="sm:hidden">Items</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                <Settings className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Set</span>
              </TabsTrigger>
              <TabsTrigger value="terms" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                <Users className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden sm:inline">Terms</span>
                <span className="sm:hidden">Terms</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                    <Label htmlFor="client" className="text-xs sm:text-sm font-medium">Client</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClientModal(true)}
                      className="h-6 sm:h-7 px-1.5 sm:px-2 text-xs"
                    >
                      <UserPlus className="w-3 h-3 mr-0.5 sm:mr-1" />
                      <span className="hidden sm:inline">New</span>
                    </Button>
                  </div>
                  <Select value={formData.clientId} onValueChange={(value) => handleInputChange('clientId', value)}>
                    <SelectTrigger className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder={clientsLoading ? "Loading clients..." : "Select client"} />
                    </SelectTrigger>
                    <SelectContent>
                      {clientsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading clients...
                        </SelectItem>
                      ) : clients.length === 0 ? (
                        <SelectItem value="no-clients" disabled>
                          No clients found
                        </SelectItem>
                      ) : (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} {client.company && `(${client.company})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="project" className="text-xs sm:text-sm font-medium">Project (Optional)</Label>
                  <Select 
                    value={formData.projectId} 
                    onValueChange={(value) => handleInputChange('projectId', value)}
                    disabled={!formData.clientId}
                  >
                    <SelectTrigger className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-project">No Project</SelectItem>
                      {filteredProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                    <Label htmlFor="type" className="text-xs sm:text-sm font-medium">Invoice Type *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTypeModal(true)}
                      className="h-6 sm:h-7 px-1.5 sm:px-2 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-0.5 sm:mr-1" />
                      <span className="hidden sm:inline">New Type</span>
                      <span className="sm:hidden">New</span>
                    </Button>
                  </div>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder={typesLoading ? "Loading types..." : "Select type"} />
                    </SelectTrigger>
                    <SelectContent>
                      {typesLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading types...
                        </SelectItem>
                      ) : invoiceTypes.length === 0 ? (
                        <SelectItem value="no-types" disabled>
                          No invoice types found. Create one first.
                        </SelectItem>
                      ) : (
                        invoiceTypes.map((type) => (
                          <SelectItem key={type.id} value={type.category}>
                            {type.name} {type.isDefault && '(Default)'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <CurrencySelector
                    value={formData.currency}
                    onChange={(value) => handleInputChange('currency', value)}
                    label="Currency"
                    showConverter={true}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs sm:text-sm font-medium">Due Date *</Label>
                  <DatePicker
                    value={formData.dueDate}
                    onChange={(date) => handleInputChange('dueDate', date || new Date())}
                    className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Items Tab */}
            <TabsContent value="items" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs sm:text-sm font-medium">Invoice Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 sm:h-9 text-xs sm:text-sm">
                    <Plus className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Add Item</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>
                
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                      <div className="sm:col-span-5">
                        <Label className="text-xs sm:text-sm font-medium">Description *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Item description"
                          className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm"
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs sm:text-sm font-medium">Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm"
                          required
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Label className="text-xs sm:text-sm font-medium">Unit Price *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm"
                          required
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-end">
                        <div className="w-full">
                          <Label className="text-xs sm:text-sm font-medium">Total</Label>
                          <div className="mt-1 sm:mt-1.5 p-2 bg-muted rounded text-xs sm:text-sm font-medium h-9 sm:h-10 flex items-center">
                            {(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                        {formData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="ml-2 h-6 sm:h-8 w-6 sm:w-8 p-0"
                          >
                            <Minus className="w-3 sm:w-4 h-3 sm:h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Summary */}
                <div className="border-t pt-3 sm:pt-4">
                  <div className="space-y-2 max-w-full sm:max-w-sm ml-auto">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>Subtotal:</span>
                      <span className="font-medium">{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>Tax ({formData.taxRate}%):</span>
                      <span className="font-medium">{calculateTax().toFixed(2)}</span>
                    </div>
                    {(formData.discount || 0) > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Discount:</span>
                        <span className="font-medium">-{(formData.discount || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm sm:text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                <div>
                  <Label htmlFor="taxRate" className="text-xs sm:text-sm font-medium">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                    className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                
                <div>
                  <Label htmlFor="discount" className="text-xs sm:text-sm font-medium">Discount Amount</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount || ''}
                    onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                    className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-xs sm:text-sm font-medium">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes for the client..."
                  rows={3}
                  className="mt-1 sm:mt-1.5 resize-none text-xs sm:text-sm"
                />
              </div>
            </TabsContent>

            {/* Terms Tab */}
            <TabsContent value="terms" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              <div>
                <Label htmlFor="terms" className="text-xs sm:text-sm font-medium">Payment Terms</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => handleInputChange('terms', e.target.value)}
                  placeholder="Payment terms and conditions..."
                  rows={6}
                  className="mt-1 sm:mt-1.5 resize-none text-xs sm:text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 sm:pt-6 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:flex-1 h-10 sm:h-12 text-xs sm:text-sm">
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading} className="w-full sm:flex-1 h-10 sm:h-12 text-xs sm:text-sm">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 sm:h-4 w-3 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                  <span className="sm:hidden">{isEdit ? 'Updating...' : 'Creating...'}</span>
                  <span className="hidden sm:inline">{isEdit ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                  <span className="sm:hidden">{isEdit ? 'Update' : 'Create'}</span>
                  <span className="hidden sm:inline">{isEdit ? 'Update Invoice' : 'Create Invoice'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
        
        {/* Modals */}
        <CreateClientModal
          open={showClientModal}
          onOpenChange={setShowClientModal}
          onClientCreated={handleClientCreated}
        />
        
        <CreateInvoiceTypeModal
          open={showTypeModal}
          onOpenChange={setShowTypeModal}
          onInvoiceTypeCreated={handleInvoiceTypeCreated}
        />
      </CardContent>
    </Card>
  );
}