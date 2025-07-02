// components/tasks/ProjectCardGrid.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ArrowRight
} from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { Project } from '@/lib/types';
// Import from the main project-task-management.tsx for shared types/constants
import { ProjectWithStats, PRIORITY_COLORS, STATUS_COLORS } from './project-task-management';

interface ProjectCardGridProps {
  projects: ProjectWithStats[];
  setSelectedProject: (projectId: string | null) => void;
  setActiveTab: (tab: string) => void;
  handleEditProject: (project: Project) => void;
  initiateDeleteProject: (project: Project) => void;
}

export default function ProjectCardGrid({
  projects,
  setSelectedProject,
  setActiveTab,
  handleEditProject,
  initiateDeleteProject,
}: ProjectCardGridProps) {
  return (
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
                  {project.dueDate ? formatDate(project.dueDate, 'MMM dd,yyyy') : 'No due date'}
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
  );
}