// components/databases/DatabaseExport.tsx
'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { FileDown, Calendar, Loader2, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { DatabaseImportExportService } from '@/lib/database-management/database-import-export';

export default function DatabaseExport() {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('json');
  const [compression, setCompression] = useState('none');
  const [includeUsers, setIncludeUsers] = useState(true);
  const [includeProjects, setIncludeProjects] = useState(true);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeTeams, setIncludeTeams] = useState(true);
  const [includeReports, setIncludeReports] = useState(false);
  const [includeSettings, setIncludeSettings] = useState(false);
  const [useDateRange, setUseDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleExport = async () => {
    if (!currentWorkspace || !user) {
      toast({
        title: "Error",
        description: "Please select a workspace and ensure you're logged in",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      const exportResult = await DatabaseImportExportService.exportWorkspaceData(
        currentWorkspace.id,
        user.uid,
        {
          format: format as 'json' | 'csv' | 'xml' | 'sql',
          compression: compression as 'none' | 'gzip' | 'zip',
          includeUsers,
          includeProjects,
          includeTasks,
          includeTeams,
          includeReports,
          includeSettings,
          dateRange: useDateRange && startDate && endDate ? {
            start: new Date(startDate),
            end: new Date(endDate)
          } : undefined
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (exportResult.success) {
        setResult(exportResult);
        toast({
          title: "Export Successful",
          description: `Exported ${exportResult.recordCount} records to ${exportResult.fileName}`,
          variant: "default"
        });

        // Auto-download the file
        if (exportResult.downloadUrl) {
          const link = document.createElement('a');
          link.href = exportResult.downloadUrl;
          link.download = exportResult.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        setError(exportResult.error || 'Export failed');
        toast({
          title: "Export Failed",
          description: exportResult.error || 'An error occurred during export',
          variant: "destructive"
        });
      }

      // Reset progress after a delay
      setTimeout(() => setProgress(0), 3000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Export failed');
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : 'An error occurred during export',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'json': return 'Structured data format, best for data processing';
      case 'csv': return 'Comma-separated values, good for spreadsheet import';
      case 'xml': return 'Extensible markup language, good for system integration';
      case 'sql': return 'SQL statements, good for database import';
      default: return '';
    }
  };

  const getCompressionDescription = (compression: string) => {
    switch (compression) {
      case 'none': return 'No compression (larger file size)';
      case 'gzip': return 'GZIP compression (good compression ratio)';
      case 'zip': return 'ZIP compression (widely compatible)';
      default: return '';
    }
  };

  return (
    <Card className="border border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileDown className="h-5 w-5 text-primary" />
          Export Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getFormatDescription(format)}
            </p>
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
            <p className="text-xs text-muted-foreground">
              {getCompressionDescription(compression)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Include Data</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="export-users" 
                checked={includeUsers} 
                onCheckedChange={(checked) => setIncludeUsers(checked as boolean)}
              />
              <Label htmlFor="export-users">Users & Profiles</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="export-projects" 
                checked={includeProjects} 
                onCheckedChange={(checked) => setIncludeProjects(checked as boolean)}
              />
              <Label htmlFor="export-projects">Projects & Tasks</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="export-teams" 
                checked={includeTeams} 
                onCheckedChange={(checked) => setIncludeTeams(checked as boolean)}
              />
              <Label htmlFor="export-teams">Teams & Departments</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="export-reports" 
                checked={includeReports} 
                onCheckedChange={(checked) => setIncludeReports(checked as boolean)}
              />
              <Label htmlFor="export-reports">Reports & Analytics</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="export-settings" 
                checked={includeSettings} 
                onCheckedChange={(checked) => setIncludeSettings(checked as boolean)}
              />
              <Label htmlFor="export-settings">Workspace Settings</Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="use-date-range" 
              checked={useDateRange} 
              onCheckedChange={(checked) => setUseDateRange(checked as boolean)}
            />
            <Label htmlFor="use-date-range">Filter by Date Range</Label>
          </div>
          
          {useDateRange && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          )}
        </div>

        {progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Export Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Export completed successfully!</div>
                <div className="text-sm">
                  File: {result.fileName} • Size: {(result.size / 1024).toFixed(2)} KB • Records: {result.recordCount}
                </div>
                {result.downloadUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = result.downloadUrl;
                      link.download = result.fileName;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Again
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button
          className="bg-gradient-to-r from-primary to-accent text-white w-full"
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Exporting...' : 'Export Data'}
        </Button>
      </CardContent>
    </Card>
  );
} 