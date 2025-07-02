// components/teams/dialogs/CreateTeamDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, X, Users, Globe, Building } from 'lucide-react';
import { Branch, Region, Team, User } from '@/lib/types';
import { useState, useEffect } from 'react';
import { UserService } from '@/lib/user-service';
import { BranchService } from '@/lib/branch-service';
import { RegionService } from '@/lib/region-service';
import { WorkspaceService } from '@/lib/workspace-service';

interface CreateTeamDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  teamForm: {
    name: string;
    description: string;
    branchId: string;
    regionId: string;
    leadId: string;
    joinAsLead: boolean;
    workspaceId: string;
    members: string[];
  };
  setTeamForm: React.Dispatch<React.SetStateAction<{
    name: string;
    description: string;
    branchId: string;
    regionId: string;
    leadId: string;
    joinAsLead: boolean;
    workspaceId: string;
    members: string[];
  }>>;
  branches: Branch[];
  regions: Region[];
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  isSystemWideView?: boolean; // New prop to indicate system-wide creation
  availableWorkspaces?: any[]; // Available workspaces for system-wide creation
  currentWorkspace?: any; // Current workspace context
}

export default function CreateTeamDialog({
  isOpen,
  setIsOpen,
  teamForm,
  setTeamForm,
  branches,
  regions,
  onSubmit,
  isSubmitting,
  isSystemWideView = false,
  availableWorkspaces = [],
  currentWorkspace,
}: CreateTeamDialogProps) {
  // Enhanced state for system-wide creation
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(currentWorkspace?.id || '');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedTeamLead, setSelectedTeamLead] = useState<string>('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Enhanced regions and branches for selected workspace
  const [workspaceBranches, setWorkspaceBranches] = useState<Branch[]>([]);
  const [workspaceRegions, setWorkspaceRegions] = useState<Region[]>([]);
  const [loadingWorkspaceData, setLoadingWorkspaceData] = useState(false);

  // Initialize dialog state from teamForm when dialog opens
  useEffect(() => {
    if (isOpen && teamForm) {
      setSelectedWorkspaceId(teamForm.workspaceId || currentWorkspace?.id || '');
      setSelectedMembers(teamForm.members || []);
      setSelectedTeamLead(teamForm.leadId || '');
    }
  }, [isOpen, teamForm, currentWorkspace]);

  // Load users and workspace data when workspace changes
  useEffect(() => {
    if (isSystemWideView && selectedWorkspaceId) {
      loadWorkspaceUsersAndData();
    }
  }, [selectedWorkspaceId, isSystemWideView]);

  // Initialize with current workspace if not system-wide
  useEffect(() => {
    if (!isSystemWideView && currentWorkspace) {
      setSelectedWorkspaceId(currentWorkspace.id);
      setWorkspaceBranches(branches);
      setWorkspaceRegions(regions);
      // Sync with parent teamForm
      setTeamForm(prev => ({ ...prev, workspaceId: currentWorkspace.id }));
      
      // If branches/regions arrays are empty, try to load them directly
      if ((branches.length === 0 || regions.length === 0) && currentWorkspace.id) {
        loadWorkspaceDataDirectly(currentWorkspace.id);
      }
    }
  }, [isSystemWideView, currentWorkspace, branches, regions, setTeamForm]);

  // Sync workspace selection with parent teamForm
  useEffect(() => {
    if (selectedWorkspaceId !== teamForm.workspaceId) {
      setTeamForm(prev => ({ ...prev, workspaceId: selectedWorkspaceId }));
    }
  }, [selectedWorkspaceId, teamForm.workspaceId, setTeamForm]);

  // Sync members with parent teamForm
  useEffect(() => {
    if (JSON.stringify(selectedMembers) !== JSON.stringify(teamForm.members)) {
      setTeamForm(prev => ({ ...prev, members: selectedMembers }));
    }
  }, [selectedMembers, teamForm.members, setTeamForm]);

  // Sync team lead with parent teamForm
  useEffect(() => {
    if (selectedTeamLead !== teamForm.leadId) {
      setTeamForm(prev => ({ ...prev, leadId: selectedTeamLead }));
    }
  }, [selectedTeamLead, teamForm.leadId, setTeamForm]);

  const loadWorkspaceUsersAndData = async () => {
    if (!selectedWorkspaceId) return;

    setLoadingUsers(true);
    setLoadingWorkspaceData(true);
    
    try {
      // Find the selected workspace to determine its type
      const selectedWorkspace = availableWorkspaces.find(w => w.id === selectedWorkspaceId) || currentWorkspace;
      
      // Determine which workspace to load regions/branches from
      // For sub-workspaces, load from parent workspace
      const sourceWorkspaceId = selectedWorkspace?.workspaceType === 'sub' 
        ? selectedWorkspace.parentWorkspaceId || selectedWorkspaceId
        : selectedWorkspaceId;
      
      const [users, workspaceB, workspaceR] = await Promise.all([
        UserService.getUsersByWorkspace(selectedWorkspaceId),
        BranchService.getWorkspaceBranches(sourceWorkspaceId),
        RegionService.getWorkspaceRegions(sourceWorkspaceId),
      ]);

      // For sub-workspaces, filter to only show bound region and branch
      let filteredRegions = workspaceR;
      let filteredBranches = workspaceB;
      
      if (selectedWorkspace?.workspaceType === 'sub') {
        // For sub-workspaces, only show the bound region and branch
        filteredRegions = selectedWorkspace.regionId 
          ? workspaceR.filter(r => r.id === selectedWorkspace.regionId)
          : [];
        
        filteredBranches = selectedWorkspace.branchId 
          ? workspaceB.filter(b => b.id === selectedWorkspace.branchId)
          : [];
      }

      setAvailableUsers(users);
      setWorkspaceBranches(filteredBranches);
      setWorkspaceRegions(filteredRegions);
    } catch (error) {
      console.error('Error loading workspace data:', error);
    } finally {
      setLoadingUsers(false);
      setLoadingWorkspaceData(false);
    }
  };

  // Direct workspace data loading for when props are insufficient
  const loadWorkspaceDataDirectly = async (workspaceId: string) => {
    if (!workspaceId) return;
    
    setLoadingWorkspaceData(true);
    try {
      // Determine which workspace to load regions/branches from
      // For sub-workspaces, load from parent workspace (same logic as teams management)
      const sourceWorkspaceId = currentWorkspace?.workspaceType === 'sub' 
        ? currentWorkspace.parentWorkspaceId || workspaceId
        : workspaceId;
      
      const [workspaceB, workspaceR] = await Promise.all([
        BranchService.getWorkspaceBranches(sourceWorkspaceId),
        RegionService.getWorkspaceRegions(sourceWorkspaceId),
      ]);

      // For sub-workspaces, filter to only show bound region and branch
      let filteredRegions = workspaceR;
      let filteredBranches = workspaceB;
      
      if (currentWorkspace?.workspaceType === 'sub') {
        // For sub-workspaces, only show the bound region and branch
        filteredRegions = currentWorkspace.regionId 
          ? workspaceR.filter(r => r.id === currentWorkspace.regionId)
          : [];
        
        filteredBranches = currentWorkspace.branchId 
          ? workspaceB.filter(b => b.id === currentWorkspace.branchId)
          : [];
      }

      setWorkspaceBranches(filteredBranches);
      setWorkspaceRegions(filteredRegions);
    } catch (error) {
      console.error('CreateTeamDialog: Error loading workspace data directly:', error);
    } finally {
      setLoadingWorkspaceData(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = availableUsers.filter(user => 
    user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const handleAddMember = (userId: string) => {
    if (!selectedMembers.includes(userId)) {
      const newMembers = [...selectedMembers, userId];
      setSelectedMembers(newMembers);
      setTeamForm(prev => ({ ...prev, members: newMembers }));
    }
    setUserSearchQuery('');
  };

  const handleRemoveMember = (userId: string) => {
    const newMembers = selectedMembers.filter(id => id !== userId);
    setSelectedMembers(newMembers);
    setTeamForm(prev => ({ ...prev, members: newMembers }));
    // If removing the team lead, clear team lead selection
    if (selectedTeamLead === userId) {
      setSelectedTeamLead('');
      setTeamForm(prev => ({ ...prev, leadId: '' }));
    }
  };

  const handleSetTeamLead = (userId: string) => {
    setSelectedTeamLead(userId);
    setTeamForm(prev => ({ ...prev, leadId: userId }));
    // Ensure team lead is also a member
    if (!selectedMembers.includes(userId)) {
      const newMembers = [...selectedMembers, userId];
      setSelectedMembers(newMembers);
      setTeamForm(prev => ({ ...prev, members: newMembers }));
    }
  };

  const getSelectedWorkspaceName = () => {
    if (!isSystemWideView) return currentWorkspace?.name || '';
    const workspace = availableWorkspaces.find(w => w.id === selectedWorkspaceId);
    return workspace?.name || '';
  };

  const getUserName = (userId: string) => {
    const user = availableUsers.find(u => u.id === userId);
    return user?.name || user?.email || 'Unknown User';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center text-lg sm:text-xl">
            {isSystemWideView ? (
              <>
                <Globe className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="truncate">Create System-Wide Team</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="truncate">Create New Team</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-180px)] pr-2 sm:pr-4">
          <div className="space-y-4 sm:space-y-6 p-1">
            {/* Workspace Selection for System-Wide Creation */}
            {isSystemWideView && (
              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Label htmlFor="workspace-select" className="text-sm font-medium mb-2 block">
                  Select Workspace <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedWorkspaceId} onValueChange={(value) => {
                  setSelectedWorkspaceId(value);
                  setTeamForm(prev => ({ ...prev, workspaceId: value }));
                }}>
                  <SelectTrigger className="h-11 sm:h-10 touch-manipulation">
                    <SelectValue placeholder="Choose workspace for this team" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorkspaces.map((workspace) => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        <div className="flex items-center min-w-0">
                          {workspace.parentWorkspaceId ? (
                            <Building className="h-4 w-4 mr-2 flex-shrink-0" />
                          ) : (
                            <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                          )}
                          <span className="truncate">{workspace.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedWorkspaceId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Team will be created in: <span className="font-medium">{getSelectedWorkspaceName()}</span>
                  </p>
                )}
              </div>
            )}

            {/* Basic Team Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name" className="text-sm font-medium">
                  Team Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="team-name"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="Enter team name"
                  className="mt-1 h-11 sm:h-10 touch-manipulation"
                />
              </div>
              
              <div>
                <Label htmlFor="team-description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="team-description"
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  placeholder="Enter team description"
                  rows={3}
                  className="mt-1 touch-manipulation resize-none"
                />
              </div>
            </div>

            {/* Region and Branch Selection - Responsive Grid */}
            {selectedWorkspaceId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="team-region" className="text-sm font-medium">
                    Region {loadingWorkspaceData && <span className="text-xs text-muted-foreground">(Loading...)</span>}
                  </Label>
                  <Select 
                    value={teamForm.regionId} 
                    onValueChange={(value) => setTeamForm({ ...teamForm, regionId: value })}
                    disabled={loadingWorkspaceData}
                  >
                    <SelectTrigger className="mt-1 h-11 sm:h-10 touch-manipulation">
                      <SelectValue placeholder={
                        loadingWorkspaceData 
                          ? "Loading regions..." 
                          : workspaceRegions.length === 0 
                            ? "No regions available" 
                            : "Select region (optional)"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Region</SelectItem>
                      {workspaceRegions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          <span className="truncate">{region.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {workspaceRegions.length === 0 && !loadingWorkspaceData && (
                    <p className="text-xs text-orange-600 mt-1">
                      💡 No regions found. You can create regions in Settings → Regions & Branches.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="team-branch" className="text-sm font-medium">
                    Branch {loadingWorkspaceData && <span className="text-xs text-muted-foreground">(Loading...)</span>}
                  </Label>
                  <Select 
                    value={teamForm.branchId} 
                    onValueChange={(value) => setTeamForm({ ...teamForm, branchId: value })}
                    disabled={loadingWorkspaceData}
                  >
                    <SelectTrigger className="mt-1 h-11 sm:h-10 touch-manipulation">
                      <SelectValue placeholder={
                        loadingWorkspaceData 
                          ? "Loading branches..." 
                          : workspaceBranches.length === 0 
                            ? "No branches available" 
                            : "Select branch (optional)"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Branch</SelectItem>
                      {workspaceBranches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          <span className="truncate">{branch.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {workspaceBranches.length === 0 && !loadingWorkspaceData && (
                    <p className="text-xs text-orange-600 mt-1">
                      💡 No branches found. You can create branches in Settings → Regions & Branches.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Member Assignment for System-Wide Creation */}
            {isSystemWideView && selectedWorkspaceId && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <Label className="text-sm font-medium mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                    Team Members (Optional)
                  </Label>
                  
                  {/* User Search */}
                  <div className="space-y-3">
                    <Input
                      placeholder="Search users to add..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      disabled={loadingUsers}
                      className="h-11 sm:h-10 touch-manipulation"
                    />
                    
                    {/* Search Results */}
                    {userSearchQuery && (
                      <ScrollArea className="h-32 sm:h-24 border rounded-md">
                        <div className="p-2">
                          {loadingUsers ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span className="text-sm">Loading users...</span>
                            </div>
                          ) : filteredUsers.length > 0 ? (
                            filteredUsers.slice(0, 5).map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center justify-between p-3 sm:p-2 hover:bg-accent rounded cursor-pointer touch-manipulation"
                                onClick={() => handleAddMember(user.id)}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                                {!selectedMembers.includes(user.id) && (
                                  <Plus className="h-4 w-4 flex-shrink-0 ml-2" />
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </div>

                  {/* Selected Members */}
                  {selectedMembers.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Selected Members:</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedMembers.map((memberId) => (
                          <Badge key={memberId} variant="secondary" className="flex items-center gap-1 h-8 px-3 touch-manipulation">
                            <span className="truncate max-w-[120px] sm:max-w-none">{getUserName(memberId)}</span>
                            {selectedTeamLead === memberId && (
                              <span className="text-yellow-600 text-xs flex-shrink-0">👑</span>
                            )}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-red-500 flex-shrink-0 ml-1" 
                              onClick={() => handleRemoveMember(memberId)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Lead Selection */}
                  {selectedMembers.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Team Lead (Optional)</Label>
                      <Select value={selectedTeamLead} onValueChange={(value) => {
                        setSelectedTeamLead(value);
                        setTeamForm(prev => ({ ...prev, leadId: value }));
                      }}>
                        <SelectTrigger className="h-11 sm:h-10 touch-manipulation">
                          <SelectValue placeholder="Select team lead from members" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Team Lead</SelectItem>
                          {selectedMembers.map((memberId) => (
                            <SelectItem key={memberId} value={memberId}>
                              <span className="truncate">{getUserName(memberId)}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Join as Lead Option for Non-System-Wide */}
            {!isSystemWideView && (
              <div className="flex items-center space-x-3 p-3 sm:p-2 border rounded-lg">
                <Switch
                  id="join-as-lead"
                  checked={teamForm.joinAsLead}
                  onCheckedChange={(checked) => setTeamForm({ ...teamForm, joinAsLead: checked })}
                  className="touch-manipulation"
                />
                <Label htmlFor="join-as-lead" className="text-sm cursor-pointer">
                  Join this team as Team Lead
                </Label>
              </div>
            )}

            {teamForm.joinAsLead && !isSystemWideView && (
              <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                You'll be automatically added as the team lead when the team is created.
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Dialog Actions - Mobile-Friendly */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            className="h-11 sm:h-10 touch-manipulation"
          >
            Cancel
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={isSubmitting || !teamForm.name.trim() || (isSystemWideView && !selectedWorkspaceId)} 
            className="h-11 sm:h-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 touch-manipulation"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}