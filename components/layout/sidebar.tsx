'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useIsAdminOrOwner } from '@/lib/rbac-hooks';
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  BarChart3,
  FileText,
  Users,
  Building2,
  MapPin,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  UserCog,
  Mail,
  Bot,
  HelpCircle,
  Calendar,
  Activity,
  Briefcase,
  UserCheck,
  Database,
  ArrowRight,
  Edit3,
  ClipboardList,
  Download,
  Bell,
  Shield,
  Wallet,
  Receipt,
  Target,
  Building,
  CreditCard,
  Clock,
  UserPlus,
  Video,
  Phone,
  Coins,
  BanknoteIcon,
} from 'lucide-react';
import { useNotifications } from '@/lib/notification-context';

// Define navigation structure with groups and nested dropdowns
const navigationGroups = [
  {
    type: 'single',
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    type: 'dropdown',
    name: 'Workspace',
    icon: Briefcase,
    items: [
      {
        name: 'Projects & Tasks',
        href: '/dashboard/tasks',
        icon: CheckSquare,
      },
      {
        name: 'Folders',
        href: '/dashboard/folders',
        icon: FolderOpen,
      },
      {
        type: 'nested-dropdown',
        name: 'Reports',
        icon: FileText,
        basePath: '/dashboard/reports',
        items: [
          {
            name: 'My Reports',
            href: '/dashboard/reports?view=my-reports',
            icon: FileText,
            description: 'View and manage your personal reports',
            viewParam: 'my-reports',
          },
          {
            name: 'Submit Report',
            href: '/dashboard/reports?view=submit-report',
            icon: Edit3,
            description: 'Create new reports from templates',
            viewParam: 'submit-report',
          },
          {
            name: 'My Reports Dashboard',
            href: '/dashboard/reports?view=member-reports-dashboard',
            icon: BarChart3,
            description: 'Your personalized reports analytics and insights (Members only)',
            viewParam: 'member-reports-dashboard',
            memberOnly: true,
          },
          {
            name: 'All Reports',
            href: '/dashboard/reports?view=all-reports',
            icon: ClipboardList,
            description: 'View all reports (Admin/Owner)',
            adminOnly: true,
            viewParam: 'all-reports',
          },
          {
            name: 'Report Templates',
            href: '/dashboard/reports?view=report-templates',
            icon: Settings,
            description: 'Manage report templates (Admin/Owner)',
            adminOnly: true,
            viewParam: 'report-templates',
          },
          {
            name: 'Reports Dashboard',
            href: '/dashboard/reports?view=reports-dashboard',
            icon: BarChart3,
            description: 'Analytics and trends (Admin/Owner)',
            adminOnly: true,
            viewParam: 'reports-dashboard',
          },
          {
            name: 'Pending Approvals',
            href: '/dashboard/reports?view=pending-approvals',
            icon: CheckSquare,
            description: 'Review reports (Admin/Owner)',
            adminOnly: true,
            viewParam: 'pending-approvals',
          },
          {
            name: 'Export Reports',
            href: '/dashboard/reports?view=export-reports',
            icon: Download,
            description: 'Export and print reports (Admin/Owner)',
            adminOnly: true,
            viewParam: 'export-reports',
          },
        ],
      },
      {
        name: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
      },
      {
        name: 'Manage Workspaces',
        href: '/dashboard/workspaces',
        icon: Settings,
      },
    ],
  },
  {
    type: 'dropdown',
    name: 'Organization',
    icon: Building2,
    items: [
      {
        name: 'Departments',
        href: '/dashboard/departments',
        icon: Building2,
      },
      {
        name: 'Branches',
        href: '/dashboard/branches',
        icon: Building2,
      },
      {
        name: 'Regions',
        href: '/dashboard/regions',
        icon: MapPin,
      },
      {
        name: 'Teams',
        href: '/dashboard/teams',
        icon: Users,
      },
    ],
  },
  {
    type: 'dropdown',
    name: 'Financial Management',
    icon: BarChart3,
    requiresPermission: true,
    items: [
      {
        name: 'Financial Dashboard',
        href: '/dashboard/financial/overview',
        icon: Wallet,
        description: 'Overview of budgets, expenses, and financial metrics',
      },
      {
        name: 'Expense Management',
        href: '/dashboard/financial/expenses',
        icon: BanknoteIcon,
        description: 'Submit and track expense reports',
      },
      {
        name: 'Budget Tracking',
        href: '/dashboard/financial/budgets',
        icon: Target,
        description: 'Monitor and manage budgets',
        adminOnly: true,
      },
      {
        name: 'Invoice Management',
        href: '/dashboard/financial/invoices',
        icon: FileText,
        description: 'Create and manage invoices',
        adminOnly: true,
      },
      {
        name: 'Cost Centers',
        href: '/dashboard/financial/cost-centers',
        icon: Building,
        description: 'Manage organizational cost centers',
        adminOnly: true,
      },
      {
        name: 'Currency Settings',
        href: '/dashboard/financial/currency',
        icon: Coins,
        description: 'Manage currencies and exchange rates',
        adminOnly: true,
      },
      {
        name: 'Currency Status',
        href: '/dashboard/financial/currency/status',
        icon: Activity,
        description: 'Monitor currency system health',
        adminOnly: true,
      },
      {
        name: 'Financial Reports',
        href: '/dashboard/financial/reports',
        icon: BarChart3,
        description: 'Generate financial reports and analytics',
        adminOnly: true,
      },
      {
        name: 'Billing & Subscriptions',
        href: '/dashboard/financial/billing',
        icon: CreditCard,
        description: 'Manage subscription and billing settings',
        ownerOnly: true,
      },
    ],
  },
  {
    type: 'dropdown',
    name: 'HR Management',
    icon: UserPlus,
    requiresPermission: true,
    items: [
      {
        name: 'HR Overview',
        href: '/dashboard/hr',
        icon: BarChart3,
        description: 'HR dashboard with key metrics and insights',
        adminOnly: true
      },
      {
        name: 'Employee Management',
        href: '/dashboard/hr/employees',
        icon: Users,
        description: 'Manage employee profiles and information',
        adminOnly: true
      },
      {
        name: 'Employee Analytics',
        href: '/dashboard/hr/employees/analytics',
        icon: BarChart3,
        description: 'Workforce analytics and insights',
        adminOnly: true
      },
      {
        name: 'Attendance Management',
        href: '/dashboard/hr/attendance',
        icon: Clock,
        description: 'Track attendance and work hours',
        adminOnly: true
      },
      {
        name: 'Attendance Analytics',
        href: '/dashboard/hr/attendance/analytics',
        icon: BarChart3,
        description: 'Attendance analytics and insights',
        adminOnly: true
      },
      {
        name: 'Leave Management',
        href: '/dashboard/hr/leaves',
        icon: Calendar,
        description: 'Handle leave requests and approvals',
      },
      {
        name: 'Payroll Management',
        href: '/dashboard/hr/payroll',
        icon: Wallet,
        description: 'Process payroll and manage salaries',
      },
      {
        name: 'Recruitment',
        href: '/dashboard/hr/recruitment',
        icon: UserPlus,
        description: 'Job postings and candidate tracking',
        adminOnly: true,
      },
    ],
  },
  {
    type: 'dropdown',
    name: 'Users',
    icon: UserCheck,
    requiresPermission: true,
    items: [
      {
        name: 'User Management',
        href: '/dashboard/users',
        icon: UserCog,
      },
      {
        name: 'Permissions & Privileges',
        href: '/dashboard/permissions',
        icon: Shield,
        description: 'Manage granular user permissions',
        adminOnly: true,
      },
      {
        name: 'Invitations',
        href: '/dashboard/invite',
        icon: Mail,
      },
      {
        name: 'Migration & Testing',
        href: '/dashboard/migration',
        icon: Database,
      },
      {
        name: 'User Relationship Fix',
        href: '/dashboard/user-fix',
        icon: UserCheck,
      },
      {
        name: 'User Transfer',
        href: '/dashboard/user-transfer',
        icon: ArrowRight,
      },
    ],
  },
  {
    type: 'dropdown',
    name: 'Video Calls',
    icon: Video,
    items: [
      {
        name: 'Start Meeting',
        href: '/dashboard/video-call/start',
        icon: Video,
        description: 'Start instant video meeting'
      },
      {
        name: 'Join Meeting',
        href: '/dashboard/video-call/join',
        icon: Phone,
        description: 'Join existing meeting'
      },
      {
        name: 'Schedule Meeting',
        href: '/dashboard/video-call/schedule',
        icon: Calendar,
        description: 'Schedule future meetings'
      },
      {
        name: 'Meeting History',
        href: '/dashboard/video-call/history',
        icon: Clock,
        description: 'View past meetings and recordings'
      },
      {
        name: 'Meeting Analytics',
        href: '/dashboard/video-call/analytics',
        icon: BarChart3,
        description: 'Video call usage and quality metrics',
        adminOnly: true
      },
      {
        name: 'Settings',
        href: '/dashboard/video-call/settings',
        icon: Settings,
        description: 'Configure video call preferences'
      }
     ]
   },
   {
     type: 'single',
     name: 'Team Members',
     href: '/dashboard/colleagues',
     icon: Users,
     memberOnly: true,
   },
   {
    type: 'single',
    name: 'AI Assistant',
    href: '/dashboard/ai',
    icon: Bot,
  },
  {
    type: 'single',
    name: 'Support/Help',
    href: '/dashboard/support',
    icon: HelpCircle,
  },
  {
    type: 'single',
    name: 'Calendar',
    href: '/dashboard/calendar',
    icon: Calendar,
  },
  {
    type: 'single',
    name: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
    showUnreadBadge: true,
  },
  {
    type: 'single',
    name: 'Activity Log',
    href: '/dashboard/activity',
    icon: Activity,
  },
  {
    type: 'single',
    name: 'Database Management',
    href: '/dashboard/databases',
    icon: Database,
    ownerOnly: true,
  },
];

