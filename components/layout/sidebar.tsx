'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/lib/auth-context';
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
} from 'lucide-react';

// Define navigation structure with groups and dropdowns
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
        name: 'Reports',
        href: '/dashboard/reports',
        icon: FileText,
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
        name: 'Invitations',
        href: '/dashboard/invite',
        icon: Mail,
      },
    ],
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
    name: 'Activity Log',
    href: '/dashboard/activity',
    icon: Activity,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['Workspace', 'Organization']);
  const pathname = usePathname();
  const { userProfile } = useAuth();

  // Only show User Management for owners and admins
  const canManageUsers = userProfile?.role === 'owner' || userProfile?.role === 'admin';

  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    );
  };

  const isPathInGroup = (group: any) => {
    if (group.type === 'single') {
      return pathname === group.href;
    }
    return group.items?.some((item: any) => pathname === item.href);
  };

  const renderNavigationItem = (item: any, isSubItem = false) => {
    const isActive = pathname === item.href;
    return (
      <Link key={item.name} href={item.href}>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start h-9 transition-colors text-sm",
            collapsed ? "px-2" : isSubItem ? "px-6" : "px-3",
            isActive 
              ? "bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:text-primary-foreground" 
              : "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          )}
        >
          <item.icon className={cn("h-4 w-4", collapsed ? "mr-0" : "mr-3")} />
          {!collapsed && (
            <span className={cn(item.optional && "opacity-70")}>
              {item.name}
              {item.optional && <span className="text-xs ml-1">(optional)</span>}
            </span>
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
          {navigationGroups.map((group) => {
            // Skip groups that require permission if user doesn't have it
            if (group.requiresPermission && !canManageUsers) {
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