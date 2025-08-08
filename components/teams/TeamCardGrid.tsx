// components/teams/TeamCardGrid.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Team, SystemWideTeam, Branch, Region } from '@/lib/types';
import { convertTimestamps } from '@/lib/firestore-utils';
import { RolePermissions } from '@/lib/rbac-hooks';
import { TeamService } from '@/lib/team-service';
import {
  Users,
  Edit,
  Loader2,
  Building,
  MapPin,
  Trash2,
  UserPlus,
  UserMinus,
  Crown,
  CheckCircle,
  Plus,
  Settings,
  Globe,
  Lock,
  Video,
} from 'lucide-react';
import { TeamCollaborationService } from '@/lib/team-collaboration-service';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

interface TeamCardGridProps {
  filteredTeams: (Team | SystemWideTeam)[];
  teamsLength: number;
  isUserInTeam: (teamId: string) => boolean;
  getUserTeamRole: (teamId: string) => string | null;
  getBranchName: (branchId?: string) => string;
  getRegionName: (regionId?: string) => string;
  handleEditTeam: (team: Team) => void;
  handleDeleteTeam: (teamId: string) => void;
  handleJoinTeam: (team: Team, role?: 'lead' | 'member') => Promise<void>;
  handleLeaveTeam: (team: Team) => Promise<void>;
  joiningTeam: string | null;
  leavingTeam: string | null;
  isAdminOrOwner: boolean;
  permissions: RolePermissions;
  setIsCreateTeamOpen: (isOpen: boolean) => void;
  user?: { uid: string }; // Add user prop
  isSystemWideView?: boolean; // Add system-wide view flag
  selectedWorkspace?: string; // Add workspace filter
}

