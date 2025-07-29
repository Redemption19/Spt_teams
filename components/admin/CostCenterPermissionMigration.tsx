'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { CostCenterMigration } from '@/lib/cost-center-migration';
import { Shield, Play, CheckCircle, XCircle, AlertTriangle, Users, Building } from 'lucide-react';

interface MigrationResult {
  success: number;
  errors: string[];
  details: { userId: string; workspaceId?: string; role: string; status: string }[];
}

export function CostCenterPermissionMigration() {
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [migrationType, setMigrationType] = useState<'all' | 'workspace'>('workspace');

  const isOwner = userProfile?.role === 'owner';

  const runMigration = async (type: 'all' | 'workspace') => {
    if (!isOwner) {
      toast({
        title: 'Permission Denied',
        description: 'Only owners can run permission migrations.',
        variant: 'destructive'
      });
      return;
    }

    setIsRunning(true);
    setResult(null);
    
    try {
      let migrationResult: MigrationResult;
      
      if (type === 'all') {
        migrationResult = await CostCenterMigration.migrateCostCenterPermissions();
      } else {
        if (!currentWorkspace?.id) {
          throw new Error('No current workspace selected');
        }
        const workspaceResult = await CostCenterMigration.migrateCostCenterPermissionsForWorkspace(currentWorkspace.id);
        migrationResult = {
          success: workspaceResult.success,
          errors: workspaceResult.errors,
          details: workspaceResult.details.map(d => ({
            userId: d.userId,
            workspaceId: currentWorkspace.id,
            role: d.role,
            status: d.status
          }))
        };
      }
      
      setResult(migrationResult);
      
      if (migrationResult.errors.length === 0) {
        toast({
          title: 'Migration Successful',
          description: `Successfully migrated permissions for ${migrationResult.success} users.`
        });
      } else {
        toast({
          title: 'Migration Completed with Errors',
          description: `${migrationResult.success} successful, ${migrationResult.errors.length} errors.`,
          variant: 'destructive'
        });
      }
      
    } catch (error) {
      console.error('Migration failed:', error);
      toast({
        title: 'Migration Failed',
        description: `Failed to run migration: ${error}`,
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOwner) {
    return (
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Shield className="w-5 h-5" />
            <span>Only workspace owners can access permission migration tools.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Cost Center Permissions Migration
          </CardTitle>
          <CardDescription>
            Grant default cost center permissions to existing users based on their roles.
            This is needed when cost center features are added to existing workspaces.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This migration will grant cost center permissions to users based on their current roles:
              <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                <li><strong>Owners:</strong> All cost center permissions</li>
                <li><strong>Admins:</strong> All permissions except delete</li>
                <li><strong>Members:</strong> View permission only</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-transparent hover:border-primary/20 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Current Workspace Only
                </CardTitle>
                <CardDescription>
                  Migrate permissions for users in the current workspace ({currentWorkspace?.name})
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  onClick={() => runMigration('workspace')}
                  disabled={isRunning}
                  className="w-full"
                  variant={migrationType === 'workspace' ? 'default' : 'outline'}
                >
                  {isRunning && migrationType === 'workspace' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Running...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Migrate Workspace
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-transparent hover:border-primary/20 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  All Workspaces
                </CardTitle>
                <CardDescription>
                  Migrate permissions for users across all workspaces you own
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  onClick={() => runMigration('all')}
                  disabled={isRunning}
                  className="w-full"
                  variant={migrationType === 'all' ? 'default' : 'outline'}
                >
                  {isRunning && migrationType === 'all' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Running...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Migrate All
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.errors.length === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              Migration Results
            </CardTitle>
            <CardDescription>
              {result.success} successful, {result.errors.length} errors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4">
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                {result.success} Successful
              </Badge>
              {result.errors.length > 0 && (
                <Badge variant="destructive">
                  {result.errors.length} Errors
                </Badge>
              )}
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Errors:</h4>
                <div className="space-y-1">
                  {result.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="space-y-2">
              <h4 className="font-medium">Migration Details:</h4>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {result.details.map((detail, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{detail.userId.substring(0, 8)}...</span>
                      {detail.workspaceId && (
                        <span className="text-muted-foreground">•</span>
                      )}
                      {detail.workspaceId && (
                        <span className="font-mono text-xs">{detail.workspaceId.substring(0, 8)}...</span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {detail.role}
                      </Badge>
                    </div>
                    <Badge 
                      variant={detail.status === 'Success' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {detail.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 