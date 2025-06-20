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
import { Team, TeamUser } from './types';
import { sortByDateDesc } from './firestore-utils';
import { BranchService } from './branch-service';
import { WorkspaceService } from './workspace-service';
import { ActivityService } from './activity-service';
import { auth } from './firebase';

export class TeamService {
    /**
   * Create a new team
   */
  static async createTeam(
    teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<string> {
    try {
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
            regionId: team.regionId
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
      
      // Log activity
      try {
        const team = await this.getTeam(teamId);
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
}
