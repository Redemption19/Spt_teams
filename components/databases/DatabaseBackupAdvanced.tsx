// components/databases/DatabaseBackupAdvanced.tsx
'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Clock, Settings, Shield, Loader2 } from 'lucide-react';

export default function DatabaseBackupAdvanced() {
  const [loading, setLoading] = useState(false);
  const [backupType, setBackupType] = useState('full');
  const [compression, setCompression] = useState('gzip');
  const [includeFiles, setIncludeFiles] = useState(true);
  const [includeUsers, setIncludeUsers] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('02:00');

  const handleAdvancedBackup = async () => {
    setLoading(true);
    // Simulate advanced backup process
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  };

  return (
    <Card className="border border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5 text-primary" />
          Advanced Backup Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Backup Type</Label>
            <Select value={backupType} onValueChange={setBackupType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Backup</SelectItem>
                <SelectItem value="incremental">Incremental</SelectItem>
                <SelectItem value="differential">Differential</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Compression</Label>
            <Select value={compression} onValueChange={setCompression}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="gzip">GZIP</SelectItem>
                <SelectItem value="zip">ZIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Include in Backup</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-files" 
                checked={includeFiles} 
                onCheckedChange={(checked) => setIncludeFiles(checked as boolean)}
              />
              <Label htmlFor="include-files">Files & Documents</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-users" 
                checked={includeUsers} 
                onCheckedChange={(checked) => setIncludeUsers(checked as boolean)}
              />
              <Label htmlFor="include-users">User Data</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-settings" 
                checked={includeSettings} 
                onCheckedChange={(checked) => setIncludeSettings(checked as boolean)}
              />
              <Label htmlFor="include-settings">Settings & Configuration</Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="schedule-enabled" 
              checked={scheduleEnabled} 
              onCheckedChange={(checked) => setScheduleEnabled(checked as boolean)}
            />
            <Label htmlFor="schedule-enabled">Enable Scheduled Backups</Label>
          </div>
          {scheduleEnabled && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">Daily</span>
            </div>
          )}
        </div>

        <Button
          className="bg-gradient-to-r from-primary to-accent text-white w-full"
          onClick={handleAdvancedBackup}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Shield className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Creating Advanced Backup...' : 'Create Advanced Backup'}
        </Button>
      </CardContent>
    </Card>
  );
} 