'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  User, 
  Flag,
  MoreHorizontal,
  Filter,
  Target,
  Clock,
  CheckCircle,
  Circle,
  Search,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions } from '@/lib/rbac-hooks';
import { useToast } from '@/hooks/use-toast';

// Enhanced Task interface following your user flow
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  assigneeName?: string;
  createdBy: string;
  createdByName?: string;
  projectId?: string;
  teamId?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
}

const taskStatusColumns = [
  { 
    id: 'todo', 
    title: 'To Do', 
    color: 'bg-gray-100 text-gray-800',
    icon: Circle
  },
  { 
    id: 'in-progress', 
    title: 'In Progress', 
    color: 'bg-blue-100 text-blue-800',
    icon: Clock
  },
  { 
    id: 'review', 
    title: 'Review', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertCircle
  },
  { 
    id: 'completed', 
    title: 'Completed', 
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  }
];

export function TaskBoard() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const permissions = useRolePermissions();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [activeView, setActiveView] = useState<'board' | 'list'>('board');

  // Dialog states
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);

  // Form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assigneeId: '',
    dueDate: '',
    estimatedHours: ''
  });

  useEffect(() => {
    if (currentWorkspace && user) {
      loadTasks();
    }
  }, [currentWorkspace, user]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // Mock tasks for demonstration - replace with real API calls
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Update user authentication system',
          description: 'Enhance the current auth system with 2FA support',
          status: 'todo',
          priority: 'high',
          assigneeId: user?.uid || '',
          assigneeName: user?.name || 'Assigned User',
          createdBy: user?.uid || '',
          createdByName: user?.name || '',
          dueDate: new Date('2024-01-20'),
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          tags: ['frontend', 'security'],
          estimatedHours: 8
        },
        {
          id: '2',
          title: 'Design new dashboard layout',
          description: 'Create wireframes and prototypes for the new dashboard',
          status: 'in-progress',
          priority: 'medium',
          assigneeId: user?.uid || '',
          assigneeName: user?.name || 'Assigned User',
          createdBy: user?.uid || '',
          createdByName: user?.name || '',
          dueDate: new Date('2024-01-18'),
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-16'),
          tags: ['design', 'ui'],
          estimatedHours: 16,
          actualHours: 8
        },
        {
          id: '3',
          title: 'Fix payment gateway integration',
          description: 'Resolve issues with Stripe payment processing',
          status: 'review',
          priority: 'urgent',
          assigneeId: user?.uid || '',
          assigneeName: user?.name || 'Assigned User',
          createdBy: user?.uid || '',
          createdByName: user?.name || '',
          dueDate: new Date('2024-01-15'),
          createdAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-01-14'),
          tags: ['backend', 'payments'],
          estimatedHours: 4,
          actualHours: 6
        },
        {
          id: '4',
          title: 'Write API documentation',
          description: 'Document all REST API endpoints with examples',
          status: 'completed',
          priority: 'low',
          assigneeId: user?.uid || '',
          assigneeName: user?.name || 'Assigned User',
          createdBy: user?.uid || '',
          createdByName: user?.name || '',
          dueDate: new Date('2024-01-12'),
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-12'),
          tags: ['documentation'],
          estimatedHours: 12,
          actualHours: 10
        }
      ];

      setTasks(mockTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim() || !currentWorkspace || !user) return;

    try {
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskForm.title,
        description: taskForm.description,
        status: 'todo',
        priority: taskForm.priority,
        assigneeId: taskForm.assigneeId || user.uid,
        assigneeName: taskForm.assigneeId === user.uid ? user.name : 'Assigned User',
        createdBy: user.uid,
        createdByName: user.name || '',
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        estimatedHours: taskForm.estimatedHours ? parseInt(taskForm.estimatedHours) : undefined,
      };

      setTasks(prev => [...prev, newTask]);
      setIsCreateTaskOpen(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        assigneeId: '',
        dueDate: '',
        estimatedHours: ''
      });

      toast({
        title: 'Task Created',
        description: 'Task has been created successfully.',
      });

    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleTaskStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, updatedAt: new Date() }
        : task
    ));
    
    toast({
      title: 'Task Updated',
      description: `Task moved to ${newStatus.replace('-', ' ')}`,
    });
  };

  const getStatusColor = (status: string) => {
    const statusColumn = taskStatusColumns.find(col => col.id === status);
    return statusColumn?.color || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-600 bg-red-50';
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const tasksByStatus = taskStatusColumns.reduce((acc, column) => {
    acc[column.id] = filteredTasks.filter(task => task.status === column.id);
    return acc;
  }, {} as Record<string, Task[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Task Board
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your team&apos;s tasks efficiently
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* View Toggle and Filters */}
      <div className="flex items-center justify-between">
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
          <TabsList>
            <TabsTrigger value="board">Board View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {taskStatusColumns.map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  {column.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task Board */}
      {activeView === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {taskStatusColumns.map((column) => {
            const columnTasks = tasksByStatus[column.id] || [];
            const Icon = column.icon;
            
            return (
              <Card key={column.id} className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{column.title}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {columnTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScrollArea className="h-96">
                    {columnTasks.map((task) => (
                      <Card 
                        key={task.id} 
                        className={`mb-3 border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(task.priority)}`}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsEditTaskOpen(true);
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle dropdown menu
                                }}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${getStatusColor(task.priority)}`}
                                >
                                  {task.priority}
                                </Badge>
                                {task.dueDate && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                    {task.dueDate.toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              {task.assigneeName && (
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {task.assigneeName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                            
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {task.tags.slice(0, 2).map((tag) => (
                                  <Badge 
                                    key={tag} 
                                    variant="outline" 
                                    className="text-xs px-1 py-0"
                                  >
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

                            {task.estimatedHours && (
                              <div className="text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {task.actualHours ? `${task.actualHours}/${task.estimatedHours}h` : `${task.estimatedHours}h est.`}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {columnTasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tasks</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your workspace following your user flow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                placeholder="Enter task title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                placeholder="Describe the task"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({ ...taskForm, priority: value as any })}>
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

              <div className="space-y-2">
                <Label>Estimated Hours</Label>
                <Input
                  type="number"
                  placeholder="Hours"
                  value={taskForm.estimatedHours}
                  onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={!taskForm.title.trim()}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
