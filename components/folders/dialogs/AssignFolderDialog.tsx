'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { 
  Loader2, 
  UserPlus, 
  Users, 
  FolderOpen, 
  Search,
  Plus,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

import { User, Folder, Team } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { UserService } from '@/lib/user-service';

interface AssignFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assignmentData: any) => Promise<void>;
  teams: Team[];
  existingFolders: Folder[];
  submitting: boolean;
}

export default function AssignFolderDialog({
  isOpen,
  onClose,
  onSubmit,
  teams,
  existingFolders,
  submitting
}: AssignFolderDialogProps) {
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentType, setAssignmentType] = useState<'existing' | 'new'>('existing');
  
  const [form, setForm] = useState({
    memberId: '',
    folderId: '',
    folderName: '',
    folderDescription: '',
    visibility: 'private' as 'private' | 'team' | 'project',
    teamId: '',
    permissions: {
      canEdit: true,
      canDelete: false,
      canShare: false,
      canUpload: true
    },
    settings: {
      notifyMember: true,
      allowSubfolders: true,
      requireApproval: false
    }
  });

  useEffect(() => {
    const loadMembers = async () => {
      if (!currentWorkspace || !userProfile) return;
      
      try {
        setLoadingMembers(true);
        const workspaceMembers = await UserService.getUsersByWorkspace(currentWorkspace.id);
        setMembers(workspaceMembers.filter(m => m.role === 'member'));
      } catch (error) {
        console.error('Error loading members:', error);
        toast({
          title: '❌ Error Loading Members',
          description: 'Failed to load workspace members.',
          variant: 'destructive',
        });
      } finally {
        setLoadingMembers(false);
      }
    };

    if (isOpen) {
      loadMembers();
    }
  }, [currentWorkspace, userProfile, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setForm({
        memberId: '',
        folderId: '',
        folderName: '',
        folderDescription: '',
        visibility: 'private',
        teamId: '',
        permissions: {
          canEdit: true,
          canDelete: false,
          canShare: false,
          canUpload: true
        },
        settings: {
          notifyMember: true,
          allowSubfolders: true,
          requireApproval: false
        }
      });
      setAssignmentType('existing');
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableFolders = existingFolders.filter(folder => 
    folder.type === 'team' || folder.type === 'project' || folder.type === 'shared'
  );

  const selectedMember = members.find(m => m.id === form.memberId);
  const selectedFolder = availableFolders.find(f => f.id === form.folderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.memberId) {
      toast({
        title: '❌ Member Required',
        description: 'Please select a member to assign the folder to.',
        variant: 'destructive',
      });
      return;
    }

    if (assignmentType === 'existing' && !form.folderId) {
      toast({
        title: '❌ Folder Required',
        description: 'Please select a folder to assign.',
        variant: 'destructive',
      });
      return;
    }

    if (assignmentType === 'new' && !form.folderName.trim()) {
      toast({
        title: '❌ Folder Name Required',
        description: 'Please enter a name for the new folder.',
        variant: 'destructive',
      });
      return;
    }

    const assignmentData = {
      ...form,
      assignmentType,
      memberName: selectedMember?.name,
      folderName: assignmentType === 'existing' ? selectedFolder?.name : form.folderName
    };

    await onSubmit(assignmentData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-4xl mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg break-words">
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span>Assign Folder to Member</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 overflow-hidden">
            
            <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-2">
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold text-primary border-b border-border pb-1">
                  Select Member
                </h3>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 sm:h-10 touch-manipulation"
                    />
                  </div>

                  {loadingMembers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto border rounded-lg p-2 sm:p-3">
                      {filteredMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No members found.
                        </p>
                      ) : (
                        <RadioGroup value={form.memberId} onValueChange={(value) => setForm(prev => ({ ...prev, memberId: value }))}>
                          {filteredMembers.map(member => (
                            <div key={member.id} className="flex items-center space-x-3 p-3 sm:p-2 hover:bg-muted rounded-lg cursor-pointer touch-manipulation">
                              <RadioGroupItem value={member.id} id={member.id} className="touch-manipulation" />
                              <Avatar className="h-10 w-10 sm:h-8 sm:w-8">
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
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold text-primary border-b border-border pb-1">
                  Assignment Type
                </h3>
                
                <RadioGroup value={assignmentType} onValueChange={(value: any) => setAssignmentType(value)}>
                  <div className="flex items-center space-x-2 p-3 sm:p-4 border rounded-lg touch-manipulation">
                    <RadioGroupItem value="existing" id="existing" className="touch-manipulation" />
                    <Label htmlFor="existing" className="cursor-pointer flex-1">
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="h-4 w-4" />
                        <span className="font-medium text-sm sm:text-base">Assign Existing Folder</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Give member access to an existing folder
                      </p>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 sm:p-4 border rounded-lg touch-manipulation">
                    <RadioGroupItem value="new" id="new" className="touch-manipulation" />
                    <Label htmlFor="new" className="cursor-pointer flex-1">
                      <div className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span className="font-medium text-sm sm:text-base">Create New Folder</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create a new folder specifically for this member
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-2">
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold text-primary border-b border-border pb-1">
                  {assignmentType === 'existing' ? 'Select Folder' : 'Create Folder'}
                </h3>
                
                {assignmentType === 'existing' ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Available Folders</Label>
                    <Select value={form.folderId} onValueChange={(value) => setForm(prev => ({ ...prev, folderId: value }))}>
                      <SelectTrigger className="h-11 sm:h-10 touch-manipulation">
                        <SelectValue placeholder="Select a folder to assign" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFolders.map(folder => (
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
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Folder Name *</Label>
                      <Input
                        value={form.folderName}
                        onChange={(e) => setForm(prev => ({ ...prev, folderName: e.target.value }))}
                        placeholder="Enter folder name"
                        className="h-11 sm:h-10 touch-manipulation"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Description</Label>
                      <Textarea
                        value={form.folderDescription}
                        onChange={(e) => setForm(prev => ({ ...prev, folderDescription: e.target.value }))}
                        placeholder="Brief description"
                        rows={3}
                        className="resize-none touch-manipulation"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm sm:text-base font-semibold text-foreground border-b border-border pb-1">
                  Member Permissions
                </h4>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between p-3 sm:p-2 bg-muted rounded-lg touch-manipulation">
                    <Label className="text-sm font-medium">Can Upload Files</Label>
                    <Switch
                      checked={form.permissions.canUpload}
                      onCheckedChange={(checked) => 
                        setForm(prev => ({ 
                          ...prev, 
                          permissions: { ...prev.permissions, canUpload: checked }
                        }))
                      }
                      className="touch-manipulation"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-2 bg-muted rounded-lg touch-manipulation">
                    <Label className="text-sm font-medium">Can Edit Folder</Label>
                    <Switch
                      checked={form.permissions.canEdit}
                      onCheckedChange={(checked) => 
                        setForm(prev => ({ 
                          ...prev, 
                          permissions: { ...prev.permissions, canEdit: checked }
                        }))
                      }
                      className="touch-manipulation"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-2 bg-muted rounded-lg touch-manipulation">
                    <Label className="text-sm font-medium">Can Share Folder</Label>
                    <Switch
                      checked={form.permissions.canShare}
                      onCheckedChange={(checked) => 
                        setForm(prev => ({ 
                          ...prev, 
                          permissions: { ...prev.permissions, canShare: checked }
                        }))
                      }
                      className="touch-manipulation"
                    />
                  </div>
                </div>
              </div>

              {selectedMember && (
                <div className="p-3 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20">
                  <h4 className="font-medium text-sm mb-2 text-primary flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Assignment Summary</span>
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Member:</span>
                      <span className="font-medium">{selectedMember.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assignment:</span>
                      <span className="capitalize">{assignmentType} folder</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2 pt-4 border-t border-border mt-4 p-4 sm:p-0">
            <Button type="button" variant="outline" onClick={onClose} className="h-11 sm:h-10 px-6 w-full sm:w-auto touch-manipulation">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !form.memberId}
              className="h-11 sm:h-10 px-6 w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 touch-manipulation truncate"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign Folder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}