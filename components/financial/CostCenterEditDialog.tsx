'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, FolderOpen, Globe, Briefcase, User as UserIcon } from 'lucide-react';
import { ProjectService } from '@/lib/project-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { useToast } from '@/hooks/use-toast';
import type { CostCenterWithDetails, EditFormData, Department, User, Project, Workspace } from './types';

interface CostCenterEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  costCenter: CostCenterWithDetails | null;
  editFormData: EditFormData;
  setEditFormData: (data: EditFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  departments: Department[];
  users: User[];
  userRole: string;
  userId: string;
  isSubmitting: boolean;
}

export function CostCenterEditDialog({
  isOpen,
  onClose,
  costCenter,
  editFormData,
  setEditFormData,
  onSubmit,
  departments,
  users,
  userRole,
  userId,
  isSubmitting
}: CostCenterEditDialogProps) {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<Workspace[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

  // Load available workspaces based on user role
  useEffect(() => {
    if (!isOpen) return;
    
    const loadWorkspaces = async () => {
      setLoadingWorkspaces(true);
      try {
        if (userRole === 'owner') {
          const { mainWorkspaces, subWorkspaces } = await WorkspaceService.getUserAccessibleWorkspaces(userId);
          const allWorkspaces = [...mainWorkspaces];
          Object.values(subWorkspaces).forEach(subWsList => {
            allWorkspaces.push(...subWsList);
          });
          setAvailableWorkspaces(allWorkspaces);
        } else if (userRole === 'admin') {
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
          const currentWorkspace = await WorkspaceService.getWorkspace(editFormData.workspaceId);
          if (currentWorkspace) {
            setAvailableWorkspaces([currentWorkspace]);
          }
        }
      } catch (error) {
        console.error('Error loading workspaces:', error);
      } finally {
        setLoadingWorkspaces(false);
      }
    };

    loadWorkspaces();
  }, [isOpen, userId, userRole, editFormData.workspaceId]);

  // Load projects when workspace changes
  useEffect(() => {
    if (!isOpen || !editFormData.workspaceId) return;
    
    const loadProjects = async () => {
      setLoadingProjects(true);
      try {
        const workspaceProjects = await ProjectService.getWorkspaceProjects(editFormData.workspaceId);
        setProjects(workspaceProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [isOpen, editFormData.workspaceId]);

  if (!isOpen || !costCenter) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">Edit Cost Center</h2>
              <p className="text-sm text-muted-foreground">Update cost center information and settings</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              ×
            </Button>
          </div>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Workspace Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Globe className="w-4 h-4 text-primary" />
              Workspace
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workspace" className="text-sm font-medium">
                Target Workspace <span className="text-destructive">*</span>
              </Label>
              <Select
                value={editFormData.workspaceId}
                onValueChange={(value) => setEditFormData({ ...editFormData, workspaceId: value, projectId: editFormData.projectId || '' })}
                disabled={loadingWorkspaces}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={loadingWorkspaces ? "Loading workspaces..." : "Select workspace"} />
                </SelectTrigger>
                <SelectContent>
                  {availableWorkspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span>{workspace.name}</span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Cost Center Name *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g., Marketing Department"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Cost Center Code *</Label>
              <Input
                id="edit-code"
                value={editFormData.code}
                onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                placeholder="e.g., MKT-001"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              placeholder="Brief description of the cost center purpose...."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-budget">Budget Amount *</Label>
              <Input
                id="edit-budget"
                type="number"
                step="0.01"
                min="0"
                value={editFormData.budget}
                onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                placeholder="50000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-budgetPeriod">Budget Period *</Label>
              <Select
                value={editFormData.budgetPeriod}
                onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => 
                  setEditFormData({ ...editFormData, budgetPeriod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editFormData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => setEditFormData({ ...editFormData, isActive: value === 'active' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department</Label>
              <Select
                value={editFormData.departmentId}
                onValueChange={(value) => setEditFormData({ ...editFormData, departmentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manager">Manager</Label>
              <Select
                value={editFormData.managerId}
                onValueChange={(value) => setEditFormData({ ...editFormData, managerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-project" className="text-sm font-medium">Project (Optional)</Label>
            <Select
              value={editFormData.projectId || 'none'}
              onValueChange={(value) => setEditFormData({ ...editFormData, projectId: value === 'none' ? '' : value })}
              disabled={loadingProjects || !editFormData.workspaceId}
            >
              <SelectTrigger className="h-10">
                <SelectValue 
                  placeholder={
                    !editFormData.workspaceId 
                      ? "Select a workspace first" 
                      : loadingProjects 
                        ? "Loading projects..." 
                        : "Select project"
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    No Project
                  </div>
                </SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span>{project.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {project.status} • {project.priority} priority
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {projects.length === 0 && editFormData.workspaceId && !loadingProjects && (
              <p className="text-xs text-muted-foreground">
                No projects available in this workspace.
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-6 border-t border-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !editFormData.name || !editFormData.code}
              className="min-w-[140px] bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </div>
              ) : (
                'Update Cost Center'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 