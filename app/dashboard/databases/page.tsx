// app/dashboard/databases/page.tsx

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DatabaseInfo from '@/components/databases/DatabaseInfo';
import DatabaseHealth from '@/components/databases/DatabaseHealth';
import DatabaseBackup from '@/components/databases/DatabaseBackup';
import DatabaseBackupAdvanced from '@/components/databases/DatabaseBackupAdvanced';
import DatabaseRestore from '@/components/databases/DatabaseRestore';
import DatabaseExport from '@/components/databases/DatabaseExport';
import DatabaseImport from '@/components/databases/DatabaseImport';
import DatabaseHistory from '@/components/databases/DatabaseHistory';
import DatabaseAnalytics from '@/components/databases/DatabaseAnalytics';
import DatabaseSecurity from '@/components/databases/DatabaseSecurity';
import MultiWorkspaceBackup from '@/components/databases/MultiWorkspaceBackup';
import CrossWorkspaceRestore from '@/components/databases/CrossWorkspaceRestore';
import WorkspaceSettings from '@/components/databases/WorkspaceSettings';
import HierarchicalBackup from '@/components/databases/HierarchicalBackup';

export default function DatabasesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database Management</h1>
        <p className="text-muted-foreground">
          Comprehensive database management, backup, restore, analytics, and security features
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          <TabsTrigger value="multi-workspace">Multi-Workspace</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DatabaseInfo />
            <DatabaseHealth />
          </div>
          <DatabaseHistory />
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DatabaseBackup />
            <DatabaseBackupAdvanced />
          </div>
          <DatabaseRestore />
        </TabsContent>

        <TabsContent value="import-export" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DatabaseExport />
            <DatabaseImport />
          </div>
        </TabsContent>

        <TabsContent value="multi-workspace" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MultiWorkspaceBackup />
            <CrossWorkspaceRestore />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HierarchicalBackup />
            <WorkspaceSettings />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <DatabaseAnalytics />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <DatabaseSecurity />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WorkspaceSettings />
            <DatabaseHealth />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 