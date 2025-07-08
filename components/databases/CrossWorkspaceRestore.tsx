// components/databases/CrossWorkspaceRestore.tsx
'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertTriangle, Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { DatabaseMultiWorkspaceService } from '@/lib/database-management/database-multi-workspace';

interface RestoreTarget {
  id: string;
  name: string;
  type: 'main' | 'sub';
  conflicts: number;
  status: 'ready' | 'conflict' | 'error';
}

export default function CrossWorkspaceRestore() {
  const [sourceWorkspace, setSourceWorkspace] = useState('');
  const [targetWorkspaces, setTargetWorkspaces] = useState<string[]>([]);
  const [restoreType, setRestoreType] = useState('full');
  const [conflictResolution, setConflictResolution] = useState('overwrite');
  const [validateBeforeRestore, setValidateBeforeRestore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [validationResults, setValidationResults] = useState<{[key: string]: string}>({});
  const [availableWorkspaces, setAvailableWorkspaces] = useState<Array<{
    id: string;
    name: string;
    workspaceType: 'main' | 'sub';
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();

  useEffect(() => {
    loadAvailableWorkspaces();
  }, [user]);

  const loadAvailableWorkspaces = async () => {
    if (!user) return;

    try {
      const workspaces = await DatabaseMultiWorkspaceService.getAvailableWorkspaces(user.uid);
      setAvailableWorkspaces(workspaces);
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  };

  const handleValidation = async () => {
    if (!sourceWorkspace || targetWorkspaces.length === 0) {
      toast({
        title: "Error",
        description: "Please select source and target workspaces",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get source backup
      const sourceBackup = await DatabaseMultiWorkspaceService.getLatestBackup(sourceWorkspace);
      if (!sourceBackup) {
        throw new Error('No backup found for source workspace');
      }

      // Validate each target
      const validationResults: {[key: string]: string} = {};
      for (const targetWorkspaceId of targetWorkspaces) {
        try {
          const validation = await DatabaseMultiWorkspaceService.validateRestoreTarget(targetWorkspaceId, sourceBackup);
          validationResults[targetWorkspaceId] = validation.conflicts > 0 ? 'conflicts' : 'valid';
        } catch (error) {
          validationResults[targetWorkspaceId] = 'error';
        }
      }

      setValidationResults(validationResults);
      toast({
        title: "Validation Complete",
        description: "Target workspaces have been validated",
        variant: "default"
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Validation failed');
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : 'An error occurred during validation',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCrossRestore = async () => {
    if (!sourceWorkspace || targetWorkspaces.length === 0 || !user) {
      toast({
        title: "Error",
        description: "Please select source and target workspaces",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const restoreResult = await DatabaseMultiWorkspaceService.crossWorkspaceRestore(
        sourceWorkspace,
        targetWorkspaces,
        user.uid,
        {
          conflictResolution: conflictResolution as 'overwrite' | 'skip' | 'merge' | 'manual',
          restoreType: restoreType as 'full' | 'selective',
          validateBeforeRestore
        }
      );

      setResult(restoreResult);

      if (restoreResult.success) {
        toast({
          title: "Cross-Workspace Restore Successful",
          description: `Successfully restored ${restoreResult.restoredWorkspaces.length} workspace(s)`,
          variant: "default"
        });
      } else {
        toast({
          title: "Cross-Workspace Restore Completed with Errors",
          description: `${restoreResult.restoredWorkspaces.length} successful, ${restoreResult.errors.length} failed`,
          variant: "destructive"
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Cross-workspace restore failed');
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : 'An error occurred during restore',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'conflict': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="border border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowRight className="h-5 w-5 text-accent" />
          Cross-Workspace Restore
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Source Workspace</Label>
            <Select value={sourceWorkspace} onValueChange={setSourceWorkspace}>
              <SelectTrigger>
                <SelectValue placeholder="Select source workspace" />
              </SelectTrigger>
              <SelectContent>
                {availableWorkspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name} ({workspace.workspaceType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Restore Type</Label>
            <Select value={restoreType} onValueChange={setRestoreType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Restore</SelectItem>
                <SelectItem value="selective">Selective Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Conflict Resolution</Label>
          <Select value={conflictResolution} onValueChange={setConflictResolution}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overwrite">Overwrite Existing</SelectItem>
              <SelectItem value="skip">Skip Conflicts</SelectItem>
              <SelectItem value="merge">Merge Conflicts</SelectItem>
              <SelectItem value="manual">Manual Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Cross-workspace restore will affect multiple workspaces. Ensure you have proper permissions and backups.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label>Target Workspaces</Label>
          <div className="space-y-2">
            {availableWorkspaces
              .filter(w => w.id !== sourceWorkspace)
              .map((workspace) => (
                <div key={workspace.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(validationResults[workspace.id] || 'ready')}
                    <div>
                      <div className="font-medium text-sm">{workspace.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {workspace.workspaceType} workspace
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {validationResults[workspace.id] === 'conflicts' && (
                      <Badge variant="destructive">Conflicts</Badge>
                    )}
                    <Badge variant={workspace.workspaceType === 'main' ? 'default' : 'secondary'}>
                      {workspace.workspaceType}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {result && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <h5 className="text-sm font-medium mb-2">Restore Results</h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Restored:</span>
                <Badge variant="default">{result.restoredWorkspaces.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Errors:</span>
                <Badge variant="destructive">{result.errors.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Conflicts:</span>
                <Badge variant="destructive">{result.conflicts.length}</Badge>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleValidation}
            disabled={loading || !sourceWorkspace || targetWorkspaces.length === 0}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Validate Targets
          </Button>
          <Button
            className="bg-gradient-to-r from-accent to-primary text-white flex-1"
            onClick={handleCrossRestore}
            disabled={loading || !sourceWorkspace || targetWorkspaces.length === 0}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
            {loading ? 'Restoring...' : 'Start Cross-Restore'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 