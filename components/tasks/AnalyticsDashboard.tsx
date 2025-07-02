// components/tasks/AnalyticsDashboard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart3,
  FileDown
} from 'lucide-react';
import { Project, Task, User as UserType, Team } from '@/lib/types';
// Import from the main project-task-management.tsx for shared types/constants
import { ProjectWithStats } from './project-task-management';
import { ExportFormat } from '@/lib/export-service'; // Assuming ExportFormat is defined here or globally

interface AnalyticsDashboardProps {
  projects: ProjectWithStats[];
  tasks: Task[];
  handleExportProjects: (format: ExportFormat) => Promise<void>;
  handleExportTasks: (format: ExportFormat) => Promise<void>;
  isExporting: boolean;
}

export default function AnalyticsDashboard({
  projects,
  tasks,
  handleExportProjects,
  handleExportTasks,
  isExporting,
}: AnalyticsDashboardProps) {
  const overdueTasksCount = tasks.filter(task => task.dueDate && task.dueDate < new Date() && task.status !== 'completed').length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  return (
    <>
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
              <span className="hidden sm:inline">+{completedTasksCount} completed</span>
              <span className="sm:hidden">+{completedTasksCount} done</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {overdueTasksCount}
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
              {completionRate}%
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
    </>
  );
}