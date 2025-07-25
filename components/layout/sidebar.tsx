'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/lib/auth-context';
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
  DollarSign,
  Receipt,
  Target,
  Building,
  CreditCard,
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
    icon: DollarSign,
    requiresPermission: true,
    items: [
      {
        name: 'Financial Dashboard',
        href: '/dashboard/financial/overview',
        icon: DollarSign,
        description: 'Overview of budgets, expenses, and financial metrics',
      },
      {
        name: 'Expense Management',
        href: '/dashboard/financial/expenses',
        icon: Receipt,
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
        icon: DollarSign,
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

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['Workspace', 'Organization']);
  const [openNestedSections, setOpenNestedSections] = useState<string[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');
  const { userProfile } = useAuth();
  const isAdminOrOwner = useIsAdminOrOwner();
  const { unreadCount } = useNotifications();

  // Only show User Management for owners and admins
  const canManageUsers = userProfile?.role === 'owner' || userProfile?.role === 'admin';

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
                  "w-full justify-start h-9 transition-colors text-sm",
                  collapsed ? "px-2" : "px-6",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:text-primary-foreground" 
                    : "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                )}
                onClick={(e) => collapsed && e.preventDefault()}
              >
                <item.icon className={cn("h-4 w-4", collapsed ? "mr-0" : "mr-3")} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.name}</span>
                    {isNestedOpen ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
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
            "w-full justify-start transition-colors text-sm",
            collapsed ? "px-2 h-9" : isNestedItem ? "px-9 h-8" : isSubItem ? "px-6 h-9" : "px-3 h-9",
            isActive 
              ? "bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:text-primary-foreground" 
              : "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          )}
          title={collapsed ? item.name : item.description}
        >
          <item.icon className={cn("h-4 w-4", collapsed ? "mr-0" : "mr-3")} />
          {!collapsed && (
            <>
              <span className={cn(item.optional && "opacity-70", "text-left")}>
                {item.name}
                {item.optional && <span className="text-xs ml-1">(optional)</span>}
              </span>
              {item.showUnreadBadge && unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
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
            // Skip groups that require permission if user doesn't have it
            if (group.requiresPermission && !canManageUsers) {
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
                      "w-full justify-start h-10 transition-colors",
                      collapsed ? "px-2" : "px-3",
                      isGroupActive 
                        ? "bg-primary/5 text-primary border border-primary/10 dark:bg-primary/10" 
                        : "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                    )}
                    onClick={(e) => collapsed && e.preventDefault()}
                  >
                    <group.icon className={cn("h-4 w-4", collapsed ? "mr-0" : "mr-3")} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{group.name}</span>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {group.items?.map((item: any) => renderNavigationItem(item, true))}
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