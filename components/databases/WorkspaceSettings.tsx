// components/databases/WorkspaceSettings.tsx
'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Clock, Trash2, Shield, Database, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { DatabaseHealthSettingsService, WorkspaceBackupSettings } from '@/lib/database-management/database-health-settings';

export default function WorkspaceSettings() {
  const [settings, setSettings] = useState<WorkspaceBackupSettings>({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    encryptionEnabled: true,
    compressionEnabled: true,
    notificationsEnabled: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    loadSettings();
  }, [currentWorkspace]);

  const loadSettings = async () => {
    if (!currentWorkspace) return;

    try {
      setLoading(true);
      setError(null);
      const workspaceSettings = await DatabaseHealthSettingsService.getBackupSettings(currentWorkspace.id);
      setSettings(workspaceSettings);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load settings');
      toast({
        title: "Error",
        description: "Failed to load backup settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentWorkspace) return;

    try {
      setSaving(true);
      setError(null);
      
      await DatabaseHealthSettingsService.updateBackupSettings(currentWorkspace.id, settings);
      
      toast({
        title: "Settings Saved",
        description: "Backup settings have been updated successfully",
        variant: "default"
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save settings');
      toast({
        title: "Error",
        description: "Failed to save backup settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCleanup = async () => {
    if (!currentWorkspace) return;

    try {
      setSaving(true);
      const deletedCount = await DatabaseHealthSettingsService.cleanupOldBackups(
        currentWorkspace.id, 
        settings.retentionDays
      );
      
      toast({
        title: "Cleanup Complete",
        description: `Deleted ${deletedCount} old backup(s)`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Cleanup Failed",
        description: "Failed to cleanup old backups",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Workspace Database Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5 text-primary" />
          Workspace Database Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Backup Schedule */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Backup Schedule
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Automatic Backups</Label>
                <div className="text-xs text-muted-foreground">Enable scheduled backups</div>
              </div>
              <Switch 
                checked={settings.autoBackup} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
              />
            </div>
            
            {settings.autoBackup && (
              <div className="space-y-2">
                <Label>Backup Frequency</Label>
                <Select 
                  value={settings.backupFrequency} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, backupFrequency: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Retention Policy */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Retention Policy
          </h4>
          <div className="space-y-2">
            <Label>Keep Backups For (Days)</Label>
            <Input
              type="number"
              value={settings.retentionDays}
              onChange={(e) => setSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))}
              className="w-32"
              min="1"
              max="365"
            />
            <div className="text-xs text-muted-foreground">
              Backups older than {settings.retentionDays} days will be automatically deleted
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Settings
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Data Encryption</Label>
                <div className="text-xs text-muted-foreground">Encrypt backup files</div>
              </div>
              <Switch 
                checked={settings.encryptionEnabled} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, encryptionEnabled: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Compression</Label>
                <div className="text-xs text-muted-foreground">Compress backup files</div>
              </div>
              <Switch 
                checked={settings.compressionEnabled} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, compressionEnabled: checked }))}
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Notifications
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Backup Notifications</Label>
                <div className="text-xs text-muted-foreground">Notify on backup completion</div>
              </div>
              <Switch 
                checked={settings.notificationsEnabled} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notificationsEnabled: checked }))}
              />
            </div>
          </div>
        </div>

        {/* Current Settings Summary */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <h5 className="text-sm font-medium mb-2">Current Settings</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Auto Backup:</span>
              <Badge variant={settings.autoBackup ? 'default' : 'secondary'}>
                {settings.autoBackup ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Frequency:</span>
              <span className="capitalize">{settings.backupFrequency}</span>
            </div>
            <div className="flex justify-between">
              <span>Retention:</span>
              <span>{settings.retentionDays} days</span>
            </div>
            <div className="flex justify-between">
              <span>Encryption:</span>
              <Badge variant={settings.encryptionEnabled ? 'default' : 'secondary'}>
                {settings.encryptionEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-gradient-to-r from-primary to-accent text-white"
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button 
            variant="outline"
            onClick={handleCleanup}
            disabled={saving}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 