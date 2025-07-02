'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { TeamService } from '@/lib/team-service';
import { BranchService } from '@/lib/branch-service';
import { RegionService } from '@/lib/region-service';
import { Team, SystemWideTeam, Branch, Region, TeamUser } from '@/lib/types';
import { useRolePermissions, useIsAdminOrOwner } from '@/lib/rbac-hooks';
import {
  Plus,
  Search,
  Loader2,
  Globe,
  Building,
} from 'lucide-react';

// Import the new components
import TeamCardGrid from './TeamCardGrid';
import CreateTeamDialog from './dialogs/CreateTeamDialog';
import EditTeamDialog from './dialogs/EditTeamDialog';
import DeleteTeamAlertDialog from './dialogs/DeleteTeamAlertDialog';

export function TeamsManagement() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const permissions = useRolePermissions();
  const isAdminOrOwner = useIsAdminOrOwner();

  // State for teams, branches, and regions
  const [teams, setTeams] = useState<(Team | SystemWideTeam)[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [userTeams, setUserTeams] = useState<{team: Team, role: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // System-wide functionality state
  const [isSystemWideView, setIsSystemWideView] = useState(false);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('all');

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Dialog states
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDeleteTeamAlertOpen, setIsDeleteTeamAlertOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  // Form state
  const [teamForm, setTeamForm] = useState<{
    name: string;
    description: string;
    branchId: string;
    regionId: string;
    leadId: string;
    joinAsLead: boolean;
    workspaceId: string;
    members: string[];
  }>({
    name: '',
    description: '',
    branchId: 'none',
    regionId: 'none',
    leadId: '',
    joinAsLead: false,
    workspaceId: '',
    members: []
  });

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [joiningTeam, setJoiningTeam] = useState<string | null>(null);
  const [leavingTeam, setLeavingTeam] = useState<string | null>(null);

  // Enhanced data loading with system-wide support and role-based visibility
  const loadWorkspaceData = useCallback(async () => {
    if (!currentWorkspace || !user) return;

    setLoading(true);
    try {
      // Check if user is main workspace owner for system-wide access
      const isMainWorkspaceOwner = !currentWorkspace.parentWorkspaceId && 
                                   currentWorkspace.ownerId === user.uid;

      let teamsData, workspaces = [];
      
      if (isMainWorkspaceOwner) {
        // System-wide access for main workspace owners
        try {
          const systemWideData = await TeamService.getSystemWideTeams(user.uid);
          teamsData = systemWideData.teams;
          workspaces = systemWideData.workspaces;
          setIsSystemWideView(true);
        } catch (error) {
          console.warn('Failed to load system-wide teams, falling back to workspace teams:', error);
          teamsData = await TeamService.getTeamsWithRoleBasedVisibility(user.uid, currentWorkspace.id);
          setIsSystemWideView(false);
        }
      } else {
        // Role-based visibility for regular users
        teamsData = await TeamService.getTeamsWithRoleBasedVisibility(user.uid, currentWorkspace.id);
        setIsSystemWideView(false);
      }

      // For admin/member users, always start by loading current workspace branches and regions
      let allBranches: Branch[] = [];
      let allRegions: Region[] = [];
      
      // Always load current workspace data first
      try {
        // Determine which workspace to load regions/branches from
        // For sub-workspaces, load from parent workspace (same logic as other components)
        const sourceWorkspaceId = currentWorkspace.workspaceType === 'sub' 
          ? currentWorkspace.parentWorkspaceId || currentWorkspace.id
          : currentWorkspace.id;
        
        const [currentWorkspaceBranches, currentWorkspaceRegions] = await Promise.all([
          BranchService.getWorkspaceBranches(sourceWorkspaceId),
          RegionService.getWorkspaceRegions(sourceWorkspaceId)
        ]);
        
        // For sub-workspaces, filter to only show bound region and branch
        let filteredRegions = currentWorkspaceRegions;
        let filteredBranches = currentWorkspaceBranches;
        
        if (currentWorkspace.workspaceType === 'sub') {
          // For sub-workspaces, only show the bound region and branch
          filteredRegions = currentWorkspace.regionId 
            ? currentWorkspaceRegions.filter(r => r.id === currentWorkspace.regionId)
            : [];
          
          filteredBranches = currentWorkspace.branchId 
            ? currentWorkspaceBranches.filter(b => b.id === currentWorkspace.branchId)
            : [];
        }
        
        allBranches = [...filteredBranches];
        allRegions = [...filteredRegions];
        
      } catch (error) {
        console.error('Error loading current workspace branches/regions:', error);
      }

      // For system-wide owners, also load data from other workspaces based on teams
      if (isMainWorkspaceOwner && teamsData.length > 0) {
        try {
          // Get unique workspace IDs from teams (excluding current workspace which we already loaded)
          const teamWorkspaceIds = new Set<string>();
          teamsData.forEach((team: any) => {
            if (team.workspaceId && team.workspaceId !== currentWorkspace.id) {
              teamWorkspaceIds.add(team.workspaceId);
            }
          });
          
          // Also check if branches/regions exist in different workspaces for cross-workspace teams
          for (const team of teamsData) {
            if (team.branchId) {
              try {
                const branch = await BranchService.getBranch(team.branchId);
                if (branch && branch.workspaceId !== team.workspaceId && branch.workspaceId !== currentWorkspace.id) {
                  teamWorkspaceIds.add(branch.workspaceId);
                }
              } catch (error) {
                // Silently handle errors for branch checking
              }
            }
            
            if (team.regionId) {
              try {
                const region = await RegionService.getRegion(team.regionId);
                if (region && region.workspaceId !== team.workspaceId && region.workspaceId !== currentWorkspace.id) {
                  teamWorkspaceIds.add(region.workspaceId);
                }
              } catch (error) {
                // Silently handle errors for region checking
              }
            }
          }
          
          const additionalWorkspaceIds = Array.from(teamWorkspaceIds);
          
          if (additionalWorkspaceIds.length > 0) {
            // Load branches and regions from additional workspaces
            const branchPromises = additionalWorkspaceIds.map(workspaceId => 
              BranchService.getWorkspaceBranches(workspaceId).then(branches => {
                return branches;
              }).catch(error => {
                console.warn(`Failed to load branches for workspace ${workspaceId}:`, error);
                return [];
              })
            );
            
            const regionPromises = additionalWorkspaceIds.map(workspaceId => 
              RegionService.getWorkspaceRegions(workspaceId).then(regions => {
                return regions;
              }).catch(error => {
                console.warn(`Failed to load regions for workspace ${workspaceId}:`, error);
                return [];
              })
            );

            const [additionalBranchesArrays, additionalRegionsArrays] = await Promise.all([
              Promise.all(branchPromises),
              Promise.all(regionPromises),
            ]);

            // Add additional branches and regions (avoid duplicates)
            additionalBranchesArrays.flat().forEach(branch => {
              if (!allBranches.find(existing => existing.id === branch.id)) {
                allBranches.push(branch);
              }
            });

            additionalRegionsArrays.flat().forEach(region => {
              if (!allRegions.find(existing => existing.id === region.id)) {
                allRegions.push(region);
              }
            });
          }
        } catch (error) {
          console.warn('Error loading additional workspace data for system-wide view:', error);
        }
      }

      // Load user teams data
      const userTeamsData = await TeamService.getUserTeams(user.uid, currentWorkspace.id);

      setTeams(teamsData);
      setBranches(allBranches);
      setRegions(allRegions);
      setUserTeams(userTeamsData);
      setAvailableWorkspaces(workspaces);

    } catch (error) {
      console.error('Error loading workspace data:', error);
      toast({
        title: "Error",
        description: "Failed to load teams data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, user?.uid]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  const handleCreateTeam = async () => {
    if (!user) return;

    if (!teamForm.name.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }

    // For system-wide creation, we need to validate workspace selection
    let targetWorkspaceId = currentWorkspace?.id;
    if (isSystemWideView) {
      const selectedWorkspace = availableWorkspaces.find(w => w.id === teamForm.workspaceId) || 
                                availableWorkspaces[0] || currentWorkspace;
      if (!selectedWorkspace) {
        toast({
          title: "Error",
          description: "Please select a workspace for the team",
          variant: "destructive",
        });
        return;
      }
      targetWorkspaceId = selectedWorkspace.id;
    }

    if (!targetWorkspaceId) {
      toast({
        title: "Error",
        description: "No workspace available for team creation",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const teamData: any = {
        name: teamForm.name,
        description: teamForm.description,
        workspaceId: targetWorkspaceId,
        createdBy: user.uid,
      };

      if (teamForm.branchId && teamForm.branchId !== 'none') {
        teamData.branchId = teamForm.branchId;
      }
      if (teamForm.regionId && teamForm.regionId !== 'none') {
        teamData.regionId = teamForm.regionId;
      }

      // Handle team lead assignment
      if (teamForm.joinAsLead && !isSystemWideView) {
        teamData.leadId = user.uid;
      } else if (teamForm.leadId && teamForm.leadId !== '') {
        teamData.leadId = teamForm.leadId;
      }

      const teamId = await TeamService.createTeam(teamData, user.uid);

      // Handle member assignments for system-wide creation
      if (isSystemWideView && teamForm.members && Array.isArray(teamForm.members)) {
        for (const memberId of teamForm.members) {
          try {
            const role = (teamForm.leadId === memberId) ? 'lead' : 'member';
            await TeamService.addUserToTeam(user.uid, teamId, role, memberId);
          } catch (error) {
            console.warn(`Failed to add member ${memberId} to team:`, error);
          }
        }
      } else if (teamForm.joinAsLead && !isSystemWideView) {
        await TeamService.addUserToTeam(user.uid, teamId, 'lead', user.uid);
      }

      const successMessage = isSystemWideView 
        ? `Team created successfully in ${availableWorkspaces.find(w => w.id === targetWorkspaceId)?.name || 'selected workspace'}` +
          (teamForm.members?.length ? ` with ${teamForm.members.length} member${teamForm.members.length !== 1 ? 's' : ''}` : '')
        : teamForm.joinAsLead
          ? "Team created successfully and you've been added as team lead!"
          : "Team created successfully";

      toast({
        title: "Success",
        description: successMessage,
      });

      setIsCreateTeamOpen(false);
      setTeamForm({
        name: '',
        description: '',
        branchId: 'none',
        regionId: 'none',
        leadId: '',
        joinAsLead: false,
        workspaceId: '',
        members: []
      });
      loadWorkspaceData();
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async (team: Team, role: 'lead' | 'member' = 'member') => {
    if (!user) return;

    setJoiningTeam(team.id);
    try {
      await TeamService.addUserToTeam(user.uid, team.id, role, user.uid);

      toast({
        title: "Success",
        description: `Successfully joined ${team.name} as ${role}`,
      });

      loadWorkspaceData();
    } catch (error) {
      console.error('Error joining team:', error);
      toast({
        title: "Error",
        description: "Failed to join team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoiningTeam(null);
    }
  };

  const handleLeaveTeam = async (team: Team) => {
    if (!user) return;

    if (!confirm(`Are you sure you want to leave ${team.name}?`)) {
      return;
    }

    setLeavingTeam(team.id);
    try {
      await TeamService.removeUserFromTeam(user.uid, team.id);

      toast({
        title: "Success",
        description: `Left ${team.name} successfully`,
      });

      loadWorkspaceData();
    } catch (error) {
      console.error('Error leaving team:', error);
      toast({
        title: "Error",
        description: "Failed to leave team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLeavingTeam(null);
    }
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setTeamForm({
      name: team.name,
      description: team.description || '',
      branchId: team.branchId || 'none',
      regionId: team.regionId || 'none',
      leadId: team.leadId || '',
      joinAsLead: false,
      workspaceId: team.workspaceId || '',
      members: []
    });
    setIsEditTeamOpen(true);
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;

    if (!teamForm.name.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const updates: any = {
        name: teamForm.name,
        description: teamForm.description,
      };

      if (teamForm.branchId && teamForm.branchId !== 'none') {
        updates.branchId = teamForm.branchId;
      } else {
        updates.branchId = null;
      }
      if (teamForm.regionId && teamForm.regionId !== 'none') {
        updates.regionId = teamForm.regionId;
      } else {
        updates.regionId = null;
      }
      if (teamForm.leadId) {
        updates.leadId = teamForm.leadId;
      } else {
        updates.leadId = null;
      }

      await TeamService.updateTeam(selectedTeam.id, updates);

      toast({
        title: "Success",
        description: "Team updated successfully",
      });

      setIsEditTeamOpen(false);
      setSelectedTeam(null);
      setTeamForm({
        name: '',
        description: '',
        branchId: 'none',
        regionId: 'none',
        leadId: '',
        joinAsLead: false,
        workspaceId: '',
        members: []
      });
      loadWorkspaceData();
    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        title: "Error",
        description: "Failed to update team",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTeam = (teamId: string) => {
    setTeamToDelete(teamId);
    setIsDeleteTeamAlertOpen(true);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;

    const teamToDeleteData = teams.find(t => t.id === teamToDelete);
    const teamName = teamToDeleteData?.name || 'this team';

    setUpdating(true);
    try {
      await TeamService.deleteTeam(teamToDelete);

      // Enhanced success toast with better styling and more info
      toast({
        title: "🗑️ Team Deleted Successfully",
        description: `"${teamName}" has been permanently removed from the workspace. All team data and associations have been cleared.`,
        className: "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900",
        duration: 5000,
      });

      setIsDeleteTeamAlertOpen(false);
      setTeamToDelete(null);
      loadWorkspaceData();
    } catch (error) {
      console.error('Error deleting team:', error);
      
      // Enhanced error toast with better context
      toast({
        title: "❌ Deletion Failed",
        description: `Failed to delete "${teamName}". This might be due to existing dependencies or network issues. Please try again or contact support if the problem persists.`,
        variant: "destructive",
        className: "border-red-200 bg-gradient-to-r from-red-50 to-rose-50 text-red-900",
        duration: 6000,
      });
    } finally {
      setUpdating(false);
    }
  };

  // Helper functions
  const isUserInTeam = (teamId: string) => {
    return userTeams.some(ut => ut.team.id === teamId);
  };

  const getUserTeamRole = (teamId: string) => {
    const userTeam = userTeams.find(ut => ut.team.id === teamId);
    return userTeam?.role || null;
  };

  const getBranchName = (branchId?: string) => {
    if (!branchId) return 'No Branch';
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      return branch.name;
    }
    return `Branch (${branchId.substring(0, 8)}...)`;
  };

  const getRegionName = (regionId?: string) => {
    if (!regionId) return 'No Region';
    const region = regions.find(r => r.id === regionId);
    if (region) {
      return region.name;
    }
    return `Region (${regionId.substring(0, 8)}...)`;
  };

  // Enhanced filtering with workspace support and deduplication
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (team.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = selectedBranch === 'all' || team.branchId === selectedBranch;
      const matchesRegion = selectedRegion === 'all' || team.regionId === selectedRegion;

      const matchesWorkspace = selectedWorkspace === 'all' || 
                             (team as any).workspaceId === selectedWorkspace;

      return matchesSearch && matchesBranch && matchesRegion && matchesWorkspace;
    }).reduce((unique: (Team | SystemWideTeam)[], team: Team | SystemWideTeam) => {
      const exists = unique.find(existing => existing.id === team.id);
      if (!exists) {
        unique.push(team);
      }
      return unique;
    }, []);
  }, [teams, searchTerm, selectedBranch, selectedRegion, selectedWorkspace]);

  // Region and branch filtering logic with role-based access
  const filteredRegions = useMemo(() => {
    if (!regions || !user || !currentWorkspace) {
      return [];
    }
    
    // If user is owner of main workspace, show all regions
    if (!currentWorkspace.parentWorkspaceId && currentWorkspace.ownerId === user.uid) {
      return regions;
    }
    
    // For admin/member users, show only regions from current workspace
    const currentWorkspaceRegions = regions.filter(region => region.workspaceId === currentWorkspace.id);
    
    // Add regions from teams the user belongs to (cross-workspace access)
    const teamRegionIds = userTeams.map(ut => teams.find(t => t.id === ut.team.id)?.regionId).filter(Boolean);
    const teamRegions = regions.filter(region => teamRegionIds.includes(region.id));
    
    // Combine and deduplicate
    const allAccessibleRegions = [...currentWorkspaceRegions];
    teamRegions.forEach(region => {
      if (!allAccessibleRegions.find(r => r.id === region.id)) {
        allAccessibleRegions.push(region);
      }
    });
    
    return allAccessibleRegions;
  }, [regions, user?.uid, currentWorkspace?.id, currentWorkspace?.ownerId, currentWorkspace?.parentWorkspaceId, userTeams, teams]);

  const filteredBranches = useMemo(() => {
    if (!branches || !user || !currentWorkspace) return [];
    
    // Similar logic for branches
    if (!currentWorkspace.parentWorkspaceId && currentWorkspace.ownerId === user.uid) {
      return branches;
    }
    
    const currentWorkspaceBranches = branches.filter(branch => branch.workspaceId === currentWorkspace.id);
    const teamBranchIds = userTeams.map(ut => teams.find(t => t.id === ut.team.id)?.branchId).filter(Boolean);
    const teamBranches = branches.filter(branch => teamBranchIds.includes(branch.id));
    
    const allAccessibleBranches = [...currentWorkspaceBranches];
    teamBranches.forEach(branch => {
      if (!allAccessibleBranches.find(b => b.id === branch.id)) {
        allAccessibleBranches.push(branch);
      }
    });
    
    return allAccessibleBranches;
  }, [branches, user?.uid, currentWorkspace?.id, currentWorkspace?.ownerId, currentWorkspace?.parentWorkspaceId, userTeams, teams]);

  // Simple stable ownership check
  const isWorkspaceOwner = useMemo(() => {
    return currentWorkspace && !currentWorkspace.parentWorkspaceId && currentWorkspace.ownerId === user?.uid;
  }, [currentWorkspace?.id, currentWorkspace?.parentWorkspaceId, currentWorkspace?.ownerId, user?.uid]);

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No workspace selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading teams...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* System-Wide Banner - Responsive */}
      {isSystemWideView && (
        <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0">
            <Globe className="h-5 w-5 text-blue-600 mr-0 sm:mr-2 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-medium text-blue-800 dark:text-blue-200 text-sm sm:text-base">
                System-Wide Teams Management
              </h3>
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300 mt-1">
                You're viewing teams across all {availableWorkspaces.length} workspaces. 
                Teams are displayed with their workspace context.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header - Mobile-First Responsive */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
            Teams
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2 leading-relaxed">
            {isSystemWideView ? (
              <>
                <span className="block sm:inline">
                  System-wide management across {availableWorkspaces.length} workspace{availableWorkspaces.length !== 1 ? 's' : ''}
                </span>
                {teams.length > 0 && (
                  <span className="block sm:inline sm:ml-2">
                    • {teams.length} total team{teams.length !== 1 ? 's' : ''}
                  </span>
                )}
                {userTeams.length > 0 && (
                  <span className="block sm:inline sm:ml-2">
                    • You're in {userTeams.length} team{userTeams.length !== 1 ? 's' : ''}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="block sm:inline">
                  Manage teams in {currentWorkspace.name}
                </span>
                {userTeams.length > 0 && (
                  <span className="block sm:inline sm:ml-2">
                    • You're a member of {userTeams.length} team{userTeams.length !== 1 ? 's' : ''}
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {/* Create Button - Touch-Friendly */}
        {permissions.canCreateTeams && (
          <div className="flex-shrink-0 w-full sm:w-auto">
            <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full sm:w-auto h-11 sm:h-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 touch-manipulation"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">
                    {isSystemWideView ? 'Create System-Wide Team' : 'Create Team'}
                  </span>
                </Button>
              </DialogTrigger>
              <CreateTeamDialog
                isOpen={isCreateTeamOpen}
                setIsOpen={setIsCreateTeamOpen}
                teamForm={teamForm}
                setTeamForm={setTeamForm}
                branches={filteredBranches}
                regions={filteredRegions}
                onSubmit={handleCreateTeam}
                isSubmitting={creating}
                isSystemWideView={isSystemWideView}
                availableWorkspaces={availableWorkspaces}
                currentWorkspace={currentWorkspace}
              />
            </Dialog>
          </div>
        )}
      </div>

      {/* Enhanced Filters - Responsive Grid */}
      <div className="space-y-3 sm:space-y-0">
        {/* Search - Full Width on Mobile */}
        <div className="relative w-full sm:hidden">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 pl-10 border-border/50 focus:border-primary touch-manipulation"
          />
        </div>

        {/* Filters Grid - Responsive Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {/* Search - Hidden on Mobile, Visible on SM+ */}
          <div className="hidden sm:block relative lg:col-span-2 xl:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-10 border-border/50 focus:border-primary"
            />
          </div>
          
          {/* Workspace Filter for System-Wide View */}
          {isSystemWideView && availableWorkspaces.length > 1 && (
            <div className="sm:col-span-1">
              <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                <SelectTrigger className="h-11 sm:h-10 w-full touch-manipulation">
                  <SelectValue placeholder="Filter by workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workspaces</SelectItem>
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
            </div>
          )}
          
          {/* Region Filter */}
          <div className="sm:col-span-1">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="h-11 sm:h-10 w-full touch-manipulation">
                <SelectValue placeholder={isWorkspaceOwner ? "All Regions" : isAdminOrOwner ? "Accessible Regions" : "Your Regions"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isWorkspaceOwner ? "All Regions" : isAdminOrOwner ? "Accessible Regions" : "Your Regions"}
                </SelectItem>
                {filteredRegions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    <span className="truncate">{region.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Branch Filter */}
          <div className="sm:col-span-1">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="h-11 sm:h-10 w-full touch-manipulation">
                <SelectValue placeholder={isWorkspaceOwner ? "All Branches" : isAdminOrOwner ? "Accessible Branches" : "Your Branches"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isWorkspaceOwner ? "All Branches" : isAdminOrOwner ? "Accessible Branches" : "Your Branches"}
                </SelectItem>
                {filteredBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    <span className="truncate">{branch.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Teams Grid - Responsive */}
      <div className="w-full">
        <TeamCardGrid
          filteredTeams={filteredTeams}
          teamsLength={teams.length}
          isUserInTeam={isUserInTeam}
          getUserTeamRole={getUserTeamRole}
          getBranchName={getBranchName}
          getRegionName={getRegionName}
          handleEditTeam={handleEditTeam}
          handleDeleteTeam={handleDeleteTeam}
          handleJoinTeam={handleJoinTeam}
          handleLeaveTeam={handleLeaveTeam}
          joiningTeam={joiningTeam}
          leavingTeam={leavingTeam}
          isAdminOrOwner={isAdminOrOwner}
          permissions={permissions}
          setIsCreateTeamOpen={setIsCreateTeamOpen}
          user={user || undefined}
          isSystemWideView={isSystemWideView}
          selectedWorkspace={selectedWorkspace}
        />
      </div>

      {/* Edit Team Dialog */}
      {selectedTeam && (
        <EditTeamDialog
          isOpen={isEditTeamOpen}
          setIsOpen={setIsEditTeamOpen}
          teamForm={teamForm}
          setTeamForm={setTeamForm}
          branches={filteredBranches}
          regions={filteredRegions}
          onSubmit={handleUpdateTeam}
          isSubmitting={updating}
          selectedTeam={selectedTeam}
        />
      )}

      {/* Delete Team Alert Dialog */}
      <DeleteTeamAlertDialog
        isOpen={isDeleteTeamAlertOpen}
        setIsOpen={setIsDeleteTeamAlertOpen}
        teamName={teams.find(t => t.id === teamToDelete)?.name || 'this team'}
        onConfirm={confirmDeleteTeam}
        isSubmitting={updating}
      />
    </div>
  );
} 