// components/databases/DatabaseBackup.tsx
'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { DatabaseService, type DatabaseBackup } from '@/lib/database-management/database-core';

export default function DatabaseBackup() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastBackup, setLastBackup] = useState<DatabaseBackup | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();

  const handleBackup = async () => {
    if (!currentWorkspace || !user) {
      toast({
        title: "Error",
        description: "Workspace or user information not available",
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
          return prev + 10;
        });
      }, 200);

      const backup = await DatabaseService.createBackup(
        currentWorkspace.id,
        user.uid,
        {
          backupType: 'full',
          compression: 'gzip',
          includeFiles: true,
          includeUsers: true,
          includeSettings: true
        }
      );

      clearInterval(progressInterval);
      setProgress(100);
      setLastBackup(backup);

      toast({
        title: "Backup Successful",
        description: `Database backup completed successfully. Size: ${(backup.size / 1024).toFixed(2)} KB`,
        variant: "default"
      });

      // Reset progress after a delay
      setTimeout(() => setProgress(0), 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Backup failed');
      toast({
        title: "Backup Failed",
        description: error instanceof Error ? error.message : 'An error occurred during backup',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async (backup: DatabaseBackup) => {
    if (!backup.downloadUrl) {
      toast({
        title: "Download Error",
        description: "Backup file not available for download",
        variant: "destructive"
      });
      return;
    }

    try {
      // Open download URL in new tab to avoid CORS issues
      const newWindow = window.open(backup.downloadUrl, '_blank');
      
      if (newWindow) {
        toast({
          title: "Download Started",
          description: "Backup file opened in new tab. Right-click and 'Save As' to download.",
          variant: "default"
        });
      } else {
        // Fallback: Copy URL to clipboard
        await navigator.clipboard.writeText(backup.downloadUrl);
        toast({
          title: "Download URL Copied",
          description: "Backup download URL copied to clipboard. Paste in browser to download.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download backup file. Please try again later.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="h-5 w-5 text-primary" />
          Backup Database
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Create a secure backup of your current workspace database. 
          The backup includes all workspace data and can be downloaded for safekeeping.
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && progress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Backup Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button
          className="bg-gradient-to-r from-primary to-accent text-white w-full"
          onClick={handleBackup}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Backing Up...' : 'Backup Now'}
        </Button>

        {lastBackup && (
          <div className="space-y-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              Last Backup Successful
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Date: {lastBackup.timestamp.toLocaleString()}</div>
              <div>Size: {(lastBackup.size / 1024).toFixed(2)} KB</div>
              <div>Type: {lastBackup.backupType}</div>
            </div>
            {lastBackup.downloadUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadBackup(lastBackup)}
                className="w-full"
              >
                <Download className="h-3 w-3 mr-1" />
                Download Backup
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 