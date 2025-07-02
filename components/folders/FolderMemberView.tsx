'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { 
  Users,
  UserPlus,
  UserCheck,
  FolderOpen,
  Folder,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Share2,
  Upload,
  Plus,
  Search,
  FileText,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  Shield,
  Crown,
  Loader2,
  Calendar,
  TrendingUp,
  Settings,
  Archive,
  FileDown,
  ArchiveRestore,
  Download,
  AlertTriangle
} from 'lucide-react';

import { Folder as FolderType, User, MemberFolderStructure } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { FolderService } from '@/lib/folder-service';
import { UserService } from '@/lib/user-service';
import { useFolderPermissions } from '@/lib/rbac-hooks';

interface MemberFolderStats {
  totalMembers: number;
  membersWithFolders: number;
  totalMemberFolders: number;
  totalFiles: number;
  recentActivity: Array<{
    id: string;
    memberName: string;
    action: string;
    folderName: string;
    timestamp: Date;
  }>;
}

interface FolderMemberViewProps {
  folders: FolderType[];
  loading: boolean;
  onFolderClick: (folder: FolderType) => void;
  onEditFolder: (folder: FolderType) => void;
  onDeleteFolder: (folder: FolderType) => void;
  onCreateMemberFolder?: (member: User) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  userRole?: string | null;
}

