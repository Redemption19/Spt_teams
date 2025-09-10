'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { DeleteDialog, useDeleteDialog } from '@/components/ui/delete-dialog';
import { 
  Loader2, 
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Building2,
  Briefcase,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

import { Project } from '@/lib/types';
import { Department } from '@/lib/department-service';
import { useAuth } from '@/lib/auth-context';
import { ProjectService } from '@/lib/project-service';
import { 
  validateProjectRemoval,
  validateUserPermissions,
  sanitizeProjectDepartmentInput 
} from '@/lib/validations/project-department-validation';
import AssignProjectDialog from './dialogs/AssignProjectDialog';

interface DepartmentProjectsManagerProps {
  department: Department;
  onProjectsUpdated?: () => void;
}

export default function DepartmentProjectsManager({
  department,
  onProjectsUpdated
}: DepartmentProjectsManagerProps) {
  const { userProfile } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const deleteDialog = useDeleteDialog();

  useEffect(() => {
    loadDepartmentProjects();
  }, [department.id]);

  const loadDepartmentProjects = async () => {
    try {
      setLoading(true);
      const departmentProjects = await ProjectService.getDepartmentProjects(department.id);
      setProjects(departmentProjects);
    } catch (error) {
      console.error('Error loading department projects:', error);
      toast({
        title: '❌ Error Loading Projects',
        description: 'Failed to load department projects.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    deleteDialog.openDialog({
      id: project.id,
      name: project.name,
      type: 'Project',
      status: project.status
    });
  };

  const confirmRemoveProject = async (item: any) => {
    if (!userProfile) {
      toast({
        title: '❌ Authentication Error',
        description: 'User profile not found.',
        variant: 'destructive',
      });
      return;
    }

    const project = projects.find(p => p.id === item.id);
    
    // Validate user permissions
    const permissionValidation = validateUserPermissions(
      userProfile.role || 'member',
      project || null,
      userProfile.id
    );

    if (!permissionValidation.isValid) {
      toast({
        title: '❌ Permission Denied',
        description: permissionValidation.errors.join(', '),
        variant: 'destructive',
      });
      throw new Error('Permission denied');
    }

    // Validate project removal
    const removalValidation = validateProjectRemoval(
      project || null,
      userProfile.id
    );

    if (!removalValidation.isValid) {
      toast({
        title: '❌ Validation Error',
        description: removalValidation.errors.join(', '),
        variant: 'destructive',
      });
      throw new Error('Validation failed');
    }

    try {
      const sanitizedInput = sanitizeProjectDepartmentInput({
        projectId: item.id,
        departmentId: department.id,
        userId: userProfile.id
      });
      
      await ProjectService.removeProjectFromDepartment(
        sanitizedInput.projectId, 
        sanitizedInput.userId
      );
      
      toast({
        title: '✅ Project Removed',
        description: 'Project has been removed from the department.',
      });

      await loadDepartmentProjects();
      onProjectsUpdated?.();
    } catch (error) {
      console.error('Error removing project:', error);
      toast({
        title: '❌ Removal Failed',
        description: error instanceof Error ? error.message : 'Failed to remove project from department.',
        variant: 'destructive',
      });
      throw error; // Re-throw to let the dialog handle the error state
    }
  };

  const handleAssignSuccess = async () => {
    await loadDepartmentProjects();
    onProjectsUpdated?.();
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Not set';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    avgProgress: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Briefcase className="h-5 w-5" />
            <span>Department Projects</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage projects assigned to {department.name}
          </p>
        </div>
        <Button onClick={() => setShowAssignDialog(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Assign Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{projectStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{projectStats.active}</p>
                <p className="text-xs text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{projectStats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{projectStats.avgProgress}%</p>
                <p className="text-xs text-muted-foreground">Avg Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading projects...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No projects match your search criteria.' : 'This department has no assigned projects yet.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAssignDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign First Project
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge className={getProjectStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <Badge className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all" 
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{project.progress}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="text-sm font-medium">{formatDate(project.startDate)}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <p className="text-sm font-medium">{formatDate(project.dueDate)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 lg:ml-4">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRemoveProject(project.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Project Dialog */}
      <AssignProjectDialog
        isOpen={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        onSuccess={handleAssignSuccess}
        departmentId={department.id}
      />

      {/* Remove Project Dialog */}
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.closeDialog}
        onConfirm={() => deleteDialog.handleConfirm(confirmRemoveProject)}
        title="Remove Project from Department"
        description="This action will remove the project from this department but will not delete the project itself."
        item={deleteDialog.item}
        itemDetails={[
          { label: 'Project Name', value: deleteDialog.item?.name || '' },
          { label: 'Type', value: deleteDialog.item?.type || '' },
          { label: 'Status', value: deleteDialog.item?.status || '' }
        ]}
        consequences={[
          'Project will be removed from this department',
          'Department members will lose access to this project',
          'Project tasks assigned to department members may be affected',
          'Project progress tracking for this department will be lost'
        ]}
        confirmText="Remove Project"
        isLoading={deleteDialog.isLoading}
        warningLevel="medium"
      />
    </div>
  );
}