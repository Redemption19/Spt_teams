'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BudgetTrackingService } from '@/lib/budget-tracking-service';
import { Building, Wallet, Calendar, User, Briefcase, FolderOpen, Globe, Plus } from 'lucide-react';
import { ProjectService } from '@/lib/project-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { ProjectCreateDialog } from './ProjectCreateDialog';
import type { Department, User as UserType, Project, Workspace } from './types';

interface CreateFormData {
  name: string;
  code: string;
  description: string;
  departmentId: string;
  branchId: string;
  managerId: string;
  projectId: string;
  budget: string;
  budgetPeriod: 'monthly' | 'quarterly' | 'yearly';
  workspaceId: string;
}

interface CostCenterCreateFormProps {
  departments: Department[];
  users: UserType[];
  workspaceId: string;
  userRole: string;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CostCenterCreateForm({
  departments,
  users,
  workspaceId,
  userRole,
  userId,
  onSuccess,
  onCancel
}: CostCenterCreateFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<Workspace[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [formData, setFormData] = useState<CreateFormData>({
    name: '',
    code: '',
    description: '',
    departmentId: '',
    branchId: '',
    managerId: '',
    projectId: '',
    budget: '',
    budgetPeriod: 'quarterly',
    workspaceId: workspaceId
  });

  // Load available workspaces based on user role
  useEffect(() => {
    const loadWorkspaces = async () => {
      setLoadingWorkspaces(true);
      try {
        if (userRole === 'owner') {
          // Owners can see all accessible workspaces
          const { mainWorkspaces, subWorkspaces } = await WorkspaceService.getUserAccessibleWorkspaces(userId);
          const allWorkspaces = [...mainWorkspaces];
          Object.values(subWorkspaces).forEach(subWsList => {
            allWorkspaces.push(...subWsList);
          });
          setAvailableWorkspaces(allWorkspaces);
        } else if (userRole === 'admin') {
          // Admins can see workspaces where they have admin access
          const { mainWorkspaces, subWorkspaces, userRoles } = await WorkspaceService.getUserAccessibleWorkspaces(userId);
          const allWorkspaces = [...mainWorkspaces];
          Object.values(subWorkspaces).forEach(subWsList => {
            allWorkspaces.push(...subWsList);
          });
          const adminWorkspaces = allWorkspaces.filter(ws => {
            const userWorkspaceRole = userRoles[ws.id];
            return userWorkspaceRole && (userWorkspaceRole === 'admin' || userWorkspaceRole === 'owner');
          });
          setAvailableWorkspaces(adminWorkspaces);
        } else {
          // Members can only use current workspace
          const currentWorkspace = await WorkspaceService.getWorkspace(workspaceId);
          if (currentWorkspace) {
            setAvailableWorkspaces([currentWorkspace]);
          }
        }
      } catch (error) {
        console.error('Error loading workspaces:', error);
        toast({
          title: 'Error',
          description: 'Failed to load workspaces.',
          variant: 'destructive'
        });
      } finally {
        setLoadingWorkspaces(false);
      }
    };

    loadWorkspaces();
  }, [userId, userRole, workspaceId, toast]);

  // Load projects when workspace changes
  useEffect(() => {
    const loadProjects = async () => {
      if (!formData.workspaceId) return;
      
      setLoadingProjects(true);
      try {
        const workspaceProjects = await ProjectService.getWorkspaceProjects(formData.workspaceId);
        setProjects(workspaceProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects.',
          variant: 'destructive'
        });
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [formData.workspaceId, toast]);

  const handleProjectCreated = (projectId: string) => {
    setFormData({ ...formData, projectId });
    // Reload projects to include the new one
    if (formData.workspaceId) {
      const reloadProjects = async () => {
        setLoadingProjects(true);
        try {
          const workspaceProjects = await ProjectService.getWorkspaceProjects(formData.workspaceId);
          setProjects(workspaceProjects);
        } catch (error) {
          console.error('Error reloading projects:', error);
        } finally {
          setLoadingProjects(false);
        }
      };
      reloadProjects();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name and code are required fields.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await BudgetTrackingService.createCostCenter(formData.workspaceId, {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim() || undefined,
        departmentId: formData.departmentId || undefined,
        branchId: formData.branchId && formData.branchId !== 'none' ? formData.branchId : undefined,
        managerId: formData.managerId || undefined,
        projectId: formData.projectId || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        budgetPeriod: formData.budgetPeriod,
        isActive: true
      });

      toast({
        title: 'Success',
        description: 'Cost center created successfully.'
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating cost center:', error);
      toast({
        title: 'Error',
        description: 'Failed to create cost center. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="card-enhanced w-full">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border p-3 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 sm:w-10 h-8 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg sm:text-xl truncate">Create New Cost Center</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Set up a new cost center to track budgets and expenses across your organization
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Workspace Selection */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
              <Globe className="w-3 sm:w-4 h-3 sm:h-4 text-primary" />
              Workspace Selection
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="workspace" className="text-xs sm:text-sm font-medium">
                Target Workspace <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.workspaceId}
                onValueChange={(value) => setFormData({ ...formData, workspaceId: value, projectId: '' })}
                disabled={loadingWorkspaces}
              >
                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm touch-manipulation">
                  <SelectValue placeholder={loadingWorkspaces ? "Loading workspaces..." : "Select workspace"} />
                </SelectTrigger>
                <SelectContent>
                  {availableWorkspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      <div className="flex items-center gap-2">
                        <Building className="w-3 sm:w-4 h-3 sm:h-4" />
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm">{workspace.name}</span>
                          {workspace.workspaceType === 'sub' && (
                            <span className="text-xs text-muted-foreground">Sub-workspace</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
              <Building className="w-3 sm:w-4 h-3 sm:h-4 text-primary" />
              Basic Information
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm font-medium">
                  Cost Center Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Marketing Department"
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                  required
                />
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="code" className="text-xs sm:text-sm font-medium">
                  Cost Center Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., MKT-001"
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="description" className="text-xs sm:text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the cost center purpose and responsibilities..."
                rows={3}
                className="resize-none text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Budget Information */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
              <Wallet className="w-3 sm:w-4 h-3 sm:h-4 text-primary" />
              Budget Information
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="budget" className="text-xs sm:text-sm font-medium">Budget Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs sm:text-sm">₵</span>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="50000"
                    className="h-9 sm:h-10 pl-8 text-xs sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="budgetPeriod" className="text-xs sm:text-sm font-medium">Budget Period</Label>
                <Select
                  value={formData.budgetPeriod}
                  onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => 
                    setFormData({ ...formData, budgetPeriod: value })
                  }
                >
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 sm:w-4 h-3 sm:h-4" />
                        Monthly
                      </div>
                    </SelectItem>
                    <SelectItem value="quarterly">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 sm:w-4 h-3 sm:h-4" />
                        Quarterly
                      </div>
                    </SelectItem>
                    <SelectItem value="yearly">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 sm:w-4 h-3 sm:h-4" />
                        Yearly
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Assignment Information */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
              <User className="w-3 sm:w-4 h-3 sm:h-4 text-primary" />
              Assignment
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="department" className="text-xs sm:text-sm font-medium">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm touch-manipulation">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3 sm:w-4 h-3 sm:h-4" />
                          {dept.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="manager" className="text-xs sm:text-sm font-medium">Manager</Label>
                <Select
                  value={formData.managerId}
                  onValueChange={(value) => setFormData({ ...formData, managerId: value })}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm touch-manipulation">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Manager</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-3 sm:w-4 h-3 sm:h-4" />
                          {user.name || user.email}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="project" className="text-xs sm:text-sm font-medium">Project (Optional)</Label>
                {formData.workspaceId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProjectDialog(true)}
                    className="h-6 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                    disabled={loadingProjects}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">New Project</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                )}
              </div>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                disabled={loadingProjects || !formData.workspaceId}
              >
                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm touch-manipulation">
                  <SelectValue 
                    placeholder={
                      !formData.workspaceId 
                        ? "Select a workspace first" 
                        : loadingProjects 
                          ? "Loading projects..." 
                          : "Select project"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-3 sm:w-4 h-3 sm:h-4" />
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm">{project.name}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {project.status} • {project.priority} priority
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projects.length === 0 && formData.workspaceId && !loadingProjects && (
                <p className="text-xs text-muted-foreground">
                  No projects available in this workspace. <button type="button" onClick={() => setShowProjectDialog(true)} className="text-primary hover:underline">Create one</button>
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-w-[100px] h-9 sm:h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name.trim() || !formData.code.trim()}
              className="w-full sm:w-auto min-w-[140px] h-9 sm:h-10 text-xs sm:text-sm bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Creating...</span>
                  <span className="sm:hidden">Creating</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Building className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="hidden sm:inline">Create Cost Center</span>
                  <span className="sm:hidden">Create</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      
      {/* Project Creation Dialog */}
      <ProjectCreateDialog
        isOpen={showProjectDialog}
        onClose={() => setShowProjectDialog(false)}
        workspaceId={formData.workspaceId}
        userId={userId}
        onProjectCreated={handleProjectCreated}
      />
    </Card>
  );
}