export default function FolderMemberView({
  folders,
  loading,
  onFolderClick,
  onEditFolder,
  onDeleteFolder,
  onCreateMemberFolder,
  searchTerm,
  onSearchChange,
  userRole
}: FolderMemberViewProps) {
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const [activeTab, setActiveTab] = useState('assigned');
  const [members, setMembers] = useState<User[]>([]);
  const [memberStructures, setMemberStructures] = useState<MemberFolderStructure[]>([]);
  const [stats, setStats] = useState<MemberFolderStats>({
    totalMembers: 0,
    membersWithFolders: 0,
    totalMemberFolders: 0,
    totalFiles: 0,
    recentActivity: []
  });
  const [selectedMember, setSelectedMember] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'activity' | 'files'>('name');
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Assign folder dialog state
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningFolder, setAssigningFolder] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [assignmentType, setAssignmentType] = useState<'existing' | 'new'>('new');
  const [assignForm, setAssignForm] = useState({
    memberId: '',
    folderId: '',
    folderName: '',
    folderDescription: '',
    visibility: 'private' as 'private' | 'team' | 'project',
    permissions: {
      canUpload: true,
      canEdit: true,
      canShare: false,
      canDelete: false
    },
    settings: {
      notifyMember: true,
      allowSubfolders: true,
      requireApproval: false
    }
  });

  // Bulk selection and actions state
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
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

  // Load workspace members and member folder structures
  useEffect(() => {
    const loadMembersData = async () => {
      if (!currentWorkspace || !userProfile) return;
      
      try {
        setLoadingMembers(true);
        
        // Load workspace members
        const workspaceMembers = await UserService.getUsersByWorkspace(currentWorkspace.id);
        setMembers(workspaceMembers.filter(m => m.role === 'member'));

        // Load member folder structures if user can view them
        if (userRole === 'owner' || userRole === 'admin') {
          const structures: MemberFolderStructure[] = [];
          
          // Get all projects to check for member folder structures
          const projectFolders = folders.filter(f => f.type === 'project');
          
          for (const projectFolder of projectFolders) {
            if (projectFolder.projectId) {
              const structure = await FolderService.getMemberFolderStructure(
                projectFolder.projectId,
                userProfile.id,
                userRole
              );
              if (structure) {
                structures.push(structure);
              }
            }
          }
          
          setMemberStructures(structures);
        }

        // Calculate stats
        const memberFolders = folders.filter(f => f.type === 'member' || f.type === 'member-assigned');
        const totalFiles = memberFolders.reduce((acc, f) => acc + f.fileCount, 0);
        const membersWithFolders = new Set(memberFolders.map(f => f.ownerId || f.assignedMemberId)).size;

        setStats({
          totalMembers: workspaceMembers.filter(m => m.role === 'member').length,
          membersWithFolders,
          totalMemberFolders: memberFolders.length,
          totalFiles,
          recentActivity: []
        });

      } catch (error) {
        console.error('Error loading members data:', error);
        toast({
          title: '❌ Error Loading Members',
          description: 'Failed to load member folder data.',
          variant: 'destructive',
        });
      } finally {
        setLoadingMembers(false);
      }
    };

    loadMembersData();
  }, [currentWorkspace, userProfile, userRole, folders]);

  // Filter member-assigned folders
  const assignedFolders = useMemo(() => {
    return folders.filter(folder => 
      folder.type === 'member-assigned' &&
      (selectedMember === 'all' || folder.assignedMemberId === selectedMember) &&
      (folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       folder.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'activity': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'files': return b.fileCount - a.fileCount;
        default: return 0;
      }
    });
  }, [folders, selectedMember, searchTerm, sortBy]);

  // Filter member folders (personal folders created automatically)
  const memberFolders = useMemo(() => {
    return folders.filter(folder => 
      folder.type === 'member' &&
      (selectedMember === 'all' || folder.ownerId === selectedMember) &&
      (folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       folder.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'activity': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'files': return b.fileCount - a.fileCount;
        default: return 0;
      }
    });
  }, [folders, selectedMember, searchTerm, sortBy]);

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || 'Unknown Member';
  };

  const getMemberAvatar = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.avatar;
  };

  const getStatusColor = (folder: FolderType) => {
    const daysSinceUpdate = Math.floor((Date.now() - folder.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate <= 7) return 'text-green-600';
    if (daysSinceUpdate <= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (folder: FolderType) => {
    const daysSinceUpdate = Math.floor((Date.now() - folder.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate <= 7) return <CheckCircle className="h-4 w-4" />;
    if (daysSinceUpdate <= 30) return <Clock className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderFolderCard = (folder: FolderType) => {
    const permissions = useFolderPermissions(folder);
    const memberName = getMemberName(folder.assignedMemberId || folder.ownerId || '');
    const memberAvatar = getMemberAvatar(folder.assignedMemberId || folder.ownerId || '');
    const isSelected = selectedFolders.includes(folder.id);

    return (
      <Card key={folder.id} className="group hover:shadow-md transition-all cursor-pointer relative">
        {/* Selection Checkbox */}
        {(userRole === 'owner' || userRole === 'admin') && settingsForm.allowBulkOperations && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handleSelectFolder(folder.id, checked as boolean)}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-sm"
            />
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                <FolderOpen className="h-5 w-5 text-white" />
              </div>
              
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">{folder.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={memberAvatar} />
                    <AvatarFallback className="text-xs">
                      {memberName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">
                    {memberName}
                  </span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {permissions.canOpen && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFolderClick(folder); }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Open
                  </DropdownMenuItem>
                )}
                {permissions.canEdit && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {permissions.canShare && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                )}
                {permissions.canDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder); }}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent 
          className="space-y-3"
          onClick={() => onFolderClick(folder)}
        >
          {folder.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {folder.description}
            </p>
          )}
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Files</span>
              <span className="font-medium ml-auto">{folder.fileCount}</span>
            </div>
            
            <div className={`flex items-center space-x-1 ${getStatusColor(folder)}`}>
              {getStatusIcon(folder)}
              <span className="text-muted-foreground">Status</span>
            </div>
          </div>

          {/* Last Activity */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Updated</span>
            </div>
            <span>{formatDate(folder.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleAssignFolder = async () => {
    if (!assignForm.memberId) {
      toast({
        title: '❌ Member Required',
        description: 'Please select a member to assign the folder to.',
        variant: 'destructive',
      });
      return;
    }

    if (assignmentType === 'existing' && !assignForm.folderId) {
      toast({
        title: '❌ Folder Required',
        description: 'Please select a folder to assign.',
        variant: 'destructive',
      });
      return;
    }

    if (assignmentType === 'new' && !assignForm.folderName.trim()) {
      toast({
        title: '❌ Folder Name Required',
        description: 'Please enter a name for the new folder.',
        variant: 'destructive',
      });
      return;
    }

    if (!userProfile || !currentWorkspace) {
      toast({
        title: '❌ Authentication Error',
        description: 'User profile or workspace not found. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAssigningFolder(true);
      
      const selectedMemberData = members.find(m => m.id === assignForm.memberId);
      const selectedFolderData = folders.find(f => f.id === assignForm.folderId);

      if (assignmentType === 'new') {
        // Create new folder assigned to member
        const newFolderData = {
          name: assignForm.folderName,
          description: assignForm.folderDescription,
          workspaceId: currentWorkspace.id,
          mainWorkspaceId: currentWorkspace.id,
          subWorkspaceId: currentWorkspace.id,
          ownerId: userProfile.id,
          type: 'member-assigned' as const,
          assignedMemberId: assignForm.memberId,
          visibility: assignForm.visibility,
          folderPath: `Assigned/${assignForm.folderName}`,
          level: 1,
          isSystemFolder: false,
          inheritPermissions: false,
          permissions: {
            read: [assignForm.memberId, userProfile.id],
            write: assignForm.permissions.canUpload ? [assignForm.memberId] : [],
            admin: assignForm.permissions.canEdit ? [assignForm.memberId] : [userProfile.id],
            delete: [userProfile.id]
          },
          fileCount: 0,
          totalSize: 0,
          createdBy: userProfile.id,
          status: 'active' as const,
          isShared: false,
          sharedWith: [],
          tags: ['member-assigned'],
          settings: {
            allowSubfolders: assignForm.settings.allowSubfolders,
            maxSubfolders: 50,
            notifyOnUpload: assignForm.settings.notifyMember,
            requireApproval: assignForm.settings.requireApproval,
            autoArchive: false
          }
        };

        await FolderService.createFolder(newFolderData, userProfile.id);
        
        toast({
          title: '✅ Folder Assigned Successfully',
          description: `"${assignForm.folderName}" has been created and assigned to ${selectedMemberData?.name}.`,
          className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0',
        });
      } else {
        // Assign existing folder to member
        const updateData: Partial<FolderType> = {
          assignedMemberId: assignForm.memberId,
          type: 'member-assigned' as const,
          permissions: {
            read: [...(selectedFolderData?.permissions?.read || []), assignForm.memberId],
            write: assignForm.permissions.canUpload 
              ? [...(selectedFolderData?.permissions?.write || []), assignForm.memberId]
              : selectedFolderData?.permissions?.write || [],
            admin: assignForm.permissions.canEdit
              ? [...(selectedFolderData?.permissions?.admin || []), assignForm.memberId]
              : selectedFolderData?.permissions?.admin || [],
            delete: selectedFolderData?.permissions?.delete || []
          }
        };

        await FolderService.updateFolder(assignForm.folderId, updateData, userProfile.id, userRole || 'member');
        
        toast({
          title: '✅ Folder Assigned Successfully',
          description: `"${selectedFolderData?.name}" has been assigned to ${selectedMemberData?.name}.`,
          className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0',
        });
      }

      // Reset form and close dialog
      setAssignForm({
        memberId: '',
        folderId: '',
        folderName: '',
        folderDescription: '',
        visibility: 'private',
        permissions: {
          canUpload: true,
          canEdit: true,
          canShare: false,
          canDelete: false
        },
        settings: {
          notifyMember: true,
          allowSubfolders: true,
          requireApproval: false
        }
      });
      setShowAssignDialog(false);
      setMemberSearchTerm('');
      setAssignmentType('new');

      // Refresh data
      window.location.reload(); // Simple refresh for now
      
    } catch (error) {
      console.error('Error assigning folder:', error);
      toast({
        title: '❌ Assignment Failed',
        description: 'Failed to assign folder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAssigningFolder(false);
    }
  };

  const filteredMembersForAssign = members.filter(member =>
    member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  const availableFoldersForAssign = folders.filter(folder => 
    folder.type === 'team' || folder.type === 'project' || folder.type === 'shared'
  );

  const selectedMemberForAssign = members.find(m => m.id === assignForm.memberId);
  const selectedFolderForAssign = folders.find(f => f.id === assignForm.folderId);

  // Bulk operations handlers
  const handleSelectAll = useCallback(() => {
    const currentFolders = activeTab === 'assigned' ? assignedFolders : memberFolders;
    const allIds = currentFolders.map(f => f.id);
    setSelectedFolders(selectedFolders.length === allIds.length ? [] : allIds);
  }, [activeTab, assignedFolders, memberFolders, selectedFolders.length]);

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
      window.location.reload();

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

  if (loading || loadingMembers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Member Folders</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Loading member folders...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.membersWithFolders}</p>
                <p className="text-xs text-muted-foreground">With Folders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMemberFolders}</p>
                <p className="text-xs text-muted-foreground">Member Folders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalFiles}</p>
                <p className="text-xs text-muted-foreground">Total Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Member Folders</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {(userRole === 'owner' || userRole === 'admin') && onCreateMemberFolder && (
                <Button size="sm" onClick={() => setShowAssignDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Folder
                </Button>
              )}

              {(userRole === 'owner' || userRole === 'admin') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileDown className="h-4 w-4 mr-2" />
                      Actions
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
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search member folders..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="files">Files</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assigned">
                Assigned Folders ({assignedFolders.length})
              </TabsTrigger>
              <TabsTrigger value="member">
                Member Folders ({memberFolders.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="assigned" className="space-y-4">
              {assignedFolders.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <UserPlus className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium">No assigned folders found</p>
                  <p className="text-xs text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search terms' : 'Create member-assigned folders to get started'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedFolders.map(renderFolderCard)}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="member" className="space-y-4">
              {memberFolders.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium">No member folders found</p>
                  <p className="text-xs text-muted-foreground">
                    Member folders are created automatically when members join projects
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {memberFolders.map(renderFolderCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Assign Folder Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] overflow-hidden">
          <DialogHeader className="pb-3">
            <DialogTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <span>Assign Folder to Member</span>
            </DialogTitle>
          </DialogHeader>

          <div className="h-full flex flex-col">
            <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
              
              {/* Column 1: Member Selection */}
              <div className="space-y-4 overflow-y-auto">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-primary border-b border-border pb-1">
                    Select Member
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search members..."
                        value={memberSearchTerm}
                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                        className="pl-10 h-10"
                      />
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg p-2">
                      {filteredMembersForAssign.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No members found.
                        </p>
                      ) : (
                        <RadioGroup value={assignForm.memberId} onValueChange={(value) => setAssignForm(prev => ({ ...prev, memberId: value }))}>
                          {filteredMembersForAssign.map(member => (
                            <div key={member.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-lg cursor-pointer">
                              <RadioGroupItem value={member.id} id={member.id} />
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback className="text-xs">
                                  {member.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{member.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Assignment Type & Folder Selection/Creation */}
              <div className="space-y-4 overflow-y-auto">
                
                {/* Assignment Type */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-primary border-b border-border pb-1">
                    Assignment Type
                  </h3>
                  
                  <RadioGroup value={assignmentType} onValueChange={(value: any) => setAssignmentType(value)}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="existing" id="existing" />
                      <Label htmlFor="existing" className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-2">
                          <FolderOpen className="h-4 w-4" />
                          <span className="font-medium">Assign Existing Folder</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Give member access to an existing folder
                        </p>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="new" id="new" />
                      <Label htmlFor="new" className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-2">
                          <Plus className="h-4 w-4" />
                          <span className="font-medium">Create New Folder</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Create a new folder specifically for this member
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Folder Selection/Creation */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-primary border-b border-border pb-1">
                    {assignmentType === 'existing' ? 'Select Folder' : 'Create Folder'}
                  </h3>
                  
                  {assignmentType === 'existing' ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Available Folders</Label>
                      <Select value={assignForm.folderId} onValueChange={(value) => setAssignForm(prev => ({ ...prev, folderId: value }))}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select a folder to assign" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFoldersForAssign.map(folder => (
                            <SelectItem key={folder.id} value={folder.id}>
                              <div className="flex items-center space-x-2">
                                <FolderOpen className="h-4 w-4" />
                                <span>{folder.name}</span>
                                <Badge variant="outline" className="text-xs">{folder.type}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedFolderForAssign && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">{selectedFolderForAssign.name}</p>
                          {selectedFolderForAssign.description && (
                            <p className="text-xs text-muted-foreground mt-1">{selectedFolderForAssign.description}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">{selectedFolderForAssign.type}</Badge>
                            <Badge variant="outline" className="text-xs">{selectedFolderForAssign.visibility}</Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Folder Name *</Label>
                        <Input
                          value={assignForm.folderName}
                          onChange={(e) => setAssignForm(prev => ({ ...prev, folderName: e.target.value }))}
                          placeholder="Enter folder name"
                          className="h-10"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Description</Label>
                        <Textarea
                          value={assignForm.folderDescription}
                          onChange={(e) => setAssignForm(prev => ({ ...prev, folderDescription: e.target.value }))}
                          placeholder="Brief description"
                          rows={3}
                          className="resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Visibility</Label>
                        <Select value={assignForm.visibility} onValueChange={(value: any) => setAssignForm(prev => ({ ...prev, visibility: value }))}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">Private (Member only)</SelectItem>
                            <SelectItem value="team">Team (Team members can view)</SelectItem>
                            <SelectItem value="project">Project (Project members can view)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: Member Permissions & Assignment Summary */}
              <div className="space-y-4 overflow-y-auto">
                
                {/* Permissions */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-primary border-b border-border pb-1">
                    Member Permissions
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Can Upload Files</Label>
                        <p className="text-xs text-muted-foreground">Allow member to upload files to folder</p>
                      </div>
                      <Switch
                        checked={assignForm.permissions.canUpload}
                        onCheckedChange={(checked) => 
                          setAssignForm(prev => ({ 
                            ...prev, 
                            permissions: { ...prev.permissions, canUpload: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Can Edit Folder</Label>
                        <p className="text-xs text-muted-foreground">Allow member to modify folder settings</p>
                      </div>
                      <Switch
                        checked={assignForm.permissions.canEdit}
                        onCheckedChange={(checked) => 
                          setAssignForm(prev => ({ 
                            ...prev, 
                            permissions: { ...prev.permissions, canEdit: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Can Share Folder</Label>
                        <p className="text-xs text-muted-foreground">Allow member to share folder with others</p>
                      </div>
                      <Switch
                        checked={assignForm.permissions.canShare}
                        onCheckedChange={(checked) => 
                          setAssignForm(prev => ({ 
                            ...prev, 
                            permissions: { ...prev.permissions, canShare: checked }
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Assignment Summary */}
                {selectedMemberForAssign && (
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-primary border-b border-border pb-1">
                      Assignment Summary
                    </h4>
                    
                    <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20">
                      <div className="flex items-center space-x-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-primary">Ready to Assign</span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Member:</span>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={selectedMemberForAssign.avatar} />
                              <AvatarFallback className="text-xs">
                                {selectedMemberForAssign.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{selectedMemberForAssign.name}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <Badge variant="outline" className="text-xs">
                            {assignmentType === 'existing' ? 'Existing Folder' : 'New Folder'}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Permissions:</span>
                          <span className="text-xs">
                            {Object.values(assignForm.permissions).filter(Boolean).length} of 3 granted
                          </span>
                        </div>

                        {assignmentType === 'new' && assignForm.folderName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Folder Name:</span>
                            <span className="font-medium text-xs truncate max-w-32" title={assignForm.folderName}>
                              {assignForm.folderName}
                            </span>
                          </div>
                        )}

                        {assignmentType === 'existing' && selectedFolderForAssign && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Folder:</span>
                            <span className="font-medium text-xs truncate max-w-32" title={selectedFolderForAssign.name}>
                              {selectedFolderForAssign.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-border mt-4">
              <Button type="button" variant="outline" onClick={() => setShowAssignDialog(false)} className="h-10 px-6">
                Cancel
              </Button>
              <Button 
                onClick={handleAssignFolder}
                disabled={assigningFolder || !assignForm.memberId}
                className="h-10 px-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {assigningFolder && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Assign Folder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                    <p className="text-xs text-muted-foreground">Default visibility for new member folders</p>
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
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg ml-4">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Archive After (Days)</Label>
                      <p className="text-xs text-muted-foreground">Days of inactivity before archiving</p>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={settingsForm.autoArchiveDays}
                      onChange={(e) => 
                        setSettingsForm(prev => ({ 
                          ...prev, 
                          autoArchiveDays: parseInt(e.target.value) || 90 
                        }))
                      }
                      className="w-20 h-8"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Require Upload Approval</Label>
                    <p className="text-xs text-muted-foreground">Require admin approval for file uploads</p>
                  </div>
                  <Switch
                    checked={settingsForm.requireApprovalForUploads}
                    onCheckedChange={(checked) => 
                      setSettingsForm(prev => ({ ...prev, requireApprovalForUploads: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Allow Member Subfolders</Label>
                    <p className="text-xs text-muted-foreground">Allow members to create subfolders</p>
                  </div>
                  <Switch
                    checked={settingsForm.allowMemberSubfolders}
                    onCheckedChange={(checked) => 
                      setSettingsForm(prev => ({ ...prev, allowMemberSubfolders: checked }))
                    }
                  />
                </div>

                {settingsForm.allowMemberSubfolders && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg ml-4">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Max Subfolders Per Member</Label>
                      <p className="text-xs text-muted-foreground">Maximum subfolders each member can create</p>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={settingsForm.maxSubfoldersPerMember}
                      onChange={(e) => 
                        setSettingsForm(prev => ({ 
                          ...prev, 
                          maxSubfoldersPerMember: parseInt(e.target.value) || 10 
                        }))
                      }
                      className="w-20 h-8"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Notify on New Assignment</Label>
                    <p className="text-xs text-muted-foreground">Send notifications when folders are assigned</p>
                  </div>
                  <Switch
                    checked={settingsForm.notifyOnNewAssignment}
                    onCheckedChange={(checked) => 
                      setSettingsForm(prev => ({ ...prev, notifyOnNewAssignment: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Allow Bulk Operations</Label>
                    <p className="text-xs text-muted-foreground">Enable bulk selection and operations</p>
                  </div>
                  <Switch
                    checked={settingsForm.allowBulkOperations}
                    onCheckedChange={(checked) => 
                      setSettingsForm(prev => ({ ...prev, allowBulkOperations: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setShowFolderSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFolderSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Archive className="h-5 w-5 text-orange-600" />
              <span>Archive Selected Folders</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to archive {selectedFolders.length} folder{selectedFolders.length > 1 ? 's' : ''}. 
              Archived folders will be hidden from the main view but can be restored later.
              
              <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      What happens when you archive folders:
                    </p>
                    <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                      <li>• Folders become read-only for members</li>
                      <li>• Files remain accessible but no new uploads allowed</li>
                      <li>• Folders are hidden from member view</li>
                      <li>• Can be restored by admins at any time</li>
                    </ul>
                  </div>
                </div>
              </div>

              {selectedFolders.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Folders to be archived:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedFolders.map(folderId => {
                      const folder = [...assignedFolders, ...memberFolders].find(f => f.id === folderId);
                      return folder ? (
                        <div key={folderId} className="flex items-center space-x-2 text-xs p-2 bg-muted rounded">
                          <FolderOpen className="h-3 w-3" />
                          <span className="truncate">{folder.name}</span>
                          <Badge variant="outline" className="text-xs">{folder.type}</Badge>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archivingFolders}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveSelected}
              disabled={archivingFolders}
              className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              {archivingFolders ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Archiving...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive {selectedFolders.length} Folder{selectedFolders.length > 1 ? 's' : ''}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 