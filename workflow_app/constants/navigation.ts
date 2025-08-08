import { NavigationItem } from '../types';

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'home',
    route: '/dashboard',
  },
  {
    id: 'workspaces',
    title: 'Workspaces',
    icon: 'briefcase',
    route: '/workspaces',
  },
  {
    id: 'teams',
    title: 'Teams',
    icon: 'users',
    route: '/teams',
  },
  {
    id: 'tasks',
    title: 'Tasks',
    icon: 'check-square',
    route: '/tasks',
  },
  {
    id: 'financial',
    title: 'Financial',
    icon: 'dollar-sign',
    route: '/financial',
    children: [
      {
        id: 'expenses',
        title: 'Expenses',
        icon: 'receipt',
        route: '/financial/expenses',
      },
      {
        id: 'budgets',
        title: 'Budgets',
        icon: 'pie-chart',
        route: '/financial/budgets',
      },
    ],
  },
  {
    id: 'hr',
    title: 'HR',
    icon: 'user-check',
    route: '/hr',
    children: [
      {
        id: 'employees',
        title: 'Employees',
        icon: 'users',
        route: '/hr/employees',
      },
      {
        id: 'attendance',
        title: 'Attendance',
        icon: 'clock',
        route: '/hr/attendance',
      },
      {
        id: 'leave',
        title: 'Leave',
        icon: 'calendar',
        route: '/hr/leave',
      },
    ],
  },
  {
    id: 'documents',
    title: 'Documents',
    icon: 'file-text',
    route: '/documents',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: 'bar-chart',
    route: '/analytics',
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    icon: 'zap',
    route: '/ai-assistant',
  },
  {
    id: 'calendar',
    title: 'Calendar',
    icon: 'calendar',
    route: '/calendar',
  },
  {
    id: 'communication',
    title: 'Communication',
    icon: 'message-circle',
    route: '/communication',
    children: [
      {
        id: 'chats',
        title: 'Chats',
        icon: 'message-square',
        route: '/communication/chats',
      },
      {
        id: 'calls',
        title: 'Calls',
        icon: 'phone',
        route: '/communication/calls',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings',
    route: '/settings',
  },
];

// Bottom Tab Navigation
export const BOTTOM_TAB_ITEMS = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'home',
    route: '/dashboard',
  },
  {
    id: 'tasks',
    title: 'Tasks',
    icon: 'check-square',
    route: '/tasks',
  },
  {
    id: 'teams',
    title: 'Teams',
    icon: 'users',
    route: '/teams',
  },
  {
    id: 'financial',
    title: 'Financial',
    icon: 'dollar-sign',
    route: '/financial',
  },
  {
    id: 'more',
    title: 'More',
    icon: 'more-horizontal',
    route: '/more',
  },
];

// Auth Routes
export const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/onboarding',
];

// Public Routes (no auth required)
export const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
];

// Routes that require onboarding
export const ONBOARDING_ROUTES = [
  '/auth/onboarding',
];

// Routes that show in the main navigation
export const MAIN_NAVIGATION_ROUTES = [
  '/dashboard',
  '/workspaces',
  '/teams',
  '/tasks',
  '/financial',
  '/hr',
  '/documents',
  '/analytics',
  '/ai-assistant',
  '/calendar',
  '/communication',
  '/settings',
];

// Get navigation item by route
export const getNavigationItemByRoute = (route: string): NavigationItem | null => {
  const findItem = (items: NavigationItem[]): NavigationItem | null => {
    for (const item of items) {
      if (item.route === route) {
        return item;
      }
      if (item.children) {
        const childItem = findItem(item.children);
        if (childItem) {
          return childItem;
        }
      }
    }
    return null;
  };

  return findItem(NAVIGATION_ITEMS);
};

// Get parent navigation item
export const getParentNavigationItem = (route: string): NavigationItem | null => {
  for (const item of NAVIGATION_ITEMS) {
    if (item.children) {
      const childItem = item.children.find(child => child.route === route);
      if (childItem) {
        return item;
      }
    }
  }
  return null;
};

// Get breadcrumb for route
export const getBreadcrumbForRoute = (route: string): NavigationItem[] => {
  const breadcrumb: NavigationItem[] = [];
  
  for (const item of NAVIGATION_ITEMS) {
    if (item.route === route) {
      breadcrumb.push(item);
      break;
    }
    if (item.children) {
      const childItem = item.children.find(child => child.route === route);
      if (childItem) {
        breadcrumb.push(item);
        breadcrumb.push(childItem);
        break;
      }
    }
  }
  
  return breadcrumb;
};
