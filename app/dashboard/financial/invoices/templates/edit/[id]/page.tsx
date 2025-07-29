'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload,
  Palette,
  FileText,
  Settings,
  Trash2
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { InvoiceTemplateService, InvoiceTemplate, InvoiceTemplateFormData } from '@/lib/invoice-template-service';

interface TemplateFormData {
  id: string;
  name: string;
  description: string;
  category: 'service' | 'business' | 'retail' | 'consulting' | 'freelance' | 'other';
  isDefault: boolean;
  // Branding settings
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  // Layout settings
  headerLayout: 'standard' | 'minimal' | 'detailed';
  footerLayout: 'minimal' | 'standard' | 'detailed';
  itemsLayout: 'simple' | 'detailed' | 'grouped';
  // Default values
  defaultTerms: string;
  defaultNotes: string;
  defaultDueDays: number;
  // Tax settings
  includeTax: boolean;
  defaultTaxRate: number;
  // Currency settings
  defaultCurrency: string;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const [formData, setFormData] = useState<TemplateFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  const templateId = params.id as string;

  // Load template data
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const fetchedTemplate = await InvoiceTemplateService.getTemplate(templateId);
        
        if (!fetchedTemplate) {
          toast({
            title: 'Error',
            description: 'Template not found',
            variant: 'destructive'
          });
          router.push('/dashboard/financial/invoices/templates');
          return;
        }
        
        // Convert InvoiceTemplate to TemplateFormData format
        const templateFormData: TemplateFormData = {
          id: fetchedTemplate.id,
          name: fetchedTemplate.name,
          description: fetchedTemplate.description,
          category: fetchedTemplate.category,
          isDefault: fetchedTemplate.isDefault,
          logoUrl: fetchedTemplate.logoUrl || '',
          primaryColor: fetchedTemplate.primaryColor,
          secondaryColor: fetchedTemplate.secondaryColor,
          fontFamily: fetchedTemplate.fontFamily,
          headerLayout: fetchedTemplate.headerLayout,
          footerLayout: fetchedTemplate.footerLayout,
          itemsLayout: fetchedTemplate.itemsLayout,
          defaultTerms: fetchedTemplate.defaultTerms,
          defaultNotes: fetchedTemplate.defaultNotes,
          defaultDueDays: fetchedTemplate.defaultDueDays,
          includeTax: fetchedTemplate.includeTax,
          defaultTaxRate: fetchedTemplate.defaultTaxRate,
          defaultCurrency: fetchedTemplate.defaultCurrency,
          createdAt: fetchedTemplate.createdAt,
          updatedAt: fetchedTemplate.updatedAt,
          usageCount: fetchedTemplate.usageCount
        };
        
