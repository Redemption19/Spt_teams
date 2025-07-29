'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useIsOwner } from '@/lib/rbac-hooks';
import { PermissionsService } from '@/lib/permissions-service';

interface TemplateSettings {
  defaultCategory: string;
  defaultTerms: string;
  defaultNotes: string;
  defaultTaxRate: number;
  autoNumbering: boolean;
  numberingPrefix: string;
  numberingStartFrom: number;
  includeCompanyLogo: boolean;
  defaultCurrency: string;
  defaultDueDays: number;
  defaultPaymentTerms: string;
  footerText: string;
  headerText: string;
}

const defaultSettings: TemplateSettings = {
  defaultCategory: 'business',
  defaultTerms: 'Payment is due within 30 days of invoice date.',
  defaultNotes: 'Thank you for your business!',
  defaultTaxRate: 0,
  autoNumbering: true,
  numberingPrefix: 'INV-',
  numberingStartFrom: 1000,
  includeCompanyLogo: true,
  defaultCurrency: 'USD',
  defaultDueDays: 30,
  defaultPaymentTerms: 'Net 30',
  footerText: '',
  headerText: ''
};

export default function TemplateSettingsPage() {
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const router = useRouter();
  const isOwner = useIsOwner();

  const [settings, setSettings] = useState<TemplateSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  // Check permissions
  useEffect(() => {
    async function checkPermissions() {
      if (!userProfile || !currentWorkspace) return;
      
      if (userProfile.role === 'owner') {
        setCanEdit(true);
      } else {
        const hasPermission = await PermissionsService.hasPermission(
          userProfile.id, 
          currentWorkspace.id, 
          'invoices.edit'
        );
        setCanEdit(hasPermission);
      }
      
      // Load settings from localStorage or API
      const savedSettings = localStorage.getItem(`template-settings-${currentWorkspace.id}`);
      if (savedSettings) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
        } catch (err) {
          console.error('Error parsing saved settings:', err);
        }
      }
      
      setLoading(false);
    }
    
    checkPermissions();
  }, [userProfile, currentWorkspace]);

  const handleSave = async () => {
    if (!canEdit || !currentWorkspace) {
      toast({
        title: 'Error',
        description: 'You do not have permission to save settings',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      // Save to localStorage (in real app, this would be saved to database)
      localStorage.setItem(`template-settings-${currentWorkspace.id}`, JSON.stringify(settings));
      
      toast({
        title: 'Success',
        description: 'Template settings saved successfully'
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast({
      title: 'Settings Reset',
      description: 'All settings have been reset to defaults'
    });
  };

  const updateSetting = (key: keyof TemplateSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Template Settings</h1>
            <p className="text-muted-foreground">Configure default values for invoice templates</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Template Settings</h1>
            <p className="text-muted-foreground">Configure default values for invoice templates</p>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You don&apos;t have permission to modify template settings.
            </p>
            <p className="text-sm text-muted-foreground">
              Contact your workspace administrator for access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Template Settings</h1>
            <p className="text-muted-foreground">Configure default values for invoice templates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic template configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultCategory">Default Category</Label>
              <Select value={settings.defaultCategory} onValueChange={(value) => updateSetting('defaultCategory', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Select value={settings.defaultCurrency} onValueChange={(value) => updateSetting('defaultCurrency', value)}>
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

            <div className="space-y-2">
              <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
              <Input
                id="defaultTaxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.defaultTaxRate}
                onChange={(e) => updateSetting('defaultTaxRate', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultDueDays">Default Due Days</Label>
              <Input
                id="defaultDueDays"
                type="number"
                min="1"
                value={settings.defaultDueDays}
                onChange={(e) => updateSetting('defaultDueDays', parseInt(e.target.value) || 30)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultPaymentTerms">Default Payment Terms</Label>
              <Input
                id="defaultPaymentTerms"
                value={settings.defaultPaymentTerms}
                onChange={(e) => updateSetting('defaultPaymentTerms', e.target.value)}
                placeholder="e.g., Net 30, Due on Receipt"
              />
            </div>
          </CardContent>
        </Card>

        {/* Numbering Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Numbering</CardTitle>
            <CardDescription>Configure automatic invoice numbering</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Numbering</Label>
                <p className="text-sm text-muted-foreground">Automatically generate invoice numbers</p>
              </div>
              <Switch
                checked={settings.autoNumbering}
                onCheckedChange={(checked) => updateSetting('autoNumbering', checked)}
              />
            </div>

            {settings.autoNumbering && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="numberingPrefix">Number Prefix</Label>
                  <Input
                    id="numberingPrefix"
                    value={settings.numberingPrefix}
                    onChange={(e) => updateSetting('numberingPrefix', e.target.value)}
                    placeholder="e.g., INV-, BILL-"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberingStartFrom">Start From</Label>
                  <Input
                    id="numberingStartFrom"
                    type="number"
                    min="1"
                    value={settings.numberingStartFrom}
                    onChange={(e) => updateSetting('numberingStartFrom', parseInt(e.target.value) || 1000)}
                  />
                </div>

                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Preview: {settings.numberingPrefix}{settings.numberingStartFrom}
                  </p>
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include Company Logo</Label>
                <p className="text-sm text-muted-foreground">Show logo on templates by default</p>
              </div>
              <Switch
                checked={settings.includeCompanyLogo}
                onCheckedChange={(checked) => updateSetting('includeCompanyLogo', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Default Content */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Default Content</CardTitle>
            <CardDescription>Set default text content for new templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="headerText">Header Text</Label>
                <Textarea
                  id="headerText"
                  value={settings.headerText}
                  onChange={(e) => updateSetting('headerText', e.target.value)}
                  placeholder="Optional header text for invoices"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Text</Label>
                <Textarea
                  id="footerText"
                  value={settings.footerText}
                  onChange={(e) => updateSetting('footerText', e.target.value)}
                  placeholder="Optional footer text for invoices"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultTerms">Default Terms & Conditions</Label>
              <Textarea
                id="defaultTerms"
                value={settings.defaultTerms}
                onChange={(e) => updateSetting('defaultTerms', e.target.value)}
                placeholder="Enter default terms and conditions"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultNotes">Default Notes</Label>
              <Textarea
                id="defaultNotes"
                value={settings.defaultNotes}
                onChange={(e) => updateSetting('defaultNotes', e.target.value)}
                placeholder="Enter default notes for invoices"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}