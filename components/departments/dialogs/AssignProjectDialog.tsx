'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { 
  Loader2, 
  FolderOpen, 
  Search,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Building2,
  Briefcase
} from 'lucide-react';

import { Project } from '@/lib/types';
import { Department } from '@/lib/department-service';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { ProjectService } from '@/lib/project-service';
import { DepartmentService } from '@/lib/department-service';
import { 
  validateProjectAssignment, 
  validateDepartmentForProjects,
  validateUserPermissions,
  sanitizeProjectDepartmentInput 
} from '@/lib/validations/project-department-validation';

interface AssignProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId?: string; // If provided, assign this specific project
  departmentId?: string; // If provided, assign projects to this specific department
}

export default function AssignProjectDialog({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  departmentId
}: AssignProjectDialogProps) {
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  
  const [form, setForm] = useState({
    selectedProjectId: projectId || '',
    selectedDepartmentId: departmentId || ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentWorkspace || !userProfile) return;
      
      try {
        // Load projects if we need to select one
        if (!projectId) {
          setLoadingProjects(true);
          const workspaceProjects = await ProjectService.getWorkspaceProjects(currentWorkspace.id);
          // Filter out projects that already have a department assigned
          const unassignedProjects = workspaceProjects.filter(p => !p.departmentId);
          setProjects(unassignedProjects);
        }

        // Always load departments to ensure we have complete department data
        setLoadingDepartments(true);
        const workspaceDepartments = await DepartmentService.getWorkspaceDepartments(currentWorkspace.id);
        setDepartments(workspaceDepartments);
        
        // If departmentId is provided, verify it exists in the loaded departments
        if (departmentId && !workspaceDepartments.find(d => d.id === departmentId)) {
          toast({
            title: '❌ Department Not Found',
            description: 'The specified department could not be found.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: '❌ Error Loading Data',
          description: 'Failed to load projects or departments.',
          variant: 'destructive',
        });
      } finally {
        setLoadingProjects(false);
        setLoadingDepartments(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [currentWorkspace, userProfile, isOpen, projectId, departmentId]);

  useEffect(() => {
    if (isOpen) {
      setForm({
        selectedProjectId: projectId || '',
        selectedDepartmentId: departmentId || ''
      });
    } else {
      setForm({
        selectedProjectId: '',
        selectedDepartmentId: ''
      });
      setSearchTerm('');
      setValidationErrors([]);
      setValidationWarnings([]);
    }
  }, [isOpen, projectId, departmentId]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProject = projects.find(p => p.id === form.selectedProjectId) || 
    (projectId ? { id: projectId, name: 'Selected Project' } as Project : null);
  const selectedDepartment = departments.find(d => d.id === form.selectedDepartmentId);

  const validateAssignment = () => {
    setValidationErrors([]);
    setValidationWarnings([]);

    // Check if data is still loading
    if (loadingProjects || loadingDepartments) {
      setValidationErrors(['Please wait for data to load.']);
      return false;
    }

    if (!form.selectedProjectId || !form.selectedDepartmentId) {
      setValidationErrors(['Please select both a project and department.']);
      return false;
    }

    if (!userProfile) {
      setValidationErrors(['User profile not found.']);
      return false;
    }

    const project = projects.find(p => p.id === form.selectedProjectId);
    const department = departments.find(d => d.id === form.selectedDepartmentId);
    
    // Additional check for when departmentId is provided as prop but department not found
    if (form.selectedDepartmentId && !department) {
      setValidationErrors(['Department not found. Please select a valid department.']);
      return false;
    }

    // Validate user permissions
    const permissionValidation = validateUserPermissions(
      userProfile.role || 'member',
      project || null,
      userProfile.id
    );

    if (!permissionValidation.isValid) {
      setValidationErrors(permissionValidation.errors);
      return false;
    }

    // Validate department
    const departmentValidation = validateDepartmentForProjects(department || null);
    if (!departmentValidation.isValid) {
      setValidationErrors(departmentValidation.errors);
      return false;
    }

    if (departmentValidation.warnings) {
      setValidationWarnings(prev => [...prev, ...departmentValidation.warnings!]);
    }

    // Validate project assignment
    const assignmentValidation = validateProjectAssignment(
      project || null,
      form.selectedDepartmentId,
      userProfile.id
    );

    if (!assignmentValidation.isValid) {
      setValidationErrors(assignmentValidation.errors);
      return false;
    }

    if (assignmentValidation.warnings) {
      setValidationWarnings(prev => [...prev, ...assignmentValidation.warnings!]);
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAssignment()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const sanitizedInput = sanitizeProjectDepartmentInput({
        projectId: form.selectedProjectId,
        departmentId: form.selectedDepartmentId,
        userId: userProfile!.id
      });
      
      await ProjectService.assignProjectToDepartment(
        sanitizedInput.projectId,
        sanitizedInput.departmentId,
        sanitizedInput.userId
      );

      toast({
        title: '✅ Project Assigned',
        description: `Project has been successfully assigned to the department.`,
      });

      onSuccess();
      onClose();
      
      // Reset form
      setValidationErrors([]);
      setValidationWarnings([]);
    } catch (error) {
      console.error('Error assigning project:', error);
      toast({
        title: '❌ Assignment Failed',
        description: error instanceof Error ? error.message : 'Failed to assign project to department. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg break-words">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span>Assign Project to Department</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <div className="flex-1 space-y-4 sm:space-y-6 overflow-y-auto pr-2">
            
            {/* Project Selection */}
            {!projectId && (
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold text-primary border-b border-border pb-1">
                  Select Project
                </h3>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>

                  {loadingProjects ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading projects...</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filteredProjects.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No unassigned projects found</p>
                        </div>
                      ) : (
                        filteredProjects.map((project) => (
                          <div
                            key={project.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                              form.selectedProjectId === project.id ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                            onClick={() => setForm(prev => ({ ...prev, selectedProjectId: project.id }))}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-sm truncate">{project.name}</h4>
                                  <Badge className={`text-xs ${getProjectStatusColor(project.status)}`}>
                                    {project.status}
                                  </Badge>
                                  <Badge className={`text-xs ${getPriorityColor(project.priority)}`}>
                                    {project.priority}
                                  </Badge>
                                </div>
                                {project.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {project.description}
                                  </p>
                                )}
                                <div className="flex items-center space-x-2 mt-2">
                                  <span className="text-xs text-muted-foreground">Progress: {project.progress}%</span>
                                  <div className="flex-1 bg-muted rounded-full h-1.5">
                                    <div 
                                      className="bg-primary h-1.5 rounded-full transition-all" 
                                      style={{ width: `${project.progress}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              {form.selectedProjectId === project.id && (
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Department Selection */}
            {!departmentId ? (
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold text-primary border-b border-border pb-1">
                  Select Department
                </h3>
                
                {loadingDepartments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading departments...</span>
                  </div>
                ) : (
                  <Select
                    value={form.selectedDepartmentId}
                    onValueChange={(value) => setForm(prev => ({ ...prev, selectedDepartmentId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4" />
                            <span>{department.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {department.memberCount} members
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold text-primary border-b border-border pb-1">
                  Target Department
                </h3>
                {loadingDepartments ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading department...</span>
                  </div>
                ) : selectedDepartment ? (
                  <div className="p-3 border rounded-lg bg-primary/5 border-primary">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-medium">{selectedDepartment.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedDepartment.memberCount} members
                      </Badge>
                      <Badge className={`text-xs ${
                        selectedDepartment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedDepartment.status}
                      </Badge>
                    </div>
                    {selectedDepartment.description && (
                      <p className="text-xs text-muted-foreground mt-1">{selectedDepartment.description}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 border rounded-lg bg-red-50 border-red-200">
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Department not found</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">The specified department could not be loaded.</p>
                  </div>
                )}
              </div>
            )}

            {/* Assignment Summary */}
            {(selectedProject && selectedDepartment) && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Assignment Summary</span>
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Project:</strong> {selectedProject.name}</p>
                  <p><strong>Department:</strong> {selectedDepartment.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Warnings</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {validationWarnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !form.selectedProjectId || !form.selectedDepartmentId || validationErrors.length > 0}
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Assigning...
                </>
              ) : (
                'Assign Project'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}