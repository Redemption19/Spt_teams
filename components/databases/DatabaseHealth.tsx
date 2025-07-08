// components/databases/DatabaseHealth.tsx
'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, HardDrive, Zap, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { DatabaseHealthSettingsService, type DatabaseHealth } from '@/lib/database-management/database-health-settings';
import { Button } from '@/components/ui/button';

export default function DatabaseHealth() {
  const [healthData, setHealthData] = useState<DatabaseHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspace();

  const loadHealthData = async () => {
    if (!currentWorkspace) return;

    try {
      setLoading(true);
      setError(null);
      const health = await DatabaseHealthSettingsService.getDatabaseHealth(currentWorkspace.id);
      setHealthData(health);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, [currentWorkspace]);

  useEffect(() => {
    // Auto-refresh health data every 30 seconds
    const interval = setInterval(() => {
      if (currentWorkspace) {
        loadHealthData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentWorkspace]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading && !healthData) {
    return (
      <Card className="border border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Database Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Database Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHealthData}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!healthData) {
    return (
      <Card className="border border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Database Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4 text-muted-foreground">
            No health data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Database Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(healthData.status)}`} />
            <Badge variant={healthData.status === 'healthy' ? 'default' : 'destructive'}>
              {healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                Storage Usage
              </span>
              <span>{healthData.storageUsed}%</span>
            </div>
            <Progress value={healthData.storageUsed} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Performance
              </span>
              <span>{healthData.performance}%</span>
            </div>
            <Progress value={healthData.performance} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
            <span>Active Connections</span>
            <span className="font-medium">{healthData.connections}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
            <span>Last Check</span>
            <span className="text-xs">{healthData.lastCheck.toLocaleString()}</span>
          </div>
        </div>

        {healthData.issues.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Issues Detected:</div>
                <ul className="text-xs space-y-1">
                  {healthData.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {getStatusIcon(healthData.status)}
          {healthData.status === 'healthy' 
            ? 'All systems operational' 
            : `${healthData.issues.length} issue(s) detected`
          }
        </div>
      </CardContent>
    </Card>
  );
} 