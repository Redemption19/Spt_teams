'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { TaskService } from '@/lib/task-service';
import { ProjectService } from '@/lib/project-service';
import { UserService } from '@/lib/user-service';
import { CommentService } from '@/lib/comment-service';
import { ActivityService } from '@/lib/activity-service';
import { Task, Project, User, Comment, ActivityLog } from '@/lib/types';
import { useRolePermissions } from '@/lib/rbac-hooks';
import CommentSection from '@/components/ui/comment-section';
import { convertTimestamps } from '@/lib/firestore-utils';
import { format as formatDate, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  Clock,
  User as UserIcon,
  Building,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  Eye,
  MessageSquare,
  Activity as ActivityIcon,
  Loader2,
  Copy,
  ExternalLink,
  Hash,
  FileText,
  Users,
  Timer,
  Flag,
  Target,
} from 'lucide-react';

// Import the custom delete dialog
import DeleteTaskAlertDialog from '@/components/tasks/dialogs/DeleteTaskAlertDialog';

// Import priority colors from the main component
export const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

export const STATUS_COLORS = {
  'todo': 'bg-gray-100 text-gray-800 border-gray-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  'review': 'bg-purple-100 text-purple-800 border-purple-200',
  'completed': 'bg-green-100 text-green-800 border-green-200',
};

