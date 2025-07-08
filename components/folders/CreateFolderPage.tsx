'use client';

import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  FolderOpen,
  Shield,
  Users,
  Globe,
  Lock,
  ArrowLeft,
  Save,
  X,
  Tag,
  Settings,
  Eye
} from 'lucide-react';

import { Folder, Team } from '@/lib/types';
import { useAllowedFolderTypes, useFolderCreationLimits } from '@/lib/rbac-hooks';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';

// --- Helper Functions (Moved outside component) ---

const getVisibilityIcon = (visibility: string) => {
  switch (visibility) {
    case 'public': return <Globe className="h-4 w-4" />;
    case 'team': return <Users className="h-4 w-4" />;
    case 'project': return <FolderOpen className="h-4 w-4" />;
    default: return <Lock className="h-4 w-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'team': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    case 'personal': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    case 'project': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
    case 'shared': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
    case 'member': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300';
    case 'member-assigned': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
};

// --- CreateFolderPage Component ---

interface CreateFolderPageProps {
  onBack: () => void;
  onSubmit: (folderData: any) => Promise<void>;
  teams: Team[];
  submitting: boolean;
  folder?: Folder | null;
}

export default function CreateFolderPage({
  onBack,
  onSubmit,
  teams,
  submitting,
  folder
}: CreateFolderPageProps) {
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
      // Reset form when no folder is being edited
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
  }, [folder]); // Dependency on 'folder' prop to reset/load form data

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  }, [onSubmit, form]); // Dependencies: onSubmit prop and current form state

  const addTag = useCallback(() => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  }, [newTag, form.tags]); // Dependencies: newTag state and form.tags array

  const removeTag = useCallback((tagToRemove: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []); // No dependencies needed as `prev` is used for state update

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 max-w-7xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-9 px-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Folders</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {folder ? 'Edit Folder' : 'Create New Folder'}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onBack}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Column 1: Basic Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            <div className="flex items-center space-x-2">
                              <Badge className={`text-xs ${getTypeColor(type)}`}>
                                {type}
                              </Badge>
                            </div>
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
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tags Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Tag className="h-5 w-5 text-primary" />
                    <span>Tags & Labels</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      <div className="flex flex-wrap gap-2">
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
                </CardContent>
              </Card>
            </div>

            {/* Column 2: Access & Permissions */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span>Access & Permissions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>{team.name}</span>
                              </div>
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

                  <div className="p-4 bg-muted rounded-lg border">
                    <div className="flex items-center space-x-2 mb-2">
                      {getVisibilityIcon(form.visibility)}
                      <span className="font-medium capitalize">{form.visibility} Folder</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {form.visibility === 'private' && 'Only you can access this folder'}
                      {form.visibility === 'team' && 'Team members can access this folder'}
                      {form.visibility === 'project' && 'Project members can access this folder'}
                      {form.visibility === 'public' && 'All workspace members can view this folder'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Folder Limits Info */}
              {!folder && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400 mb-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Folder Limits</span>
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        You can create {folderLimits.remaining} more folders
                        ({folderLimits.currentCount}/{folderLimits.maxFolders} used)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Column 3: Settings & Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <span>Folder Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
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

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
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

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
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

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
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
                </CardContent>
              </Card>

              {/* Preview Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-primary" />
                    <span>Preview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Name:</span>
                        <span className="font-medium text-sm">{form.name || 'Untitled Folder'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Type:</span>
                        <Badge className={`text-xs ${getTypeColor(form.type)}`}>{form.type}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Visibility:</span>
                        <div className="flex items-center space-x-1">
                          {getVisibilityIcon(form.visibility)}
                          <span className="capitalize text-sm">{form.visibility}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Subfolders:</span>
                        <span className="text-sm">{form.settings.allowSubfolders ? 'Allowed' : 'Disabled'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tags:</span>
                        <span className="text-sm">{form.tags.length} tag{form.tags.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={onBack} className="h-11 px-6 order-2 sm:order-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !form.name || (!folder && !folderLimits.canCreateMore)}
              className="h-11 px-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 order-1 sm:order-2"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              {folder ? 'Update Folder' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
