import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { TeamService } from '@/lib/team-service';
import { UserService } from '@/lib/user-service';
import { Team } from '@/lib/types';
import { convertTimestamps } from '@/lib/firestore-utils';
import {
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Search,
  Loader2,
  Mail,
  User,
  AlertCircle,
} from 'lucide-react';

interface ManageMembersDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  team: Team;
  onMembersUpdated: () => void;
  canManageMembers: boolean;
}

interface TeamMemberWithDetails {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  joinedAt: Date;
  assignedBy?: string;
  user: {
    id: string;
    name: string;
    email: string;
    photoURL?: string | null;
  };
}

interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  photoURL?: string | null;
  role: string;
}

export default function ManageMembersDialog({
  isOpen,
  setIsOpen,
  team,
  onMembersUpdated,
  canManageMembers,
}: ManageMembersDialogProps) {
  const [members, setMembers] = useState<TeamMemberWithDetails[]>([]);
  const [availableUsers, setAvailableUsers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'member' | 'lead'>('member');
  const [processingActions, setProcessingActions] = useState<{[key: string]: boolean}>({});

  // Load team members and available users
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [teamMembers, workspaceUsers] = await Promise.all([
        TeamService.getTeamMembersWithDetails(team.id),
        UserService.getUsersByWorkspace(team.workspaceId),
      ]);
      setMembers(teamMembers);
      const memberUserIds = teamMembers.map((m: TeamMemberWithDetails) => m.userId);
      const availableUsersFiltered = workspaceUsers.filter((user: any) => 
        !memberUserIds.includes(user.id)
      );
      setAvailableUsers(availableUsersFiltered);
    } catch (error) {
      console.error('Error loading member management data:', error);
      toast({
        title: "Error",
        description: "Failed to load team members and users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [team]);

  useEffect(() => {
    if (isOpen && team) {
      loadData();
    }
  }, [isOpen, team, loadData]);

  const handleAddMember = async () => {
    if (!selectedUserId || !canManageMembers) return;

    setProcessingActions(prev => ({ ...prev, [`add-${selectedUserId}`]: true }));
    try {
      await TeamService.addUserToTeam(selectedUserId, team.id, selectedRole);
      
      toast({
        title: "Success",
        description: `User added to team as ${selectedRole}`,
      });

      setSelectedUserId('');
      setSelectedRole('member');
      await loadData();
      onMembersUpdated();
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: "Error",
        description: "Failed to add user to team",
        variant: "destructive",
      });
    } finally {
      setProcessingActions(prev => ({ ...prev, [`add-${selectedUserId}`]: false }));
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!canManageMembers) return;

    if (!confirm(`Remove ${userName} from ${team.name}?`)) return;

    setProcessingActions(prev => ({ ...prev, [`remove-${userId}`]: true }));
    try {
      await TeamService.removeUserFromTeam(userId, team.id);
      
      toast({
        title: "Success",
        description: `${userName} removed from team`,
      });

      await loadData();
      onMembersUpdated();
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        title: "Error",
        description: "Failed to remove user from team",
        variant: "destructive",
      });
    } finally {
      setProcessingActions(prev => ({ ...prev, [`remove-${userId}`]: false }));
    }
  };

  const handleChangeRole = async (userId: string, userName: string, currentRole: string) => {
    if (!canManageMembers) return;

    const newRole = currentRole === 'lead' ? 'member' : 'lead';
    
    if (!confirm(`Change ${userName}'s role to ${newRole}?`)) return;

    setProcessingActions(prev => ({ ...prev, [`role-${userId}`]: true }));
    try {
      await TeamService.updateTeamUserRole(userId, team.id, newRole, team.workspaceId);
      
      toast({
        title: "Success",
        description: `${userName}'s role changed to ${newRole}`,
      });

      await loadData();
      onMembersUpdated();
    } catch (error) {
      console.error('Error changing user role:', error);
      toast({
        title: "Error",
        description: "Failed to change user role",
        variant: "destructive",
      });
    } finally {
      setProcessingActions(prev => ({ ...prev, [`role-${userId}`]: false }));
    }
  };

  const handleAssignTeamLead = async (userId: string, userName: string) => {
    if (!canManageMembers) return;

    if (!confirm(`Assign ${userName} as team lead?`)) return;

    setProcessingActions(prev => ({ ...prev, [`lead-${userId}`]: true }));
    try {
      await TeamService.assignTeamLead(team.id, userId, team.workspaceId);
      
      toast({
        title: "Success",
        description: `${userName} assigned as team lead`,
      });

      await loadData();
      onMembersUpdated();
    } catch (error) {
      console.error('Error assigning team lead:', error);
      toast({
        title: "Error",
        description: "Failed to assign team lead",
        variant: "destructive",
      });
    } finally {
      setProcessingActions(prev => ({ ...prev, [`lead-${userId}`]: false }));
    }
  };

  // Filter available users based on search
  const filteredAvailableUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center text-lg sm:text-xl">
            <Users className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="truncate">Manage Team Members</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Manage members for <span className="font-semibold text-foreground">{team.name}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 sm:py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2 text-sm sm:text-base">Loading members...</span>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-200px)] overflow-y-auto pr-2 sm:pr-4">
            {/* Add New Member Section */}
            {canManageMembers && (
              <div className="space-y-4 p-3 sm:p-4 border rounded-xl bg-gradient-to-br from-muted/20 to-muted/10 border-border/50">
                <h3 className="font-medium flex items-center text-sm sm:text-base">
                  <UserPlus className="h-4 w-4 mr-2 flex-shrink-0" />
                  Add New Member
                </h3>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search available users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 sm:h-10 touch-manipulation rounded-lg border-border/50 focus:border-primary"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:items-end">
                  <div className="flex-1">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="h-11 sm:h-10 touch-manipulation rounded-lg border-border/50">
                        <SelectValue placeholder="Select user to add" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {filteredAvailableUsers.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground">
                            {searchTerm ? 'No users found matching search' : 'All workspace users are already team members'}
                          </div>
                        ) : (
                          filteredAvailableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id} className="rounded-lg">
                              <div className="flex items-center min-w-0">
                                <Avatar className="h-6 w-6 mr-2 flex-shrink-0">
                                  <AvatarImage src={user.photoURL || ''} />
                                  <AvatarFallback className="text-xs">
                                    {user.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium truncate">{user.name}</div>
                                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Select value={selectedRole} onValueChange={(value: 'member' | 'lead') => setSelectedRole(value)}>
                    <SelectTrigger className="w-full sm:w-32 h-11 sm:h-10 touch-manipulation rounded-lg border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="member" className="rounded-lg">
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Member
                        </span>
                      </SelectItem>
                      <SelectItem value="lead" className="rounded-lg">
                        <span className="flex items-center">
                          <Crown className="h-4 w-4 mr-1" />
                          Lead
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={handleAddMember}
                    disabled={!selectedUserId || processingActions[`add-${selectedUserId}`]}
                    className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation rounded-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    {processingActions[`add-${selectedUserId}`] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Add Member
                  </Button>
                </div>
              </div>
            )}

            <Separator className="rounded-full" />

            {/* Current Members List */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <h3 className="font-medium flex items-center text-sm sm:text-base">
                  <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                  Current Members ({members.length})
                </h3>
                {!canManageMembers && (
                  <div className="flex items-center text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                    View Only
                  </div>
                )}
              </div>

              {members.length === 0 ? (
                <div className="text-center py-12 sm:py-8 text-muted-foreground">
                  <div className="w-16 h-16 bg-gradient-to-br from-muted/30 to-muted/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="text-sm sm:text-base">No team members yet</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-xl bg-gradient-to-br from-card to-card/50 hover:from-muted/20 hover:to-muted/10 transition-all duration-200 space-y-3 sm:space-y-0 border-border/50">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-border/20">
                          <AvatarImage src={member.user.photoURL || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                            {member.user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                            <span className="font-medium truncate">{member.user.name}</span>
                            <Badge 
                              variant={member.role === 'lead' ? "default" : "secondary"}
                              className={`text-xs self-start sm:self-center rounded-full ${
                                member.role === 'lead' 
                                  ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-700 dark:text-yellow-300' 
                                  : 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-700 dark:text-blue-300'
                              }`}
                            >
                              {member.role === 'lead' ? (
                                <>
                                  <Crown className="h-3 w-3 mr-1" />
                                  Lead
                                </>
                              ) : (
                                <>
                                  <User className="h-3 w-3 mr-1" />
                                  Member
                                </>
                              )}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{member.user.email}</span>
                            </div>
                            <span className="hidden sm:inline">•</span>
                            <span className="text-xs">Joined {convertTimestamps(member.joinedAt)?.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {canManageMembers && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                          {/* Change Role Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangeRole(member.userId, member.user.name, member.role)}
                            disabled={processingActions[`role-${member.userId}`]}
                            className="h-9 sm:h-8 touch-manipulation text-xs rounded-lg border-border/50 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
                          >
                            {processingActions[`role-${member.userId}`] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : member.role === 'lead' ? (
                              <>
                                <User className="h-4 w-4 mr-1" />
                                Make Member
                              </>
                            ) : (
                              <>
                                <Crown className="h-4 w-4 mr-1" />
                                Make Lead
                              </>
                            )}
                          </Button>

                          {/* Remove Member Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId, member.user.name)}
                            disabled={processingActions[`remove-${member.userId}`]}
                            className="h-9 sm:h-8 touch-manipulation text-destructive hover:text-destructive hover:bg-destructive/10 text-xs rounded-lg border-border/50"
                          >
                            {processingActions[`remove-${member.userId}`] ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <UserMinus className="h-4 w-4 mr-1" />
                            )}
                            <span className="sm:hidden">Remove</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team Lead Assignment Section */}
            {canManageMembers && !team.leadId && members.length > 0 && (
              <>
                <Separator className="rounded-full" />
                <div className="space-y-4 p-3 sm:p-4 border rounded-xl bg-gradient-to-br from-amber-50/50 to-yellow-50/30 dark:from-amber-900/20 dark:to-yellow-900/10 border-amber-200/50 dark:border-amber-800/50">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
                    <h3 className="font-medium text-amber-800 dark:text-amber-200 text-sm sm:text-base">
                      No Team Lead Assigned
                    </h3>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    This team doesn&apos;t have a lead. You can assign one of the current members as team lead.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {members.map((member) => (
                      <Button
                        key={member.userId}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignTeamLead(member.userId, member.user.name)}
                        disabled={processingActions[`lead-${member.userId}`]}
                        className="h-9 sm:h-8 bg-background hover:bg-amber-100 dark:hover:bg-amber-900/50 touch-manipulation text-xs justify-start rounded-lg border-amber-200/50 dark:border-amber-800/50"
                      >
                        {processingActions[`lead-${member.userId}`] ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Crown className="h-4 w-4 mr-2" />
                        )}
                        <span className="truncate">Assign {member.user.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 