export function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const permissions = useRolePermissions();

  // State for task data
  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [assignee, setAssignee] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    assigneeId: '',
    dueDate: '',
    estimatedHours: '',
    tags: [] as string[],
  });

  // State for users and projects (for dropdowns)
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // State for comments and activity
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Load task data
  const loadTaskData = useCallback(async () => {
    if (!taskId || !currentWorkspace || !user) return;

    setLoading(true);
    try {
      // Get task details
      const taskData = await TaskService.getTask(taskId);
      if (!taskData) {
        toast({
          title: "Error",
          description: "Task not found",
          variant: "destructive",
        });
        router.push('/dashboard/tasks');
        return;
      }

      setTask(taskData);

      // Load related data
      const [projectData, assigneeData, usersData, projectsData] = await Promise.all([
        taskData.projectId ? ProjectService.getProject(taskData.projectId) : null,
        taskData.assigneeId ? UserService.getUser(taskData.assigneeId) : null,
        UserService.getUsersByWorkspace(currentWorkspace.id),
        ProjectService.getWorkspaceProjects(currentWorkspace.id),
      ]);

      setProject(projectData);
      setAssignee(assigneeData);
      setUsers(usersData);
      setProjects(projectsData);

      // Set comments from task data (comments are stored as part of the task)
      setComments(convertTimestamps(taskData.comments || []) as Comment[]);
      
      // Get activities for this task (using workspace activities filtered by task)
      try {
        const allActivities = await ActivityService.getWorkspaceActivities(currentWorkspace.id, 100);
        const taskActivities = allActivities.filter(activity => 
          activity.entityId === taskId || 
          (activity.entity === 'task' && activity.entityId === taskId)
        );
        setActivities(taskActivities);
      } catch (error) {
        console.warn('Could not load task activities:', error);
        setActivities([]);
      }

      // Initialize edit form
      setEditForm({
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status,
        priority: taskData.priority,
        assigneeId: taskData.assigneeId || '',
        dueDate: taskData.dueDate ? formatDate(taskData.dueDate, 'yyyy-MM-dd') : '',
        estimatedHours: taskData.estimatedHours?.toString() || '',
        tags: taskData.tags || [],
      });

    } catch (error) {
      console.error('Error loading task data:', error);
      toast({
        title: "Error",
        description: "Failed to load task details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [taskId, currentWorkspace, user, router]);

  useEffect(() => {
    loadTaskData();
  }, [loadTaskData]);

  // Handle comments update (called when comments are added/edited/deleted)
  const handleCommentsUpdate = useCallback(() => {
    loadTaskData();
  }, [loadTaskData]);

  // Handle task update
  const handleUpdateTask = async () => {
    if (!task || !user) return;

    if (!editForm.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const updates: Partial<Task> = {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        status: editForm.status,
        priority: editForm.priority,
        assigneeId: editForm.assigneeId || undefined,
        estimatedHours: editForm.estimatedHours ? parseFloat(editForm.estimatedHours) : undefined,
        tags: editForm.tags,
      };

      if (editForm.dueDate) {
        updates.dueDate = new Date(editForm.dueDate);
      }

      await TaskService.updateTask(task.id, updates, user.uid);

      toast({
        title: "Success",
        description: "Task updated successfully",
      });

      setIsEditing(false);
      loadTaskData();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle task deletion - trigger custom dialog
  const handleDeleteTask = () => {
    setIsDeleteDialogOpen(true);
  };

  // Confirm task deletion with enhanced toast
  const confirmDeleteTask = async () => {
    if (!task || !user) return;

    setUpdating(true);
    try {
      await TaskService.deleteTask(task.id, user.uid);

      // Enhanced success toast with better styling and more info
      toast({
        title: "🗑️ Task Deleted Successfully",
        description: `"${task.title}" has been permanently removed from the project. All task data, comments, and assignments have been cleared.`,
        className: "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900",
        duration: 5000,
      });

      router.push('/dashboard/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      
      // Enhanced error toast with better context
      toast({
        title: "❌ Deletion Failed",
        description: `Failed to delete "${task.title}". This might be due to existing dependencies or network issues. Please try again or contact support if the problem persists.`,
        variant: "destructive",
        className: "border-red-200 bg-gradient-to-r from-red-50 to-rose-50 text-red-900",
        duration: 6000,
      });
    } finally {
      setUpdating(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: Task['status']) => {
    if (!task || !user) return;

    setUpdating(true);
    try {
      await TaskService.updateTaskStatus(task.id, newStatus, user.uid);

      toast({
        title: "Success",
        description: `Task status updated to ${newStatus.replace('-', ' ')}`,
      });

      loadTaskData();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Helper functions
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'todo': return <AlertCircle className="h-4 w-4" />;
      case 'in-progress': return <PlayCircle className="h-4 w-4" />;
      case 'review': return <Eye className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'low': return <Flag className="h-4 w-4" />;
      case 'medium': return <Flag className="h-4 w-4" />;
      case 'high': return <Flag className="h-4 w-4" />;
      case 'urgent': return <Flag className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  // Task-specific permissions - check if user can edit/delete this task
  const canEditTask = task?.createdBy === user?.uid || 
                      task?.assigneeId === user?.uid || 
                      permissions.canEditTeams; // Using team permissions as fallback
  const canDeleteTask = task?.createdBy === user?.uid || 
                        permissions.canDeleteTeams; // Using team permissions as fallback

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm sm:text-base text-muted-foreground">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-muted-foreground">Task not found</h3>
            <p className="text-sm text-muted-foreground">The task you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/tasks')}
            className="h-11 sm:h-10 touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="min-w-0 flex-1 space-y-3 sm:space-y-4">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/tasks')}
              className="h-11 sm:h-10 px-3 sm:px-4 hover:bg-accent/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-base">Back</span>
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="min-w-0 flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs sm:text-sm truncate max-w-32 sm:max-w-none">
                {project?.name || 'No Project'}
              </Badge>
            </div>
          </div>

          {/* Task Title and Description */}
          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {task.title}
            </h1>
            {task.description && (
              <p className="text-sm sm:text-base text-muted-foreground">
                {task.description}
              </p>
            )}
          </div>

          {/* Status and Priority Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon(task.status)}
              <Badge className={`${STATUS_COLORS[task.status]} border text-xs sm:text-sm font-medium`}>
                {task.status.replace('-', ' ')}
              </Badge>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center space-x-2">
              {getPriorityIcon(task.priority)}
              <Badge className={`${PRIORITY_COLORS[task.priority]} border text-xs sm:text-sm font-medium`}>
                {task.priority} priority
              </Badge>
            </div>
            {task.tags && task.tags.length > 0 && (
              <>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {task.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                      <Hash className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {task.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      +{task.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0 w-full sm:w-auto">
          {canEditTask && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              disabled={updating}
              className="w-full sm:w-auto h-11 sm:h-10 bg-gradient-to-r from-background to-accent/10 hover:from-accent/10 hover:to-accent/20 border-border/50"
            >
              <Edit className="h-4 w-4 mr-2" />
              <span>Edit Task</span>
            </Button>
          )}
          {canDeleteTask && (
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={updating}
              className="w-full sm:w-auto h-11 sm:h-10 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              {updating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              <span>Delete Task</span>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Status Actions Card */}
      <Card className="rounded-xl border-border/50 bg-gradient-to-r from-background to-accent/5">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            
            {/* Current Status Display */}
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 p-2 rounded-lg bg-background border border-border/50">
                  {getStatusIcon(task.status)}
                  <Badge className={`${STATUS_COLORS[task.status]} border text-sm font-medium`}>
                    {task.status.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
              
              {/* Task Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                {assignee && (
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4" />
                    <span className="truncate max-w-32 sm:max-w-none">{assignee.name || assignee.email}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(task.dueDate, 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {task.estimatedHours && (
                  <div className="flex items-center space-x-2">
                    <Timer className="h-4 w-4" />
                    <span>{task.estimatedHours}h</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {task.status !== 'todo' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate('todo')}
                  disabled={updating}
                  className="h-9 sm:h-8 px-3 sm:px-4 text-xs sm:text-sm hover:bg-gray-50"
                >
                  <AlertCircle className="h-3 w-3 mr-1.5" />
                  To Do
                </Button>
              )}
              {task.status !== 'in-progress' && (
                <Button
                  size="sm"
                  variant="outline"  
                  onClick={() => handleStatusUpdate('in-progress')}
                  disabled={updating}
                  className="h-9 sm:h-8 px-3 sm:px-4 text-xs sm:text-sm hover:bg-blue-50"
                >
                  <PlayCircle className="h-3 w-3 mr-1.5" />
                  In Progress
                </Button>
              )}
              {task.status !== 'review' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate('review')}
                  disabled={updating}
                  className="h-9 sm:h-8 px-3 sm:px-4 text-xs sm:text-sm hover:bg-purple-50"
                >
                  <Eye className="h-3 w-3 mr-1.5" />
                  Review
                </Button>
              )}
              {task.status !== 'completed' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updating}
                  className="h-9 sm:h-8 px-3 sm:px-4 text-xs sm:text-sm bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                >
                  {updating ? (
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3 w-3 mr-1.5" />
                  )}
                  Complete
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Primary Content - Task Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Task Information Card */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Task Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                
                {/* Assignee */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center space-x-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Assignee</span>
                  </Label>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-sm text-foreground">
                      {assignee?.name || assignee?.email || (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Due Date</span>
                  </Label>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-sm text-foreground">
                      {task.dueDate ? (
                        <span className={task.dueDate < new Date() && task.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                          {formatDate(task.dueDate, 'MMM dd, yyyy')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">No due date</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Estimated Hours */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center space-x-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span>Estimated Hours</span>
                  </Label>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-sm text-foreground">
                      {task.estimatedHours ? (
                        `${task.estimatedHours} hours`
                      ) : (
                        <span className="text-muted-foreground italic">Not specified</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Project */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>Project</span>
                  </Label>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-sm text-foreground">
                      {project?.name || (
                        <span className="text-muted-foreground italic">No project assigned</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Created Information - Full Width */}
                <div className="sm:col-span-2 space-y-2">
                  <Label className="text-sm font-medium flex items-center space-x-2">
                    <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Created</span>
                  </Label>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-sm text-foreground">
                      {task.createdAt ? formatDate(task.createdAt, 'MMM dd, yyyy \'at\' h:mm a') : 'Unknown'}
                      {task.updatedAt && task.updatedAt !== task.createdAt && (
                        <span className="text-muted-foreground ml-2">
                          (Updated {formatDate(task.updatedAt, 'MMM dd, yyyy')})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          {task && user && (
            <CommentSection
              type="task"
              entityId={task.id}
              entity={task}
              comments={comments}
              currentUserId={user.uid}
              currentUserName={user.displayName || user.email?.split('@')[0] || 'User'}
              currentUserRole={permissions.canEditTeams ? 'admin' : 'member'}
              onCommentsUpdate={handleCommentsUpdate}
              className="rounded-xl border-border/50"
            />
          )}
        </div>

        {/* Sidebar - Activity & Quick Actions */}
        <div className="space-y-6">
          
          {/* Activity Log */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                <ActivityIcon className="h-5 w-5 text-primary" />
                <span>Activity</span>
                <Badge variant="secondary" className="text-xs">{activities.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {activities.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activities.slice(0, 10).map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground font-medium">
                          {activity.userName || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.description || `${activity.action} on ${activity.entity}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.timestamp ? formatDistanceToNow(activity.timestamp, { addSuffix: true }) : 'Unknown time'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activities.length > 10 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                        View all {activities.length} activities
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <ActivityIcon className="h-10 w-10 text-muted-foreground mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">No Activity Yet</p>
                    <p className="text-xs text-muted-foreground">Task activities will appear here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                <Target className="h-5 w-5 text-primary" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/dashboard/tasks/${task.id}`);
                    toast({
                      title: "Link copied",
                      description: "Task link copied to clipboard",
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const taskUrl = `${window.location.origin}/dashboard/tasks/${task.id}`;
                    window.open(taskUrl, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      {isEditing && (
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Task title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as Task['status'] }))}>
                    <SelectTrigger>
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
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={editForm.priority} onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value as Task['priority'] }))}>
                    <SelectTrigger>
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
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select value={editForm.assigneeId} onValueChange={(value) => setEditForm(prev => ({ ...prev, assigneeId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  value={editForm.estimatedHours}
                  onChange={(e) => setEditForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                  placeholder="0"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTask} disabled={updating}>
                {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteTaskAlertDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        taskToDelete={task}
        confirmDelete={confirmDeleteTask}
        isSubmitting={updating}
      />
    </div>
  );
}
