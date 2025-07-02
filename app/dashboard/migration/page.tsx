'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  Database,
  Play,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Info,
  Download,
  Upload,
  TestTube,
  Shield,
  Clock,
  FileText,
  Loader2
} from 'lucide-react';

export default function MigrationPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  
  // Redirect if not owner/admin
  useEffect(() => {
    if (userProfile && userProfile.role !== 'owner' && userProfile.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [userProfile, router]);

  const [isLoading, setIsLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [systemCheck, setSystemCheck] = useState<any>(null);
  const [validationReport, setValidationReport] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [workspaceSettingsStatus, setWorkspaceSettingsStatus] = useState<any>(null);

  // Load initial status
  useEffect(() => {
    loadSystemStatus();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const checkWorkspaceSettingsStatus = async () => {
    try {
      const { WorkspaceService } = await import('@/lib/workspace-service');
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // Check if any workspace is missing the allowAdminWorkspaceCreation setting
      const workspacesSnapshot = await getDocs(collection(db, 'workspaces'));
      const workspaces = workspacesSnapshot.docs.map(doc => doc.data());
      
      const needsUpdate = workspaces.some(workspace => 
        !workspace.settings || workspace.settings.allowAdminWorkspaceCreation === undefined
      );
      
      const status = {
        needsUpdate,
        totalWorkspaces: workspaces.length,
        workspacesNeedingUpdate: workspaces.filter(workspace => 
          !workspace.settings || workspace.settings.allowAdminWorkspaceCreation === undefined
        ).length,
        isCompleted: !needsUpdate
      };
      
      setWorkspaceSettingsStatus(status);
      addLog(`Workspace settings check: ${status.workspacesNeedingUpdate} of ${status.totalWorkspaces} workspaces need updating`);
      
    } catch (error) {
      addLog(`Error checking workspace settings: ${error}`);
      console.error('Error checking workspace settings:', error);
    }
  };

  const runWorkspaceSettingsMigration = async () => {
    setIsLoading(true);
    addLog('Starting workspace settings migration...');
    addLog('Adding allowAdminWorkspaceCreation field to existing workspaces...');
    
    try {
      const { WorkspaceService } = await import('@/lib/workspace-service');
      const { collection, getDocs, writeBatch, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // Get all workspaces
      const workspacesSnapshot = await getDocs(collection(db, 'workspaces'));
      const batch = writeBatch(db);
      let updatedCount = 0;
      
      for (const docSnapshot of workspacesSnapshot.docs) {
        const workspace = docSnapshot.data();
        
        // Check if workspace needs the new setting
        if (!workspace.settings || workspace.settings.allowAdminWorkspaceCreation === undefined) {
          const updatedSettings = {
            ...workspace.settings,
            allowAdminWorkspaceCreation: false // Default to false for security
          };
          
          batch.update(doc(db, 'workspaces', docSnapshot.id), {
            settings: updatedSettings,
            updatedAt: new Date()
          });
          
          updatedCount++;
          addLog(`✓ Updated workspace: ${workspace.name || docSnapshot.id}`);
        }
      }
      
      if (updatedCount > 0) {
        await batch.commit();
        addLog(`✅ Successfully updated ${updatedCount} workspaces`);
        addLog('🔒 All workspaces now have admin workspace creation disabled by default');
        addLog('💡 Owners can enable this feature in Settings → Workspace → Security & Access');
      } else {
        addLog('✅ All workspaces already have the latest settings');
      }
      
      // Refresh status
      await checkWorkspaceSettingsStatus();
      
    } catch (error) {
      addLog(`❌ Workspace settings migration failed: ${error}`);
      console.error('Workspace settings migration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemStatus = async () => {
    setIsLoading(true);
    addLog('Loading system status...');
    
    try {
      // Dynamic imports to avoid SSR issues
      const [
        { HierarchyMigrationRunner },
        { HierarchyTestHelpers },
        { HierarchyValidationService }
      ] = await Promise.all([
        import('@/lib/migrate-to-hierarchy'),
        import('@/lib/hierarchy-test-helpers'),
        import('@/lib/hierarchy-validation')
      ]);

      // Get migration status
      const migStatus = await HierarchyMigrationRunner.getMigrationStatus();
      setMigrationStatus(migStatus);
      addLog(`Migration status loaded: ${migStatus.isCompleted ? 'Completed' : 'Pending'}`);

      // Quick system check
      const sysCheck = await HierarchyTestHelpers.quickSystemCheck();
      setSystemCheck(sysCheck);
      addLog(`System check: ${sysCheck.isReady ? 'Ready' : 'Not Ready'}`);

      // Quick validation
      const quickVal = await HierarchyValidationService.quickValidation();
      addLog(`Quick validation: ${quickVal.isValid ? 'Passed' : 'Failed'}`);

      // Check workspace settings migration status
      await checkWorkspaceSettingsStatus();

    } catch (error) {
      addLog(`Error loading system status: ${error}`);
      console.error('Error loading system status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runMigration = async () => {
    setIsLoading(true);
    addLog('Starting workspace hierarchy migration...');
    
    try {
      const { HierarchyMigrationRunner } = await import('@/lib/migrate-to-hierarchy');
      
      const result = await HierarchyMigrationRunner.runMigration();
      
      if (result.success) {
        addLog(`✅ Migration completed successfully!`);
        addLog(`📊 Migrated ${result.details.migratedWorkspaces} workspaces`);
        addLog(`👥 Migrated ${result.details.migratedUsers} user relationships`);
        if (result.details.backupId) {
          addLog(`💾 Backup ID: ${result.details.backupId}`);
        }
      } else {
        addLog(`❌ Migration failed: ${result.message}`);
        result.details.errors.forEach(error => addLog(`   Error: ${error}`));
      }
      
      // Reload status
      await loadSystemStatus();
      
    } catch (error) {
      addLog(`💥 Migration crashed: ${error}`);
      console.error('Migration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runTests = async () => {
    setIsLoading(true);
    addLog('Running comprehensive hierarchy tests...');
    
    try {
      const { HierarchyTestHelpers } = await import('@/lib/hierarchy-test-helpers');
      
      const result = await HierarchyTestHelpers.runHierarchyTests();
      setTestResults(result);
      
      addLog(`🧪 Tests completed: ${result.success ? 'PASSED' : 'FAILED'}`);
      result.details.forEach(detail => addLog(`   ${detail}`));
      
    } catch (error) {
      addLog(`💥 Tests crashed: ${error}`);
      console.error('Test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateValidationReport = async () => {
    setIsLoading(true);
    addLog('Generating validation report...');
    
    try {
      const { HierarchyValidationService } = await import('@/lib/hierarchy-validation');
      
      const validation = await HierarchyValidationService.validateHierarchy();
      const report = HierarchyValidationService.generateReport(validation);
      setValidationReport(report);
      
      addLog(`📋 Validation report generated: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
      addLog(`📊 ${validation.errors.length} errors, ${validation.warnings.length} warnings`);
      
    } catch (error) {
      addLog(`💥 Validation crashed: ${error}`);
      console.error('Validation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const rollbackMigration = async () => {
    if (!migrationStatus?.availableBackups?.length) {
      addLog('❌ No backups available for rollback');
      return;
    }

    const latestBackup = migrationStatus.availableBackups[0];
    const confirmed = confirm(`Are you sure you want to rollback to backup: ${latestBackup.id}?\n\nThis will restore your workspace to the previous state.`);
    
    if (!confirmed) return;

    setIsLoading(true);
    addLog(`🔄 Rolling back to backup: ${latestBackup.id}...`);
    
    try {
      const { HierarchyMigrationRunner } = await import('@/lib/migrate-to-hierarchy');
      
      const result = await HierarchyMigrationRunner.rollbackMigration(latestBackup.id);
      
      if (result.success) {
        addLog(`✅ Rollback completed successfully!`);
      } else {
        addLog(`❌ Rollback failed: ${result.message}`);
      }
      
      // Reload status
      await loadSystemStatus();
      
    } catch (error) {
      addLog(`💥 Rollback crashed: ${error}`);
      console.error('Rollback error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (userProfile && userProfile.role !== 'owner' && userProfile.role !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. This page is only available to workspace owners and administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workspace Hierarchy Migration</h1>
          <p className="text-muted-foreground">
            Migrate your workspace to support hierarchical sub-workspaces
          </p>
        </div>
        <Badge variant={migrationStatus?.isCompleted ? "default" : "secondary"}>
          {migrationStatus?.isCompleted ? 'Migration Complete' : 'Migration Pending'}
        </Badge>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {systemCheck?.checks?.firebase ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Firebase Connection</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {systemCheck?.checks?.migration ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Migration Service</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {systemCheck?.checks?.validation ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Validation Service</span>
              </div>
            </div>
          </div>
          
          {systemCheck && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>{systemCheck.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Workspace Settings Migration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Workspace Settings Update
          </CardTitle>
          <CardDescription>
            Update existing workspaces with new admin workspace creation setting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {workspaceSettingsStatus && (
            <>
              {workspaceSettingsStatus.needsUpdate ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {workspaceSettingsStatus.workspacesNeedingUpdate} of {workspaceSettingsStatus.totalWorkspaces} workspaces need the new admin workspace creation setting.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    All {workspaceSettingsStatus.totalWorkspaces} workspaces have the latest settings! 
                    Owners can now control admin workspace creation permissions.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button 
                  onClick={runWorkspaceSettingsMigration} 
                  disabled={isLoading || workspaceSettingsStatus.isCompleted}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {workspaceSettingsStatus.isCompleted ? 'Settings Updated' : 'Update Workspace Settings'}
                </Button>

                <Button 
                  variant="outline" 
                  onClick={checkWorkspaceSettingsStatus} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Check Status
                </Button>
              </div>

              {workspaceSettingsStatus.isCompleted && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                    ✅ What's Next?
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                    <li>• All workspaces now have admin workspace creation <strong>disabled by default</strong></li>
                    <li>• Workspace owners can enable this feature in <strong>Settings → Workspace → Security & Access</strong></li>
                    <li>• The toggle will now immediately reflect permission changes for admins</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="settings">Settings Update</TabsTrigger>
          <TabsTrigger value="migration">Full Migration</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Settings Update Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Settings Update</CardTitle>
              <CardDescription>
                Quick update to add the new admin workspace creation setting to your existing workspaces
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This update adds the "allowAdminWorkspaceCreation" setting to your existing workspaces. 
                  It's set to disabled by default for security. Owners can enable it in workspace settings.
                </AlertDescription>
              </Alert>

              {workspaceSettingsStatus && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {workspaceSettingsStatus.totalWorkspaces}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Workspaces</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-500">
                        {workspaceSettingsStatus.workspacesNeedingUpdate}
                      </div>
                      <div className="text-sm text-muted-foreground">Need Update</div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      onClick={runWorkspaceSettingsMigration} 
                      disabled={isLoading || workspaceSettingsStatus.isCompleted}
                      className="flex items-center gap-2"
                      size="lg"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {workspaceSettingsStatus.isCompleted ? 'All Settings Updated!' : 'Update All Workspaces'}
                    </Button>
                  </div>

                  {workspaceSettingsStatus.isCompleted && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Perfect! All your workspaces are now ready for the new admin workspace creation feature. 
                        Check the logs below for details.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Migration Tab */}
        <TabsContent value="migration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Migration</CardTitle>
              <CardDescription>
                Migrate your existing workspace to support hierarchical sub-workspaces
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!migrationStatus?.isCompleted ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Your workspace needs to be migrated to support hierarchical features. 
                    This process is safe and creates a backup before making any changes.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Migration completed successfully! Your workspace now supports hierarchical sub-workspaces.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button 
                  onClick={runMigration} 
                  disabled={isLoading || migrationStatus?.isCompleted}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {migrationStatus?.isCompleted ? 'Migration Complete' : 'Run Migration'}
                </Button>

                {migrationStatus?.availableBackups?.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={rollbackMigration} 
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Rollback
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  onClick={loadSystemStatus} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Refresh Status
                </Button>
              </div>

              {migrationStatus?.availableBackups?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Available Backups:</h4>
                  <div className="space-y-2">
                    {migrationStatus.availableBackups.slice(0, 3).map((backup: any, index: number) => (
                      <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="text-sm font-medium">{backup.id}</div>
                          <div className="text-xs text-muted-foreground">
                            {backup.timestamp.toLocaleString()} • 
                            {backup.workspaceCount} workspaces • 
                            {backup.userWorkspaceCount} user relationships
                          </div>
                        </div>
                        {index === 0 && (
                          <Badge variant="outline">Latest</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Testing</CardTitle>
              <CardDescription>
                Run comprehensive tests to validate hierarchy functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runTests} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
                Run Tests
              </Button>

              {testResults && (
                <div className="space-y-4">
                  <Alert>
                    {testResults.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      Test Results: {testResults.success ? 'All tests passed!' : 'Some tests failed'}
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {testResults.results.migrationTest ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">Migration Test</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {testResults.results.validationTest ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">Validation Test</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {testResults.results.hierarchyIntegrityTest ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">Hierarchy Integrity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {testResults.results.userPermissionsTest ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">User Permissions</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Validation</CardTitle>
              <CardDescription>
                Generate comprehensive validation report for your workspace hierarchy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={generateValidationReport} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Generate Report
              </Button>

              {validationReport && (
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {validationReport}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Real-time logs of migration and testing activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground">No logs yet. Run migration or tests to see activity.</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 