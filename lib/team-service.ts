import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { Team, TeamUser, SystemWideTeam } from './types';
import { sortByDateDesc } from './firestore-utils';
import { BranchService } from './branch-service';
import { WorkspaceService } from './workspace-service';
import { ActivityService } from './activity-service';
import { auth } from './firebase';

export class TeamService {
    /**
   * Check if user can create teams in workspace
   * Admin: Can create teams only under the sub-workspace they're under
   * Owner: Can create teams for both main workspace and sub-workspaces
   */
  static async canCreateTeamInWorkspace(userId: string, workspaceId: string): Promise<boolean> {
    try {
      const userRole = await WorkspaceService.getUserRole(userId, workspaceId);
      
      // Owner can create teams in any workspace
      if (userRole === 'owner') {
        return true;
      }
      
      // Admin can create teams only in their assigned workspace
      if (userRole === 'admin') {
        return true; // Admin is already restricted to their workspace context
      }
      
      // Members cannot create teams
      return false;
    } catch (error) {
      console.error('Error checking team creation permission:', error);
      return false;
    }
  }

  /**
   * Check if user can manage team members
   */
  static async canManageTeamMembers(userId: string, workspaceId: string): Promise<boolean> {
    try {
      const userRole = await WorkspaceService.getUserRole(userId, workspaceId);
      return userRole === 'owner' || userRole === 'admin';
    } catch (error) {
      console.error('Error checking team member management permission:', error);
      return false;
    }
  }

  /**
   * Check if user can edit a specific team
   */
  static async canEditTeam(userId: string, team: Team): Promise<boolean> {
    try {
      const userRole = await WorkspaceService.getUserRole(userId, team.workspaceId);
      
      // Owner can edit any team
      if (userRole === 'owner') return true;
      
      // Admin can edit teams in their workspace
      if (userRole === 'admin') return true;
      
      // Team lead can edit their team
      if (team.leadId === userId) return true;
      
      return false;
    } catch (error) {
      console.error('Error checking team edit permission:', error);
      return false;
    }
  }

