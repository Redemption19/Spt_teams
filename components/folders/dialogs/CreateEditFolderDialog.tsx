'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Loader2, FolderOpen, Shield, Users, Globe, Lock } from 'lucide-react';

import { Folder, Team } from '@/lib/types';
import { useAllowedFolderTypes, useFolderCreationLimits } from '@/lib/rbac-hooks';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';

interface CreateEditFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (folderData: any) => Promise<void>;
  folder?: Folder | null;
  teams: Team[];
  submitting: boolean;
}

export default function CreateEditFolderDialog({
  isOpen,
  onClose,
  onSubmit,
  folder,
  teams,
  submitting
}: CreateEditFolderDialogProps) {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  const allowedFolderTypes = useAllowedFolderTypes();
  const folderLimits = useFolderCreationLimits();

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'personal' as 'team' | 'personal' | 'project' | 'shared' | 'member' | 'member-assigned',
    teamId: '',
    visibility: 'private' as 'private' | 'team' | 'project' | 'public',
    tags: [] as string[],
    settings: {
      allowSubfolders: true,
      maxSubfolders: 50,
      notifyOnUpload: false,
      requireApproval: false,
      autoArchive: false,
    }
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (folder) {
      setForm({
        name: folder.name,
        description: folder.description || '',
        type: folder.type,
        teamId: folder.teamId || '',
        visibility: folder.visibility,
        tags: folder.tags || [],
        settings: {
          allowSubfolders: folder.settings?.allowSubfolders ?? true,
          maxSubfolders: folder.settings?.maxSubfolders ?? 50,
          notifyOnUpload: folder.settings?.notifyOnUpload ?? false,
          requireApproval: folder.settings?.requireApproval ?? false,
          autoArchive: folder.settings?.autoArchive ?? false,
        }
      });
    } else {
      setForm({
        name: '',
        description: '',
        type: 'personal',
        teamId: '',
        visibility: 'private',
        tags: [],
        settings: {
          allowSubfolders: true,
          maxSubfolders: 50,
          notifyOnUpload: false,
          requireApproval: false,
          autoArchive: false,
        }
      });
    }
  }, [folder, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getVisibilityIcon = () => {
    switch (form.visibility) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'team': return <Users className="h-4 w-4" />;
      case 'project': return <FolderOpen className="h-4 w-4" />;
      default: return <Lock className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-hidden">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <span>{folder ? 'Edit Folder' : 'Create New Folder'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
            
            {/* Column 1: Basic Information */}
            <div className="space-y-4 overflow-y-auto">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-primary border-b border-border pb-1">
                  Basic Information
                </h3>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Folder Name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter folder name"
                      required
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium">Folder Type *</Label>
                    <Select 
                      value={form.type} 
                      onValueChange={(value) => setForm(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedFolderTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            <span className="capitalize">{type}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the folder's purpose"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-foreground border-b border-border pb-1">
                  Tags & Labels
                </h4>
                
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="h-9"
                    />
                    <Button type="button" variant="outline" onClick={addTag} className="h-9 px-3">
                      Add
                    </Button>
                  </div>
                  
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {form.tags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 text-xs"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Access & Permissions */}
            <div className="space-y-4 overflow-y-auto">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-primary border-b border-border pb-1">
                  Access & Permissions
                </h3>
                
                <div className="space-y-3">
                  {teams.length > 0 && (form.type === 'team' || form.type === 'project') && (
                    <div className="space-y-2">
                      <Label htmlFor="team" className="text-sm font-medium">Team Assignment</Label>
                      <Select 
                        value={form.teamId} 
                        onValueChange={(value) => setForm(prev => ({ ...prev, teamId: value }))}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map(team => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="visibility" className="text-sm font-medium">Visibility Level</Label>
                    <Select 
                      value={form.visibility} 
                      onValueChange={(value) => setForm(prev => ({ ...prev, visibility: value as any }))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">
                          <div className="flex items-center space-x-2">
                            <Lock className="h-4 w-4" />
                            <span>Private</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="team">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Team</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="project">
                          <div className="flex items-center space-x-2">
                            <FolderOpen className="h-4 w-4" />
                            <span>Project</span>
                          </div>
                        </SelectItem>
                        {(userRole === 'owner' || userRole === 'admin') && (
                          <SelectItem value="public">
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4" />
                              <span>Public</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-3 bg-muted rounded-lg border">
                    <div className="flex items-center space-x-2 mb-1">
                      {getVisibilityIcon()}
                      <span className="font-medium capitalize text-sm">{form.visibility} Folder</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {form.visibility === 'private' && 'Only you can access this folder'}
                      {form.visibility === 'team' && 'Team members can access this folder'}
                      {form.visibility === 'project' && 'Project members can access this folder'}
                      {form.visibility === 'public' && 'All workspace members can view this folder'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Folder Limits Info */}
              {!folder && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400 mb-1">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium text-sm">Folder Limits</span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    You can create {folderLimits.remaining} more folders 
                    ({folderLimits.currentCount}/{folderLimits.maxFolders} used)
                  </p>
                </div>
              )}
            </div>

            {/* Column 3: Folder Settings */}
            <div className="space-y-4 overflow-y-auto">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-primary border-b border-border pb-1">
                  Folder Settings
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Allow Subfolders</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow creation of nested folders
                      </p>
                    </div>
                    <Switch
                      checked={form.settings.allowSubfolders}
                      onCheckedChange={(checked) => 
                        setForm(prev => ({ 
                          ...prev, 
                          settings: { ...prev.settings, allowSubfolders: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Notify on Upload</Label>
                      <p className="text-xs text-muted-foreground">
                        Send notifications when files are uploaded
                      </p>
                    </div>
                    <Switch
                      checked={form.settings.notifyOnUpload}
                      onCheckedChange={(checked) => 
                        setForm(prev => ({ 
                          ...prev, 
                          settings: { ...prev.settings, notifyOnUpload: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Require Approval</Label>
                      <p className="text-xs text-muted-foreground">
                        Require approval before file uploads
                      </p>
                    </div>
                    <Switch
                      checked={form.settings.requireApproval}
                      onCheckedChange={(checked) => 
                        setForm(prev => ({ 
                          ...prev, 
                          settings: { ...prev.settings, requireApproval: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Auto Archive</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically archive old files
                      </p>
                    </div>
                    <Switch
                      checked={form.settings.autoArchive}
                      onCheckedChange={(checked) => 
                        setForm(prev => ({ 
                          ...prev, 
                          settings: { ...prev.settings, autoArchive: checked }
                        }))
                      }
                    />
                  </div>

                  {form.settings.allowSubfolders && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Max Subfolders</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={form.settings.maxSubfolders}
                        onChange={(e) => 
                          setForm(prev => ({ 
                            ...prev, 
                            settings: { ...prev.settings, maxSubfolders: parseInt(e.target.value) || 50 }
                          }))
                        }
                        className="h-9"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Section - Fixed positioning */}
              <div className="p-3 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20">
                <h4 className="font-medium text-sm mb-2 text-primary">Preview</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline" className="text-xs h-5">{form.type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visibility:</span>
                    <span className="capitalize text-xs">{form.visibility}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subfolders:</span>
                    <span className="text-xs">{form.settings.allowSubfolders ? 'Allowed' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tags:</span>
                    <span className="text-xs">{form.tags.length} tag{form.tags.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border mt-4">
            <Button type="button" variant="outline" onClick={onClose} className="h-10 px-6 order-2 sm:order-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !form.name || !folderLimits.canCreateMore}
              className="h-10 px-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 order-1 sm:order-2"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {folder ? 'Update Folder' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
