'use client';

import React, { useState, useEffect } from 'react';
import { Building2, BarChart3, Target, TrendingUp, Users, AlertTriangle, CheckCircle, Activity, DollarSign, Clock, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useIsAdminOrOwner } from '@/lib/rbac-hooks';
import { DepartmentOverviewCards } from './DepartmentOverviewCards';
import { PerformanceMetricsChart } from './PerformanceMetricsChart';
import { KPIWidgets } from './KPIWidgets';
import { AlertNotifications } from './AlertNotifications';
import { QuickActions } from './QuickActions';
import { DepartmentList } from './DepartmentList';
import { DepartmentManagement } from '@/components/settings/department-management/DepartmentManagement';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { KPIManagement } from './KPIManagement';
import { useI18n } from '@/lib/i18n-context';

export function DepartmentPerformanceDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const isAdminOrOwner = useIsAdminOrOwner();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('departments.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('departments.description')}
          </p>
        </div>
        <QuickActions />
      </div>

      {/* Alert Notifications */}
      <AlertNotifications />

      {/* Overview Cards */}
      <DepartmentOverviewCards selectedDepartment={selectedDepartment} />

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('departments.tabs.dashboard')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('departments.tabs.analytics')}
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t('departments.tabs.departments')}
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('departments.tabs.management')}
          </TabsTrigger>
          <TabsTrigger value="kpis" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('departments.tabs.kpis')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PerformanceMetricsChart selectedDepartment={selectedDepartment} />
            </div>
            <div>
              <KPIWidgets selectedDepartment={selectedDepartment} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AdvancedAnalytics 
            selectedDepartment={selectedDepartment || undefined} 
            workspaceId={currentWorkspace?.id || ''}
          />
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <DepartmentList 
            selectedDepartment={selectedDepartment}
            onSelectDepartment={setSelectedDepartment}
          />
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <DepartmentManagement />
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6">
          <KPIManagement 
            selectedDepartment={selectedDepartment || undefined}
            workspaceId={currentWorkspace?.id || ''}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}