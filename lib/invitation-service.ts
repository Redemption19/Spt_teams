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
import { auth, db } from './firebase';
import { Invitation, Workspace, Team } from './types';
import { WorkspaceService } from './workspace-service';
import { TeamService } from './team-service';
import { EmailService } from './email-service';
import { UserService } from './user-service';
import { ActivityService } from './activity-service';

export class InvitationService {
  /**
   * Create a new invitation with enhanced Firebase Auth integration
   */  static async createInvitation(
    invitationData: Omit<Invitation, 'id' | 'createdAt' | 'expiresAt' | 'status' | 'invitedBy'>,
    inviterName?: string
  ): Promise<string> {
    try {
      // Verify current user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to send invitations');
      }      // Verify the inviter has permission to invite to this workspace
      // First check if user is the workspace owner directly
      const workspace = await WorkspaceService.getWorkspace(invitationData.workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      console.log('Workspace ownerId:', workspace.ownerId);
      console.log('Current user ID:', currentUser.uid);
      
      let workspaceMembership: { workspace: Workspace; role: string } | null = null;
      
      // If user is the workspace owner, they have permission
      if (workspace.ownerId === currentUser.uid) {
        workspaceMembership = { workspace, role: 'owner' };
        console.log('User is workspace owner');
        
        // Ensure UserWorkspace relationship exists for the owner
        try {
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(currentUser.uid);
          const existingMembership = userWorkspaces.find(uw => uw.workspace.id === invitationData.workspaceId);
          
          if (!existingMembership) {
            console.log('Creating missing owner relationship for workspace');
            await WorkspaceService.addUserToWorkspace(currentUser.uid, invitationData.workspaceId, 'owner', currentUser.uid);
          }
        } catch (error) {
          console.warn('Warning: Could not verify/create UserWorkspace relationship:', error);
          // Continue anyway since we verified ownership above
        }
      } else {
        // Check if user is a member of the workspace through UserWorkspace relationship
        const userWorkspaces = await WorkspaceService.getUserWorkspaces(currentUser.uid);
        console.log('User workspaces:', userWorkspaces.map(uw => ({ workspaceId: uw.workspace.id, role: uw.role })));
        console.log('Target workspace ID:', invitationData.workspaceId);
        
        workspaceMembership = userWorkspaces.find(uw => uw.workspace.id === invitationData.workspaceId) || null;
        
        if (!workspaceMembership) {
          console.error('User is not a member of the workspace and not the owner');
          throw new Error('User does not have permission to invite to this workspace');
        }
      }      console.log('User role in workspace:', workspaceMembership.role);

      // Final safety check
      if (!workspaceMembership) {
        throw new Error('Unable to verify workspace membership');
      }

      // Check if user is admin/owner to send invitations
      if (!['admin', 'owner'].includes(workspaceMembership.role)) {
        throw new Error('Only admins and owners can send invitations');
      }

      const invitationRef = doc(collection(db, 'invitations'));
      const invitationId = invitationRef.id;
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
      
      const invitation: Invitation = {
        ...invitationData,
        id: invitationId,
        status: 'pending',
        createdAt: new Date(),
        expiresAt,
        invitedBy: currentUser.uid, // Add Firebase Auth user ID
      };

      await setDoc(invitationRef, invitation);
      
      // Log activity
      try {
        await ActivityService.logActivity(
          'invitation_sent',
          'invitation',
          invitationId,
          { 
            targetName: invitation.email,
            role: invitation.role,
            teamId: invitation.teamId,
            teamRole: invitation.teamRole
          },
          invitation.workspaceId,
          currentUser.uid
        );
      } catch (error) {
        console.warn('Warning: Could not log invitation activity:', error);
      }
      
      // Send email notification
      await this.sendInvitationEmail(invitation, inviterName || currentUser.displayName || 'Team Admin');
      
      return invitationId;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }
  /**
   * Get invitation by ID
   */
  static async getInvitation(invitationId: string): Promise<Invitation | null> {
    try {
      const invitationRef = doc(db, 'invitations', invitationId);
      const invitationSnap = await getDoc(invitationRef);
      
      if (invitationSnap.exists()) {
        const data = invitationSnap.data();
        // Convert Firestore Timestamps to JavaScript Dates
        return {
          id: invitationSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt,
        } as Invitation;
      }
      return null;
    } catch (error) {
      console.error('Error fetching invitation:', error);
      throw error;
    }
  }
  /**
   * Get invitations for a workspace
   */
  static async getWorkspaceInvitations(workspaceId: string): Promise<Invitation[]> {
    try {
      const invitationsRef = collection(db, 'invitations');
      const q = query(
        invitationsRef,
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt,
        } as Invitation;
      });
    } catch (error) {
      console.error('Error fetching workspace invitations:', error);
      throw error;
    }
  }
  /**
   * Get pending invitations for an email
   */
  static async getPendingInvitations(email: string): Promise<Invitation[]> {
    try {
      const invitationsRef = collection(db, 'invitations');
      const q = query(
        invitationsRef,
        where('email', '==', email),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt,
        } as Invitation;
      });
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
    }
  }
  /**
   * Accept invitation with Firebase Auth integration
   */
  static async acceptInvitation(invitationId: string): Promise<void> {
    try {
      // Verify current user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to accept invitation');
      }

      const invitation = await this.getInvitation(invitationId);
      if (!invitation || invitation.status !== 'pending') {
        throw new Error('Invalid or expired invitation');
      }

      // Verify email matches
      if (invitation.email !== currentUser.email) {
        throw new Error('Invitation email does not match current user');
      }

      // Check if invitation has expired
      if (new Date() > invitation.expiresAt) {
        await this.updateInvitationStatus(invitationId, 'expired');
        throw new Error('Invitation has expired');
      }

      // Add user to workspace
      await WorkspaceService.addUserToWorkspace(
        currentUser.uid,
        invitation.workspaceId,
        invitation.role,
        invitation.invitedBy
      );

      // Add user to team if specified
      if (invitation.teamId && invitation.teamRole) {
        await TeamService.addUserToTeam(
          currentUser.uid,
          invitation.teamId,
          invitation.teamRole,
          invitation.invitedBy
        );
      }

      // Update invitation status
      await this.updateInvitationStatus(invitationId, 'accepted');
      
      // Log activity
      try {
        await ActivityService.logActivity(
          'invitation_accepted',
          'invitation',
          invitationId,
          { 
            targetName: invitation.email,
            role: invitation.role,
            teamId: invitation.teamId
          },
          invitation.workspaceId,
          currentUser.uid
        );
      } catch (error) {
        console.warn('Warning: Could not log invitation acceptance activity:', error);
      }

      // Send welcome email
      const workspace = await WorkspaceService.getWorkspace(invitation.workspaceId);
      if (workspace) {
        await EmailService.sendWelcomeEmail({
          to_email: currentUser.email!,
          to_name: currentUser.displayName || currentUser.email!.split('@')[0],
          workspace_name: workspace.name,
        });
      }
      
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Decline invitation
   */
  static async declineInvitation(invitationId: string): Promise<void> {
    try {
      await this.updateInvitationStatus(invitationId, 'declined');
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  }

  /**
   * Cancel invitation (by inviter)
   */
  static async cancelInvitation(invitationId: string): Promise<void> {
    try {
      const invitationRef = doc(db, 'invitations', invitationId);
      await deleteDoc(invitationRef);
    } catch (error) {
      console.error('Error canceling invitation:', error);
      throw error;
    }
  }

  /**
   * Update invitation status
   */
  private static async updateInvitationStatus(
    invitationId: string, 
    status: Invitation['status']
  ): Promise<void> {
    try {
      const invitationRef = doc(db, 'invitations', invitationId);
      const updates: Partial<Invitation> = { status };
      
      if (status === 'accepted') {
        updates.acceptedAt = new Date();
      }
      
      await updateDoc(invitationRef, updates);
    } catch (error) {
      console.error('Error updating invitation status:', error);
      throw error;
    }
  }
  /**
   * Send invitation email using EmailJS
   */
  private static async sendInvitationEmail(invitation: Invitation, inviterName: string): Promise<void> {
    try {
      // Get workspace and team details for email
      const workspace = await WorkspaceService.getWorkspace(invitation.workspaceId);
      let team = null;
      if (invitation.teamId) {
        team = await TeamService.getTeam(invitation.teamId);
      }

      if (!workspace) {
        console.error('Workspace not found for invitation');
        return;
      }

      // Create invitation link
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const invitationLink = `${baseUrl}/invite?token=${invitation.id}`;

      // Format expiration date
      const expiresAt = invitation.expiresAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });      // Send email using EmailJS
      const emailSent = await EmailService.sendInvitationEmail({
        to_email: invitation.email,
        to_name: invitation.email.split('@')[0], // Use email prefix as name fallback
        from_name: inviterName,
        workspace_name: workspace.name,
        role: invitation.role,
        team_name: team?.name,
        invitation_link: invitationLink,
        expires_at: expiresAt,
        company_name: 'Standard Pensions Trust',
        support_email: 'support@standardpensionstrust.com',
      });

      if (emailSent) {
        console.log('Invitation email sent successfully to:', invitation.email);
      } else {
        console.warn('Failed to send invitation email to:', invitation.email);
      }
      
    } catch (error) {
      console.error('Error sending invitation email:', error);
      // Don't throw error here as the invitation was created successfully
    }
  }  /**
   * Validate invitation token with enhanced security
   */
  static async validateInvitationToken(token: string): Promise<Invitation | null> {
    try {
      console.log('Validating invitation token:', token);
      
      // In a production app, you might want to use JWT tokens
      // For now, we'll use the invitation ID as the token
      const invitation = await this.getInvitation(token);
      
      console.log('Retrieved invitation:', invitation);
      
      if (!invitation) {
        console.log('Invitation not found');
        return null;
      }
      
      if (invitation.status !== 'pending') {
        console.log('Invitation status is not pending:', invitation.status);
        return null;
      }
      
      const now = new Date();
      const expiresAt = invitation.expiresAt;
      console.log('Current time:', now);
      console.log('Expires at:', expiresAt);
      console.log('Is expired?', now > expiresAt);
      
      if (now > expiresAt) {
        console.log('Invitation has expired, updating status');
        await this.updateInvitationStatus(token, 'expired');
        return null;
      }
      
      console.log('Invitation is valid');
      return invitation;
    } catch (error) {
      console.error('Error validating invitation token:', error);
      return null;
    }
  }

  /**
   * Generate secure invitation token (for future implementation)
   */
  static generateInvitationToken(invitationId: string, email: string): string {
    // In production, you'd use a proper JWT library like 'jsonwebtoken'
    // For now, we'll just use the invitation ID
    return invitationId;
  }
  /**
   * Resend invitation email
   */
  static async resendInvitation(invitationId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to resend invitations');
      }

      const invitation = await this.getInvitation(invitationId);
      if (!invitation || invitation.status !== 'pending') {
        throw new Error('Invalid invitation');
      }

      // Verify user has permission to resend
      const userWorkspaces = await WorkspaceService.getUserWorkspaces(currentUser.uid);
      const workspaceMembership = userWorkspaces.find(uw => uw.workspace.id === invitation.workspaceId);
      
      if (!workspaceMembership || !['admin', 'owner'].includes(workspaceMembership.role)) {
        throw new Error('Only admins and owners can resend invitations');
      }

      // Extend expiration date
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);
      
      await updateDoc(doc(db, 'invitations', invitationId), {
        expiresAt: newExpiresAt,
      });

      // Resend email
      await this.sendInvitationEmail(invitation, currentUser.displayName || 'Team Admin');
      
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }

  /**
   * Mark invitation as used (when user registers with invitation token)
   */
  static async markInvitationAsUsed(token: string): Promise<void> {
    try {
      console.log('Marking invitation as used:', token);
      
      // First, get the invitation to get the details
      const invitation = await this.getInvitation(token);
      if (!invitation || invitation.status !== 'pending') {
        console.log('Invitation not found or not pending:', invitation?.status);
        return;
      }
      
      // Accept the invitation (this adds user to workspace)
      await this.acceptInvitation(token);
      
      console.log('Invitation marked as used and accepted');
    } catch (error) {
      console.error('Error marking invitation as used:', error);
      throw error;
    }
  }
}
