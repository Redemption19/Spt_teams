'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ExportService, ExportFormat } from '@/lib/export-service';
import { toast } from '@/hooks/use-toast';

import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  Timer,
  Target,
  Users,
  Folder,
  MoreHorizontal,
  Edit,
  Trash2,
  MessageSquare,
  Paperclip,
  Flag,
  ArrowRight,
  BarChart3,
  Loader2,
  Eye,
  TrendingUp,
  Activity,
  List,
  ArrowUpDown,
  Filter,
  Download,
  MoreVertical,
  FileDown
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { TeamService } from '@/lib/team-service';
import { UserService } from '@/lib/user-service';
import { ProjectService } from '@/lib/project-service';
import { TaskService } from '@/lib/task-service';
import { Team, User as UserType, Project, Task } from '@/lib/types';
import { format as formatDate } from 'date-fns';

// Extended interfaces for UI display
interface ProjectWithStats extends Project {
  taskCount: number;
  completedTasks: number;
  overdueTasks: number;
  teamMembers: number;
}

interface TaskWithDisplayInfo extends Task {
  assigneeName?: string;
  projectName?: string;
}

const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_COLORS = {
  planning: 'bg-gray-100 text-gray-700',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default function ProjectTaskManagement() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  // State management
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [tasks, setTasks] = useState<TaskWithDisplayInfo[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithDisplayInfo | null>(null);
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

  // List view states
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'title' | 'priority' | 'status' | 'dueDate' | 'projectName' | 'assigneeName'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(10);

  // Export states
  const [isExporting, setIsExporting] = useState(false);

  // Form data
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



  // Kanban columns
  const kanbanColumns = [
    {
      id: 'todo' as const,
      title: 'To Do',
      color: 'bg-gray-50 border-gray-200',
      icon: Circle,
      tasks: tasks.filter(task => task.status === 'todo'),
    },
    {
      id: 'in-progress' as const,
      title: 'In Progress',
      color: 'bg-blue-50 border-blue-200',
      icon: Timer,
      tasks: tasks.filter(task => task.status === 'in-progress'),
    },
    {
      id: 'review' as const,
      title: 'Review',
      color: 'bg-yellow-50 border-yellow-200',
      icon: Eye,
      tasks: tasks.filter(task => task.status === 'review'),
    },
    {
      id: 'completed' as const,
      title: 'Completed',
      color: 'bg-green-50 border-green-200',
      icon: CheckCircle2,
      tasks: tasks.filter(task => task.status === 'completed'),
    },
  ];

  // Load data
  const loadData = useCallback(async () => {
    if (!currentWorkspace || !user) return;

    try {
      setLoading(true);
      
      // Load teams, users, and projects
      const [teamsData, usersData, projectsData] = await Promise.all([
        TeamService.getWorkspaceTeams(currentWorkspace.id),
        UserService.getUsersByWorkspace(currentWorkspace.id),
        ProjectService.getWorkspaceProjects(currentWorkspace.id),
      ]);

      setTeams(teamsData);
      setUsers(usersData);
      
      // Transform projects to include stats
      const projectsWithStats: ProjectWithStats[] = await Promise.all(
        projectsData.map(async (project) => {
          const projectTasks = await TaskService.getProjectTasks(project.id);
          const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
          const overdueTasks = projectTasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'completed').length;
          const team = teamsData.find(t => t.id === project.teamId);
          const teamMembers = team ? usersData.filter(u => u.teamIds.includes(team.id)).length : 0;
          
          return {
            ...project,
            taskCount: projectTasks.length,
            completedTasks,
            overdueTasks,
            teamMembers,
          };
        })
      );
      
      setProjects(projectsWithStats);
      
      // Load tasks based on selected project or all workspace tasks
      const tasksData = selectedProject 
        ? await TaskService.getProjectTasks(selectedProject)
        : await TaskService.getWorkspaceTasks(currentWorkspace.id);
      
      // Transform tasks to include display info
      const tasksWithDisplayInfo: TaskWithDisplayInfo[] = tasksData.map(task => {
        const assignee = task.assigneeId ? usersData.find(u => u.id === task.assigneeId) : null;
        const project = projectsData.find(p => p.id === task.projectId);
        
        return {
          ...task,
          assigneeName: assignee ? assignee.name : undefined,
          projectName: project ? project.name : undefined,
        };
      });
      
      setTasks(tasksWithDisplayInfo);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, user, selectedProject]);

  // Create project
  const handleCreateProject = async () => {
    if (!currentWorkspace || !user) return;

    try {
      setSubmitting(true);

      if (!projectForm.name || !projectForm.teamId) {
        throw new Error('Name and team are required');
      }

      // Create project in database
      const projectData = {
        name: projectForm.name,
        description: projectForm.description,
        status: projectForm.status,
        priority: projectForm.priority,
        teamId: projectForm.teamId,
        workspaceId: currentWorkspace.id,
        ownerId: user.uid,
        tags: [],
      };

      const projectId = await ProjectService.createProject(projectData, user.uid);

      toast({
        title: 'Success',
        description: 'Project created successfully',
      });

      setIsCreateProjectOpen(false);
      setProjectForm({
        name: '',
        description: '',
        teamId: '',
        priority: 'medium',
        status: 'planning',
      });

      // Reload data to show the new project
      await loadData();

    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Edit project
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || '',
      teamId: project.teamId,
      priority: project.priority,
      status: project.status,
    });
    setIsEditProjectOpen(true);
  };

  // Update project
  const handleUpdateProject = async () => {
    if (!currentWorkspace || !user || !editingProject) return;

    try {
      setSubmitting(true);

      if (!projectForm.name || !projectForm.teamId) {
        throw new Error('Name and team are required');
      }

      // Update project in database
      const updates = {
        name: projectForm.name,
        description: projectForm.description,
        status: projectForm.status,
        priority: projectForm.priority,
        teamId: projectForm.teamId,
      };

      await ProjectService.updateProject(editingProject.id, updates, user.uid);

      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });

      setIsEditProjectOpen(false);
      setEditingProject(null);
      setProjectForm({
        name: '',
        description: '',
        teamId: '',
        priority: 'medium',
        status: 'planning',
      });

      // Reload data to show the updated project
      await loadData();

    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update project',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Edit task
  const handleEditTask = (task: TaskWithDisplayInfo) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      projectId: task.projectId,
      assigneeId: task.assigneeId,
      priority: task.priority,
      status: task.status,
      estimatedHours: task.estimatedHours?.toString() || '',
    });
    setIsTaskDetailOpen(false);
    setIsEditTaskOpen(true);
  };

  // Initiate project deletion
  const initiateDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteProjectOpen(true);
  };

  // Confirm project deletion
  const confirmDeleteProject = async () => {
    if (!currentWorkspace || !user || !projectToDelete) return;

    try {
      setSubmitting(true);

      // Delete project from database (this will also delete associated tasks)
      await ProjectService.deleteProject(projectToDelete.id, user.uid);

      toast({
        title: 'Success',
        description: `Project "${projectToDelete.name}" and all associated tasks deleted successfully`,
      });

      // Reset state
      setIsDeleteProjectOpen(false);
      setProjectToDelete(null);

      // Reload data to reflect the deletion
      await loadData();

    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete project',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Initiate task deletion
  const initiateDeleteTask = (task: TaskWithDisplayInfo) => {
    setTaskToDelete(task);
    setIsDeleteTaskOpen(true);
  };

  // Confirm task deletion
  const confirmDeleteTask = async () => {
    if (!currentWorkspace || !user || !taskToDelete) return;

    try {
      setSubmitting(true);

      // Delete task from database
      await TaskService.deleteTask(taskToDelete.id, user.uid);

      // Close task detail dialog if it's open
      if (selectedTask?.id === taskToDelete.id) {
        setIsTaskDetailOpen(false);
        setSelectedTask(null);
      }

      toast({
        title: 'Success',
        description: `Task "${taskToDelete.title}" deleted successfully`,
      });

      // Reset state
      setIsDeleteTaskOpen(false);
      setTaskToDelete(null);

      // Reload data to reflect the deletion
      await loadData();

    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete task',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Update task
  const handleUpdateTask = async () => {
    if (!currentWorkspace || !user || !selectedTask) return;

    try {
      setSubmitting(true);

      if (!taskForm.title || !taskForm.projectId) {
        throw new Error('Title and project are required');
      }

      // Update task in database
      const updates = {
        title: taskForm.title,
        description: taskForm.description,
        projectId: taskForm.projectId,
        assigneeId: taskForm.assigneeId,
        status: taskForm.status,
        priority: taskForm.priority,
        estimatedHours: taskForm.estimatedHours ? parseFloat(taskForm.estimatedHours) : undefined,
      };

      await TaskService.updateTask(selectedTask.id, updates, user.uid);

      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });

      setIsEditTaskOpen(false);
      setSelectedTask(null);
      setTaskForm({
        title: '',
        description: '',
        projectId: '',
        assigneeId: undefined,
        priority: 'medium',
        status: 'todo',
        estimatedHours: '',
      });

      // Reload data to show the updated task
      await loadData();

    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update task',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Create task
  const handleCreateTask = async () => {
    if (!currentWorkspace || !user) return;

    try {
      setSubmitting(true);

      if (!taskForm.title || !taskForm.projectId) {
        throw new Error('Title and project are required');
      }

      // Create task in database
      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        projectId: taskForm.projectId,
        assigneeId: taskForm.assigneeId,
        status: taskForm.status,
        priority: taskForm.priority,
        workspaceId: currentWorkspace.id,
        tags: [],
        estimatedHours: taskForm.estimatedHours ? parseFloat(taskForm.estimatedHours) : undefined,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };

      const taskId = await TaskService.createTask(taskData, user.uid);

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });

      setIsCreateTaskOpen(false);
      setTaskForm({
        title: '',
        description: '',
        projectId: '',
        assigneeId: undefined,
        priority: 'medium',
        status: 'todo',
        estimatedHours: '',
      });

      // Reload data to show the new task
      await loadData();

    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create task',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle task status change
  const handleTaskStatusChange = async (taskId: string, newStatus: Task['status']) => {
    if (!user) return;
    
    try {
      // Update task status in database
      await TaskService.updateTaskStatus(taskId, newStatus, user.uid);
      
      // Update project progress
      const task = tasks.find(t => t.id === taskId);
      if (task?.projectId) {
        await ProjectService.updateProjectProgress(task.projectId);
      }
      
      // Reload data to reflect the changes
      await loadData();
      
      toast({
        title: 'Success',
        description: 'Task status updated',
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Sort tasks for list view
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'priority':
        const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'urgent': 4 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      case 'status':
        const statusOrder = { 'todo': 1, 'in-progress': 2, 'review': 3, 'completed': 4 };
        aValue = statusOrder[a.status];
        bValue = statusOrder[b.status];
        break;
      case 'dueDate':
        aValue = a.dueDate ? a.dueDate.getTime() : 0;
        bValue = b.dueDate ? b.dueDate.getTime() : 0;
        break;
      case 'projectName':
        aValue = (a.projectName || '').toLowerCase();
        bValue = (b.projectName || '').toLowerCase();
        break;
      case 'assigneeName':
        aValue = (a.assigneeName || '').toLowerCase();
        bValue = (b.assigneeName || '').toLowerCase();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const totalTasks = sortedTasks.length;
  const totalPages = Math.ceil(totalTasks / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const paginatedTasks = sortedTasks.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priorityFilter, statusFilter, sortField, sortDirection]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTasksPerPageChange = (value: string) => {
    setTasksPerPage(Number(value));
    setCurrentPage(1);
  };

  // Handle sorting
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle task selection
  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Handle select all tasks (current page only)
  const handleSelectAllTasks = () => {
    const currentPageTaskIds = paginatedTasks.map(task => task.id);
    const allCurrentPageSelected = currentPageTaskIds.every(id => selectedTasks.includes(id));
    
    if (allCurrentPageSelected) {
      // Deselect all tasks on current page
      setSelectedTasks(prev => prev.filter(id => !currentPageTaskIds.includes(id)));
    } else {
      // Select all tasks on current page
      setSelectedTasks(prev => Array.from(new Set([...prev, ...currentPageTaskIds])));
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus: Task['status']) => {
    if (selectedTasks.length === 0) return;

    try {
      setSubmitting(true);
      
      // Update selected tasks
      setTasks(prev => prev.map(task => 
        selectedTasks.includes(task.id) 
          ? { ...task, status: newStatus }
          : task
      ));

      // Update project progress for affected projects
      const affectedProjects = new Set(
        tasks.filter(task => selectedTasks.includes(task.id)).map(task => task.projectId)
      );

      Array.from(affectedProjects).forEach(projectId => {
        const projectTasks = tasks.filter(t => t.projectId === projectId);
        const completedCount = projectTasks.filter(t => 
          selectedTasks.includes(t.id) 
            ? newStatus === 'completed'
            : t.status === 'completed'
        ).length;
        const progress = Math.round((completedCount / projectTasks.length) * 100);
        
        setProjects(prev => prev.map(p => 
          p.id === projectId 
            ? { ...p, progress, completedTasks: completedCount }
            : p
        ));
      });

      setSelectedTasks([]);
      
      toast({
        title: 'Success',
        description: `Updated ${selectedTasks.length} task(s) to ${newStatus.replace('-', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tasks',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedTasks.length} selected task(s)? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    try {
      setSubmitting(true);

      // Remove selected tasks
      setTasks(prev => prev.filter(task => !selectedTasks.includes(task.id)));
      
      // Update project task counts
      const affectedProjects = new Set(
        tasks.filter(task => selectedTasks.includes(task.id)).map(task => task.projectId)
      );

      Array.from(affectedProjects).forEach(projectId => {
        const deletedTasksCount = tasks.filter(task => 
          selectedTasks.includes(task.id) && task.projectId === projectId
        ).length;
        const deletedCompletedCount = tasks.filter(task => 
          selectedTasks.includes(task.id) && task.projectId === projectId && task.status === 'completed'
        ).length;

        setProjects(prev => prev.map(p => 
          p.id === projectId 
            ? { 
                ...p, 
                taskCount: p.taskCount - deletedTasksCount,
                completedTasks: p.completedTasks - deletedCompletedCount
              }
            : p
        ));
      });

      setSelectedTasks([]);
      
      toast({
        title: 'Success',
        description: `Deleted ${selectedTasks.length} task(s) successfully`,
      });
    } catch (error) {
      console.error('Error deleting tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete tasks',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Update kanban columns with filtered tasks
  const filteredKanbanColumns = kanbanColumns.map(column => ({
    ...column,
    tasks: filteredTasks.filter(task => task.status === column.id),
  }));

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Export handlers
  const handleExportProjects = async (format: ExportFormat) => {
    if (!currentWorkspace || !user) return;

    try {
      setIsExporting(true);
      
      if (format === 'summary') {
        await ExportService.exportSummaryReport(projects, tasks, users, teams, 'pdf');
      } else {
        await ExportService.exportProjectsWithStats(projects, tasks, users, format);
      }

      toast({
        title: 'Export Successful',
        description: `Projects exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export projects',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTasks = async (format: ExportFormat) => {
    if (!currentWorkspace || !user) return;

    try {
      setIsExporting(true);
      
      const tasksToExport = searchTerm || priorityFilter !== 'all' || statusFilter !== 'all' 
        ? filteredTasks 
        : tasks;

      await ExportService.exportTasksWithDetails(tasksToExport, users, projects, format);

      toast({
        title: 'Export Successful',
        description: `${tasksToExport.length} tasks exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export tasks',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSelectedTasks = async (format: ExportFormat) => {
    if (selectedTasks.length === 0) {
      toast({
        title: 'No Tasks Selected',
        description: 'Please select tasks to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsExporting(true);
      
      const tasksToExport = tasks.filter(task => selectedTasks.includes(task.id));
      await ExportService.exportTasksWithDetails(tasksToExport, users, projects, format);

      toast({
        title: 'Export Successful',
        description: `${tasksToExport.length} selected tasks exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export selected tasks',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Projects & Tasks
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your projects and track tasks with visual workflows
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Folder className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Project</span>
                <span className="sm:hidden">Project</span>
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Task</span>
                <span className="sm:hidden">Task</span>
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col space-y-6 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:space-x-8 mb-6 md:mb-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="projects" className="text-xs sm:text-sm">
              <Folder className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Projects ({projects.length})</span>
              <span className="sm:hidden">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="text-xs sm:text-sm">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Kanban Board</span>
              <span className="sm:hidden">Kanban</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs sm:text-sm">
              <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">List View ({tasks.length})</span>
              <span className="sm:hidden">List</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Search and Filters */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 lg:space-x-4 mt-4 lg:mt-0">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-48 lg:w-64"
              />
            </div>

            <div className="flex space-x-2 sm:space-x-3">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-28 lg:w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-28 lg:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isExporting}>
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4 mr-2" />
                    )}
                    <span className="hidden sm:inline">Export</span>
                    <span className="sm:hidden">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-0">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg line-clamp-2">{project.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`text-xs ${PRIORITY_COLORS[project.priority]}`}>
                          {project.priority}
                        </Badge>
                        <Badge className={`text-xs ${STATUS_COLORS[project.status]}`}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0 ml-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditProject(project)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedProject(project.id);
                            setActiveTab('kanban');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Tasks
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => initiateDeleteProject(project)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {project.description || 'No description available'}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                        <span className="truncate">{project.completedTasks}/{project.taskCount} tasks</span>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                        <span>{project.teamMembers} members</span>
                      </div>
                    </div>
                    {project.overdueTasks > 0 && (
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                        <span className="text-red-600">{project.overdueTasks} overdue</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-muted-foreground">
                      <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {project.dueDate ? formatDate(project.dueDate, 'MMM dd, yyyy') : 'No due date'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm w-full sm:w-auto"
                      onClick={() => {
                        setSelectedProject(project.id);
                        setActiveTab('kanban');
                      }}
                    >
                      <span className="sm:hidden">View</span>
                      <span className="hidden sm:inline">View Tasks</span>
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Kanban Board Tab */}
        <TabsContent value="kanban" className="mt-0">
          <div className="mb-4 flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Select
                value={selectedProject || 'all'}
                onValueChange={(value) => {
                  setSelectedProject(value === 'all' ? null : value);
                  loadData();
                }}
              >
                <SelectTrigger className="w-full sm:w-48 lg:w-64">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{filteredTasks.length} tasks</span>
            </div>
          </div>

          {/* Mobile Kanban - Stacked */}
          <div className="block lg:hidden">
            <div className="space-y-4">
              {filteredKanbanColumns.map((column) => (
                <div key={column.id} className={`rounded-lg border p-3 ${column.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <column.icon className="h-4 w-4" />
                      <h3 className="font-semibold text-sm">{column.title}</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {column.tasks.length}
                    </Badge>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {column.tasks.map((task) => (
                      <Card
                        key={task.id}
                        className="cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => {
                          setSelectedTask(task);
                          setIsTaskDetailOpen(true);
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>

                            <div className="flex items-center justify-between">
                              <Badge className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                                {task.priority}
                              </Badge>
                              {task.assigneeName && (
                                <div className="flex items-center space-x-1">
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-xs">
                                      {task.assigneeName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground truncate max-w-20">
                                    {task.assigneeName}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {task.dueDate && (
                                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                    <CalendarIcon className="h-3 w-3" />
                                    <span>{formatDate(task.dueDate, 'MMM dd')}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <div className="flex space-x-1">
                                  {['todo', 'in-progress', 'review', 'completed'].map((status) => (
                                    <Button
                                      key={status}
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTaskStatusChange(task.id, status as Task['status']);
                                      }}
                                    >
                                      <div className={`h-1.5 w-1.5 rounded-full ${
                                        task.status === status ? 'bg-primary' : 'bg-muted'
                                      }`} />
                                    </Button>
                                  ))}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    initiateDeleteTask(task);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Kanban - Side by Side */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-4 xl:gap-6">
            {filteredKanbanColumns.map((column) => (
              <div key={column.id} className={`rounded-lg border p-4 ${column.color}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <column.icon className="h-4 w-4" />
                    <h3 className="font-semibold text-sm xl:text-base">{column.title}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {column.tasks.length}
                  </Badge>
                </div>

                <ScrollArea className="h-[500px] xl:h-[600px]">
                  <div className="space-y-3">
                    {column.tasks.map((task) => (
                      <Card
                        key={task.id}
                        className="cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => {
                          setSelectedTask(task);
                          setIsTaskDetailOpen(true);
                        }}
                      >
                        <CardContent className="p-3 xl:p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                            </div>

                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between">
                              <Badge className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                                {task.priority}
                              </Badge>
                              {task.assigneeName && (
                                <div className="flex items-center space-x-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-xs">
                                      {task.assigneeName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground truncate max-w-16 xl:max-w-20">
                                    {task.assigneeName}
                                  </span>
                                </div>
                              )}
                            </div>

                            {task.dueDate && (
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{formatDate(task.dueDate, 'MMM dd')}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {task.comments && task.comments.length > 0 && (
                                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{task.comments.length}</span>
                                  </div>
                                )}
                                {task.attachments && task.attachments.length > 0 && (
                                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                    <Paperclip className="h-3 w-3" />
                                    <span>{task.attachments.length}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <div className="flex space-x-1">
                                  {['todo', 'in-progress', 'review', 'completed'].map((status) => (
                                    <Button
                                      key={status}
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTaskStatusChange(task.id, status as Task['status']);
                                      }}
                                    >
                                      <div className={`h-2 w-2 rounded-full ${
                                        task.status === status ? 'bg-primary' : 'bg-muted'
                                      }`} />
                                    </Button>
                                  ))}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    initiateDeleteTask(task);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* List View Tab */}
        <TabsContent value="list" className="mt-0">
          {/* List View Header with Bulk Actions */}
          {selectedTasks.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedTasks.length} task(s) selected
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select onValueChange={handleBulkStatusUpdate}>
                    <SelectTrigger className="w-auto h-8 text-xs">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleBulkDelete}
                    className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedTasks([])}
                    className="h-8 text-xs"
                  >
                    Clear
                  </Button>
                  
                  {/* Export Selected Tasks */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs" disabled={isExporting}>
                        {isExporting ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <FileDown className="h-3 w-3 mr-1" />
                        )}
                        Export Selected
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExportSelectedTasks('csv')}>
                        <FileDown className="h-3 w-3 mr-2" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportSelectedTasks('excel')}>
                        <FileDown className="h-3 w-3 mr-2" />
                        Export as Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportSelectedTasks('pdf')}>
                        <FileDown className="h-3 w-3 mr-2" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportSelectedTasks('json')}>
                        <FileDown className="h-3 w-3 mr-2" />
                        Export as JSON
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={paginatedTasks.length > 0 && paginatedTasks.every(task => selectedTasks.includes(task.id))}
                        onCheckedChange={handleSelectAllTasks}
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/80" onClick={() => handleSort('title')}>
                      <div className="flex items-center space-x-1">
                        <span>Task</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/80" onClick={() => handleSort('projectName')}>
                      <div className="flex items-center space-x-1">
                        <span>Project</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/80" onClick={() => handleSort('assigneeName')}>
                      <div className="flex items-center space-x-1">
                        <span>Assignee</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/80" onClick={() => handleSort('status')}>
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/80" onClick={() => handleSort('priority')}>
                      <div className="flex items-center space-x-1">
                        <span>Priority</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/80" onClick={() => handleSort('dueDate')}>
                      <div className="flex items-center space-x-1">
                        <span>Due Date</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Est. Hours</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTasks.map((task) => (
                    <TableRow key={task.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={() => handleTaskSelect(task.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div 
                            className="font-medium cursor-pointer hover:text-primary line-clamp-1"
                            onClick={() => {
                              setSelectedTask(task);
                              setIsTaskDetailOpen(true);
                            }}
                          >
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {task.description}
                            </div>
                          )}
                          {task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                  {tag}
                                </Badge>
                              ))}
                              {task.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  +{task.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{task.projectName}</div>
                      </TableCell>
                      <TableCell>
                        {task.assigneeName ? (
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {task.assigneeName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{task.assigneeName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={task.status}
                          onValueChange={(value: Task['status']) => handleTaskStatusChange(task.id, value)}
                        >
                          <SelectTrigger className="w-auto h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.dueDate ? (
                          <div className={`text-sm ${
                            task.dueDate < new Date() && task.status !== 'completed'
                              ? 'text-red-600 font-medium'
                              : 'text-muted-foreground'
                          }`}>
                            {formatDate(task.dueDate, 'MMM dd, yyyy')}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.estimatedHours ? (
                          <span className="text-sm">{task.estimatedHours}h</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedTask(task);
                              setIsTaskDetailOpen(true);
                            }}>
                              <Eye className="h-3 w-3 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTask(task)}>
                              <Edit className="h-3 w-3 mr-2" />
                              Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => initiateDeleteTask(task)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {paginatedTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <Checkbox
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={() => handleTaskSelect(task.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 
                            className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-primary"
                            onClick={() => {
                              setSelectedTask(task);
                              setIsTaskDetailOpen(true);
                            }}
                          >
                            {task.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">{task.projectName}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedTask(task);
                            setIsTaskDetailOpen(true);
                          }}>
                            <Eye className="h-3 w-3 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTask(task)}>
                            <Edit className="h-3 w-3 mr-2" />
                            Edit Task
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => initiateDeleteTask(task)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Assignee:</span>
                        <div className="mt-1">
                          {task.assigneeName ? (
                            <div className="flex items-center space-x-1">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-xs">
                                  {task.assigneeName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{task.assigneeName}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Due Date:</span>
                        <div className="mt-1">
                          {task.dueDate ? (
                            <span className={
                              task.dueDate < new Date() && task.status !== 'completed'
                                ? 'text-red-600 font-medium'
                                : ''
                            }>
                              {formatDate(task.dueDate, 'MMM dd')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </Badge>
                        <Select
                          value={task.status}
                          onValueChange={(value: Task['status']) => handleTaskStatusChange(task.id, value)}
                        >
                          <SelectTrigger className="w-auto h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        {task.comments && task.comments.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{task.comments.length}</span>
                          </div>
                        )}
                        {task.attachments && task.attachments.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Paperclip className="h-3 w-3" />
                            <span>{task.attachments.length}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalTasks > 0 && (
            <div className="mt-6 space-y-4">
              {/* Pagination Info and Controls */}
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Show:</span>
                    <Select value={tasksPerPage.toString()} onValueChange={handleTasksPerPageChange}>
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalTasks)} of {totalTasks} tasks
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {/* First page */}
                      {currentPage > 2 && (
                        <>
                          <PaginationItem>
                            <PaginationLink onClick={() => handlePageChange(1)} className="cursor-pointer">
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {currentPage > 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}
                      
                      {/* Current page and neighbors */}
                      {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        const page = Math.max(1, Math.min(totalPages - 2, currentPage - 1)) + i;
                        if (page > totalPages) return null;
                        
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink 
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {/* Last page */}
                      {currentPage < totalPages - 1 && (
                        <>
                          {currentPage < totalPages - 2 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink onClick={() => handlePageChange(totalPages)} className="cursor-pointer">
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No tasks found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || priorityFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Create your first task to get started'
                }
              </p>
              {(!searchTerm && priorityFilter === 'all' && statusFilter === 'all') && (
                <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-0">
          {/* Analytics Header with Export */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
            <div>
              <h2 className="text-lg font-semibold">Analytics Overview</h2>
              <p className="text-sm text-muted-foreground">Project and task performance metrics</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4 mr-2" />
                  )}
                  Export Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportProjects('summary' as ExportFormat)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Summary Report (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportProjects('csv')}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Projects Data (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportTasks('csv')}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Tasks Data (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportTasks('excel')}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Complete Report (Excel)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{projects.length}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span className="hidden sm:inline">+2 this month</span>
                  <span className="sm:hidden">+2/month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{tasks.length}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span className="hidden sm:inline">+{tasks.filter(t => t.status === 'completed').length} completed</span>
                  <span className="sm:hidden">+{tasks.filter(t => t.status === 'completed').length} done</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Overdue Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-red-600">
                  {tasks.filter(task => task.dueDate && task.dueDate < new Date() && task.status !== 'completed').length}
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3" />
                  <span className="hidden sm:inline">Needs attention</span>
                  <span className="sm:hidden">Overdue</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Overall progress</span>
                  <span className="sm:hidden">Progress</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Distribution Charts */}
          <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm sm:text-base">Task Distribution by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['todo', 'in-progress', 'review', 'completed'].map((status) => {
                    const count = tasks.filter(task => task.status === status).length;
                    const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                    
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="capitalize">{status.replace('-', ' ')}</span>
                          <span>{count} ({Math.round(percentage)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm sm:text-base">Task Distribution by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['low', 'medium', 'high', 'urgent'].map((priority) => {
                    const count = tasks.filter(task => task.priority === priority).length;
                    const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                    
                    return (
                      <div key={priority} className="space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="capitalize">{priority}</span>
                          <span>{count} ({Math.round(percentage)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Project Dialog */}
      <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-project-name" className="text-xs sm:text-sm">Project Name *</Label>
                <Input
                  id="edit-project-name"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project-team" className="text-xs sm:text-sm">Team *</Label>
                <Select
                  value={projectForm.teamId}
                  onValueChange={(value) => setProjectForm(prev => ({ ...prev, teamId: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-project-description" className="text-xs sm:text-sm">Description</Label>
              <Textarea
                id="edit-project-description"
                value={projectForm.description}
                onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the project..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-project-priority" className="text-xs sm:text-sm">Priority</Label>
                <Select
                  value={projectForm.priority}
                  onValueChange={(value: Project['priority']) => setProjectForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project-status" className="text-xs sm:text-sm">Status</Label>
                <Select
                  value={projectForm.status}
                  onValueChange={(value: Project['status']) => setProjectForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2 border-t">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto order-2 sm:order-1"
                onClick={() => setIsEditProjectOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateProject} 
                disabled={submitting}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-name" className="text-xs sm:text-sm">Project Name *</Label>
                <Input
                  id="project-name"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-team" className="text-xs sm:text-sm">Team *</Label>
                <Select
                  value={projectForm.teamId}
                  onValueChange={(value) => setProjectForm(prev => ({ ...prev, teamId: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-description" className="text-xs sm:text-sm">Description</Label>
              <Textarea
                id="project-description"
                value={projectForm.description}
                onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the project..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-priority" className="text-xs sm:text-sm">Priority</Label>
                <Select
                  value={projectForm.priority}
                  onValueChange={(value: Project['priority']) => setProjectForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-status" className="text-xs sm:text-sm">Status</Label>
                <Select
                  value={projectForm.status}
                  onValueChange={(value: Project['status']) => setProjectForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2 border-t">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto order-2 sm:order-1"
                onClick={() => setIsCreateProjectOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateProject} 
                disabled={submitting}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-task-title" className="text-xs sm:text-sm">Task Title *</Label>
                <Input
                  id="edit-task-title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-project" className="text-xs sm:text-sm">Project *</Label>
                <Select
                  value={taskForm.projectId}
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, projectId: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task-description" className="text-xs sm:text-sm">Description</Label>
              <Textarea
                id="edit-task-description"
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the task..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-task-assignee" className="text-xs sm:text-sm">Assignee</Label>
                <Select
                  value={taskForm.assigneeId || "unassigned"}
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, assigneeId: value === "unassigned" ? undefined : value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-priority" className="text-xs sm:text-sm">Priority</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(value: Task['priority']) => setTaskForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-status" className="text-xs sm:text-sm">Status</Label>
                <Select
                  value={taskForm.status}
                  onValueChange={(value: Task['status']) => setTaskForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-estimated" className="text-xs sm:text-sm">Est. Hours</Label>
                <Input
                  id="edit-task-estimated"
                  type="number"
                  value={taskForm.estimatedHours}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2 border-t">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto order-2 sm:order-1"
                onClick={() => setIsEditTaskOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateTask} 
                disabled={submitting}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-title" className="text-xs sm:text-sm">Task Title *</Label>
                <Input
                  id="task-title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-project" className="text-xs sm:text-sm">Project *</Label>
                <Select
                  value={taskForm.projectId}
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, projectId: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description" className="text-xs sm:text-sm">Description</Label>
              <Textarea
                id="task-description"
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the task..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-assignee" className="text-xs sm:text-sm">Assignee</Label>
                <Select
                  value={taskForm.assigneeId || "unassigned"}
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, assigneeId: value === "unassigned" ? undefined : value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-priority" className="text-xs sm:text-sm">Priority</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(value: Task['priority']) => setTaskForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-estimated" className="text-xs sm:text-sm">Est. Hours</Label>
                <Input
                  id="task-estimated"
                  type="number"
                  value={taskForm.estimatedHours}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2 border-t">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto order-2 sm:order-1"
                onClick={() => setIsCreateTaskOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTask} 
                disabled={submitting}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog */}
      <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold line-clamp-2">{selectedTask.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{selectedTask.projectName}</p>
                </div>

                {selectedTask.description && (
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Description</Label>
                    <p className="text-xs sm:text-sm mt-1">{selectedTask.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      <Badge className="text-xs">
                        {selectedTask.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Priority</Label>
                    <div className="mt-1">
                      <Badge className={`text-xs ${PRIORITY_COLORS[selectedTask.priority]}`}>
                        {selectedTask.priority}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Assignee</Label>
                    <p className="text-xs sm:text-sm mt-1">{selectedTask.assigneeName || 'Unassigned'}</p>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Due Date</Label>
                    <p className="text-xs sm:text-sm mt-1">
                      {selectedTask.dueDate ? formatDate(selectedTask.dueDate, 'MMM dd, yyyy') : 'No due date'}
                    </p>
                  </div>
                </div>

                {selectedTask.estimatedHours && (
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Estimated Hours</Label>
                    <p className="text-xs sm:text-sm mt-1">{selectedTask.estimatedHours}h</p>
                  </div>
                )}

                {selectedTask.tags.length > 0 && (
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTask.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-3 pt-2 border-t">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto order-3 sm:order-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => selectedTask && initiateDeleteTask(selectedTask)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </Button>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto order-2 sm:order-1"
                    onClick={() => setIsTaskDetailOpen(false)}
                  >
                    Close
                  </Button>
                  <Button 
                    className="w-full sm:w-auto order-1 sm:order-2"
                    onClick={() => selectedTask && handleEditTask(selectedTask)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Task
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Project Alert Dialog */}
      <AlertDialog open={isDeleteProjectOpen} onOpenChange={setIsDeleteProjectOpen}>
        <AlertDialogContent className="w-full max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <span>Delete Project</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete the project <strong>"{projectToDelete?.name}"</strong>?
              </p>
              {projectToDelete && (
                <>
                  {tasks.filter(task => task.projectId === projectToDelete.id).length > 0 ? (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3">
                      <p className="text-red-800 text-sm font-medium">
                        ⚠️ Warning: This project has {tasks.filter(task => task.projectId === projectToDelete.id).length} task(s).
                      </p>
                      <p className="text-red-700 text-sm mt-1">
                        Deleting this project will also permanently delete all associated tasks.
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      This project has no tasks and can be safely deleted.
                    </p>
                  )}
                  <p className="text-muted-foreground text-sm mt-2">
                    This action cannot be undone.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteProject}
              disabled={submitting}
              className="w-full sm:w-auto order-1 sm:order-2 bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Task Alert Dialog */}
      <AlertDialog open={isDeleteTaskOpen} onOpenChange={setIsDeleteTaskOpen}>
        <AlertDialogContent className="w-full max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <span>Delete Task</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete the task <strong>"{taskToDelete?.title}"</strong>?
              </p>
              {taskToDelete && (
                <>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mt-3">
                    <p className="text-gray-700 text-sm">
                      <strong>Project:</strong> {taskToDelete.projectName}
                    </p>
                    {taskToDelete.assigneeName && (
                      <p className="text-gray-700 text-sm">
                        <strong>Assigned to:</strong> {taskToDelete.assigneeName}
                      </p>
                    )}
                    <p className="text-gray-700 text-sm">
                      <strong>Status:</strong> {taskToDelete.status.replace('-', ' ')}
                    </p>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">
                    This action cannot be undone.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTask}
              disabled={submitting}
              className="w-full sm:w-auto order-1 sm:order-2 bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 