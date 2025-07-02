// components/tasks/KanbanBoard.tsx
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  Circle,
  Timer,
  Eye,
  CheckCircle2,
  Trash2,
  MessageSquare,
  Paperclip,
  Activity,
} from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { Project, Task } from '@/lib/types';
// Import from the main project-task-management.tsx for shared types/constants
import { TaskWithDisplayInfo, PRIORITY_COLORS } from './project-task-management';

interface KanbanBoardProps {
  tasks: TaskWithDisplayInfo[];
  projects: Project[];
  selectedProject: string | null;
  setSelectedProject: (projectId: string | null) => void;
  loadData: () => Promise<void>; // Retained loadData if its needed for refresh after actions
  handleTaskStatusChange: (taskId: string, newStatus: Task['status']) => void;
  initiateDeleteTask: (task: TaskWithDisplayInfo) => void;
  setViewingTask: (task: TaskWithDisplayInfo | null) => void;
  setIsTaskDetailOpen: (isOpen: boolean) => void;
}

export default function KanbanBoard({
  tasks,
  projects,
  selectedProject,
  setSelectedProject,
  loadData,
  handleTaskStatusChange,
  initiateDeleteTask,
  setViewingTask,
  setIsTaskDetailOpen,
}: KanbanBoardProps) {
  const router = useRouter();

  const handleTaskClick = (task: TaskWithDisplayInfo) => {
    router.push(`/dashboard/tasks/${task.id}`);
  };

  const kanbanColumns = [
    { id: 'todo' as const, title: 'To Do', color: 'bg-gray-50 border-gray-200', icon: Circle },
    { id: 'in-progress' as const, title: 'In Progress', color: 'bg-blue-50 border-blue-200', icon: Timer },
    { id: 'review' as const, title: 'Review', color: 'bg-yellow-50 border-yellow-200', icon: Eye },
    { id: 'completed' as const, title: 'Completed', color: 'bg-green-50 border-green-200', icon: CheckCircle2 },
  ];

  const filteredKanbanColumns = kanbanColumns.map(column => ({
    ...column,
    tasks: tasks.filter(task => task.status === column.id),
  }));

  return (
    <>
      <div className="mb-4 flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Select
            value={selectedProject || 'all'}
            onValueChange={(value) => {
              setSelectedProject(value === 'all' ? null : value);
              // No need to call loadData here, as selectedProject change will trigger useEffect in parent
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
          <span>{tasks.length} tasks</span>
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
                    onClick={() => handleTaskClick(task)}
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
                    onClick={() => handleTaskClick(task)}
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
    </>
  );
}
