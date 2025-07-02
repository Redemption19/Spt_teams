'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Settings,
  Filter,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { 
  useRolePermissions, 
  useIsOwner, 
  useCalendarAccess
} from '@/lib/rbac-hooks';
import { CalendarService, CalendarEvent, CalendarFilters } from '@/lib/calendar-service';
import { UserService } from '@/lib/user-service';
import { TeamService } from '@/lib/team-service';
import { DepartmentService } from '@/lib/department-service';
import { ReportService } from '@/lib/report-service';
import { ReportTemplateService } from '@/lib/report-template-service';
import { EnhancedReport, ReportTemplate } from '@/lib/types';

// Import modular components
import { CalendarView, CalendarViewRef } from './calendar-view';
import { CalendarFilters as FilterComponent } from './calendar-filters';
import { EventDialogs } from './event-dialogs';
import { CalendarStats } from './calendar-stats';
import { ReportDeadlineStats } from './ReportDeadlineStats';
import { ReportCards } from './ReportCards';
import { UpcomingEvents } from './upcoming-events';
import { CreateEventPage } from './CreateEventPage';
import { EditEventPage } from './EditEventPage';

export default function CalendarMain() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace, userRole, accessibleWorkspaces } = useWorkspace();
  const permissions = useRolePermissions();
  const isOwner = useIsOwner();
  
  // Cross-workspace management state for owners
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);
  
  // Enhanced calendar permissions with workspace isolation
  const calendarAccess = useCalendarAccess();
  
  const calendarViewRef = useRef<CalendarViewRef>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [myEvents, setMyEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  
  // Page states
  const [showCreateEventPage, setShowCreateEventPage] = useState(false);
  const [showEditEventPage, setShowEditEventPage] = useState(false);
  
  // Dialog states (create event now uses dedicated page)
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [isViewEventOpen, setIsViewEventOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Data for dropdowns (filtered by workspace)
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  // Calendar filters with all required properties
  const [filters, setFilters] = useState<CalendarFilters>(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
    
    return {
      types: [],
      status: [],
      departments: [],
      teams: [],
      priority: [],
      searchTerm: '',
      dateRange: {
        start: startDate,
        end: endDate
      }
    };
  });
  
  // Statistics
  const [stats, setStats] = useState({
    todayEvents: 0,
    weekEvents: 0,
    pendingDeadlines: 0,
    completedThisWeek: 0
  });

  // Report deadline statistics
  const [reportStats, setReportStats] = useState({
    dueToday: 0,
    dueThisWeek: 0,
    overdue: 0,
    submitted: 0
  });

  // Real reports data (filtered by workspace)
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [reportUsers, setReportUsers] = useState<any[]>([]);

  // Convert EnhancedReport to ReportItem format with workspace permission checks
  const convertToReportItem = useCallback((report: EnhancedReport, template: ReportTemplate | undefined, author: any): any => {
    // Check if user has permission to view this report manually without hooks
    const canViewReport = report && (
      report.authorId === user?.uid ||
      report.status === 'approved' ||
      report.status === 'submitted' ||
      calendarAccess.canManageReportDeadlines ||
      calendarAccess.isAdminOrOwner
    );
    
    if (!canViewReport) {
      return null;
    }

    // Get deadline from template or use submittedAt + 30 days as fallback
    let dueDate = new Date();
    if (template?.deadlineConfig?.frequency) {
      // Calculate next deadline based on frequency
      switch (template.deadlineConfig.frequency) {
        case 'weekly':
          dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + 1);
          break;
        case 'quarterly':
          dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + 3);
          break;
        case 'yearly':
          dueDate = new Date();
          dueDate.setFullYear(dueDate.getFullYear() + 1);
          break;
        default:
          dueDate = new Date(report.submittedAt || report.createdAt);
          dueDate.setDate(dueDate.getDate() + 30);
      }
    } else {
      dueDate = new Date(report.submittedAt || report.createdAt);
      dueDate.setDate(dueDate.getDate() + 30);
    }

    // Manual permission checks for actions
    const canEditReport = report.authorId === user?.uid || calendarAccess.isAdminOrOwner;
    const canSubmitReport = report.authorId === user?.uid && report.status !== 'submitted' && report.status !== 'approved' && report.status !== 'archived';

    return {
      id: report.id,
      title: report.title,
      branch: author?.branch || undefined,
      department: author?.department || template?.department || undefined,
      region: author?.region || undefined,
      dueDate,
      status: report.status === 'under_review' ? 'submitted' : report.status,
      priority: template?.deadlineConfig?.priority || report.priority || 'medium',
      submittedBy: report.status === 'submitted' || report.status === 'under_review' || report.status === 'approved' ? author?.name : undefined,
      type: template?.category || 'custom',
      canEdit: canEditReport,
      canSubmit: canSubmitReport,
      canView: canViewReport
    };
  }, [user?.uid, calendarAccess]);

  // Memoize stable references for EventDialogs props
  const stableSetCreateEventOpen = useMemo(() => () => {}, []);
  
  const stablePermissions = useMemo(() => ({
    userId: user?.uid,
    workspaceId: currentWorkspace?.id,
    ...permissions
  }), [user?.uid, currentWorkspace?.id, permissions]);

  // Load user's events with broader date range for "My Events" section and cross-workspace support
  const loadMyEvents = useCallback(async () => {
    if (!currentWorkspace?.id || !user?.uid) return;
    
    try {
      // Use a broader date range to capture all user events (past year to next year)
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      // Determine workspace IDs to load from
      const workspaceIds = (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) 
        ? accessibleWorkspaces.map(w => w.id)
        : [currentWorkspace.id];
      
      let allUserEvents: CalendarEvent[] = [];
      
      // Load user events from all relevant workspaces
      for (const wsId of workspaceIds) {
        try {
          const workspaceEvents = await CalendarService.getEvents(
            wsId, 
            startDate, 
            endDate, 
            {}, 
            userRole as 'member' | 'admin' | 'owner'
          );
          
          // Filter for user's events from this workspace
          const userEventsFromWorkspace = workspaceEvents.filter(event => 
            event.createdBy === user.uid && event.workspaceId === wsId
          );
          
          // Add events avoiding duplicates
          userEventsFromWorkspace.forEach(event => {
            if (!allUserEvents.some(e => e.id === event.id)) {
              allUserEvents.push(event);
            }
          });
        } catch (wsError) {
          console.error(`Error loading user events from workspace ${wsId}:`, wsError);
        }
      }
      
      setMyEvents(allUserEvents);
      
    } catch (error) {
      console.error('Error loading my events:', error);
    }
  }, [currentWorkspace?.id, user?.uid, userRole, isOwner, showAllWorkspaces, accessibleWorkspaces?.map(w => w.id).join(',') || '']);

  // Load data with workspace isolation and cross-workspace support
  const loadData = useCallback(async () => {
    console.log('🔄 loadData started', { 
      workspaceId: currentWorkspace?.id, 
      userId: user?.uid,
      showAllWorkspaces,
      accessibleWorkspaces: accessibleWorkspaces?.length || 0,
      calendarAccess: calendarAccess ? 'defined' : 'undefined'
    });
    
    if (!currentWorkspace?.id || !user?.uid) {
      console.log('❌ Missing workspace or user, aborting loadData');
      return;
    }
    
    try {
      setLoading(true);
      console.log('📊 Starting data fetch...');
      
      // Use broader date range to ensure events are loaded for navigation
      // Load 6 months before current date to 2 years after
      const startDate = new Date(currentDate);
      startDate.setMonth(startDate.getMonth() - 6);
      const endDate = new Date(currentDate);
      endDate.setFullYear(endDate.getFullYear() + 2);
      
      console.log('📅 Date range:', { startDate, endDate });
      
      // Determine workspace IDs to load from
      const workspaceIds = (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) 
        ? accessibleWorkspaces.map(w => w.id)
        : [currentWorkspace.id];
      
      console.log('🏢 Loading from workspaces:', workspaceIds);
      
      // Load events from all relevant workspaces
      let allEvents: CalendarEvent[] = [];
      
      for (const wsId of workspaceIds) {
        try {
          const workspaceEvents = await CalendarService.getEvents(
            wsId, 
            startDate, 
            endDate, 
            {}, 
            userRole as 'member' | 'admin' | 'owner'
          );
          
          // Add events avoiding duplicates
          workspaceEvents.forEach(event => {
            if (!allEvents.some(e => e.id === event.id)) {
              allEvents.push(event);
            }
          });
        } catch (wsError) {
          console.error(`Error loading events from workspace ${wsId}:`, wsError);
        }
      }
      
      console.log('📅 Total events loaded:', allEvents.length);
      
      // Load additional data from all relevant workspaces
      let allUsers: any[] = [];
      let allTeams: any[] = [];
      let allDepartments: any[] = [];
      let aggregatedStats = {
        todayEvents: 0,
        weekEvents: 0,
        pendingDeadlines: 0,
        completedThisWeek: 0
      };
      let aggregatedReportStats = {
        dueToday: 0,
        dueThisWeek: 0,
        overdue: 0,
        submitted: 0
      };
      
      for (const wsId of workspaceIds) {
        try {
          const [wsUsers, wsTeams, wsDepartments, wsStats, wsReportStats] = await Promise.all([
            UserService.getUsersByWorkspace(wsId),
            TeamService.getWorkspaceTeams(wsId),
            DepartmentService.getWorkspaceDepartments(wsId),
            CalendarService.getCalendarStats ? CalendarService.getCalendarStats(wsId, user.uid) : Promise.resolve({
              todayEvents: 0,
              weekEvents: 0,
              pendingDeadlines: 0,
              completedThisWeek: 0
            }),
            CalendarService.getReportDeadlineStats ? CalendarService.getReportDeadlineStats(wsId) : Promise.resolve({
              dueToday: 0,
              dueThisWeek: 0,
              overdue: 0,
              submitted: 0
            })
          ]);
          
          // Aggregate users (avoid duplicates)
          wsUsers.forEach(user => {
            if (!allUsers.some(u => u.id === user.id)) {
              allUsers.push(user);
            }
          });
          
          // Aggregate teams (avoid duplicates)
          wsTeams.forEach(team => {
            if (!allTeams.some(t => t.id === team.id)) {
              allTeams.push(team);
            }
          });
          
          // Aggregate departments (avoid duplicates)
          wsDepartments.forEach(dept => {
            if (!allDepartments.some(d => d.id === dept.id)) {
              allDepartments.push(dept);
            }
          });
          
          // Aggregate stats
          aggregatedStats.todayEvents += wsStats.todayEvents;
          aggregatedStats.weekEvents += wsStats.weekEvents;
          aggregatedStats.pendingDeadlines += wsStats.pendingDeadlines;
          aggregatedStats.completedThisWeek += wsStats.completedThisWeek;
          
          // Aggregate report stats
          aggregatedReportStats.dueToday += wsReportStats.dueToday;
          aggregatedReportStats.dueThisWeek += wsReportStats.dueThisWeek;
          aggregatedReportStats.overdue += wsReportStats.overdue;
          aggregatedReportStats.submitted += wsReportStats.submitted;
          
        } catch (wsError) {
          console.error(`Error loading data from workspace ${wsId}:`, wsError);
        }
      }
      
      // Events are already aggregated from all workspaces
      const accessibleEvents = allEvents;
      
      console.log('🔍 Filtered events:', accessibleEvents.length);
      
      setEvents(accessibleEvents);
      setFilteredEvents(accessibleEvents);
      setUsers(allUsers);
      setTeams(allTeams);
      setDepartments(allDepartments);
      setStats(aggregatedStats);
      setReportStats(aggregatedReportStats);
      
      console.log('✅ loadData completed successfully');
      
    } catch (error) {
      console.error('❌ Error loading calendar data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  }, [currentWorkspace?.id, user?.uid, userRole, isOwner, showAllWorkspaces, accessibleWorkspaces?.map(w => w.id).join(',') || '']); // Added cross-workspace dependencies

  // Load recent reports with workspace isolation and cross-workspace support
  const loadRecentReports = useCallback(async () => {
    console.log('📊 loadRecentReports called', { showAllWorkspaces, accessibleWorkspaces: accessibleWorkspaces?.length });
    if (!currentWorkspace?.id || !user?.uid) return;
    
    try {
      // Determine workspace IDs to load from
      const workspaceIds = (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) 
        ? accessibleWorkspaces.map(w => w.id)
        : [currentWorkspace.id];
      
      let allUserReports: any[] = [];
      let allWorkspaceReports: any[] = [];
      let allTemplates: any[] = [];
      let allUsers: any[] = [];
      
      // Load reports from all relevant workspaces
      for (const wsId of workspaceIds) {
        try {
          const [wsUserReports, wsWorkspaceReports, wsTemplates, wsUsers] = await Promise.all([
            ReportService.getUserReports(wsId, user.uid, {
              orderBy: 'updatedAt',
              orderDirection: 'desc',
              limit: 10
            }),
            // Only get workspace reports if user has management permissions
            (calendarAccess.canManageReportDeadlines) ? 
              ReportService.getWorkspaceReports(wsId, {
                status: 'submitted',
                orderBy: 'submittedAt', 
                orderDirection: 'desc',
                limit: 5
              }) : Promise.resolve([]),
            ReportTemplateService.getWorkspaceTemplates(wsId, {
              status: 'active'
            }),
            UserService.getUsersByWorkspace(wsId)
          ]);

          // Aggregate user reports (avoid duplicates)
          wsUserReports.forEach(report => {
            if (!allUserReports.some(r => r.id === report.id)) {
              allUserReports.push(report);
            }
          });

          // Aggregate workspace reports (avoid duplicates)
          wsWorkspaceReports.forEach(report => {
            if (!allWorkspaceReports.some(r => r.id === report.id)) {
              allWorkspaceReports.push(report);
            }
          });

          // Aggregate templates (avoid duplicates)
          wsTemplates.forEach(template => {
            if (!allTemplates.some(t => t.id === template.id)) {
              allTemplates.push(template);
            }
          });

          // Aggregate users (avoid duplicates)
          wsUsers.forEach(user => {
            if (!allUsers.some(u => u.id === user.id)) {
              allUsers.push(user);
            }
          });
        } catch (wsError) {
          console.error(`Error loading reports from workspace ${wsId}:`, wsError);
        }
      }

      setReportTemplates(allTemplates);
      setReportUsers(allUsers);

      // Combine user reports and recent workspace submissions (avoid duplicates)
      const combinedReports: EnhancedReport[] = [];

      // Add user reports first
      allUserReports.forEach(report => {
        if (!combinedReports.some(r => r.id === report.id)) {
          combinedReports.push(report);
        }
      });

      // Add recent workspace submissions if they're not already included
      allWorkspaceReports.forEach(report => {
        if (!combinedReports.some(r => r.id === report.id)) {
          combinedReports.push(report);
        }
      });

      // Apply workspace-based filtering to reports (check if from relevant workspaces)
      const accessibleReports = combinedReports.filter(report => 
        workspaceIds.includes(report.workspaceId) &&
        (
          report.authorId === user.uid ||
          report.status === 'approved' ||
          report.status === 'submitted' ||
          calendarAccess.canManageReportDeadlines ||
          calendarAccess.isAdminOrOwner
        )
      );

      // Convert to ReportItem format with permission checks
      const convertedReports = accessibleReports.map(report => {
        const template = allTemplates.find(t => t.id === report.templateId);
        const author = allUsers.find(u => u.id === report.authorId);
        return convertToReportItem(report, template, author);
      }).filter(Boolean); // Remove null results from permission failures

      // Sort by due date and updated date
      convertedReports.sort((a, b) => {
        // Prioritize by status first (pending/draft first), then by due date
        const statusPriority = { 'pending': 0, 'draft': 1, 'submitted': 2, 'approved': 3, 'rejected': 4 };
        const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 5;
        const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 5;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      setRecentReports(convertedReports.slice(0, 8)); // Show top 8 reports
      console.log('✅ Reports loaded successfully');
    } catch (error) {
      console.error('Error loading recent reports:', error);
    }
  }, [currentWorkspace?.id, user?.uid, calendarAccess.canManageReportDeadlines, calendarAccess.isAdminOrOwner, convertToReportItem, isOwner, showAllWorkspaces, accessibleWorkspaces?.map(w => w.id).join(',') || '']);

  useEffect(() => {
    console.log('🔄 Main useEffect triggered', {
      workspaceId: currentWorkspace?.id,
      userId: user?.uid
    });
    
    if (currentWorkspace?.id && user?.uid) {
      loadData();
      loadMyEvents();
      loadRecentReports();
    }
  }, [currentWorkspace?.id, user?.uid]); // Simplified dependencies

  // Apply filters to events
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...events];
      
      if (filters.types.length > 0) {
        filtered = filtered.filter(event => filters.types.includes(event.type));
      }
      
      if (filters.status.length > 0) {
        filtered = filtered.filter(event => filters.status.includes(event.status));
      }
      
      if (filters.priority.length > 0) {
        filtered = filtered.filter(event => filters.priority.includes(event.priority));
      }
      
      if (filters.departments.length > 0) {
        filtered = filtered.filter(event => 
          event.departmentId && filters.departments.includes(event.departmentId)
        );
      }
      
      if (filters.teams.length > 0) {
        filtered = filtered.filter(event => 
          event.teamId && filters.teams.includes(event.teamId)
        );
      }
      
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(event =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower)
        );
      }
      
      setFilteredEvents(filtered);
    };
    
    applyFilters();
  }, [
    events, 
    filters.types, 
    filters.status, 
    filters.priority, 
    filters.departments, 
    filters.teams, 
    filters.searchTerm
  ]);

  const handleCreateEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentWorkspace?.id || !user?.uid) return;
    
    // Check permission to create events
    if (!calendarAccess.canCreateEvents) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to create events.',
        variant: 'destructive',
      });
      return;
    }
    
    await CalendarService.createEvent(currentWorkspace.id, eventData, user.uid);
    setShowCreateEventPage(false);
    await loadData();
    await loadMyEvents();
  }, [currentWorkspace?.id, user?.uid, calendarAccess.canCreateEvents, loadData, loadMyEvents, toast]);

  const handleUpdateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    if (!currentWorkspace?.id || !user?.uid) return;
    
    // Get the event to check permissions
    const event = events.find(e => e.id === eventId);
    
    // Check permissions manually without using hooks inside callback
    const canEdit = event && (
      event.createdBy === user.uid || 
      calendarAccess.canEditEvents ||
      (calendarAccess.isAdminOrOwner && event.workspaceId === currentWorkspace.id)
    );
    
    if (!canEdit) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to edit this event.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await CalendarService.updateEvent(currentWorkspace.id, eventId, updates, user.uid);
      toast({
        title: 'Success',
        description: 'Event updated successfully',
      });
      setIsEditEventOpen(false);
      setShowEditEventPage(false);
      setSelectedEvent(null);
      await loadData();
      await loadMyEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event. Please try again.',
        variant: 'destructive',
      });
    }
  }, [currentWorkspace?.id, user?.uid, events, loadData, loadMyEvents, toast, calendarAccess]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    if (!currentWorkspace?.id || !user?.uid) return;
    
    // Get the event to check permissions
    const event = events.find(e => e.id === eventId);
    
    // Check permissions manually without using hooks inside callback
    const canDelete = event && (
      event.createdBy === user.uid || 
      calendarAccess.canDeleteEvents ||
      (calendarAccess.isAdminOrOwner && event.workspaceId === currentWorkspace.id)
    );
    
    if (!canDelete) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to delete this event.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await CalendarService.deleteEvent(currentWorkspace.id, eventId, user.uid);
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
      setIsEditEventOpen(false);
      setIsViewEventOpen(false);
      setSelectedEvent(null);
      await loadData();
      await loadMyEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        variant: 'destructive',
      });
    }
  }, [currentWorkspace?.id, user?.uid, events, loadData, loadMyEvents, toast, calendarAccess]);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    // Check if user can view this event manually without using hooks inside callback
    const canView = event && (
      event.visibility === 'public' ||
      event.createdBy === user?.uid ||
      event.attendees?.includes(user?.uid || '') ||
      calendarAccess.canAccessCalendar
    );
    
    if (!canView) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to view this event.',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedEvent(event);
    setIsViewEventOpen(true);
  }, [user?.uid, toast, calendarAccess]);

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    // Check if user can edit this event manually without using hooks inside callback
    const canEdit = event && (
      event.createdBy === user?.uid || 
      calendarAccess.canEditEvents ||
      (calendarAccess.isAdminOrOwner && event.workspaceId === currentWorkspace?.id)
    );
    
    if (!canEdit) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to edit this event.',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedEvent(event);
    setIsViewEventOpen(false);
    setIsEditEventOpen(false);
    setShowEditEventPage(true);
  }, [user?.uid, toast, calendarAccess, currentWorkspace?.id]);

  // Report action handlers with permission checks
  const handleSubmitReport = useCallback((reportId: string) => {
    // Navigate to submit report page
    router.push(`/dashboard/reports/submit/${reportId}`);
  }, [router]);

  const handleViewReport = useCallback((reportId: string) => {
    // Navigate to view report page
    router.push(`/dashboard/reports/view/${reportId}`);
  }, [router]);

  const handleContinueReport = useCallback((reportId: string) => {
    // Navigate to continue editing report
    router.push(`/dashboard/reports/edit/${reportId}`);
  }, [router]);

  // Enhanced permission check for creating events
  const canCreateEvents = calendarAccess.canCreateEvents;
  const canManageSettings = calendarAccess.canManageSettings;
  const canViewReportDeadlines = calendarAccess.canViewReportDeadlines;

  // Show access denied message if user cannot access calendar
  if (!calendarAccess.canAccessCalendar) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-muted-foreground">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            You do not have permission to access the calendar.
          </p>
        </div>
      </div>
    );
  }

  // Show create event page if requested
  if (showCreateEventPage) {
    return (
      <CreateEventPage
        users={users}
        teams={teams}
        departments={departments}
        onCreateEvent={handleCreateEvent}
        onBack={() => setShowCreateEventPage(false)}
        permissions={stablePermissions}
      />
    );
  }

  // Show edit event page if requested
  if (showEditEventPage && selectedEvent) {
    return (
      <EditEventPage
        event={selectedEvent}
        users={users}
        teams={teams}
        departments={departments}
        onUpdateEvent={handleUpdateEvent}
        onBack={() => {
          setShowEditEventPage(false);
          setSelectedEvent(null);
        }}
        permissions={stablePermissions}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Calendar
          </h1>
          <p className="text-muted-foreground mt-1">Manage your schedule and upcoming events</p>
        </div>
        <div className="flex items-center space-x-3">
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
          
          <Button
            variant="outline"
            onClick={() => {
              const today = new Date();
              console.log('Today button clicked, navigating to:', today);
              setCurrentDate(today);
              // Also directly call the calendar method for immediate effect
              if (calendarViewRef.current) {
                calendarViewRef.current.gotoToday();
              }
            }}
            className="flex items-center space-x-2"
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Today</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(true)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          {canCreateEvents && (
            <Button 
              onClick={() => setShowCreateEventPage(true)}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          )}
        </div>
      </div>

      {/* Cross-workspace scope banner for owners */}
      {isOwner && showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
          <p className="text-sm text-green-700 dark:text-green-400">
            🌐 <strong>Cross-Workspace Calendar:</strong> Viewing calendar events across all {accessibleWorkspaces.length} accessible workspaces. Events and reports from all workspaces are displayed together for centralized management.
          </p>
        </div>
      )}

      {/* Role-based access banner */}
      {!canCreateEvents && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            📅 You can view calendar events. Contact an admin to create or manage events.
          </p>
        </div>
      )}

      {/* Calendar Statistics */}
      <CalendarStats stats={stats} />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Calendar View */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5" />
                  <span>Calendar View</span>
                  {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      🌐 {accessibleWorkspaces.length} Workspaces
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Tabs value={calendarView} onValueChange={(value) => setCalendarView(value as any)}>
                    <TabsList>
                      <TabsTrigger value="month">Month</TabsTrigger>
                      <TabsTrigger value="week">Week</TabsTrigger>
                      <TabsTrigger value="day">Day</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <CalendarView
                  ref={calendarViewRef}
                  events={filteredEvents}
                  view={calendarView}
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                  onEventClick={handleEventClick}
                  onEventDrop={canCreateEvents ? handleUpdateEvent : undefined}
                  canCreateEvents={canCreateEvents}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <UpcomingEvents
            workspaceId={currentWorkspace?.id || ''}
            userId={user?.uid || ''}
            onEventClick={handleEventClick}
            showAllWorkspaces={isOwner && showAllWorkspaces}
            accessibleWorkspaces={isOwner ? accessibleWorkspaces : undefined}
          />

          {/* Quick Actions */}
          {(permissions.canManageReports || isOwner) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setIsFiltersOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Calendar Settings
                </Button>
              </CardContent>
            </Card>
          )}

          {/* My Created Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  My Events
                </div>
                {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
                  <span className="text-xs text-muted-foreground">
                    🌐 All Workspaces
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const displayEvents = myEvents.slice(0, 5);
                
                if (displayEvents.length === 0) {
                  return (
                    <div className="text-center py-4">
                      <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No events created yet</p>
                      {canCreateEvents && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCreateEventPage(true)}
                          className="mt-2 text-xs"
                        >
                          Create your first event
                        </Button>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {displayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="group cursor-pointer p-2 rounded-md border border-border hover:border-primary/50 transition-all duration-200 hover:bg-accent/50"
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1.5 mb-1">
                              <span className="text-xs">
                                {event.type === 'meeting' ? '👥' :
                                 event.type === 'deadline' ? '⏰' :
                                 event.type === 'training' ? '📚' :
                                 event.type === 'review' ? '📋' :
                                 event.type === 'reminder' ? '🔔' :
                                 event.type === 'report' ? '📊' : '📅'}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs h-4 px-1 ${
                                  event.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  event.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  event.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {event.status}
                              </Badge>
                            </div>
                            
                            <h4 className="font-medium text-xs leading-tight mb-1 group-hover:text-primary transition-colors truncate">
                              {event.title}
                            </h4>
                            
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{new Date(event.start).toLocaleDateString()}</span>
                              {!event.allDay && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className={`w-2 h-2 rounded-full ml-2 flex-shrink-0 ${
                            event.priority === 'urgent' ? 'bg-red-500' :
                            event.priority === 'high' ? 'bg-orange-500' :
                            event.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                        </div>
                      </div>
                    ))}
                    
                    {myEvents.length > 5 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground text-center">
                          +{myEvents.length - 5} more events
                        </p>
                      </div>
                    )}
                    
                    {canCreateEvents && (
                      <div className="pt-2 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs text-muted-foreground hover:text-primary justify-center"
                          onClick={() => setShowCreateEventPage(true)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create New Event
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Report Deadline Statistics */}
      <ReportDeadlineStats 
        stats={reportStats} 
        onViewAllReports={() => router.push('/dashboard/reports')}
      />

      {/* Recent Reports Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Recent Reports</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1
                ? `Reports and deadlines across all ${accessibleWorkspaces.length} accessible workspaces`
                : 'Your recent reports and upcoming deadlines'
              }
            </p>
          </div>
        </div>
        <ReportCards
          reports={recentReports}
          onSubmit={handleSubmitReport}
          onView={handleViewReport}
          onContinue={handleContinueReport}
        />
      </div>

      {/* All Dialogs (excluding create event - now uses dedicated page) */}
      <EventDialogs
        isCreateEventOpen={false}
        setIsCreateEventOpen={stableSetCreateEventOpen}
        isEditEventOpen={isEditEventOpen}
        setIsEditEventOpen={setIsEditEventOpen}
        isViewEventOpen={isViewEventOpen}
        setIsViewEventOpen={setIsViewEventOpen}
        isFiltersOpen={isFiltersOpen}
        setIsFiltersOpen={setIsFiltersOpen}
        selectedEvent={selectedEvent}
        filters={filters}
        setFilters={setFilters}
        users={users}
        teams={teams}
        departments={departments}
        onCreateEvent={handleCreateEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        onEditEvent={handleEditEvent}
        canEditEvents={canCreateEvents}
        permissions={stablePermissions}
      />
    </div>
  );
} 