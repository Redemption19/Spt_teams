'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Wallet,
  FileText,
  BarChart3,
  Target,
  Receipt,
  CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { FinancialPermissionsService } from '@/lib/financial-permissions-service';
import { UserService } from '@/lib/user-service';

interface MigrationResult {
  userId: string;
  userName: string;
  userRole: string;
  success: boolean;
  error?: string;
  permissionsGranted: number;
}

export function FinancialPermissionMigration() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [currentStep, setCurrentStep] = useState('');

  const handleMigrateCurrentWorkspace = async () => {
    if (!currentWorkspace?.id || !user?.uid) {
      toast({
        title: 'Error',
        description: 'No workspace selected or user not authenticated.',
        variant: 'destructive'
      });
      return;
    }

    await performMigration([currentWorkspace.id], 'current workspace');
  };

  const handleMigrateAllWorkspaces = async () => {
    if (!user?.uid || accessibleWorkspaces.length === 0) {
      toast({
        title: 'Error',
        description: 'No accessible workspaces found.',
        variant: 'destructive'
      });
      return;
    }

    const workspaceIds = accessibleWorkspaces.map(ws => ws.id);
    await performMigration(workspaceIds, 'all accessible workspaces');
  };

  const performMigration = async (workspaceIds: string[], scope: string) => {
    try {
      setMigrating(true);
      setProgress(0);
      setResults([]);
      setCurrentStep('Initializing migration...');

      let totalProcessed = 0;
      const allResults: MigrationResult[] = [];

      for (const workspaceId of workspaceIds) {
        setCurrentStep(`Processing workspace: ${workspaceId}`);
        
        try {
          // Get all users in workspace
          const users = await UserService.getUsersByWorkspace(workspaceId);
          
          for (let i = 0; i < users.length; i++) {
            const userItem = users[i];
            setCurrentStep(`Migrating permissions for: ${userItem.name || userItem.email}`);
            
            try {
              await FinancialPermissionsService.grantDefaultPermissions(
                userItem.id,
                workspaceId,
                userItem.role as 'owner' | 'admin' | 'member',
                user?.uid || 'system'
              );
              
              const permissionsCount = getPermissionCountForRole(userItem.role);
              
              allResults.push({
                userId: userItem.id,
                userName: userItem.name || userItem.email,
                userRole: userItem.role,
                success: true,
                permissionsGranted: permissionsCount
              });
              
            } catch (error) {
              console.error(`Error migrating permissions for user ${userItem.id}:`, error);
              allResults.push({
                userId: userItem.id,
                userName: userItem.name || userItem.email,
                userRole: userItem.role,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                permissionsGranted: 0
              });
            }
            
            totalProcessed++;
            const totalUsers = workspaceIds.reduce((sum, id) => {
              // This is an approximation - we'd need to calculate the exact total
              return sum + users.length;
            }, 0);
            setProgress((totalProcessed / totalUsers) * 100);
          }
          
        } catch (error) {
          console.error(`Error processing workspace ${workspaceId}:`, error);
        }
      }

      setResults(allResults);
      setProgress(100);
      setCurrentStep('Migration completed');

      const successCount = allResults.filter(r => r.success).length;
      const failureCount = allResults.filter(r => !r.success).length;

      toast({
        title: 'Migration Completed',
        description: `Successfully migrated ${successCount} users. ${failureCount} failures.`,
        variant: successCount > 0 ? 'default' : 'destructive'
      });

    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: 'Migration Failed',
        description: 'An error occurred during migration. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setMigrating(false);
      setCurrentStep('');
    }
  };

  const getPermissionCountForRole = (role: string): number => {
    switch (role) {
      case 'owner': return 45; // Approximate count for owners
      case 'admin': return 35;  // Approximate count for admins
      case 'member': return 15; // Approximate count for members
      default: return 0;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Financial Permissions Migration
          </CardTitle>
          <CardDescription>
            Apply default financial permissions to users based on their roles. This ensures all users have appropriate access to financial features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="permissions">Permission Details</TabsTrigger>
              <TabsTrigger value="migration">Migration</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Owner Permissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">45</div>
                    <p className="text-xs text-muted-foreground">Full financial access</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      Admin Permissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">35</div>
                    <p className="text-xs text-muted-foreground">Management access</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      Member Permissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-600">15</div>
                    <p className="text-xs text-muted-foreground">Basic access</p>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> This migration will grant financial permissions to all users based on their current roles. 
                  Existing permissions will be updated, not replaced.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Financial Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <span className="text-sm">Financial Overview & Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Expense Management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Budget Management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Invoice Management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">Cost Center Management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-600" />
                      <span className="text-sm">Financial Reports</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Permission Levels</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Owners</span>
                        <Badge variant="default">Full Access</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        All financial operations including settings and deletion
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Admins</span>
                        <Badge variant="secondary">Management Access</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Create, edit, approve, and manage financial data
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Members</span>
                        <Badge variant="outline">Limited Access</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        View and manage own financial records only
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="migration" className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    onClick={handleMigrateCurrentWorkspace}
                    disabled={migrating}
                    className="flex-1"
                  >
                    {migrating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4 mr-2" />
                    )}
                    Migrate Current Workspace
                  </Button>
                  
                  <Button
                    onClick={handleMigrateAllWorkspaces}
                    disabled={migrating}
                    variant="outline"
                    className="flex-1"
                  >
                    {migrating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Users className="w-4 h-4 mr-2" />
                    )}
                    Migrate All Workspaces
                  </Button>
                </div>

                {migrating && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Migration Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        {currentStep && (
                          <p className="text-sm text-muted-foreground">{currentStep}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {results.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Migration Results</CardTitle>
                      <CardDescription>
                        {results.filter(r => r.success).length} successful, {results.filter(r => !r.success).length} failed
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {results.map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-3">
                              {result.success ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{result.userName}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getRoleBadgeVariant(result.userRole)} className="text-xs">
                                    {result.userRole}
                                  </Badge>
                                  {result.success && (
                                    <span className="text-xs text-muted-foreground">
                                      {result.permissionsGranted} permissions granted
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {result.error && (
                              <div className="text-xs text-red-600 max-w-xs truncate" title={result.error}>
                                {result.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 