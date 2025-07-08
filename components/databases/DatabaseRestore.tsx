// components/databases/DatabaseRestore.tsx
'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { DatabaseService } from '@/lib/database-management/database-core';

interface BackupFile {
  workspaceId: string;
  timestamp: string;
  collections: Record<string, any[]>;
  metadata: {
    userCount: number;
    projectCount: number;
    taskCount: number;
    teamCount: number;
    reportCount: number;
  };
}

export default function DatabaseRestore() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [backupData, setBackupData] = useState<BackupFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setMessage(null);
    setBackupData(null);

    try {
      // Validate file type
      if (!selectedFile.name.endsWith('.json')) {
        throw new Error('Please select a valid JSON backup file');
      }

      // Read and parse backup file
      const text = await selectedFile.text();
      const data = JSON.parse(text) as BackupFile;

      // Validate backup data structure
      if (!data.workspaceId || !data.collections || !data.metadata) {
        throw new Error('Invalid backup file format');
      }

      setBackupData(data);
      setMessage('Backup file validated successfully');

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid backup file');
      setFile(null);
    }
  };

  const handleRestore = async () => {
    if (!file || !backupData || !currentWorkspace || !user) {
      toast({
        title: "Error",
        description: "Please select a valid backup file",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      const success = await DatabaseService.restoreBackup(
        currentWorkspace.id,
        user.uid,
        `restore_${Date.now()}`,
        {
          conflictResolution: 'overwrite',
          restoreType: 'full'
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (success) {
        setMessage('Database restored successfully!');
        toast({
          title: "Restore Successful",
          description: "Database has been restored from backup",
          variant: "default"
        });
      } else {
        throw new Error('Restore operation failed');
      }

      // Reset progress after a delay
      setTimeout(() => setProgress(0), 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Restore failed');
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : 'An error occurred during restore',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="h-5 w-5 text-accent" />
          Restore Database
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Restoring will overwrite all current data. 
            Make sure you have a backup before proceeding.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label className="text-sm font-medium">Select Backup File</label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="block w-full text-xs text-muted-foreground border border-border rounded p-2"
            disabled={loading}
          />
        </div>

        {backupData && (
          <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
              <CheckCircle className="h-4 w-4" />
              Backup File Validated
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Workspace: {backupData.workspaceId}</div>
              <div>Date: {new Date(backupData.timestamp).toLocaleString()}</div>
              <div>Users: {backupData.metadata.userCount}</div>
              <div>Projects: {backupData.metadata.projectCount}</div>
              <div>Tasks: {backupData.metadata.taskCount}</div>
              <div>Teams: {backupData.metadata.teamCount}</div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && progress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Restore Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button
          className="bg-gradient-to-r from-accent to-primary text-white w-full"
          onClick={handleRestore}
          disabled={!file || !backupData || loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Restoring...' : 'Restore Now'}
        </Button>

        {message && (
          <div className="text-xs text-green-600 dark:text-green-400">
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 