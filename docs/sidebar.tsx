import { 
  BookOpen, 
  Rocket, 
  Building2, 
  Shield, 
  Users, 
  BarChart3, 
  FolderOpen, 
  Wallet, 
  UserPlus, 
  Calendar, 
  Bot, 
  Lock, 
  HelpCircle, 
  History 
} from 'lucide-react';

export const sidebar = [
  {
    title: "Introduction",
    path: "/docs/introduction",
    icon: BookOpen,
    description: "Welcome to SPT Teams platform overview"
  },
  {
    title: "Getting Started",
    path: "/docs/getting-started",
    icon: Rocket,
    description: "Quick setup guide for new users"
  },
  {
    title: "Workspace Management",
    path: "/docs/workspaces",
    icon: Building2,
    description: "Hierarchical workspace setup and management"
  },
  {
    title: "Roles & Permissions",
    path: "/docs/roles-and-permissions",
    icon: Shield,
    description: "Role-based access control and permissions"
  },
  {
    title: "Team Management",
    path: "/docs/team-management",
    icon: Users,
    description: "Team creation, management, and collaboration"
  },
  {
    title: "Reporting & Analytics",
    path: "/docs/reporting-analytics",
    icon: BarChart3,
    description: "Dynamic reporting and analytics features"
  },
  {
    title: "Document Management",
    path: "/docs/document-management",
    icon: FolderOpen,
    description: "File storage, organization, and collaboration"
  },
  {
    title: "Financial Management",
    path: "/docs/financial-management",
    icon: Wallet,
    description: "Expenses, budgets, invoices, and financial tracking"
  },
  {
    title: "HR Management",
    path: "/docs/hr-management",
    icon: UserPlus,
    description: "Employee management, payroll, attendance, and recruitment"
  },
  {
    title: "Calendar & Tasks",
    path: "/docs/calendar-tasks",
    icon: Calendar,
    description: "Calendar management and task tracking"
  },
  {
    title: "AI Assistant",
    path: "/docs/ai-assistant",
    icon: Bot,
    description: "AI-powered intelligence and recommendations"
  },
  {
    title: "Security",
    path: "/docs/security",
    icon: Lock,
    description: "Security features and best practices"
  },
  {
    title: "Troubleshooting & FAQs",
    path: "/docs/troubleshooting",
    icon: HelpCircle,
    description: "Common issues and solutions"
  },
  {
    title: "Changelog",
    path: "/docs/changelog",
    icon: History,
    description: "Platform updates and new features"
  }
];

export const sidebarGroups = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", path: "/docs/introduction", icon: BookOpen },
      { title: "Getting Started", path: "/docs/getting-started", icon: Rocket }
    ]
  },
  {
    title: "Core Features",
    items: [
      { title: "Workspace Management", path: "/docs/workspaces", icon: Building2 },
      { title: "Roles & Permissions", path: "/docs/roles-and-permissions", icon: Shield },
      { title: "Team Management", path: "/docs/team-management", icon: Users },
      { title: "Reporting & Analytics", path: "/docs/reporting-analytics", icon: BarChart3 }
    ]
  },
  {
    title: "Management Suites",
    items: [
      { title: "Document Management", path: "/docs/document-management", icon: FolderOpen },
      { title: "Financial Management", path: "/docs/financial-management", icon: Wallet },
      { title: "HR Management", path: "/docs/hr-management", icon: UserPlus },
      { title: "Calendar & Tasks", path: "/docs/calendar-tasks", icon: Calendar }
    ]
  },
  {
    title: "Advanced Features",
    items: [
      { title: "AI Assistant", path: "/docs/ai-assistant", icon: Bot },
      { title: "Security", path: "/docs/security", icon: Lock }
    ]
  },
  {
    title: "Support",
    items: [
      { title: "Troubleshooting & FAQs", path: "/docs/troubleshooting", icon: HelpCircle },
      { title: "Changelog", path: "/docs/changelog", icon: History }
    ]
  }
];

export default sidebar; 