  /**
   * Create a new team with permission checking
   */
  static async createTeam(
    teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<string> {
    try {
      // Check permission before creating team
      const canCreate = await this.canCreateTeamInWorkspace(createdBy, teamData.workspaceId);
      if (!canCreate) {
        throw new Error('Insufficient permissions to create team in this workspace');
      }

      const teamRef = doc(collection(db, 'teams'));
      const teamId = teamRef.id;
      
      const team: Team = {
        ...teamData,
        id: teamId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
      };

      await setDoc(teamRef, team);
      
      // Log activity
      try {
        await ActivityService.logActivity(
          'team_created',
          'team',
          teamId,
          { 
            targetName: team.name,
            description: team.description,
            branchId: team.branchId,
            regionId: team.regionId,
            leadId: team.leadId
          },
          team.workspaceId,
          createdBy
        );
      } catch (error) {
        console.warn('Warning: Could not log team creation activity:', error);
      }
      
      // If team has a branchId, update the branch's teamIds array
      if (team.branchId) {
        await BranchService.assignTeamToBranch(teamId, team.branchId);
      }
      
      return teamId;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  /**
   * Get team by ID
   */
  static async getTeam(teamId: string): Promise<Team | null> {
    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);
      
      if (teamSnap.exists()) {
        return { id: teamSnap.id, ...teamSnap.data() } as Team;
      }
      return null;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  }
  /**
   * Get all teams in a workspace
   */
  static async getWorkspaceTeams(workspaceId: string): Promise<Team[]> {
    try {
      const teamsRef = collection(db, 'teams');
      
      // For development: remove orderBy to avoid index requirement
      // In production, add the composite index and use the commented query below
      const q = query(
        teamsRef,
        where('workspaceId', '==', workspaceId)
      );
      
      // Production query (requires composite index):
      // const q = query(
      //   teamsRef,
      //   where('workspaceId', '==', workspaceId),
      //   orderBy('createdAt', 'desc')
      // );
      
      const querySnapshot = await getDocs(q);
      const teams = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      
      // Sort in memory for development
      return sortByDateDesc(teams, 'createdAt');
    } catch (error) {
      console.error('Error fetching workspace teams:', error);
      throw error;
    }
  }

  /**
   * Get teams accessible to a user based on their role
   * Admin/Owner: See all teams in workspace
   * Member: See only teams they belong to
   */
  static async getAccessibleTeams(userId: string, workspaceId: string): Promise<Team[]> {
    try {
      const userRole = await WorkspaceService.getUserRole(userId, workspaceId);
      
      // Owner and admin can see all teams
      if (userRole === 'owner' || userRole === 'admin') {
        return await this.getWorkspaceTeams(workspaceId);
      }
      
      // Members can only see teams they belong to
      const userTeams = await this.getUserTeams(userId, workspaceId);
      return userTeams.map(ut => ut.team);
    } catch (error) {
      console.error('Error fetching accessible teams:', error);
      throw error;
    }
  }

  /**
   * Update team
   */
  static async updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
    try {
      // Get current team data to check for branchId changes
      const currentTeam = await this.getTeam(teamId);
      if (!currentTeam) {
        throw new Error('Team not found');
      }
      
      const teamRef = doc(db, 'teams', teamId);
      
      // Filter out undefined values
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      await updateDoc(teamRef, {
        ...cleanUpdates,
        updatedAt: new Date(),
      });
      
      // Log activity
      try {
        await ActivityService.logActivity(
          'team_updated',
          'team',
          teamId,
          { 
            targetName: currentTeam.name,
            updatedFields: Object.keys(cleanUpdates),
            changes: cleanUpdates
          },
          currentTeam.workspaceId,
          auth.currentUser?.uid
        );
      } catch (error) {
        console.warn('Warning: Could not log team update activity:', error);
      }
      
      // Handle branch assignment changes
      if ('branchId' in updates) {
        const oldBranchId = currentTeam.branchId || null;
        const newBranchId = updates.branchId || null;
        
        if (oldBranchId !== newBranchId) {
          await BranchService.updateTeamBranchAssignment(teamId, oldBranchId, newBranchId);
        }
      }
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }
  /**
   * Delete team
   */
  static async deleteTeam(teamId: string): Promise<void> {
    try {
      // Get team data to check for branchId before deletion
      const team = await this.getTeam(teamId);
      
      const teamRef = doc(db, 'teams', teamId);
      await deleteDoc(teamRef);
      
      // Remove team from branch's teamIds if it was assigned to a branch
      if (team && team.branchId) {
        await BranchService.removeTeamFromBranch(teamId, team.branchId);
      }
      
      // Note: In production, you'd also want to clean up teamUsers
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }

  /**
   * Add user to team
   */
  static async addUserToTeam(
    userId: string,
    teamId: string,
    role: 'lead' | 'member',
    assignedBy?: string
  ): Promise<void> {
    try {
      // Get team to check workspace permissions
      const team = await this.getTeam(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Check permission if assignedBy is provided (for admin/owner assignments)
      if (assignedBy && assignedBy !== userId) {
        const canManage = await this.canManageTeamMembers(assignedBy, team.workspaceId);
        if (!canManage) {
          throw new Error('Insufficient permissions to add users to team');
        }
      }

      const teamUserRef = doc(db, 'teamUsers', `${userId}_${teamId}`);
      const teamUser: TeamUser = {
        id: `${userId}_${teamId}`,
        userId,
        teamId,
        role,
        joinedAt: new Date(),
        assignedBy,
      };
      
      await setDoc(teamUserRef, teamUser);
      
      // If setting as lead, also update the team's leadId
      if (role === 'lead') {
        await updateDoc(doc(db, 'teams', teamId), {
          leadId: userId,
          updatedAt: new Date(),
        });
      }
      
      // Log activity
      try {
        await ActivityService.logActivity(
          'team_member_added',
          'team',
          teamId,
          { 
            targetName: team?.name || 'Unknown Team',
            userId: userId,
            role: role,
            assignedBy: assignedBy
          },
          team?.workspaceId || '',
          assignedBy || auth.currentUser?.uid
        );
      } catch (error) {
        console.warn('Warning: Could not log team member addition activity:', error);
      }
      
      // Update the user's teamIds array
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const teamIds = userData.teamIds || [];
        
        if (!teamIds.includes(teamId)) {
          await updateDoc(userRef, {
            teamIds: [...teamIds, teamId]
          });
        }
      }
    } catch (error) {
      console.error('Error adding user to team:', error);
      throw error;
    }
  }
  
  /**
   * Update user's role in a team
   */
  static async updateTeamUserRole(
    userId: string,
    teamId: string,
    newRole: 'lead' | 'member',
    updatedBy: string
  ): Promise<void> {
    try {
      // First, get the team to check workspace
      const team = await this.getTeam(teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      
      // Check if the updater has permission in the workspace
      const updaterWorkspaceRole = await WorkspaceService.getUserRole(updatedBy, team.workspaceId);
      if (!updaterWorkspaceRole || (updaterWorkspaceRole !== 'owner' && updaterWorkspaceRole !== 'admin')) {
        throw new Error('Insufficient permissions to update team user role');
      }
      
      // Update the role
      const teamUserRef = doc(db, 'teamUsers', `${userId}_${teamId}`);
      await updateDoc(teamUserRef, {
        role: newRole,
      });
      
      // If setting as lead, update the team document too
      if (newRole === 'lead') {
        await updateDoc(doc(db, 'teams', teamId), {
          leadId: userId
        });
      } else if (team.leadId === userId) {
        // If removing as lead, clear the leadId
        await updateDoc(doc(db, 'teams', teamId), {
          leadId: null
        });
      }
    } catch (error) {
      console.error('Error updating team user role:', error);
      throw error;
    }
  }

  /**
   * Remove user from team
   */
  static async removeUserFromTeam(userId: string, teamId: string): Promise<void> {
    try {
      // Get team data before removal for logging
      const team = await this.getTeam(teamId);
      
      // Remove from teamUsers collection
      const teamUserRef = doc(db, 'teamUsers', `${userId}_${teamId}`);
      await deleteDoc(teamUserRef);
      
      // Log activity
      try {
        await ActivityService.logActivity(
          'team_member_removed',
          'team',
          teamId,
          { 
            targetName: team?.name || 'Unknown Team',
            userId: userId
          },
          team?.workspaceId || '',
          auth.currentUser?.uid
        );
      } catch (error) {
        console.warn('Warning: Could not log team member removal activity:', error);
      }
      
      // Update the user's teamIds array
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const teamIds = userData.teamIds || [];
          if (teamIds.includes(teamId)) {
          await updateDoc(userRef, {
            teamIds: teamIds.filter((id: string) => id !== teamId)
          });
        }
      }
      
      // Check if user was the team lead and update team if needed
      if (team && team.leadId === userId) {
        await updateDoc(doc(db, 'teams', teamId), {
          leadId: null
        });
      }
    } catch (error) {
      console.error('Error removing user from team:', error);
      throw error;
    }
  }
  /**
   * Get team members
   */
  static async getTeamMembers(teamId: string): Promise<TeamUser[]> {
    try {
      const teamUsersRef = collection(db, 'teamUsers');
      const q = query(
        teamUsersRef,
        where('teamId', '==', teamId)
        // Note: Removed orderBy to avoid requiring a composite index
        // For production, create the composite index and uncomment:
        // orderBy('joinedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const members = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamUser));
        // Sort on client side
      return sortByDateDesc(members, 'joinedAt');
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  }
  /**
   * Get user's teams in a workspace
   */
  static async getUserTeams(userId: string, workspaceId: string): Promise<{team: Team, role: string}[]> {
    try {
      const teamUsersRef = collection(db, 'teamUsers');
      const q = query(
        teamUsersRef,
        where('userId', '==', userId)
        // Note: Removed orderBy to avoid requiring a composite index
        // For production, create the composite index and uncomment:
        // orderBy('joinedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const results = [];
      
      for (const docSnap of querySnapshot.docs) {
        const teamUser = docSnap.data() as TeamUser;
        const team = await this.getTeam(teamUser.teamId);
        if (team && team.workspaceId === workspaceId) {
          results.push({
            team,
            role: teamUser.role,
            joinedAt: teamUser.joinedAt // Include for sorting
          });
        }
      }
        // Sort on client side
      return sortByDateDesc(results, 'joinedAt' as any).map(({ team, role }) => ({ team, role }));
    } catch (error) {
      console.error('Error fetching user teams:', error);
      throw error;
    }
  }

  /**
   * Get user's role in a team
   */
  static async getUserTeamRole(userId: string, teamId: string): Promise<string | null> {
    try {
      const teamUserRef = doc(db, 'teamUsers', `${userId}_${teamId}`);
      const teamUserSnap = await getDoc(teamUserRef);
      
      if (teamUserSnap.exists()) {
        const teamUser = teamUserSnap.data() as TeamUser;
        return teamUser.role;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user team role:', error);
      throw error;
    }
  }

  /**
   * Assign team lead with permission checking
   */
  static async assignTeamLead(teamId: string, leadId: string, assignedBy: string): Promise<void> {
    try {
      const team = await this.getTeam(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Check permission
      const canAssign = await this.canManageTeamMembers(assignedBy, team.workspaceId);
      if (!canAssign) {
        throw new Error('Insufficient permissions to assign team lead');
      }

      // Update team with new lead
      await updateDoc(doc(db, 'teams', teamId), {
        leadId: leadId,
        updatedAt: new Date(),
      });

      // Add user to team as lead if not already a member
      const existingRole = await this.getUserTeamRole(leadId, teamId);
      if (!existingRole) {
        await this.addUserToTeam(leadId, teamId, 'lead', assignedBy);
      } else {
        // Update existing member role to lead
        await this.updateTeamUserRole(leadId, teamId, 'lead', assignedBy);
      }

      // Log activity
      try {
        await ActivityService.logActivity(
          'team_lead_assigned',
          'team',
          teamId,
          { 
            targetName: team.name,
            leadId: leadId,
            assignedBy: assignedBy
          },
          team.workspaceId,
          assignedBy
        );
      } catch (error) {
        console.warn('Warning: Could not log team lead assignment activity:', error);
      }
    } catch (error) {
      console.error('Error assigning team lead:', error);
      throw error;
    }
  }

  /**
   * Remove team lead
   */
  static async removeTeamLead(teamId: string, removedBy: string): Promise<void> {
    try {
      const team = await this.getTeam(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Check permission
      const canRemove = await this.canManageTeamMembers(removedBy, team.workspaceId);
      if (!canRemove) {
        throw new Error('Insufficient permissions to remove team lead');
      }

      const oldLeadId = team.leadId;

      // Update team to remove lead
      await updateDoc(doc(db, 'teams', teamId), {
        leadId: null,
        updatedAt: new Date(),
      });

      // Update team user role to member if they're still in the team
      if (oldLeadId) {
        const existingRole = await this.getUserTeamRole(oldLeadId, teamId);
        if (existingRole) {
          await this.updateTeamUserRole(oldLeadId, teamId, 'member', removedBy);
        }
      }

      // Log activity
      try {
        await ActivityService.logActivity(
          'team_lead_removed',
          'team',
          teamId,
          { 
            targetName: team.name,
            previousLeadId: oldLeadId,
            removedBy: removedBy
          },
          team.workspaceId,
          removedBy
        );
      } catch (error) {
        console.warn('Warning: Could not log team lead removal activity:', error);
      }
    } catch (error) {
      console.error('Error removing team lead:', error);
      throw error;
    }
  }

  // ===============================
  // SYSTEM-WIDE FUNCTIONALITY
  // ===============================

  /**
   * Get teams across all accessible workspaces for system-wide view
   * Only available to main workspace owners
   */
  static async getSystemWideTeams(userId: string): Promise<{teams: SystemWideTeam[], workspaces: any[]}> {
    try {
      // Get all accessible workspaces for the user
      const workspaceData = await WorkspaceService.getUserAccessibleWorkspaces(userId);
      
      // Extract all workspaces from the structure
      const allWorkspaces = [
        ...workspaceData.mainWorkspaces,
        ...Object.values(workspaceData.subWorkspaces).flat()
      ];
      
      // Check if user is owner of a main workspace
      const mainWorkspace = workspaceData.mainWorkspaces.find(w => workspaceData.userRoles[w.id] === 'owner');
      if (!mainWorkspace) {
        throw new Error('System-wide access requires main workspace owner role');
      }

      const allTeams: SystemWideTeam[] = [];
      const seenTeamIds = new Set<string>();
      
      // Load teams from all workspaces with deduplication
      for (const workspace of allWorkspaces) {
        try {
          const workspaceTeams = await this.getWorkspaceTeams(workspace.id);
          // Add workspace info to each team for context and deduplicate
          for (const team of workspaceTeams) {
            if (!seenTeamIds.has(team.id)) {
              seenTeamIds.add(team.id);
              const systemWideTeam: SystemWideTeam = {
                ...team,
                workspaceName: workspace.name,
                workspaceType: workspace.parentWorkspaceId ? 'sub' : 'main'
              };
              allTeams.push(systemWideTeam);
            }
          }
        } catch (error) {
          console.warn(`Failed to load teams from workspace ${workspace.name}:`, error);
        }
      }

      return {
        teams: sortByDateDesc(allTeams, 'createdAt'),
        workspaces: allWorkspaces
      };
    } catch (error) {
      console.error('Error fetching system-wide teams:', error);
      throw error;
    }
  }

  /**
   * Get teams with proper role-based visibility
   * Uses getAccessibleTeams for members, getWorkspaceTeams for admin/owners
   */
  static async getTeamsWithRoleBasedVisibility(userId: string, workspaceId: string): Promise<Team[]> {
    try {
      const userRole = await WorkspaceService.getUserRole(userId, workspaceId);
      
      // Admin/Owner: See all teams in workspace
      if (userRole === 'owner' || userRole === 'admin') {
        return await this.getWorkspaceTeams(workspaceId);
      }
      
      // Members: Only see teams they belong to
      return await this.getAccessibleTeams(userId, workspaceId);
    } catch (error) {
      console.error('Error fetching teams with role-based visibility:', error);
      throw error;
    }
  }

  /**
   * Get team members with user details for member management
   */
  static async getTeamMembersWithDetails(teamId: string): Promise<any[]> {
    try {
      const teamMembers = await this.getTeamMembers(teamId);
      const membersWithDetails = [];

      for (const member of teamMembers) {
        try {
          const userRef = doc(db, 'users', member.userId);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            membersWithDetails.push({
              ...member,
              user: {
                id: member.userId,
                name: userData.name || 'Unknown User',
                email: userData.email || '',
                photoURL: userData.photoURL || null
              }
            });
          }
        } catch (error) {
          console.warn(`Failed to load user details for ${member.userId}:`, error);
          // Add member without user details
          membersWithDetails.push({
            ...member,
            user: {
              id: member.userId,
              name: 'Unknown User',
              email: '',
              photoURL: null
            }
          });
        }
      }

      return membersWithDetails;
    } catch (error) {
      console.error('Error fetching team members with details:', error);
      throw error;
    }
  }

  /**
   * Check if user can manage a specific team's members
   */
  static async canManageSpecificTeam(userId: string, team: Team): Promise<boolean> {
    try {
      const userRole = await WorkspaceService.getUserRole(userId, team.workspaceId);
      
      // Owner and admin can manage any team
      if (userRole === 'owner' || userRole === 'admin') {
        return true;
      }
      
      // Team lead can manage their team
      if (team.leadId === userId) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking team management permission:', error);
      return false;
    }
  }
}
