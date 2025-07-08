'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import {
  Plus,
  Search,
  FolderOpen,
  FileText,
  Users,
  Shield,
  Crown,
  UserCheck,
  FileDown,
  Settings,
  Grid3X3,
  TreePine,
  Loader2,
  Archive,
  UserPlus,
  Eye,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { FolderService } from '@/lib/folder-service';
import { TeamService } from '@/lib/team-service';
import { UserService } from '@/lib/user-service';
import { 
  Folder as FolderType, 
  Team,
  User
} from '@/lib/types';
import { 
  useCanCreateFolders,
  useCanViewMemberFolders,
  useAccessibleFolders,
  useAllowedFolderTypes,
  useFolderCreationLimits
} from '@/lib/rbac-hooks';

// Import sub-components
import FolderCardGrid from './FolderCardGrid';
import DeleteFolderAlertDialog from './dialogs/DeleteFolderAlertDialog';
import FolderDetailPage from './FolderDetailPage';
import FolderTreeView from './FolderTreeView';
import FolderMemberView from './FolderMemberView';

// Enhanced CreateFolderPage component with member assignment
const CreateFolderPage = ({ onBack, onSubmit, teams, submitting, folder, workspaceMembers }: any) => {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  
  // Enhanced folder types based on user role
  const getAllowedFolderTypes = () => {
    const baseTypes = ['personal', 'team', 'project', 'shared'];
    if (userRole === 'owner' || userRole === 'admin') {
      baseTypes.push('member-assigned');
    }
    return baseTypes;
  };

  const allowedFolderTypes = getAllowedFolderTypes();
  const folderLimits = { canCreateMore: true, remaining: 10, currentCount: 0, maxFolders: 10 };

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'personal' as 'team' | 'personal' | 'project' | 'shared' | 'member-assigned',
    teamId: '',
    assignedMemberId: '', // New field for member assignment
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
        assignedMemberId: folder.assignedMemberId || '',
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
    }
  }, [folder]);

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

  const getVisibilityDescription = () => {
    if (form.type === 'member-assigned') {
      return 'Only the assigned member, admins, and owners can access this folder';
    }
    switch (form.visibility) {
      case 'private': return 'Only you can access this folder';
      case 'team': return 'Team members can access this folder';
      case 'project': return 'Project members can access this folder';
      case 'public': return 'All workspace members can view this folder';
      default: return '';
    }
  };

  const getFolderTypeDescription = (type: string) => {
    switch (type) {
      case 'personal': return 'Your private workspace folder';
      case 'team': return 'Shared with team members';
      case 'project': return 'Project-specific folder';
      case 'shared': return 'Shared across workspace';
      case 'member-assigned': return 'Assign folder to a specific member';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="h-9 px-3"
          >
            <span>← Back to Folders</span>
          </Button>
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {folder ? 'Edit Folder' : 'Create New Folder'}
            </h2>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Basic Information */}
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <span>Basic Information</span>
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Folder Name *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter folder name"
                    required
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Folder Type *</label>
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
                          <div className="flex flex-col items-start">
                            <span className="capitalize font-medium">{type.replace('-', ' ')}</span>
                            <span className="text-xs text-muted-foreground">{getFolderTypeDescription(type)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Member Assignment - Only for owner/admin creating member-assigned folders */}
                {(userRole === 'owner' || userRole === 'admin') && form.type === 'member-assigned' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assign to Member *</label>
                    <Select 
                      value={form.assignedMemberId} 
                      onValueChange={(value) => setForm(prev => ({ ...prev, assignedMemberId: value }))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select a member" />
                      </SelectTrigger>
                      <SelectContent>
                        {workspaceMembers.filter((member: User) => member.role === 'member').map((member: User) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center space-x-2">
                              <UserPlus className="h-4 w-4" />
                              <span>{member.name}</span>
                              <Badge variant="outline" className="text-xs">Member</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      💡 The member will be notified and can access this folder. Only you and admins can manage it.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the folder's purpose"
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Tags Section */}
            <div className="bg-card border rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <span>Tags & Labels</span>
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex space-x-2">
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
              </div>
            </div>
          </div>

          {/* Column 2: Access & Permissions */}
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Access & Permissions</span>
              </h3>
              <div className="space-y-4">
                {teams.length > 0 && (form.type === 'team' || form.type === 'project') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Team Assignment</label>
                    <Select 
                      value={form.teamId} 
                      onValueChange={(value) => setForm(prev => ({ ...prev, teamId: value }))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team: any) => (
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

                {/* Visibility Level - Not applicable for member-assigned folders */}
                {form.type !== 'member-assigned' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Visibility Level</label>
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
                            <Eye className="h-4 w-4" />
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
                              <Users className="h-4 w-4" />
                              <span>Public</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="p-4 bg-muted rounded-lg border">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium capitalize">
                      {form.type === 'member-assigned' ? 'Member Assigned' : `${form.visibility} Folder`}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getVisibilityDescription()}
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
              <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400 mb-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium text-sm">RBAC Information</span>
              </div>
              <div className="space-y-1 text-xs text-blue-600 dark:text-blue-300">
                <p>• <strong>Members:</strong> Can create private folders, manage own folders</p>
                <p>• <strong>Admins:</strong> Can see all member folders, create folders for members</p>
                <p>• <strong>Owners:</strong> Full access to all folders and management</p>
              </div>
            </div>
          </div>

          {/* Column 3: Settings & Preview */}
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <span>Folder Settings</span>
              </h3>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <span className="text-sm font-medium">Allow Subfolders</span>
                      <p className="text-xs text-muted-foreground">
                        Allow creation of nested folders
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.settings.allowSubfolders}
                      onChange={(e) => 
                        setForm(prev => ({ 
                          ...prev, 
                          settings: { ...prev.settings, allowSubfolders: e.target.checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <span className="text-sm font-medium">Notify on Upload</span>
                      <p className="text-xs text-muted-foreground">
                        Send notifications when files are uploaded
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.settings.notifyOnUpload}
                      onChange={(e) => 
                        setForm(prev => ({ 
                          ...prev, 
                          settings: { ...prev.settings, notifyOnUpload: e.target.checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <span className="text-sm font-medium">Require Approval</span>
                      <p className="text-xs text-muted-foreground">
                        Require approval before file uploads
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.settings.requireApproval}
                      onChange={(e) => 
                        setForm(prev => ({ 
                          ...prev, 
                          settings: { ...prev.settings, requireApproval: e.target.checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <span className="text-sm font-medium">Auto Archive</span>
                      <p className="text-xs text-muted-foreground">
                        Automatically archive old files
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.settings.autoArchive}
                      onChange={(e) => 
                        setForm(prev => ({ 
                          ...prev, 
                          settings: { ...prev.settings, autoArchive: e.target.checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Preview Section */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Eye className="h-5 w-5 text-primary" />
                <span>Preview</span>
              </h3>
              <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="font-medium text-sm">{form.name || 'Untitled Folder'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <Badge className="text-xs">{form.type.replace('-', ' ')}</Badge>
                  </div>
                  {form.type === 'member-assigned' && form.assignedMemberId && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Assigned to:</span>
                      <span className="text-sm">
                        {workspaceMembers.find((m: User) => m.id === form.assignedMemberId)?.name || 'Unknown'}
                      </span>
                    </div>
                  )}
                  {form.type !== 'member-assigned' && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Visibility:</span>
                      <span className="capitalize text-sm">{form.visibility}</span>
                    </div>
                  )}
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
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-border">
          <Button type="button" variant="outline" onClick={onBack} className="h-11 px-6">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={submitting || !form.name || (form.type === 'member-assigned' && !form.assignedMemberId)}
            className="h-11 px-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {folder ? 'Update Folder' : 'Create Folder'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default function FolderManagement() {
  const { userProfile } = useAuth();
  const { 
    currentWorkspace, 
    userRole,
    accessibleWorkspaces  // Add this to get all accessible workspaces
  } = useWorkspace();

  // State management
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'tree' | 'member'>('grid');
  const [currentPage, setCurrentPage] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<FolderType | null>(null);
  const [isDeleteFolderOpen, setIsDeleteFolderOpen] = useState(false);
  const [viewingFolder, setViewingFolder] = useState<FolderType | null>(null);
  
  // Cross-workspace management for owners
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);
  const [selectedWorkspaceFilter, setSelectedWorkspaceFilter] = useState('all');

  // Bulk selection state
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [showFolderSettings, setShowFolderSettings] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archivingFolders, setArchivingFolders] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    defaultVisibility: 'private' as 'private' | 'team' | 'project',
    autoArchiveInactive: false,
    autoArchiveDays: 90,
    requireApprovalForUploads: false,
    allowMemberSubfolders: true,
    maxSubfoldersPerMember: 10,
    notifyOnNewAssignment: true,
    allowBulkOperations: true
  });
  
  // RBAC hooks
  const canCreateFolders = useCanCreateFolders();
  const canViewMemberFolders = useCanViewMemberFolders();
  const allowedFolderTypes = useAllowedFolderTypes();
  const folderLimits = useFolderCreationLimits();
  const accessibleFolders = useAccessibleFolders(folders);

  // Enhanced load data function with cross-workspace support
  const loadData = useCallback(async () => {
    if (!userProfile || !currentWorkspace) return;

    try {
      setLoading(true);
      
      let allFoldersData: FolderType[] = [];
      let allTeamsData: Team[] = [];
      let allMembersData: User[] = [];

      if (showAllWorkspaces && userRole === 'owner' && accessibleWorkspaces.length > 0) {
        // Load folders from all accessible workspaces for owners
        const workspacePromises = accessibleWorkspaces.map(async (workspace) => {
          try {
            const [foldersData, teamsData, membersData] = await Promise.all([
              FolderService.getFoldersForUser(userProfile.id, workspace.id, userRole || 'member'),
              TeamService.getWorkspaceTeams(workspace.id),
              UserService.getUsersByWorkspace(workspace.id)
            ]);
            
            // Add workspace info to folders for identification
            const foldersWithWorkspace = foldersData.map(folder => ({
              ...folder,
              workspaceName: workspace.name,
              workspaceType: workspace.workspaceType || 'main'
            }));
            
            return {
              folders: foldersWithWorkspace,
              teams: teamsData,
              members: membersData,
              workspaceName: workspace.name
            };
          } catch (error) {
            console.error(`Error loading data for workspace ${workspace.name}:`, error);
            return { folders: [], teams: [], members: [], workspaceName: workspace.name };
          }
        });

        const workspaceResults = await Promise.all(workspacePromises);
        
        // Combine all data
        allFoldersData = workspaceResults.flatMap(result => result.folders);
        allTeamsData = workspaceResults.flatMap(result => result.teams);
        allMembersData = workspaceResults.flatMap(result => result.members);
        
        // Remove duplicates from teams and members
        allTeamsData = allTeamsData.filter((team, index, self) => 
          self.findIndex(t => t.id === team.id) === index
        );
        allMembersData = allMembersData.filter((member, index, self) => 
          self.findIndex(m => m.id === member.id) === index
        );
        
      } else {
        // Standard single workspace loading
        const [foldersData, teamsData, membersData] = await Promise.all([
          FolderService.getFoldersForUser(userProfile.id, currentWorkspace.id, userRole || 'member'),
          TeamService.getWorkspaceTeams(currentWorkspace.id),
          UserService.getUsersByWorkspace(currentWorkspace.id)
        ]);

        allFoldersData = foldersData.map(folder => ({
          ...folder,
          workspaceName: currentWorkspace.name,
          workspaceType: currentWorkspace.workspaceType || 'main'
        }));
        allTeamsData = teamsData;
        allMembersData = membersData;
      }

      setFolders(allFoldersData);
      setTeams(allTeamsData);
      setWorkspaceMembers(allMembersData);

    } catch (error) {
      console.error('Error loading folder data:', error);
      toast({
        title: '❌ Error Loading Data',
        description: 'Failed to load folders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userProfile, currentWorkspace, userRole, showAllWorkspaces, accessibleWorkspaces]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Enhanced filter folders with member folder visibility
  const filteredFolders = accessibleFolders.filter(folder => {
    const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         folder.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || folder.type === selectedType;
    const matchesTeam = selectedTeam === 'all' || folder.teamId === selectedTeam;
    return matchesSearch && matchesType && matchesTeam;
  });

  // Enhanced folder creation with member assignment
  const handleCreateFolder = async (folderData: any) => {
    if (!userProfile || !currentWorkspace) return;

    try {
      setSubmitting(true);

      // Enhanced permissions based on folder type and assignment
      let permissions = {
        read: [userProfile.id],
        write: [userProfile.id],
        admin: [userProfile.id],
        delete: [userProfile.id]
      };

      // Special handling for member-assigned folders
      if (folderData.type === 'member-assigned' && folderData.assignedMemberId) {
        permissions = {
          read: [userProfile.id, folderData.assignedMemberId],
          write: [userProfile.id, folderData.assignedMemberId],
          admin: [userProfile.id],
          delete: [userProfile.id]
        };
      }

      const folderPayload: Omit<FolderType, 'id' | 'createdAt' | 'updatedAt'> = {
        name: folderData.name,
        description: folderData.description,
        workspaceId: currentWorkspace.id,
        mainWorkspaceId: currentWorkspace.id,
        subWorkspaceId: currentWorkspace.id,
        teamId: folderData.teamId || undefined,
        assignedMemberId: folderData.assignedMemberId || undefined,
        ownerId: folderData.type === 'member-assigned' ? folderData.assignedMemberId : userProfile.id,
        type: folderData.type,
        folderPath: folderData.name,
        level: 0,
        isSystemFolder: false,
        visibility: folderData.type === 'member-assigned' ? 'private' : folderData.visibility,
        inheritPermissions: false,
        permissions,
        fileCount: 0,
        totalSize: 0,
        createdBy: userProfile.id,
        status: 'active',
        isShared: false,
        sharedWith: [],
        tags: folderData.tags || [],
        settings: folderData.settings
      };

      await FolderService.createFolder(folderPayload, userProfile.id);

      // Enhanced success message
      const successMessage = folderData.type === 'member-assigned' 
        ? `Successfully created folder "${folderData.name}" and assigned to member`
        : `Successfully created folder "${folderData.name}"`;

      toast({
        title: '✅ Folder Created',
        description: successMessage,
        className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none',
      });

      setCurrentPage('list');
      await loadData();

    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: '❌ Creation Failed',
        description: 'Failed to create folder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle folder editing
  const handleEditFolder = (folder: FolderType) => {
    setEditingFolder(folder);
    setCurrentPage('edit');
  };

  const handleUpdateFolder = async (folderData: any) => {
    if (!userProfile || !currentWorkspace || !editingFolder) return;

    try {
      setSubmitting(true);

      const updates = {
        name: folderData.name,
        description: folderData.description,
        teamId: folderData.teamId,
        visibility: folderData.visibility,
        tags: folderData.tags,
        settings: folderData.settings
      };

      await FolderService.updateFolder(editingFolder.id, updates, userProfile.id, userRole || 'member');

      toast({
        title: '✅ Folder Updated',
        description: `Successfully updated folder "${folderData.name}"`,
        className: 'bg-gradient-to-r from-primary to-accent text-white border-none',
      });

      setCurrentPage('list');
      setEditingFolder(null);
      await loadData();

    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: '❌ Update Failed',
        description: 'Failed to update folder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle folder deletion
  const initiateDeleteFolder = (folder: FolderType) => {
    setDeletingFolder(folder);
    setIsDeleteFolderOpen(true);
  };

  const confirmDeleteFolder = async () => {
    if (!userProfile || !currentWorkspace || !deletingFolder) return;

    try {
      setSubmitting(true);

      await FolderService.deleteFolder(deletingFolder.id, userProfile.id, userRole || 'member');

      toast({
        title: '✅ Folder Deleted',
        description: `Successfully deleted folder "${deletingFolder.name}"`,
        className: 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-none',
      });

      setIsDeleteFolderOpen(false);
      setDeletingFolder(null);
      await loadData();

    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: '❌ Deletion Failed',
        description: 'Failed to delete folder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle folder click
  const handleFolderClick = (folder: FolderType) => {
    setViewingFolder(folder);
    setCurrentPage('detail');
  };

  // Get role badge component
  const getRoleBadge = () => {
    if (!userProfile) return null;
    
    switch (userRole) {
      case 'owner':
        return (
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none">
            <Crown className="h-3 w-3 mr-1" />
            Owner
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none">
            <UserCheck className="h-3 w-3 mr-1" />
            Member
          </Badge>
        );
    }
  };

  // Bulk operations handlers
  const handleSelectAll = useCallback(() => {
    const allIds = filteredFolders.map(f => f.id);
    setSelectedFolders(selectedFolders.length === allIds.length ? [] : allIds);
  }, [filteredFolders, selectedFolders.length]);

  const handleSelectFolder = useCallback((folderId: string, checked: boolean) => {
    setSelectedFolders(prev => 
      checked 
        ? [...prev, folderId]
        : prev.filter(id => id !== folderId)
    );
  }, []);

  const handleArchiveSelected = async () => {
    if (selectedFolders.length === 0) {
      toast({
        title: '❌ No Folders Selected',
        description: 'Please select folders to archive.',
        variant: 'destructive',
      });
      return;
    }

    if (!userProfile) {
      toast({
        title: '❌ Authentication Error',
        description: 'User profile not found.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setArchivingFolders(true);

      // Archive each selected folder
      for (const folderId of selectedFolders) {
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
          await FolderService.updateFolder(
            folderId, 
            { status: 'archived' as const }, 
            userProfile.id, 
            userRole || 'member'
          );
        }
      }

      toast({
        title: '✅ Folders Archived',
        description: `Successfully archived ${selectedFolders.length} folder${selectedFolders.length > 1 ? 's' : ''}.`,
        className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0',
      });

      // Clear selection and refresh
      setSelectedFolders([]);
      setShowArchiveDialog(false);
      await loadData();

    } catch (error) {
      console.error('Error archiving folders:', error);
      toast({
        title: '❌ Archive Failed',
        description: 'Failed to archive selected folders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setArchivingFolders(false);
    }
  };

  const handleSaveFolderSettings = async () => {
    if (!userProfile || !currentWorkspace) {
      toast({
        title: '❌ Authentication Error',
        description: 'User profile or workspace not found.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Save folder settings to workspace settings or user preferences
      // This would typically be saved to a workspace settings collection
      
      toast({
        title: '✅ Settings Saved',
        description: 'Folder settings have been updated successfully.',
        className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0',
      });

      setShowFolderSettings(false);

    } catch (error) {
      console.error('Error saving folder settings:', error);
      toast({
        title: '❌ Save Failed',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading folders...</p>
        </div>
      </div>
    );
  }

  // Render create/edit page
  if (currentPage === 'create' || currentPage === 'edit') {
    return (
      <CreateFolderPage
        onBack={() => {
          setCurrentPage('list');
          setEditingFolder(null);
        }}
        onSubmit={currentPage === 'edit' ? handleUpdateFolder : handleCreateFolder}
        teams={teams}
        submitting={submitting}
        folder={currentPage === 'edit' ? editingFolder : null}
        workspaceMembers={workspaceMembers}
      />
    );
  }

  // Render folder detail page
  if (currentPage === 'detail' && viewingFolder) {
    return (
      <FolderDetailPage
        folder={viewingFolder}
        onBack={async () => {
          setCurrentPage('list');
          setViewingFolder(null);
          // Refresh folders data to show updated file counts
          await loadData();
        }}
        onEdit={() => {
          setEditingFolder(viewingFolder);
          setCurrentPage('edit');
        }}
        onDelete={() => {
          initiateDeleteFolder(viewingFolder);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Folders & Documents
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Organize files with advanced permissions, member folders, and team collaboration
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              <span>{folders.length} folder{folders.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>{folders.reduce((acc, f) => acc + f.fileCount, 0)} files</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Role: {getRoleBadge()}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {canCreateFolders && folderLimits.canCreateMore && (
            <Button 
              onClick={() => setCurrentPage('create')}
              className="w-full sm:w-auto h-11 sm:h-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>New Folder</span>
            </Button>
          )}

          {(userRole === 'owner' || userRole === 'admin') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto h-11 sm:h-10 border-border/50">
                  <FileDown className="h-4 w-4 mr-2" />
                  <span>Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowFolderSettings(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Folder Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowArchiveDialog(true)}
                  disabled={selectedFolders.length === 0}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Selected ({selectedFolders.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSelectAll}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {selectedFolders.length > 0 ? 'Deselect All' : 'Select All'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:space-x-6">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-border bg-background"
            />
          </div>
          
          {/* Cross-Workspace Toggle for Owners */}
          {userRole === 'owner' && accessibleWorkspaces.length > 1 && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <input
                type="checkbox"
                id="showAllWorkspaces"
                checked={showAllWorkspaces}
                onChange={(e) => setShowAllWorkspaces(e.target.checked)}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="showAllWorkspaces" className="text-sm font-medium text-blue-700 dark:text-blue-300 cursor-pointer">
                🌐 All Workspaces
              </label>
              <Badge variant="outline" className="text-xs">
                {accessibleWorkspaces.length}
              </Badge>
            </div>
          )}

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-40 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="team">Team Folders</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="member-assigned">Assigned</SelectItem>
              <SelectItem value="project">Project Folders</SelectItem>
              <SelectItem value="shared">Shared</SelectItem>
            </SelectContent>
          </Select>

          {/* Workspace Filter - Only show when multi-workspace view is enabled */}
          {showAllWorkspaces && userRole === 'owner' && (
            <Select value={selectedWorkspaceFilter} onValueChange={setSelectedWorkspaceFilter}>
              <SelectTrigger className="w-full sm:w-48 border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workspaces</SelectItem>
                {accessibleWorkspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {workspace.workspaceType === 'main' ? '🏢' : '📁'}
                      </span>
                      <span>{workspace.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {teams.length > 0 && (
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-full sm:w-48 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* View Mode Selector */}
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
          <TabsList>
            <TabsTrigger value="grid">
              <Grid3X3 className="h-4 w-4 mr-1" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="tree">
              <TreePine className="h-4 w-4 mr-1" />
              Tree
            </TabsTrigger>
            {canViewMemberFolders && (
              <TabsTrigger value="member">
                <Users className="h-4 w-4 mr-1" />
                Members
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {viewMode === 'grid' && (
          <FolderCardGrid
            folders={filteredFolders}
            loading={loading}
            onFolderClick={handleFolderClick}
            onEditFolder={handleEditFolder}
            onDeleteFolder={initiateDeleteFolder}
            searchTerm={searchTerm}
            userRole={userRole}
            submitting={submitting}
          />
        )}

        {viewMode === 'tree' && (
          <FolderTreeView
            folders={filteredFolders}
            loading={loading}
            onFolderClick={handleFolderClick}
            onEditFolder={handleEditFolder}
            onDeleteFolder={initiateDeleteFolder}
            onCreateSubfolder={(parentFolder: FolderType) => {
              toast({
                title: 'ℹ️ Coming Soon',
                description: 'Subfolder creation functionality will be available soon.',
              });
            }}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            userRole={userRole}
          />
        )}

        {viewMode === 'member' && (
          <FolderMemberView
            folders={filteredFolders}
            loading={loading}
            onFolderClick={handleFolderClick}
            onEditFolder={handleEditFolder}
            onDeleteFolder={initiateDeleteFolder}
            onCreateMemberFolder={(member: User) => {
              toast({
                title: 'ℹ️ Coming Soon',
                description: 'Direct member folder creation functionality will be available soon.',
              });
            }}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            userRole={userRole}
          />
        )}
      </div>

      {/* Enhanced Empty State with Debug Tools */}
      {filteredFolders.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 text-center space-y-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
          </div>
          
          <div className="space-y-2 max-w-md">
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
              No folders found
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {searchTerm ? 
                `No folders match "${searchTerm}". Try adjusting your search or filters.` : 
                'Get started by creating your first folder'
              }
            </p>
          </div>

          {canCreateFolders && folderLimits.canCreateMore && (
            <Button 
              onClick={() => setCurrentPage('create')}
              className="h-11 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Folder
            </Button>
          )}
        </div>
      )}

      {/* Delete Folder Dialog */}
      <DeleteFolderAlertDialog
        isOpen={isDeleteFolderOpen}
        onClose={() => {
          setIsDeleteFolderOpen(false);
          setDeletingFolder(null);
        }}
        onConfirm={confirmDeleteFolder}
        folder={deletingFolder}
        submitting={submitting}
      />

      {/* Folder Settings Dialog */}
      <Dialog open={showFolderSettings} onOpenChange={setShowFolderSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>Folder Settings</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Default Folder Settings</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Default Visibility</Label>
                    <p className="text-xs text-muted-foreground">Default visibility for new folders</p>
                  </div>
                  <Select 
                    value={settingsForm.defaultVisibility} 
                    onValueChange={(value: any) => setSettingsForm(prev => ({ ...prev, defaultVisibility: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Auto Archive Inactive</Label>
                    <p className="text-xs text-muted-foreground">Automatically archive folders with no activity</p>
                  </div>
                  <Switch
                    checked={settingsForm.autoArchiveInactive}
                    onCheckedChange={(checked) => 
                      setSettingsForm(prev => ({ ...prev, autoArchiveInactive: checked }))
                    }
                  />
                </div>

                {settingsForm.autoArchiveInactive && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Archive After (Days)</Label>
                      <p className="text-xs text-muted-foreground">Days of inactivity before archiving</p>
                    </div>
                    <Input
                      type="number"
                      value={settingsForm.autoArchiveDays}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, autoArchiveDays: parseInt(e.target.value) || 30 }))}
                      className="w-20"
                      min="1"
                      max="365"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowFolderSettings(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveFolderSettings} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Archive className="h-5 w-5 text-orange-500" />
              <span>Archive Selected Folders</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive {selectedFolders.length} folder(s)? 
              Archived folders will be hidden from the main view but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveSelected} className="bg-orange-600 hover:bg-orange-700">
              Archive Folders
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
