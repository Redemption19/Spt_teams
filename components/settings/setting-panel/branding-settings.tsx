'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Palette, 
  Save, 
  RotateCcw, 
  Eye,
  AlertCircle,
  Crown,
  Building2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Workspace } from '@/lib/types';

interface BrandingSettingsProps {
  userRole: 'owner' | 'admin' | 'member';
  currentWorkspace: Workspace | null;
}

interface BrandingData {
  logoUrl: string;
  companyName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  headerText: string;
  footerText: string;
}

const defaultBranding: BrandingData = {
  logoUrl: '',
  companyName: '',
  tagline: '',
  primaryColor: '#8A0F3C',
  secondaryColor: '#CF163C',
  accentColor: '#F59E0B',
  fontFamily: 'Inter',
  headerText: '',
  footerText: ''
};

const fontOptions = [
  { value: 'Inter', label: 'Inter (Default)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' }
];

export function BrandingSettings({ userRole, currentWorkspace }: BrandingSettingsProps) {
  const [branding, setBranding] = useState<BrandingData>(defaultBranding);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Load branding data on component mount
  useEffect(() => {
    if (currentWorkspace) {
      const savedBranding = localStorage.getItem(`branding-${currentWorkspace.id}`);
      if (savedBranding) {
        try {
          setBranding({ ...defaultBranding, ...JSON.parse(savedBranding) });
        } catch (err) {
          console.error('Error parsing saved branding:', err);
        }
      } else {
        // Set default company name from workspace
        setBranding(prev => ({
          ...prev,
          companyName: currentWorkspace.name || ''
        }));
      }
    }
  }, [currentWorkspace]);

  const handleSave = async () => {
    if (!currentWorkspace) return;
    
    setLoading(true);
    try {
      // Save to localStorage (in real app, this would be saved to database)
      localStorage.setItem(`branding-${currentWorkspace.id}`, JSON.stringify(branding));
      
      toast({
        title: 'Success',
        description: 'Branding settings saved successfully'
      });
    } catch (err) {
      console.error('Error saving branding:', err);
      toast({
        title: 'Error',
        description: 'Failed to save branding settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBranding({
      ...defaultBranding,
      companyName: currentWorkspace?.name || ''
    });
    toast({
      title: 'Reset Complete',
      description: 'Branding settings have been reset to defaults'
    });
  };

  const updateBranding = (key: keyof BrandingData, value: string) => {
    setBranding(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload to a file storage service
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateBranding('logoUrl', result);
        toast({
          title: 'Logo Uploaded',
          description: 'Logo has been uploaded successfully'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (userRole === 'member') {
    return (
      <TabsContent value="branding" className="space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              You don&apos;t have permission to access branding settings.
            </p>
            <p className="text-sm text-muted-foreground">
              Contact your workspace administrator for access.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="branding" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Palette className="w-6 h-6" />
            Branding Settings
            {userRole === 'owner' && <Crown className="w-5 h-5 text-yellow-500" />}
          </h2>
          <p className="text-muted-foreground">
            Customize your workspace branding and visual identity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {previewMode && (
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            Preview mode is active. This shows how your branding will appear on invoices and documents.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo & Company Info */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={branding.companyName}
                onChange={(e) => updateBranding('companyName', e.target.value)}
                placeholder="Enter your company name"
                disabled={previewMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={branding.tagline}
                onChange={(e) => updateBranding('tagline', e.target.value)}
                placeholder="Your company tagline or slogan"
                disabled={previewMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Company Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    id="logoUrl"
                    value={branding.logoUrl}
                    onChange={(e) => updateBranding('logoUrl', e.target.value)}
                    placeholder="Logo URL or upload below"
                    disabled={previewMode}
                  />
                </div>
                {!previewMode && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                )}
              </div>
              {branding.logoUrl && (
                <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                  <Image 
                    src={branding.logoUrl} 
                    alt="Company Logo" 
                    width={128}
                    height={64}
                    className="max-h-16 max-w-32 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Color Scheme */}
        <Card>
          <CardHeader>
            <CardTitle>Color Scheme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => updateBranding('primaryColor', e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                    disabled={previewMode}
                  />
                  <Input
                    value={branding.primaryColor}
                    onChange={(e) => updateBranding('primaryColor', e.target.value)}
                    placeholder="#8A0F3C"
                    className="flex-1"
                    disabled={previewMode}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                    disabled={previewMode}
                  />
                  <Input
                    value={branding.secondaryColor}
                    onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                    placeholder="#CF163C"
                    className="flex-1"
                    disabled={previewMode}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={branding.accentColor}
                    onChange={(e) => updateBranding('accentColor', e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                    disabled={previewMode}
                  />
                  <Input
                    value={branding.accentColor}
                    onChange={(e) => updateBranding('accentColor', e.target.value)}
                    placeholder="#F59E0B"
                    className="flex-1"
                    disabled={previewMode}
                  />
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm font-medium mb-2">Color Preview</p>
              <div className="flex gap-2">
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: branding.primaryColor }}
                  title="Primary Color"
                />
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: branding.secondaryColor }}
                  title="Secondary Color"
                />
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: branding.accentColor }}
                  title="Accent Color"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <select
                id="fontFamily"
                value={branding.fontFamily}
                onChange={(e) => updateBranding('fontFamily', e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
                disabled={previewMode}
              >
                {fontOptions.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm font-medium mb-2">Font Preview</p>
              <div style={{ fontFamily: branding.fontFamily }}>
                <p className="text-lg font-bold">Sample Heading</p>
                <p className="text-sm">This is how your text will appear in documents.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Default Content */}
        <Card>
          <CardHeader>
            <CardTitle>Default Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headerText">Header Text</Label>
              <Textarea
                id="headerText"
                value={branding.headerText}
                onChange={(e) => updateBranding('headerText', e.target.value)}
                placeholder="Optional header text for invoices and documents"
                rows={3}
                disabled={previewMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerText">Footer Text</Label>
              <Textarea
                id="footerText"
                value={branding.footerText}
                onChange={(e) => updateBranding('footerText', e.target.value)}
                placeholder="Optional footer text for invoices and documents"
                rows={3}
                disabled={previewMode}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Card */}
      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="p-6 border rounded-lg bg-white"
              style={{
                fontFamily: branding.fontFamily,
                borderColor: branding.primaryColor
              }}
            >
              {/* Header */}
              {branding.headerText && (
                <div className="text-center mb-4 text-sm text-gray-600">
                  {branding.headerText}
                </div>
              )}
              
              {/* Logo and Company Info */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {branding.logoUrl && (
                    <Image 
                      src={branding.logoUrl} 
                      alt="Logo" 
                      width={96}
                      height={48}
                      className="max-h-12 max-w-24 object-contain"
                    />
                  )}
                  <div>
                    <h1 
                      className="text-xl font-bold"
                      style={{ color: branding.primaryColor }}
                    >
                      {branding.companyName || 'Your Company Name'}
                    </h1>
                    {branding.tagline && (
                      <p 
                        className="text-sm"
                        style={{ color: branding.secondaryColor }}
                      >
                        {branding.tagline}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <h2 
                    className="text-lg font-semibold"
                    style={{ color: branding.primaryColor }}
                  >
                    INVOICE
                  </h2>
                  <p className="text-sm text-gray-600">#INV-001</p>
                </div>
              </div>
              
              {/* Sample Content */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Sample invoice content would appear here...</p>
                <div className="flex justify-between items-center">
                  <span>Total:</span>
                  <span 
                    className="font-bold"
                    style={{ color: branding.accentColor }}
                  >
                    $1,000.00
                  </span>
                </div>
              </div>
              
              {/* Footer */}
              {branding.footerText && (
                <div className="text-center mt-6 pt-4 border-t text-sm text-gray-600">
                  {branding.footerText}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}