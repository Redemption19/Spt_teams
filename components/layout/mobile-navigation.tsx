'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/lib/auth-context';
import { useIsAdminOrOwner } from '@/lib/rbac-hooks';
import { useNotifications } from '@/lib/notification-context';
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
  Clock,
  UserPlus,
  Video,
  Phone,
} from 'lucide-react';

// Navigation structure from sidebar
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
        icon: DollarSign,
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

interface MobileNavigationProps {
  onNavigate: () => void;
}

export function MobileNavigation({ onNavigate }: MobileNavigationProps) {
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [openNestedSections, setOpenNestedSections] = useState<string[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');
  const { userProfile, isGuest } = useAuth();
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
        return pathname === item.basePath;
      }
      return pathname === item.href || pathname.startsWith(item.href + '/');
    });
  };

  const isNestedItemActive = (item: any, currentView: string | null) => {
    if (item.viewParam && currentView) {
      return item.viewParam === currentView;
    }
    return pathname === item.href;
  };

  const shouldShowItem = (item: any) => {
    // Check role-based permissions
    if (item.ownerOnly && userProfile?.role !== 'owner') return false;
    if (item.adminOnly && !isAdminOrOwner) return false;
    if (item.memberOnly && isGuest) return false;
    
    return true;
  };

  const shouldShowGroup = (group: any) => {
    // Check if group requires permission and user has it
    if (group.requiresPermission && !canManageUsers && group.name !== 'Financial Management' && group.name !== 'HR Management') {
      return false;
    }
    
    // Check role-based permissions for the group itself
    if (group.ownerOnly && userProfile?.role !== 'owner') return false;
    if (group.adminOnly && !isAdminOrOwner) return false;
    if (group.memberOnly && isGuest) return false;
    
    return true;
  };

  return (
    <div className="space-y-1">
      {navigationGroups.filter(shouldShowGroup).map((group) => {
        const Icon = group.icon;
        const isActive = isPathInGroup(group);
        const isOpen = openSections.includes(group.name);

        if (group.type === 'single') {
          return (
            <Button
              key={group.name}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-9 px-3 text-sm font-normal",
                isActive && "bg-secondary text-secondary-foreground"
              )}
              asChild
              onClick={onNavigate}
            >
              <Link href={group.href || '#'}>
                <Icon className="mr-2 h-4 w-4" />
                {group.name}
                {group.showUnreadBadge && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
          );
        }

        return (
          <Collapsible key={group.name} open={isOpen} onOpenChange={() => toggleSection(group.name)}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-between h-9 px-3 text-sm font-normal",
                  isActive && "bg-secondary text-secondary-foreground"
                )}
              >
                <div className="flex items-center">
                  <Icon className="mr-2 h-4 w-4" />
                  {group.name}
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {group.items?.filter(shouldShowItem).map((item: any) => {
                const ItemIcon = item.icon;
                
                if (item.type === 'nested-dropdown') {
                  const isNestedOpen = openNestedSections.includes(item.name);
                  const isNestedActive = pathname === item.basePath;
                  
                  return (
                    <div key={item.name} className="ml-4">
                      <Collapsible open={isNestedOpen} onOpenChange={() => toggleNestedSection(item.name)}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant={isNestedActive ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-between h-8 px-3 text-sm font-normal",
                              isNestedActive && "bg-secondary text-secondary-foreground"
                            )}
                          >
                            <div className="flex items-center">
                              <ItemIcon className="mr-2 h-3.5 w-3.5" />
                              {item.name}
                            </div>
                            {isNestedOpen ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1 mt-1">
                          {item.items?.filter(shouldShowItem).map((nestedItem: any) => {
                            const NestedIcon = nestedItem.icon;
                            const isNestedItemActiveState = isNestedItemActive(nestedItem, currentView);
                            
                            return (
                              <Button
                                key={nestedItem.name}
                                variant={isNestedItemActiveState ? "secondary" : "ghost"}
                                className={cn(
                                  "w-full justify-start h-8 px-3 ml-4 text-xs font-normal",
                                  isNestedItemActiveState && "bg-secondary text-secondary-foreground"
                                )}
                                asChild
                                onClick={onNavigate}
                              >
                                <Link href={nestedItem.href || '#'}>
                                  <NestedIcon className="mr-2 h-3 w-3" />
                                  {nestedItem.name}
                                </Link>
                              </Button>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                }
                
                const isItemActive = pathname === item.href || pathname.startsWith(item.href + '/');
                
                return (
                  <Button
                    key={item.name}
                    variant={isItemActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-8 px-3 ml-4 text-sm font-normal",
                      isItemActive && "bg-secondary text-secondary-foreground"
                    )}
                    asChild
                    onClick={onNavigate}
                  >
                    <Link href={item.href || '#'}>
                      <ItemIcon className="mr-2 h-3.5 w-3.5" />
                      {item.name}
                    </Link>
                  </Button>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}