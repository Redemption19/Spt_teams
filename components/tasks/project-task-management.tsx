'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

import {
  Plus,
  Search,
  Folder,
  Target,
  List,
  BarChart3,
  Loader2,
  FileDown
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { TeamService } from '@/lib/team-service';
import { UserService } from '@/lib/user-service';
import { ProjectService } from '@/lib/project-service';
import { TaskService } from '@/lib/task-service';
import { Team, User as UserType, Project, Task } from '@/lib/types';
import { ExportService, ExportFormat } from '@/lib/export-service';
import { 
  useRolePermissions, 
  useCanCreateTasksInProject, 
  useCanCreateTasksInSpecificProject,
  useProjectRole,
  useProjectPermissions,
  useHasProjectPermission,
  useIsOwner
} from '@/lib/rbac-hooks';

// Import sub-components from their new paths
import ProjectCardGrid from './ProjectCardGrid';
import KanbanBoard from './KanbanBoard';
import TaskListView from './TaskListView';
import AnalyticsDashboard from './AnalyticsDashboard';
import CreateEditProjectDialog from './dialogs/CreateEditProjectDialog';
import CreateEditTaskDialog from './dialogs/CreateEditTaskDialog';
import DeleteProjectAlertDialog from './dialogs/DeleteProjectAlertDialog';
import DeleteTaskAlertDialog from './dialogs/DeleteTaskAlertDialog';

// Extended interfaces for UI display (kept here as they are used across multiple components)
export interface ProjectWithStats extends Project {
  taskCount: number;
  completedTasks: number;
  overdueTasks: number;
  teamMembers: number;
  progress: number;
}

export interface TaskWithDisplayInfo extends Task {
  assigneeName?: string;
  projectName?: string;
}

export const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

export const STATUS_COLORS = {
  planning: 'bg-gray-100 text-gray-700',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default function ProjectTaskManagement() {
  const { user, userProfile } = useAuth();
  const { currentWorkspace, userRole, accessibleWorkspaces } = useWorkspace();
  
  // Cross-workspace management state for owners
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);
  const isOwner = useIsOwner();

  // State management (moved before RBAC hooks that depend on them)
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [tasks, setTasks] = useState<TaskWithDisplayInfo[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ✅ ENHANCED RBAC - Permission hooks (after state is declared)
  const basePermissions = useRolePermissions();
  const canCreateTasksInAnyProject = useCanCreateTasksInProject(projects, user?.uid);

  // Form states
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<TaskWithDisplayInfo | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Delete confirmation states
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithDisplayInfo | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // List view states (for TaskListView)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'title' | 'priority' | 'status' | 'dueDate' | 'projectName' | 'assigneeName'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination states (for TaskListView)
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(10);

  // Export states
  const [isExporting, setIsExporting] = useState(false);

  // Form data for creation/editing
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    teamId: '',
    priority: 'medium' as Project['priority'],
    status: 'planning' as Project['status'],
  });

  const [taskForm, setTaskForm] = useState<{
    title: string;
    description: string;
    projectId: string;
    assigneeId: string | undefined;
    priority: Task['priority'];
    status: Task['status'];
    estimatedHours: string;
  }>({
    title: '',
    description: '',
    projectId: '',
    assigneeId: undefined,
    priority: 'medium',
    status: 'todo',
    estimatedHours: '',
  });

  // Load data with cross-workspace support
  const workspaceIds = accessibleWorkspaces?.map(w => w.id).join(',') || '';
  const loadData = useCallback(async () => {
    console.log('🔄 Tasks loadData started', { 
      workspaceId: currentWorkspace?.id, 
      userId: user?.uid,
      showAllWorkspaces,
      accessibleWorkspaces: accessibleWorkspaces?.length || 0
    });
    
    if (!currentWorkspace || !user) return;

    try {
      setLoading(true);
      
      // Determine workspace IDs to load from
      const workspaceIds = (isOwner && showAllWorkspaces && accessibleWorkspaces?.length) 
        ? accessibleWorkspaces.map(w => w.id)
        : [currentWorkspace.id];
      
      console.log('🏢 Loading from workspaces:', workspaceIds);

      // Load data from all relevant workspaces
      let allTeams: Team[] = [];
      let allUsers: UserType[] = [];
      let allProjects: Project[] = [];
      let allTasks: Task[] = [];
      
      for (const wsId of workspaceIds) {
        try {
          const [wsTeams, wsUsers, wsProjects, wsTasks] = await Promise.all([
            TeamService.getWorkspaceTeams(wsId),
            UserService.getUsersByWorkspace(wsId),
            ProjectService.getWorkspaceProjects(wsId),
            selectedProject 
              ? TaskService.getProjectTasks(selectedProject)
              : TaskService.getWorkspaceTasks(wsId)
          ]);
          
          // Aggregate teams (avoid duplicates)
          wsTeams.forEach(team => {
            if (!allTeams.some(t => t.id === team.id)) {
              allTeams.push(team);
            }
          });
          
          // Aggregate users (avoid duplicates)
          wsUsers.forEach(user => {
            if (!allUsers.some(u => u.id === user.id)) {
              allUsers.push(user);
            }
          });
          
          // Aggregate projects (avoid duplicates)
          wsProjects.forEach(project => {
            if (!allProjects.some(p => p.id === project.id)) {
              allProjects.push(project);
            }
          });
          
          // Aggregate tasks (avoid duplicates)
          wsTasks.forEach(task => {
            if (!allTasks.some(t => t.id === task.id)) {
              allTasks.push(task);
            }
          });
          
        } catch (wsError) {
          console.error(`Error loading data from workspace ${wsId}:`, wsError);
        }
      }

      setTeams(allTeams);
      setUsers(allUsers);

      const projectsWithStats: ProjectWithStats[] = await Promise.all(
        allProjects.map(async (project) => {
          // Use all tasks for stats calculation (tasks may come from different workspaces)
          const projectTasks = allTasks.filter(t => t.projectId === project.id);
          const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
          const overdueTasks = projectTasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'completed').length;
          const team = allTeams.find(t => t.id === project.teamId);
          const teamMembers = team ? allUsers.filter(u => u.teamIds.includes(team.id)).length : 0;
          const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;

          return {
            ...project,
            taskCount: projectTasks.length,
            completedTasks,
            overdueTasks,
            teamMembers,
            progress,
          };
        })
      );

      setProjects(projectsWithStats);

      const tasksWithDisplayInfo: TaskWithDisplayInfo[] = allTasks.map(task => {
        const assignee = task.assigneeId ? allUsers.find(u => u.id === task.assigneeId) : null;
        const project = allProjects.find(p => p.id === task.projectId);

        return {
          ...task,
          assigneeName: assignee ? assignee.name : undefined,
          projectName: project ? project.name : undefined,
        };
      });

      setTasks(tasksWithDisplayInfo);
      
      console.log('✅ Tasks data loaded successfully', {
        projects: projectsWithStats.length,
        tasks: tasksWithDisplayInfo.length,
        teams: allTeams.length,
        users: allUsers.length
      });

    } catch (error) {
      console.error('❌ Error loading project data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, user, isOwner, selectedProject, accessibleWorkspaces, showAllWorkspaces]);

  // Project Handlers
  const handleCreateProject = async () => {
    if (!currentWorkspace || !user) return;
    setSubmitting(true);
    try {
      if (!projectForm.name || !projectForm.teamId) throw new Error('Name and team are required');
      const projectData = {
        name: projectForm.name, description: projectForm.description, status: projectForm.status,
        priority: projectForm.priority, teamId: projectForm.teamId, workspaceId: currentWorkspace.id,
        mainWorkspaceId: currentWorkspace.id, subWorkspaceId: currentWorkspace.id,
        ownerId: user.uid, createdBy: user.uid, updatedBy: user.uid, tags: [],
        comments: [],
      };
      await ProjectService.createProject(projectData, user.uid);
      toast({ 
        title: 'Success', 
        description: 'Project created successfully',
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
      setIsCreateProjectOpen(false);
      setProjectForm({ name: '', description: '', teamId: '', priority: 'medium', status: 'planning' });
      await loadData();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to create project', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name, description: project.description || '',
      teamId: project.teamId, priority: project.priority, status: project.status,
    });
    setIsEditProjectOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!currentWorkspace || !user || !editingProject) return;
    setSubmitting(true);
    try {
      if (!projectForm.name || !projectForm.teamId) throw new Error('Name and team are required');
      const updates = {
        name: projectForm.name, description: projectForm.description,
        status: projectForm.status, priority: projectForm.priority, teamId: projectForm.teamId,
      };
      await ProjectService.updateProject(editingProject.id, updates, user.uid);
      toast({ 
        title: 'Success', 
        description: 'Project updated successfully',
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
      setIsEditProjectOpen(false);
      setEditingProject(null);
      setProjectForm({ name: '', description: '', teamId: '', priority: 'medium', status: 'planning' });
      await loadData();
    } catch (error) {
      console.error('Error updating project:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update project', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const initiateDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteProjectOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (!currentWorkspace || !user || !projectToDelete) return;
    setSubmitting(true);
    try {
      await ProjectService.deleteProject(projectToDelete.id, user.uid);
      toast({ 
        title: 'Success', 
        description: `Project "${projectToDelete.name}" and all associated tasks deleted successfully`,
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
      setIsDeleteProjectOpen(false);
      setProjectToDelete(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete project', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  // Task Handlers
  const handleCreateTask = async () => {
    if (!currentWorkspace || !user) return;
    
    // ✅ ENHANCED RBAC - Validate task creation permission for selected project
    const selectedProjectData = projects.find(p => p.id === taskForm.projectId);
    const canCreateInThisProject = selectedProjectData && (
      basePermissions.canCreateTasks || 
      selectedProjectData.ownerId === user.uid ||
      selectedProjectData.projectAdmins?.includes(user.uid) ||
      selectedProjectData.projectMembers?.includes(user.uid)
    );
    
    if (!canCreateInThisProject) {
      toast({ 
        title: 'Permission Denied', 
        description: 'You do not have permission to create tasks in this project. You must be a project member, admin, or owner.',
        variant: 'destructive' 
      });
      return;
    }

    setSubmitting(true);
    try {
      if (!taskForm.title || !taskForm.projectId) throw new Error('Title and project are required');
      const taskData = {
        title: taskForm.title, description: taskForm.description, projectId: taskForm.projectId,
        assigneeId: taskForm.assigneeId, status: taskForm.status, priority: taskForm.priority,
        workspaceId: currentWorkspace.id, mainWorkspaceId: currentWorkspace.id, subWorkspaceId: currentWorkspace.id,
        createdBy: user.uid, updatedBy: user.uid, tags: [],
        estimatedHours: taskForm.estimatedHours ? parseFloat(taskForm.estimatedHours) : undefined,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };
      await TaskService.createTask(taskData, user.uid);
      toast({ 
        title: 'Success', 
        description: 'Task created successfully',
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
      setIsCreateTaskOpen(false);
      setTaskForm({ 
        title: '', 
        description: '', 
        projectId: projects.length > 0 ? projects[0].id : '', 
        assigneeId: undefined, 
        priority: 'medium', 
        status: 'todo', 
        estimatedHours: '' 
      });
      await loadData();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to create task', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const handleEditTask = (task: TaskWithDisplayInfo) => {
    setViewingTask(task);
    setTaskForm({
      title: task.title, 
      description: task.description || '', 
      projectId: task.projectId || (projects.length > 0 ? projects[0].id : ''),
      assigneeId: task.assigneeId, 
      priority: task.priority, 
      status: task.status,
      estimatedHours: task.estimatedHours?.toString() || '',
    });
    setIsEditTaskOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!currentWorkspace || !user || !viewingTask) return;
    setSubmitting(true);
    try {
      if (!taskForm.title || !taskForm.projectId) throw new Error('Title and project are required');
      const updates = {
        title: taskForm.title, description: taskForm.description, projectId: taskForm.projectId,
        assigneeId: taskForm.assigneeId, status: taskForm.status, priority: taskForm.priority,
        estimatedHours: taskForm.estimatedHours ? parseFloat(taskForm.estimatedHours) : undefined,
      };
      await TaskService.updateTask(viewingTask.id, updates, user.uid);
      toast({ 
        title: 'Success', 
        description: 'Task updated successfully',
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
      setIsEditTaskOpen(false);
      setViewingTask(null);
      setTaskForm({ 
        title: '', 
        description: '', 
        projectId: projects.length > 0 ? projects[0].id : '', 
        assigneeId: undefined, 
        priority: 'medium', 
        status: 'todo', 
        estimatedHours: '' 
      });
      await loadData();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update task', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const initiateDeleteTask = (task: TaskWithDisplayInfo) => {
    setTaskToDelete(task);
    setIsDeleteTaskOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!currentWorkspace || !user || !taskToDelete) return;
    setSubmitting(true);
    try {
      await TaskService.deleteTask(taskToDelete.id, user.uid);
      if (viewingTask?.id === taskToDelete.id) { // Close detail view if the deleted task was open
        setViewingTask(null);
      }
      toast({ 
        title: 'Success', 
        description: `Task "${taskToDelete.title}" deleted successfully`,
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
      setIsDeleteTaskOpen(false);
      setTaskToDelete(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete task', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: Task['status']) => {
    if (!user) return;
    try {
      await TaskService.updateTaskStatus(taskId, newStatus, user.uid);
      const task = tasks.find(t => t.id === taskId);
      if (task?.projectId) await ProjectService.updateProjectProgress(task.projectId);
      await loadData();
      toast({ 
        title: 'Success', 
        description: 'Task status updated',
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({ title: 'Error', description: 'Failed to update task status', variant: 'destructive' });
    }
  };

  // Filter & Sort Logic (passed to TaskListView and KanbanBoard)
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue: any; let bValue: any;
    switch (sortField) {
      case 'title': aValue = a.title.toLowerCase(); bValue = b.title.toLowerCase(); break;
      case 'priority':
        const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'urgent': 4 };
        aValue = priorityOrder[a.priority]; bValue = priorityOrder[b.priority]; break;
      case 'status':
        const statusOrder = { 'todo': 1, 'in-progress': 2, 'review': 3, 'completed': 4 };
        aValue = statusOrder[a.status]; bValue = statusOrder[b.status]; break;
      case 'dueDate': aValue = a.dueDate ? a.dueDate.getTime() : 0; bValue = b.dueDate ? b.dueDate.getTime() : 0; break;
      case 'projectName': aValue = (a.projectName || '').toLowerCase(); bValue = (b.projectName || '').toLowerCase(); break;
      case 'assigneeName': aValue = (a.assigneeName || '').toLowerCase(); bValue = (b.assigneeName || '').toLowerCase(); break;
      default: return 0;
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations (for TaskListView)
  const totalTasks = sortedTasks.length;
  const totalPages = Math.ceil(totalTasks / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const paginatedTasks = sortedTasks.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priorityFilter, statusFilter, sortField, sortDirection]);

  // ✅ ENHANCED RBAC - Helper functions (moved hook logic to component level)
  const getProjectsWhereUserCanCreateTasks = () => {
    if (!user) return [];
    
    return projects.filter(project => {
      // Check if user is project member, admin, or owner
      return project.ownerId === user.uid ||
             project.projectAdmins?.includes(user.uid) ||
             project.projectMembers?.includes(user.uid);
    });
  };

  const canShowCreateTaskButton = () => {
    // Show if user has general permission OR can create tasks in at least one project
    return basePermissions.canCreateTasks || canCreateTasksInAnyProject;
  };

  const getCreateTaskButtonText = () => {
    if (basePermissions.canCreateTasks) {
      return 'Create Task'; // Admin/Owner
    } else if (canCreateTasksInAnyProject) {
      const accessibleProjects = getProjectsWhereUserCanCreateTasks();
      return `Create Task (${accessibleProjects.length} projects available)`;
    }
    return 'Create Task';
  };

  // Bulk Actions (for TaskListView)
  const handleBulkStatusUpdate = async (newStatus: Task['status']) => {
    if (selectedTasks.length === 0) return;
    setSubmitting(true);
    try {
      await Promise.all(selectedTasks.map(taskId => TaskService.updateTaskStatus(taskId, newStatus, user!.uid)));
      setSelectedTasks([]);
      toast({ 
        title: 'Success', 
        description: `Updated ${selectedTasks.length} task(s) to ${newStatus.replace('-', ' ')}`,
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
      await loadData();
    } catch (error) {
      console.error('Error bulk updating tasks:', error);
      toast({ title: 'Error', description: 'Failed to bulk update tasks', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedTasks.length} selected task(s)? This action cannot be undone.`)) return;
    setSubmitting(true);
    try {
      await Promise.all(selectedTasks.map(taskId => TaskService.deleteTask(taskId, user!.uid)));
      setSelectedTasks([]);
      toast({ 
        title: 'Success', 
        description: `Deleted ${selectedTasks.length} task(s) successfully`,
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
      await loadData();
    } catch (error) {
      console.error('Error bulk deleting tasks:', error);
      toast({ title: 'Error', description: 'Failed to bulk delete tasks', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const handleExportProjects = async (format: ExportFormat) => {
    if (!currentWorkspace || !user) return;
    setIsExporting(true);
    try {
      if (format === 'summary') {
        await ExportService.exportSummaryReport(projects, tasks, users, teams, 'pdf');
      } else {
        await ExportService.exportProjectsWithStats(projects, tasks, users, format);
      }
      toast({ 
        title: 'Export Successful', 
        description: `Projects exported as ${format.toUpperCase()}`,
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Export Failed', description: error instanceof Error ? error.message : 'Failed to export projects', variant: 'destructive' });
    } finally { setIsExporting(false); }
  };

  const handleExportTasks = async (format: ExportFormat) => {
    if (!currentWorkspace || !user) return;
    setIsExporting(true);
    try {
      const tasksToExport = searchTerm || priorityFilter !== 'all' || statusFilter !== 'all'
        ? filteredTasks
        : tasks;
      await ExportService.exportTasksWithDetails(tasksToExport, users, projects, format);
      toast({ 
        title: 'Export Successful', 
        description: `${tasksToExport.length} tasks exported as ${format.toUpperCase()}`,
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Export Failed', description: error instanceof Error ? error.message : 'Failed to export tasks', variant: 'destructive' });
    } finally { setIsExporting(false); }
  };

  const handleExportSelectedTasks = async (format: ExportFormat) => {
    if (selectedTasks.length === 0) {
      toast({ title: 'No Tasks Selected', description: 'Please select tasks to export', variant: 'destructive' });
      return;
    }
    setIsExporting(true);
    try {
      const tasksToExport = tasks.filter(task => selectedTasks.includes(task.id));
      await ExportService.exportTasksWithDetails(tasksToExport, users, projects, format);
      toast({ 
        title: 'Export Successful', 
        description: `${tasksToExport.length} selected tasks exported as ${format.toUpperCase()}`,
        className: 'bg-gradient-to-r from-primary to-accent text-white',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Export Failed', description: error instanceof Error ? error.message : 'Failed to export selected tasks', variant: 'destructive' });
    } finally { setIsExporting(false); }
  };

  useEffect(() => {
    if ((currentWorkspace?.id || userProfile?.isGuest) && user?.uid) {
      loadData();
    }
  }, [currentWorkspace?.id, user?.uid, userProfile?.isGuest, loadData]);

  // Helper: guest public access
  function isGuestWithPublicAccess() {
    return userProfile?.isGuest && currentWorkspace?.settings?.allowGuestAccess;
  }

  // Show all projects/tasks for owners in All Workspaces mode
  const showAll = isOwner && showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1;

  const visibleProjects = isGuestWithPublicAccess()
    ? projects
    : showAll
      ? projects
      : projects.filter(project => {
          return user && (
            project.ownerId === user.uid ||
            project.projectAdmins?.includes(user.uid) ||
            project.projectMembers?.includes(user.uid)
          );
        });

  const visibleTasks = isGuestWithPublicAccess()
    ? tasks
    : showAll
      ? tasks
      : tasks.filter(task => {
          return user && (
            task.assigneeId === user.uid ||
            (task.projectId ? (
              projects.find(p => p.id === task.projectId)?.ownerId === user.uid ||
              projects.find(p => p.id === task.projectId)?.projectAdmins?.includes(user.uid) ||
              projects.find(p => p.id === task.projectId)?.projectMembers?.includes(user.uid)
            ) : false)
          );
        });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Projects & Tasks
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1
                ? `Manage projects and track tasks across all ${accessibleWorkspaces.length} accessible workspaces with unified visual workflows and comprehensive analytics`
                : 'Manage your projects and track tasks with visual workflows and comprehensive analytics'
              }
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Folder className="h-4 w-4 text-primary" />
              <span>{visibleProjects.length} project{visibleProjects.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-primary" />
              <span>{visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>{visibleTasks.filter(t => t.status === 'completed').length} completed</span>
            </div>
          </div>
        </div>

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
          
          <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto h-11 sm:h-10 bg-gradient-to-r from-background to-accent/10 hover:from-accent/10 hover:to-accent/20 border-border/50">
                <Folder className="h-4 w-4 mr-2" />
                <span>New Project</span>
              </Button>
            </DialogTrigger>
            <CreateEditProjectDialog
              isOpen={isCreateProjectOpen}
              setIsOpen={setIsCreateProjectOpen}
              projectForm={projectForm}
              setProjectForm={setProjectForm}
              teams={teams}
              onSubmit={handleCreateProject}
              submitting={submitting}
              isEdit={false}
            />
          </Dialog>
          
          {/* ✅ ENHANCED RBAC - Conditionally render create task button */}
          {canShowCreateTaskButton() && (
            <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto h-11 sm:h-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>{getCreateTaskButtonText()}</span>
                </Button>
              </DialogTrigger>
              <CreateEditTaskDialog
                isOpen={isCreateTaskOpen}
                setIsOpen={setIsCreateTaskOpen}
                taskForm={taskForm}
                setTaskForm={setTaskForm}
                projects={getProjectsWhereUserCanCreateTasks()}
                users={users}
                onSubmit={handleCreateTask}
                submitting={submitting}
                isEdit={false}
              />
            </Dialog>
          )}

          {/* ✅ ENHANCED RBAC - Show helpful message for users without permission */}
          {!canShowCreateTaskButton() && (
            <div className="w-full sm:w-auto h-11 sm:h-10 flex items-center justify-center px-4 py-2 bg-muted/50 border border-border/50 rounded-md">
              <span className="text-sm text-muted-foreground">
                Contact admin to join projects for task creation
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cross-workspace scope banner for owners */}
      {isOwner && showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && (
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
          <p className="text-sm text-green-700 dark:text-green-400">
            🌐 <strong>Cross-Workspace Tasks:</strong> Displaying projects and tasks across all {accessibleWorkspaces.length} accessible workspaces. Projects, tasks, teams, and analytics from all workspaces are aggregated for centralized management.
          </p>
        </div>
      )}

      {/* Tabs and Filters Section */}
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col space-y-6 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:space-x-8">
            <TabsList className="grid w-full grid-cols-4 lg:w-fit">
              <TabsTrigger value="projects" className="text-xs sm:text-sm">
                <Folder className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  Projects ({visibleProjects.length})
                  {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && ' 🌐'}
                </span>
                <span className="sm:hidden">
                  Projects{showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 ? ' 🌐' : ''}
                </span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="text-xs sm:text-sm">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  Kanban Board{showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && ' 🌐'}
                </span>
                <span className="sm:hidden">
                  Kanban{showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 ? ' 🌐' : ''}
                </span>
              </TabsTrigger>
              <TabsTrigger value="list" className="text-xs sm:text-sm">
                <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  List View ({visibleTasks.length})
                  {showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && ' 🌐'}
                </span>
                <span className="sm:hidden">
                  List{showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 ? ' 🌐' : ''}
                </span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  Analytics{showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 && ' 🌐'}
                </span>
                <span className="sm:hidden">
                  Analytics{showAllWorkspaces && accessibleWorkspaces && accessibleWorkspaces.length > 1 ? ' 🌐' : ''}
                </span>
              </TabsTrigger>
            </TabsList>

            <div className="space-y-3 sm:space-y-0">
              <div className="relative w-full sm:hidden">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search projects & tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 pl-10 border-border/50 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                <div className="hidden sm:block relative lg:col-span-2 xl:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search projects & tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 pl-10 border-border/50 focus:border-primary"
                  />
                </div>
                
                <div className="sm:col-span-1">
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="h-11 sm:h-10 w-full">
                      <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-11 sm:h-10 w-full">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full h-11 sm:h-10 border-border/50" disabled={isExporting}>
                        {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                        <span>Export</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => handleExportProjects('csv')}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export Projects (CSV)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportProjects('excel')}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export Projects (Excel)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportTasks('csv')}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export Tasks (CSV)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportTasks('excel')}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export Tasks (Excel)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportTasks('pdf')}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export Tasks (PDF)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportProjects('summary' as ExportFormat)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Summary Report (PDF)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          <TabsContent value="projects" className="mt-6">
            <ProjectCardGrid
              projects={visibleProjects}
              setSelectedProject={setSelectedProject}
              setActiveTab={setActiveTab}
              handleEditProject={handleEditProject}
              initiateDeleteProject={initiateDeleteProject}
            />
          </TabsContent>

          <TabsContent value="kanban" className="mt-6">
            <KanbanBoard
              tasks={filteredTasks}
              projects={projects}
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              loadData={loadData}
              handleTaskStatusChange={handleTaskStatusChange}
              initiateDeleteTask={initiateDeleteTask}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <TaskListView
              paginatedTasks={paginatedTasks}
              totalTasks={totalTasks}
              currentPage={currentPage}
              totalPages={totalPages}
              tasksPerPage={tasksPerPage}
              selectedTasks={selectedTasks}
              setTasksPerPage={(value) => setTasksPerPage(value)}
              handlePageChange={(page) => setCurrentPage(page)}
              handleSort={setSortField}
              sortField={sortField}
              sortDirection={sortDirection}
              handleTaskSelect={(id) => setSelectedTasks(prev => prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id])}
              handleSelectAllTasks={() => {
                const currentPageTaskIds = paginatedTasks.map(task => task.id);
                const allCurrentPageSelected = currentPageTaskIds.every(id => selectedTasks.includes(id));
                if (allCurrentPageSelected) {
                  setSelectedTasks(prev => prev.filter(id => !currentPageTaskIds.includes(id)));
                } else {
                  setSelectedTasks(prev => Array.from(new Set([...prev, ...currentPageTaskIds])));
                }
              }}
              handleBulkStatusUpdate={handleBulkStatusUpdate}
              handleBulkDelete={handleBulkDelete}
              handleExportSelectedTasks={handleExportSelectedTasks}
              isExporting={isExporting}
              handleTaskStatusChange={handleTaskStatusChange}
              handleEditTask={handleEditTask}
              initiateDeleteTask={initiateDeleteTask}
              searchTerm={searchTerm}
              priorityFilter={priorityFilter}
              statusFilter={statusFilter}
              setIsCreateTaskOpen={setIsCreateTaskOpen}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard
              projects={projects}
              tasks={tasks}
              handleExportProjects={handleExportProjects}
              handleExportTasks={handleExportTasks}
              isExporting={isExporting}
            />
          </TabsContent>
        </Tabs>
      </div>

      <CreateEditProjectDialog
        isOpen={isEditProjectOpen}
        setIsOpen={setIsEditProjectOpen}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        teams={teams}
        onSubmit={handleUpdateProject}
        submitting={submitting}
        isEdit={true}
      />

      <CreateEditTaskDialog
        isOpen={isEditTaskOpen}
        setIsOpen={setIsEditTaskOpen}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        projects={projects}
        users={users}
        onSubmit={handleUpdateTask}
        submitting={submitting}
        isEdit={true}
        editingTask={viewingTask}
      />

      <DeleteProjectAlertDialog
        isOpen={isDeleteProjectOpen}
        setIsOpen={setIsDeleteProjectOpen}
        projectToDelete={projectToDelete}
        tasks={tasks}
        confirmDelete={confirmDeleteProject}
        isSubmitting={submitting}
      />

      <DeleteTaskAlertDialog
        isOpen={isDeleteTaskOpen}
        setIsOpen={setIsDeleteTaskOpen}
        taskToDelete={taskToDelete}
        confirmDelete={confirmDeleteTask}
        isSubmitting={submitting}
      />
    </div>
  );
} 