        setFormData(templateFormData);
      } catch (error) {
        console.error('Error loading template:', error);
        toast({
          title: 'Error',
          description: 'Failed to load template',
          variant: 'destructive'
        });
        router.push('/dashboard/financial/invoices/templates');
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      loadTemplate();
    }
  }, [templateId, router, toast]);

  const handleInputChange = (field: keyof TemplateFormData, value: any) => {
    if (!formData) return;
    
    setFormData(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData || !formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Template name is required',
        variant: 'destructive'
      });
      return;
    }

    if (!userProfile) {
      toast({
        title: 'Error',
        description: 'User profile not found',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    
    try {
      // Convert TemplateFormData to InvoiceTemplateFormData format
      const updateData: Partial<InvoiceTemplateFormData> = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        isDefault: formData.isDefault,
        logoUrl: formData.logoUrl,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        fontFamily: formData.fontFamily,
        headerLayout: formData.headerLayout,
        footerLayout: formData.footerLayout,
        itemsLayout: formData.itemsLayout,
        defaultTaxRate: formData.defaultTaxRate,
        defaultCurrency: formData.defaultCurrency,
        defaultNotes: formData.defaultNotes,
        defaultTerms: formData.defaultTerms,
        defaultDueDays: formData.defaultDueDays,
        includeTax: formData.includeTax
      };
      
      await InvoiceTemplateService.updateTemplate(templateId, updateData);
      
      toast({
        title: 'Success',
        description: 'Template updated successfully'
      });
      
      router.push('/dashboard/financial/invoices/templates');
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formData) return;
    
    if (formData.isDefault) {
      toast({
        title: 'Error',
        description: 'Cannot delete default template',
        variant: 'destructive'
      });
      return;
    }

    if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      try {
        await InvoiceTemplateService.deleteTemplate(templateId);
        
        toast({
          title: 'Success',
          description: 'Template deleted successfully'
        });
        
        router.push('/dashboard/financial/invoices/templates');
      } catch (error) {
        console.error('Error deleting template:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete template',
          variant: 'destructive'
        });
      }
    }
  };

  const handlePreview = () => {
    // Open preview in a new window/tab
    window.open(`/dashboard/financial/invoices/templates/preview/${templateId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Template not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Template</h1>
            <p className="text-muted-foreground">
              Modify your invoice template settings
            </p>
          </div>
        </div>
        
        {!formData.isDefault && (
          <Button 
            variant="destructive" 
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Template
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={activeSection === 'basic' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveSection('basic')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Basic Info
              </Button>
              <Button
                variant={activeSection === 'branding' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveSection('branding')}
              >
                <Palette className="w-4 h-4 mr-2" />
                Branding
              </Button>
              <Button
                variant={activeSection === 'layout' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveSection('layout')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Layout
              </Button>
              <Button
                variant={activeSection === 'defaults' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveSection('defaults')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Defaults
              </Button>
            </CardContent>
          </Card>
          
          {/* Template Stats */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Template Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Created:</span>
                <div className="font-medium">{formData.createdAt.toLocaleDateString()}</div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Last Updated:</span>
                <div className="font-medium">{formData.updatedAt.toLocaleDateString()}</div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Times Used:</span>
                <div className="font-medium">{formData.usageCount}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            {activeSection === 'basic' && (
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Update the basic details for your template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Template Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., Professional Business Invoice"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe when and how this template should be used"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isDefault"
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => handleInputChange('isDefault', checked)}
                    />
                    <Label htmlFor="isDefault">Set as default template</Label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Branding */}
            {activeSection === 'branding' && (
              <Card>
                <CardHeader>
                  <CardTitle>Branding & Colors</CardTitle>
                  <CardDescription>
                    Customize the visual appearance of your invoices
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="logoUrl"
                        value={formData.logoUrl}
                        onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                      <Button type="button" variant="outline">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          value={formData.primaryColor}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          value={formData.secondaryColor}
                          onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          placeholder="#64748b"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <Select value={formData.fontFamily} onValueChange={(value) => handleInputChange('fontFamily', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Layout */}
            {activeSection === 'layout' && (
              <Card>
                <CardHeader>
                  <CardTitle>Layout Settings</CardTitle>
                  <CardDescription>
                    Configure how different sections of your invoice are displayed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="headerLayout">Header Layout</Label>
                      <Select value={formData.headerLayout} onValueChange={(value) => handleInputChange('headerLayout', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="centered">Centered</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="itemsLayout">Items Layout</Label>
                      <Select value={formData.itemsLayout} onValueChange={(value) => handleInputChange('itemsLayout', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="detailed">Detailed</SelectItem>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="simple">Simple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="footerLayout">Footer Layout</Label>
                      <Select value={formData.footerLayout} onValueChange={(value) => handleInputChange('footerLayout', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                          <SelectItem value="contact">Contact Info</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Defaults */}
            {activeSection === 'defaults' && (
              <Card>
                <CardHeader>
                  <CardTitle>Default Values</CardTitle>
                  <CardDescription>
                    Update default values that will be pre-filled when using this template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultDueDays">Default Due Days</Label>
                      <Input
                        id="defaultDueDays"
                        type="number"
                        value={formData.defaultDueDays}
                        onChange={(e) => handleInputChange('defaultDueDays', parseInt(e.target.value) || 0)}
                        min="0"
                        max="365"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="defaultCurrency">Default Currency</Label>
                      <Select value={formData.defaultCurrency} onValueChange={(value) => handleInputChange('defaultCurrency', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="GHS">GHS - Ghana Cedi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="includeTax"
                        checked={formData.includeTax}
                        onCheckedChange={(checked) => handleInputChange('includeTax', checked)}
                      />
                      <Label htmlFor="includeTax">Include tax calculations</Label>
                    </div>
                    
                    {formData.includeTax && (
                      <div className="space-y-2">
                        <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                        <Input
                          id="defaultTaxRate"
                          type="number"
                          value={formData.defaultTaxRate}
                          onChange={(e) => handleInputChange('defaultTaxRate', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultTerms">Default Terms & Conditions</Label>
                    <Textarea
                      id="defaultTerms"
                      value={formData.defaultTerms}
                      onChange={(e) => handleInputChange('defaultTerms', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultNotes">Default Notes</Label>
                    <Textarea
                      id="defaultNotes"
                      value={formData.defaultNotes}
                      onChange={(e) => handleInputChange('defaultNotes', e.target.value)}
                      placeholder="Thank you for your business!"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePreview}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                
                <Button type="submit" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}