export default function TeamCardGrid({
  filteredTeams,
  teamsLength,
  isUserInTeam,
  getUserTeamRole,
  getBranchName,
  getRegionName,
  handleEditTeam,
  handleDeleteTeam,
  handleJoinTeam,
  handleLeaveTeam,
  joiningTeam,
  leavingTeam,
  isAdminOrOwner,
  permissions,
  setIsCreateTeamOpen,
  user,
  isSystemWideView = false,
  selectedWorkspace = 'all',
}: TeamCardGridProps) {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  // Member management navigation
  const [memberManagementLoading, setMemberManagementLoading] = useState<string | null>(null);
  // Video call state
  const [startingCall, setStartingCall] = useState<string | null>(null);

  // Handle member management navigation
  const handleManageMembers = async (team: Team) => {
    if (!user) return;

    setMemberManagementLoading(team.id);
    try {
      // Check if user can manage this specific team
      const canManage = await TeamService.canManageSpecificTeam(user.uid, team);
      if (canManage) {
        // Navigate to the team members sub-page
        router.push(`/dashboard/teams/${team.id}/members`);
      }
    } catch (error) {
      console.error('Error checking team management permissions:', error);
    } finally {
      setMemberManagementLoading(null);
    }
  };

  // Handle starting team video call
  const handleStartTeamCall = async (team: Team) => {
    if (!authUser) return;

    setStartingCall(team.id);
    try {
      const { meeting, channelName } = await TeamCollaborationService.startInstantTeamMeeting(
        team.id,
        authUser.uid,
        `${team.name} Team Meeting`,
        'Instant team meeting'
      );

      if (channelName) {
        // Navigate to the video call room using the channel name
        router.push(`/dashboard/video-call/${channelName}`);
      } else {
        toast({
          title: "Error",
          description: "Failed to create video call room",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error starting team call:', error);
      toast({
        title: "Error",
        description: "Failed to start team meeting",
        variant: "destructive",
      });
    } finally {
      setStartingCall(null);
    }
  };

  // Get workspace badge for system-wide view
  const getWorkspaceBadge = (team: any) => {
    if (!isSystemWideView) return null;

    return (
      <Badge variant="outline" className="text-xs ml-2">
        {team.workspaceType === 'main' ? (
          <>
            <Globe className="h-3 w-3 mr-1" />
            {team.workspaceName || 'Main'}
          </>
        ) : (
          <>
            <Building className="h-3 w-3 mr-1" />
            {team.workspaceName || 'Sub-workspace'}
          </>
        )}
      </Badge>
    );
  };

  return (
    <>
      {filteredTeams.length === 0 ? (
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">No teams found</h3>
              <p className="text-muted-foreground mb-4">
                {teamsLength === 0
                  ? isSystemWideView
                    ? "No teams exist across any workspaces yet."
                    : "Get started by creating your first team."
                  : selectedWorkspace === 'all'
                  ? "Try adjusting your search or filters."
                  : "No teams found in the selected workspace."
                }
              </p>
              {permissions.canCreateTeams && teamsLength === 0 && (
                <Button
                  onClick={() => setIsCreateTeamOpen(true)}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Team
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredTeams.map((team, index) => {
            const isInTeam = isUserInTeam(team.id);
            const userRole = getUserTeamRole(team.id);
            const isTeamLead = userRole === 'lead';
            const canManageThisTeam = isAdminOrOwner || isTeamLead;

            return (
              <Card key={`team-${index}-${team.id}-${isSystemWideView ? 'sys' : 'ws'}-${team.workspaceId || 'none'}`} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary bg-gradient-to-br from-card to-card/50 h-fit">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row sm:items-center">
                        <span className="truncate">{team.name}</span>
                        {getWorkspaceBadge(team)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {team.description || 'No description provided'}
                      </p>
                    </div>
                    
                    {/* Team Lead Badge */}
                    {team.leadId && (
                      <Badge variant="outline" className="ml-0 sm:ml-2 mt-2 sm:mt-0 self-start bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400">
                        <Crown className="h-3 w-3 mr-1" />
                        Lead
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 sm:space-y-4">
                  {/* Team Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Building className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{getBranchName(team.branchId)}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{getRegionName(team.regionId)}</span>
                    </div>
                  </div>

                  {/* Member Status */}
                  {isInTeam && (
                    <div className="flex items-center space-x-2 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-sm text-green-700 dark:text-green-300">
                        You&apos;re a {userRole} of this team
                      </span>
                    </div>
                  )}

                  {/* Action Buttons - Mobile-First Layout */}
                  <div className="pt-2 border-t space-y-4">
                    {/* Management Buttons Row */}
                    {(canManageThisTeam && (permissions.canEditTeams || permissions.canDeleteTeams)) && (
                      <div className="flex flex-wrap gap-3 sm:gap-4">
                        {/* Video Call Button - Available for team members */}
                        {isInTeam && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartTeamCall(team)}
                            disabled={startingCall === team.id}
                            className="text-xs h-8 px-3 touch-manipulation flex-1 sm:flex-none rounded-lg border-border/50 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10"
                          >
                            {startingCall === team.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Video className="h-3 w-3 mr-1" />
                            )}
                            Call
                          </Button>
                        )}

                        {/* Member Management Button - Now navigates to sub-page */}
                        {canManageThisTeam && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageMembers(team)}
                            disabled={memberManagementLoading === team.id}
                            className="text-xs h-8 px-3 touch-manipulation flex-1 sm:flex-none rounded-lg border-border/50 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
                          >
                            {memberManagementLoading === team.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Users className="h-3 w-3 mr-1" />
                            )}
                            Members
                          </Button>
                        )}

                        {/* Edit Button */}
                        {permissions.canEditTeams && canManageThisTeam && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTeam(team)}
                            className="text-xs h-8 px-3 touch-manipulation flex-1 sm:flex-none rounded-lg border-border/50 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}

                        {/* Delete Button */}
                        {permissions.canDeleteTeams && canManageThisTeam && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTeam(team.id)}
                            className="text-xs h-8 px-3 touch-manipulation text-destructive hover:text-destructive flex-1 sm:flex-none rounded-lg border-border/50 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3 mr-1 sm:mr-0" />
                            <span className="sm:hidden">Delete</span>
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Join/Leave Button - Full Width on Mobile */}
                    <div className="flex">
                      {!isInTeam ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleJoinTeam(team)}
                          disabled={joiningTeam === team.id}
                          className="text-xs h-9 sm:h-8 w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 touch-manipulation rounded-lg"
                        >
                          {joiningTeam === team.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <UserPlus className="h-3 w-3 mr-1" />
                          )}
                          Join Team
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLeaveTeam(team)}
                          disabled={leavingTeam === team.id}
                          className="text-xs h-9 sm:h-8 w-full touch-manipulation rounded-lg border-border/50"
                        >
                          {leavingTeam === team.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <UserMinus className="h-3 w-3 mr-1" />
                          )}
                          Leave Team
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}