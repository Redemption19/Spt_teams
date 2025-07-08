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
  Calendar, 
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
  Trash2
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

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Update user authentication system',
    status: 'todo',
    priority: 'high',
    assigneeId: '1',
    assigneeName: 'John Doe',
    createdBy: '2',
    createdByName: 'Admin',
    projectId: '1',
    teamId: '1',
    dueDate: new Date('2024-01-20'),
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['frontend', 'security'],
  },
  {
    id: '2',
    title: 'Design new dashboard layout',
    status: 'in-progress',
    priority: 'medium',
    assigneeId: '2',
    assigneeName: 'Sarah Wilson',
    createdBy: '1',
    createdByName: 'John Doe',
    projectId: '2',
    teamId: '1',
    dueDate: new Date('2024-01-18'),
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['design', 'ui'],
  },
  {
    id: '3',
    title: 'Fix payment gateway integration',
    status: 'review',
    priority: 'urgent',
    assigneeId: '3',
    assigneeName: 'Mike Chen',
    createdBy: '2',
    createdByName: 'Admin',
    projectId: '3',
    teamId: '2',
    dueDate: new Date('2024-01-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['backend', 'payments'],
  },
  {
    id: '4',
    title: 'Write API documentation',
    status: 'completed',
    priority: 'low',
    assigneeId: '4',
    assigneeName: 'Anna Johnson',
    createdBy: '1',
    createdByName: 'John Doe',
    projectId: '4',
    teamId: '2',
    dueDate: new Date('2024-01-12'),
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['documentation'],
  },
];

const statusColumns = [
  { 
    id: 'todo', 
    title: 'To Do', 
    color: 'bg-muted/50 dark:bg-muted/30',
    borderColor: 'border-muted-foreground/20'
  },
  { 
    id: 'in-progress', 
    title: 'In Progress', 
    color: 'bg-blue-100/50 dark:bg-blue-900/20',
    borderColor: 'border-blue-300 dark:border-blue-700'
  },
  { 
    id: 'review', 
    title: 'Review', 
    color: 'bg-yellow-100/50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-300 dark:border-yellow-700'
  },
  { 
    id: 'completed', 
    title: 'Completed', 
    color: 'bg-green-100/50 dark:bg-green-900/20',
    borderColor: 'border-green-300 dark:border-green-700'
  },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500 dark:bg-red-400';
    case 'high':
      return 'bg-orange-500 dark:bg-orange-400';
    case 'medium':
      return 'bg-yellow-500 dark:bg-yellow-400';
    case 'low':
      return 'bg-green-500 dark:bg-green-400';
    default:
      return 'bg-muted-foreground';
  }
};

export function TaskBoard() {
  const [activeView, setActiveView] = useState<'board' | 'list'>('board');

  const getTasksByStatus = (status: string) => {
    return mockTasks.filter(task => task.status === status);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Projects & Tasks
          </h2>
          <p className="text-muted-foreground mt-1">Manage your team&apos;s projects and track progress</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button variant="outline" size="sm" className="border-border">
            <Filter className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'board' | 'list')}>
        <TabsList>
          <TabsTrigger value="board">Board View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {statusColumns.map((column) => (
              <div key={column.id} className="space-y-4">
                <div className={`${column.color} rounded-lg p-4 flex items-center justify-between border ${column.borderColor} backdrop-blur-sm`}>
                  <h3 className="font-semibold text-foreground">{column.title}</h3>
                  <Badge variant="secondary" className="bg-background/80 text-foreground border-border">
                    {getTasksByStatus(column.id).length}
                  </Badge>
                </div>
                
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {getTasksByStatus(column.id).map((task) => (
                      <Card key={task.id} className="p-4 card-interactive cursor-pointer">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm text-foreground leading-tight">
                              {task.title}
                            </h4>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                            <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {task.tags?.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 bg-muted/50 text-muted-foreground border-border">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6 border border-border">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                                  {task.assigneeName?.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{task.assigneeName}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{task.dueDate?.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card className="border-border shadow-lg bg-card/90 backdrop-blur-sm card-enhanced">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {mockTasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-card/80 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{task.title}</h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                            <span className="capitalize">{task.status.replace('-', ' ')}</span>
                            <span>•</span>
                            <span>{task.projectId}</span>
                            <span>•</span>
                            <span>Due {task.dueDate?.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          {task.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs bg-muted/50 text-muted-foreground border-border">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                            {task.assigneeName?.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}