'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ProjectService } from '@/lib/project-service';
import { FolderPlus, Calendar, Target } from 'lucide-react';

interface ProjectCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  userId: string;
  onProjectCreated: (projectId: string) => void;
}

interface ProjectFormData {
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  visibility: 'public' | 'private' | 'restricted';
}

export function ProjectCreateDialog({
  isOpen,
  onClose,
  workspaceId,
  userId,
  onProjectCreated
}: ProjectCreateDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    visibility: 'public'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Project name is required.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newProjectId = await ProjectService.createProject({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        workspaceId: workspaceId,
        teamId: '', // Will be updated when teams are assigned
        ownerId: userId,
        status: formData.status,
        priority: formData.priority,
        tags: [],
        comments: []
      });

      toast({
        title: 'Success',
        description: 'Project created successfully.'
      });

      onProjectCreated(newProjectId);
      handleClose();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      visibility: 'public'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <FolderPlus className="w-4 h-4 text-primary" />
            </div>
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Create a new project that can be assigned to cost centers for better organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-sm font-medium">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Website Redesign Project"
              className="h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="project-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the project goals and objectives..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-status" className="text-sm font-medium">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'planning' | 'active' | 'completed' | 'archived') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Planning
                    </div>
                  </SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-priority" className="text-sm font-medium">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger className="h-10">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-visibility" className="text-sm font-medium">Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value: 'public' | 'private' | 'restricted') => 
                setFormData({ ...formData, visibility: value })
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Visible to all workspace members</SelectItem>
                <SelectItem value="private">Private - Only visible to project members</SelectItem>
                <SelectItem value="restricted">Restricted - Custom access control</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter className="gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4" />
                Create Project
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}