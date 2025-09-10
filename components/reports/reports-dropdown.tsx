'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Edit3, 
  BarChart3, 
  ClipboardList, 
  CheckSquare, 
  Download,
  Settings,
  Plus,
  RefreshCw,
  Shield
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
import { MemberReportsDashboard } from './MemberReport/MemberReportsDashboard';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n-context';

type ReportView = 
  | 'my-reports' 
  | 'submit-report' 
  | 'all-reports' 
  | 'report-templates' 
  | 'reports-dashboard' 
  | 'pending-approvals' 
  | 'export-reports' 
  | 'member-reports-dashboard';

export function ReportsDropdown() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewParam = searchParams.get('view') as ReportView;
  const [currentView, setCurrentView] = useState<ReportView>(viewParam || 'member-reports-dashboard');
  const permissions = useRolePermissions();
  const isAdminOrOwner = useIsAdminOrOwner();
  const isOwner = useIsOwner();
  
  // Function to update view and URL
  const updateView = (newView: ReportView) => {
    setCurrentView(newView);
    router.push(`/dashboard/reports?view=${newView}`);
  };
  
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
      case 'my-reports': return t('reports.myReports');
      case 'submit-report': return t('reports.submitReport');
      case 'all-reports': return t('reports.allReports');
      case 'report-templates': return t('reports.reportTemplates');
      case 'reports-dashboard': return t('reports.reportsDashboard');
      case 'pending-approvals': return t('reports.pendingApprovals');
      case 'export-reports': return t('reports.exportReports');
      case 'member-reports-dashboard': return t('reports.memberReportsDashboard');
      default: return t('nav.reports');
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
      'member-reports-dashboard': 'Your personalized reports analytics and insights',
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
        case 'member-reports-dashboard':
          return `View and manage reports submitted by your team members across all ${accessibleWorkspaces.length} accessible workspaces`;
        default:
          return baseDescription;
      }
    }
    
    return baseDescription;
  };

  const getViewActionButton = (view: ReportView) => {
    switch (view) {
      case 'report-templates':
        return isAdminOrOwner ? (
          <Button 
            onClick={() => {
              // This will be handled by the child component through a callback
              const event = new CustomEvent('createTemplate');
              window.dispatchEvent(event);
            }}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        ) : null;
      case 'submit-report':
        return (
          <Button 
            onClick={() => {
              const event = new CustomEvent('newReport');
              window.dispatchEvent(event);
            }}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            New Report
          </Button>
        );
      case 'my-reports':
        return (
          <Button 
            onClick={() => updateView('submit-report')}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        );
      case 'member-reports-dashboard':
        return (
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => {
                // Dispatch refresh event to be handled by the child component
                const event = new CustomEvent('refreshDashboard');
                window.dispatchEvent(event);
              }}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('reports.refresh')}
            </Button>
            <Link href="/dashboard/reports?view=submit-report">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('reports.submitReport')}
              </Button>
            </Link>
          </div>
        );
      default:
        return null;
    }
  };

  const renderCurrentView = () => {
    // Pass cross-workspace props to child components
    const crossWorkspaceProps = {
      showAllWorkspaces,
      accessibleWorkspaces: isOwner ? accessibleWorkspaces : undefined,
      setShowAllWorkspaces,
    };

    // Access control checks for direct URL access
    
    // Member-only views - only accessible by members
    if (currentView === 'member-reports-dashboard' && userRole !== 'member') {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto">
              <Shield className="w-12 h-12 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Access Restricted</h3>
            <p className="text-muted-foreground max-w-md">
              This dashboard is only available to members. Admins and owners have access to the main Reports Dashboard.
            </p>
            <Button 
              onClick={() => updateView('reports-dashboard')} 
              variant="outline"
            >
              Go to Reports Dashboard
            </Button>
          </div>
        </div>
      );
    }

    // Admin-only views - only accessible by admins/owners
    const adminOnlyViews = ['all-reports', 'report-templates', 'reports-dashboard', 'pending-approvals', 'export-reports'];
    if (adminOnlyViews.includes(currentView) && !isAdminOrOwner) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto">
              <Shield className="w-12 h-12 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Access Restricted</h3>
            <p className="text-muted-foreground max-w-md">
              This feature is only available to administrators and workspace owners.
            </p>
            <Button 
              onClick={() => updateView('member-reports-dashboard')} 
              variant="outline"
            >
              Go to My Reports Dashboard
            </Button>
          </div>
        </div>
      );
    }

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
      case 'member-reports-dashboard':
        return <MemberReportsDashboard {...crossWorkspaceProps} />;
      default:
        return <MemberReportsDashboard {...crossWorkspaceProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 max-w-7xl">
        <div className="space-y-4 sm:space-y-6">
          
          {/* Header with Dropdown Navigation */}
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            {/* Header Title and Description - Show for all users */}
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

            {/* Action Button, Reports Dropdown Menu and Cross-Workspace Toggle */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0 w-full sm:w-auto">
              {/* View-specific action button - positioned on same line as dropdown */}
              {getViewActionButton(currentView)}
              
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