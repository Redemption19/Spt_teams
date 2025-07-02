'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FileText, 
  ChevronDown, 
  Edit3, 
  BarChart3, 
  ClipboardList, 
  CheckSquare, 
  Download,
  Settings
} from 'lucide-react';
import { useRolePermissions, useIsAdminOrOwner, useIsOwner } from '@/lib/rbac-hooks';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import MyReports from './MemberReport/my-reports';
import { SubmitReport } from './SubmitReport/submit-report';
import AllReports from '@/components/reports/AllReport/all-reports';
import { ReportTemplates } from './ReportTemplate/report-templates';
import { ReportsDashboard } from './ReportDashboard/reports-dashboard';
import { PendingApprovals } from './PendingReport/pending-approvals';
import { ExportReports } from './Export/export-reports';

type ReportView = 
  | 'my-reports' 
  | 'submit-report' 
  | 'all-reports' 
  | 'report-templates' 
  | 'reports-dashboard' 
  | 'pending-approvals' 
  | 'export-reports';

export function ReportsDropdown() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view') as ReportView;
  const [currentView, setCurrentView] = useState<ReportView>(viewParam || 'my-reports');
  const permissions = useRolePermissions();
  const isAdminOrOwner = useIsAdminOrOwner();
  const isOwner = useIsOwner();
  
  // Cross-workspace management for owners
  const { user } = useAuth();
  const { currentWorkspace, userRole, accessibleWorkspaces } = useWorkspace();
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);

  // Update view when URL parameter changes
  useEffect(() => {
    if (viewParam && viewParam !== currentView) {
      setCurrentView(viewParam);
    }
  }, [viewParam, currentView]);

  const getViewTitle = (view: ReportView) => {
    switch (view) {
      case 'my-reports': return 'My Reports';
      case 'submit-report': return 'Submit Report';
      case 'all-reports': return 'All Reports';
      case 'report-templates': return 'Report Templates';
      case 'reports-dashboard': return 'Reports Dashboard';
      case 'pending-approvals': return 'Pending Approvals';
      case 'export-reports': return 'Export Reports';
      default: return 'Reports';
    }
  };

  const getViewDescription = (view: ReportView) => {
    const baseDescriptions = {
      'my-reports': 'View and manage your personal reports, drafts, and submissions',
      'submit-report': 'Create and submit new reports using available templates',
      'all-reports': 'View, filter, and manage all reports across the organization',
      'report-templates': 'Create and manage dynamic report templates for the team',
      'reports-dashboard': 'Analytics, trends, and insights from report submissions',
      'pending-approvals': 'Review and approve reports submitted by team members',
      'export-reports': 'Export reports to PDF, Excel, or print formats',
    };
    
    const baseDescription = baseDescriptions[view] || 'Comprehensive reporting system for your organization';
    
    // Add cross-workspace context if enabled
    if (showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1) {
      switch (view) {
        case 'my-reports':
          return `${baseDescription} across all ${accessibleWorkspaces.length} accessible workspaces`;
        case 'all-reports':
          return `View, filter, and manage all reports across all ${accessibleWorkspaces.length} accessible workspaces`;
        case 'report-templates':
          return `Create and manage dynamic report templates across all ${accessibleWorkspaces.length} accessible workspaces`;
        case 'reports-dashboard':
          return `Analytics, trends, and insights from report submissions across all ${accessibleWorkspaces.length} accessible workspaces`;
        case 'pending-approvals':
          return `Review and approve reports submitted by team members across all ${accessibleWorkspaces.length} accessible workspaces`;
        case 'export-reports':
          return `Export reports from all ${accessibleWorkspaces.length} accessible workspaces to PDF, Excel, or print formats`;
        default:
          return baseDescription;
      }
    }
    
    return baseDescription;
  };

  const renderCurrentView = () => {
    // Pass cross-workspace props to child components
    const crossWorkspaceProps = {
      showAllWorkspaces,
      accessibleWorkspaces: isOwner ? accessibleWorkspaces : undefined,
      setShowAllWorkspaces,
    };

    switch (currentView) {
      case 'my-reports':
        return <MyReports {...crossWorkspaceProps} />;
      case 'submit-report':
        return <SubmitReport {...crossWorkspaceProps} />;
      case 'all-reports':
        return <AllReports {...crossWorkspaceProps} />;
      case 'report-templates':
        return <ReportTemplates {...crossWorkspaceProps} />;
      case 'reports-dashboard':
        return <ReportsDashboard {...crossWorkspaceProps} />;
      case 'pending-approvals':
        return <PendingApprovals {...crossWorkspaceProps} />;
      case 'export-reports':
        return <ExportReports {...crossWorkspaceProps} />;
      default:
        return <MyReports {...crossWorkspaceProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 max-w-7xl">
        <div className="space-y-4 sm:space-y-6">
          
          {/* Header with Dropdown Navigation */}
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                  {getViewTitle(currentView)}
                  {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && ' 🌐'}
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-3xl">
                  {getViewDescription(currentView)}
                </p>
              </div>
            </div>

            {/* Reports Dropdown Menu and Cross-Workspace Toggle */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0 w-full sm:w-auto">
              {/* Cross-workspace toggle for owners */}
              {isOwner && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
                  <button
                    onClick={() => setShowAllWorkspaces(!showAllWorkspaces)}
                    className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                      showAllWorkspaces 
                        ? 'text-green-700 dark:text-green-400' 
                        : 'text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400'
                    }`}
                  >
                    <span className="text-base">{showAllWorkspaces ? '🌐' : '🏢'}</span>
                    <span>
                      {showAllWorkspaces 
                        ? `All Workspaces (${accessibleWorkspaces.length})` 
                        : 'Current Workspace'
                      }
                    </span>
                  </button>
                </div>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto h-11 sm:h-10 bg-gradient-to-r from-background to-accent/10 hover:from-accent/10 hover:to-accent/20 border-border/50 touch-manipulation"
                  >
                    <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Switch View</span>
                    <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  
                  {/* For All Users */}
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                    For All Users
                  </DropdownMenuLabel>
                  
                  <DropdownMenuItem 
                    onClick={() => setCurrentView('my-reports')}
                    className="flex items-center space-x-3 py-3 px-3 rounded-md cursor-pointer hover:bg-accent/50 focus:bg-accent/50"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        📄 My Reports
                        {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && ' 🌐'}
                      </div>
                      <div className="text-xs text-muted-foreground">View and manage your submitted, pending, or draft reports</div>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    onClick={() => setCurrentView('submit-report')}
                    className="flex items-center space-x-3 py-3 px-3 rounded-md cursor-pointer hover:bg-accent/50 focus:bg-accent/50"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20">
                      <Edit3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        📝 Submit Report
                        {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && ' 🌐'}
                      </div>
                      <div className="text-xs text-muted-foreground">Fill and submit a new report based on available templates</div>
                    </div>
                  </DropdownMenuItem>

                  {/* For Admins and Owners */}
                  {isAdminOrOwner && (
                    <>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                        For Admins & Owners
                      </DropdownMenuLabel>

                      <DropdownMenuItem 
                        onClick={() => setCurrentView('all-reports')}
                        className="flex items-center space-x-3 py-3 px-3 rounded-md cursor-pointer hover:bg-accent/50 focus:bg-accent/50"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                          <ClipboardList className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            📋 All Reports
                            {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && ' 🌐'}
                          </div>
                          <div className="text-xs text-muted-foreground">View, filter, and manage all submitted reports from members</div>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => setCurrentView('report-templates')}
                        className="flex items-center space-x-3 py-3 px-3 rounded-md cursor-pointer hover:bg-accent/50 focus:bg-accent/50"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                          <Settings className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            ⚙️ Report Templates
                            {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && ' 🌐'}
                          </div>
                          <div className="text-xs text-muted-foreground">Create and manage dynamic templates for reports</div>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => setCurrentView('reports-dashboard')}
                        className="flex items-center space-x-3 py-3 px-3 rounded-md cursor-pointer hover:bg-accent/50 focus:bg-accent/50"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/20">
                          <BarChart3 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            📊 Reports Dashboard
                            {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && ' 🌐'}
                          </div>
                          <div className="text-xs text-muted-foreground">View charts, trends, analytics of report submissions and statuses</div>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => setCurrentView('pending-approvals')}
                        className="flex items-center space-x-3 py-3 px-3 rounded-md cursor-pointer hover:bg-accent/50 focus:bg-accent/50"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                          <CheckSquare className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            📥 Pending Approvals
                            {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && ' 🌐'}
                          </div>
                          <div className="text-xs text-muted-foreground">Quickly access reports needing review/approval</div>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => setCurrentView('export-reports')}
                        className="flex items-center space-x-3 py-3 px-3 rounded-md cursor-pointer hover:bg-accent/50 focus:bg-accent/50"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20">
                          <Download className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            📤 Export Reports
                            {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && ' 🌐'}
                          </div>
                          <div className="text-xs text-muted-foreground">Export to PDF/Excel or print reports</div>
                        </div>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Cross-workspace scope banner for owners */}
          {isOwner && showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
              <p className="text-sm text-green-700 dark:text-green-400">
                🌐 <strong>Cross-Workspace Reports:</strong> Managing reports, templates, and analytics across all {accessibleWorkspaces.length} accessible workspaces. All data from accessible workspaces is aggregated for centralized reporting management.
              </p>
            </div>
          )}

          {/* Current View Content */}
          <div className="w-full">
            {renderCurrentView()}
          </div>
        </div>
      </div>
    </div>
  );
} 