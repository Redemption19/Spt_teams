// components/tasks/TaskListView.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import {
  List,
  ArrowUpDown,
  Trash2,
  FileDown,
  MoreVertical,
  Eye,
  Edit,
  MessageSquare,
  Paperclip,
  Plus,
  Loader2
} from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { Task } from '@/lib/types';
// Import from the main project-task-management.tsx for shared types/constants
import { TaskWithDisplayInfo, PRIORITY_COLORS } from './project-task-management';

interface TaskListViewProps {
  paginatedTasks: TaskWithDisplayInfo[];
  totalTasks: number;
  currentPage: number;
  totalPages: number;
  tasksPerPage: number;
  selectedTasks: string[];
  setTasksPerPage: (value: number) => void;
  handlePageChange: (page: number) => void;
  handleSort: (field: 'title' | 'priority' | 'status' | 'dueDate' | 'projectName' | 'assigneeName') => void;
  sortField: 'title' | 'priority' | 'status' | 'dueDate' | 'projectName' | 'assigneeName';
  sortDirection: 'asc' | 'desc';
  handleTaskSelect: (taskId: string) => void;
  handleSelectAllTasks: () => void;
  handleBulkStatusUpdate: (newStatus: Task['status']) => Promise<void>;
  handleBulkDelete: () => Promise<void>;
  handleExportSelectedTasks: (format: 'csv' | 'excel' | 'pdf' | 'json') => Promise<void>;
  isExporting: boolean;
  handleTaskStatusChange: (taskId: string, newStatus: Task['status']) => void;
  handleEditTask: (task: TaskWithDisplayInfo) => void;
  initiateDeleteTask: (task: TaskWithDisplayInfo) => void;
  setViewingTask: (task: TaskWithDisplayInfo | null) => void;
  setIsTaskDetailOpen: (isOpen: boolean) => void;
  searchTerm: string;
  priorityFilter: string;
  statusFilter: string;
  setIsCreateTaskOpen: (isOpen: boolean) => void;
}

export default function TaskListView({
  paginatedTasks,
  totalTasks,
  currentPage,
  totalPages,
  tasksPerPage,
  selectedTasks,
  setTasksPerPage,
  handlePageChange,
  handleSort,
  sortField,
  sortDirection,
  handleTaskSelect,
  handleSelectAllTasks,
  handleBulkStatusUpdate,
  handleBulkDelete,
  handleExportSelectedTasks,
  isExporting,
  handleTaskStatusChange,
  handleEditTask,
  initiateDeleteTask,
  setViewingTask,
  setIsTaskDetailOpen,
  searchTerm,
  priorityFilter,
  statusFilter,
  setIsCreateTaskOpen,
}: TaskListViewProps) {
  const router = useRouter();

  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;

  return (
    <>
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
                onClick={() => handleSelectAllTasks()} // Changed to call handleSelectAllTasks directly
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
                          setViewingTask(task);
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
                        {formatDate(task.dueDate, 'MMM dd,yyyy')}
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
                          setViewingTask(task);
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
                          setViewingTask(task);
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
                        setViewingTask(task);
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
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select value={tasksPerPage.toString()} onValueChange={(value) => setTasksPerPage(Number(value))}>
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

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

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
      {paginatedTasks.length === 0 && (
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
            <Button onClick={() => setIsCreateTaskOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
        </div>
      )}
    </>
  );
}