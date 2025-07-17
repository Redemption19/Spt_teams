// components/databases/MultiWorkspaceBackup.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Globe, Building2, Users, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { DatabaseMultiWorkspaceService } from '@/lib/database-management/database-multi-workspace';

interface Workspace {
  id: string;
  name: string;
  workspaceType: 'main' | 'sub';
  level: number;
  children: string[];
  parent?: string;
  status: 'active' | 'inactive';
  lastBackup?: Date;
}

export default function MultiWorkspaceBackup() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);
  const [backupStrategy, setBackupStrategy] = useState('hierarchical');
  const [backupType, setBackupType] = useState('full');
  const [compression, setCompression] = useState('gzip');
  const [loading, setLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState<{[key: string]: number}>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();

  const loadWorkspaces = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const availableWorkspaces = await DatabaseMultiWorkspaceService.getAvailableWorkspaces(user.uid);
      setWorkspaces(availableWorkspaces);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load workspaces');
      toast({
        title: "Error",
        description: "Failed to load workspaces",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadWorkspaces();
  }, [user, loadWorkspaces]);

  const handleWorkspaceSelection = (workspaceId: string, checked: boolean) => {
    if (checked) {
      setSelectedWorkspaces(prev => [...prev, workspaceId]);
    } else {
      setSelectedWorkspaces(prev => prev.filter(id => id !== workspaceId));
    }
  };

  const handleSelectAll = () => {
    setSelectedWorkspaces(workspaces.map(w => w.id));
  };

  const handleSelectNone = () => {
    setSelectedWorkspaces([]);
  };

  const handleMultiBackup = async () => {
    if (selectedWorkspaces.length === 0 || !user) {
      toast({
        title: "Error",
        description: "Please select at least one workspace",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setBackupProgress({});
    setError(null);
    setResult(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => {
          const newProgress = { ...prev };
          selectedWorkspaces.forEach(workspaceId => {
            if (!newProgress[workspaceId] || newProgress[workspaceId] < 90) {
              newProgress[workspaceId] = (newProgress[workspaceId] || 0) + 10;
            }
          });
          return newProgress;
        });
      }, 500);

      const backupResult = await DatabaseMultiWorkspaceService.createMultiWorkspaceBackup(
        selectedWorkspaces,
        user.uid,
        {
          strategy: backupStrategy as 'hierarchical' | 'individual' | 'selective',
          backupType: backupType as 'full' | 'incremental' | 'differential',
          compression: compression as 'none' | 'gzip' | 'zip',
          includeFiles: true,
          includeUsers: true,
          includeSettings: true
        }
      );

      clearInterval(progressInterval);
      
      // Set all to 100% completion
      setBackupProgress(prev => {
        const newProgress = { ...prev };
        selectedWorkspaces.forEach(workspaceId => {
          newProgress[workspaceId] = 100;
        });
        return newProgress;
      });

      setResult(backupResult);

      if (backupResult.success) {
        toast({
          title: "Multi-Workspace Backup Successful",
          description: `Successfully backed up ${backupResult.backups.length} workspace(s). Total size: ${(backupResult.totalSize / 1024).toFixed(2)} KB`,
          variant: "default"
        });
      } else {
        toast({
          title: "Multi-Workspace Backup Completed with Errors",
          description: `${backupResult.backups.length} successful, ${backupResult.errors.length} failed`,
          variant: "destructive"
        });
      }

      // Reset progress after a delay
      setTimeout(() => setBackupProgress({}), 3000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Multi-workspace backup failed');
      toast({
        title: "Backup Failed",
        description: error instanceof Error ? error.message : 'An error occurred during backup',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getWorkspaceIcon = (type: string) => {
    return type === 'main' ? <Globe className="h-4 w-4" /> : <Building2 className="h-4 w-4" />;
  };

  return (
    <Card className="border border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-primary" />
          Multi-Workspace Backup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Backup Strategy</Label>
            <Select value={backupStrategy} onValueChange={setBackupStrategy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hierarchical">Hierarchical (Main + Sub)</SelectItem>
                <SelectItem value="individual">Individual Workspaces</SelectItem>
                <SelectItem value="selective">Selective Backup</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
          <div className="flex items-center justify-between">
            <Label>Select Workspaces</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleSelectNone}>
                Clear
              </Button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedWorkspaces.includes(workspace.id)}
                    onCheckedChange={(checked) => handleWorkspaceSelection(workspace.id, checked as boolean)}
                  />
                  <div className="flex items-center gap-2">
                    {getWorkspaceIcon(workspace.workspaceType)}
                    <div>
                      <div className="font-medium text-sm">{workspace.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Level {workspace.level} • {workspace.children.length} children
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={workspace.status === 'active' ? 'default' : 'secondary'}>
                    {workspace.status}
                  </Badge>
                  {backupProgress[workspace.id] !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      {backupProgress[workspace.id]}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {result && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <h5 className="text-sm font-medium mb-2">Backup Results</h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Successful:</span>
                <Badge variant="default">{result.backups.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Errors:</span>
                <Badge variant="destructive">{result.errors.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Total Size:</span>
                <span>{(result.totalSize / 1024).toFixed(2)} KB</span>
              </div>
            </div>
          </div>
        )}

        <Button
          className="bg-gradient-to-r from-primary to-accent text-white w-full"
          onClick={handleMultiBackup}
          disabled={loading || selectedWorkspaces.length === 0}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Backing Up...' : `Backup ${selectedWorkspaces.length} Workspace${selectedWorkspaces.length !== 1 ? 's' : ''}`}
        </Button>
      </CardContent>
    </Card>
  );
} 