interface SidebarProps {
  className?: string;
}

// Find the navigationGroups definition and update the 'Manage Workspaces' item label dynamically
const getWorkspaceNavLabel = (role: string | undefined) => {
  if (role === 'owner') return 'Manage Workspace';
  if (role === 'admin') return 'Workspace Overview';
  return 'My Workspace';
};

const getBreadcrumbInfo = (pathname: string) => {
  const pathSegments = pathname.split('/').filter(Boolean);
  
  if (pathSegments.length === 1 && pathSegments[0] === 'dashboard') {
    return { title: 'Dashboard', group: null };
  }
  
  // Common page mappings
  const pageMap: Record<string, { title: string; group?: string }> = {
    '/dashboard/tasks': { title: 'Projects & Tasks', group: 'Workspace' },
    '/dashboard/folders': { title: 'Folders', group: 'Workspace' },
    '/dashboard/reports': { title: 'Reports', group: 'Workspace' },
    '/dashboard/analytics': { title: 'Analytics', group: 'Workspace' },
    '/dashboard/workspaces': { title: 'Manage Workspaces', group: 'Workspace' },
    '/dashboard/departments': { title: 'Departments', group: 'Organization' },
    '/dashboard/branches': { title: 'Branches', group: 'Organization' },
    '/dashboard/regions': { title: 'Regions', group: 'Organization' },
    '/dashboard/teams': { title: 'Teams', group: 'Organization' },
    '/dashboard/financial/overview': { title: 'Financial Dashboard', group: 'Financial Management' },
    '/dashboard/financial/expenses': { title: 'Expense Management', group: 'Financial Management' },
    '/dashboard/financial/budgets': { title: 'Budget Tracking', group: 'Financial Management' },
    '/dashboard/financial/invoices': { title: 'Invoice Management', group: 'Financial Management' },
    '/dashboard/financial/cost-centers': { title: 'Cost Centers', group: 'Financial Management' },
    '/dashboard/financial/currency': { title: 'Currency Settings', group: 'Financial Management' },
    '/dashboard/financial/reports': { title: 'Financial Reports', group: 'Financial Management' },
    '/dashboard/financial/billing': { title: 'Billing & Subscriptions', group: 'Financial Management' },
    '/dashboard/hr': { title: 'HR Overview', group: 'HR Management' },
    '/dashboard/hr/employees': { title: 'Employee Management', group: 'HR Management' },
    '/dashboard/hr/attendance': { title: 'Attendance Management', group: 'HR Management' },
    '/dashboard/hr/leaves': { title: 'Leave Management', group: 'HR Management' },
    '/dashboard/hr/payroll': { title: 'Payroll Management', group: 'HR Management' },
    '/dashboard/hr/recruitment': { title: 'Recruitment', group: 'HR Management' },
    '/dashboard/users': { title: 'User Management', group: 'Users' },
    '/dashboard/permissions': { title: 'Permissions & Privileges', group: 'Users' },
    '/dashboard/invite': { title: 'Invitations', group: 'Users' },
    '/dashboard/migration': { title: 'Migration & Testing', group: 'Users' },
    '/dashboard/user-fix': { title: 'User Relationship Fix', group: 'Users' },
    '/dashboard/user-transfer': { title: 'User Transfer', group: 'Users' },
    '/dashboard/video-call/start': { title: 'Start Meeting', group: 'Video Calls' },
    '/dashboard/video-call/join': { title: 'Join Meeting', group: 'Video Calls' },
    '/dashboard/video-call/schedule': { title: 'Schedule Meeting', group: 'Video Calls' },
    '/dashboard/video-call/history': { title: 'Meeting History', group: 'Video Calls' },
    '/dashboard/video-call/analytics': { title: 'Meeting Analytics', group: 'Video Calls' },
    '/dashboard/video-call/settings': { title: 'Settings', group: 'Video Calls' },
    '/dashboard/colleagues': { title: 'Team Members' },
    '/dashboard/ai': { title: 'AI Assistant' },
    '/dashboard/support': { title: 'Support/Help' },
    '/dashboard/calendar': { title: 'Calendar' },
    '/dashboard/notifications': { title: 'Notifications' },
    '/dashboard/activity': { title: 'Activity Log' },
    '/dashboard/databases': { title: 'Database Management' },
  };
  
  // Check for exact match first
  if (pageMap[pathname]) {
    return pageMap[pathname];
  }
  
  // Check for partial matches (for nested routes)
  for (const [path, info] of Object.entries(pageMap)) {
    if (pathname.startsWith(path + '/')) {
      return { ...info, title: `${info.title} - ${pathSegments[pathSegments.length - 1]}` };
    }
  }
  
  // Fallback: use the last segment of the path
  const lastSegment = pathSegments[pathSegments.length - 1];
  return { 
    title: lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' '),
    group: pathSegments.length > 2 ? pathSegments[1].charAt(0).toUpperCase() + pathSegments[1].slice(1) : null
  };
};

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['Workspace', 'Organization']);
  const [openNestedSections, setOpenNestedSections] = useState<string[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const isAdminOrOwner = useIsAdminOrOwner();
  const { unreadCount } = useNotifications();

  // Only show User Management for owners and admins
  const canManageUsers = userProfile?.role === 'owner' || userProfile?.role === 'admin';

  // Auto-open Reports nested dropdown when on reports page
  useEffect(() => {
    if (pathname === '/dashboard/reports' && !openNestedSections.includes('Reports')) {
      setOpenNestedSections(prev => [...prev, 'Reports']);
    }
  }, [pathname, openNestedSections]);

  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    );
  };

  const toggleNestedSection = (sectionName: string) => {
    setOpenNestedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    );
  };

  const isPathInGroup = (group: any) => {
    if (group.type === 'single') {
      return pathname === group.href;
    }
    return group.items?.some((item: any) => {
      if (item.type === 'nested-dropdown') {
        return pathname.startsWith(item.basePath);
      }
      return pathname === item.href;
    });
  };

  const isItemActive = (item: any) => {
    if (item.viewParam) {
      // For report items with view parameters, check both path and query param
      return pathname === '/dashboard/reports' && currentView === item.viewParam;
    }
    // For regular items, check the exact path
    return pathname === item.href;
  };

  // Clone navigationGroups and update the label for 'Manage Workspaces' dynamically
  const dynamicNavigationGroups = navigationGroups.map(group => {
    if (group.name === 'Workspace' && Array.isArray(group.items)) {
      return {
        ...group,
        items: group.items.map(item => {
          if (item.name === 'Manage Workspaces') {
            return {
              ...item,
              name: getWorkspaceNavLabel(userProfile?.role),
            };
          }
          return item;
        })
      };
    }
    return group;
  });

  const renderNavigationItem = (item: any, isSubItem = false, isNestedItem = false) => {
    // Owner-only check
    if (item.ownerOnly && userProfile?.role !== 'owner') {
      return null;
    }
    // Handle nested dropdown items
    if (item.type === 'nested-dropdown') {
      const isNestedOpen = openNestedSections.includes(item.name);
      const isActive = pathname.startsWith(item.basePath);
      
      return (
        <div key={item.name}>
          <Collapsible
            open={!collapsed && isNestedOpen}
            onOpenChange={() => !collapsed && toggleNestedSection(item.name)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10 transition-all duration-200 text-sm",
                  collapsed ? "px-2" : "px-6",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm dark:bg-primary/20 dark:text-primary-foreground" 
                    : "hover:bg-muted hover:shadow-sm hover:text-foreground dark:hover:bg-gray-800 dark:hover:text-gray-100",
                  "active:scale-95"
                )}
                onClick={(e) => collapsed && e.preventDefault()}
              >
                <item.icon className={cn("h-4 w-4 flex-shrink-0", collapsed ? "mr-0" : "mr-3")} />
                {!collapsed && (
                  <>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="block truncate">{item.name}</span>
                      {isActive && (
                        <span className="text-xs text-primary/70 block text-left">Section active</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {isActive && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                      {isNestedOpen ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {item.items?.map((nestedItem: any) => {
                // Skip admin-only items if user is not admin/owner
                if (nestedItem.adminOnly && !isAdminOrOwner) {
                  return null;
                }
                // Skip member-only items if user is not a member
                if (nestedItem.memberOnly && userProfile?.role !== 'member') {
                  return null;
                }
                return renderNavigationItem(nestedItem, true, true);
              })}
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    }

    // Regular navigation item with improved active state logic
    const isActive = isItemActive(item);
    
    return (
      <Link key={item.name} href={item.href}>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start transition-all duration-200 text-sm",
            collapsed ? "px-2 h-9" : isNestedItem ? "px-9 h-8" : isSubItem ? "px-6 h-9" : "px-3 h-10",
            isActive 
              ? "bg-primary/10 text-primary border border-primary/20 shadow-sm dark:bg-primary/20 dark:text-primary-foreground" 
              : "hover:bg-muted hover:shadow-sm hover:text-foreground dark:hover:bg-gray-800 dark:hover:text-gray-100",
            "active:scale-95"
          )}
          title={collapsed ? item.name : item.description}
        >
          <item.icon className={cn("h-4 w-4 flex-shrink-0", collapsed ? "mr-0" : "mr-3")} />
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <span className={cn(item.optional && "opacity-70", "text-left block truncate")}>
                  {item.name}
                  {item.optional && <span className="text-xs ml-1">(optional)</span>}
                </span>
                {isActive && (
                  <span className="text-xs text-primary/70 block text-left">Currently viewing</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {item.showUnreadBadge && unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs h-5 px-1.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
                {isActive && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                )}
              </div>
            </>
          )}
        </Button>
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card/50 backdrop-blur-sm border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-background rounded-sm"></div>
            </div>
            <span className="font-bold text-lg">WorkSpace</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-4">
          {dynamicNavigationGroups.map((group) => {
            // Special case: Allow members to see HR Management section
            if (group.name === 'HR Management' && userProfile?.role === 'member') {
              // Continue to render this group for members
            } else if (group.requiresPermission && !canManageUsers) {
              return null;
            }

            // Skip member-only items if user is not a member
            if (group.memberOnly && userProfile?.role !== 'member') {
              return null;
            }

            if (group.type === 'single') {
              return renderNavigationItem(group);
            }

            // Dropdown group
            const isGroupActive = isPathInGroup(group);
            const isOpen = openSections.includes(group.name);

            return (
              <Collapsible
                key={group.name}
                open={!collapsed && isOpen}
                onOpenChange={() => !collapsed && toggleSection(group.name)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant={isGroupActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-11 transition-all duration-200",
                      collapsed ? "px-2" : "px-3",
                      isGroupActive 
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm dark:bg-primary/10" 
                        : "hover:bg-muted hover:shadow-sm hover:text-foreground dark:hover:bg-gray-800 dark:hover:text-gray-100",
                      "active:scale-95"
                    )}
                    onClick={(e) => collapsed && e.preventDefault()}
                  >
                    <group.icon className={cn("h-4 w-4 flex-shrink-0", collapsed ? "mr-0" : "mr-3")} />
                    {!collapsed && (
                      <>
                        <div className="flex-1 min-w-0 text-left">
                          <span className="block truncate">{group.name}</span>
                          {isGroupActive && (
                            <span className="text-xs text-primary/70 block text-left">Section active</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {isGroupActive && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {group.items?.map((item: any) => {
                    // For members in HR Management, show Leave Management and Payroll Management
                    if (group.name === 'HR Management' && userProfile?.role === 'member') {
                      if (item.name !== 'Leave Management' && item.name !== 'Payroll Management') {
                        return null;
                      }
                    }
                    return renderNavigationItem(item, true);
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-2">
        <Link href="/dashboard/settings">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-10 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100",
              collapsed ? "px-2" : "px-3"
            )}
          >
            <Settings className={cn("h-4 w-4", collapsed ? "mr-0" : "mr-3")} />
            {!collapsed && <span>Settings</span>}
          </Button>
        </Link>
      </div>
    </div>
  );
}
